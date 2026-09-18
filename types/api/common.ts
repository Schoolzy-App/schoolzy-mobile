/**
 * Shared API primitives.
 *
 * Every `/api/mobile/*` endpoint wraps its payload in the same envelope, so the
 * client unwraps `data` centrally and callers only ever see the payload.
 */

/**
 * Standard response envelope returned by the mobile API.
 *
 * ⚠️ The success flag is spelled `success` on most routes but `isSuccess` on
 * some (e.g. `/api/v1/home/current-user`). Both are accepted — see `request()`.
 */
export interface ApiResponse<T> {
  success?: boolean;
  isSuccess?: boolean;
  message: string | null;
  errors: string[] | null;
  data: T;
}

/**
 * ISO-8601 date-time string as returned by the API (e.g. "2026-05-16T09:30:00Z").
 * Kept as a string — convert at the edge with `new Date(value)`.
 */
export type IsoDateTime = string;

/** Shape of a file being uploaded through `multipart/form-data`. */
export interface UploadFile {
  /** Local file URI (e.g. from expo-image-picker / expo-document-picker). */
  uri: string;
  /** File name including extension — the server uses this verbatim. */
  name: string;
  /** MIME type, e.g. "application/pdf" or "image/jpeg". */
  type: string;
}

/** Normalized error surfaced by the API client for every failed request. */
export class ApiError extends Error {
  /** HTTP status code, or 0 when the request never reached the server. */
  readonly status: number;
  /** Field/validation errors returned in the envelope, when present. */
  readonly errors: string[];
  /** True when the failure was a network/timeout issue rather than an HTTP error. */
  readonly isNetworkError: boolean;

  constructor(
    message: string,
    status: number,
    errors: string[] = [],
    isNetworkError = false,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.isNetworkError = isNetworkError;
  }
}
