import Link from 'next/link';
import { Logo } from './Logo';
import { ClockIcon, PhoneIcon, PinIcon } from './Icons';
import { CookieSettingsButton } from './CookieBanner';

type FooterLink = { label: string; href: string };

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Vendors',
    links: [
      { label: 'Vendor sign up', href: '/login/vendor/sign-up' },
      { label: 'Vendor login', href: '/login/vendor/sign-in' },
    ],
  },
  {
    title: 'Intermediaries',
    links: [
      { label: 'Intermediary sign up', href: '/login/intermediary/sign-up' },
      { label: 'Intermediary login', href: '/login/intermediary/sign-in' },
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
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
        <defs>
          <radialGradient id="ig-grad" cx="0.3" cy="1.05" r="1.2">
            <stop offset="0" stopColor="#FFDD55" />
            <stop offset="0.1" stopColor="#FFDD55" />
            <stop offset="0.5" stopColor="#FF543E" />
            <stop offset="1" stopColor="#C837AB" />
          </radialGradient>
          <linearGradient id="ig-grad2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3771C8" />
            <stop offset="0.3" stopColor="#3771C8" />
            <stop offset="1" stopColor="#6600FF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="10" fill="url(#ig-grad)" />
        <rect width="40" height="40" rx="10" fill="url(#ig-grad2)" />
        <rect x="10" y="10" width="20" height="20" rx="6" fill="none" stroke="#fff" strokeWidth="2.2" />
        <circle cx="20" cy="20" r="4.8" fill="none" stroke="#fff" strokeWidth="2.2" />
        <circle cx="26.2" cy="13.8" r="1.4" fill="#fff" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/share/1DkpQ8yg6x/',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
        <circle cx="20" cy="20" r="20" fill="#1877F2" />
        <path
          fill="#fff"
          d="M27.8 25.8l.9-5.8h-5.5v-3.8c0-1.6.8-3.1 3.2-3.1h2.5V8.2s-2.3-.4-4.4-.4c-4.5 0-7.5 2.7-7.5 7.6V20h-5v5.8h5V40h6.2V25.8h4.6z"
        />
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
                <div className="flex items-start gap-3">
                  <PinIcon size={18} className="mt-0.5 shrink-0 text-purple-900" />
                  <span>We are in Chennai, Bangalore, Coimbatore</span>
                </div>
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
                    className="block h-10 w-10 overflow-hidden rounded-full transition hover:scale-110 [&_svg]:h-full [&_svg]:w-full first:rounded-[10px]"
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
