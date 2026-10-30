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

/** Small mono heading followed by a hairline, like the column titles in the reference footer. */
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
        <div className="mb-10 flex flex-wrap items-center gap-4">
          <Logo height={56} variant="light" />
          <p className="text-body text-purple-200">Offers and deals from your favourite local stores.</p>
        </div>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
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

          <div>
            <Heading>Contact</Heading>
            <ul className="space-y-3.5 text-body text-white">
              <li className="flex items-center gap-2">
                <PhoneIcon size={16} className="shrink-0 text-purple-300" /> +91 93459 75747
              </li>
              <li className="flex items-center gap-2">
                <ClockIcon size={16} className="shrink-0 text-purple-300" /> 09:00 AM – 09:00 PM
              </li>
              <li>
                <address className="flex items-start gap-2 not-italic">
                  <PinIcon size={16} className="mt-1 shrink-0 text-purple-300" />
                  <span>#3, 3rd Street, Thiruvallur Nagar, Ramanathapuram, Coimbatore - 641045</span>
                </address>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-12 border-t border-purple-300/20 pt-6 text-small text-purple-300">© 2026 OfferBuzz</p>
      </div>
    </footer>
  );
}
