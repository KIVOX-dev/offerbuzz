import Link from 'next/link';
import { Logo } from './Logo';

export type BenefitsData = {
  headline: string;
  intro: string;
  benefitsHeading: string;
  benefits: { title: string; text: string }[];
  extra?: { heading: string; items: { title: string; text?: string }[] };
  steps?: { heading: string; items: { title: string; text: string }[] };
  chips?: { heading: string; items: string[] };
  note?: { heading: string; lines: string[]; footnote: string };
  closing: { heading: string; text: string };
  cta: { label: string; href: string };
};

/** Shared shell for the "View benefits" pages linked from the login role cards. */
export function BenefitsPage({ d }: { d: BenefitsData }) {
  return (
    <main className="min-h-screen">
      <header className="border-b border-purple-100 bg-card">
        <div className="container-page flex items-center justify-between py-3">
          <Logo height={42} />
          <Link href="/login" className="btn-ghost btn-sm">Back to sign in</Link>
        </div>
      </header>

      <article className="container-page max-w-3xl space-y-10 py-8">
        <div>
          <h1 className="text-title font-bold">{d.headline}</h1>
          <p className="mt-3 text-body">{d.intro}</p>
          <Link href={d.cta.href} className="btn-primary mt-5 inline-flex">{d.cta.label}</Link>
        </div>

        {d.steps && (
          <section className="space-y-3">
            <h2 className="text-section font-bold">{d.steps.heading}</h2>
            <ol className="space-y-3">
              {d.steps.items.map((s, i) => (
                <li key={s.title} className="surface flex gap-4 p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-700 text-small font-bold text-white">{i + 1}</span>
                  <span>
                    <span className="block font-bold">{s.title}</span>
                    <span className="block text-muted">{s.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-section font-bold">{d.benefitsHeading}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {d.benefits.map((b) => (
              <li key={b.title} className="surface p-4">
                <p className="font-bold">{b.title}</p>
                <p className="mt-1 text-muted">{b.text}</p>
              </li>
            ))}
          </ul>
        </section>

        {d.extra && (
          <section className="space-y-3">
            <h2 className="text-section font-bold">{d.extra.heading}</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {d.extra.items.map((b) => (
                <li key={b.title} className="surface p-4">
                  <p className="font-bold">{b.title}</p>
                  {b.text && <p className="mt-1 text-muted">{b.text}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {d.chips && (
          <section className="space-y-3">
            <h2 className="text-section font-bold">{d.chips.heading}</h2>
            <ul className="flex flex-wrap gap-2">
              {d.chips.items.map((c) => (
                <li key={c} className="rounded-full bg-purple-50 px-3 py-1.5 text-small font-semibold text-purple-700 ring-1 ring-purple-100">{c}</li>
              ))}
            </ul>
          </section>
        )}

        {d.note && (
          <section className="space-y-3">
            <h2 className="text-section font-bold">{d.note.heading}</h2>
            <div className="surface space-y-1 p-4">
              {d.note.lines.map((l) => <p key={l}>{l}</p>)}
            </div>
            <p className="text-small text-muted">{d.note.footnote}</p>
          </section>
        )}

        <section className="surface space-y-2 p-5">
          <h2 className="text-section font-bold">{d.closing.heading}</h2>
          <p className="text-body">{d.closing.text}</p>
          <Link href={d.cta.href} className="btn-primary mt-2 inline-flex">{d.cta.label}</Link>
        </section>

        <p className="border-t border-purple-100 pt-4 text-small text-muted">
          Questions? Call +91 93459 75747 between 09:00 AM and 09:00 PM, or write to us at support@offerbuzz.co.
        </p>
      </article>
    </main>
  );
}
