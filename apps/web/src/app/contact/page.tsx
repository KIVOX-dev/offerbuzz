import type { Metadata } from 'next';
import { LegalPage, type LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Contact us - OfferBuzz', description: 'Get in touch with the OfferBuzz team.' };

const sections: LegalSection[] = [
  { heading: 'Email', body: ['Write to us at support@offerbuzz.co. We reply as soon as we can.'] },
  { heading: 'Phone and WhatsApp', body: ['Call or WhatsApp +91 93459 75747 between 09:00 AM and 09:00 PM.'] },
  {
    heading: 'What to include',
    body: ['To help us answer faster, tell us:'],
    bullets: [
      'your name and the email you signed up with (if you have an account);',
      'whether you are a customer, a merchant or a Refer & Earn partner;',
      'for an offer, the shop name and the offer title or link.',
    ],
  },
  { heading: 'Follow us', body: ['You can also reach us on Instagram and Facebook, linked at the bottom of every page.'] },
];

export default function Contact() {
  return <LegalPage title="Contact us" intro="Questions, feedback or help with your account? We are happy to help." sections={sections} />;
}
