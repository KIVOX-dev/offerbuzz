import type { Metadata } from 'next';
import { LegalPage, type LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Cancellation & Refund Policy - OfferBuzz',
  description: 'How cancellations, refunds and service delivery work for OfferBuzz digital marketing plans.',
};

const sections: LegalSection[] = [
  {
    heading: 'What you are paying for',
    body: [
      'OfferBuzz is a digital marketing and advertising platform for local businesses. Merchants pay a subscription fee to promote their shop and offers on OfferBuzz. The fee is for a digital promotion service, not for any physical goods.',
      'OfferBuzz does not sell products to customers, and customers do not pay on OfferBuzz for anything they see in an offer.',
    ],
  },
  {
    heading: 'Service delivery',
    body: [
      'Our service is delivered digitally. Nothing is shipped. Once your payment is received and your offer is approved by our team, it is published on OfferBuzz.co for the period of your plan. The extra promotion included in the Premium and Featured plans is arranged with you after payment.',
    ],
  },
  {
    heading: 'Cancellation',
    body: [
      'You can stop renewing your plan at any time. When a plan ends, your offers stop showing after the short grace period described in our Terms & Conditions. Cancelling does not remove any amount already paid for the current period.',
    ],
  },
  {
    heading: 'Refunds',
    body: [
      'Plan fees are generally non-refundable once the plan period has started, because the promotion service begins on publication.',
      'We will refund, in full, a duplicate payment or an amount charged in error. If we cannot publish your offer for a reason on our side, we will either fix it or refund the unused period.',
      'To ask for a refund, write to support@offerbuzz.co with your registered mobile number and the payment details. Approved refunds are sent back to the original payment method, usually within 5 to 7 working days of approval.',
    ],
  },
  {
    heading: 'Refer & Earn rewards',
    body: ['Referral rewards are not a purchase and are not refundable. Payout rules are in our Terms & Conditions.'],
  },
];

export default function Refund() {
  return <LegalPage title="Cancellation & Refund Policy" intro="Plain rules for cancelling a plan and getting a refund." sections={sections} />;
}
