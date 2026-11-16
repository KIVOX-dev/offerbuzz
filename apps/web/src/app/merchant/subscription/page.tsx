'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LONG_TERM_DISCOUNT_PERCENT, LONG_TERM_MIN_MONTHS, MERCHANT_PLANS, MERCHANT_PLAN_KEYS, OFFERS_PER_MONTH, PAYMENT_MONTH_OPTIONS, planAmount, type MerchantPlan, type SubscriptionDTO } from '@offerbuzz/shared';
import { useAccount } from '@/components/account/AccountShell';
import { PlanCountdown } from '@/components/PlanCountdown';
import { Spinner } from '@/components/PageLoader';
import { ApiRequestError, createPaymentOrder, getMySubscription, verifyPayment } from '@/lib/api';
import { openCheckout } from '@/lib/razorpay';

const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// brand colours only: soft purple, solid purple, and the dark hero purple with the yellow accent
const LOOK: Record<MerchantPlan, { head: string; ring: string; button: string }> = {
  basic: { head: 'bg-purple-100 text-purple-900', ring: 'border-purple-200', button: 'btn-outline' },
  premium: { head: 'bg-purple-700 text-white', ring: 'border-purple-700', button: 'btn-primary' },
  featured: { head: 'bg-hero text-accent', ring: 'border-accent', button: 'btn-accent' },
};
const POST = `Post up to ${OFFERS_PER_MONTH} offers every month`;
const INCLUDES: Record<MerchantPlan, string[]> = {
  basic: [POST, 'Offer published on OfferBuzz.co for 30 days', 'Social media promotion'],
  premium: [POST, 'Offer published on OfferBuzz.co', 'Advertisement on the Dina Idhigai print and digital newspaper', 'Social media promotion'],
  featured: [
    POST,
    'Offer published on OfferBuzz.co',
    'Ads on the Dina Idhigai print and digital newspaper',
    'Digital newscard strip ads',
    'Social media promotion',
    'Ads on the E-Behind digital magazine',
  ],
};

export default function MerchantSubscription() {
  const [sub, setSub] = useState<SubscriptionDTO>();
  const [error, setError] = useState('');
  const [months, setMonths] = useState(1);
  const { user } = useAccount();
  const [paying, setPaying] = useState<MerchantPlan>();
  const [notice, setNotice] = useState<{ ok: boolean; text: string }>();
  const load = () =>
    getMySubscription()
      .then(setSub)
      .catch(() => setError('Could not load your subscription. Please try again.'));
  useEffect(() => {
    void load();
  }, []);

  /** Order on our server, pay in Razorpay's window, then confirm on our server so the plan starts at once. */
  async function pay(plan: MerchantPlan) {
    setNotice(undefined);
    setPaying(plan);
    try {
      const order = await createPaymentOrder({ plan, months });
      const done = await openCheckout(order, { name: user.name, email: user.email, contact: user.phone });
      if (!done) return; // the window was closed
      try {
        const r = await verifyPayment(done);
        setNotice({ ok: true, text: `Payment received. Your ${MERCHANT_PLANS[r.plan].name} plan is active until ${fmt(r.paidUntil)}. You can post ${OFFERS_PER_MONTH} offers every month.` });
      } catch {
        // paid, but we could not confirm here: Razorpay also tells our server, so the plan still starts
        setNotice({ ok: true, text: 'Payment received. Your plan will be active in a minute. If it does not show, write to support@offerbuzz.co with your payment id.' });
      }
      await load();
    } catch (e) {
      setNotice({ ok: false, text: e instanceof Error ? e.message : 'Could not start the payment. Please try again.' });
      if (e instanceof ApiRequestError && e.status === 401) setNotice({ ok: false, text: 'Please sign in again to pay.' });
    } finally {
      setPaying(undefined);
    }
  }

  if (error) return <p role="alert" className="text-danger">{error}</p>;
  if (!sub) return <Spinner label="Loading your subscription" />;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-section font-bold md:text-title">Subscription</h1>
        <p className="text-small text-muted md:text-body">Pick a plan to post and keep your offers live.</p>
      </div>

      <PlanCountdown sub={sub} />

      {notice && (
        <p role={notice.ok ? 'status' : 'alert'} className={`rounded-md p-3 text-small font-semibold ${notice.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-danger'}`}>
          {notice.text}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 text-small font-semibold">
        <span>Pay for</span>
        {PAYMENT_MONTH_OPTIONS.map((m) => (
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
              {months > 1 && (
                <p className="mt-1 text-small font-semibold text-muted">
                  ₹{planAmount(k, months)} for {months} months · {OFFERS_PER_MONTH * months} offers in all
                </p>
              )}
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
              <button type="button" onClick={() => pay(k)} disabled={Boolean(paying)} className={`${LOOK[k].button} w-full`}>
                {paying === k ? 'Opening payment...' : `${sub.active && sub.plan === k ? 'Renew' : 'Pay'} ₹${planAmount(k, months)}`}
              </button>
            </div>
          </section>
        ))}
      </div>

      <p className="text-small text-muted">
        Pay securely online with UPI, card or net banking through Razorpay. Your plan starts the moment the payment goes through. Each paid month lets you post {OFFERS_PER_MONTH} offers, and an offer can run for 30 days at most.
        Paying for 6 or 12 months at once is {LONG_TERM_DISCOUNT_PERCENT}% cheaper (for example, 12 months gives you {OFFERS_PER_MONTH * 12} offers). Questions? support@offerbuzz.co. See our <Link href="/refund" className="underline">Cancellation &amp; Refund Policy</Link>.
      </p>
    </div>
  );
}
