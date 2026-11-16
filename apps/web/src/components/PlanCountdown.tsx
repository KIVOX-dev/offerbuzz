import Link from 'next/link';
import { MERCHANT_PLANS, type SubscriptionDTO } from '@offerbuzz/shared';

const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * The merchant's plan at a glance: days left counting down on a bar, the end date, and this month's offers.
 * `compact` drops the heading and the links, for the dashboard.
 */
export function PlanCountdown({ sub, compact = false }: { sub: SubscriptionDTO; compact?: boolean }) {
  const planName = sub.plan ? MERCHANT_PLANS[sub.plan].name : 'Basic';

  if (!sub.paidUntil || !sub.active) {
    return (
      <section aria-label="Plan" className="surface border-l-4 border-amber-500 p-4">
        <p className="text-small font-semibold uppercase text-muted">{compact ? 'Plan' : 'Current plan'}</p>
        <p className="text-section font-bold">{sub.paidUntil ? 'Your plan has ended' : 'Not subscribed'}</p>
        <p className="text-small text-amber-800">
          {sub.paidUntil
            ? `It ended on ${fmt(sub.paidUntil)}. Renew to post offers again. Offers stay visible for ${sub.graceDays} more days after the end date, then are hidden.`
            : 'You need a paid plan to post offers.'}
        </p>
        <Link href="/merchant/subscription" className="btn-primary mt-3 inline-flex">{sub.paidUntil ? 'Renew my plan' : 'Choose a plan'}</Link>
      </section>
    );
  }

  const left = sub.daysLeft;
  const pct = sub.totalDays > 0 ? Math.min(100, Math.max(0, Math.round((left / sub.totalDays) * 100))) : 0;
  const soon = left <= 2;
  const low = left <= 7;
  const q = sub.offerQuota;
  return (
    <section aria-label="Plan" className={`surface border-l-4 p-4 ${soon ? 'border-red-500' : low ? 'border-amber-500' : 'border-green-600'}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div>
          <p className="text-small font-semibold uppercase text-muted">{compact ? 'Plan' : 'Current plan'}</p>
          <p className="text-section font-bold">{planName}</p>
        </div>
        <p className={`text-right ${soon ? 'text-red-700' : low ? 'text-amber-700' : 'text-green-700'}`}>
          <span className="text-[28px] font-extrabold leading-none">{left}</span>
          <span className="ml-1 text-small font-semibold">day{left === 1 ? '' : 's'} left</span>
        </p>
      </div>

      <div
        role="progressbar"
        aria-label="Days left on your plan"
        aria-valuemin={0}
        aria-valuemax={sub.totalDays}
        aria-valuenow={left}
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-purple-100"
      >
        <div className={`h-full rounded-full ${soon ? 'bg-red-500' : low ? 'bg-amber-500' : 'bg-green-600'}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-small text-muted">Active until {fmt(sub.paidUntil)}</p>

      <p className="mt-2 text-small">
        <strong>Offers this month:</strong> {q.used} of {q.limit} used
        {q.resetsAt ? ` (${q.remaining > 0 ? 'resets' : 'you can post again from'} ${fmt(q.resetsAt)})` : ''}
        {!compact && q.remaining > 0 && <> · <Link href="/merchant/offers/new" className="font-semibold text-purple-700 underline">Post an offer</Link></>}
      </p>

      {low && (
        <p className="mt-2 text-small font-semibold text-red-700">
          Your plan ends {left <= 1 ? 'tomorrow' : `in ${left} days`}. <Link href="/merchant/subscription" className="underline">Renew now</Link> to keep posting.
        </p>
      )}
    </section>
  );
}
