import type { CurrentUserInfoDto } from "@/types/api";
import { request, requestRaw } from "./client";
import { ROUTES } from "./config";

/**
 * ⚠️ GET /api/v1/home has NO documented response schema in the Swagger spec, so
 * its payload is typed as `unknown`. Once the backend publishes the shape, add
 * a `HomeDto` to `types/api/` and swap the generic here — `useHome()` will pick
 * the type up automatically.
 */
export const homeApi = {
  get<T = unknown>(): Promise<T> {
    return requestRaw<T>({ method: "GET", url: ROUTES.home });
  },
};

/** GET /api/v1/Ping — connectivity/health check. */
export const pingApi = {
  get<T = unknown>(): Promise<T> {
    return requestRaw<T>({ method: "GET", url: ROUTES.ping });
  },
};

/** GET /api/v1/home/current-user */
export const currentUserApi = {
  get(): Promise<CurrentUserInfoDto> {
    return request<CurrentUserInfoDto>({
      method: "GET",
      url: ROUTES.currentUser,
    });
  },
};
