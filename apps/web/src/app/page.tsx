import Link from 'next/link';

// Placeholder until Phase 2 (server driven home). Proves tokens and routing work.
export default function Home() {
  return (
    <main>
      <header className="h-header-sm bg-navy md:h-header">
        <div className="container-page flex h-full items-center justify-between">
          <span className="text-section font-bold text-white">
            Offer<span className="text-primary">Buzz</span>
          </span>
          <Link href="/login" className="text-body font-semibold text-white">
            Login
          </Link>
        </div>
      </header>
      <section className="container-page py-6">
        <h1 className="text-title font-bold">Offers and deals near you</h1>
        <p className="mt-2 text-muted">Browse experience arrives in Phase 2.</p>
      </section>
    </main>
  );
}
