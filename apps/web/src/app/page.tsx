/* eslint-disable @next/next/no-img-element */
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { PublicOfferDTO } from '@offerbuzz/shared';
import { BottomNav, type NavKey } from '@/components/home/BottomNav';
import { HomeHeader } from '@/components/home/HomeHeader';
import { LocationPrompt } from '@/components/maps/LocationPrompt';
import { OfferCard } from '@/components/OfferCard';
import { Reveal } from '@/components/Reveal';
import { getNearbyOffers } from '@/lib/api';
import { useVisitorLocation } from '@/lib/location';
import { HeroRail } from '@/components/home/HeroRail';
import { Burst, InfoStrip, OffPill, PromoCard } from '@/components/home/PromoCard';
import { SiteFooter } from '@/components/SiteFooter';
import { ChevronRightIcon, DuoHeartIcon, DuoPinIcon, DuoStoreIcon, DuoTagIcon, HeartIcon, TagIcon } from '@/components/Icons';

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
// `image` is an optional wide banner photo in public/banners; until it exists the category art is used instead.
const banners = [
  { cat: 1, title: 'Festive fashion sale', sub: 'New styles from local boutiques', off: 'UP TO 50% OFF', image: '/banners/fashion.webp' },
  { cat: 2, title: 'Latest gadgets, best prices', sub: 'Phones, laptops and accessories nearby', off: 'UP TO 20% OFF', image: '/banners/electronics.webp' },
  { cat: 0, title: 'Fresh groceries, daily savings', sub: 'Stock up at your neighbourhood store', off: 'FLAT 15% OFF', image: '/banners/grocery.webp' },
  { cat: 11, title: 'Weekend getaway packages', sub: 'Short trips, great deals', off: '15% OFF', image: '/banners/travel.webp' },
];

const perks = [
  { icon: DuoTagIcon, text: 'Best offers near you' },
  { icon: DuoStoreIcon, text: 'Shop local, save more' },
  { icon: DuoPinIcon, text: 'Discover new stores' },
  { icon: DuoHeartIcon, text: 'Support small businesses' },
];

const NEARBY_RADIUS_KM = 15;
const REFRESH_MS = 60_000;

function SectionHead({ title, live }: { title: string; live?: boolean }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-section font-bold text-ink">
        {title}
        {live && (
          <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold uppercase text-green-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-600" />
            </span>
            Live
          </span>
        )}
      </h2>
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
  const [tab, setTab] = useState<'near' | 'top'>('top');
  const [tabTouched, setTabTouched] = useState(false);
  const [nav, setNav] = useState<NavKey>('home');

  // offers from shops near the visitor, refreshed every minute while the page is open
  const { coords, name: placeLabel, status, request } = useVisitorLocation();
  const [nearby, setNearby] = useState<PublicOfferDTO[]>([]);
  const [nearbyLoaded, setNearbyLoaded] = useState(false);
  useEffect(() => {
    if (!coords) return;
    let stopped = false;
    const load = () =>
      getNearbyOffers(coords.lat, coords.lng, NEARBY_RADIUS_KM)
        .then((r) => {
          if (stopped) return;
          setNearby(r.offers);
          setNearbyLoaded(true);
        })
        .catch(() => undefined); // keep what is on screen; the next tick retries
    void load();
    const id = setInterval(() => {
      if (!document.hidden) void load();
    }, REFRESH_MS);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [coords]);

  // show the nearby tab on its own as soon as there is something to show, unless the visitor already chose
  useEffect(() => {
    if (!tabTouched && nearby.length > 0) setTab('near');
  }, [nearby, tabTouched]);

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

  useEffect(() => {
    const onScroll = () => window.scrollY < 80 && setNav('home');
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const selectNav = (k: NavKey) => {
    setNav(k);
    if (k === 'home') window.scrollTo({ top: 0, behavior: 'smooth' });
    if (k === 'categories') goTo('categories');
    if (k === 'near') {
      setTab('near');
      setTabTouched(true);
      goTo('offers');
    }
  };

  const shownDeals = theme ? deals.filter((d) => categories[d.cat] === theme) : deals;
  const locationLabel = coords ? (placeLabel ?? 'Near you') : status === 'asking' ? 'Locating...' : 'Select location';
  const locationHint = coords ? 'Showing offers near you' : 'Tap to see offers near you';

  return (
    <main style={{ backgroundColor: theme ? theme.from : undefined }} className="min-h-screen pb-24 transition-colors duration-500 md:pb-0">
      <LocationPrompt />

      <HomeHeader
        categories={categories}
        promos={banners}
        active={active}
        onPick={setActive}
        query={query}
        onQuery={setQuery}
        onScan={onScan}
        locationLabel={locationLabel}
        locationHint={locationHint}
        onLocation={request}
      />

      <div className="container-page space-y-7 py-5 md:py-6">
        {/* hero: a rail of banner cards, one new card every 10 seconds */}
        <Reveal>
          <HeroRail label="Featured offers">
            {/* intro card */}
            <div className="h-[290px] overflow-hidden rounded-2xl shadow-card md:h-[310px]">
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
              <span className="text-[34px] font-black uppercase leading-[0.95] tracking-tight [text-shadow:0_2px_14px_rgba(255,255,255,0.55)] md:text-[40px]">Sale is live</span>
              <OffPill>50 - 80% Off</OffPill>
              <InfoStrip>Up to Rs 100 instant off on your first order</InfoStrip>
            </PromoCard>

            <PromoCard theme="indigo" image="/banners/fashion.webp" label="Festivals of India" href={`/search?category=${encodeURIComponent('Fashion')}`}
              burst={<Burst lines={['BIG', 'SAVE', 'DAYS']} size={60} />}>
              <span className="font-serif text-[34px] font-bold uppercase leading-[0.95] tracking-wide md:text-[38px]">Festivals</span>
              <span className="-mt-2 font-serif text-[20px] uppercase tracking-[0.2em] text-white/90">of India</span>
              <span aria-hidden className="h-px w-28 bg-gradient-to-r from-amber-300 to-transparent" />
              <span className="text-[22px] font-bold text-amber-200">From Rs 99</span>
            </PromoCard>

            <PromoCard theme="teal" image="/banners/grocery.webp" label="Fresh groceries" href={`/search?category=${encodeURIComponent('Grocery')}`}
              burst={<Burst lines={['FRESH', 'EVERY', 'DAY']} size={62} />}>
              <span className="text-[30px] font-black uppercase leading-[0.98] tracking-tight md:text-[34px]">Fresh groceries</span>
              <span className="text-[15px] font-medium text-white/90">Stock up at your neighbourhood store</span>
              <OffPill>Min. 15% Off</OffPill>
            </PromoCard>

            <PromoCard theme="orange" image="/banners/travel.webp" label="Weekend getaways" href={`/search?category=${encodeURIComponent('Travels')}`}
              burst={<Burst lines={['WEEK', 'END', 'SALE']} size={62} />}>
              <span className="text-[30px] font-black uppercase leading-[0.98] tracking-tight md:text-[34px]">Weekend getaways</span>
              <span className="text-[15px] font-medium text-white/95">Short trips, great deals</span>
              <OffPill>Up to 30% Off</OffPill>
            </PromoCard>

            <PromoCard theme="gold" dark image="/categories/home.webp" label="First order offer">
              <span className="text-small font-extrabold uppercase tracking-wider text-purple-800">First order</span>
              <span className="text-[44px] font-black leading-none md:text-[52px]">Rs 50 off</span>
              <InfoStrip>Claim it on your first order</InfoStrip>
            </PromoCard>
          </HeroRail>
        </Reveal>

        {/* offers: near you / top deals */}
        <section id="offers" className="scroll-mt-4">
          <div role="tablist" aria-label="Offers" className="relative mb-4 grid grid-cols-2 rounded-full bg-purple-100 p-1">
            <span
              aria-hidden
              className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-card shadow-card transition-transform duration-300 ease-out"
              style={{ transform: tab === 'near' ? 'translateX(0)' : 'translateX(100%)' }}
            />
            {([['near', 'Near you'], ['top', 'Top deals']] as const).map(([k, label]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tab === k}
                onClick={() => {
                  setTab(k);
                  setTabTouched(true);
                }}
                className={`relative z-10 min-h-touch rounded-full text-body font-bold transition-colors ${tab === k ? 'text-purple-800' : 'text-purple-600'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div key={tab} className="ob-fade-up">
            {tab === 'near' ? (
              nearby.length > 0 ? (
                <>
                  <SectionHead title="Offers near you" live />
                  <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 lg:grid-cols-6">
                    {nearby.map((o, i) => (
                      <Reveal key={o.id} delay={i * 60} className="w-[200px] shrink-0 snap-start md:w-auto">
                        <OfferCard o={o} />
                      </Reveal>
                    ))}
                  </div>
                </>
              ) : (
                <div className="surface flex flex-col items-center gap-3 p-8 text-center">
                  <DuoPinIcon size={56} />
                  {!coords ? (
                    <>
                      <p className="text-section font-bold">See deals from shops around you</p>
                      <p className="text-muted">Share your location and we will show offers within {NEARBY_RADIUS_KM} km.</p>
                      <button type="button" onClick={request} className="btn-primary px-6">Use my location</button>
                    </>
                  ) : (
                    <>
                      <p className="text-section font-bold">{nearbyLoaded ? 'No offers near you yet' : 'Looking for offers near you...'}</p>
                      <p className="text-muted">
                        {nearbyLoaded ? `New shops join every day. Check Top deals while you wait.` : 'This updates on its own.'}
                      </p>
                    </>
                  )}
                </div>
              )
            ) : (
              <>
                <SectionHead title="Don't Miss Your Best Offers" />
                {shownDeals.length === 0 ? (
                  <p className="surface p-6 text-center text-muted">No deals in this category yet. Pick All to see everything.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                    {shownDeals.map((d, i) => (
                      <Reveal key={d.title} delay={i * 60}>
                        <article className="surface-hover relative h-full overflow-hidden rounded-lg">
                          <span className="badge-discount absolute left-2 top-2 z-10">{d.off}</span>
                          <button
                            type="button"
                            aria-label="Save offer"
                            className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card/90 text-purple-700 shadow-card transition active:scale-90 hover:text-danger"
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
                      </Reveal>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* shop by category */}
        <section id="categories" className="scroll-mt-4">
          <SectionHead title="Shop by Category" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {categories.map((c, i) => (
              <Reveal key={c.slug} delay={(i % 4) * 70}>
                <button
                  type="button"
                  onClick={() => {
                    setActive(i);
                    setTab('top');
                    setTabTouched(true);
                    goTo('offers');
                  }}
                  className={`group flex h-full w-full flex-col rounded-lg bg-card p-3 text-left shadow-card transition duration-200 active:scale-[0.98] md:hover:-translate-y-0.5 md:hover:shadow-card-hover ${
                    active === i ? 'ring-2 ring-purple-600' : ''
                  }`}
                >
                  <h3 className="line-clamp-2 min-h-[2.5rem] text-body font-bold leading-tight text-ink">{c.name}</h3>
                  <div style={{ backgroundImage: `linear-gradient(120deg, ${c.from}, ${c.to})` }} className="mt-2 aspect-square overflow-hidden rounded-md">
                    <img src={`/categories/${c.slug}.webp`} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                  </div>
                  <p className="mt-2 text-small text-muted">{c.offers} offers</p>
                  <span className={`text-small font-semibold ${c.text}`}>Shop now</span>
                </button>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <ul className="surface mt-4 grid grid-cols-2 gap-4 p-4 md:grid-cols-4">
              {perks.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-small font-semibold uppercase text-ink">
                  <Icon size={40} className="shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </Reveal>
        </section>
      </div>

      <SiteFooter />
      <BottomNav active={nav} onSelect={selectNav} onScan={onScan} />
    </main>
  );
}
