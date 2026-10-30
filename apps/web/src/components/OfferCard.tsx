/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import type { PublicOfferDTO } from '@offerbuzz/shared';
import { HeartIcon } from './Icons';
import { discountLabel } from './OfferPreview';
import { useSaved } from '@/lib/saved';

/** "Ends today", "Ends tomorrow", "Ends in 3 days" for an end date (YYYY-MM-DD). */
export function endsLabel(endsAt: string): string {
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`).getTime();
  const days = Math.round((new Date(`${endsAt}T00:00:00Z`).getTime() - today) / 86_400_000);
  return days <= 0 ? 'Ends today' : days === 1 ? 'Ends tomorrow' : `Ends in ${days} days`;
}

/** An offer card for the home page and search results: photo, discount, shop, distance and when it ends. */
export function OfferCard({ o }: { o: PublicOfferDTO }) {
  const { has, toggle } = useSaved();
  const saved = has(o.id);
  return (
    <Link href={`/offers/${o.id}`} className="surface-hover relative flex h-full flex-col overflow-hidden rounded-lg active:scale-[0.98]">
      <span className="badge-discount absolute left-2 top-2 z-10">
        {discountLabel(o.discountType, o.discountValue === undefined ? '' : String(o.discountValue))}
      </span>
      <button
        type="button"
        aria-label={saved ? 'Remove from saved' : 'Save offer'}
        aria-pressed={saved}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle(o.id);
        }}
        className={`absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card/90 shadow-card transition active:scale-90 ${saved ? 'text-danger' : 'text-purple-700 hover:text-danger'}`}
      >
        <HeartIcon size={16} fill={saved ? 'currentColor' : 'none'} />
      </button>
      <div className="aspect-[4/3] bg-purple-50">
        {o.imageUrl && <img src={o.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 min-h-[2.5rem] text-small font-semibold">{o.title}</p>
        <p className="truncate text-small text-muted">{o.shop.name}</p>
        <p className="mt-auto flex items-center justify-between pt-1 text-small font-semibold">
          <span className="text-purple-700">{o.distanceKm === undefined ? '' : o.distanceKm < 1 ? 'Under 1 km' : `${o.distanceKm.toFixed(1)} km away`}</span>
          <span className="text-amber-700">{endsLabel(o.endsAt)}</span>
        </p>
      </div>
    </Link>
  );
}
