/**
 * Parent dashboard — `GET /api/v1/parent/dashboard`.
 *
 * One request builds the whole Home screen: who the parent is, their
 * children, what needs attention, their quick actions, the glance tiles,
 * today, what's coming up, and the latest newsletters.
 *
 * ⚠️ Swagger declares no response schema for any dashboard endpoint, so these
 * come from the integration reference's documented examples. Everything the
 * reference marks nullable is optional here, and labels arrive in both
 * languages (`*En` / `*Ar`) — the app shows English.
 */

// ─── Shared ─────────────────────────────────────────────────────────────────

/**
 * How a tile should read.
 * - `normal` — a real value
 * - `attention` — a real value that needs action
 * - `empty` — loaded, nothing to show
 * - `unavailable` — could not be determined; must not render as zero
 */
export type GlanceState = "normal" | "attention" | "empty" | "unavailable";

/** How to render `value`. */
export type GlanceFormat = "currency" | "count" | "percent" | "status";

/** Attendance for today, when the school has recorded it. */
export type AttendanceToday =
  | "Present"
  | "Absent"
  | "Late"
  | "LeftEarly"
  | "Excused"
  | "Unexcused"
  | "NotRecorded";

// ─── Sections ───────────────────────────────────────────────────────────────

export interface DashboardParentDto {
  id: number;
  name: string | null;
  initials: string | null;
  /** "Parent" or "Relative" — relatives can't customise quick actions. */
  userType: string | null;
  unreadNotifications: number | null;
}

export interface DashboardChildDto {
  /** Used for routing and quick-action pins. */
  studentId: number;
  /** Used for every module endpoint. */
  studentSeasonId: number;
  name: string | null;
  grade: string | null;
  busAssigned: boolean | null;
  attendancePct: number | null;
  reportCount: number | null;
  walletBalance: number | null;
  attendanceToday: AttendanceToday | string | null;
}

export interface DashboardActionDto {
  /** Catalogue code, e.g. "pay-fees". */
  code: string | null;
  labelEn: string | null;
  labelAr: string | null;
  route: string | null;
}

/** Up to three; the header carousel. */
export interface DashboardAttentionDto {
  type: string | null;
  studentId: number | null;
  titleEn: string | null;
  titleAr: string | null;
  subtitleEn: string | null;
  subtitleAr: string | null;
  action: DashboardActionDto | null;
}

/** One child's slice of a glance tile. */
export interface GlancePerStudentDto {
  studentId: number;
  value?: string | number | null;
  count?: number | null;
  ordered?: boolean | null;
}

/** A tile in `atAGlance` or `today` — both use this shape. */
export interface GlanceItemDto {
  code: string | null;
  labelEn: string | null;
  labelAr: string | null;
  state: GlanceState | string | null;
  format: GlanceFormat | string | null;
  value: number | null;
  dueDate: string | null;
  studentId: number | null;
  perStudent?: GlancePerStudentDto[] | null;
  route: string | null;
}

/** ⚠️ An object with `items`, not a bare array. */
export interface GlanceSectionDto {
  isDefault: boolean | null;
  date: string | null;
  items: GlanceItemDto[] | null;
}

export interface DashboardUpcomingDto {
  /** "Exam", "Payment", … Up to three. */
  type: string | null;
  date: string | null;
  title: string | null;
  studentId: number | null;
  amount: number | null;
  route: string | null;
}

export interface DashboardNewsletterDto {
  id: number;
  title: string | null;
  publishedAt: string | null;
  isRead: boolean | null;
  route: string | null;
}

/** Per-school switches; hide a section rather than showing it broken. */
export interface DashboardFeaturesDto {
  meals?: boolean | null;
  finance?: boolean | null;
  wallet?: boolean | null;
  complaints?: boolean | null;
  transport?: boolean | null;
}

// ─── Quick actions ──────────────────────────────────────────────────────────

/** Student actions need a child; parent actions don't. */
export type QuickActionScope = "Student" | "Parent";

export interface QuickActionDto {
  code: string | null;
  labelEn: string | null;
  labelAr: string | null;
  scope: QuickActionScope | string | null;
  icon: string | null;
  /** finance / reports / wellness / agenda / timesheet / meals. */
  colorKey: string | null;
  /** May contain `{studentId}`. */
  routeTemplate: string | null;
  order?: number | null;
  /** Set when the parent pinned this action to one child. */
  pinnedStudentId?: number | null;
  /** Children this action can be used for. */
  eligibleStudentIds?: number[] | null;
  /** Only on the catalogue. */
  isDefault?: boolean | null;
}

/** GET /quick-actions, and the `quickActions` block on the dashboard. */
export interface QuickActionsSectionDto {
  /** True when nothing is saved and these are the defaults. */
  isDefault: boolean | null;
  max: number | null;
  items: QuickActionDto[] | null;
}

/**
 * PUT /api/v1/parent/dashboard/quick-actions
 *
 * Max 6. An empty list clears the saved choices and restores defaults.
 * `pinnedStudentId` is only valid on Student-scope actions.
 */
export interface SaveQuickActionsInput {
  items: {
    code: string;
    /** The server renumbers to 1…n. */
    order: number;
    pinnedStudentId?: number | null;
  }[];
}

// ─── Root ───────────────────────────────────────────────────────────────────

/** GET /api/v1/parent/dashboard?date=YYYY-MM-DD */
export interface ParentDashboardDto {
  parent: DashboardParentDto | null;
  children: DashboardChildDto[] | null;
  attention: DashboardAttentionDto[] | null;
  quickActions: QuickActionsSectionDto | null;
  atAGlance: GlanceSectionDto | null;
  today: GlanceSectionDto | null;
  upcoming: DashboardUpcomingDto[] | null;
  newsletters: DashboardNewsletterDto[] | null;
  features: DashboardFeaturesDto | null;
}
