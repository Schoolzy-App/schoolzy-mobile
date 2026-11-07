/**
 * Current user DTO — `GET /api/v1/home/current-user`.
 *
 * ⚠️ This route's envelope uses `isSuccess`, not `success`. `request()` accepts
 * both; without that it would hand back the whole envelope instead of `data`.
 */
export interface CurrentUserInfoDto {
  name: string | null;
  /** "Parent" or "Relative" today. */
  userType: string;
  /** Normalized by the backend, e.g. "Male" / "Female". Nullable. */
  gender: string | null;
}
