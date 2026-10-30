import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Cookie Policy - OfferBuzz' };

export default function Cookies() {
  return (
    <LegalPage
      title="Cookie Policy"
      updated="30 October 2026"
      intro="OfferBuzz uses cookies and similar browser storage. This page lists what they are for."
      sections={[
        { heading: 'What are cookies', body: ['Cookies and local storage are small items a site saves in your browser so it can remember you or how you use it.'] },
        { heading: 'Essential', body: ['Used to sign you in and keep your session secure. The site cannot work without them, so they are always on.'] },
        { heading: 'Analytics (optional)', body: ['A random visitor id (offerbuzz.vid) stored in your browser lets us count unique visitors and popular pages. It holds no personal data and is sent only if you choose "Accept all" and have not set Do Not Track.'] },
        { heading: 'Your choice', body: ["Your cookie choice is stored as offerbuzz.cookies. To change it, clear this site's data in your browser settings and the notice will appear again."] },
        { heading: 'Third parties', body: ['We do not use advertising cookies. Fonts are loaded at build time and are served from our own domain.'] },
      ]}
    />
  );
}
