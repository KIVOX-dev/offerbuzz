import type { Metadata } from 'next';
import { PlansSection } from '@/components/PlansSection';
import { SiteHeader } from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Merchant plans - OfferBuzz',
  description: 'Choose the plan that is right for your business: Basic, Premium or Featured.',
};

export default function Plans() {
  return (
    <main className="min-h-screen overflow-x-clip pb-10">
      <SiteHeader />

      <div className="container-page max-w-5xl space-y-8 py-8">
        <div className="text-center">
          <h1 className="text-title font-bold">Choose the plan that&apos;s right for your business</h1>
          <p className="mx-auto mt-2 max-w-2xl text-muted">Plans are for merchants. Customers use OfferBuzz free.</p>
        </div>

        <PlansSection />

        <p className="text-center text-small text-muted">
          Prices are per month. Offers are reviewed by our team before they go live. Questions? Write to support@offerbuzz.co or call +91 93459 75747.
        </p>
      </div>
    </main>
  );
}
