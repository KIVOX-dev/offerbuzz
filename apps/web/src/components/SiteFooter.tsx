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

const SOCIALS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/offerbuzzdotco?utm_source=qr&obrf=aXl0YnVkaTYxajJi',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/share/1DkpQ8yg6x/',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M13.5 21v-8h2.7l.4-3.2h-3.1V7.8c0-.9.3-1.5 1.6-1.5h1.7V3.4c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1v2.4H7.7V13h2.7v8h3.1z" />
      </svg>
    ),
  },
];

/** Small mono heading followed by a hairline. */
function Heading({ children }: { children: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <h2 className="font-mono text-[12px] font-bold uppercase tracking-wider text-purple-900">{children}</h2>
      <span aria-hidden className="h-px max-w-[120px] flex-1 bg-purple-900/30" />
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-10 hidden bg-accent text-ink md:block">
      {/* dotted top edge */}
      <div
        aria-hidden
        className="h-2"
        style={{ backgroundImage: 'repeating-linear-gradient(90deg, #4c1d95 0 4px, transparent 4px 8px)' }}
      />
      <div className="container-page py-12">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
          {/* brand: logo, line, then address and contact right below */}
          <div>
            <Logo height={76} variant="transparent" />
            <p className="mt-5 max-w-sm text-body font-medium leading-relaxed text-ink/80">
              Your path to the best local offers: shops, deals and savings near you, all in one place.
            </p>
            <ul className="mt-6 space-y-3 text-body font-medium text-ink">
              <li>
                <address className="flex items-start gap-3 not-italic">
                  <PinIcon size={18} className="mt-0.5 shrink-0 text-purple-900" />
                  <span>#3, 3rd Street, Thiruvallur Nagar, Ramanathapuram, Coimbatore - 641045</span>
                </address>
              </li>
              <li className="flex items-center gap-3">
                <PhoneIcon size={18} className="shrink-0 text-purple-900" />
                <a href="tel:+919345975747" className="transition hover:text-purple-800">+91 93459 75747</a>
              </li>
              <li className="flex items-center gap-3">
                <ClockIcon size={18} className="shrink-0 text-purple-900" /> 09:00 AM – 09:00 PM
              </li>
            </ul>

            <div className="mt-7">
              <Heading>Follow us on</Heading>
              <div className="flex items-center gap-3">
                {SOCIALS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    title={s.label}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-900 text-white transition hover:bg-purple-800"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* link columns */}
          <div className="grid gap-10 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <Heading>{col.title}</Heading>
                <ul className="space-y-3.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="text-body font-medium text-ink transition hover:text-purple-800">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                  {col.title === 'Legal' && (
                    <li>
                      <CookieSettingsButton className="text-body font-medium text-ink transition hover:text-purple-800" />
                    </li>
                  )}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <p className="mt-12 border-t border-purple-900/20 pt-6 text-small font-medium text-ink/70">© 2026 OfferBuzz</p>
      </div>
    </footer>
  );
}
