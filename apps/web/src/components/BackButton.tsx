/** Consistent back control: chevron + label, 44px touch target, visible hover/focus/pressed states. */
export function BackButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group -ml-2 inline-flex min-h-touch items-center gap-1 rounded-md pl-1 pr-3 text-body font-semibold text-purple-700
        transition duration-150 hover:bg-purple-100 hover:text-purple-900 active:scale-95"
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="transition-transform duration-150 group-hover:-translate-x-0.5"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
      {children}
    </button>
  );
}
