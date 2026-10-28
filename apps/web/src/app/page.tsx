/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import {
  ChevronRightIcon,
  ClockIcon,
  HeartIcon,
  PhoneIcon,
  PinIcon,
  SearchIcon,
  StoreIcon,
  TagIcon,
  UserIcon,
} from '@/components/Icons';

const IMG = 'https://offerbuzz.co/wp-content/uploads/2026/09';

// Categories as listed on offerbuzz.co
const categories = [
  { name: 'Salon & Spa', img: 'SALON-600x800.png' },
  { name: 'Fashion', img: 'FASHION-1-600x800.png' },
  { name: 'Mobile & Electronics', img: 'MOBILE-600x800.png' },
  { name: 'Travels', img: 'TRAVELS-5-600x800.png' },
  { name: 'Home Appliance', img: 'HOME-APPLIANCE-2-600x800.png' },
  { name: 'Gifts & Toys', img: 'GIFTS-2-600x800.png' },
  { name: 'Fitness & Sports', img: 'FITNESS-1-600x800.png' },
  { name: 'Food & Restaurant', img: 'FOOD-RESTURANT-1-600x800.png' },
  { name: 'Education', img: 'EDUCATION-2-600x800.png' },
  { name: 'Grocery', img: 'GROCERY-2-600x800.png' },
  { name: 'Medical', img: 'MEDICAL-2-600x800.png' },
  { name: 'Cafe & Bakeries', img: 'CAFE-1-600x800.png' },
  { name: 'Automobiles', img: 'TWO-WHEELER-2-600x800.png' },
  { name: 'Baby Products', img: 'Baby-Products-600x800.png' },
  { name: 'Real Estate', img: 'REAL-ESTATE-600x800.png' },
  { name: 'Jewellery', img: 'JEWELLERY-2-600x800.png' },
];

// Sample deal cards until the Phase 2 API feeds real offers.
const deals = [
  { title: 'Flat 30% off on first visit', shop: 'Salon & Spa', off: '30% OFF', cat: 0 },
  { title: 'Festive fashion sale', shop: 'Fashion', off: 'UP TO 50% OFF', cat: 1 },
  { title: 'Latest phones, best prices', shop: 'Mobile & Electronics', off: 'UP TO 20% OFF', cat: 2 },
  { title: 'Weekend getaway packages', shop: 'Travels', off: '15% OFF', cat: 3 },
  { title: 'Kitchen appliance combo', shop: 'Home Appliance', off: 'UP TO 40% OFF', cat: 4 },
  { title: 'Buy 1 Get 1 on meals', shop: 'Food & Restaurant', off: 'BOGO', cat: 7 },
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
  return (
    <main>
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
          {categories.map((c) => (
            <li key={c.name} className="shrink-0">
              <Link href="/login" className="chip">
                {c.name}
              </Link>
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
            {categories.map((c) => (
              <Link key={c.name} href="/login" className="surface-hover group overflow-hidden">
                <div className="aspect-[3/4] overflow-hidden bg-purple-50">
                  <img
                    src={`${IMG}/${c.img}`}
                    alt={c.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
                <p className="p-2 text-center text-small font-semibold">{c.name}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* deals */}
        <section>
          <SectionHead title="Don't Miss Your Best Offers" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {deals.map((d) => (
              <article key={d.title} className="surface-hover relative overflow-hidden">
                <span className="badge-discount absolute left-2 top-2 z-10">{d.off}</span>
                <button
                  type="button"
                  aria-label="Save offer"
                  className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card/90 text-purple-700 shadow-card hover:text-danger"
                >
                  <HeartIcon size={16} />
                </button>
                <div className="aspect-square overflow-hidden bg-purple-50">
                  <img src={`${IMG}/${categories[d.cat].img}`} alt="" loading="lazy" className="h-full w-full object-cover" />
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
