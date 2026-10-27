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
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers,
      body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
    });
  } catch {
    // network failure, server down, or the browser blocked the reply (CORS)
    throw new ApiRequestError(0, 'NETWORK', 'Cannot reach the server right now. Please try again in a moment.');
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const e = (data as ApiError | null)?.error;
    throw new ApiRequestError(res.status, e?.code ?? 'UNKNOWN', e?.message ?? 'Request failed');
  }
  return data as T;
}

export type AuthMode = 'signin' | 'signup';
type LoginRole = 'merchant' | 'intermediary' | 'customer';

export const sendOtp = (email: string, mode: AuthMode, role?: LoginRole) =>
  api<{ sent: boolean; resendIn: number; devOtp?: string }>('/auth/send-otp', { method: 'POST', json: { email, mode, role } });

export const verifyOtp = (body: { email: string; code: string; mode: AuthMode; role?: LoginRole; name?: string }) =>
  api<AuthResponse>('/auth/verify-otp', { method: 'POST', json: body });

export const googleLogin = (idToken: string, role?: 'merchant' | 'intermediary') =>
  api<AuthResponse>('/auth/google', { method: 'POST', json: { idToken, role } });

export const adminLogin = (email: string, password: string) =>
  api<AuthResponse>('/auth/admin/login', { method: 'POST', json: { email, password } });
