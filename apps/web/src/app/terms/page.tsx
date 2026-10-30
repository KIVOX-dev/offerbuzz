import type { Metadata } from 'next';
import { LegalPage, type LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Terms & Conditions - OfferBuzz' };

const sections: LegalSection[] = [
  {
    heading: 'About these terms',
    body: [
      'These Terms & Conditions ("Terms") are a legal agreement between you and OfferBuzz ("OfferBuzz", "we", "us"), based at #3, 3rd Street, Thiruvallur Nagar, Ramanathapuram, Coimbatore - 641045. They apply to the OfferBuzz website and every service on it, including browsing offers, vendor accounts, intermediary accounts, the QR code and scanner features, and the wallet.',
      'By visiting the site, creating an account or using any feature, you confirm that you have read and accept these Terms and our Privacy Policy and Cookie Policy. If you do not agree, please do not use OfferBuzz.',
    ],
  },
  {
    heading: 'What OfferBuzz is, and is not',
    body: [
      'OfferBuzz is an online platform that lets local shops ("Vendors") publish offers and deals, lets people ("Customers") discover them, and lets individuals ("Intermediaries") refer shops to the platform and earn rewards.',
      "OfferBuzz is only a listing and referral platform. We do not sell, supply, deliver or guarantee any goods or services shown in an offer, and we are not a party to any purchase between a Customer and a Vendor. Offers are created by Vendors, and their accuracy is the Vendor's responsibility.",
    ],
  },
  {
    heading: 'Eligibility',
    body: [
      "You must be at least 18 years old, or use OfferBuzz with a parent or guardian's supervision if you are a Customer under 18. Vendors and Intermediaries must be 18 or older and legally able to enter into a contract in India.",
      'If you register for a business, you confirm that you are authorised to bind that business to these Terms.',
    ],
  },
  {
    heading: 'Your account',
    body: ['To post offers or earn rewards you need an account. When you create and use an account, you agree to:'],
    bullets: [
      'give accurate, current and complete details (name, email, shop name, city, category and phone number) and keep them up to date;',
      'keep your password and the one-time codes we email you private, and not share your account with anyone;',
      'tell us straight away if you think your account has been used without your permission;',
      'accept responsibility for everything done through your account.',
    ],
  },
  {
    heading: 'Vendors: posting offers',
    body: ['If you register as a Vendor, you also agree that:'],
    bullets: [
      'You choose one shop category when you sign up. All of your offers are listed in that category and offers in any other category are not accepted. The category can only be changed by contacting us.',
      'Every offer must be genuine. You will honour it for its whole stated period, at the stated price or discount, at the stated area, subject to the terms you list.',
      'Titles, descriptions, dates, discounts, terms and photos must be accurate and not misleading. You must not advertise stock you do not have, inflate "original" prices, or hide material conditions.',
      "You must have the right to use every photo and piece of text you upload, and they must not infringe anyone's copyright, trademark or privacy.",
      'You are responsible for complying with all laws that apply to your business, including licences, consumer protection, pricing, taxes (including GST where applicable), and rules for regulated goods and services such as food, medicines, real estate and education.',
      'You are solely responsible for delivering what you promise and for resolving disputes, refunds and complaints with your customers.',
    ],
  },
  {
    heading: 'Offer review, expiry and removal',
    body: [
      'New offers are reviewed by our team before they appear to Customers. We may approve, reject or ask for changes to any offer, and we are not obliged to explain a decision beyond the reason we send you.',
      'An offer stops being shown after its end date. We send a courtesy email reminder to Vendors shortly before an offer ends, but this is a convenience only; you remain responsible for tracking your own offer dates.',
      "We may remove or suspend any offer at any time if it breaks these Terms, is reported, appears misleading, or if the Vendor's account or plan is not in good standing.",
    ],
  },
  {
    heading: 'Vendor plan and payments',
    body: [
      'Posting offers requires an active paid plan. The plan is billed monthly. The current price is shown in the app and is currently Rs 100 per month. We may change the price or introduce new plans, and a change will apply to the next billing period after we tell you.',
      'A plan runs until its paid-until date. After that date there is a short grace period (currently 3 days) during which your offers stay visible; if the plan is not renewed by then, your offers are hidden until you pay again.',
      'Payments are recorded against your account once we receive them. Plan fees are for access to the platform for the month and are generally non-refundable once the month has started, except where the law requires otherwise or where we agree in writing, for example for a duplicate payment.',
    ],
  },
  {
    heading: 'Customers',
    body: [
      "Customers can browse offers without an account. Offers, prices, availability, quality and after-sales service come from Vendors. Please check an offer's terms and confirm details with the shop before you buy.",
      "An offer may end early or change if the Vendor withdraws it or runs out of stock, and OfferBuzz is not liable for that. Any claim that an offer was not honoured should be raised first with the Vendor, and you may also report it to us so we can review the Vendor's account.",
    ],
  },
  {
    heading: 'Intermediaries, referral rewards and the wallet',
    body: ['Intermediaries refer shops to OfferBuzz using a personal referral code or QR code. The following rules apply:'],
    bullets: [
      'Intermediary accounts need our approval before they can earn or withdraw rewards, and we may approve or decline an application at our discretion.',
      'A reward is earned only when a shop you referred signs up with your code and pays for its plan. When that happens, reward credits (1 credit = Rs 1) are added to your wallet. The credit amount per paid month is set by us and is currently 30 credits; we may change it for future payments.',
      'New credits are held before they can be withdrawn. The holding period is currently 365 days from the date the credit is created. Credits on hold are shown in your wallet and cannot be withdrawn until released.',
      'You can request a payout once your available balance reaches the minimum (currently 100 credits). Only one payout request can wait at a time. Payouts are reviewed and paid outside the app (for example by bank transfer or UPI) and the wallet is reduced once we record the payment.',
      'Credits are not a bank balance or e-money, earn no interest, cannot be transferred or sold, and have no cash value except through an approved payout.',
      'You are responsible for any tax on the rewards you receive. We may deduct tax at source where the law requires it.',
      "Self-referrals, referrals of fake, duplicate or inactive shops, using other people's codes, and any other attempt to earn rewards dishonestly are prohibited. We may cancel such credits, refuse payouts and close the account.",
    ],
  },
  {
    heading: 'QR codes and the scanner',
    body: [
      'Your referral QR code is unique to you and links to OfferBuzz with your code attached. You may share it to promote OfferBuzz honestly, but must not alter it, attach it to a different destination, or use it to deceive people.',
      'The scanner reads QR codes and barcodes using your device camera. It only opens OfferBuzz links on this site; anything else it reads is placed in the search box. We do not control what a code printed elsewhere contains, so be careful with codes from unknown sources.',
    ],
  },
  {
    heading: 'Acceptable use',
    body: ['You agree not to:'],
    bullets: [
      'break any law or post unlawful, fraudulent, defamatory, hateful, obscene or misleading content;',
      'impersonate a person or business, or give false information to get approval or rewards;',
      'upload viruses or attempt to probe, hack, overload or bypass the security or rate limits of the service;',
      'scrape, copy or resell offer data, or use bots or automated tools without our written permission;',
      'send spam or unsolicited messages through the platform;',
      'sell prohibited items, including illegal goods, counterfeit goods, weapons, or anything you are not licensed to sell.',
    ],
  },
  {
    heading: 'Our content and your content',
    body: [
      'The OfferBuzz name, logo, design and software belong to us or our licensors and are protected by law. You may not copy or use them without our permission, other than to share your referral link or QR code.',
      'You keep ownership of the offers, photos and text you post. By posting them you give OfferBuzz a free, non-exclusive, worldwide licence to host, display, resize, promote and distribute them on and in connection with the platform (including in emails and social posts) for as long as the offer is live and for a reasonable time afterwards.',
    ],
  },
  {
    heading: 'Suspension and termination',
    body: [
      'You can stop using OfferBuzz at any time and ask us to close your account. We may suspend or close an account, remove content, or withhold rewards if you break these Terms, put others at risk, or if required by law, with or without notice depending on the seriousness of the issue.',
      'When an account closes, your right to use the service ends. Sections that by their nature should continue (such as content licences, liability and disputes) will continue to apply.',
    ],
  },
  {
    heading: 'Disclaimers',
    body: [
      'OfferBuzz is provided "as is" and "as available". We try to keep the service running and accurate, but we do not promise it will be uninterrupted, error-free or that every offer is accurate or current. We do not endorse any Vendor or offer.',
    ],
  },
  {
    heading: 'Limit of liability',
    body: [
      "To the fullest extent the law allows, OfferBuzz and its owners, staff and partners are not liable for indirect or consequential loss, loss of profit or business, or for anything arising from a Vendor's goods or services, a Customer's or Intermediary's conduct, third-party sites, or events outside our reasonable control.",
      'Where liability cannot be excluded, our total liability to you for any claim is limited to the amount you paid us in the three months before the claim arose. Nothing in these Terms limits liability that cannot lawfully be limited.',
    ],
  },
  {
    heading: 'Indemnity',
    body: ['You agree to compensate OfferBuzz for losses, claims and reasonable costs that arise from your offers or content, your breach of these Terms or the law, or your dealings with Customers, other Vendors or Intermediaries.'],
  },
  {
    heading: 'Changes to the service and to these Terms',
    body: [
      'We may update the service, prices, reward rules or these Terms from time to time. When a change is significant we will give notice on the site or by email. The "Last updated" date at the top shows the current version. Continuing to use OfferBuzz after a change means you accept the updated Terms.',
    ],
  },
  {
    heading: 'Complaints and grievances',
    body: [
      'If you have a complaint about the service, an offer, or content on OfferBuzz, contact our Grievance Officer at the address below or call +91 93459 75747 between 09:00 AM and 09:00 PM. Please include your registered email and details of the issue. We aim to acknowledge complaints within 48 hours and resolve them within 30 days.',
      'Grievance Officer, OfferBuzz, #3, 3rd Street, Thiruvallur Nagar, Ramanathapuram, Coimbatore - 641045.',
    ],
  },
  {
    heading: 'Governing law and disputes',
    body: [
      'These Terms are governed by the laws of India. We will try to settle any dispute through good-faith discussion first. If that fails, the courts at Coimbatore, Tamil Nadu have exclusive jurisdiction.',
    ],
  },
  {
    heading: 'General',
    body: [
      'These Terms, together with the Privacy Policy and Cookie Policy, are the whole agreement between you and OfferBuzz about the service. If any part is found unenforceable, the rest stays in force. If we do not enforce a right straight away, it does not mean we have given it up. You may not transfer your rights under these Terms; we may transfer ours as part of a business change.',
    ],
  },
];

export default function Terms() {
  return (
    <LegalPage
      title="Terms & Conditions"
      updated="30 October 2026"
      intro="Please read these terms carefully. They explain the rules for using OfferBuzz as a customer, vendor or intermediary."
      sections={sections}
    />
  );
}
