import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Terms & Conditions - OfferBuzz' };

export default function Terms() {
  return (
    <LegalPage
      title="Terms & Conditions"
      updated="30 October 2026"
      intro="By using OfferBuzz you agree to these terms. Please read them carefully."
      sections={[
        { heading: 'About OfferBuzz', body: ['OfferBuzz is a platform where local shops (vendors) publish offers and deals, customers discover them, and intermediaries refer shops to the platform. OfferBuzz does not sell the goods or services in an offer.'] },
        { heading: 'Accounts', body: ['You must give accurate details and keep your login and one-time passwords private. You are responsible for activity under your account. We may suspend accounts that break these terms.'] },
        { heading: 'Vendors and offers', body: ['Vendors must only post genuine offers they will honour, with correct prices, dates, area and terms. New offers wait for admin approval and may be rejected or removed at any time.', "Images and text must not infringe anyone's rights or be misleading, unlawful or offensive."] },
        { heading: 'Customers', body: ["Offers are provided by vendors. Availability, price and quality are the vendor's responsibility, and an offer can end or change before its stated end date if the vendor withdraws it."] },
        { heading: 'Intermediaries, wallet and payouts', body: ['Intermediaries may earn rewards for shops that join through their referral code or QR code. Rewards appear in the wallet after verification, and payouts are subject to review. Self-referrals, fake shops and any attempt to game rewards are prohibited and may lead to forfeited rewards and account removal.'] },
        { heading: 'Acceptable use', body: ['Do not misuse the service: no scraping, no attempts to break security, no spam, and no use of the scanner or QR codes to mislead others.'] },
        { heading: 'Liability', body: ['OfferBuzz is provided "as is". To the extent the law allows, we are not liable for losses arising from vendor offers, third-party conduct or service interruptions.'] },
        { heading: 'Changes and governing law', body: ['We may update these terms; continued use means you accept the updated version. These terms are governed by the laws of India, and the courts of our registered location have jurisdiction.'] },
      ]}
    />
  );
}
