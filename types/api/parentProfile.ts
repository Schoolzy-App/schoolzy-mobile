import type { UploadFile } from "@/services/api/multipart";

/**
 * Parent profile — `/api/mobile/parent-profile/*` and `/api/mobile/parent/*`.
 *
 * ⚠️ Swagger declares no response schema for any of these endpoints (every one
 * is `200 (no schema)`), so the response DTOs below come from the integration
 * guide's observed payloads where it has them, and are deliberately tolerant
 * where it doesn't. Fields the guide never showed are optional.
 *
 * Swagger also exposes four endpoints the guide predates — `relative-types`,
 * the per-link permission update, and relative detail/delete — which change
 * what the UI can offer. See the notes on each.
 */

// ─── Lookups ────────────────────────────────────────────────────────────────

/**
 * Genders, relative types and nationalities all come back in this shape.
 * `nameEn`/`nameAr` is what the guide observed for genders; `name` is accepted
 * because the other two lookups were never shown and the API is inconsistent
 * about it elsewhere.
 */
export interface LocalizedLookupDto {
  id: number;
  nameAr?: string | null;
  nameEn?: string | null;
  name?: string | null;
}

/**
 * ⚠️ Swagger types RelativeType as a bare int enum with values
 * 1,2,3,4,5,6,7,8,10 — note the gap at 9 — and gives no names. The names come
 * from `GET /relative-types`, which is why that lookup must drive the picker
 * rather than a hardcoded list.
 */
export type RelativeTypeId = number;

// ─── Relatives ──────────────────────────────────────────────────────────────

/** Item in GET /api/mobile/parent-profile/relatives */
export interface RelativeDto {
  relativeId: number;
  nameAr: string | null;
  nameEn: string | null;
  nationalId: string | null;
  phone: string | null;
  email: string | null;
  nationalityId: number | null;
  genderId: number | null;
  /**
   * ⚠️ Often a server-relative path such as
   * "/uploads/relative/<guid>_name.png" — it must be resolved against the API
   * host, and it is behind auth like every other file endpoint. May be null.
   */
  photoUrl: string | null;
  /** First letters of the first two words of the name, upper case. */
  initials?: string;
  hasPhoto?: boolean;
  nationalityName?: string | null;
  /**
   * The students this relative is linked to. The backend's list DTO
   * (FamilyRelativeDto) carries these too, with `hasPermission` = may collect
   * the student from school.
   */
  links?: RelativeLinkDto[] | null;
}

/** GET /api/mobile/parent-profile/relatives */
export interface RelativesResponseDto {
  relatives: RelativeDto[] | null;
}

/** One student's father/mother, from the guardians endpoint. */
export interface GuardianDto {
  /** ⚠️ A Parents.Id — not an AppUser, Relative or StudentRelatives id. */
  id: number;
  name: string | null;
}

/**
 * GET /api/mobile/parent-profile/students/guardians
 *
 * Active academic year only. Guardians are scoped per student — siblings are
 * not assumed to share parents — and either may be null.
 */
export interface StudentGuardiansDto {
  studentSeasonId: number;
  studentName: string | null;
  father: GuardianDto | null;
  mother: GuardianDto | null;
}

/**
 * GET /api/mobile/parent-profile/relatives/{relativeId}
 *
 * Not in the guide. Assumed to be the list shape plus the per-student links,
 * which the list endpoint explicitly does not carry — so everything beyond the
 * relative's own fields is optional until the shape is confirmed.
 */
export interface RelativeLinkDto {
  /** The StudentRelatives row id — what the permission endpoint takes. */
  studentRelativeId?: number | null;
  linkId?: number | null;
  studentSeasonId?: number | null;
  studentId?: number | null;
  studentName?: string | null;
  type?: RelativeTypeId | null;
  typeName?: string | null;
  mainParentId?: number | null;
  mainParentName?: string | null;
  hasPermission?: boolean | null;
  /** The child's educational mandate — cannot be removed from the app. */
  isEducationalMandate?: boolean | null;
}

export interface RelativeDetailDto extends RelativeDto {
  students?: RelativeLinkDto[] | null;
  studentRelatives?: RelativeLinkDto[] | null;
}

// ─── Save ───────────────────────────────────────────────────────────────────

/** One entry in the save payload's `students` array. */
export interface AssignRelativeStudentInput {
  studentSeasonId: number;
  /** Null lets the backend default to Other on a new or reactivated link. */
  type?: RelativeTypeId | null;
  /** This student's father or mother Parents.Id. */
  mainParentId?: number | null;
  /** Allowed to collect the student from school. Defaults false. */
  hasPermission?: boolean | null;
}

/**
 * The JSON that goes in the multipart `request` field.
 *
 * ⚠️ The guide calls `nameAr` required; Swagger documents it as "Optional; the
 * English name is used when empty." Swagger is the deployed contract, so the
 * form treats Arabic as optional — requiring it would block a save the server
 * would have accepted.
 */
export interface SaveRelativeRequest {
  /** Null creates; an id updates that relative's own fields. */
  relativeId?: number | null;
  nameAr?: string | null;
  nameEn: string;
  /** National ID or passport; may contain letters. Used for duplicate detection. */
  nationalId: string;
  phone?: string | null;
  email?: string | null;
  nationalityId?: number | null;
  genderId?: number | null;
  /** At least one, no duplicate students. */
  students: AssignRelativeStudentInput[];
}

/** POST /api/mobile/parent-profile/relatives — multipart. */
export interface SaveRelativeInput {
  request: SaveRelativeRequest;
  /**
   * ⚠️ The backend rejects `application/octet-stream` even when the filename
   * ends in .png, so the part needs a real image MIME type. Max 5 MiB.
   */
  photo?: UploadFile;
}

export interface SavedRelativeLinkDto {
  studentSeasonId: number;
  studentId: number;
  /** The StudentRelatives row, not the relative or the parent. */
  studentRelativeId: number;
}

export interface SaveRelativeResponseDto {
  relativeId: number;
  nameAr: string | null;
  nameEn: string | null;
  studentRelatives: SavedRelativeLinkDto[] | null;
}

/**
 * PUT /api/mobile/parent-profile/relatives/links/{linkId}/permission
 *
 * ⚠️ Not in the guide, which states flatly that "Existing active links cannot
 * be edited through Save Relative" — true, but this endpoint edits the one
 * field that matters, so pickup permission is changeable after the fact.
 */
export interface UpdateRelativePermissionInput {
  linkId: number;
  hasPermission: boolean;
}

// ─── The parent's own information ───────────────────────────────────────────

/**
 * GET /api/mobile/parent/profile — "My Information".
 *
 * No response schema in Swagger; modelled on the update request's fields plus
 * the display extras a profile screen needs. All optional.
 */
export interface ParentInfoDto {
  /** "Father" or "Mother" — which parent record this describes. */
  role?: string | null;
  name?: string | null;
  mobile?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  job?: string | null;
  nationalityId?: number | null;
  nationalityName?: string | null;
  photoUrl?: string | null;
  /** Read-only on the app: changed by the school office. */
  nationalId?: string | null;
  /** The account's sign-in email (not the contact email). */
  loginEmail?: string | null;
  canEdit?: boolean;
  /** Field keys ("name", "mobile"…) that go to the school for review. */
  reviewFields?: string[] | null;
  hasPendingChanges?: boolean;
  /** Changes waiting for the school, then the latest decisions. */
  pendingChanges?: ParentInfoChangeDto[] | null;
}

/** 1 Pending · 2 Approved · 3 Rejected · 4 Superseded */
export enum ParentInfoItemStatus {
  Pending = 1,
  Approved = 2,
  Rejected = 3,
  Superseded = 4,
}

export interface ParentInfoChangeDto {
  id: number;
  /** "name", "mobile", "phone", "email", "address", "job", "nationalityId" */
  fieldKey: string;
  fieldDisplay?: string | null;
  currentValue?: string | null;
  requestedValue?: string | null;
  status: ParentInfoItemStatus;
  statusDisplay?: string | null;
  rejectReason?: string | null;
  submittedAt?: string | null;
  decidedAt?: string | null;
}

/** PUT /api/mobile/parent/profile → data */
export interface ParentInfoSaveResultDto {
  /** Field keys saved at once. */
  applied: string[];
  /** Field keys sent to the school for review. */
  pendingReview: string[];
  profile: ParentInfoDto;
}

/**
 * PUT /api/mobile/parent/profile
 *
 * Swagger: "Saves changed fields. Depending on the school settings some go to
 * the school for review" — so a successful save does not guarantee the value
 * is live, and the UI says so rather than implying it took effect.
 */
export interface UpdateParentInfoInput {
  /** Empty means the signed-in parent. */
  role?: string | null;
  name?: string | null;
  mobile?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  job?: string | null;
  nationalityId?: number | null;
}
