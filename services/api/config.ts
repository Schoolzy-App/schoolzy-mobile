import Constants from "expo-constants";

import { AppConfig } from "@/apps";
import type { NewsletterItemSource } from "@/types/api";

/**
 * Base URL resolution, highest priority first:
 *
 * 1. `EXPO_PUBLIC_API_URL` — build-time override for pointing a build at a
 *    different environment without touching code.
 * 2. `Config.apiUrl` in `apps/<variant>.ts` — the per-app default, so Brighton,
 *    Schoolzy and Ajial can each move to their own host independently.
 * 3. `extra.apiUrl` in `app.config.ts` — optional per-variant escape hatch.
 *
 * (The Swagger spec ships an empty `servers` array, so the host has to come
 * from the app rather than the schema.)
 */
const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string };

/** Trailing slashes would produce `//api/...` once joined with a route. */
const stripTrailingSlash = (url: string) => url.replace(/\/+$/, "");

export const API_BASE_URL = stripTrailingSlash(
  process.env.EXPO_PUBLIC_API_URL ?? AppConfig.apiUrl ?? extra.apiUrl ?? "",
);

/**
 * Every `/api/mobile/*` endpoint accepts an optional `api-version` query
 * parameter. It is sent on all mobile requests so the backend can route
 * versioned handlers; override with `EXPO_PUBLIC_API_VERSION` if needed.
 */
export const API_VERSION = process.env.EXPO_PUBLIC_API_VERSION ?? "1.0";

/** Request timeout in milliseconds. */
export const API_TIMEOUT_MS = 20_000;

/**
 * The API exposes two route prefixes:
 * - `/api/v1/*`     — auth, home, ping
 * - `/api/mobile/*` — students, agenda, document requests, newsletters
 */
export const ROUTES = {
  auth: {
    login: "/api/v1/auth/login",
    refreshToken: "/api/v1/auth/refresh-token",
    logout: "/api/v1/auth/logout",
    sendOtp: "/api/v1/auth/otp/send",
    verifyOtp: "/api/v1/auth/otp/verify",
    resetPassword: "/api/v1/auth/reset-password",
    changePassword: "/api/v1/auth/change-password",
  },
  home: "/api/v1/home",
  /** Name, user type and gender of the signed-in parent/relative. */
  currentUser: "/api/v1/home/current-user",
  ping: "/api/v1/Ping",
  students: {
    list: "/api/mobile/students",
    profile: (studentSeasonId: number) =>
      `/api/mobile/students/${studentSeasonId}/profile`,
    agenda: (studentSeasonId: number) =>
      `/api/mobile/students/${studentSeasonId}/agenda`,
    reports: (studentSeasonId: number) =>
      `/api/mobile/students/${studentSeasonId}/reports`,
    /**
     * Report files used to arrive as an absolute `fileUrl` on another host.
     * They are now served from here and require the bearer token.
     */
    reportFile: (studentSeasonId: number, reportId: number) =>
      `/api/mobile/students/${studentSeasonId}/reports/${reportId}/file`,
  },
  documentRequests: {
    createOptions: "/api/mobile/document-requests/create-options",
    list: "/api/mobile/document-requests",
    create: "/api/mobile/document-requests",
    detail: (id: number) => `/api/mobile/document-requests/${id}`,
    file: (fileId: number) => `/api/mobile/document-requests/files/${fileId}`,
    uploadFile: (requestId: number) =>
      `/api/mobile/document-requests/${requestId}/files`,
  },
  newsletters: {
    list: "/api/mobile/newsletters",
    /**
     * Source-scoped: the list mixes real newsletters with student reports, and
     * their ids come from different tables and can collide. The backend needs
     * `source` to know which table to look in.
     */
    file: (source: NewsletterItemSource, id: number) =>
      `/api/mobile/newsletters/${source}/${id}/file`,
  },
  healthProfile: {
    overview: (studentSeasonId: number) =>
      `/api/mobile/health-profile/${studentSeasonId}`,
    edit: (studentSeasonId: number) =>
      `/api/mobile/health-profile/${studentSeasonId}/edit`,
    save: (studentSeasonId: number) =>
      `/api/mobile/health-profile/${studentSeasonId}`,
    attachments: (studentSeasonId: number) =>
      `/api/mobile/health-profile/${studentSeasonId}/attachments`,
    attachment: (studentSeasonId: number, attachmentId: number) =>
      `/api/mobile/health-profile/${studentSeasonId}/attachments/${attachmentId}`,
    attachmentFile: (studentSeasonId: number, attachmentId: number) =>
      `/api/mobile/health-profile/${studentSeasonId}/attachments/${attachmentId}/file`,
  },
  payments: {
    history: (studentSeasonId: number) =>
      `/api/mobile/student-payments/${studentSeasonId}/history`,
    due: (studentSeasonId: number) =>
      `/api/mobile/student-payments/${studentSeasonId}/due`,
    /** Not student-scoped — the category list is the same for every student. */
    categories: () => `/api/mobile/student-payments/categories`,
    igAccountOptions: (studentSeasonId: number) =>
      `/api/mobile/student-payments/${studentSeasonId}/ig-account-options`,
    /** Idempotency-protected. Completes immediately. */
    wallet: () => `/api/mobile/student-payments/wallet`,
    /** Idempotency-protected, multipart. Starts as "Pending". */
    online: () => `/api/mobile/student-payments/online`,
  },
  /** Daily class schedule. Student-scoped via the query string, not the path. */
  timetable: "/api/mobile/timetable",

  wallet: {
    balance: (studentSeasonId: number) =>
      `/api/mobile/wallet/${studentSeasonId}/balance`,
    /** Every student the authenticated user can access. */
    balances: "/api/mobile/wallet/balances",
  },

  notifications: {
    devices: "/api/mobile/notifications/devices",
    list: "/api/mobile/notifications",
    recent: "/api/mobile/notifications/recent",
    unreadCount: "/api/mobile/notifications/unread-count",
    markRead: (notificationId: number) =>
      `/api/mobile/notifications/${notificationId}/read`,
    markAllRead: "/api/mobile/notifications/read-all",
  },
  // "cafeteriaa" (double A) is the real server spelling — verified on dev.
  cafeteria: {
    meals: "/api/mobile/cafeteriaa/meals",
    mealItems: (mealId: number) =>
      `/api/mobile/cafeteriaa/meals/${mealId}/items`,
    mealOrders: "/api/mobile/cafeteriaa/meal-orders",
    /** Wallet balance + the available payment methods. */
    paymentOptions: "/api/mobile/cafeteriaa/payment-options",
    /** Idempotency-protected. One order per meal. */
    checkoutWallet: "/api/mobile/cafeteriaa/checkout/wallet",
    /** Idempotency-protected, multipart with payment proof. */
    checkoutInsta: "/api/mobile/cafeteriaa/checkout/insta",
  },
} as const;

/** True when a path belongs to the versioned mobile surface. */
export const isMobileRoute = (url: string) => url.startsWith("/api/mobile");
