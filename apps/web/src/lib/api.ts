import type { ApiError, AuthResponse } from '@offerbuzz/shared';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit & { json?: unknown; token?: string } = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.json !== undefined) headers.set('content-type', 'application/json');
  if (init.token) headers.set('authorization', `Bearer ${init.token}`);
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const e = (data as ApiError | null)?.error;
    throw new ApiRequestError(res.status, e?.code ?? 'UNKNOWN', e?.message ?? 'Request failed');
  }
  return data as T;
}

export const sendOtp = (phone: string) =>
  api<{ sent: boolean; resendIn: number; devOtp?: string }>('/auth/send-otp', { method: 'POST', json: { phone } });

export const verifyOtp = (body: { phone: string; code: string; role?: 'merchant' | 'intermediary' | 'customer' }) =>
  api<AuthResponse>('/auth/verify-otp', { method: 'POST', json: body });

export const googleLogin = (idToken: string, role?: 'merchant' | 'intermediary') =>
  api<AuthResponse>('/auth/google', { method: 'POST', json: { idToken, role } });

export const adminLogin = (email: string, password: string) =>
  api<AuthResponse>('/auth/admin/login', { method: 'POST', json: { email, password } });
