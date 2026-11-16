import mongoose from 'mongoose';
import { OFFERS_PER_MONTH, planAmount, type MerchantPlan } from '@offerbuzz/shared';
import { Subscription, type SubscriptionDoc } from '../../models/Subscription';
import { User } from '../../models/User';
import { HttpError, badRequest, notFound } from '../../utils/errors';
import { addMonths } from '../../utils/months';
import { creditReferrerForSubscription } from '../wallet/wallet.service';
import { sendSubscriptionEmails } from '../../services/planEmails';

/** The month window (periodStart + k months) that `now` falls in, never running past the paid-until date. */
export function currentWindow(periodStart: Date, paidUntil: Date, now = new Date()) {
  let k = 0;
  while (addMonths(periodStart, k + 1) <= now) k += 1;
  const start = addMonths(periodStart, k);
  const next = addMonths(periodStart, k + 1);
  return { start, end: next < paidUntil ? next : paidUntil };
}

export const isActive = (sub: Pick<SubscriptionDoc, 'paidUntil'> | null | undefined, now = new Date()) => Boolean(sub && sub.paidUntil > now);

/** The days counter: whole days left (a part day counts as a day), and the length of the current paid run. */
export function countdown(sub: SubscriptionDoc | null | undefined, now = new Date()) {
  if (!sub) return { daysLeft: 0, totalDays: 0 };
  const DAY = 86_400_000;
  const daysLeft = isActive(sub, now) ? Math.ceil((sub.paidUntil.getTime() - now.getTime()) / DAY) : 0;
  const from = sub.periodStart ?? sub.lastPaidAt;
  return { daysLeft, totalDays: Math.max(daysLeft, Math.round((sub.paidUntil.getTime() - from.getTime()) / DAY)) };
}

/** How many of this month's offers are used. Safe on a subscription that has never posted. */
export function quotaOf(sub: SubscriptionDoc | null | undefined, now = new Date()) {
  const limit = OFFERS_PER_MONTH;
  if (!sub || !isActive(sub, now)) return { limit, used: 0, remaining: 0, resetsAt: undefined as string | undefined };
  const w = currentWindow(sub.periodStart ?? sub.lastPaidAt, sub.paidUntil, now);
  const used = sub.quotaWindowStart && sub.quotaWindowStart.getTime() === w.start.getTime() ? (sub.quotaUsed ?? 0) : 0;
  return { limit, used, remaining: Math.max(0, limit - used), resetsAt: w.end.toISOString() as string | undefined };
}

/**
 * Takes one offer slot for this month, or throws. A merchant with no active plan cannot post at all, and an active one
 * gets OFFERS_PER_MONTH per paid month. Atomic, so two posts at once cannot both take the last slot.
 * Returns a function that gives the slot back if saving the offer then fails.
 */
export async function takeOfferSlot(merchantId: string): Promise<() => Promise<void>> {
  const now = new Date();
  const sub = await Subscription.findOne({ merchantId });
  if (!sub || !isActive(sub, now)) {
    throw new HttpError(402, 'PLAN_REQUIRED', 'Choose and pay for a plan to post offers');
  }
  const w = currentWindow(sub.periodStart ?? sub.lastPaidAt, sub.paidUntil, now);
  // a new month window starts the counter again (the filter makes sure only one request resets it)
  if (!sub.quotaWindowStart || sub.quotaWindowStart.getTime() !== w.start.getTime()) {
    await Subscription.updateOne(
      { _id: sub._id, quotaWindowStart: sub.quotaWindowStart ?? { $exists: false } },
      { quotaWindowStart: w.start, quotaUsed: 0 },
    );
  }
  const taken = await Subscription.findOneAndUpdate(
    { _id: sub._id, quotaWindowStart: w.start, quotaUsed: { $lt: OFFERS_PER_MONTH } },
    { $inc: { quotaUsed: 1 } },
  );
  if (!taken) {
    const when = w.end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
    throw new HttpError(403, 'OFFER_LIMIT_REACHED', `You have used your ${OFFERS_PER_MONTH} offers for this month. You can post again from ${when}.`);
  }
  return async () => {
    await Subscription.updateOne({ _id: sub._id, quotaWindowStart: w.start, quotaUsed: { $gt: 0 } }, { $inc: { quotaUsed: -1 } });
  };
}

/**
 * A payment for `months` of `plan` has been received (Razorpay, or an admin recording it). Extends the paid period from
 * the old end date if still active, else from now, and credits the merchant's referrer once per month.
 */
export async function extendSubscription(merchantId: string, months: number, plan: MerchantPlan = 'basic', paymentRef = 'Recorded by OfferBuzz') {
  if (!mongoose.isValidObjectId(merchantId)) throw notFound('Merchant not found');
  const vendor = await User.findById(merchantId).select('role');
  if (!vendor) throw notFound('Merchant not found');
  if (vendor.role !== 'merchant') throw badRequest('Only merchants have a subscription', 'NOT_A_VENDOR');
  const now = new Date();
  const existing = await Subscription.findOne({ merchantId });
  const stillActive = Boolean(existing && existing.paidUntil > now);
  const start = stillActive && existing ? existing.paidUntil : now;
  const paidUntil = addMonths(start, months);
  await Subscription.findOneAndUpdate(
    { merchantId },
    {
      paidUntil,
      lastPaidAt: now,
      plan,
      // renewing early keeps the month windows going; coming back after a lapse starts fresh
      periodStart: stillActive && existing ? (existing.periodStart ?? existing.lastPaidAt) : now,
    },
    { upsert: true },
  );
  // what the merchant paid, spread evenly over the months: the partner earns the commission % of each month's share
  const amount = planAmount(plan, months);
  const perMonth = amount / months;
  let credited = 0;
  for (let i = 0; i < months; i++) {
    const period = addMonths(start, i).toISOString().slice(0, 7);
    if (await creditReferrerForSubscription(merchantId, period, perMonth)) credited += 1;
  }
  // thank the merchant and tell the team; in the background, so a slow mail server never holds up the payment
  void sendSubscriptionEmails({ merchantId, plan, months, amount, start, paidUntil, paymentRef });
  return { paidUntil: paidUntil.toISOString(), plan, amount, referrerCredited: credited > 0 };
}
