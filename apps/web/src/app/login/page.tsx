'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { OtpLogin } from '@/components/OtpLogin';

type Role = 'merchant' | 'intermediary';

const CARDS: { role: Role; title: string; tagline: string; icon: string }[] = [
  { role: 'merchant', title: 'Vendor', tagline: 'Vendor: post your offers and reach nearby customers', icon: '🏪' },
  { role: 'intermediary', title: 'Intermediary', tagline: 'Intermediary: refer shops and earn credits', icon: '🤝' },
];

function LoginInner() {
  // a scanned referral QR lands here as /login?role=merchant&ref=CODE: open vendor sign up with the code filled in
  const params = useSearchParams();
  const ref = (params.get('ref') ?? '').trim().toUpperCase();
  const [role, setRole] = useState<Role | null>(params.get('role') === 'merchant' && ref ? 'merchant' : null);

  return (
    <main className="container-page py-6 md:py-8">
      <div className="mb-4 flex justify-center">
        <Logo height={48} />
      </div>
      <h1 className="text-center text-title font-bold">Welcome to OfferBuzz</h1>
      <p className="mt-1 text-center text-muted">Choose how you want to continue</p>

      <div className="mt-6">
        {role ? (
          <OtpLogin role={role} onBack={() => setRole(null)} initialReferral={ref} />
        ) : (
          <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-2">
            {CARDS.map((c) => (
              <div key={c.role} className="surface-hover flex flex-col items-center p-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-md bg-purple-100 text-title ring-1 ring-purple-200" aria-hidden>
                  {c.icon}
                </div>
                <h2 className="mt-3 text-section font-bold">{c.title}</h2>
                <p className="mt-1 flex-1 text-muted">{c.tagline}</p>
                <button className="btn-primary mt-4 w-full" onClick={() => setRole(c.role)}>
                  Continue
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="mt-6 text-center text-small text-muted">Just browsing? No account needed to view offers.</p>
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
