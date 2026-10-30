import type React from 'react';
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

export const SearchIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Svg>
);
export const PinIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Svg>
);
export const UserIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
  </Svg>
);
export const HeartIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 20s-8-4.6-8-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 8 2.8C20 15.4 12 20 12 20Z" />
  </Svg>
);
export const TagIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 12V4h8l10 10-8 8L3 12Z" />
    <circle cx="7.5" cy="8.5" r="1.2" />
  </Svg>
);
export const StoreIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 9 5.5 4h13L20 9M4 9v11h16V9M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9M10 20v-5h4v5" />
  </Svg>
);
export const ChevronRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m9 6 6 6-6 6" />
  </Svg>
);
export const ChevronLeftIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m15 6-6 6 6 6" />
  </Svg>
);
export const MenuIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Svg>
);
export const PhoneIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z" />
  </Svg>
);
export const ClockIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

const categoryPaths: Record<string, React.ReactNode> = {
  salon: (
    <>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12" />
    </>
  ),
  fashion: <path d="M8 3 3 6l2 4 3-1v12h8V9l3 1 2-4-5-3a4 4 0 0 1-8 0Z" />,
  mobile: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path d="M12 18h.01" />
    </>
  ),
  travels: (
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2Z" />
  ),
  appliance: (
    <>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <circle cx="12" cy="14" r="5" />
      <path d="M8 6h.01M12 6h.01" />
    </>
  ),
  gifts: (
    <>
      <rect x="3" y="8" width="18" height="4" />
      <path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" />
    </>
  ),
  fitness: <path d="M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11" />,
  food: <path d="M3 2v7a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6a2 2 0 0 0 2 2h3Zm0 0v7" />,
  education: <path d="M22 10 12 5 2 10l10 5 10-5ZM6 12v5c3 3 9 3 12 0v-5" />,
  grocery: (
    <>
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2 2h2l2.7 12.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6L22 7H5.1" />
    </>
  ),
  medical: <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z" />,
  cafe: <path d="M17 8h1a4 4 0 0 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4ZM6 2v2M10 2v2M14 2v2" />,
  auto: (
    <>
      <path d="M3 17v-5l2-5h12l3 5v5h-1M5 17H3M9 17h6" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </>
  ),
  baby: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
    </>
  ),
  realestate: (
    <>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01" />
    </>
  ),
  jewellery: <path d="M6 3h12l4 6-10 13L2 9ZM11 3 8 9l4 13 4-13-3-6M2 9h20" />,
};

export type CategoryIconName = keyof typeof categoryPaths;

/** Large outline illustration used on category and deal cards. */
export function CategoryIcon({ name, ...p }: IconProps & { name: CategoryIconName }) {
  return (
    <Svg strokeWidth={1.1} {...p}>
      {categoryPaths[name]}
    </Svg>
  );
}

export const EyeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);
export const EyeOffIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10.7 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3 3.8M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7c1.7 0 3.2-.4 4.5-1M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />
  </Svg>
);

export const DashboardIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </Svg>
);
export const PlusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const TrashIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </Svg>
);
export const LogoutIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </Svg>
);
export const EyeStatIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 3v18h18M7 15l4-4 3 3 5-6" />
  </Svg>
);

export const UsersIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2.5.6 4 2.5 4 6" />
  </Svg>
);
export const WalletIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 7a2 2 0 0 1 2-2h13v4M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2Z" />
    <circle cx="16.5" cy="14.5" r="1" />
  </Svg>
);
export const OffersIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 12V4h8l10 10-8 8L3 12Z" />
    <circle cx="7.5" cy="8.5" r="1.2" />
    <path d="M14 8l-4 4" />
  </Svg>
);

export const QrIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20h.01" />
  </Svg>
);

/* ---- duotone illustration icons: navy outline, light-blue fill, green "+" accent ---- */
const NAVY = '#0f1b3d';
const BLUE = '#8ecbf0';
const GREEN = '#12b76a';

function Duo({ size = 40, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke={NAVY}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {children}
      <path d="M38 4v8M34 8h8" stroke={GREEN} />
    </svg>
  );
}

export const DuoTagIcon = (p: IconProps) => (
  <Duo {...p}>
    <path d="M6 24V8a2 2 0 0 1 2-2h16l17 17a2 2 0 0 1 0 3L26 41a2 2 0 0 1-3 0L6 24Z" fill={BLUE} />
    <circle cx="15" cy="15" r="3" fill="#fff" />
  </Duo>
);
export const DuoStoreIcon = (p: IconProps) => (
  <Duo {...p}>
    <path d="M8 20v22h28V20" />
    <path d="M6 20 9 8h26l3 12c0 3-2.5 5-5 5s-5-2-5-5c0 3-2.5 5-5 5s-5-2-5-5c0 3-2.5 5-5 5s-5-2-5-5Z" fill={BLUE} />
    <path d="M18 42V32h8v10" fill="#fff" />
    <path d="M4 42h36" />
  </Duo>
);
export const DuoPinIcon = (p: IconProps) => (
  <Duo {...p}>
    <path d="M20 42S6 30 6 19a14 14 0 0 1 28 0C34 30 20 42 20 42Z" fill={BLUE} />
    <circle cx="20" cy="19" r="5" fill="#fff" />
  </Duo>
);
export const DuoHeartIcon = (p: IconProps) => (
  <Duo {...p}>
    <path d="M22 41S5 31 5 19a9 9 0 0 1 17-4 9 9 0 0 1 17 4C39 31 22 41 22 41Z" fill={BLUE} />
  </Duo>
);
export const DuoWalletIcon = (p: IconProps) => (
  <Duo {...p}>
    <path d="M6 14a4 4 0 0 1 4-4h22v6M6 14v22a4 4 0 0 0 4 4h28V18H10a4 4 0 0 1-4-4Z" fill={BLUE} />
    <circle cx="31" cy="29" r="2.5" fill="#fff" />
  </Duo>
);
export const DuoClockIcon = (p: IconProps) => (
  <Duo {...p}>
    <circle cx="21" cy="25" r="16" fill={BLUE} />
    <path d="M21 15v10l6 4" />
  </Duo>
);
export const DuoOffersIcon = (p: IconProps) => (
  <Duo {...p}>
    <path d="M6 24V8a2 2 0 0 1 2-2h16l17 17a2 2 0 0 1 0 3L26 41a2 2 0 0 1-3 0L6 24Z" fill={BLUE} />
    <path d="m27 16-10 10M18 17h.01M26 25h.01" />
  </Duo>
);
export const DuoUsersIcon = (p: IconProps) => (
  <Duo {...p}>
    <circle cx="16" cy="18" r="6" fill={BLUE} />
    <path d="M4 40c0-7 5-11 12-11s12 4 12 11Z" fill={BLUE} />
    <circle cx="30" cy="16" r="4.5" />
    <path d="M32 27c5 0 9 3 9 9" />
  </Duo>
);
