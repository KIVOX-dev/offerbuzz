'use client';

import { useEffect, useState } from 'react';
import { LONG_TERM_DISCOUNT_PERCENT, LONG_TERM_MIN_MONTHS, MERCHANT_PLANS, MERCHANT_PLAN_KEYS, planAmount, type MerchantPlan, type SubscriptionDTO } from '@offerbuzz/shared';
import { Spinner } from '@/components/PageLoader';
import { getMySubscription } from '@/lib/api';

const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const daysLeft = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);

// brand colours only: soft purple, solid purple, and the dark hero purple with the yellow accent
const LOOK: Record<MerchantPlan, { head: string; ring: string; button: string }> = {
  basic: { head: 'bg-purple-100 text-purple-900', ring: 'border-purple-200', button: 'btn-outline' },
  premium: { head: 'bg-purple-700 text-white', ring: 'border-purple-700', button: 'btn-primary' },
  featured: { head: 'bg-hero text-accent', ring: 'border-accent', button: 'btn-accent' },
};
const INCLUDES: Record<MerchantPlan, string[]> = {
  basic: ['Offer published on OfferBuzz.co for 30 days'],
  premium: ['Offer published on OfferBuzz.co', 'Advertisement on the Dina Idhigai print and digital newspaper'],
  featured: [
    'Offer published on OfferBuzz.co',
    'Ads on the Dina Idhigai print and digital newspaper',
    'Digital newscard strip ads',
    'Social media promotion',
    'Ads on the E-Behind digital magazine',
  ],
};

/** Payment is arranged with the team for now; the button opens WhatsApp with the plan already written. */
const payLink = (plan: MerchantPlan, months: number) =>
  `https://wa.me/919345975747?text=${encodeURIComponent(
    `Hi OfferBuzz, I want to subscribe to the ${MERCHANT_PLANS[plan].name} plan for ${months} month${months > 1 ? 's' : ''} (Rs ${planAmount(plan, months)}).`,
  )}`;

export default function MerchantSubscription() {
  const [sub, setSub] = useState<SubscriptionDTO>();
  const [error, setError] = useState('');
  const [months, setMonths] = useState(1);
  useEffect(() => {
    getMySubscription()
      .then(setSub)
      .catch(() => setError('Could not load your subscription. Please try again.'));
  }, []);

  if (error) return <p role="alert" className="text-danger">{error}</p>;
  if (!sub) return <Spinner label="Loading your subscription" />;

  const left = sub.paidUntil ? daysLeft(sub.paidUntil) : 0;
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-section font-bold md:text-title">Subscription</h1>
        <p className="text-small text-muted md:text-body">Pick a plan to post and keep your offers live.</p>
      </div>

      <section aria-label="Current plan" className={`surface p-4 ${sub.active ? 'border-l-4 border-green-600' : 'border-l-4 border-amber-500'}`}>
        <p className="text-small font-semibold uppercase text-muted">Current plan</p>
        {sub.paidUntil ? (
          <>
            <p className="text-section font-bold">{sub.plan ? MERCHANT_PLANS[sub.plan].name : 'Basic'}</p>
            <p className={`text-small font-semibold ${sub.active ? 'text-green-700' : 'text-amber-700'}`}>
              {sub.active
                ? `Active until ${fmt(sub.paidUntil)} (${left} day${left === 1 ? '' : 's'} left)`
                : `Ended on ${fmt(sub.paidUntil)}. Offers stay visible for ${sub.graceDays} more days after that, then are hidden until you renew.`}
            </p>
          </>
        ) : (
          <>
            <p className="text-section font-bold">Not subscribed</p>
            <p className="text-small text-amber-700">Choose a plan below to publish your offers.</p>
          </>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-2 text-small font-semibold">
        <span>Pay for</span>
        {[1, 3, 6, 12].map((m) => (
          <button key={m} type="button" aria-pressed={months === m} onClick={() => setMonths(m)} className={`chip ${months === m ? 'chip-active' : ''}`}>
            {m} month{m > 1 ? 's' : ''}
            {m >= LONG_TERM_MIN_MONTHS ? ` (${LONG_TERM_DISCOUNT_PERCENT}% off)` : ''}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {MERCHANT_PLAN_KEYS.map((k) => (
          <section key={k} aria-label={`${MERCHANT_PLANS[k].name} plan`} className={`flex flex-col overflow-hidden rounded-xl border-2 bg-card shadow-card ${LOOK[k].ring}`}>
            <h2 className={`py-2.5 text-center font-extrabold uppercase ${LOOK[k].head}`}>
              {MERCHANT_PLANS[k].name}
              {sub.active && sub.plan === k && <span className="ml-2 rounded-full bg-black/15 px-2 py-0.5 text-[11px]">Your plan</span>}
            </h2>
            <div className="px-4 pt-4 text-center">
              <p className="text-[34px] font-extrabold leading-none">
                ₹{MERCHANT_PLANS[k].price}
                <span className="text-body font-semibold text-muted"> / month</span>
              </p>
              {months > 1 && <p className="mt-1 text-small font-semibold text-muted">₹{planAmount(k, months)} for {months} months</p>}
            </div>
            <ul className="flex-1 space-y-2 px-4 py-4 text-small">
              {INCLUDES[k].map((f) => (
                <li key={f} className="flex gap-2">
                  <span aria-hidden className="font-bold text-purple-700">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="p-4 pt-0">
              <a href={payLink(k, months)} target="_blank" rel="noopener noreferrer" className={`${LOOK[k].button} w-full`}>
                {sub.active && sub.plan === k ? 'Renew' : 'Subscribe'} via WhatsApp
              </a>
            </div>
          </section>
        ))}
      </div>

      <p className="text-small text-muted">
        Online payment is coming soon. For now, tap Subscribe to message our team on WhatsApp, pay as they tell you, and your plan is activated as soon as the payment is recorded.
        Questions? support@offerbuzz.co.
      </p>
    </div>
  );
}
