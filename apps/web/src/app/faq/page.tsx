import type { Metadata } from 'next';
import { LegalPage, type LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = { title: 'FAQ - OfferBuzz', description: 'Answers to common questions about OfferBuzz for customers, merchants and Refer & Earn partners.' };

const sections: LegalSection[] = [
  { heading: 'What is OfferBuzz?', body: ['OfferBuzz shows the live offers and deals from local shops near you, all in one place.'] },
  { heading: 'Is OfferBuzz free for customers?', body: ['Yes. You can browse, search, save offers and get directions without paying anything, and without an account.'] },
  { heading: 'How do I see offers near me?', body: ['Allow your location when the site asks, or tap the location at the top of the home page. Offers from shops around you are then shown nearest first. You can also search or pick a category and filter the results.'] },
  { heading: 'How do I get to the shop?', body: ['Open an offer and tap "Get directions" to open the route in Google Maps. You can also tap the phone number on the offer to call the shop.'] },
  { heading: 'How do I post an offer as a merchant?', body: ['Create a Merchant account, complete your profile (shop name, category and shop location), then choose "Post an offer". Add the title, description, discount, dates and an optional photo.'] },
  { heading: 'Why is my offer not showing yet?', body: ['New offers are reviewed by our team before customers can see them. Once approved, the offer goes live from its start date until its end date.'] },
  { heading: 'Can I post an offer for a different place?', body: ['Yes. When posting, choose "Another place" and type the area, auto-detect your location or drop a pin on the map. This is useful for a second branch or when you are away from the shop.'] },
  { heading: 'How does Refer & Earn work?', body: ['Create a Refer & Earn account and, once approved, share your personal QR code or link with shops. When a shop you referred joins and subscribes, rewards are added to your wallet, and you can request a payout once the minimum amount is available. The full rules are in our Terms & Conditions.'] },
  { heading: 'How do I contact OfferBuzz?', body: ['Write to support@offerbuzz.co or call +91 93459 75747 between 09:00 AM and 09:00 PM.'] },
];

export default function Faq() {
  return <LegalPage title="Frequently asked questions" intro="Quick answers for customers, merchants and Refer & Earn partners." sections={sections} />;
}
