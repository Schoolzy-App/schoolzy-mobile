import { MaterialIcons } from "@expo/vector-icons";
import React, { memo } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import type { ColorPalette } from "@/apps";
import { IconContainer, Modal, Text } from "@/components/ui";
import { Icons } from "@/constants";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";
import type {
  DashboardChild,
  DashboardUpcoming,
  GlanceTile,
  QuickAction,
} from "@/services/mappers";

/**
 * The Home dashboard's list sections.
 *
 * Grouped in one file because they are all thin presentational lists over the
 * same payload; splitting them would be five files of boilerplate.
 */

// ─── Quick actions ───────────────────────────────────────────────────────────

/** Catalogue `colorKey` → accent. Unknown keys fall back to the brand blue. */
const GROUP_COLOR: Record<string, string> = {
  finance: "#4F7DCA",
  reports: "#821037",
  wellness: "#36BD0D",
  agenda: "#4F7DCA",
  timesheet: "#81828B",
  meals: "#E8A923",
};

const ACTION_ICON: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  "add-request": "add-circle-outline",
  "add-complaint": "chat-bubble-outline",
  requests: "send",
  newsletter: "newspaper",
  "update-data": "account-circle",
  "change-password": "lock-outline",
  "pay-fees": "payments",
  finance: "account-balance",
  wallet: "account-balance-wallet",
  "top-up": "arrow-circle-up",
  reports: "assignment",
  wellness: "favorite-border",
  agenda: "menu-book",
  attendance: "check-circle-outline",
  meals: "restaurant",
  timesheet: "schedule",
  homework: "edit-note",
  bus: "directions-bus",
};

export interface QuickActionsRowProps {
  actions: QuickAction[];
  /**
   * False while the stored preference is still being read, so the row shows
   * neither the defaults nor the empty line before we know which is right.
   */
  ready?: boolean;
  /** Name of a pinned child, keyed by studentId, for the row's sub-label. */
  pinnedNames?: Record<number, string>;
  onSelect?: (action: QuickAction) => void;
  onCustomise?: () => void;
}

export const QuickActionsRow = memo<QuickActionsRowProps>(
  ({ actions, ready = true, pinnedNames, onSelect, onCustomise }) => {
    const { colors } = useTheme();
    const styles = useStyles(createStyles);

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="label2" weight="semiBold">
            Quick Actions
          </Text>
          {onCustomise ? (
            <Pressable onPress={onCustomise} hitSlop={8}>
              <Text variant="label3" weight="semiBold" color={colors.primary}>
                Edit
              </Text>
            </Pressable>
          ) : null}
        </View>

        {!ready ? null : actions.length === 0 ? (
          // The section stays, so Edit is still reachable — it just says
          // there is nothing here rather than disappearing.
          <Text
            variant="label3"
            weight="regular"
            color={colors.textSecondary}
            style={styles.emptyActions}
          >
            No quick actions added.
          </Text>
        ) : (
          // A fixed 3x2 grid rather than a scroller: the maximum is six, so
          // they all fit and nothing hides off the edge.
          <View style={styles.actionGrid}>
            {actions.map((action) => {
              const accent = GROUP_COLOR[action.colorKey] ?? colors.secondary;
              const pinned =
                action.pinnedStudentId !== null
                  ? pinnedNames?.[action.pinnedStudentId]
                  : undefined;

              return (
                <Pressable
                  key={action.id}
                  style={[styles.actionTile, { width: quickTileWidth() }]}
                  onPress={() => onSelect?.(action)}
                >
                  <View
                    style={[styles.actionIcon, { backgroundColor: accent + "18" }]}
                  >
                    <MaterialIcons
                      name={ACTION_ICON[action.code] ?? "bolt"}
                      size={20}
                      color={accent}
                    />
                  </View>
                  <Text variant="caption1" weight="medium" numberOfLines={1}>
                    {action.label}
                  </Text>
                  {/* Pinned actions skip the child prompt, so the name is
                      shown to make that obvious before tapping. */}
                  {pinned ? (
                    <Text
                      variant="caption2"
                      weight="regular"
                      color={colors.textSecondary}
                      numberOfLines={1}
                    >
                      {pinned}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    );
  },
);
QuickActionsRow.displayName = "QuickActionsRow";

/** Three to a row, inside the screen's 16pt gutters. */
const QUICK_COLUMNS = 3;
const QUICK_GAP = 10;

function quickTileWidth(): number {
  const available = Dimensions.get("window").width - 32;
  return (available - QUICK_GAP * (QUICK_COLUMNS - 1)) / QUICK_COLUMNS;
}

// ─── Children ────────────────────────────────────────────────────────────────

export interface ChildSummaryListProps {
  title: string;
  /** Named `students`, not `children` — that prop name is React's. */
  students: DashboardChild[];
  /**
   * Gender per studentSeasonId, which picks both the avatar and its circle
   * colour. The dashboard payload carries neither, so the caller resolves it
   * from the students list; anything missing falls back to the same default
   * the students mapper uses.
   */
  genders?: Record<number, "male" | "female">;
  showFinance?: boolean;
  onSelect?: (child: DashboardChild) => void;
}

export const ChildSummaryList = memo<ChildSummaryListProps>(
  ({ title, students, genders, showFinance, onSelect }) => {
    const { colors } = useTheme();
    const styles = useStyles(createStyles);

    return (
      <View style={styles.section}>
        <Text variant="label2" weight="semiBold" style={styles.sectionInset}>
          {title}
        </Text>

        {/* Horizontal, like the rest of the app's child rows: a family of
            four would otherwise push everything below it off the screen.
            Cards are sized so the next one peeks in and the row reads as
            scrollable without a visible indicator. */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.childRow}
        >
        {students.map((child) => {
          const gender = genders?.[child.studentSeasonId] ?? "female";
          const Avatar =
            gender === "male" ? Icons.BoyAvatar : Icons.GirlAvatar;
          // Greyed when the child has no bus, matching the old child row.
          const Bus = child.busAssigned
            ? Icons.BusActiveIcon
            : Icons.BusInactiveIcon;

          return (
          <Pressable
            key={child.id}
            style={[styles.childCard, { width: childCardWidth(students.length) }]}
            onPress={() => onSelect?.(child)}
          >
            <View style={styles.childHeader}>
              {/* Circled, as elsewhere in the app: orange behind a boy,
                  blue behind a girl. */}
              <IconContainer
                size={48}
                color={gender === "male" ? colors.tertiary : colors.secondary}
              >
                <Avatar width={42} height={42} />
              </IconContainer>

              <View style={styles.childText}>
                <Text variant="label1" weight="semiBold" numberOfLines={1}>
                  {child.name}
                </Text>
                <Text
                  variant="label3"
                  weight="regular"
                  color={colors.textSecondary}
                  numberOfLines={1}
                >
                  {[child.grade, child.attendanceToday]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              </View>

              {/* Bus replaces the chevron: the whole card is tappable, so
                  the arrow only repeated what the card already implied,
                  while the bus is information. */}
              <Bus width={22} height={22} />
            </View>

            <View style={[styles.childDivider, { backgroundColor: colors.border }]} />

            <View style={styles.childStats}>
              <Stat value={child.attendance} label="Attendance" />
              <Stat value={child.reports} label="Reports" />
              {showFinance ? (
                <Stat value={child.wallet} label="Wallet" />
              ) : null}
            </View>
          </Pressable>
          );
        })}
        </ScrollView>
      </View>
    );
  },
);
ChildSummaryList.displayName = "ChildSummaryList";

/**
 * One child fills the row; two or more leave half of the next card showing,
 * which is what makes the row legible as scrollable.
 */
function childCardWidth(count: number): number {
  const available = Dimensions.get("window").width - 32;
  if (count <= 1) return available;
  return (available - 10) / 1.6;
}

function Stat({ value, label }: { value: string; label: string }) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  return (
    <View style={styles.stat}>
      {/* The number is the point of the row, so it reads at body size in the
          primary text colour rather than as caption-grey. */}
      <Text variant="label2" weight="bold" color={colors.textPrimary}>
        {value}
      </Text>
      <Text variant="caption1" weight="medium" color={colors.textSecondary}>
        {label}
      </Text>
    </View>
  );
}

// ─── At a Glance ─────────────────────────────────────────────────────────────

/**
 * The app's own module icons, so a row about meals carries the same mark and
 * colour as Meals does everywhere else. These SVGs have their colour baked
 * in, which is the point — a generic glyph in a tinted circle made every row
 * look alike.
 *
 * Matched on substring because the server's codes aren't a published list:
 * "meal" and "meals", "payment" and "next-payment" should all land the same.
 */
function renderModuleIcon(
  code: string,
  label: string,
  size: number,
  accent: string,
): React.ReactElement {
  const key = `${code} ${label}`.toLowerCase();
  const p = { width: size, height: size };

  // Returns the element, not the component: assigning a component to a local
  // and rendering it would create a new type on every render.
  if (/meal|cafeteria|lunch/.test(key)) return <Icons.MealsIcon {...p} />;
  // The newspaper mark the artifact uses. `Announcement` is the same shape
  // but filled white for a coloured circle, so it vanishes on a white row —
  // this one takes a tint.
  if (/newsletter|announce/.test(key)) {
    return <Icons.NewsletterIcon {...p} color={accent} />;
  }
  if (/wallet/.test(key)) return <Icons.WalletIcon {...p} />;
  if (/pay|installment|fee|outstanding|invoice|finance/.test(key)) {
    return <Icons.FinanceIcon {...p} />;
  }
  if (/wellness|health|clinic|medical/.test(key)) {
    return <Icons.WellnessIcon {...p} />;
  }
  if (/attendance|present|absent/.test(key)) {
    return <Icons.GoodRoundIcon {...p} />;
  }
  if (/report|request|complaint/.test(key)) return <Icons.ReportIcon {...p} />;
  if (/homework|agenda|exam|class|timetable|timesheet/.test(key)) {
    return <Icons.AgendaIcon {...p} />;
  }
  return <Icons.AgendaRoundIcon {...p} />;
}

export interface GlanceGridProps {
  tiles: GlanceTile[];
  onSelect?: (tile: GlanceTile) => void;
}

export const GlanceGrid = memo<GlanceGridProps>(({ tiles, onSelect }) => {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  return (
    <View style={styles.section}>
      <Text variant="label2" weight="semiBold">
        At a Glance
      </Text>

      <View style={styles.grid}>
        {tiles.map((tile) => {
          // "unavailable" means the server couldn't work it out — greyed, not
          // shown as a number.
          const unavailable = tile.state === "unavailable";

          return (
            <Pressable
              key={tile.id}
              style={[styles.glanceTile, unavailable && styles.dim]}
              onPress={() => onSelect?.(tile)}
            >
              <View style={styles.glanceIcon}>
                {renderModuleIcon(tile.code, tile.label, 24, colors.secondary)}
              </View>
              <View style={styles.glanceText}>
                <Text variant="label3" weight="bold" numberOfLines={1}>
                  {tile.value}
                </Text>
                <Text
                  variant="caption2"
                  weight="regular"
                  color={colors.textSecondary}
                  numberOfLines={1}
                >
                  {tile.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});
GlanceGrid.displayName = "GlanceGrid";

// ─── Today ───────────────────────────────────────────────────────────────────

export interface TodayListProps {
  tiles: GlanceTile[];
  date: string;
  onSelect?: (tile: GlanceTile) => void;
}

export const TodayList = memo<TodayListProps>(({ tiles, date, onSelect }) => {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  if (!tiles.length) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text variant="label2" weight="semiBold">
          Today
        </Text>
        {date ? (
          <Text variant="label3" weight="medium" color={colors.textSecondary}>
            {date}
          </Text>
        ) : null}
      </View>

      <View style={styles.plainCard}>
        {tiles.map((tile, index) => (
          <Pressable
            key={tile.id}
            style={[
              styles.todayRow,
              index > 0 && styles.divided,
              index > 0 && { borderTopColor: colors.border },
            ]}
            onPress={() => onSelect?.(tile)}
          >
            {renderModuleIcon(tile.code, tile.label, 22, colors.secondary)}
            <Text variant="label3" weight="regular" style={styles.todayLabel}>
              {tile.label}
            </Text>
            <Text variant="label3" weight="semiBold">
              {tile.value}
            </Text>
            {/* Lighter than the text: the row is the affordance, the arrow is
                only a hint. */}
            <MaterialIcons
              name="chevron-right"
              size={18}
              color={colors.border}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
});
TodayList.displayName = "TodayList";

// ─── Upcoming ────────────────────────────────────────────────────────────────

export interface UpcomingListProps {
  items: DashboardUpcoming[];
  onSelect?: (item: DashboardUpcoming) => void;
}

export const UpcomingList = memo<UpcomingListProps>(({ items, onSelect }) => {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  return (
    <View style={styles.section}>
      <Text variant="label2" weight="semiBold">
        Upcoming
      </Text>

      <View style={styles.plainCard}>
        {items.length === 0 ? (
          <View style={styles.emptyRow}>
            <MaterialIcons
              name="event-busy"
              size={18}
              color={colors.textSecondary}
            />
            <Text variant="label3" weight="regular" color={colors.textSecondary}>
              No upcoming events
            </Text>
          </View>
        ) : (
          items.map((item, index) => (
            <Pressable
              key={item.id}
              style={[
                styles.upcomingRow,
                index > 0 && styles.divided,
                index > 0 && { borderTopColor: colors.border },
              ]}
              onPress={() => onSelect?.(item)}
            >
              {/* No chip — the artifact uses a bare centred column with the
                  month tinted by event type and the day carrying the size. */}
              <View style={styles.dateColumn}>
                <Text
                  variant="caption2"
                  weight="semiBold"
                  color={upcomingTint(item.type, colors)}
                >
                  {item.month.toUpperCase()}
                </Text>
                <Text variant="label1" weight="semiBold">
                  {item.day}
                </Text>
              </View>

              <View style={styles.upcomingText}>
                <Text variant="label3" weight="semiBold" numberOfLines={1}>
                  {item.title}
                </Text>
                {item.subtitle ? (
                  <Text
                    variant="caption1"
                    weight="regular"
                    color={colors.textSecondary}
                    numberOfLines={1}
                  >
                    {item.subtitle}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ))
        )}
      </View>
    </View>
  );
});
UpcomingList.displayName = "UpcomingList";

/** Month tint by event type — money reads differently from an exam. */
function upcomingTint(type: string, colors: ColorPalette): string {
  const t = type.toLowerCase();
  if (/pay|installment|fee|invoice/.test(t)) return colors.primary;
  if (/exam|test|quiz/.test(t)) return colors.secondary;
  return colors.textSecondary;
}

// ─── Child picker ────────────────────────────────────────────────────────────

export interface ChildPickerProps {
  visible: boolean;
  /** What the parent is about to do, e.g. "Pay Fees". */
  actionLabel?: string;
  students: DashboardChild[];
  onSelect: (child: DashboardChild) => void;
  onClose: () => void;
}

/**
 * Student-scoped quick actions ask which child at tap time unless the action
 * is pinned — which is what makes one shortcut usable for a whole family.
 */
export const ChildPicker = memo<ChildPickerProps>(
  ({ visible, actionLabel, students, onSelect, onClose }) => {
    const { colors } = useTheme();
    const styles = useStyles(createStyles);

    return (
      <Modal isVisible={visible} closeModal={onClose}>
        <View style={styles.sheet}>
          <Text variant="label1" weight="semiBold">
            {actionLabel ? `${actionLabel} for…` : "Choose a child"}
          </Text>

          {students.map((child) => (
            <Pressable
              key={child.id}
              style={[styles.pickRow, { borderColor: colors.border }]}
              onPress={() => onSelect(child)}
            >
              <View style={[styles.initial, { backgroundColor: colors.secondary }]}>
                <Text variant="label3" weight="bold" color={colors.buttonText}>
                  {child.initial}
                </Text>
              </View>
              <View style={styles.childText}>
                <Text variant="label3" weight="semiBold" numberOfLines={1}>
                  {child.name}
                </Text>
                {child.grade ? (
                  <Text
                    variant="caption1"
                    weight="regular"
                    color={colors.textSecondary}
                  >
                    {child.grade}
                  </Text>
                ) : null}
              </View>
              <MaterialIcons
                name="chevron-right"
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>
          ))}
        </View>
      </Modal>
    );
  },
);
ChildPicker.displayName = "ChildPicker";

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    section: {
      width: "100%",
      gap: 10,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    // Quick actions
    actionGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: QUICK_GAP,
    },
    actionTile: {
      minHeight: 92,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 8,
    },
    actionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyActions: {
      paddingVertical: 6,
    },

    // Children
    sectionInset: {
      paddingHorizontal: 0,
    },
    childRow: {
      gap: 10,
      paddingRight: 4,
    },
    childCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 14,
      gap: 12,
    },
    childHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    initial: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    childText: {
      flex: 1,
      gap: 2,
    },
    childDivider: {
      height: 1,
      width: "100%",
    },
    childStats: {
      flexDirection: "row",
      gap: 18,
    },
    stat: {
      gap: 1,
    },

    // At a Glance
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    glanceTile: {
      width: "48%",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 12,
    },
    dim: {
      opacity: 0.6,
    },
    glanceIcon: {
      width: 34,
      height: 34,
      alignItems: "center",
      justifyContent: "center",
    },
    glanceText: {
      flex: 1,
      gap: 1,
    },

    // Shared card for Today / Upcoming
    plainCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingHorizontal: 14,
    },
    divided: {
      borderTopWidth: 1,
    },
    todayRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 13,
    },
    todayLabel: {
      flex: 1,
    },
    upcomingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
    },
    dateColumn: {
      width: 44,
      alignItems: "center",
    },
    upcomingText: {
      flex: 1,
      gap: 2,
    },
    emptyRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 16,
    },

    // Child picker
    sheet: {
      width: "100%",
      gap: 10,
      paddingBottom: 8,
    },
    pickRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
    },
  });
