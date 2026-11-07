import type { CurrentUserInfoDto } from "@/types/api";

/**
 * `GET /api/v1/home/current-user` → UI.
 */

export interface CurrentUser {
  name: string;
  /** "Parent" / "Relative" as returned, or "" when absent. */
  userType: string;
  /** "Male" / "Female" as normalized by the backend, or "" when absent. */
  gender: string;
  /**
   * How the account is described to the user: "Father" / "Mother" when both the
   * type and gender are known, otherwise the broader term.
   *
   * ⚠️ Derived, not returned by the API. `userType` is only "Parent" or
   * "Relative", so gender is the only thing that can narrow it — and a missing
   * gender must fall back rather than guess.
   */
  roleLabel: string;
}

function toRoleLabel(userType: string, gender: string): string {
  const isParent = userType.toLowerCase() === "parent";
  const g = gender.toLowerCase();

  if (isParent && g === "male") return "Father";
  if (isParent && g === "female") return "Mother";
  if (isParent) return "Parent";

  // "Relative", or any type added later — shown as returned rather than
  // forced into a parent-shaped label.
  return userType || "Guardian";
}

export function selectCurrentUser(dto: CurrentUserInfoDto): CurrentUser {
  const name = dto.name?.trim() ?? "";
  const userType = dto.userType?.trim() ?? "";
  const gender = dto.gender?.trim() ?? "";

  return {
    name,
    userType,
    gender,
    roleLabel: toRoleLabel(userType, gender),
  };
}
