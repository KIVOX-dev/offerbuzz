import type { DiscountType, OfferStatus, Role, UserStatus } from './constants';

export interface UserDTO {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  role: Role;
  status: UserStatus;
  referralCode: string;
  qrUrl?: string;
  /** true once the user has chosen a password (the hash itself is never sent) */
  hasPassword?: boolean;
  shopName?: string;
  city?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** seconds until the access token expires */
  expiresIn: number;
}

export interface AuthResponse extends AuthTokens {
  user: UserDTO;
  isNewUser: boolean;
}

export interface ApiError {
  error: { code: string; message: string; details?: unknown };
}

export interface OfferDTO {
  id: string;
  title: string;
  description: string;
  category: string;
  discountType: DiscountType;
  discountValue?: number;
  /** YYYY-MM-DD */
  startsAt: string;
  endsAt: string;
  area: string;
  terms?: string;
  status: OfferStatus;
  views: number;
  claims: number;
  createdAt: string;
}

export interface MyOffersResponse {
  offers: OfferDTO[];
  totals: { offers: number; pending: number; active: number; views: number; claims: number };
}
