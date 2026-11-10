import Link from 'next/link';

export type Crumb = { label: string; href?: string };

/** "Home > Fashion > Offer title": every step but the last is a link. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="container-page pt-4">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-small text-muted">
        {[{ label: 'Home', href: '/' }, ...items].map((c, i, all) => (
          <li key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
            {i > 0 && <span aria-hidden>›</span>}
            {c.href && i < all.length - 1 ? (
              <Link href={c.href} className="font-semibold text-purple-700 hover:underline">{c.label}</Link>
            ) : (
              <span aria-current={i === all.length - 1 ? 'page' : undefined} className={`truncate ${i === all.length - 1 ? 'max-w-[60vw] font-semibold text-ink' : ''}`}>{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
