import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Privacy Policy - OfferBuzz' };

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="30 October 2026"
      intro="This policy explains what OfferBuzz collects, why, and the choices you have."
      sections={[
        { heading: 'What we collect', body: ['Account details you give us: name, phone number or email, role, shop details and area, and bank or payout details if you request a payout.', 'Content you post, such as offers and offer photos.', 'Anonymous usage data: a random visitor id and the pages visited, to count visits. We do not collect it if you set Do Not Track or choose essential cookies only.'] },
        { heading: 'How we use it', body: ['To sign you in with one-time passwords, show offers, run referrals and wallets, process payouts, prevent fraud, send service emails, and improve the site.'] },
        { heading: 'Camera and scanner', body: ['The scanner uses your camera only while it is open, to read QR codes and barcodes. Images are processed in your browser and are never uploaded or stored.'] },
        { heading: 'Sharing', body: ['We do not sell your data. We share it only with service providers that run the platform (hosting, email delivery), when the law requires it, or to protect users and the service. Vendor offers and shop names are public.'] },
        { heading: 'Retention and security', body: ['We keep data while your account is active and as needed for legal and accounting reasons. Passwords are stored hashed and sessions use short-lived tokens, but no system is perfectly secure.'] },
        { heading: 'Your choices', body: ["You can view and edit your profile, ask us to correct or delete your data, and withdraw cookie consent at any time by clearing this site's data in your browser."] },
        { heading: 'Children', body: ['OfferBuzz is not meant for children under 13 and we do not knowingly collect their data.'] },
        { heading: 'Contact', body: ['For privacy requests, call +91 93459 75747 during working hours. We may update this policy and will change the date above when we do.'] },
      ]}
    />
  );
}
