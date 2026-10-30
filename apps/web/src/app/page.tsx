/* eslint-disable @next/next/no-img-element */
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { PublicOfferDTO } from '@offerbuzz/shared';
import { BottomNav, type NavKey } from '@/components/home/BottomNav';
import { HomeHeader } from '@/components/home/HomeHeader';
import { LocationPrompt } from '@/components/maps/LocationPrompt';
import { discountLabel } from '@/components/OfferPreview';
import { Reveal } from '@/components/Reveal';
import { getNearbyOffers } from '@/lib/api';
import { useVisitorLocation } from '@/lib/location';
import { Carousel } from '@/components/Carousel';
import { SiteFooter } from '@/components/SiteFooter';
import { ChevronRightIcon, DuoHeartIcon, DuoOffersIcon, DuoPinIcon, DuoStoreIcon, DuoTagIcon, HeartIcon, TagIcon } from '@/components/Icons';

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

const NEARBY_RADIUS_KM = 15;
const REFRESH_MS = 60_000;

/** "Ends today", "Ends tomorrow", "Ends in 3 days" for an end date (YYYY-MM-DD). */
function endsLabel(endsAt: string): string {
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`).getTime();
  const days = Math.round((new Date(`${endsAt}T00:00:00Z`).getTime() - today) / 86_400_000);
  return days <= 0 ? 'Ends today' : days === 1 ? 'Ends tomorrow' : `Ends in ${days} days`;
}

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
        {/* hero */}
        <Reveal>
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
                    <div key={c.cat} className={`absolute overflow-hidden rounded-xl border-4 border-white bg-white shadow-2xl ${c.cls}`}>
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
                        <Link href={`/offers/${o.id}`} className="surface-hover relative block overflow-hidden rounded-lg active:scale-[0.98]">
                          <span className="badge-discount absolute left-2 top-2 z-10">
                            {discountLabel(o.discountType, o.discountValue === undefined ? '' : String(o.discountValue))}
                          </span>
                          <div className="aspect-[4/3] bg-purple-50">
                            {o.imageUrl && <img src={o.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />}
                          </div>
                          <div className="space-y-1 p-3">
                            <p className="line-clamp-2 min-h-[2.5rem] text-small font-semibold">{o.title}</p>
                            <p className="truncate text-small text-muted">{o.shop.name}</p>
                            <p className="flex items-center justify-between text-small font-semibold">
                              <span className="text-purple-700">
                                {o.distanceKm === undefined ? '' : o.distanceKm < 1 ? 'Under 1 km' : `${o.distanceKm.toFixed(1)} km away`}
                              </span>
                              <span className="text-amber-700">{endsLabel(o.endsAt)}</span>
                            </p>
                          </div>
                        </Link>
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
