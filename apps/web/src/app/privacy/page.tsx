import type { Metadata } from 'next';
import { LegalPage, type LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Privacy Policy - OfferBuzz' };

const sections: LegalSection[] = [
  {
    heading: 'Who we are and what this covers',
    body: [
      'OfferBuzz, #3, 3rd Street, Thiruvallur Nagar, Ramanathapuram, Coimbatore - 641045, runs the OfferBuzz website. For the personal data described here we act as the data fiduciary (controller) under the Digital Personal Data Protection Act, 2023 and the Information Technology Act, 2000.',
      'This policy explains what we collect, why, who sees it, how long we keep it and what choices you have, whether you are a Customer, a Vendor or an Intermediary. By using OfferBuzz you agree to this policy.',
    ],
  },
  {
    heading: 'Information we collect',
    body: ['The information depends on how you use OfferBuzz.'],
    bullets: [
      'Everyone: if you only browse, we may collect a random visitor id and the pages you open (only if you accept analytics cookies), plus basic technical data such as browser type and approximate time of visit, which our servers record automatically.',
      'Account details (Vendors, Intermediaries and anyone who signs up): your name, email address, role, a password (stored only as a one-way hash), and optionally your mobile number and city.',
      'Vendors: shop name, shop category, city or area, the offers you post (title, description, dates, discount, area, terms) and the photos you upload.',
      'Intermediaries: your personal referral code, which shops joined using it, and wallet entries (credits earned, on hold, available and paid out).',
      'Payout details: if you request a payout, the information needed to pay you, such as UPI id or bank account details, which you give us or confirm to our team.',
      'Sign-in data: one-time codes we email you (stored only as a hash and deleted after use or expiry), sign-in session tokens, and, if you choose Google sign-in, the name and verified email Google shares with us.',
      'Communications: messages you send us and records of service emails we send you.',
      'Camera: if you use the scanner, your device camera is used to read a code (see section 5).',
    ],
  },
  {
    heading: 'How we use your information',
    body: ['We use personal data only for these purposes:'],
    bullets: [
      'to create and secure your account, sign you in and keep your session safe;',
      'to show offers and vendor shop names to the public, and let Vendors post and manage offers;',
      'to review offers and accounts, and run the vendor plan and its renewals;',
      'to run referrals, calculate rewards, maintain your wallet and process payouts;',
      'to send service emails, such as login codes, offer approval or rejection, plan and renewal notices, payout confirmations and reminders that an offer is about to end;',
      'to prevent fraud, abuse and misuse, and to enforce our Terms;',
      'to count visits and understand which pages are useful, so we can improve OfferBuzz (only with your cookie consent);',
      'to comply with law, tax and accounting rules, and to respond to legal requests.',
    ],
  },
  {
    heading: 'Why we may process it (legal basis)',
    body: [
      'We process your data because you have given consent (for example by creating an account, accepting analytics cookies or using the scanner), because it is needed to provide the service you asked for (such as posting offers or paying rewards), or because the law allows or requires it (such as keeping financial records or preventing fraud). Where we rely on consent, you can withdraw it at any time (see section 12).',
    ],
  },
  {
    heading: 'Camera and scanner',
    body: [
      'The scanner asks your browser for permission to use the camera. It works only while the scanner window is open, and the camera switches off when you close it. Video frames are processed on your own device to find a QR code or barcode. No image or video is uploaded, recorded or stored by OfferBuzz.',
      'If you scan an OfferBuzz link it opens on our site. Anything else is only placed in the search box on your device. You can block camera access at any time in your browser settings.',
    ],
  },
  {
    heading: 'Cookies and similar technologies',
    body: [
      'We use cookies and browser storage to keep you signed in and secure (essential) and, with your consent, to count visits anonymously (analytics). We do not use advertising or tracking cookies. If you choose "Reject", or if your browser sends a Do Not Track signal, we do not run analytics. You can change your choice at any time using "Cookie settings" in the footer. Details are in our Cookie Policy.',
    ],
  },
  {
    heading: 'Who we share information with',
    body: ['We do not sell your personal data. We share it only as follows:'],
    bullets: [
      "Publicly: a Vendor's offers, photos, shop name and area are visible to everyone who uses OfferBuzz.",
      'Intermediaries: an Intermediary can see the names of shops that joined with their referral code and the status of the related rewards.',
      'A place-name lookup: if you allow location, your approximate coordinates (rounded to about 100 m) are sent once from your browser to a reverse-geocoding service (BigDataCloud, or Google Maps if configured) to show your area name. They are not tied to your account and are not stored on our servers.',
      'Service providers who work for us under confidentiality: email delivery (we use Brevo to send emails), hosting and database providers, and Google if you choose Google sign-in. They may process data only to provide their service to us.',
      'Authorities and advisers: courts, regulators, law enforcement, auditors and professional advisers where the law requires it or to protect our rights, users or the public.',
      'Business changes: if OfferBuzz is merged, sold or reorganised, your data may transfer to the new owner, who must honour this policy.',
    ],
  },
  {
    heading: 'Where your data is stored and transfers',
    body: [
      'Our service providers may store or process data on servers in India or in other countries. Where data leaves India, we take reasonable steps so that it stays protected and handled in line with this policy and applicable law.',
    ],
  },
  {
    heading: 'How long we keep it',
    body: ['We keep personal data only as long as needed for the purposes above:'],
    bullets: [
      'Account and profile data: while your account is active and for a reasonable time after it closes, for example to handle disputes.',
      'Login codes: for a few minutes, and deleted when used or expired.',
      'Offers and photos: while the offer is live and until you or we delete it.',
      'Wallet, payout and payment records: for the period required by tax and accounting law (generally up to 8 years).',
      'Anonymous analytics: in aggregate form for as long as they remain useful.',
      'After that, data is deleted or anonymised.',
    ],
  },
  {
    heading: 'How we protect it',
    body: [
      'We use reasonable security measures, including encrypted connections (HTTPS), hashed passwords and one-time codes, short-lived sign-in tokens, rate limits on login attempts, and restricted staff access. No system is completely secure, so we cannot guarantee absolute security. Please keep your password private and tell us immediately if you suspect misuse.',
      'If a breach affecting your personal data occurs, we will notify you and the authorities as the law requires.',
    ],
  },
  {
    heading: 'Your rights',
    body: ['Under Indian data protection law you can ask us to:'],
    bullets: [
      'give you a summary of the personal data we hold about you and how we use it;',
      'correct or update inaccurate or incomplete data (you can edit most details in your profile);',
      'erase your personal data, unless we must keep it by law;',
      'withdraw your consent, which will not affect what we did before you withdrew;',
      'nominate someone to exercise your rights on your behalf if you die or become incapacitated;',
      'get your complaint dealt with by our Grievance Officer.',
    ],
  },
  {
    heading: 'Withdrawing consent and deleting your account',
    body: [
      "To change your cookie choice, use \"Cookie settings\" in the footer, or clear this site's data in your browser. To close your account or delete your data, call or write to us using the details below from your registered email address. We may need to confirm your identity first, and we may keep limited records that we must retain by law (for example wallet and payment records).",
    ],
  },
  {
    heading: 'Children',
    body: [
      "OfferBuzz is not directed at children under 18, and accounts are for adults. We do not knowingly collect personal data of children without a parent or guardian's consent. If you believe a child has given us data, contact us and we will delete it.",
    ],
  },
  {
    heading: 'Links and third-party sites',
    body: ['Offers may link to or mention shops and websites we do not run. We are not responsible for their privacy practices, so read their policies before sharing data with them.'],
  },
  {
    heading: 'Changes to this policy',
    body: ['We may update this policy as the service or the law changes. The "Last updated" date shows the current version, and we will give a clearer notice on the site or by email for significant changes.'],
  },
  {
    heading: 'Contact and Grievance Officer',
    body: [
      'For any privacy question, request or complaint, contact our Grievance Officer:',
      'Grievance Officer, OfferBuzz, #3, 3rd Street, Thiruvallur Nagar, Ramanathapuram, Coimbatore - 641045. Phone: +91 93459 75747 (09:00 AM to 09:00 PM). We aim to acknowledge requests within 48 hours and resolve them within 30 days.',
    ],
  },
];

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="30 October 2026"
      intro="Your privacy matters to us. This policy explains what OfferBuzz collects, why, who we share it with, and the choices you have."
      sections={sections}
    />
  );
}
