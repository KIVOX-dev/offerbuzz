import Link from 'next/link';
import { Logo } from './Logo';
import { ClockIcon, PhoneIcon, PinIcon } from './Icons';
import { CookieSettingsButton } from './CookieBanner';

type FooterLink = { label: string; href: string };

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Vendors',
    links: [
      { label: 'Vendor sign up', href: '/login?role=merchant&mode=signup' },
      { label: 'Vendor login', href: '/login?role=merchant&mode=signin' },
    ],
  },
  {
    title: 'Intermediaries',
    links: [
      { label: 'Intermediary sign up', href: '/login?role=intermediary&mode=signup' },
      { label: 'Intermediary login', href: '/login?role=intermediary&mode=signin' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms & Conditions', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
    ],
  },
];

/** Small mono heading followed by a hairline. */
function Heading({ children }: { children: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <h2 className="font-mono text-[12px] uppercase tracking-wider text-purple-300">{children}</h2>
      <span aria-hidden className="h-px max-w-[120px] flex-1 bg-purple-300/40" />
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-10 bg-[#150a3a] text-purple-100">
      {/* dotted top edge */}
      <div
        aria-hidden
        className="h-2"
        style={{ backgroundImage: 'repeating-linear-gradient(90deg, #a78bfa 0 4px, transparent 4px 8px)' }}
      />
      <div className="container-page py-12">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
          {/* brand: logo, line, then address and contact right below */}
          <div>
            <Logo height={60} variant="light" />
            <p className="mt-5 max-w-sm text-body leading-relaxed text-purple-200">
              Your path to the best local offers: shops, deals and savings near you, all in one place.
            </p>
            <ul className="mt-6 space-y-3 text-body text-white">
              <li>
                <address className="flex items-start gap-3 not-italic">
                  <PinIcon size={18} className="mt-0.5 shrink-0 text-purple-300" />
                  <span>#3, 3rd Street, Thiruvallur Nagar, Ramanathapuram, Coimbatore - 641045</span>
                </address>
              </li>
              <li className="flex items-center gap-3">
                <PhoneIcon size={18} className="shrink-0 text-purple-300" />
                <a href="tel:+919345975747" className="transition hover:text-accent">+91 93459 75747</a>
              </li>
              <li className="flex items-center gap-3">
                <ClockIcon size={18} className="shrink-0 text-purple-300" /> 09:00 AM – 09:00 PM
              </li>
            </ul>
          </div>

          {/* link columns */}
          <div className="grid gap-10 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <Heading>{col.title}</Heading>
                <ul className="space-y-3.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="text-body text-white transition hover:text-accent">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                  {col.title === 'Legal' && (
                    <li>
                      <CookieSettingsButton className="text-body text-white transition hover:text-accent" />
                    </li>
                  )}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <p className="mt-12 border-t border-purple-300/20 pt-6 text-small text-purple-300">© 2026 OfferBuzz</p>
      </div>
    </footer>
  );
}
