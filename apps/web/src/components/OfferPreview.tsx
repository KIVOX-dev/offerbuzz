/* eslint-disable @next/next/no-img-element */
import type { DiscountType } from '@offerbuzz/shared';
import { TagIcon } from './Icons';

export type OfferPreviewData = {
  title: string;
  description: string;
  category: string;
  area: string;
  discountType: DiscountType;
  discountValue: string;
  startsAt: string;
  endsAt: string;
  terms: string;
  shop: string;
  imageSrc?: string;
};

const fmt = (d: string) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

export function discountLabel(type: DiscountType, value: string): string {
  if (type === 'deal') return 'SPECIAL DEAL';
  if (!value) return type === 'percent' ? '% OFF' : 'Rs OFF';
  return type === 'percent' ? `${value}% OFF` : `Rs ${value} OFF`;
}

/** How the offer will look to customers. Shows placeholders until the vendor fills each field in. */
export function OfferPreview({ d }: { d: OfferPreviewData }) {
  const dates = d.startsAt && d.endsAt ? `Valid ${fmt(d.startsAt)} to ${fmt(d.endsAt)}` : d.endsAt ? `Valid until ${fmt(d.endsAt)}` : 'Choose the dates';
  return (
    <article className="surface overflow-hidden" aria-label="Offer preview">
      <div className="relative aspect-[4/3] bg-purple-50">
        {d.imageSrc ? (
          <img src={d.imageSrc} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-purple-300">
            <TagIcon size={48} />
            <span className="text-small">Your photo appears here</span>
          </div>
        )}
        <span className="badge-discount absolute left-3 top-3">{discountLabel(d.discountType, d.discountValue)}</span>
      </div>
      <div className="space-y-2 p-4">
        <p className="text-small font-semibold text-purple-700">{d.shop || 'Your shop'}</p>
        <h3 className={`text-section font-bold leading-snug ${d.title ? '' : 'text-muted'}`}>{d.title || 'Your offer title'}</h3>
        <p className="text-small text-muted">
          {d.category || 'Category'} · {d.area || 'Area'}
        </p>
        <p className={`line-clamp-3 text-small ${d.description ? '' : 'text-muted'}`}>
          {d.description || 'Your description will show here so customers know what they get.'}
        </p>
        <p className="text-small font-semibold">{dates}</p>
        {d.terms && <p className="text-small text-muted">Terms: {d.terms}</p>}
        <button type="button" disabled className="btn-accent mt-1 w-full gap-2 !opacity-100">
          <TagIcon size={18} /> Claim offer
        </button>
      </div>
    </article>
  );
}
