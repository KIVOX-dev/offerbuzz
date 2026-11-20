import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import { Tracker } from '@/components/Tracker';
import { CookieBanner } from '@/components/CookieBanner';
import { OfferaAI } from '@/components/agent/OfferaAI';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

const TITLE = 'OfferBuzz - Digital marketing platform for local businesses';
const DESCRIPTION = 'OfferBuzz helps you discover the latest local offers, discounts, and deals from nearby shops. Explore by city, area, and category.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { type: 'website', siteName: 'OfferBuzz', title: TITLE, description: DESCRIPTION },
  twitter: { card: 'summary', title: TITLE, description: DESCRIPTION },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Tracker />
        {children}
        <CookieBanner />
        <OfferaAI />
      </body>
    </html>
  );
}
