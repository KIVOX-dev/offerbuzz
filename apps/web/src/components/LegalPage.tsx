import Link from 'next/link';
import { Logo } from './Logo';

/** `body` paragraphs come first, then an optional bullet list. */
export type LegalSection = { heading: string; body: string[]; bullets?: string[] };

/** Shared shell for the Terms, Privacy and Cookie pages. */
export function LegalPage({ title, updated, intro, sections }: { title: string; updated: string; intro: string; sections: LegalSection[] }) {
  const anchor = (i: number) => `s${i + 1}`;
  return (
    <main className="min-h-screen">
      <header className="border-b border-purple-100 bg-card">
        <div className="container-page flex items-center justify-between py-3">
          <Logo height={42} />
          <Link href="/" className="btn-ghost btn-sm">Back to home</Link>
        </div>
      </header>
      <article className="container-page max-w-3xl space-y-8 py-8">
        <div>
          <h1 className="text-title font-bold">{title}</h1>
          <p className="mt-1 text-small text-muted">Last updated: {updated}</p>
          <p className="mt-3">{intro}</p>
        </div>

        {sections.length > 6 && (
          <nav aria-label="Contents" className="surface p-4">
            <p className="mb-2 text-small font-bold uppercase tracking-wider text-purple-700">Contents</p>
            <ol className="grid gap-x-6 gap-y-1 text-small sm:grid-cols-2">
              {sections.map((s, i) => (
                <li key={s.heading}>
                  <a href={`#${anchor(i)}`} className="text-purple-700 hover:underline">{i + 1}. {s.heading}</a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        {sections.map((s, i) => (
          <section key={s.heading} id={anchor(i)} className="scroll-mt-6 space-y-2">
            <h2 className="text-section font-bold">{i + 1}. {s.heading}</h2>
            {s.body.map((p) => <p key={p} className="text-body">{p}</p>)}
            {s.bullets && (
              <ul className="list-disc space-y-1.5 pl-6 text-body">
                {s.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
            )}
          </section>
        ))}

        <p className="border-t border-purple-100 pt-4 text-small text-muted">
          Questions? Call +91 93459 75747 between 09:00 AM and 09:00 PM, or write to us at #3, 3rd Street, Thiruvallur Nagar, Ramanathapuram, Coimbatore - 641045.
        </p>
      </article>
    </main>
  );
}
