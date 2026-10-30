/* eslint-disable @next/next/no-img-element */

/**
 * Full screen loading state: the OfferBuzz mark on a white disc, a spinning ring around it, a sliding bar across the
 * top and bouncing dots. It replaces the blank screen while a page is getting its data.
 */
export function PageLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-[#f5f3fb]">
      {/* indeterminate bar along the top */}
      <span aria-hidden className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-purple-100">
        <span className="ob-bar block h-full w-1/3 rounded-full bg-accent" />
      </span>

      <div className="relative flex h-28 w-28 items-center justify-center">
        <span aria-hidden className="absolute inset-0 animate-spin rounded-full border-4 border-purple-100 border-t-purple-600 [animation-duration:1.1s] motion-reduce:animate-none" />
        <span aria-hidden className="absolute inset-3 animate-ping rounded-full bg-purple-300/30 [animation-duration:2s] motion-reduce:hidden" />
        <span className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white shadow-card ob-pop">
          <img src="/brand/icon-512.png" alt="" className="h-12 w-12" />
        </span>
      </div>

      <div className="flex items-center gap-2 text-body font-semibold text-purple-900">
        {label}
        <span aria-hidden className="flex items-end gap-1 pb-1">
          {[0, 150, 300].map((d) => (
            <span key={d} style={{ animationDelay: `${d}ms` }} className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-500 motion-reduce:animate-none" />
          ))}
        </span>
      </div>
    </div>
  );
}

/** A small inline spinner with a label, for a section that is still loading. */
export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <p role="status" className="flex items-center justify-center gap-3 py-8 text-muted">
      <span aria-hidden className="h-5 w-5 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600 motion-reduce:animate-none" />
      {label}
    </p>
  );
}
