import mongoose from 'mongoose';
import {
  CATEGORIES,
  type AdminCategoryCount,
  type AdminOfferDTO,
  type AdminOffersQuery,
  type AdminOffersResponse,
  type AdminOverview,
  type AdminUserDTO,
  type AdminUsersQuery,
  type AdminUsersResponse,
  type AdminWalletsResponse,
  type PayoutRequestDTO,
} from '@offerbuzz/shared';
import { User, type UserDoc } from '../../models/User';
import { Offer } from '../../models/Offer';
import { toOfferDTO } from '../offers/offers.routes';
import { Subscription } from '../../models/Subscription';
import { PayoutRequest } from '../../models/PayoutRequest';
import { RefreshToken } from '../../models/RefreshToken';
import { WalletEntry } from '../../models/WalletEntry';
import { getSettings } from '../../models/Setting';
import { HttpError, badRequest, notFound } from '../../utils/errors';
import { calcBalances, creditReferrerForSubscription, toPayoutDTO } from '../wallet/wallet.service';

const PAGE_SIZE = 25;
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function addMonths(from: Date, n: number): Date {
  const d = new Date(from);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d;
}

export async function overview(): Promise<AdminOverview> {
  const now = new Date();
  const [vendors, subscribed, intermediaries, pendingApproval, customers, pendingOffers, pendingPayouts] = await Promise.all([
    User.countDocuments({ role: 'merchant' }),
    Subscription.countDocuments({ paidUntil: { $gt: now } }),
    User.countDocuments({ role: 'intermediary' }),
    User.countDocuments({ role: 'intermediary', status: 'pending' }),
    User.countDocuments({ role: 'customer' }),
    Offer.countDocuments({ status: 'pending' }),
    PayoutRequest.find({ status: 'pending' }).select('credits'),
  ]);
  return {
    vendors: { total: vendors, subscribed, unsubscribed: Math.max(0, vendors - subscribed) },
    intermediaries: { total: intermediaries, pendingApproval },
    customers,
    pendingOffers,
    payouts: { pending: pendingPayouts.length, pendingCredits: pendingPayouts.reduce((n, p) => n + p.credits, 0) },
  };
}

export async function listUsers(q: AdminUsersQuery): Promise<AdminUsersResponse> {
  const filter: Record<string, unknown> = {};
  if (q.role) filter.role = q.role;
  if (q.status) filter.status = q.status;
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { shopName: rx }, { phone: rx }];
  }
  const [docs, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((q.page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE),
    User.countDocuments(filter),
  ]);
  const ids = docs.map((u) => u._id);
  const referrerIds = docs.map((u) => u.referredBy).filter(Boolean);
  const [subs, referrers] = await Promise.all([
    Subscription.find({ merchantId: { $in: ids } }),
    User.find({ _id: { $in: referrerIds } }).select('name email'),
  ]);
  const paidUntil = new Map(subs.map((s) => [String(s.merchantId), s.paidUntil]));
  const refName = new Map(referrers.map((r) => [String(r._id), r.name || r.email || 'Intermediary']));
  const now = Date.now();
  const users: AdminUserDTO[] = docs.map((u: UserDoc & { createdAt?: Date }) => {
    const until = paidUntil.get(String(u._id));
    return {
      id: String(u._id),
      name: u.name ?? undefined,
      email: u.email ?? undefined,
      phone: u.phone ?? undefined,
      role: u.role,
      status: u.status,
      shopName: u.shopName ?? undefined,
      city: u.city ?? undefined,
      referredBy: u.referredBy ? refName.get(String(u.referredBy)) : undefined,
      ...(u.role === 'merchant'
        ? { paidUntil: until?.toISOString(), subscribed: Boolean(until && until.getTime() > now) }
        : {}),
      createdAt: (u.createdAt ?? new Date(0)).toISOString(),
    };
  });
  return { users, total, page: q.page, pageSize: PAGE_SIZE };
}

/** Approve (or unblock) = active, block = blocked. Admins cannot be changed here, and nobody can block themselves. */
export async function setUserStatus(adminId: string, userId: string, status: 'active' | 'blocked') {
  if (!mongoose.isValidObjectId(userId)) throw notFound('User not found');
  const user = await User.findById(userId);
  if (!user) throw notFound('User not found');
  if (user.role === 'admin' || String(user._id) === adminId) throw new HttpError(403, 'FORBIDDEN', 'This account cannot be changed here');
  user.status = status;
  await user.save();
  // a blocked person is signed out everywhere straight away
  if (status === 'blocked') await RefreshToken.updateMany({ userId: user._id, revokedAt: { $exists: false } }, { revokedAt: new Date() });
  return user;
}

/**
 * Records that a vendor paid for `months` of the plan (until a payment gateway calls this itself). Extends the paid
 * period and credits the vendor's referrer once per month.
 */
export async function recordSubscriptionPayment(merchantId: string, months: number) {
  if (!mongoose.isValidObjectId(merchantId)) throw notFound('Vendor not found');
  const vendor = await User.findById(merchantId).select('role');
  if (!vendor) throw notFound('Vendor not found');
  if (vendor.role !== 'merchant') throw badRequest('Only vendors have a subscription', 'NOT_A_VENDOR');
  const now = new Date();
  const existing = await Subscription.findOne({ merchantId });
  const start = existing && existing.paidUntil > now ? existing.paidUntil : now;
  const paidUntil = addMonths(start, months);
  await Subscription.findOneAndUpdate({ merchantId }, { paidUntil, lastPaidAt: now }, { upsert: true });
  let credited = 0;
  for (let i = 0; i < months; i++) {
    const period = addMonths(start, i).toISOString().slice(0, 7);
    if (await creditReferrerForSubscription(merchantId, period)) credited += 1;
  }
  return { paidUntil: paidUntil.toISOString(), referrerCredited: credited > 0 };
}

export async function walletsOverview(): Promise<AdminWalletsResponse> {
  const [settings, intermediaries, allPayouts] = await Promise.all([
    getSettings(),
    User.find({ role: 'intermediary' }).select('name email status').sort({ createdAt: -1 }).limit(500),
    PayoutRequest.find({}).sort({ createdAt: -1 }).limit(200),
  ]);
  const ids = intermediaries.map((u) => u._id);
  const [entries, shopCounts] = await Promise.all([
    WalletEntry.find({ intermediaryId: { $in: ids } }),
    User.aggregate<{ _id: mongoose.Types.ObjectId; n: number }>([
      { $match: { referredBy: { $in: ids } } },
      { $group: { _id: '$referredBy', n: { $sum: 1 } } },
    ]),
  ]);
  const byInter = new Map<string, typeof entries>();
  for (const e of entries) {
    const k = String(e.intermediaryId);
    byInter.set(k, [...(byInter.get(k) ?? []), e]);
  }
  const shops = new Map(shopCounts.map((s) => [String(s._id), s.n]));
  const requested = new Map<string, number>();
  for (const p of allPayouts) if (p.status === 'pending') requested.set(String(p.intermediaryId), (requested.get(String(p.intermediaryId)) ?? 0) + p.credits);

  const names = new Map(intermediaries.map((u) => [String(u._id), u.name || u.email || 'Intermediary']));
  const payouts: PayoutRequestDTO[] = allPayouts.map((p) => toPayoutDTO(p, names.get(String(p.intermediaryId)) ?? 'Intermediary'));

  return {
    payoutThreshold: settings.payoutThreshold,
    wallets: intermediaries
      .map((u) => {
        const b = calcBalances(byInter.get(String(u._id)) ?? []);
        return {
          id: String(u._id),
          name: u.name || u.email || 'Intermediary',
          email: u.email ?? undefined,
          status: u.status,
          balance: b.balance,
          available: b.available,
          onHold: b.onHold,
          requested: requested.get(String(u._id)) ?? 0,
          totalEarned: b.earned,
          shops: shops.get(String(u._id)) ?? 0,
        };
      })
      .sort((a, b) => b.balance - a.balance),
    payouts,
  };
}

// ---- Offers -------------------------------------------------------------------------------------

const startOfToday = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/** Approved and inside its start and end dates today. */
const runningFilter = () => ({ status: 'active', startsAt: { $lte: new Date() }, endsAt: { $gte: startOfToday() } });

export async function offersOverview(q: AdminOffersQuery): Promise<AdminOffersResponse> {
  const [runningCounts, pendingCounts] = await Promise.all([
    Offer.aggregate<{ _id: string; n: number }>([{ $match: runningFilter() }, { $group: { _id: '$category', n: { $sum: 1 } } }]),
    Offer.aggregate<{ _id: string; n: number }>([{ $match: { status: 'pending' } }, { $group: { _id: '$category', n: { $sum: 1 } } }]),
  ]);
  const running = new Map(runningCounts.map((c) => [c._id, c.n]));
  const pending = new Map(pendingCounts.map((c) => [c._id, c.n]));
  const categories: AdminCategoryCount[] = CATEGORIES.map((category) => ({
    category,
    running: running.get(category) ?? 0,
    pending: pending.get(category) ?? 0,
  })).sort((a, b) => b.running - a.running || b.pending - a.pending || a.category.localeCompare(b.category));

  const filter: Record<string, unknown> = q.view === 'running' ? runningFilter() : q.view === 'pending' ? { status: 'pending' } : {};
  if (q.category) filter.category = q.category;
  const docs = await Offer.find(filter).sort({ createdAt: -1 }).limit(200);
  const vendors = await User.find({ _id: { $in: docs.map((o) => o.merchantId) } }).select('name email shopName');
  const vendorOf = new Map(vendors.map((v) => [String(v._id), v]));
  const offers: AdminOfferDTO[] = docs.map((o) => {
    const v = vendorOf.get(String(o.merchantId));
    return { ...toOfferDTO(o), vendor: v?.shopName || v?.name || v?.email || 'Vendor', vendorEmail: v?.email ?? undefined };
  });
  return { categories, offers };
}

/** Approve makes the offer live (from its start date); reject keeps it hidden. */
export async function setOfferStatus(offerId: string, status: 'active' | 'rejected') {
  if (!mongoose.isValidObjectId(offerId)) throw notFound('Offer not found');
  const offer = await Offer.findByIdAndUpdate(offerId, { status }, { new: true });
  if (!offer) throw notFound('Offer not found');
  return offer;
}
