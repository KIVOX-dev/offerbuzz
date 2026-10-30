/* eslint-disable @next/next/no-img-element */
'use client';
import { TagIcon } from '@/components/Icons';
import { Burst, InfoStrip, OffPill, PromoCard } from '@/components/home/PromoCard';
type Category = { name: string; slug: string; offers: string; from: string; to: string; text: string; btn: string };
const categories: Category[] = [
  { name: 'Grocery', slug: 'grocery', offers: '250+', from: '#e8fae0', to: '#e6f9dd', text: 'text-green-700', btn: 'bg-green-600' },
  { name: 'Fashion & Clothing', slug: 'fashion', offers: '180+', from: '#fce8ed', to: '#fde8ee', text: 'text-rose-600', btn: 'bg-rose-500' },
  { name: 'Electronics', slug: 'electronics', offers: '120+', from: '#e4f2fe', to: '#e4f1fd', text: 'text-blue-600', btn: 'bg-blue-600' },
  { name: 'Home & Living', slug: 'home', offers: '150+', from: '#fef1d0', to: '#fef0ce', text: 'text-amber-600', btn: 'bg-amber-500' },
  { name: 'Beauty & Personal Care', slug: 'beauty', offers: '120+', from: '#feeeeb', to: '#feedea', text: 'text-red-600', btn: 'bg-red-500' },
  { name: 'Health & Pharmacy', slug: 'health', offers: '100+', from: '#e1f6eb', to: '#e1f6e9', text: 'text-green-700', btn: 'bg-green-600' },
  { name: 'Fitness & Sports', slug: 'fitness', offers: '90+', from: '#eaeafe', to: '#eaeafe', text: 'text-indigo-700', btn: 'bg-indigo-600' },
  { name: 'Baby & Kids', slug: 'baby', offers: '80+', from: '#dbeefe', to: '#daedfd', text: 'text-blue-600', btn: 'bg-blue-600' },
  { name: 'Food & Beverages', slug: 'food', offers: '110+', from: '#fee4e6', to: '#fee1e3', text: 'text-red-600', btn: 'bg-red-500' },
  { name: 'Automotive', slug: 'automotive', offers: '60+', from: '#dbf7f7', to: '#d7f5f4', text: 'text-teal-700', btn: 'bg-teal-600' },
  { name: 'Pets', slug: 'pets', offers: '50+', from: '#fee8d9', to: '#fde7d7', text: 'text-orange-600', btn: 'bg-orange-500' },
  { name: 'Travel & Lifestyle', slug: 'travel', offers: '70+', from: '#fee6f1', to: '#fee4f0', text: 'text-pink-600', btn: 'bg-pink-500' },
];


export default function CardTest() {
  return (
    <div className="space-y-3 p-3">

            {/* intro card */}
            <div className="h-[232px] overflow-hidden rounded-2xl shadow-card sm:h-[290px] md:h-[310px]">
              <div className="relative flex h-full items-center overflow-hidden bg-hero px-5 pb-6 pt-6 text-white md:px-8">
                {/* soft glows and a faint dot grid */}
                <span aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-purple-400/25 blur-3xl" />
                <span aria-hidden className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-[0.12]"
                  style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '22px 22px' }}
                />

                <div className="relative z-10 max-w-[480px]">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-small font-semibold text-accent backdrop-blur">
                    <TagIcon size={14} /> Shop more. Save more.
                  </span>
                  <h1 className="mt-5 text-[28px] font-extrabold leading-[1.05] tracking-tight md:text-[32px]">
                    Offers and deals <span className="bg-gradient-to-r from-accent to-amber-300 bg-clip-text text-transparent">near you</span>
                  </h1>
                  <p className="mt-4 max-w-md text-body text-purple-100 md:text-[17px]">
                    Don&apos;t miss the best offers from your favourite local stores.
                  </p>
                  <ul className="mt-4 hidden flex-wrap gap-2 text-small font-medium sm:flex">
                    {['Free for customers', 'Verified local shops', 'New offers daily'].map((t) => (
                      <li key={t} className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-ink">✓</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </div>

            <PromoCard theme="blue" image="/banners/electronics.webp" imagePosition="52% center" label="Sale is live" href={`/search?category=${encodeURIComponent('Mobile and Electronics')}`}
              burst={<Burst lines={['BIG', 'SAVE', 'DAYS']} />}>
              <span className="text-[27px] font-black uppercase leading-[0.95] tracking-tight [text-shadow:0_2px_14px_rgba(255,255,255,0.55)] sm:text-[34px] md:text-[40px]">Sale is live</span>
              <OffPill>50 - 80% Off</OffPill>
              <InfoStrip>Up to Rs 100 instant off on your first order</InfoStrip>
            </PromoCard>

            <PromoCard theme="indigo" image="/banners/fashion.webp" label="Festivals of India" href={`/search?category=${encodeURIComponent('Fashion')}`}
              burst={<Burst lines={['BIG', 'SAVE', 'DAYS']} size={60} />}>
              <span className="font-serif text-[26px] font-bold uppercase leading-[0.95] tracking-wide sm:text-[34px] md:text-[38px]">Festivals</span>
              <span className="-mt-1 font-serif text-[14px] uppercase tracking-[0.2em] text-white/90 sm:-mt-2 sm:text-[20px]">of India</span>
              <span aria-hidden className="hidden h-px w-28 bg-gradient-to-r from-amber-300 to-transparent sm:block" />
              <span className="text-[18px] font-bold text-amber-200 sm:text-[22px]">From Rs 99</span>
            </PromoCard>

            <PromoCard theme="teal" image="/banners/grocery.webp" imagePosition="88% center" label="Fresh groceries" href={`/search?category=${encodeURIComponent('Grocery')}`}
              burst={<Burst lines={['FRESH', 'EVERY', 'DAY']} size={62} />}>
              <span className="text-[24px] font-black uppercase leading-[0.98] tracking-tight sm:text-[30px] md:text-[34px]">Fresh groceries</span>
              <span className="hidden text-[15px] font-medium text-white/90 sm:block">Stock up at your neighbourhood store</span>
              <OffPill>Min. 15% Off</OffPill>
            </PromoCard>

            <PromoCard theme="orange" image="/banners/travel.webp" label="Weekend getaways" href={`/search?category=${encodeURIComponent('Travels')}`}
              burst={<Burst lines={['WEEK', 'END', 'SALE']} size={62} />}>
              <span className="text-[24px] font-black uppercase leading-[0.98] tracking-tight sm:text-[30px] md:text-[34px]">Weekend getaways</span>
              <span className="hidden text-[15px] font-medium text-white/95 sm:block">Short trips, great deals</span>
              <OffPill>Up to 30% Off</OffPill>
            </PromoCard>

            <PromoCard theme="gold" dark image="/categories/home.webp" label="First order offer">
              <span className="text-small font-extrabold uppercase tracking-wider text-purple-800">First order</span>
              <span className="text-[34px] font-black leading-none sm:text-[44px] md:text-[52px]">Rs 50 off</span>
              <InfoStrip>Claim it on your first order</InfoStrip>
            </PromoCard>
          
    </div>
  );
}
