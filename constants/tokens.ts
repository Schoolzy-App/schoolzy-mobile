/**
 * Design tokens from the approved design handoff (Design-Handoff/Design-Tokens).
 *
 * The brand colour and the core palette still come from the theme
 * (`useTheme().colors`), so each school keeps its own primary. Everything here
 * is shared across schools: neutrals, status and module colours, the type
 * scale, spacing, radii, sizes and elevation. Units are dp (= design px).
 */

import { Platform, TextStyle, ViewStyle } from "react-native";

// ─── Colours ──────────────────────────────────────────────────────────────────

export const Palette = {
  text: {
    primary: "#1C1C1E",
    /** Long-form body (newsletter / report detail) */
    body: "#3A3A3C",
    /** Card subtitles on Finance, meta kind labels */
    secondary: "#6C6C70",
    /** Captions, dates, group labels, placeholders */
    tertiary: "#8A8A8E",
    chevron: "#C7C7CC",
    onBrand: "#FFFFFF",
  },
  surface: {
    page: "#F3F3F3",
    card: "#FFFFFF",
    /** Today stat tiles (Student Dashboard) */
    subtle: "#F6F6F7",
    skeleton: "#EDEDF0",
    segmentTrack: "#E9E9EC",
    sheetHandle: "#EBEBED",
    /** Notification button on the brand header */
    iconButton: "#F2F2F4",
    pressedRow: "#FAFAFA",
    toast: "#1C1C1E",
    bottomNav: "#1C1C1E",
    scrim: "rgba(0,0,0,0.35)",
  },
  border: {
    /** Chips (off), bordered rows, search field, secondary button */
    default: "#E6E6E8",
    /** 1px row separators inside cards, progress track */
    divider: "#F0F0F2",
    /** Empty-state dashed outline, inactive pager dot */
    dashed: "#D6D6DA",
    onBrand: "rgba(255,255,255,0.5)",
  },
  nav: {
    active: "#4E7FD0",
    badge: "#C8102E",
  },
  /**
   * Primary-action blue on Complaints, Update Information and Relative
   * Setting. The other screens use the brand colour — don't unify the two.
   */
  action: {
    primary: "#4E73DF",
    pressed: "#3A5BC7",
    tint7: "#4E73DF12",
    tint8: "#4E73DF14",
    progressTrack: "#DDE0E8",
    uploadTrack: "#E3E5EA",
    infoNote: "#E9ECF5",
  },
  module: {
    finance: { solid: "#5B63E6", tint: "#5B63E61A" },
    reports: { solid: "#7A1238", tint: "#7A12381A" },
    wellness: { solid: "#33C11A", tint: "#33C11A1A" },
    agenda: { solid: "#4E7FD0", tint: "#4E7FD01A" },
    timesheet: { solid: "#4E7FD0", tint: "#4E7FD01A" },
    meals: { solid: "#9437F0", tint: "#9437F01A" },
  },
  avatar: {
    children: ["#4E7FD0", "#B0627E", "#5BA3A0"],
    allClear: "#6E97D6",
  },
  status: {
    success: { fg: "#24860F", solid: "#33C11A", tint: "#33C11A1A" },
    successStrong: { solid: "#2E8B3A", tint: "#2E8B3A1A" },
    danger: { fg: "#C53030", solid: "#E53E3E", tint: "#E53E3E1A" },
    warning: { fg: "#9A5A00", tint: "#FFAF4426" },
    info: { fg: "#2F5FAE", tint: "#4E7FD01A" },
    neutral: { fg: "#6C6C70", tint: "#F0F0F2" },
    pdf: { fg: "#C62828", tint: "#E0313114" },
  },
  form: {
    inputBorder: "#E6E6E8",
    inputError: "#E53E3E",
    optionErrorBorder: "#E53E3E80",
    dashedUpload: "#C9CDD8",
    secondaryButtonBorder: "#D6D6DA",
    footerBorder: "#EDEDF0",
    errorBannerBg: "#E53E3E12",
    errorBannerBorder: "#E53E3E40",
    switchOn: "#1CC88A",
    switchOff: "#D1D1D6",
    permissionRowBg: "#F6F6F8",
    skeleton: "#EAEAEE",
    skeletonLabel: "#E3E3E8",
    neutralChip: "#F3F3F5",
    notesBox: "#F3F4F8",
    emptyIconBg: "#E9E9EC",
  },
  /** Chip background is the colour at 15% (`+ "26"`). */
  complaintStatus: {
    Submitted: "#F6C23E",
    UnderReview: "#4E73DF",
    InProgress: "#36B9CC",
    Resolved: "#1CC88A",
    Closed: "#8A8A8E",
    Rejected: "#E53E3E",
  },
  /** Selected option background is the colour at 8% (`+ "14"`). */
  complaintPriority: {
    Low: "#48BB78",
    Medium: "#ED8936",
    High: "#E53E3E",
    Urgent: "#7B2FF7",
  },
  feedback: {
    success: "#1CC88A",
    successTint: "#1CC88A1F",
    successBox: "#1CC88A14",
    waiting: "#B7861A",
    waitingTint: "#F6C23E26",
  },
  reportStatus: {
    New: { bg: "#4E7FD01A", fg: "#2F5FAE" },
    ActionNeeded: { bg: "#FFAF4426", fg: "#9A5A00" },
    Submitted: { bg: "#33C11A1A", fg: "#24860F" },
    Acknowledged: { bg: "#F0F0F2", fg: "#6C6C70" },
  },
  newsletterKind: {
    announcement: "#4E7FD0",
    letter: "#800E37",
  },
} as const;

/**
 * Brand tints. The design writes them as 8-digit hex on the brand colour;
 * this builds the same value from whichever primary the school uses.
 */
export const tint = (hex: string, alpha: "0D" | "14" | "1A" | "26") =>
  `${hex}${alpha}`;

// ─── Typography ───────────────────────────────────────────────────────────────
// System font (SF Pro / Roboto). Headings never exceed 700; hierarchy is size
// + colour. Single-line titles, values, pills and amounts never wrap — use
// numberOfLines={1}.

// Every entry sets a line height: the shared <Text> has a 24 base, which
// would otherwise pad small text. "normal" in the design ≈ 1.2.
const t = (
  fontSize: number,
  fontWeight: TextStyle["fontWeight"],
  lineHeight = 1.2,
): TextStyle => ({
  fontSize,
  fontWeight,
  lineHeight: Math.round(fontSize * lineHeight),
});

export const Type = {
  display: t(40, "700", 1),
  walletAmount: t(40, "600", 1),
  amountLarge: t(28, "700"),
  successTitle: t(22, "600"),
  detailTitle: t(21, "600", 1.3),
  detailTitleComplaint: t(20, "600", 1.3),
  summaryValue: t(20, "700"),
  financeSection: t(18, "600"),
  emptyTitle: t(18, "600"),
  reportDay: t(18, "700", 1.1),
  headerTitle: t(17, "600"),
  /** "Finances for **Aisel**" — prefix 400; render the name with Type.bold. */
  headerTitleModule: t(17, "400"),
  sheetTitle: t(17, "600", 1.25),
  sectionTitle: t(16, "500"),
  cardTitle: t(16, "600"),
  complaintCardTitle: t(16, "600", 1.35),
  /** All inputs — 16 also prevents zoom on iOS */
  inputText: t(16, "400"),
  formButton: t(16, "600"),
  cardHeading: t(15, "600"),
  listTitleUnread: t(15, "700"),
  listTitleRead: t(15, "500"),
  amount: t(15, "700"),
  body: t(15, "400", 1.55),
  button: t(15, "600"),
  sectionLabelDetail: t(15, "600"),
  itemTitle: t(14, "600"),
  moduleLabel: t(14, "500"),
  rowLabel: t(14, "400"),
  link: t(14, "600"),
  chip: t(14, "600"),
  fieldLabel: t(14, "600"),
  chipSmall: t(13, "600"),
  buttonSmall: t(13, "600"),
  meta: t(13, "400"),
  groupLabel: {
    ...t(13, "600"),
    letterSpacing: 13 * 0.04,
    textTransform: "uppercase",
  } as TextStyle,
  fieldError: t(13, "400"),
  reference: t(13, "500"),
  logoBadge: t(13, "800"),
  buttonXSmall: t(12, "600"),
  caption: t(12, "400"),
  quickLabel: t(12, "500"),
  fieldHint: t(12, "400"),
  statusChipText: t(12, "600"),
  pill: t(11, "600"),
  statLabel: t(11, "400"),
  badge: t(10, "700"),
  monthAbbr: t(10, "600"),
  tiny: t(10, "500"),
  bold: { fontWeight: "700" } as TextStyle,
};

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const Spacing = {
  screenX: 15,
  sectionTitleToContent: 10,
  sectionGap: { home: 26, studentDashboard: 15, modules: 15 },
  contentTop: { home: 16, studentDashboard: 15, modules: 15 },
  cardPadding: {
    default: { paddingVertical: 14, paddingHorizontal: 15 },
    attentionHome: 15,
    finance: 16,
    wallet: { paddingTop: 18, paddingHorizontal: 18, paddingBottom: 16 },
    detail: 18,
  },
  rowPaddingY: { today: 9, upcoming: 10, finance: 12 },
  gridGap: {
    quickActions: 10,
    atAGlance: 10,
    modulesRow: 11,
    modulesColumn: 18,
    todayTiles: 8,
    walletButtons: 10,
  },
  listGap: { newsletterCards: 10, latest: 11, childCards: 10, chips: 8 },
  iconTextGap: { row: 12, attention: 11, card: 13, inline: 6 },
  bottomInset: {
    homeScroll: 130,
    modulesScroll: 120,
    sheet: 40,
    navFromBottom: 28,
    toastFromBottom: 96,
  },
  /** Fixed-header form screens: Complaints, Update Information, Relatives */
  form: {
    headerRowPaddingTop: 6,
    headerRowPaddingX: 16,
    headerPaddingBottom: 14,
    bodyPadding: 16,
    bodyGap: { list: 14, form: 20, profile: 16, relativeForm: 18, detail: 12 },
    fieldGap: 8,
    footerPaddingTop: 12,
    footerPaddingX: 16,
    footerPaddingBottom: Platform.OS === "ios" ? 30 : 14,
    footerGap: 10,
  },
};

// ─── Radius ───────────────────────────────────────────────────────────────────

export const Radius = {
  /** Bottom corners of the brand header on scrolling screens */
  header: 40,
  /** Bottom corners of the fixed header on form screens */
  formHeader: 32,
  bottomNav: 30,
  /** Top corners of a bottom sheet */
  sheet: 24,
  navItem: 24,
  formButton: 25,
  walletButton: 21,
  financeCard: 20,
  moduleTile: 20,
  actionButton: 20,
  relationshipChip: 20,
  chip: 18,
  detailCard: 18,
  chipSmall: 17,
  card: 16,
  search: 14,
  toast: 14,
  payButton: 14,
  input: 14,
  option: 14,
  switch: 14,
  iconTile: 12,
  statTile: 12,
  statusChip: 12,
  pill: 10,
  progress: 4,
  full: 9999,
};

// ─── Sizes ────────────────────────────────────────────────────────────────────

export const Size = {
  headerHeight: { studentDashboard: 117, modules: 122 },
  headerButton: 40,
  avatar: { parent: 41, child: 44, student: 48, picker: 40 },
  iconCircle: { sm: 34, md: 36, lg: 37, finance: 40, newsletter: 46 },
  iconTile: 40,
  quickActionTile: 74,
  moduleTile: 81,
  /** Width of a child card when there are 2+ children, so the next one peeks */
  childCardWidth: "68%",
  actionButton: { height: 32, paddingX: 14 },
  walletButton: 42,
  payButton: { height: 28, paddingX: 14 },
  chip: { height: 36, paddingX: 14 },
  chipSmall: { height: 34, paddingX: 14 },
  search: 46,
  navItem: { height: 41, paddingX: 18 },
  progressBar: 8,
  unreadDot: 8,
  pagerDot: { size: 6, activeWidth: 16 },
  sheetHandle: { width: 92, height: 7 },
  tapTargetMin: 44,
  input: 50,
  inputBorderWidth: 1.5,
  textareaMin: 150,
  optionTile: 52,
  methodOption: 48,
  childOption: 64,
  relationshipChip: 40,
  permissionPill: 32,
  switch: { width: 46, height: 28, knob: 22 },
  formPrimaryButton: 50,
  outlineButton: 44,
  summaryTile: 64,
  statusChip: 24,
  statusChipLarge: 26,
  priorityChip: 22,
  reportDateBlock: { width: 48, height: 52 },
  segmented: { height: 32, trackPadding: 3 },
  emptyIconCircle: 64,
  successCircle: 88,
  photoCircle: 64,
} as const;

export const IconSize = {
  nav: 22,
  navActive: 19,
  module: 30,
  quickAction: 24,
  header: 18,
  bell: 20,
  inCircle34: 17,
  inCircle46: 21,
  inTile40: 20,
  row: 16,
  inline: 13,
  chevron: 12,
};

// ─── Elevation & opacity ──────────────────────────────────────────────────────
// Newsletter and Finance cards have no shadow — only dashboard cards marked
// "elevated" use Shadow.card.

export const Shadow: Record<"card" | "bottomNav" | "toast", ViewStyle> = {
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  bottomNav: {
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  toast: {
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
};

export const Opacity = {
  pressed: 0.7,
  pressedCard: 0.8,
  disabled: 0.45,
  chipCount: 0.75,
};
