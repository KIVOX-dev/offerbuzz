/* eslint-disable @next/next/no-img-element */
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { PublicOfferDTO } from '@offerbuzz/shared';
import { LocationPrompt } from '@/components/maps/LocationPrompt';
import { discountLabel } from '@/components/OfferPreview';
import { getNearbyOffers } from '@/lib/api';
import { useVisitorLocation } from '@/lib/location';
import { Carousel } from '@/components/Carousel';
import { Logo } from '@/components/Logo';
import { SiteFooter } from '@/components/SiteFooter';
import { ScanButton } from '@/components/Scanner';
import {
  ArrowRightIcon,
  ChevronRightIcon,
  DuoCategoryIcon,
  DuoHeartIcon,
  DuoOffersIcon,
  DuoPinIcon,
  DuoStoreIcon,
  DuoTagIcon,
  HeartIcon,
  PinIcon,
  SearchIcon,
  TagIcon,
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
  { title: 'Buy 1 Get 1 on meals', shop: 'Food & Beverages', off: 'BUY 1 GET 1', cat: 8 },
];

// Banner slides after the intro slide; indexes point into `categories`. Sample copy until the API feeds real offers.
const banners = [
  { cat: 1, title: 'Festive fashion sale', sub: 'New styles from local boutiques', off: 'UP TO 50% OFF' },
  { cat: 2, title: 'Latest gadgets, best prices', sub: 'Phones, laptops and accessories nearby', off: 'UP TO 20% OFF' },
  { cat: 0, title: 'Fresh groceries, daily savings', sub: 'Stock up at your neighbourhood store', off: 'FLAT 15% OFF' },
  { cat: 11, title: 'Weekend getaway packages', sub: 'Short trips, great deals', off: '15% OFF' },
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
  const router = useRouter();
  const [query, setQuery] = useState('');

  // offers from shops near the visitor, once they have shared their location
  const { coords, name: placeLabel, status, request } = useVisitorLocation();
  const [nearby, setNearby] = useState<PublicOfferDTO[]>([]);
  useEffect(() => {
    if (!coords) return;
    getNearbyOffers(coords.lat, coords.lng, 15)
      .then((r) => setNearby(r.offers))
      .catch(() => setNearby([]));
  }, [coords]);

  // an OfferBuzz link opens straight away; anything else (a product barcode, plain text) fills the search box
  const onScan = useCallback(
    (text: string) => {
      try {
        const url = new URL(text);
        if (url.origin === window.location.origin) return router.push(url.pathname + url.search);
      } catch {
        /* not a URL */
      }
      setQuery(text);
    },
    [router],
  );
  const shownDeals = theme ? deals.filter((d) => categories[d.cat] === theme) : deals;

  return (
    <main
      style={{ backgroundColor: theme ? theme.from : undefined }}
      className="min-h-screen transition-colors duration-500"
    >
      <LocationPrompt />
      <div className="h-1 bg-brand" aria-hidden />

      <header className="sticky top-0 z-20 border-b border-purple-100 bg-card">
        <div className="container-page flex items-center gap-3 py-2 md:h-header md:py-0">
          <Logo height={48} />

          <button type="button" onClick={request} className="hidden items-center gap-1 rounded-md px-2 py-1 text-small text-ink hover:bg-purple-50 md:flex">
            <PinIcon className="text-purple-700" />
            <span className="text-left leading-tight">
              <span className="block text-muted">Your Location</span>
              <span className="font-semibold">{coords ? (placeLabel ?? 'Near you') : status === 'asking' ? 'Locating...' : 'Select a Location'}</span>
            </span>
          </button>

          <form action="/login" className="hidden h-search flex-1 md:flex">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input h-full rounded-none border-r-0"
              placeholder="Search offers, shops and categories"
              aria-label="Search"
            />
            <ScanButton onResult={onScan} className="flex w-12 items-center justify-center border-y border-purple-200 bg-card text-purple-700 hover:bg-purple-50" />
            <button type="submit" aria-label="Search" className="flex w-12 items-center justify-center rounded-r-md bg-accent text-ink hover:brightness-105">
              <SearchIcon />
            </button>
          </form>

          <div className="ml-auto flex items-center gap-1">
            <Link href="/login" aria-label="Saved offers" className="btn-ghost !px-2">
              <HeartIcon />
            </Link>
          </div>
        </div>

        {/* mobile location */}
        <button type="button" onClick={request} className="container-page flex w-full items-center gap-1.5 pb-2 text-left text-small md:hidden">
          <PinIcon size={16} className="shrink-0 text-purple-700" />
          <span className="truncate font-semibold">{coords ? (placeLabel ?? 'Near you') : status === 'asking' ? 'Locating...' : 'Select a Location'}</span>
        </button>

        {/* mobile search */}
        <form action="/login" className="container-page flex pb-2 md:hidden">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input rounded-none border-r-0"
            placeholder="Search offers and shops"
            aria-label="Search"
          />
          <ScanButton onResult={onScan} className="flex w-12 items-center justify-center border-y border-purple-200 bg-card text-purple-700" />
          <button type="submit" aria-label="Search" className="flex w-12 items-center justify-center rounded-r-md bg-accent text-ink">
            <SearchIcon />
          </button>
        </form>
      </header>

      {/* category strip */}
      <nav aria-label="Categories" className="border-b border-purple-100 bg-card">
        <ul className="container-page flex gap-1 overflow-x-auto pt-2 [scrollbar-width:none]">
          {[{ name: 'All', slug: 'all', from: '#e9e4fb', to: '#ffffff' }, ...categories].map((c, i) => {
            const on = active === i - 1;
            return (
              <li key={c.name} className="w-[84px] shrink-0">
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => setActive(i - 1)}
                  className="flex w-full flex-col items-center gap-1 pb-0 text-small"
                >
                  <span
                    style={on ? { backgroundImage: `linear-gradient(180deg, ${c.from}, ${c.to})` } : undefined}
                    className="flex h-14 w-14 items-center justify-center rounded-xl transition"
                  >
                    <DuoCategoryIcon slug={c.slug} plain size={38} style={{ color: '#ffd60a' }} />
                  </span>
                  <span className={`w-full truncate px-1 text-center ${on ? 'font-bold text-ink' : 'font-medium text-ink'}`}>{c.name}</span>
                  <span className={`h-[3px] w-full rounded-full transition ${on ? 'bg-purple-600' : 'bg-transparent'}`} />
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="container-page space-y-6 py-4 md:py-6">
        {/* hero */}
        <section className="grid gap-4 md:grid-cols-3">
          <Carousel label="Featured offers" className="min-h-[380px] md:col-span-2">
            <div className="relative flex h-full items-center overflow-hidden bg-hero px-6 pb-12 pt-8 text-white md:px-12">
              {/* soft glows and a faint dot grid */}
              <span aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-purple-400/25 blur-3xl" />
              <span aria-hidden className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.12]"
                style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '22px 22px' }}
              />

              <div className="relative z-10 max-w-[480px] md:max-w-[52%]">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-small font-semibold text-accent backdrop-blur">
                  <TagIcon size={14} /> Shop more. Save more.
                </span>
                <h1 className="mt-5 text-[34px] font-extrabold leading-[1.05] tracking-tight md:text-[38px] lg:text-[52px]">
                  Offers and deals <span className="bg-gradient-to-r from-accent to-amber-300 bg-clip-text text-transparent">near you</span>
                </h1>
                <p className="mt-4 max-w-md text-body text-purple-100 md:text-[17px]">
                  Don&apos;t miss the best offers from your favourite local stores.
                </p>
                <ul className="mt-6 flex flex-wrap gap-2 text-small font-medium">
                  {['Free for customers', 'Verified local shops', 'New offers daily'].map((t) => (
                    <li key={t} className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-ink">✓</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              {/* floating offer cards */}
              <div aria-hidden className="pointer-events-none absolute inset-y-0 right-4 hidden w-[40%] md:block lg:right-12 lg:w-[44%]">
                {[
                  { cat: 0, off: '30% OFF', cls: 'left-[2%] top-[14%] -rotate-6 w-[46%]' },
                  { cat: 1, off: 'BUY 1 GET 1', cls: 'right-[4%] top-[8%] rotate-6 w-[44%]' },
                  { cat: 2, off: '20% OFF', cls: 'left-[26%] bottom-[14%] rotate-2 w-[48%]' },
                ].map((c) => (
                  <div
                    key={c.cat}
                    className={`absolute overflow-hidden rounded-xl border-4 border-white bg-white shadow-2xl ${c.cls}`}
                  >
                    <span className="absolute left-2 top-2 z-10 rounded-full bg-accent px-2 py-0.5 text-[11px] font-extrabold text-ink">{c.off}</span>
                    <div style={{ backgroundImage: `linear-gradient(120deg, ${categories[c.cat].from}, ${categories[c.cat].to})` }} className="aspect-[4/3]">
                      <img src={`/categories/${categories[c.cat].slug}.webp`} alt="" className="h-full w-full object-cover" />
                    </div>
                    <p className="truncate px-2.5 py-1.5 text-[12px] font-bold text-ink">{categories[c.cat].name}</p>
                  </div>
                ))}
              </div>
            </div>
            {banners.map((b) => {
              const c = categories[b.cat];
              return (
                <div
                  key={b.title}
                  style={{ backgroundImage: `linear-gradient(120deg, ${c.from}, ${c.to})` }}
                  className="relative flex h-full items-center overflow-hidden p-6 pb-10 md:p-10 md:pb-12"
                >
                  <img
                    src={`/categories/${c.slug}.webp`}
                    alt=""
                    className="pointer-events-none absolute inset-y-0 right-0 h-full w-1/2 object-cover mix-blend-multiply"
                  />
                  <div className="relative max-w-[55%]">
                    <span className={`inline-flex rounded-full bg-white/80 px-3 py-1 text-small font-bold ${c.text}`}>{b.off}</span>
                    <h2 className="mt-3 text-[26px] font-extrabold leading-tight tracking-tight text-ink md:text-[34px]">{b.title}</h2>
                    <p className="mt-2 text-body text-ink/70">{b.sub}</p>
                    <button type="button" onClick={() => setActive(b.cat)} className={`btn mt-5 px-5 text-white ${c.btn}`}>
                      Shop {c.name.split(' ')[0]}
                    </button>
                  </div>
                </div>
              );
            })}
          </Carousel>

          <div className="relative flex flex-col justify-center gap-3 overflow-hidden rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white p-6 text-center shadow-card md:p-8">
            <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/30 blur-2xl" />
            <DuoOffersIcon size={64} className="relative mx-auto" />
            <p className="relative text-small font-bold uppercase tracking-wider text-purple-700">First order</p>
            <h2 className="relative text-[30px] font-extrabold leading-none text-ink">Rs 50 off</h2>
            <p className="relative text-muted">Claim it on your first order.</p>
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

        {/* offers from shops near the visitor */}
        {nearby.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-section font-bold">Offers near you</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              {nearby.map((o) => (
                <Link key={o.id} href={`/offers/${o.id}`} className="surface-hover relative block overflow-hidden rounded-lg">
                  <span className="badge-discount absolute left-2 top-2 z-10">
                    {discountLabel(o.discountType, o.discountValue === undefined ? '' : String(o.discountValue))}
                  </span>
                  <div className="aspect-[4/3] bg-purple-50">
                    {o.imageUrl && <img src={o.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />}
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="line-clamp-2 text-small font-semibold">{o.title}</p>
                    <p className="text-small text-muted">{o.shop.name}</p>
                    {o.distanceKm !== undefined && <p className="text-small font-semibold text-purple-700">{o.distanceKm < 1 ? 'Under 1 km' : `${o.distanceKm.toFixed(1)} km away`}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

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

      <SiteFooter />
    </main>
  );
}
