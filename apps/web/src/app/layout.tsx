import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import { Tracker } from '@/components/Tracker';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'OfferBuzz - Offers and deals near you',
  description: 'Discover discounts and deals from shops in your city and area.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Tracker />
        {children}
      </body>
    </html>
  );
}
