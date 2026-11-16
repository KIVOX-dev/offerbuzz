import { MERCHANT_PLANS, OFFERS_PER_MONTH, type MerchantPlan } from '@offerbuzz/shared';
import { env } from '../config/env';
import { BRAND } from '../emails/layout';
import { Subscription } from '../models/Subscription';
import { User } from '../models/User';
import { sendTemplateEmail } from './brevo';

const DAY_MS = 86_400_000;
/** Merchants are reminded this many days before their plan ends. */
export const PLAN_NOTICE_DAYS = 2;
const CHECK_EVERY_MS = 60 * 60 * 1000;

const IST = 'Asia/Kolkata';
const fmtDate = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: IST });
const fmtDateTime = (d: Date) => d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: IST });
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * After a payment: a thank you with the plan details to the merchant, and the same facts (plus who they are) to the
 * OfferBuzz team inbox. Never throws, because the plan is already active and a failed email must not undo that.
 */
export async function sendSubscriptionEmails(input: {
  merchantId: string;
  plan: MerchantPlan;
  months: number;
  amount: number;
  start: Date;
  paidUntil: Date;
  paymentRef: string;
}): Promise<void> {
  try {
    const u = await User.findById(input.merchantId).select('name shopName email phone city');
    if (!u) return;
    const planName = MERCHANT_PLANS[input.plan].name;
    const common = {
      planName,
      months: plural(input.months, 'month'),
      amount: String(input.amount),
      startDate: fmtDate(input.start),
      endDate: fmtDate(input.paidUntil),
      offersPerMonth: String(OFFERS_PER_MONTH),
      totalOffers: String(OFFERS_PER_MONTH * input.months),
      paymentId: input.paymentRef,
    };
    const jobs: Promise<unknown>[] = [];
    if (u.email) {
      jobs.push(sendTemplateEmail(u.email, 'plan-subscribed', { ...common, name: u.name || u.shopName || 'there', url: `${BRAND.siteUrl}/merchant/offers/new` }));
    }
    const team = env().ADMIN_NOTIFY_EMAIL;
    if (team) {
      jobs.push(
        sendTemplateEmail(team, 'plan-subscribed-team', {
          ...common,
          merchantName: u.name || '-',
          shopName: u.shopName || '-',
          merchantEmail: u.email || '-',
          merchantPhone: u.phone || '-',
          city: u.city || '-',
          paidAt: fmtDateTime(new Date()),
        }),
      );
    }
    for (const r of await Promise.allSettled(jobs)) {
      if (r.status === 'rejected') console.error('Subscription email failed:', (r.reason as Error).message);
    }
  } catch (err) {
    console.error('Subscription emails failed:', (err as Error).message);
  }
}

/**
 * Emails every merchant whose plan ends within PLAN_NOTICE_DAYS. Each end date is noticed once: the date is stored
 * (endingNoticeFor), so renewing, which moves the end date, makes the merchant eligible again for the next one.
 * A failed send is un-marked so the next run tries again. Returns how many were sent.
 */
export async function notifyEndingPlans(now = new Date()): Promise<number> {
  const subs = await Subscription.find({ paidUntil: { $gt: now, $lte: new Date(now.getTime() + PLAN_NOTICE_DAYS * DAY_MS) } }).limit(500);
  let sent = 0;
  for (const s of subs) {
    if (s.endingNoticeFor && s.endingNoticeFor.getTime() === s.paidUntil.getTime()) continue;
    // claim it first so two servers never send twice
    const claimed = await Subscription.findOneAndUpdate(
      { _id: s._id, paidUntil: s.paidUntil, endingNoticeFor: { $ne: s.paidUntil } },
      { endingNoticeFor: s.paidUntil },
    );
    if (!claimed) continue;
    try {
      const u = await User.findById(s.merchantId).select('name shopName email');
      if (!u?.email) continue; // phone-only accounts have no address to write to
      const daysLeft = Math.max(1, Math.ceil((s.paidUntil.getTime() - now.getTime()) / DAY_MS));
      await sendTemplateEmail(u.email, 'plan-ending-soon', {
        name: u.name || u.shopName || 'there',
        planName: MERCHANT_PLANS[s.plan ?? 'basic'].name,
        endDate: fmtDate(s.paidUntil),
        daysLeft: plural(daysLeft, 'day'),
        url: `${BRAND.siteUrl}/merchant/subscription`,
      });
      sent++;
    } catch (err) {
      console.error(`Plan reminder for ${s._id} failed:`, (err as Error).message);
      await Subscription.updateOne({ _id: s._id, endingNoticeFor: s.paidUntil }, { $unset: { endingNoticeFor: 1 } });
    }
  }
  return sent;
}

/** Runs the check shortly after boot and then hourly. The timer never keeps the process alive on its own. */
export function startPlanReminderJob(): () => void {
  const run = () => notifyEndingPlans().catch((err) => console.error('Plan reminder check failed:', err.message));
  const first = setTimeout(run, 90_000);
  const every = setInterval(run, CHECK_EVERY_MS);
  first.unref();
  every.unref();
  return () => {
    clearTimeout(first);
    clearInterval(every);
  };
}
