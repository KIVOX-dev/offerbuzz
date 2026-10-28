'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { WalletResponse } from '@offerbuzz/shared';
import { ApiRequestError, getWallet } from '@/lib/api';

/** Loads the signed in intermediary's wallet. Sends them to sign in when the session has ended. */
export function useWallet() {
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletResponse>();
  const [error, setError] = useState<string>();

  const reload = useCallback(() => {
    getWallet()
      .then((w) => {
        setWallet(w);
        setError(undefined);
      })
      .catch((e) => {
        if (e instanceof ApiRequestError && e.code === 'SESSION_EXPIRED') return router.replace('/login');
        setError(e instanceof ApiRequestError ? e.message : 'Could not load your wallet');
      });
  }, [router]);

  useEffect(reload, [reload]);

  return { wallet, error, reload };
}

export const rs = (n: number) => `Rs ${n.toLocaleString('en-IN')}`;
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
