import { resolvePhotoUrl } from "@/services/api/parentProfile";
import {
  BehaviourKind,
  type BehaviourCertificateDto,
  type BehaviourItemDto,
  type BehaviourMilestoneDto,
  type StudentBehaviourDto,
} from "@/types/api";

export interface BehaviourHouse {
  id: number;
  name: string;
  /** Falls back to a neutral brand-free colour when the school set none. */
  colour: string;
  /** Absolute, ready for <Image>. */
  logoUri: string | null;
  rank: number | null;
  houseCount: number | null;
  points: number;
}

export interface BehaviourEntry {
  id: number;
  isMerit: boolean;
  /** "+2" / "-1" */
  pointsLabel: string;
  reason: string;
  category: string;
  icon: string | null;
  note: string;
  awardedBy: string;
  /** The day it happened (falls back to when it was recorded). */
  date: string | null;
}

export interface BehaviourCertificate {
  id: number;
  name: string;
  threshold: number;
  awardedAt: string | null;
  studentReportId: number | null;
  colour: string | null;
}

export interface StudentBehaviour {
  studentName: string;
  className: string;
  meritPoints: number;
  demeritPoints: number;
  net: number;
  meritCount: number;
  demeritCount: number;
  house: BehaviourHouse | null;
  certificates: BehaviourCertificate[];
  nextMilestone: BehaviourMilestoneDto | null;
  /** Every loaded page, newest first, de-duplicated by id. */
  entries: BehaviourEntry[];
  totalItems: number;
}

export const DEFAULT_HOUSE_COLOUR = "#4E7FD0";

/** "#1565C0" / "1565C0" / "#15C" → a usable colour, else null. */
function cleanColour(value?: string | null): string | null {
  const text = value?.trim();
  if (!text) return null;
  const hex = text.startsWith("#") ? text : `#${text}`;
  return /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(hex) ? hex : null;
}

export function toBehaviourEntry(dto: BehaviourItemDto): BehaviourEntry {
  const isMerit = dto.kind !== BehaviourKind.Demerit;
  const amount = Math.abs(dto.signed || dto.points || 0);
  return {
    id: dto.id,
    isMerit,
    pointsLabel: `${isMerit ? "+" : "-"}${amount}`,
    reason: dto.reason?.trim() ?? "",
    category: dto.category?.trim() ?? "",
    icon: dto.icon ?? null,
    note: dto.note?.trim() ?? "",
    awardedBy: dto.awardedBy?.trim() ?? "",
    date: dto.date ?? dto.createdAt ?? null,
  };
}

function toCertificate(dto: BehaviourCertificateDto): BehaviourCertificate {
  return {
    id: dto.id,
    name: dto.name?.trim() ?? "",
    threshold: dto.threshold,
    awardedAt: dto.awardedAt,
    studentReportId: dto.studentReportId ?? null,
    colour: cleanColour(dto.colour),
  };
}

/** Infinite-query `select`: the summary from page 1, items from every page. */
export function selectStudentBehaviour(data: {
  pages: StudentBehaviourDto[];
}): StudentBehaviour {
  const first = data.pages[0];
  const seen = new Set<number>();
  const entries: BehaviourEntry[] = [];
  for (const page of data.pages) {
    for (const item of page.items ?? []) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      entries.push(toBehaviourEntry(item));
    }
  }

  const house = first?.house;
  return {
    studentName: first?.studentName?.trim() ?? "",
    className: first?.className?.trim() ?? "",
    meritPoints: first?.meritPoints ?? 0,
    demeritPoints: first?.demeritPoints ?? 0,
    net: first?.net ?? 0,
    meritCount: first?.meritCount ?? 0,
    demeritCount: first?.demeritCount ?? 0,
    house: house
      ? {
          id: house.id,
          name: house.name?.trim() ?? "",
          colour: cleanColour(house.colour) ?? DEFAULT_HOUSE_COLOUR,
          logoUri: resolvePhotoUrl(house.logoUrl),
          rank: house.rank ?? null,
          houseCount: house.houseCount ?? null,
          points: house.points ?? 0,
        }
      : null,
    certificates: (first?.certificates ?? []).map(toCertificate),
    nextMilestone: first?.nextMilestone ?? null,
    entries,
    totalItems: first?.totalItems ?? entries.length,
  };
}

/** Next page number, or undefined once every item is loaded. */
export function nextBehaviourPage(
  last: StudentBehaviourDto,
  pages: StudentBehaviourDto[],
): number | undefined {
  const loaded = pages.reduce((n, p) => n + (p.items?.length ?? 0), 0);
  if (!last.items?.length) return undefined;
  return loaded < (last.totalItems ?? 0) ? (last.page ?? pages.length) + 1 : undefined;
}
