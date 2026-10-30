import Link from 'next/link';
import { ClockIcon, PhoneIcon, PinIcon } from './Icons';

const ACCOUNTS = [
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
];

export function SiteFooter() {
  return (
    <footer className="mt-6 border-t border-purple-100 bg-card py-6">
      <div className="container-page space-y-3 text-small text-muted">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2"><PhoneIcon size={16} /> 93 45 97 57 47</span>
          <span className="flex items-center gap-2"><ClockIcon size={16} /> 09:00 AM – 09:00 PM</span>
          <span>© OfferBuzz</span>
        </div>
        <address className="flex items-start gap-2 not-italic">
          <PinIcon size={16} className="mt-0.5 shrink-0" />
          <span>#3, 3rd Street, Thiruvallur Nagar, Ramanathapuram, Coimbatore - 641045</span>
        </address>
        <div className="grid gap-6 border-t border-purple-100 pt-4 sm:grid-cols-2">
          {ACCOUNTS.map((g) => (
            <nav key={g.title} aria-label={g.title}>
              <p className="mb-2 text-small font-bold uppercase tracking-wider text-purple-700">{g.title}</p>
              <ul className="space-y-1.5 font-medium">
                {g.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="hover:text-purple-700">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-1 border-t border-purple-100 pt-3 font-medium">
          <Link href="/terms" className="hover:text-purple-700">Terms &amp; Conditions</Link>
          <Link href="/privacy" className="hover:text-purple-700">Privacy Policy</Link>
          <Link href="/cookies" className="hover:text-purple-700">Cookie Policy</Link>
        </nav>
      </div>
    </footer>
  );
}
