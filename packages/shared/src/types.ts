import type { Role, UserStatus } from './constants';

export interface UserDTO {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  role: Role;
  status: UserStatus;
  referralCode: string;
  qrUrl?: string;
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
