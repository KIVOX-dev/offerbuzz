import Image from 'next/image';
import Link from 'next/link';

/** Horizontal logo (mark + wordmark). Intrinsic size 720x325. */
export function Logo({ height = 40 }: { height?: number }) {
  return (
    <Link href="/" aria-label="OfferBuzz home" className="inline-flex shrink-0 items-center">
      <Image
        src="/brand/logo-horizontal.png"
        alt="OfferBuzz.co - Shop more. Save more."
        width={Math.round((height * 720) / 325)}
        height={height}
        priority
      />
    </Link>
  );
}
