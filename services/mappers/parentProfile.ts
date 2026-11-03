import type { DefaultInputOption } from "@/components/ui";
import { resolvePhotoUrl } from "@/services/api/parentProfile";
import type {
  LocalizedLookupDto,
  ParentInfoDto,
  RelativeDetailDto,
  RelativeDto,
  RelativeLinkDto,
  RelativesResponseDto,
  StudentGuardiansDto,
} from "@/types/api";

/**
 * Parent profile → UI.
 */

// ─── Lookups ────────────────────────────────────────────────────────────────

/**
 * Genders came back as `{ id, nameAr, nameEn }`; relative types and
 * nationalities were never shown, so `name` is accepted too. English first,
 * because the rest of the app is English — falling back to Arabic beats
 * rendering "#5".
 */
export function lookupLabel(item: LocalizedLookupDto): string {
  return (
    item.nameEn?.trim() ||
    item.name?.trim() ||
    item.nameAr?.trim() ||
    `#${item.id}`
  );
}

export function selectLookupOptions(
  data: LocalizedLookupDto[],
): DefaultInputOption[] {
  return (data ?? []).map((item) => ({
    label: lookupLabel(item),
    value: String(item.id),
  }));
}

/** Id → label, for rendering a stored id without re-searching the list. */
export function lookupMap(data: LocalizedLookupDto[]): Record<string, string> {
  const map: Record<string, string> = {};
  (data ?? []).forEach((item) => {
    map[String(item.id)] = lookupLabel(item);
  });
  return map;
}

// ─── Relatives ──────────────────────────────────────────────────────────────

export interface Relative {
  id: string;
  relativeId: number;
  /** English name, falling back to Arabic. */
  name: string;
  nameAr: string;
  nameEn: string;
  nationalId: string;
  phone: string;
  email: string;
  nationalityId: number | null;
  genderId: number | null;
  /** Absolute and ready for an <Image>, or null. */
  photoUrl: string | null;
  /** "01030464893 · Hady@gmail.com" — whatever contact detail exists. */
  contact: string;
  /** First letter, for the fallback avatar when there is no photo. */
  initial: string;
}

export function toRelative(dto: RelativeDto): Relative {
  const nameEn = dto.nameEn?.trim() ?? "";
  const nameAr = dto.nameAr?.trim() ?? "";
  const name = nameEn || nameAr || "Relative";

  return {
    id: String(dto.relativeId),
    relativeId: dto.relativeId,
    name,
    nameAr,
    nameEn,
    nationalId: dto.nationalId ?? "",
    phone: dto.phone ?? "",
    email: dto.email ?? "",
    nationalityId: dto.nationalityId,
    genderId: dto.genderId,
    photoUrl: resolvePhotoUrl(dto.photoUrl),
    contact: [dto.phone, dto.email].filter(Boolean).join(" · "),
    initial: name.charAt(0).toUpperCase(),
  };
}

/** `select` for the relatives query. */
export function selectRelatives(dto: RelativesResponseDto): Relative[] {
  return (dto?.relatives ?? []).map(toRelative);
}

// ─── Relative detail ────────────────────────────────────────────────────────

/** One student a relative is linked to. */
export interface RelativeLink {
  id: string;
  /** StudentRelatives row id — what the permission endpoint takes. */
  linkId: number | null;
  studentSeasonId: number | null;
  studentName: string;
  typeName: string;
  mainParentName: string;
  hasPermission: boolean;
}

export interface RelativeDetail extends Relative {
  links: RelativeLink[];
}

/**
 * The detail endpoint isn't in the guide and Swagger declares no schema, so
 * the links array could plausibly arrive under any of three names. All are
 * read rather than guessing one and shipping an empty list.
 */
function linksOf(dto: RelativeDetailDto): RelativeLinkDto[] {
  return dto.students ?? dto.links ?? dto.studentRelatives ?? [];
}

function toRelativeLink(dto: RelativeLinkDto, index: number): RelativeLink {
  const linkId = dto.studentRelativeId ?? dto.linkId ?? null;
  return {
    id: String(linkId ?? dto.studentSeasonId ?? index),
    linkId,
    studentSeasonId: dto.studentSeasonId ?? null,
    studentName: dto.studentName ?? "",
    typeName: dto.typeName ?? "",
    mainParentName: dto.mainParentName ?? "",
    hasPermission: !!dto.hasPermission,
  };
}

export function selectRelativeDetail(dto: RelativeDetailDto): RelativeDetail {
  return {
    ...toRelative(dto),
    links: linksOf(dto).map(toRelativeLink),
  };
}

// ─── Guardians ──────────────────────────────────────────────────────────────

/** A student the relative can be assigned to, with that student's parents. */
export interface GuardianStudent {
  id: string;
  studentSeasonId: number;
  studentName: string;
  /**
   * Father and mother for THIS student. Scoped per student rather than per
   * family — the guide warns siblings may not share parents, so the picker is
   * rebuilt for each selected student rather than shared.
   */
  parentOptions: DefaultInputOption[];
}

export function selectGuardianStudents(
  data: StudentGuardiansDto[],
): GuardianStudent[] {
  return (data ?? []).map((dto) => {
    const parentOptions: DefaultInputOption[] = [];
    if (dto.father) {
      parentOptions.push({
        label: `${dto.father.name ?? "Father"} (Father)`,
        value: String(dto.father.id),
      });
    }
    if (dto.mother) {
      parentOptions.push({
        label: `${dto.mother.name ?? "Mother"} (Mother)`,
        value: String(dto.mother.id),
      });
    }

    return {
      id: String(dto.studentSeasonId),
      studentSeasonId: dto.studentSeasonId,
      studentName: dto.studentName ?? "",
      parentOptions,
    };
  });
}

// ─── The parent's own information ───────────────────────────────────────────

export interface ParentInfoField {
  key: keyof ParentInfo;
  label: string;
  value: string;
}

export interface ParentInfo {
  role: string;
  name: string;
  mobile: string;
  phone: string;
  email: string;
  address: string;
  job: string;
  nationalityId: number | null;
  nationalityName: string;
  photoUrl: string | null;
}

export function selectParentInfo(dto: ParentInfoDto): ParentInfo {
  return {
    role: dto.role?.trim() ?? "",
    name: dto.name?.trim() ?? "",
    mobile: dto.mobile?.trim() ?? "",
    phone: dto.phone?.trim() ?? "",
    email: dto.email?.trim() ?? "",
    address: dto.address?.trim() ?? "",
    job: dto.job?.trim() ?? "",
    nationalityId: dto.nationalityId ?? null,
    nationalityName: dto.nationalityName?.trim() ?? "",
    photoUrl: resolvePhotoUrl(dto.photoUrl),
  };
}

/** The read-only rows on the profile screen, blanks omitted. */
export function parentInfoFields(info: ParentInfo): ParentInfoField[] {
  const rows: { key: keyof ParentInfo; label: string; value: string }[] = [
    { key: "mobile", label: "Mobile", value: info.mobile },
    { key: "phone", label: "Phone", value: info.phone },
    { key: "email", label: "Email", value: info.email },
    { key: "job", label: "Job", value: info.job },
    { key: "address", label: "Address", value: info.address },
    {
      key: "nationalityName",
      label: "Nationality",
      value: info.nationalityName,
    },
  ];
  return rows.filter((row) => !!row.value);
}
