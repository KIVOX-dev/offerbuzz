'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CATEGORIES, SUBCATEGORIES, type PublicOfferDTO } from '@offerbuzz/shared';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteHits } from '@/components/SiteHits';
import { OfferCard } from '@/components/OfferCard';
import { Reveal } from '@/components/Reveal';
import { DuoOffersIcon } from '@/components/Icons';
import { searchOffers } from '@/lib/api';
import { useVisitorLocation } from '@/lib/location';

type Filters = {
  /** minimum percent off (percent offers only); 0 = any */
  minPercent: number;
  /** 'percent' | 'amount' | 'deal' | '' = any */
  type: string;
  /** days left at most; 0 = any */
  endsInDays: number;
  /** straight line distance at most, km; 0 = any */
  withinKm: number;
};
const NO_FILTERS: Filters = { minPercent: 0, type: '', endsInDays: 0, withinKm: 0 };

const daysLeft = (endsAt: string) => {
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`).getTime();
  return Math.round((new Date(`${endsAt}T00:00:00Z`).getTime() - today) / 86_400_000);
};

function matches(o: PublicOfferDTO, f: Filters): boolean {
  if (f.type && o.discountType !== f.type) return false;
  if (f.minPercent && !(o.discountType === 'percent' && (o.discountValue ?? 0) >= f.minPercent)) return false;
  if (f.endsInDays && daysLeft(o.endsAt) > f.endsInDays) return false;
  if (f.withinKm && !(o.distanceKm !== undefined && o.distanceKm <= f.withinKm)) return false;
  return true;
}

/** One block of the filter list: a bold heading, then its options. */
function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-purple-100 pb-4 last:border-0">
      <h2 className="mb-2 text-body font-bold">{title}</h2>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-body">
      <input type="checkbox" checked={on} onChange={onClick} className="h-4 w-4 accent-purple-700" />
      <span className={on ? 'font-semibold' : ''}>{children}</span>
    </label>
  );
}

function FilterPanel({
  category,
  subcategory,
  filters,
  setFilters,
  hasLocation,
  go,
}: {
  category: string;
  subcategory: string;
  filters: Filters;
  setFilters: (f: Filters) => void;
  hasLocation: boolean;
  go: (category: string, subcategory?: string) => void;
}) {
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setFilters({ ...filters, [k]: filters[k] === v ? NO_FILTERS[k] : v });
  const subs: readonly string[] = category ? SUBCATEGORIES[category as keyof typeof SUBCATEGORIES] ?? [] : [];
  return (
    <div className="space-y-4">
      <Group title="Category">
        {category && (
          <button type="button" onClick={() => go('')} className="text-small font-semibold text-purple-700 hover:underline">‹ All categories</button>
        )}
        {(category ? [category] : [...CATEGORIES]).map((c) => (
          <div key={c}>
            <button
              type="button"
              onClick={() => go(c)}
              className={`block w-full text-left text-body hover:text-purple-700 ${c === category && !subcategory ? 'font-bold text-purple-800' : ''}`}
            >
              {c}
            </button>
            {c === category && subs.length > 0 && (
              <ul className="ml-3 mt-1.5 space-y-1.5 border-l border-purple-100 pl-3">
                {subs.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => go(c, s === subcategory ? '' : s)}
                      className={`block w-full text-left text-body hover:text-purple-700 ${s === subcategory ? 'font-bold text-purple-800' : ''}`}
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </Group>

      <Group title="Discount">
        {[10, 25, 50].map((p) => (
          <Choice key={p} on={filters.minPercent === p} onClick={() => set('minPercent', p)}>{p}% off or more</Choice>
        ))}
      </Group>

      <Group title="Offer type">
        <Choice on={filters.type === 'percent'} onClick={() => set('type', 'percent')}>Percent off</Choice>
        <Choice on={filters.type === 'amount'} onClick={() => set('type', 'amount')}>Rupees off</Choice>
        <Choice on={filters.type === 'deal'} onClick={() => set('type', 'deal')}>Special deals (Buy 1 Get 1, gifts)</Choice>
      </Group>

      <Group title="Ending soon">
        <Choice on={filters.endsInDays === 1} onClick={() => set('endsInDays', 1)}>Today or tomorrow</Choice>
        <Choice on={filters.endsInDays === 7} onClick={() => set('endsInDays', 7)}>Within 7 days</Choice>
      </Group>

      <Group title="Distance">
        {hasLocation ? (
          [2, 5, 10, 25].map((k) => (
            <Choice key={k} on={filters.withinKm === k} onClick={() => set('withinKm', k)}>Within {k} km</Choice>
          ))
        ) : (
          <p className="text-small text-muted">Allow your location on the home page to filter by distance.</p>
        )}
      </Group>
    </div>
  );
}

function Results() {
  const router = useRouter();
  const params = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const category = params.get('category') ?? '';
  const subcategory = params.get('subcategory') ?? '';
  const { coords } = useVisitorLocation();
  const [offers, setOffers] = useState<PublicOfferDTO[]>();
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    let stale = false;
    setOffers(undefined);
    setError('');
    searchOffers({ q: q || undefined, category: category || undefined, subcategory: subcategory || undefined, lat: coords?.lat, lng: coords?.lng })
      .then((r) => !stale && setOffers(r.offers))
      .catch(() => !stale && setError('Could not search right now. Please try again.'));
    return () => {
      stale = true;
    };
  }, [q, category, subcategory, coords?.lat, coords?.lng]);

  // keep the typed words; change the category (and sub category)
  const go = (c: string, s = '') => {
    const next = new URLSearchParams();
    if (q) next.set('q', q);
    if (c) next.set('category', c);
    if (s) next.set('subcategory', s);
    const qs = next.toString();
    router.replace(qs ? `/search?${qs}` : '/search');
  };

  const shown = useMemo(() => offers?.filter((o) => matches(o, filters)), [offers, filters]);
  const active = Object.values(filters).filter(Boolean).length + (subcategory ? 1 : 0);
  const clear = () => {
    setFilters(NO_FILTERS);
    if (subcategory) go(category);
  };
  const title = subcategory ? `${category}: ${subcategory}` : category ? category : q ? `Results for "${q}"` : 'All offers';

  const panel = <FilterPanel category={category} subcategory={subcategory} filters={filters} setFilters={setFilters} hasLocation={!!coords} go={go} />;

  return (
    <main className="min-h-screen overflow-x-clip pb-10">
      <SiteHeader query={q} activeCategory={category} />
      <Breadcrumbs
        items={
          category
            ? [
                subcategory ? { label: category, href: `/search?category=${encodeURIComponent(category)}` } : { label: category },
                ...(subcategory ? [{ label: subcategory }] : []),
              ]
            : [{ label: q ? `Results for "${q}"` : 'All offers' }]
        }
      />

      <div className="container-page py-5 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
        {/* desktop: the filter list down the left, like a shop */}
        <aside aria-label="Filters" className="hidden lg:block">
          <div className="sticky top-44 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">{panel}</div>
        </aside>

        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-title font-bold">{title}</h1>
              {shown && shown.length > 0 && (
                <p className="text-small text-muted">
                  {shown.length} offer{shown.length > 1 ? 's' : ''}
                  {coords ? ', nearest first' : ''}
                </p>
              )}
            </div>
            {/* phones: one Filters button opens everything */}
            <button type="button" onClick={() => setSheet(true)} className="btn-outline gap-2 lg:hidden">
              Filters{active > 0 && <span className="rounded-full bg-purple-700 px-2 text-small text-white">{active}</span>}
            </button>
          </div>

          {active > 0 && (
            <button type="button" onClick={clear} className="text-small font-semibold text-purple-700 underline">
              Clear all filters
            </button>
          )}

          {error && <p role="alert" className="surface p-6 text-center text-muted">{error}</p>}
          {!error && offers === undefined && <p className="py-10 text-center text-muted">Searching...</p>}

          {shown && shown.length > 0 && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {shown.map((o, i) => (
                <Reveal key={o.id} delay={(i % 4) * 50}>
                  <OfferCard o={o} />
                </Reveal>
              ))}
            </div>
          )}

          {shown && shown.length === 0 && !error && (
            <div className="surface flex flex-col items-center gap-3 p-10 text-center">
              <DuoOffersIcon size={56} />
              <p className="text-section font-bold">{q || category || active ? 'No offers found' : 'No live offers yet'}</p>
              <p className="text-muted">
                {active ? 'Try removing a filter.' : q || category ? 'Try a different word, a shop name or another category.' : 'New shops post offers every day. Please check back soon.'}
              </p>
              {active > 0 ? (
                <button type="button" className="btn-primary px-6" onClick={clear}>Clear filters</button>
              ) : (
                <Link href="/" className="btn-primary px-6">Back to home</Link>
              )}
            </div>
          )}
          <SiteHits className="pt-4 text-center text-muted" />
        </div>
      </div>

      {/* phone filter sheet */}
      {sheet && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button type="button" aria-label="Close filters" className="absolute inset-0 bg-black/40" onClick={() => setSheet(false)} />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-2xl bg-card shadow-card-hover">
            <div className="flex items-center justify-between border-b border-purple-100 px-4 py-3">
              <h2 className="text-section font-bold">Filters</h2>
              <button type="button" className="btn-ghost btn-sm" onClick={() => setSheet(false)}>Close</button>
            </div>
            <div className="overflow-y-auto px-4 py-4">{panel}</div>
            <div className="flex gap-2 border-t border-purple-100 p-3">
              <button type="button" className="btn-outline flex-1" onClick={clear}>Clear</button>
              <button type="button" className="btn-primary flex-1" onClick={() => setSheet(false)}>
                Show {shown?.length ?? 0} offer{shown?.length === 1 ? '' : 's'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <Results />
    </Suspense>
  );
}
