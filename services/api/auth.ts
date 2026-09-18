import type {
  AuthSession,
  AuthUser,
  ChangePasswordRequestDto,
  LoginRequestDto,
  ResetPasswordRequestDto,
  SendOtpRequestDto,
  VerifyOtpRequestDto,
} from "@/types/api";
import { ApiError } from "@/types/api";

import { extractTokens, requestRaw } from "./client";
import { ROUTES } from "./config";
import { tokenStorage } from "./tokenStorage";
import { createLogger } from "@/utils/logger";

const log = createLogger("auth");

/**
 * Auth is deliberately kept out of react-query: these are imperative,
 * one-shot commands whose result is session state, not cached server state.
 * `AuthContext` owns the state; this module only talks to the API and the
 * keychain.
 *
 * ⚠️ Every auth response is undocumented in the Swagger spec (bare `200 OK`).
 * Token and user extraction is therefore defensive — see `extractTokens`.
 */

/** Best-effort user extraction from an undocumented login payload. */
function extractUser(payload: unknown): AuthUser | null {
  if (!payload || typeof payload !== "object") return null;

  const root = payload as Record<string, unknown>;
  const body = (
    root.data && typeof root.data === "object" ? root.data : root
  ) as Record<string, unknown>;

  const nested = (
    body.user && typeof body.user === "object" ? body.user : body
  ) as Record<string, unknown>;

  const id = nested.id ?? nested.Id ?? nested.userId ?? nested.UserId ?? null;
  const email = nested.email ?? nested.Email ?? null;
  const name =
    nested.name ?? nested.Name ?? nested.fullName ?? nested.FullName ?? null;

  if (id == null && email == null && name == null) return null;

  return {
    id: id == null ? null : String(id),
    email: typeof email === "string" ? email : null,
    name: typeof name === "string" ? name : null,
  };
}

/**
 * Pulls a password-reset token out of an undocumented verify-OTP response.
 *
 * Tolerant by design: the token may sit at the root or inside a `data`
 * envelope, under any of several plausible names. Returns null when nothing
 * looks like a token, so the caller can decide what to do.
 */
export function extractResetToken(payload: unknown): string | null {
  if (!payload) return null;
  if (typeof payload === "string") return payload || null;
  if (typeof payload !== "object") return null;

  const source = payload as Record<string, unknown>;
  // Unwrap an envelope if there is one.
  const body =
    source.data && typeof source.data === "object"
      ? (source.data as Record<string, unknown>)
      : source;

  const KEYS = ["resetToken", "token", "passwordResetToken", "otpToken"];
  for (const key of KEYS) {
    const value = body[key];
    if (typeof value === "string" && value) return value;
  }
  return null;
}

export const authApi = {
  /**
   * POST /api/v1/auth/login
   * Persists the token pair on success and returns the normalized session.
   */
  async login(credentials: LoginRequestDto): Promise<AuthSession> {
    const payload = await requestRaw<unknown>({
      method: "POST",
      url: ROUTES.auth.login,
      data: credentials,
    });

    const tokens = extractTokens(payload);
    if (!tokens) {
      throw new ApiError(
        "Login succeeded but no access token was returned. Confirm the login response shape with the backend.",
        200,
      );
    }

    const user = extractUser(payload);
    await tokenStorage.save(tokens);
    await tokenStorage.saveUser(user);

    return { tokens, user };
  },

  /**
   * POST /api/v1/auth/logout
   * Always clears local credentials, even when the server call fails —
   * a network error must not strand the user in a signed-in state.
   */
  async logout(): Promise<void> {
    const tokens = tokenStorage.getCached();
    try {
      if (tokens?.refreshToken) {
        await requestRaw({
          method: "POST",
          url: ROUTES.auth.logout,
          data: { refreshToken: tokens.refreshToken },
        });
      }
    } finally {
      await tokenStorage.clear();
    }
  },

  /** POST /api/v1/auth/refresh-token */
  async refresh(): Promise<AuthSession | null> {
    const current = tokenStorage.getCached();
    if (!current?.refreshToken) return null;

    const payload = await requestRaw<unknown>({
      method: "POST",
      url: ROUTES.auth.refreshToken,
      data: { refreshToken: current.refreshToken },
    });

    const tokens = extractTokens(payload);
    if (!tokens) return null;

    await tokenStorage.save(tokens);
    return { tokens, user: await tokenStorage.loadUser() };
  },

  /** POST /api/v1/auth/otp/send */
  async sendOtp(body: SendOtpRequestDto): Promise<void> {
    await requestRaw({ method: "POST", url: ROUTES.auth.sendOtp, data: body });
  },

  /**
   * POST /api/v1/auth/otp/verify
   *
   * Returns the reset token to hand to `resetPassword`.
   *
   * ⚠️ The response SHAPE is undocumented — the Postman collection only says
   * `"resetToken": "<from verify-otp response>"`. `extractResetToken` therefore
   * accepts the shapes this API uses elsewhere, and falls back to the OTP code
   * itself for backends that treat the code as the token. Replace this with the
   * exact field once a real response is available.
   */
  async verifyOtp(body: VerifyOtpRequestDto): Promise<string | null> {
    const payload = await requestRaw<unknown>({
      method: "POST",
      url: ROUTES.auth.verifyOtp,
      data: body,
    });

    const token = extractResetToken(payload);
    if (!token) {
      log.warn(
        "otp/verify returned no recognisable reset token — falling back to the OTP code",
        { shape: payload && typeof payload === "object" ? Object.keys(payload) : typeof payload },
      );
    }
    return token ?? body.code ?? null;
  },

  /** POST /api/v1/auth/reset-password */
  async resetPassword(body: ResetPasswordRequestDto): Promise<void> {
    await requestRaw({
      method: "POST",
      url: ROUTES.auth.resetPassword,
      data: body,
    });
  },

  /** POST /api/v1/auth/change-password — requires an authenticated session. */
  async changePassword(body: ChangePasswordRequestDto): Promise<void> {
    await requestRaw({
      method: "POST",
      url: ROUTES.auth.changePassword,
      data: body,
    });
  },

  /** Restores a persisted session on app start. */
  async restoreSession(): Promise<AuthSession | null> {
    const tokens = await tokenStorage.load();
    if (!tokens) return null;
    return { tokens, user: await tokenStorage.loadUser() };
  },
};
