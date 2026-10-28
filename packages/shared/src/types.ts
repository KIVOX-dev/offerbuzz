import type { DiscountType, OfferStatus, PayoutStatus, Role, UserStatus } from './constants';

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
  /** relative URL of the offer photo, present only when one was uploaded */
  imageUrl?: string;
}

export interface MyOffersResponse {
  offers: OfferDTO[];
  totals: { offers: number; pending: number; active: number; views: number; claims: number };
}

export interface WalletEntryDTO {
  id: string;
  kind: 'credit' | 'debit';
  reason: 'subscription' | 'payout' | 'adjustment';
  credits: number;
  /** billing month, YYYY-MM */
  period?: string;
  shop?: string;
  availableAt: string;
  createdAt: string;
}

/** Credits are rupees: 1 credit = Rs 1. */
export interface WalletResponse {
  balance: number;
  /** released from the hold period and not yet paid out */
  available: number;
  onHold: number;
  totalEarned: number;
  payoutThreshold: number;
  holdDays: number;
  commissionCredits: number;
  /** credits in payout requests waiting for the admin */
  requested: number;
  /** available minus requested: what can go into a new payout request */
  requestable: number;
  shops: { id: string; name: string; joinedAt: string }[];
  entries: WalletEntryDTO[];
}

export interface ReferralLookup {
  valid: boolean;
  name?: string;
}

export interface PayoutRequestDTO {
  id: string;
  intermediaryId: string;
  intermediary: string;
  credits: number;
  status: PayoutStatus;
  note?: string;
  requestedAt: string;
  processedAt?: string;
}

export interface AdminOverview {
  vendors: { total: number; subscribed: number; unsubscribed: number };
  intermediaries: { total: number; pendingApproval: number };
  customers: number;
  pendingOffers: number;
  payouts: { pending: number; pendingCredits: number };
}

export interface AdminUserDTO {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  role: Role;
  status: UserStatus;
  shopName?: string;
  city?: string;
  referredBy?: string;
  /** vendors only: ISO date the paid plan runs until */
  paidUntil?: string;
  subscribed?: boolean;
  createdAt: string;
}

export interface AdminUsersResponse {
  users: AdminUserDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminOfferDTO extends OfferDTO {
  vendor: string;
  vendorEmail?: string;
}

export interface AdminCategoryCount {
  category: string;
  running: number;
  pending: number;
}

export interface AdminOffersResponse {
  categories: AdminCategoryCount[];
  offers: AdminOfferDTO[];
}

export interface AdminWalletRow {
  id: string;
  name: string;
  email?: string;
  status: UserStatus;
  balance: number;
  available: number;
  onHold: number;
  requested: number;
  totalEarned: number;
  shops: number;
}

export interface AdminWalletsResponse {
  payoutThreshold: number;
  wallets: AdminWalletRow[];
  payouts: PayoutRequestDTO[];
}

export interface AnalyticsTotals {
  today: number;
  last7: number;
  last30: number;
}

export interface AdminAnalytics {
  /** unique visitors per day, added up over the range */
  visitors: AnalyticsTotals;
  pageViews: AnalyticsTotals;
  newUsers: AnalyticsTotals;
  /** oldest first, India time days */
  series: { day: string; visitors: number; views: number; newUsers: number }[];
  topPages: { path: string; views: number }[];
}
