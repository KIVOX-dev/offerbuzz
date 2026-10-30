import Link from 'next/link';
import { Logo } from './Logo';

export type LegalSection = { heading: string; body: string[] };

/** Shared shell for the Terms, Privacy and Cookie pages. */
export function LegalPage({ title, updated, intro, sections }: { title: string; updated: string; intro: string; sections: LegalSection[] }) {
  return (
    <main className="min-h-screen">
      <header className="border-b border-purple-100 bg-card">
        <div className="container-page flex items-center justify-between py-3">
          <Logo height={32} />
          <Link href="/" className="btn-ghost btn-sm">Back to home</Link>
        </div>
      </header>
      <article className="container-page max-w-3xl space-y-6 py-8">
        <div>
          <h1 className="text-title font-bold">{title}</h1>
          <p className="mt-1 text-small text-muted">Last updated: {updated}</p>
          <p className="mt-3">{intro}</p>
        </div>
        {sections.map((s, i) => (
          <section key={s.heading} className="space-y-2">
            <h2 className="text-section font-bold">{i + 1}. {s.heading}</h2>
            {s.body.map((p) => <p key={p} className="text-body">{p}</p>)}
          </section>
        ))}
        <p className="text-small text-muted">Questions? Call 93 45 97 57 47 between 09:00 AM and 09:00 PM, or write to us at #3, 3rd Street, Thiruvallur Nagar, Ramanathapuram, Coimbatore - 641045.</p>
      </article>
    </main>
  );
}
