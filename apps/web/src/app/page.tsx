import Link from 'next/link';
import { Logo } from '@/components/Logo';

// Placeholder until Phase 2 (server driven home). Also acts as a small preview of the purple theme.
export default function Home() {
  return (
    <main>
      <div className="h-1 bg-brand" aria-hidden />
      <header className="h-header-sm border-b border-purple-100 bg-card md:h-header">
        <div className="container-page flex h-full items-center justify-between">
          <Logo height={36} />
          <Link href="/login" className="btn-ghost">
            Login
          </Link>
        </div>
      </header>

      <section className="container-page py-4 md:py-6">
        <div className="rounded-md bg-hero p-6 text-white shadow-glow md:p-8">
          <span className="badge-discount !bg-accent !text-ink">Shop more. Save more.</span>
          <h1 className="mt-3 text-title font-bold">Offers and deals near you</h1>
          <p className="mt-2 max-w-xl text-purple-100">The browse experience arrives in Phase 2.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/login" className="btn-accent">
              Post your offer
            </Link>
            <Link href="/login" className="btn border border-white/40 text-white hover:bg-white/10">
              Become an intermediary
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
