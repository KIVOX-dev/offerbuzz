import type {
  AdminAnalytics,
  AiChatInput,
  AiChatResponse,
  AdminOffersResponse,
  AdminOverview,
  AdminUsersResponse,
  AdminWalletsResponse,
  ApiError,
  AuthResponse,
  AuthTokens,
  MyOffersResponse,
  NearbyOffersResponse,
  PublicOfferDTO,
  SuggestResponse,
  ReferralLookup,
  WalletResponse,
  OfferDTO,
  OfferInput,
  UpdateProfileInput,
  UserDTO,
} from '@offerbuzz/shared';
import { clearSession, loadSession, saveSession } from './session';

// In the browser always call same-origin: next.config.js rewrites /api/v1 to the API. Catalyst's gateway
// answers CORS preflights without CORS headers, so a direct cross-origin call is always blocked.
const BASE = typeof window !== 'undefined' ? '/api/v1' : (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1');

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

export const verifyOtp = (body: {
  email: string;
  code: string;
  mode: AuthMode;
  role?: LoginRole;
  name?: string;
  referralCode?: string;
  category?: string;
}) =>
  api<AuthResponse>('/auth/verify-otp', { method: 'POST', json: body });

export const passwordLogin = (email: string, password: string) =>
  api<AuthResponse>('/auth/login', { method: 'POST', json: { email, password } });

export const setPassword = (token: string, password: string) =>
  api<void>('/auth/set-password', { method: 'POST', json: { password }, token });

export const googleLogin = (idToken: string, role?: 'merchant' | 'intermediary') =>
  api<AuthResponse>('/auth/google', { method: 'POST', json: { idToken, role } });

export const adminLogin = (email: string, password: string) =>
  api<AuthResponse>('/auth/admin/login', { method: 'POST', json: { email, password } });

// One refresh at a time: refresh tokens are single use, so two parallel refreshes would look like a replay
// and revoke the whole session.
let refreshing: Promise<AuthResponse> | undefined;

function refreshSession(current: AuthResponse): Promise<AuthResponse> {
  refreshing ??= api<AuthTokens>('/auth/refresh', { method: 'POST', json: { refreshToken: current.refreshToken } })
    .then((tokens) => {
      const next = { ...current, ...tokens };
      saveSession(next);
      return next;
    })
    .catch((e) => {
      clearSession();
      throw new ApiRequestError(401, 'SESSION_EXPIRED', 'Your session ended, please sign in again');
    })
    .finally(() => {
      refreshing = undefined;
    });
  return refreshing;
}

/** Calls the API as the signed in user and renews the access token once when it has expired. */
export async function authApi<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const session = loadSession();
  if (!session) throw new ApiRequestError(401, 'SESSION_EXPIRED', 'Please sign in');
  try {
    return await api<T>(path, { ...init, token: session.accessToken });
  } catch (e) {
    if (!(e instanceof ApiRequestError) || e.status !== 401 || e.code !== 'TOKEN_INVALID') throw e;
    const next = await refreshSession(session);
    return api<T>(path, { ...init, token: next.accessToken });
  }
}

export const getMyOffers = () => authApi<MyOffersResponse>('/offers/mine');
export const createOffer = (body: OfferInput) => authApi<{ offer: OfferDTO }>('/offers', { method: 'POST', json: body });
export const deleteOffer = (id: string) => authApi<void>(`/offers/${id}`, { method: 'DELETE' });
export const updateProfile = (body: UpdateProfileInput) =>
  authApi<{ user: UserDTO }>('/me', { method: 'PUT', json: body });

// ---- Public: what customers see ---------------------------------------------------------------------
export const getPublicOffer = (id: string) => api<{ offer: PublicOfferDTO }>(`/offers/${encodeURIComponent(id)}`);
export const getNearbyOffers = (lat: number, lng: number, radiusKm = 10) =>
  api<NearbyOffersResponse>(`/offers/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`);

export const suggestSearch = (q: string) => api<SuggestResponse>(`/search/suggest?q=${encodeURIComponent(q)}`);
export const searchOffers = (p: { q?: string; category?: string; lat?: number; lng?: number }) => {
  const params = new URLSearchParams();
  if (p.q) params.set('q', p.q);
  if (p.category) params.set('category', p.category);
  if (p.lat !== undefined && p.lng !== undefined) {
    params.set('lat', String(p.lat));
    params.set('lng', String(p.lng));
  }
  return api<NearbyOffersResponse>(`/offers/search?${params}`);
};

export const getOffersByIds = (ids: string[]) => api<NearbyOffersResponse>(`/offers/by-ids?ids=${ids.map(encodeURIComponent).join(',')}`);

export const askOfferaAI = (body: AiChatInput) => api<AiChatResponse>('/ai/chat', { method: 'POST', json: body });

export const lookupReferral = (code: string) => api<ReferralLookup>(`/referral/${encodeURIComponent(code)}`);
export const getWallet = () => authApi<WalletResponse>('/wallet');

// ---- Intermediary payouts ------------------------------------------------------------------------
export const requestPayout = () => authApi<{ id: string; credits: number }>('/wallet/payout-request', { method: 'POST', json: {} });

// ---- Admin ------------------------------------------------------------------------------------------
const qs = (o: Record<string, string | number | undefined>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== '') p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
};
export const getAdminOverview = () => authApi<AdminOverview>('/admin/overview');
export const getAdminUsers = (q: { role?: string; status?: string; q?: string; page?: number }) =>
  authApi<AdminUsersResponse>(`/admin/users${qs(q)}`);
export const setUserStatus = (id: string, status: 'active' | 'blocked') =>
  authApi<{ id: string; status: string }>(`/admin/users/${id}/status`, { method: 'PATCH', json: { status } });
export const recordPayment = (id: string, months: number) =>
  authApi<{ paidUntil: string; referrerCredited: boolean }>(`/admin/vendors/${id}/payment`, { method: 'POST', json: { months } });
export const getAdminOffers = (q: { view?: string; category?: string }) => authApi<AdminOffersResponse>(`/admin/offers${qs(q)}`);
export const setOfferStatus = (id: string, status: 'active' | 'rejected') =>
  authApi<{ id: string; status: string }>(`/admin/offers/${id}/status`, { method: 'PATCH', json: { status } });
export const getAdminWallets = () => authApi<AdminWalletsResponse>('/admin/wallets');
export const payPayout = (id: string) => authApi<void>(`/admin/payouts/${id}/pay`, { method: 'POST', json: {} });
export const rejectPayoutRequest = (id: string, note?: string) =>
  authApi<void>(`/admin/payouts/${id}/reject`, { method: 'POST', json: { note } });
export const getAdminAnalytics = () => authApi<AdminAnalytics>('/admin/analytics');

/** Sends the (already shrunk) photo as the raw request body. */
export const uploadOfferImage = (id: string, image: Blob) =>
  authApi<{ offer: OfferDTO }>(`/offers/${id}/image`, { method: 'PUT', body: image, headers: { 'content-type': image.type } });
