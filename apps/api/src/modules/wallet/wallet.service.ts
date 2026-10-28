import type { PayoutRequestDTO, WalletEntryDTO, WalletResponse } from '@offerbuzz/shared';
import { User } from '../../models/User';
import { WalletEntry, type WalletEntryDoc } from '../../models/WalletEntry';
import { PayoutRequest, type PayoutRequestDoc } from '../../models/PayoutRequest';
import { getSettings } from '../../models/Setting';
import { HttpError, badRequest, notFound } from '../../utils/errors';

const DAY = 86_400_000;
export const currentPeriod = (d = new Date()) => d.toISOString().slice(0, 7);

/**
 * Called when a referred shop's subscription payment succeeds (the payment webhook, Phase 4, or the admin
 * recording a payment). Pays the shop's intermediary the configured commission, held for `holdDays`. Safe to call
 * twice for the same shop and month: the second call changes nothing and returns null. Returns null when the shop
 * has no referrer.
 */
export async function creditReferrerForSubscription(merchantId: string, period = currentPeriod()) {
  const merchant = await User.findById(merchantId).select('referredBy');
  if (!merchant?.referredBy) return null;
  const settings = await getSettings();
  try {
    return await WalletEntry.create({
      intermediaryId: merchant.referredBy,
      merchantId: merchant._id,
      kind: 'credit',
      reason: 'subscription',
      credits: settings.commissionCredits,
      period,
      availableAt: new Date(Date.now() + settings.holdDays * DAY),
    });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) return null;
    throw err;
  }
}

/** Balances come from the ledger rows only. Credits are rupees. */
export function calcBalances(entries: Pick<WalletEntryDoc, 'kind' | 'credits' | 'availableAt'>[], now = Date.now()) {
  let earned = 0;
  let spent = 0;
  let released = 0;
  for (const e of entries) {
    if (e.kind === 'debit') spent += e.credits;
    else {
      earned += e.credits;
      if (e.availableAt.getTime() <= now) released += e.credits;
    }
  }
  const balance = earned - spent;
  const available = Math.max(0, Math.min(balance, released - spent));
  return { earned, balance, available, onHold: balance - available };
}

const toEntryDTO = (e: WalletEntryDoc, shops: Map<string, string>): WalletEntryDTO => ({
  id: String(e._id),
  kind: e.kind,
  reason: e.reason,
  credits: e.credits,
  period: e.period ?? undefined,
  shop: e.merchantId ? shops.get(String(e.merchantId)) : undefined,
  availableAt: e.availableAt.toISOString(),
  createdAt: e.createdAt.toISOString(),
});

export const toPayoutDTO = (p: PayoutRequestDoc, intermediary: string): PayoutRequestDTO => ({
  id: String(p._id),
  intermediaryId: String(p.intermediaryId),
  intermediary,
  credits: p.credits,
  status: p.status,
  note: p.note ?? undefined,
  requestedAt: p.createdAt.toISOString(),
  processedAt: p.processedAt?.toISOString(),
});

async function pendingRequested(intermediaryId: string): Promise<number> {
  const pending = await PayoutRequest.find({ intermediaryId, status: 'pending' }).select('credits');
  return pending.reduce((n, p) => n + p.credits, 0);
}

export async function getWallet(intermediaryId: string): Promise<WalletResponse> {
  const [entries, settings, referred, requested] = await Promise.all([
    WalletEntry.find({ intermediaryId }).sort({ createdAt: -1 }),
    getSettings(),
    User.find({ referredBy: intermediaryId }).select('name shopName createdAt').sort({ createdAt: -1 }).limit(200),
    pendingRequested(intermediaryId),
  ]);
  const b = calcBalances(entries);
  const shops = new Map(referred.map((u) => [String(u._id), u.shopName || u.name || 'Shop']));
  return {
    balance: b.balance,
    available: b.available,
    onHold: b.onHold,
    totalEarned: b.earned,
    payoutThreshold: settings.payoutThreshold,
    holdDays: settings.holdDays,
    commissionCredits: settings.commissionCredits,
    requested,
    requestable: Math.max(0, b.available - requested),
    shops: referred.map((u) => ({ id: String(u._id), name: u.shopName || u.name || 'Shop', joinedAt: u.createdAt.toISOString() })),
    entries: entries.slice(0, 50).map((e) => toEntryDTO(e, shops)),
  };
}

// ---- Payouts -----------------------------------------------------------------------------------

/** The intermediary asks to be paid everything that is available. Needs the configured minimum, and an approved account. */
export async function requestPayout(intermediaryId: string) {
  const user = await User.findById(intermediaryId).select('status role');
  if (!user || user.role !== 'intermediary') throw notFound('Account not found');
  if (user.status !== 'active') throw new HttpError(403, 'NOT_APPROVED', 'Your account must be approved before you can request a payout');
  const wallet = await getWallet(intermediaryId);
  if (wallet.requested > 0) throw new HttpError(409, 'PAYOUT_PENDING', 'You already have a payout request waiting');
  if (wallet.requestable < wallet.payoutThreshold) {
    throw badRequest(`You need at least ${wallet.payoutThreshold} credits available to request a payout`, 'PAYOUT_MINIMUM');
  }
  try {
    return await PayoutRequest.create({ intermediaryId, credits: wallet.requestable });
  } catch (err) {
    // the unique index allows one waiting request per intermediary, so a double click cannot create two
    if ((err as { code?: number }).code === 11000) throw new HttpError(409, 'PAYOUT_PENDING', 'You already have a payout request waiting');
    throw err;
  }
}

/** Admin pays a request (outside the app, e.g. bank/UPI) and records it: the wallet is debited. */
export async function payPayout(id: string, adminId: string) {
  const claimed = await PayoutRequest.findOneAndUpdate(
    { _id: id, status: 'pending' },
    { status: 'paid', processedAt: new Date(), processedBy: adminId },
    { new: true },
  );
  if (!claimed) throw new HttpError(409, 'PAYOUT_NOT_PENDING', 'This request is not waiting for payment');
  const entries = await WalletEntry.find({ intermediaryId: claimed.intermediaryId });
  if (calcBalances(entries).available < claimed.credits) {
    await PayoutRequest.updateOne({ _id: claimed._id }, { status: 'pending', $unset: { processedAt: 1, processedBy: 1 } });
    throw new HttpError(409, 'INSUFFICIENT_AVAILABLE', 'The available balance is now lower than this request');
  }
  await WalletEntry.create({
    intermediaryId: claimed.intermediaryId,
    kind: 'debit',
    reason: 'payout',
    credits: claimed.credits,
    availableAt: new Date(),
  });
  return claimed;
}

export async function rejectPayout(id: string, adminId: string, note?: string) {
  const rejected = await PayoutRequest.findOneAndUpdate(
    { _id: id, status: 'pending' },
    { status: 'rejected', processedAt: new Date(), processedBy: adminId, ...(note ? { note } : {}) },
    { new: true },
  );
  if (!rejected) throw new HttpError(409, 'PAYOUT_NOT_PENDING', 'This request is not waiting for payment');
  return rejected;
}
