import type { Metadata } from 'next';
import { LegalPage, type LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = { title: 'About us - OfferBuzz', description: 'OfferBuzz helps people find the best offers from local shops near them.' };

const sections: LegalSection[] = [
  {
    heading: 'Who we are',
    body: [
      'OfferBuzz is a local offers platform. We bring the deals, discounts and special offers from neighbourhood shops together in one place, so you can see what is on near you before you step out.',
    ],
  },
  {
    heading: 'What we do for customers',
    body: ['Finding a good offer should not mean walking from shop to shop. With OfferBuzz you can:'],
    bullets: [
      'see live offers from shops near your location, nearest first;',
      'browse by category and sub category, and filter by discount, offer type, ending soon and distance;',
      'get directions to the shop in one tap, and call the shop directly;',
      'save the offers you like. OfferBuzz is free for customers.',
    ],
  },
  {
    heading: 'What we do for merchants',
    body: [
      'Shops of every size can post their offers, with a photo, dates, the discount and the exact location, and reach people who are nearby and looking. Every offer is reviewed by our team before it goes live, so customers see genuine, current offers.',
    ],
  },
  {
    heading: 'Refer & Earn',
    body: ['Know a shop that should be on OfferBuzz? Our Refer & Earn partners introduce shops using a personal QR code or link and earn rewards when those shops join and subscribe.'],
  },
  {
    heading: 'Get in touch',
    body: ['We would love to hear from you. Write to support@offerbuzz.co or call +91 93459 75747 between 09:00 AM and 09:00 PM.'],
  },
];

export default function About() {
  return <LegalPage title="About us" intro="Shop more. Save more. OfferBuzz connects you with the best local offers around you." sections={sections} />;
}
