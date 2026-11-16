import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import { Tracker } from '@/components/Tracker';
import { CookieBanner } from '@/components/CookieBanner';
import { OfferaAI } from '@/components/agent/OfferaAI';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'OfferBuzz - Digital marketing platform for local businesses',
  description: 'OfferBuzz is a digital marketing and advertising platform where local shops promote their offers to nearby customers. Customers browse offers free.',
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
