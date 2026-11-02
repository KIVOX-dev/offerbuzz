import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { LoginScreen } from '@/components/login/LoginScreen';

const ROLES = { vendor: 'merchant', intermediary: 'intermediary' } as const;
const MODES = { 'sign-in': 'signin', 'sign-up': 'signup' } as const;

export function generateStaticParams() {
  return Object.keys(ROLES).flatMap((role) => Object.keys(MODES).map((mode) => ({ role, mode })));
}

export default async function LoginRolePage({ params }: { params: Promise<{ role: string; mode: string }> }) {
  const { role, mode } = await params;
  if (!(role in ROLES) || !(mode in MODES)) notFound();
  return (
    <Suspense fallback={null}>
      <LoginScreen forcedRole={ROLES[role as keyof typeof ROLES]} forcedMode={MODES[mode as keyof typeof MODES]} />
    </Suspense>
  );
}
