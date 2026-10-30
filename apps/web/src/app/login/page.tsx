/* eslint-disable @next/next/no-img-element */
'use client';

import { Suspense, useEffect, useState, type ComponentType } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { DuoStoreIcon, DuoUsersIcon, TagIcon } from '@/components/Icons';
import { Logo } from '@/components/Logo';
import { OtpLogin } from '@/components/OtpLogin';

type Role = 'merchant' | 'intermediary';

const CARDS: { role: Role; title: string; tagline: string; icon: ComponentType<{ size?: number }> }[] = [
  { role: 'merchant', title: 'Vendor', tagline: 'Post your offers and reach nearby customers', icon: DuoStoreIcon },
  { role: 'intermediary', title: 'Intermediary', tagline: 'Refer shops and earn credits', icon: DuoUsersIcon },
];

// category art for the side panel
const ART = [
  { slug: 'grocery', name: 'Grocery', off: '30% OFF', from: '#e8fae0', to: '#e6f9dd', cls: 'left-[6%] top-[10%] -rotate-6 w-[44%]' },
  { slug: 'fashion', name: 'Fashion', off: 'BUY 1 GET 1', from: '#fce8ed', to: '#fde8ee', cls: 'right-[6%] top-[22%] rotate-6 w-[42%]' },
  { slug: 'electronics', name: 'Electronics', off: '20% OFF', from: '#e4f2fe', to: '#e4f1fd', cls: 'left-[22%] bottom-[8%] rotate-2 w-[46%]' },
];

function SidePanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-hero text-white lg:block">
      <span aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-purple-400/25 blur-3xl" />
      <span aria-hidden className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '22px 22px' }}
      />
      <div className="relative flex h-full flex-col justify-between p-12">
        <div className="max-w-md">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-small font-semibold text-accent backdrop-blur">
            <TagIcon size={14} /> Shop more. Save more.
          </span>
          <h2 className="mt-5 text-[40px] font-extrabold leading-[1.1] tracking-tight">
            Grow with <span className="text-accent">local offers</span>
          </h2>
          <p className="mt-3 text-[17px] text-purple-100">Post deals as a vendor, or earn credits by bringing shops to OfferBuzz.</p>
        </div>

        <div aria-hidden className="relative mx-auto h-[360px] w-full max-w-[520px]">
          {ART.map((a) => (
            <div key={a.slug} className={`absolute overflow-hidden rounded-xl border-4 border-white bg-white shadow-2xl ${a.cls}`}>
              <span className="absolute left-2 top-2 z-10 rounded-full bg-accent px-2 py-0.5 text-[11px] font-extrabold text-ink">{a.off}</span>
              <div style={{ backgroundImage: `linear-gradient(120deg, ${a.from}, ${a.to})` }} className="aspect-[4/3]">
                <img src={`/categories/${a.slug}.webp`} alt="" className="h-full w-full object-cover" />
              </div>
              <p className="px-2.5 py-1.5 text-[12px] font-bold text-ink">{a.name}</p>
            </div>
          ))}
        </div>

        <ul className="flex flex-wrap gap-2 text-small font-medium">
          {['Free for customers', 'Verified local shops', 'New offers daily'].map((t) => (
            <li key={t} className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-ink">✓</span>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

function LoginInner() {
  // a scanned referral QR lands here as /login?role=merchant&ref=CODE: open vendor sign up with the code filled in
  const params = useSearchParams();
  const ref = (params.get('ref') ?? '').trim().toUpperCase();
  // footer links arrive as /login?role=merchant|intermediary&mode=signin|signup
  const roleParam = params.get('role');
  const initialMode = params.get('mode') === 'signin' ? 'signin' : 'signup';
  const linkedRole: Role | null =
    roleParam === 'intermediary' || (roleParam === 'merchant' && (ref || params.has('mode'))) ? roleParam : null;
  const [role, setRole] = useState<Role | null>(linkedRole);
  // arriving from a footer link while already on /login must skip the "choose" screen too
  useEffect(() => {
    if (linkedRole) setRole(linkedRole);
  }, [linkedRole, initialMode]);

  return (
    <main className="grid min-h-screen bg-card lg:grid-cols-2">
      <div className="flex flex-col px-6 py-6 md:px-12 lg:px-16">
        <Logo height={52} />

        <div className="mx-auto my-auto w-full max-w-md py-10">
          <h1 className="text-[30px] font-extrabold leading-tight tracking-tight md:text-[36px]">
            {role ? `${role === 'merchant' ? 'Vendor' : 'Intermediary'} account` : 'Welcome to OfferBuzz'}
          </h1>
          <p className="mb-6 mt-2 text-muted">
            {role ? 'Sign in or create your account to continue.' : 'Choose how you want to continue'}
          </p>

          {role ? (
            <OtpLogin
              key={`${role}-${initialMode}`}
              role={role}
              onBack={() => setRole(null)}
              initialReferral={ref}
              initialMode={initialMode}
              bare
            />
          ) : (
            <div className="space-y-3">
              {CARDS.map((c) => (
                <button
                  key={c.role}
                  type="button"
                  onClick={() => setRole(c.role)}
                  className="surface-hover flex w-full items-center gap-4 p-4 text-left"
                >
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-sky-50 ring-1 ring-sky-100" aria-hidden>
                    <c.icon size={38} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-section font-bold">{c.title}</span>
                    <span className="block text-muted">{c.tagline}</span>
                  </span>
                  <span aria-hidden className="text-xl text-purple-700">›</span>
                </button>
              ))}
            </div>
          )}

          <p className="mt-8 text-small text-muted">
            Just browsing? No account needed to view offers.{' '}
            <Link href="/" className="font-semibold text-purple-700 underline">Back to home</Link>
          </p>
        </div>
      </div>

      <SidePanel />
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
