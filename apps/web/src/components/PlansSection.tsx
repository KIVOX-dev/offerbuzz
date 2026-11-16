import Link from 'next/link';
import { MERCHANT_PLANS } from '@/lib/plans';

const PLANS = [
  {
    name: 'Basic',
    price: MERCHANT_PLANS.basic.price,
    tag: 'Start promoting your business online',
    head: 'bg-purple-100 text-purple-900',
    soft: 'bg-purple-50 text-purple-800',
    ring: 'border-purple-200',
    features: ['Offer published on the OfferBuzz.co website for 30 days'],
  },
  {
    name: 'Premium',
    price: MERCHANT_PLANS.premium.price,
    tag: 'Reach customers online and in print',
    head: 'bg-purple-700 text-white',
    soft: 'bg-purple-50 text-purple-800',
    ring: 'border-purple-700',
    popular: true,
    features: [
      'Offer published on the OfferBuzz.co website',
      'Advertisement on the Dina Idhigai print and digital newspaper (5,000 copies, for a single issue, minimum size)',
    ],
  },
  {
    name: 'Featured',
    price: MERCHANT_PLANS.featured.price,
    tag: 'Maximum visibility. Maximum reach. Maximum sales.',
    head: 'bg-hero text-accent',
    soft: 'bg-amber-50 text-amber-900',
    ring: 'border-accent',
    features: [
      'Offer published on the OfferBuzz.co website',
      'Ads on the Dina Idhigai print and digital newspaper (5,000 copies, for a single issue, minimum size)',
      'Dina Idhigai digital newscard strip ads',
      'Social media promotion',
      'Ads on the E-Behind digital magazine (for a single issue, minimum size)',
    ],
  },
] as const;

/** The three merchant plans plus the long term package discount. Used on /plans and /benefits/merchant. */
export function PlansSection() {
  return (
    <div className="space-y-8">
      <div className="grid gap-5 md:grid-cols-3">
        {PLANS.map((p) => (
          <section key={p.name} aria-label={`${p.name} plan`} className={`flex flex-col overflow-hidden rounded-xl border-2 bg-card shadow-card ${p.ring}`}>
            <h2 className={`py-3 text-center text-section font-extrabold uppercase tracking-wide ${p.head}`}>
              {p.name}
              {'popular' in p && p.popular && <span className="ml-2 rounded-full bg-white/25 px-2 py-0.5 text-[11px] font-bold">Popular</span>}
            </h2>
            <div className="px-5 pt-5 text-center">
              <p className="text-small font-semibold uppercase text-muted">Post your offers @</p>
              <p className="mt-1 text-[40px] font-extrabold leading-none">₹{p.price}<span className="text-section font-bold">/-</span></p>
              <p className="mt-1 text-small font-semibold uppercase text-muted">per month</p>
            </div>
            <ul className="mt-4 flex-1 space-y-3 border-t border-dashed border-purple-200 px-5 py-4 text-body">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <span aria-hidden className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${p.soft}`}>✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <p className={`px-4 py-3 text-center text-small font-bold uppercase ${p.soft}`}>{p.tag}</p>
            <div className="p-4 pt-3">
              <Link href="/login/vendor/sign-up" className="btn-primary w-full">Get started</Link>
            </div>
          </section>
        ))}
      </div>

      <section aria-label="Long term packages" className="surface flex flex-wrap items-center justify-center gap-x-8 gap-y-3 p-4 text-center">
        <p className="rounded-md bg-purple-800 px-4 py-2 text-body font-extrabold uppercase text-white">Save more</p>
        <p className="text-body font-bold uppercase">Long term packages (discount)</p>
        <p className="text-body"><strong>6 months</strong> · 10% off</p>
        <p className="text-body"><strong>12 months</strong> · 10% off</p>
      </section>
    </div>
  );
}
