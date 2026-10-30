/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import {
  ArrowRightIcon,
  ChevronRightIcon,
  ClockIcon,
  DuoHeartIcon,
  DuoPinIcon,
  DuoStoreIcon,
  DuoTagIcon,
  HeartIcon,
  PhoneIcon,
  PinIcon,
  SearchIcon,
  StoreIcon,
  TagIcon,
  UserIcon,
} from '@/components/Icons';

type Category = {
  name: string;
  slug: string; // product art at /categories/<slug>.webp
  offers: string;
  from: string; // tile gradient, sampled from the art so the edges blend
  to: string;
  text: string;
  btn: string;
};

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

// Sample deal cards until the Phase 2 API feeds real offers.
const deals = [
  { title: 'Flat 30% off on skincare', shop: 'Beauty & Personal Care', off: '30% OFF', cat: 4 },
  { title: 'Festive fashion sale', shop: 'Fashion & Clothing', off: 'UP TO 50% OFF', cat: 1 },
  { title: 'Latest gadgets, best prices', shop: 'Electronics', off: 'UP TO 20% OFF', cat: 2 },
  { title: 'Weekend getaway packages', shop: 'Travel & Lifestyle', off: '15% OFF', cat: 11 },
  { title: 'Living room makeover', shop: 'Home & Living', off: 'UP TO 40% OFF', cat: 3 },
  { title: 'Buy 1 Get 1 on meals', shop: 'Food & Beverages', off: 'BOGO', cat: 8 },
];

const perks = [
  { icon: DuoTagIcon, text: 'Best offers near you' },
  { icon: DuoStoreIcon, text: 'Shop local, save more' },
  { icon: DuoPinIcon, text: 'Discover new stores' },
  { icon: DuoHeartIcon, text: 'Support small businesses' },
];

function SectionHead({ title }: { title: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-section font-bold text-ink">{title}</h2>
      <Link href="/login" className="btn-ghost btn-sm gap-1">
        View all <ChevronRightIcon size={16} />
      </Link>
    </div>
  );
}

export default function Home() {
  // -1 = "All"; picking a category re-tints the whole page with that category's colour
  const [active, setActive] = useState(-1);
  const theme = active >= 0 ? categories[active] : null;
  const shownDeals = theme ? deals.filter((d) => categories[d.cat] === theme) : deals;

  return (
    <main
      style={{ backgroundColor: theme ? theme.from : undefined }}
      className="min-h-screen transition-colors duration-500"
    >
      <div className="h-1 bg-brand" aria-hidden />

      <header className="sticky top-0 z-20 border-b border-purple-100 bg-card">
        <div className="container-page flex items-center gap-3 py-2 md:h-header md:py-0">
          <Logo height={36} />

          <button type="button" className="hidden items-center gap-1 rounded-md px-2 py-1 text-small text-ink hover:bg-purple-50 md:flex">
            <PinIcon className="text-purple-700" />
            <span className="text-left leading-tight">
              <span className="block text-muted">Your Location</span>
              <span className="font-semibold">Select a Location</span>
            </span>
          </button>

          <form action="/login" className="hidden h-search flex-1 md:flex">
            <input className="input h-full rounded-r-none" placeholder="Search offers, shops and categories" aria-label="Search" />
            <button type="submit" aria-label="Search" className="flex w-12 items-center justify-center rounded-r-md bg-accent text-ink hover:brightness-105">
              <SearchIcon />
            </button>
          </form>

          <div className="ml-auto flex items-center gap-1">
            <Link href="/login" aria-label="Saved offers" className="btn-ghost !px-2">
              <HeartIcon />
            </Link>
            <Link href="/login" className="btn-ghost gap-2 !px-3">
              <UserIcon /> <span className="hidden sm:inline">Login</span>
            </Link>
          </div>
        </div>

        {/* mobile search */}
        <form action="/login" className="container-page flex pb-2 md:hidden">
          <input className="input rounded-r-none" placeholder="Search offers and shops" aria-label="Search" />
          <button type="submit" aria-label="Search" className="flex w-12 items-center justify-center rounded-r-md bg-accent text-ink">
            <SearchIcon />
          </button>
        </form>
      </header>

      {/* category strip */}
      <nav aria-label="Categories" className="border-b border-purple-100 bg-card">
        <ul className="container-page flex gap-2 overflow-x-auto py-2 [scrollbar-width:none]">
          {[{ name: 'All' }, ...categories].map((c, i) => (
            <li key={c.name} className="shrink-0">
              <button
                type="button"
                aria-pressed={active === i - 1}
                onClick={() => setActive(i - 1)}
                className={`chip ${active === i - 1 ? 'chip-active' : ''}`}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="container-page space-y-6 py-4 md:py-6">
        {/* hero */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-md bg-hero p-6 text-white shadow-glow md:col-span-2 md:p-8">
            <span className="badge-discount !bg-accent !text-ink">Shop more. Save more.</span>
            <h1 className="mt-3 text-title font-bold">Offers and deals near you</h1>
            <p className="mt-2 max-w-xl text-purple-100">Don&apos;t miss your best offers from your favourite stores.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/login" className="btn-accent gap-2">
                <TagIcon /> Post your offer
              </Link>
              <Link href="/login" className="btn border border-white/40 text-white hover:bg-white/10 gap-2">
                <StoreIcon /> Become an intermediary
              </Link>
            </div>
          </div>
          <div className="surface flex flex-col justify-center gap-3 p-6">
            <h2 className="text-section font-bold">$20 discount</h2>
            <p className="text-muted">On your first order. Sign in to claim it.</p>
            <Link href="/login" className="btn-primary gap-2">
              <UserIcon /> Login to claim
            </Link>
          </div>
        </section>

        {/* shop by category */}
        <section>
          <SectionHead title="Shop by Category" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {categories.map((c, i) => (
              <Link
                key={c.slug}
                href="/login"
                className={`group flex flex-col rounded-lg bg-card p-3 shadow-card transition duration-200 active:scale-[0.98] md:hover:-translate-y-0.5 md:hover:shadow-card-hover ${
                  active === i ? 'ring-2 ring-purple-600' : ''
                }`}
              >
                <h3 className="line-clamp-2 min-h-[2.5rem] text-body font-bold leading-tight text-ink">{c.name}</h3>
                <div
                  style={{ backgroundImage: `linear-gradient(120deg, ${c.from}, ${c.to})` }}
                  className="mt-2 aspect-square overflow-hidden rounded-md"
                >
                  <img
                    src={`/categories/${c.slug}.webp`}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
                <p className="mt-2 text-small text-muted">{c.offers} offers</p>
                <span className={`text-small font-semibold ${c.text}`}>Shop now</span>
              </Link>
            ))}
          </div>

          <ul className="surface mt-4 grid grid-cols-2 gap-4 p-4 md:grid-cols-4">
            {perks.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-small font-semibold uppercase text-ink">
                <Icon size={40} className="shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </section>

        {/* deals */}
        <section>
          <SectionHead title="Don't Miss Your Best Offers" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {shownDeals.map((d) => (
              <article key={d.title} className="surface-hover relative overflow-hidden rounded-lg">
                <span className="badge-discount absolute left-2 top-2 z-10">{d.off}</span>
                <button
                  type="button"
                  aria-label="Save offer"
                  className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card/90 text-purple-700 shadow-card hover:text-danger"
                >
                  <HeartIcon size={16} />
                </button>
                <div
                  style={{ backgroundImage: `linear-gradient(120deg, ${categories[d.cat].from}, ${categories[d.cat].to})` }}
                  className="aspect-[4/3] overflow-hidden"
                >
                  <img src={`/categories/${categories[d.cat].slug}.webp`} alt="" loading="lazy" className="h-full w-full object-cover" />
                </div>
                <div className="space-y-1 p-3">
                  <p className="line-clamp-2 text-small font-semibold">{d.title}</p>
                  <p className="text-small text-muted">{d.shop}</p>
                  <Link href="/login" className="btn-accent btn-sm mt-1 w-full gap-1">
                    <TagIcon size={16} /> Claim offer
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <footer className="mt-6 border-t border-purple-100 bg-card py-6">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 text-small text-muted">
          <span className="flex items-center gap-2">
            <PhoneIcon size={16} /> 93 45 97 57 47
          </span>
          <span className="flex items-center gap-2">
            <ClockIcon size={16} /> 09:00 AM – 09:00 PM
          </span>
          <span>© OfferBuzz</span>
        </div>
      </footer>
    </main>
  );
}
