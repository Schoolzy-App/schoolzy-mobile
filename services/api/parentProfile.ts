import type {
  LocalizedLookupDto,
  ParentInfoDto,
  RelativeDetailDto,
  RelativesResponseDto,
  SaveRelativeInput,
  SaveRelativeResponseDto,
  StudentGuardiansDto,
  UpdateParentInfoInput,
  UpdateRelativePermissionInput,
} from "@/types/api";

import { request } from "./client";
import { API_BASE_URL, API_VERSION, ROUTES } from "./config";
import { fileAuthHeaders } from "./fileAuth";
import { appendFile } from "./multipart";

/**
 * Resolves a relative's `photoUrl` for display.
 *
 * The API returns a server-relative path like
 * "/uploads/relative/<guid>_name.png". Rendering that directly would resolve
 * against nothing on a native client, so it is joined to the API host here.
 * An absolute URL is passed through untouched.
 */
export function resolvePhotoUrl(photoUrl?: string | null): string | null {
  const path = photoUrl?.trim();
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export const parentProfileApi = {
  // ── Relatives ─────────────────────────────────────────────────────────

  /**
   * GET /api/mobile/parent-profile/relatives
   *
   * Distinct active relatives across all accessible children and years. A
   * relative linked to two children appears once, and the payload carries no
   * link metadata — which student a relative belongs to cannot be inferred
   * from here.
   */
  relatives(): Promise<RelativesResponseDto> {
    return request<RelativesResponseDto>({
      method: "GET",
      url: ROUTES.parentProfile.relatives,
    });
  },

  /** GET /api/mobile/parent-profile/relatives/{relativeId} */
  relative(relativeId: number): Promise<RelativeDetailDto> {
    return request<RelativeDetailDto>({
      method: "GET",
      url: ROUTES.parentProfile.relative(relativeId),
    });
  },

  /** DELETE /api/mobile/parent-profile/relatives/{relativeId} */
  deleteRelative(relativeId: number): Promise<unknown> {
    return request<unknown>({
      method: "DELETE",
      url: ROUTES.parentProfile.relative(relativeId),
    });
  },

  /**
   * POST /api/mobile/parent-profile/relatives (multipart/form-data).
   *
   * The payload goes in a single `request` field as a JSON string — the
   * server binds it with [FromFormJson], not as individual form fields.
   *
   * The caller supplies the idempotency key so a retry of the *same* save
   * reuses it; a fresh key on retry could create a second relative.
   */
  saveRelative(
    { request: payload, photo }: SaveRelativeInput,
    idempotencyKey: string,
  ): Promise<SaveRelativeResponseDto> {
    const form = new FormData();
    form.append("request", JSON.stringify(payload));
    // Omitting the part preserves any existing photo; sending one replaces it.
    if (photo) appendFile(form, "photo", photo);

    return request<SaveRelativeResponseDto>({
      method: "POST",
      url: ROUTES.parentProfile.relatives,
      data: form,
      headers: {
        "Content-Type": "multipart/form-data",
        "Idempotency-Key": idempotencyKey,
      },
    });
  },

  /**
   * PUT /api/mobile/parent-profile/relatives/links/{linkId}/permission
   *
   * The one piece of an existing link that can be changed. `linkId` is the
   * StudentRelatives row id, which comes from the save response's
   * `studentRelativeId` or the relative detail — never the relative's own id.
   */
  updateLinkPermission({
    linkId,
    hasPermission,
  }: UpdateRelativePermissionInput): Promise<unknown> {
    return request<unknown>({
      method: "PUT",
      url: ROUTES.parentProfile.linkPermission(linkId),
      data: { hasPermission },
    });
  },

  // ── Lookups ───────────────────────────────────────────────────────────

  genders(): Promise<LocalizedLookupDto[]> {
    return request<LocalizedLookupDto[]>({
      method: "GET",
      url: ROUTES.parentProfile.genders,
    });
  },

  /** Names for the RelativeType enum — Swagger gives only the raw ints. */
  relativeTypes(): Promise<LocalizedLookupDto[]> {
    return request<LocalizedLookupDto[]>({
      method: "GET",
      url: ROUTES.parentProfile.relativeTypes,
    });
  },

  nationalities(): Promise<LocalizedLookupDto[]> {
    return request<LocalizedLookupDto[]>({
      method: "GET",
      url: ROUTES.parent.nationalities,
    });
  },

  /** GET /api/mobile/parent-profile/students/guardians — active year only. */
  guardians(): Promise<StudentGuardiansDto[]> {
    return request<StudentGuardiansDto[]>({
      method: "GET",
      url: ROUTES.parentProfile.guardians,
    });
  },

  // ── The parent's own information ──────────────────────────────────────

  profile(): Promise<ParentInfoDto> {
    return request<ParentInfoDto>({
      method: "GET",
      url: ROUTES.parent.profile,
    });
  },

  /**
   * PUT /api/mobile/parent/profile — saves changed fields only.
   *
   * Some fields go to the school for review depending on settings, so a
   * success here does not mean the new value is live.
   */
  updateProfile(input: UpdateParentInfoInput): Promise<unknown> {
    return request<unknown>({
      method: "PUT",
      url: ROUTES.parent.profile,
      data: input,
    });
  },

  /** Relative photos sit behind auth like every other file endpoint. */
  getPhotoHeaders: fileAuthHeaders,

  /** Kept alongside the API module so callers don't rebuild the host. */
  photoUrl: resolvePhotoUrl,

  /** Exposed for the viewer, which needs the versioned URL form. */
  versionedPhotoUrl(photoUrl?: string | null): string | null {
    const url = resolvePhotoUrl(photoUrl);
    return url ? `${url}${url.includes("?") ? "&" : "?"}api-version=${API_VERSION}` : null;
  },
};
