import type {
  DynamicStateData,
  DynamicStateType,
} from "@/components/DynamicStateItem";
import type {
  DashboardAttentionDto,
  DashboardChildDto,
  DashboardNewsletterDto,
  DashboardUpcomingDto,
  GlanceItemDto,
  GlanceSectionDto,
  ParentDashboardDto,
  QuickActionDto,
} from "@/types/api";
import { formatCurrency, formatDate } from "@/utils/format";

/**
 * Parent dashboard → UI.
 *
 * Two rules run through all of it. Labels come in `*En`/`*Ar` pairs and the
 * app shows English. And a tile's `state` decides how its value reads: an
 * `unavailable` tile is not a zero, so it renders "—" rather than a number
 * the server never actually determined.
 */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// ─── Parent ─────────────────────────────────────────────────────────────────

export interface DashboardParent {
  name: string;
  initials: string;
  unreadNotifications: number;
  /** Only a Parent may customise quick actions; a Relative gets 403. */
  canCustomise: boolean;
}

function initialsOf(name: string, given?: string | null): string {
  const supplied = given?.trim();
  if (supplied) return supplied.toUpperCase();
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

// ─── Attention ──────────────────────────────────────────────────────────────

export interface DashboardAttention {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  /** Button text — "Pay Now", "View", … */
  actionLabel: string;
  /** Catalogue code the tap routes by. */
  actionCode: string;
  studentId: number | null;
}

function toAttention(
  dto: DashboardAttentionDto,
  index: number,
): DashboardAttention {
  return {
    id: `${dto.type ?? "attention"}-${dto.studentId ?? index}`,
    type: dto.type ?? "",
    title: dto.titleEn?.trim() || dto.titleAr?.trim() || "",
    subtitle: dto.subtitleEn?.trim() || dto.subtitleAr?.trim() || "",
    actionLabel:
      dto.action?.labelEn?.trim() || dto.action?.labelAr?.trim() || "Open",
    actionCode: dto.action?.code ?? "",
    studentId: dto.studentId ?? null,
  };
}

/**
 * Attention items rendered as the app's existing dynamic-state cards.
 *
 * The header already uses this card for the quiet state, so reusing it keeps
 * one visual language instead of introducing a second attention treatment.
 */
export function toAttentionStates(
  items: DashboardAttention[],
): DynamicStateData[] {
  return items.map((item) => ({
    id: item.id,
    type: attentionStateType(item.type),
    title: item.title,
    subtitle: item.subtitle,
    studentId: item.studentId !== null ? String(item.studentId) : undefined,
  }));
}

/** Maps a server attention type onto the five card styles the app has. */
function attentionStateType(type: string): DynamicStateType {
  const t = type.toLowerCase();
  if (/install|payment|fee|wallet|invoice/.test(t)) return "payment";
  if (/medical|clinic|health/.test(t)) return "medical";
  if (/report|homework|exam|meal|agenda/.test(t)) return "homework";
  return "emergency";
}

// ─── Children ───────────────────────────────────────────────────────────────

export interface DashboardChild {
  id: string;
  studentId: number;
  studentSeasonId: number;
  name: string;
  grade: string;
  initial: string;
  busAssigned: boolean;
  /** "95%" or "—" when the school has recorded nothing. */
  attendance: string;
  reports: string;
  wallet: string;
  attendanceToday: string;
}

function toChild(dto: DashboardChildDto): DashboardChild {
  const name = dto.name?.trim() ?? "";
  return {
    id: String(dto.studentSeasonId),
    studentId: dto.studentId,
    studentSeasonId: dto.studentSeasonId,
    name,
    grade: dto.grade?.trim() ?? "",
    initial: name.charAt(0).toUpperCase(),
    busAssigned: !!dto.busAssigned,
    // null is "not recorded", which must not become 0%.
    attendance:
      typeof dto.attendancePct === "number" ? `${dto.attendancePct}%` : "—",
    reports:
      typeof dto.reportCount === "number" ? String(dto.reportCount) : "—",
    wallet:
      typeof dto.walletBalance === "number"
        ? formatCurrency(dto.walletBalance)
        : "—",
    attendanceToday:
      dto.attendanceToday && dto.attendanceToday !== "NotRecorded"
        ? // "LeftEarly" → "Left Early"
          String(dto.attendanceToday).replace(/([a-z])([A-Z])/g, "$1 $2")
        : "",
  };
}

// ─── Glance / Today tiles ───────────────────────────────────────────────────

export interface GlanceTile {
  id: string;
  code: string;
  label: string;
  /** Already formatted for display. */
  value: string;
  state: "normal" | "attention" | "empty" | "unavailable";
  route: string;
  studentId: number | null;
  dueDate: string;
}

/**
 * `format` says how to render `value`, and `state` says whether there is a
 * value at all. An `unavailable` tile means the server could not work it out —
 * rendering 0 there would be inventing data.
 */
function formatGlanceValue(dto: GlanceItemDto): string {
  if (dto.state === "unavailable") return "—";
  if (dto.value === null || dto.value === undefined) {
    return dto.state === "empty" ? "0" : "—";
  }
  switch (dto.format) {
    case "currency":
      return formatCurrency(dto.value);
    case "percent":
      return `${Math.round(dto.value)}%`;
    default:
      return String(dto.value);
  }
}

function toGlanceTile(dto: GlanceItemDto, index: number): GlanceTile {
  const state = (dto.state ?? "normal") as GlanceTile["state"];
  return {
    id: `${dto.code ?? "tile"}-${dto.studentId ?? index}`,
    code: dto.code ?? "",
    label: dto.labelEn?.trim() || dto.labelAr?.trim() || "",
    value: formatGlanceValue(dto),
    state,
    route: dto.route ?? "",
    studentId: dto.studentId ?? null,
    dueDate: formatDate(dto.dueDate),
  };
}

function toTiles(section: GlanceSectionDto | null): GlanceTile[] {
  return (section?.items ?? []).map(toGlanceTile);
}

// ─── Quick actions ──────────────────────────────────────────────────────────

export interface QuickAction {
  id: string;
  code: string;
  label: string;
  /** Student actions need a child before they can open. */
  isStudentScoped: boolean;
  colorKey: string;
  /** Set when pinned to one child; that child is used without asking. */
  pinnedStudentId: number | null;
  eligibleStudentIds: number[];
  order: number;
}

function toQuickAction(dto: QuickActionDto, index: number): QuickAction {
  return {
    id: dto.code ?? String(index),
    code: dto.code ?? "",
    label: dto.labelEn?.trim() || dto.labelAr?.trim() || "",
    isStudentScoped: dto.scope === "Student",
    colorKey: dto.colorKey ?? "",
    pinnedStudentId: dto.pinnedStudentId ?? null,
    eligibleStudentIds: dto.eligibleStudentIds ?? [],
    order: dto.order ?? index + 1,
  };
}

export function selectQuickActions(
  section: QuickActionsSectionLike,
): QuickAction[] {
  return (section?.items ?? [])
    .map(toQuickAction)
    .sort((a, b) => a.order - b.order);
}

type QuickActionsSectionLike = { items?: QuickActionDto[] | null } | null;

// ─── Newsletters and upcoming ───────────────────────────────────────────────

export interface DashboardNewsletter {
  id: string;
  newsletterId: number;
  title: string;
  date: string;
  isRead: boolean;
  route: string;
}

function toNewsletter(dto: DashboardNewsletterDto): DashboardNewsletter {
  return {
    id: String(dto.id),
    newsletterId: dto.id,
    title: dto.title?.trim() ?? "",
    date: formatDate(dto.publishedAt),
    isRead: !!dto.isRead,
    route: dto.route ?? "",
  };
}

export interface DashboardUpcoming {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  /** "Oct" / "26" for the date chip. */
  month: string;
  day: string;
  route: string;
  studentId: number | null;
}

function toUpcoming(
  dto: DashboardUpcomingDto,
  index: number,
): DashboardUpcoming {
  const when = dto.date ? new Date(dto.date) : null;
  const valid = when && !Number.isNaN(when.getTime());

  return {
    id: `${dto.type ?? "event"}-${index}`,
    type: dto.type ?? "",
    title: dto.title?.trim() ?? "",
    // Amount is the useful second line on a Payment; the date is already
    // shown in the chip beside it.
    subtitle:
      typeof dto.amount === "number"
        ? formatCurrency(dto.amount)
        : formatDate(dto.date),
    month: valid ? MONTHS[when.getMonth()] : "",
    day: valid ? String(when.getDate()) : "",
    route: dto.route ?? "",
    studentId: dto.studentId ?? null,
  };
}

// ─── Root ───────────────────────────────────────────────────────────────────

export interface ParentDashboard {
  parent: DashboardParent;
  children: DashboardChild[];
  attention: DashboardAttention[];
  quickActions: QuickAction[];
  /** True when the parent has never saved a list. */
  quickActionsAreDefault: boolean;
  glance: GlanceTile[];
  today: GlanceTile[];
  todayDate: string;
  upcoming: DashboardUpcoming[];
  newsletters: DashboardNewsletter[];
  features: {
    meals: boolean;
    finance: boolean;
    wallet: boolean;
    complaints: boolean;
    transport: boolean;
  };
  /** "Children" vs "My Child" — the header above the list. */
  childrenTitle: string;
}

export function selectParentDashboard(
  dto: ParentDashboardDto,
): ParentDashboard {
  const name = dto.parent?.name?.trim() ?? "";
  const children = (dto.children ?? []).map(toChild);

  return {
    parent: {
      name,
      initials: initialsOf(name, dto.parent?.initials),
      unreadNotifications: dto.parent?.unreadNotifications ?? 0,
      canCustomise: (dto.parent?.userType ?? "").toLowerCase() === "parent",
    },
    children,
    attention: (dto.attention ?? []).map(toAttention),
    quickActions: selectQuickActions(dto.quickActions),
    quickActionsAreDefault: !!dto.quickActions?.isDefault,
    glance: toTiles(dto.atAGlance),
    today: toTiles(dto.today),
    todayDate: dto.today?.date
      ? new Date(dto.today.date).toLocaleDateString(undefined, {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      : "",
    upcoming: (dto.upcoming ?? []).map(toUpcoming),
    newsletters: (dto.newsletters ?? []).map(toNewsletter),
    features: {
      // Absent means on: a school that never set a flag shouldn't lose a
      // section it was already using.
      meals: dto.features?.meals !== false,
      finance: dto.features?.finance !== false,
      wallet: dto.features?.wallet !== false,
      complaints: dto.features?.complaints !== false,
      transport: dto.features?.transport !== false,
    },
    childrenTitle: children.length === 1 ? "My Child" : "Children",
  };
}
