import type { Metadata } from 'next';
import { BenefitsPage, type BenefitsData } from '@/components/BenefitsPage';

export const metadata: Metadata = {
  title: 'Merchant benefits - OfferBuzz',
  description: 'Promote your shop and offers, reach more local customers and grow your sales with OfferBuzz.',
};

const data: BenefitsData = {
  headline: 'Grow Your Business. Reach More Customers. Increase Your Sales.',
  intro: 'OfferBuzz helps local shops, showrooms and businesses promote their products and special offers through one digital platform.',
  benefitsHeading: 'Key benefits for merchants',
  benefits: [
    { title: 'Reach More Customers', text: 'Make your shop and offers visible to more potential customers in your city and surrounding areas.' },
    { title: 'Digital Promotion for Your Shop', text: 'Promote your products, discounts and special offers online without depending only on traditional advertising.' },
    { title: 'Affordable Advertising', text: 'Promote your business with a budget-friendly merchant subscription.' },
    { title: 'Location-Based Visibility', text: 'Help customers discover your shop through city-wise and area-wise offer searches.' },
    { title: 'Increase Walk-in Customers', text: 'Encourage customers to visit your physical shop after discovering your offers online.' },
    { title: 'Promote Offers Anytime', text: 'Publish your special offers and update promotional details through your merchant account.' },
    { title: 'Offer Validity Management', text: 'Display offer start and end dates so customers know when promotions are available.' },
    { title: 'Showcase Your Products', text: 'Upload product images, prices and promotional information to attract customer attention.' },
    { title: 'Easy Online Management', text: 'Manage your business offers through your merchant login without depending on an advertising agency for every update.' },
    { title: 'Business Growth Opportunities', text: 'Improve your digital presence and create more opportunities to attract new customers.' },
  ],
  extra: {
    heading: '10 reasons to choose OfferBuzz',
    items: [
      { title: 'Affordable Promotion', text: 'Promote your shop without spending heavily on traditional advertising.' },
      { title: 'Local Customer Reach', text: 'Connect with potential customers in your city and nearby areas.' },
      { title: 'Easy Registration', text: 'Get your business registered through a simple online process.' },
      { title: 'Your Own Merchant Login', text: 'Manage your business offers independently.' },
      { title: 'Quick Offer Posting', text: 'Upload product images, prices and special discounts easily.' },
      { title: 'City & Area-Wise Visibility', text: 'Help customers discover offers based on their location.' },
      { title: 'Multiple Business Categories', text: 'Reach customers interested in your particular products and services.' },
      { title: 'Flexible Offer Updates', text: 'Update your promotional details and offer validity.' },
      { title: 'More Walk-in Opportunities', text: 'Encourage customers to visit your physical shop.' },
      { title: 'Digital Business Presence', text: 'Take your traditional shop promotion into the digital world.' },
    ],
  },
  chips: {
    heading: 'What makes OfferBuzz different?',
    items: ['Built for local businesses', 'Budget-friendly platform', 'Simple & convenient', 'Connecting shops & customers'],
  },
  closing: {
    heading: 'Built for local businesses',
    text: 'Focused on promoting local shops and merchants. Manage your offers through your own account and bring local offers and customers together in one place.',
  },
  cta: { label: 'Create merchant account', href: '/login/vendor/sign-up' },
};

export default function MerchantBenefits() {
  return <BenefitsPage d={data} />;
}
