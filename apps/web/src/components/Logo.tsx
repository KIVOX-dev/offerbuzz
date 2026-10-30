import Image from 'next/image';
import Link from 'next/link';

/** Horizontal logo (mark + wordmark). Intrinsic size 720x325. */
/**
 * `light` is the transparent white-and-lilac version for dark backgrounds; `transparent` is the normal full-colour logo
 * without its white box, for the golden yellow footer.
 */
export function Logo({ height = 40, variant = 'default' }: { height?: number; variant?: 'default' | 'light' | 'transparent' }) {
  return (
    <Link href="/" aria-label="OfferBuzz home" className="inline-flex shrink-0 items-center">
      <Image
        src={variant === 'light' ? '/brand/logo-horizontal-light.png' : variant === 'transparent' ? '/brand/logo-horizontal-transparent.png' : '/brand/logo-horizontal.png'}
        alt="OfferBuzz.co - Shop more. Save more."
        width={Math.round((height * 720) / 325)}
        height={height}
        priority
        className={variant === 'default' ? 'rounded-md' : ''}
      />
    </Link>
  );
}
