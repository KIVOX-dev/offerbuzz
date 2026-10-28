import Link from 'next/link';
import { Logo } from '@/components/Logo';
import {
  ArrowRightIcon,
  CategoryIcon,
  type CategoryIconName,
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

type Category = { name: string; icon: CategoryIconName; tile: string; text: string; btn: string };

// Categories as listed on offerbuzz.co, each with its own pastel tone.
const categories: Category[] = [
  { name: 'Salon & Spa', icon: 'salon', tile: 'bg-pink-50', text: 'text-pink-500', btn: 'bg-pink-500' },
  { name: 'Fashion', icon: 'fashion', tile: 'bg-rose-50', text: 'text-rose-500', btn: 'bg-rose-500' },
  { name: 'Mobile & Electronics', icon: 'mobile', tile: 'bg-sky-50', text: 'text-sky-500', btn: 'bg-sky-600' },
  { name: 'Travels', icon: 'travels', tile: 'bg-cyan-50', text: 'text-cyan-600', btn: 'bg-cyan-600' },
  { name: 'Home Appliance', icon: 'appliance', tile: 'bg-amber-50', text: 'text-amber-500', btn: 'bg-amber-500' },
  { name: 'Gifts & Toys', icon: 'gifts', tile: 'bg-fuchsia-50', text: 'text-fuchsia-500', btn: 'bg-fuchsia-500' },
  { name: 'Fitness & Sports', icon: 'fitness', tile: 'bg-violet-50', text: 'text-violet-500', btn: 'bg-violet-600' },
  { name: 'Food & Restaurant', icon: 'food', tile: 'bg-red-50', text: 'text-red-500', btn: 'bg-red-500' },
  { name: 'Education', icon: 'education', tile: 'bg-indigo-50', text: 'text-indigo-500', btn: 'bg-indigo-600' },
  { name: 'Grocery', icon: 'grocery', tile: 'bg-green-50', text: 'text-green-600', btn: 'bg-green-600' },
  { name: 'Medical', icon: 'medical', tile: 'bg-emerald-50', text: 'text-emerald-500', btn: 'bg-emerald-600' },
  { name: 'Cafe & Bakeries', icon: 'cafe', tile: 'bg-orange-50', text: 'text-orange-500', btn: 'bg-orange-500' },
  { name: 'Automobiles', icon: 'auto', tile: 'bg-teal-50', text: 'text-teal-600', btn: 'bg-teal-600' },
  { name: 'Baby Products', icon: 'baby', tile: 'bg-blue-50', text: 'text-blue-500', btn: 'bg-blue-600' },
  { name: 'Real Estate', icon: 'realestate', tile: 'bg-lime-50', text: 'text-lime-600', btn: 'bg-lime-600' },
  { name: 'Jewellery', icon: 'jewellery', tile: 'bg-yellow-50', text: 'text-yellow-600', btn: 'bg-yellow-500' },
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

const perks = [
  { icon: TagIcon, text: 'Best offers near you' },
  { icon: StoreIcon, text: 'Shop local, save more' },
  { icon: PinIcon, text: 'Discover new stores' },
  { icon: HeartIcon, text: 'Support small businesses' },
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c) => (
              <Link
                key={c.name}
                href="/login"
                className={`group relative flex h-[150px] flex-col justify-between overflow-hidden rounded-md p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover ${c.tile}`}
              >
                <h3 className="max-w-[60%] text-body font-extrabold uppercase leading-tight text-ink">{c.name}</h3>
                <CategoryIcon
                  name={c.icon}
                  size={110}
                  className={`absolute -bottom-2 right-2 opacity-80 transition duration-300 group-hover:scale-110 ${c.text}`}
                />
                <span className={`inline-flex items-center gap-2 text-small font-semibold ${c.text}`}>
                  View All
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-white ${c.btn}`}>
                    <ArrowRightIcon size={16} />
                  </span>
                </span>
              </Link>
            ))}
          </div>

          <ul className="surface mt-4 grid grid-cols-2 gap-4 p-4 md:grid-cols-4">
            {perks.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-small font-semibold uppercase text-ink">
                <Icon size={28} className="shrink-0 text-purple-700" />
                {text}
              </li>
            ))}
          </ul>
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
                <div className={`flex aspect-[4/3] items-center justify-center ${categories[d.cat].tile}`}>
                  <CategoryIcon name={categories[d.cat].icon} size={72} className={categories[d.cat].text} />
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
