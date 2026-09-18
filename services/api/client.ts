import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import { ApiError, type ApiResponse, type AuthTokens } from "@/types/api";
import { createLogger } from "@/utils/logger";

import {
  API_BASE_URL,
  API_TIMEOUT_MS,
  API_VERSION,
  ROUTES,
  isMobileRoute,
} from "./config";
import { tokenStorage } from "./tokenStorage";

const log = createLogger("api");

/**
 * Marks a request as already retried so a failed refresh can't loop, and
 * carries the start time so responses can report their duration.
 */
type RetriableConfig = InternalAxiosRequestConfig & {
  _retried?: boolean;
  _startedAt?: number;
};

/**
 * Called when the session can no longer be recovered (refresh failed or no
 * refresh token). `AuthContext` registers a handler here so a 401 anywhere in
 * the app tears the session down exactly once.
 */
type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { Accept: "application/json" },
});

// ─── Request: attach bearer token + api-version ──────────────────────────────
api.interceptors.request.use((config) => {
  const tokens = tokenStorage.getCached();
  if (tokens?.accessToken) {
    config.headers.set("Authorization", `Bearer ${tokens.accessToken}`);
  }

  // Only the /api/mobile/* surface declares the api-version query parameter.
  if (config.url && isMobileRoute(config.url)) {
    config.params = { "api-version": API_VERSION, ...(config.params ?? {}) };
  }

  (config as RetriableConfig)._startedAt = Date.now();

  log.info(`→ ${config.method?.toUpperCase()} ${config.url}`, {
    params: config.params,
    // FormData has no useful JSON representation.
    body:
      config.data instanceof FormData ? "«multipart/form-data»" : config.data,
    authenticated: !!tokens?.accessToken,
  });

  return config;
});

// ─── Token refresh (single-flight, queues concurrent 401s) ───────────────────
let refreshPromise: Promise<AuthTokens | null> | null = null;

/**
 * Uses a bare axios call rather than the shared instance so a failing refresh
 * cannot re-enter the response interceptor.
 */
async function refreshTokens(): Promise<AuthTokens | null> {
  const current = tokenStorage.getCached();
  if (!current?.refreshToken) return null;

  try {
    const { data } = await axios.post(
      `${API_BASE_URL}${ROUTES.auth.refreshToken}`,
      { refreshToken: current.refreshToken },
      { timeout: API_TIMEOUT_MS, headers: { Accept: "application/json" } },
    );

    const tokens = extractTokens(data);
    if (!tokens) return null;

    await tokenStorage.save(tokens);
    return tokens;
  } catch {
    return null;
  }
}

/**
 * Pulls a token pair out of an auth response.
 *
 * ⚠️ Auth responses are undocumented in the Swagger spec, so this accepts the
 * common ASP.NET shapes: a bare object, an `{ data }` envelope, and both
 * camelCase and PascalCase keys. Tighten it once the real shape is confirmed.
 */
export function extractTokens(payload: unknown): AuthTokens | null {
  if (!payload || typeof payload !== "object") return null;

  const root = payload as Record<string, unknown>;
  const body = (
    root.data && typeof root.data === "object" ? root.data : root
  ) as Record<string, unknown>;

  const accessToken =
    (body.accessToken as string) ??
    (body.AccessToken as string) ??
    (body.token as string) ??
    (body.Token as string) ??
    (body.access_token as string);

  if (!accessToken || typeof accessToken !== "string") return null;

  const refreshToken =
    (body.refreshToken as string) ??
    (body.RefreshToken as string) ??
    (body.refresh_token as string) ??
    null;

  // Accept either an absolute expiry timestamp or a TTL in seconds.
  let expiresAt: number | null = null;
  const rawExpiresAt = body.expiresAt ?? body.ExpiresAt ?? body.expires_at;
  const rawExpiresIn = body.expiresIn ?? body.ExpiresIn ?? body.expires_in;

  if (typeof rawExpiresAt === "string" || typeof rawExpiresAt === "number") {
    const parsed = new Date(rawExpiresAt).getTime();
    if (!Number.isNaN(parsed)) expiresAt = parsed;
  } else if (typeof rawExpiresIn === "number") {
    expiresAt = Date.now() + rawExpiresIn * 1000;
  }

  return { accessToken, refreshToken, expiresAt };
}

// ─── Response: unwrap envelope, normalize errors, refresh on 401 ─────────────
api.interceptors.response.use(
  (response) => {
    const config = response.config as RetriableConfig;
    const ms = config._startedAt ? Date.now() - config._startedAt : undefined;

    log.info(
      `← ${response.status} ${config.method?.toUpperCase()} ${config.url}${
        ms != null ? ` (${ms}ms)` : ""
      }`,
      response.data,
    );

    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const ms = config?._startedAt ? Date.now() - config._startedAt : undefined;

    // Network / timeout — never reached the server.
    if (!error.response) {
      log.error(
        `✕ NETWORK ${config?.method?.toUpperCase()} ${config?.url}${
          ms != null ? ` (${ms}ms)` : ""
        }`,
        { message: error.message, code: error.code, baseURL: API_BASE_URL },
      );
      throw new ApiError(
        error.message || "Network request failed",
        0,
        [],
        true,
      );
    }

    const { status, data } = error.response;

    log.error(
      `← ${status} ${config?.method?.toUpperCase()} ${config?.url}${
        ms != null ? ` (${ms}ms)` : ""
      }`,
      data,
    );

    // Attempt a single refresh-and-retry for expired access tokens.
    const isRefreshCall = config?.url?.includes(ROUTES.auth.refreshToken);
    if (status === 401 && config && !config._retried && !isRefreshCall) {
      config._retried = true;

      log.warn("401 — attempting token refresh");

      refreshPromise = refreshPromise ?? refreshTokens();
      const tokens = await refreshPromise;
      refreshPromise = null;

      if (tokens?.accessToken) {
        log.info("token refreshed, retrying original request");
        config.headers.set("Authorization", `Bearer ${tokens.accessToken}`);
        return api.request(config);
      }

      log.warn("token refresh failed — signing out");
      await tokenStorage.clear();
      onUnauthorized?.();
    }

    const envelope = data as Partial<ApiResponse<unknown>> | undefined;
    const message =
      envelope?.message ||
      envelope?.errors?.[0] ||
      error.message ||
      "Request failed";

    throw new ApiError(message, status, envelope?.errors ?? []);
  },
);

/**
 * Unwraps the `ApiResponse<T>` envelope used by `/api/mobile/*`.
 * Throws when the server reports `success: false` so failures surface the same
 * way as HTTP errors.
 */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await api.request<ApiResponse<T>>(config);
  const body = response.data;

  // Most routes spell the flag `success`; a few use `isSuccess`. Missing the
  // second spelling would return the whole envelope instead of `data`.
  const enveloped =
    !!body &&
    typeof body === "object" &&
    ("success" in body || "isSuccess" in body);

  if (enveloped) {
    const ok = body.success ?? body.isSuccess;
    if (!ok) {
      log.error(`✕ envelope success=false for ${config.url}`, {
        message: body.message,
        errors: body.errors,
      });
      throw new ApiError(
        body.message || body.errors?.[0] || "Request failed",
        response.status,
        body.errors ?? [],
      );
    }
    return body.data;
  }

  // Endpoints outside the mobile surface return their payload unwrapped.
  return body as unknown as T;
}

/** Issues a request without envelope unwrapping (binary downloads, auth). */
export async function requestRaw<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await api.request<T>(config);
  return response.data;
}
