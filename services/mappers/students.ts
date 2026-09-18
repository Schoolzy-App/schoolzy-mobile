import { Icons } from "@/constants";
import type { StudentListItemDto, StudentProfileDto } from "@/types/api";
import type { ChildData } from "@/types/child";

/**
 * DTO → UI mappers.
 *
 * These are module-scope pure functions on purpose: react-query's `select`
 * only skips recomputation when the function identity is stable, so defining
 * them inside a component would re-run the transform on every render.
 */

/**
 * The API returns gender as "Male" / "Female"; the UI models it as a union.
 *
 * ⚠️ Confirmed on the profile endpoint. The students LIST payload has not been
 * seen carrying it, so the fallback stays — allergies, blood type and
 * attendance are still absent from both.
 */
const DEFAULT_GENDER: ChildData["gender"] = "female";
const UNKNOWN = "N/A";

export function toGender(value?: string | null): ChildData["gender"] {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "male" || normalized === "m") return "male";
  if (normalized === "female" || normalized === "f") return "female";
  return DEFAULT_GENDER;
}

/** "Year 6 (B)" from the grade/class pair, tolerating missing parts. */
export function formatYear(
  gradeName?: string | null,
  className?: string | null,
): string {
  if (gradeName && className) return `${gradeName} (${className})`;
  return gradeName ?? className ?? "";
}

export function toChildData(dto: StudentListItemDto): ChildData {
  const gender = toGender(dto.gender);

  return {
    id: String(dto.studentSeasonId),
    name: dto.name ?? "",
    year: formatYear(dto.gradeName, dto.className),
    gender,
    activeBus: dto.hasBus,
    // Not provided by the API — surfaced as "N/A" rather than invented.
    allergies: UNKNOWN,
    bloodType: UNKNOWN,
    attendance: UNKNOWN,
    avatarIcon: gender === "male" ? Icons.BoyAvatar : Icons.GirlAvatar,
  };
}

/** `select` for the students list query. */
export function selectChildren(data: StudentListItemDto[]): ChildData[] {
  return data.map(toChildData);
}

/** First name only — used in screen titles ("Agenda for Leena"). */
export function firstName(fullName?: string | null): string {
  return fullName?.trim().split(" ")[0] ?? "";
}

/** Header summary derived from a student profile. */
export interface StudentProfileSummary {
  studentSeasonId: number;
  name: string;
  firstName: string;
  gender: ChildData["gender"];
  year: string;
  healthProfileId: number | null;
  latest: StudentProfileDto["latest"];
}

export function selectStudentProfile(
  dto: StudentProfileDto,
): StudentProfileSummary {
  return {
    studentSeasonId: dto.studentSeasonId,
    name: dto.studentName ?? "",
    firstName: firstName(dto.studentName),
    gender: toGender(dto.gender),
    year: formatYear(dto.gradeName, dto.className),
    healthProfileId: dto.healthProfileId,
    latest: dto.latest,
  };
}
