import type { Metadata } from 'next';
import { BenefitsPage, type BenefitsData } from '@/components/BenefitsPage';

export const metadata: Metadata = {
  title: 'Refer & Earn benefits - OfferBuzz',
  description: 'Refer local shop owners to OfferBuzz and earn a commission for successful referrals.',
};

const data: BenefitsData = {
  headline: 'Share Opportunities. Refer Businesses. Earn Rewards!',
  intro:
    'OfferBuzz brings you an exciting opportunity to earn by referring local shop owners and businesses to our platform. Know a shop owner? Have friends running businesses? Introduce them to OfferBuzz and earn a commission for successful referrals as per our Refer & Earn programme.',
  steps: {
    heading: 'How Refer & Earn works',
    items: [
      { title: 'Register on OfferBuzz', text: 'Create your account and access your referral details.' },
      { title: 'Share Your Referral', text: 'Share your QR Code or referral link with shop owners, friends, and business contacts to encourage them to register on OfferBuzz.co.' },
      { title: 'Refer Merchants', text: 'Encourage local businesses to register and promote their offers on OfferBuzz.' },
      { title: 'Successful Registration', text: 'Once the referred merchant completes the eligible registration and payment process, the referral qualifies according to programme rules.' },
      { title: 'Earn Commission', text: "Receive the applicable referral commission based on the programme's earning structure." },
    ],
  },
  benefitsHeading: 'Benefits of Refer & Earn',
  benefits: [
    { title: 'Earn Additional Income', text: 'Generate an additional income opportunity by referring businesses.' },
    { title: 'Flexible Working', text: 'Refer businesses at your convenience, without fixed working hours.' },
    { title: 'Easy to Share', text: 'Share your referral link through WhatsApp, social media and personal contacts.' },
    { title: 'No Need to Own a Shop', text: 'Anyone interested in referring businesses can participate, subject to programme eligibility.' },
    { title: 'Grow Your Referral Network', text: 'Build connections with shop owners, entrepreneurs and local businesses.' },
    { title: 'Track Your Referrals', text: 'Manage and monitor your referral activity through your account, where supported.' },
  ],
  chips: {
    heading: 'Who can join?',
    items: [
      'College Students',
      'Freelancers',
      'Digital Marketers',
      'Business Consultants',
      'Sales Representatives',
      'Entrepreneurs',
      'Working Professionals',
      'Anyone interested in referring local businesses',
    ],
  },
  note: {
    heading: 'Example of referral earnings',
    lines: [
      "For illustration, if the eligible commission is 25% of a merchant's ₹100 subscription:",
      'Merchant subscription: ₹100',
      'Example commission: 25%',
      'Your illustrative earning per eligible referral: ₹25',
      '10 successful referrals = ₹250',
    ],
    footnote: 'Actual commission depends on the official referral tariff and terms.',
  },
  closing: {
    heading: 'Why refer OfferBuzz?',
    text: 'You are not just referring a website. You are introducing local businesses to a new digital promotional opportunity while creating an earning opportunity for yourself.',
  },
  cta: { label: 'Start earning', href: '/login/intermediary/sign-up' },
};

export default function ReferBenefits() {
  return <BenefitsPage d={data} />;
}
