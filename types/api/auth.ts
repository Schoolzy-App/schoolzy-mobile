/**
 * Auth DTOs — `/api/v1/auth/*`.
 *
 * ⚠️ The Swagger spec documents every auth request body but leaves ALL auth
 * responses as a bare `200 OK` with no schema. The response types below are the
 * conventional ASP.NET shape and MUST be confirmed against the real API before
 * relying on them. `parseLoginResponse` in `services/api/auth.ts` is tolerant of
 * the common naming variants so a mismatch degrades gracefully.
 */

/** POST /api/v1/auth/login */
export interface LoginRequestDto {
  email: string | null;
  password: string | null;
}

/** POST /api/v1/auth/refresh-token */
export interface RefreshTokenRequestDto {
  refreshToken: string | null;
}

/** POST /api/v1/auth/logout */
export interface LogoutRequestDto {
  refreshToken: string | null;
}

/** POST /api/v1/auth/otp/send */
export interface SendOtpRequestDto {
  email: string | null;
}

/** POST /api/v1/auth/otp/verify */
export interface VerifyOtpRequestDto {
  email: string | null;
  code: string | null;
}

/** POST /api/v1/auth/reset-password */
export interface ResetPasswordRequestDto {
  email: string | null;
  resetToken: string | null;
  newPassword: string | null;
}

/** POST /api/v1/auth/change-password */
export interface ChangePasswordRequestDto {
  currentPassword: string | null;
  newPassword: string | null;
}

// ─── Responses (unverified — see file header) ────────────────────────────────

/** Token pair persisted in SecureStore after a successful login/refresh. */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string | null;
  /** Absolute expiry as an epoch-ms timestamp, when the API provides one. */
  expiresAt: number | null;
}

/** Authenticated user, as far as the login response exposes it. */
export interface AuthUser {
  id: string | null;
  email: string | null;
  name: string | null;
}

/** Normalized result of a successful login or token refresh. */
export interface AuthSession {
  tokens: AuthTokens;
  user: AuthUser | null;
}
