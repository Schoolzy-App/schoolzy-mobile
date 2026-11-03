import {
  BusIcon,
  CalendarBlankIcon,
  CaretRightIcon,
  NewspaperIcon,
  PlusIcon,
} from "phosphor-react-native";
import React, { memo } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import type { ColorPalette } from "@/apps";
import { Modal, Text } from "@/components/ui";
import {
  IconSize,
  Opacity,
  Palette,
  Radius,
  Shadow,
  Size,
  Spacing,
  Type,
} from "@/constants/tokens";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";
import type {
  DashboardChild,
  DashboardNewsletter,
  DashboardUpcoming,
  GlanceTile,
  QuickAction,
} from "@/services/mappers";

import { moduleStyle } from "./moduleStyle";

/**
 * The Home dashboard's list sections, laid out per the Parent Dashboard spec
 * (Design-Handoff/Documentation/Parent-Dashboard.md).
 *
 * Grouped in one file because they are all thin presentational lists over the
 * same payload; splitting them would be six files of boilerplate.
 */

/** Width inside the screen's horizontal padding. */
const contentWidth = () => Dimensions.get("window").width - Spacing.screenX * 2;

function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  return (
    <View style={styles.sectionHeader}>
      <Text style={Type.sectionTitle}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={Type.link} color={colors.primary}>
            {action}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ─── Quick actions ───────────────────────────────────────────────────────────

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

const QUICK_COLUMNS = 3;

export const QuickActionsRow = memo<QuickActionsRowProps>(
  ({ actions, ready = true, pinnedNames, onSelect, onCustomise }) => {
    const { colors } = useTheme();
    const styles = useStyles(createStyles);
    const gap = Spacing.gridGap.quickActions;
    // Floored: a fractional width can round up past the row and wrap the
    // third tile onto its own line.
    const tileWidth = Math.floor(
      (contentWidth() - gap * (QUICK_COLUMNS - 1)) / QUICK_COLUMNS,
    );

    return (
      <View style={styles.section}>
        <SectionTitle title="Quick Actions" action="Edit" onAction={onCustomise} />

        {!ready ? null : actions.length === 0 ? (
          // The section stays, so Edit is still reachable — it just offers
          // to add shortcuts rather than disappearing.
          <Pressable
            onPress={onCustomise}
            style={({ pressed }) => [styles.emptyActions, pressed && styles.pressed]}
          >
            <PlusIcon weight="bold" size={IconSize.inline} color={Palette.text.tertiary} />
            <Text style={[Type.meta, styles.medium]} color={Palette.text.tertiary}>
              Add shortcuts
            </Text>
          </Pressable>
        ) : (
          // A fixed 3-column grid rather than a scroller: the maximum is six,
          // so they all fit and nothing hides off the edge.
          <View style={[styles.wrapGrid, { gap }]}>
            {actions.map((action) => {
              const { Icon, color } = moduleStyle(action.code, action.label);
              const pinned =
                action.pinnedStudentId !== null
                  ? pinnedNames?.[action.pinnedStudentId]
                  : undefined;

              return (
                <Pressable
                  key={action.id}
                  style={({ pressed }) => [
                    styles.actionTile,
                    { width: tileWidth },
                    pressed && styles.pressed,
                  ]}
                  onPress={() => onSelect?.(action)}
                >
                  <Icon
                    weight="fill"
                    size={IconSize.quickAction}
                    color={color ?? colors.primary}
                  />
                  <View style={styles.actionText}>
                    <Text style={Type.quickLabel} numberOfLines={1}>
                      {action.label}
                    </Text>
                    {/* Pinned actions skip the child prompt, so the name is
                        shown to make that obvious before tapping. */}
                    {pinned ? (
                      <Text
                        style={[Type.tiny, styles.regular]}
                        color={Palette.text.tertiary}
                        numberOfLines={1}
                      >
                        {pinned}
                      </Text>
                    ) : null}
                  </View>
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

// ─── Children ────────────────────────────────────────────────────────────────

export interface ChildSummaryListProps {
  /** Named `students`, not `children` — that prop name is React's. */
  students: DashboardChild[];
  showFinance?: boolean;
  onSelect?: (child: DashboardChild) => void;
}

export const ChildSummaryList = memo<ChildSummaryListProps>(
  ({ students, showFinance, onSelect }) => {
    const styles = useStyles(createStyles);
    // One child fills the row; with two or more each card is 68% wide so the
    // next one peeks in and the row reads as scrollable.
    const cardWidth =
      students.length > 1 ? contentWidth() * 0.68 : contentWidth();

    return (
      <View style={styles.section}>
        <SectionTitle title={students.length === 1 ? "My Child" : "My Children"} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={students.length > 1 ? cardWidth + Spacing.listGap.childCards : undefined}
          decelerationRate="fast"
          style={styles.bleed}
          contentContainerStyle={styles.childRow}
        >
          {students.map((child, index) => (
            <Pressable
              key={child.id}
              style={({ pressed }) => [
                styles.childCard,
                { width: cardWidth },
                pressed && styles.pressedCard,
              ]}
              onPress={() => onSelect?.(child)}
            >
              <View style={styles.childHeader}>
                <View
                  style={[
                    styles.childAvatar,
                    {
                      backgroundColor:
                        Palette.avatar.children[index % Palette.avatar.children.length],
                    },
                  ]}
                >
                  <Text style={styles.childInitial} color={Palette.text.onBrand}>
                    {child.initial}
                  </Text>
                </View>

                <View style={styles.flex}>
                  <Text style={Type.cardTitle} numberOfLines={1}>
                    {child.name}
                  </Text>
                  {child.grade ? (
                    <Text style={Type.meta} color={Palette.text.tertiary} numberOfLines={1}>
                      {child.grade}
                    </Text>
                  ) : null}
                </View>

                {/* Lit when the child has a bus, greyed when not. */}
                <BusIcon
                  weight="bold"
                  size={22}
                  color={child.busAssigned ? Palette.nav.active : Palette.text.chevron}
                />
              </View>

              <View style={styles.childStats}>
                <Stat value={child.attendance} label="Attendance" />
                <Stat value={child.reports} label="Reports" />
                {showFinance ? <Stat value={child.wallet} label="Wallet" /> : null}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  },
);
ChildSummaryList.displayName = "ChildSummaryList";

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Text style={Type.caption} color={Palette.text.tertiary} numberOfLines={1}>
      <Text style={Type.statusChipText}>{value}</Text> {label}
    </Text>
  );
}

// ─── At a Glance ─────────────────────────────────────────────────────────────

export interface GlanceGridProps {
  tiles: GlanceTile[];
  onSelect?: (tile: GlanceTile) => void;
}

export const GlanceGrid = memo<GlanceGridProps>(({ tiles, onSelect }) => {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const gap = Spacing.gridGap.atAGlance;
  const tileWidth = Math.floor((contentWidth() - gap) / 2);

  return (
    <View style={styles.section}>
      <SectionTitle title="At a Glance" />

      <View style={[styles.wrapGrid, { gap }]}>
        {tiles.map((tile) => {
          // "unavailable" means the server couldn't work it out — greyed, not
          // shown as a number.
          const unavailable = tile.state === "unavailable";
          const { Icon, color } = moduleStyle(tile.code, tile.label);
          const accent = color ?? colors.primary;

          return (
            <Pressable
              key={tile.id}
              style={({ pressed }) => [
                styles.glanceTile,
                { width: tileWidth },
                unavailable && styles.dim,
                pressed && styles.pressed,
              ]}
              onPress={() => onSelect?.(tile)}
            >
              <View style={[styles.iconCircle, { backgroundColor: `${accent}1A` }]}>
                <Icon weight="fill" size={IconSize.inCircle34} color={accent} />
              </View>
              <View style={styles.flex}>
                <Text style={Type.cardTitle} numberOfLines={1}>
                  {tile.value}
                </Text>
                <Text style={Type.caption} color={Palette.text.tertiary} numberOfLines={1}>
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

// ─── Latest newsletters ──────────────────────────────────────────────────────

export interface NewsletterListProps {
  items: DashboardNewsletter[];
  onSelect?: (item: DashboardNewsletter) => void;
  onSeeAll?: () => void;
}

export const NewsletterList = memo<NewsletterListProps>(
  ({ items, onSelect, onSeeAll }) => {
    const { colors } = useTheme();
    const styles = useStyles(createStyles);

    if (!items.length) return null;

    return (
      <View style={styles.section}>
        <SectionTitle title="Latest Newsletters" action="See all" onAction={onSeeAll} />

        <View style={styles.list}>
          {items.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.newsRow,
                pressed && { backgroundColor: Palette.surface.pressedRow },
              ]}
              onPress={() => onSelect?.(item)}
            >
              {/* The payload has no newsletter kind, so every row uses the
                  brand colour the design gives newsletters elsewhere. */}
              <View
                style={[
                  styles.iconCircle,
                  styles.newsIcon,
                  { backgroundColor: colors.primary },
                ]}
              >
                <NewspaperIcon weight="fill" size={IconSize.inCircle34} color={Palette.text.onBrand} />
              </View>
              <View style={styles.flex}>
                <Text style={Type.itemTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={Type.caption} color={Palette.text.tertiary} numberOfLines={1}>
                  {item.date}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    );
  },
);
NewsletterList.displayName = "NewsletterList";

// ─── Today ───────────────────────────────────────────────────────────────────

export interface TodayListProps {
  tiles: GlanceTile[];
  date: string;
  onSelect?: (tile: GlanceTile) => void;
}

/** Value colour: muted when there's nothing to show, green when all is well. */
function todayValueColor(tile: GlanceTile): string {
  if (tile.state === "empty" || tile.state === "unavailable") {
    return Palette.text.tertiary;
  }
  if (/all present/i.test(tile.value)) return Palette.status.success.fg;
  return Palette.text.primary;
}

export const TodayList = memo<TodayListProps>(({ tiles, date, onSelect }) => {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  if (!tiles.length) return null;

  return (
    <View style={[styles.todayCard, Shadow.card]}>
      <View style={styles.sectionHeader}>
        <Text style={Type.cardHeading}>Today</Text>
        {date ? (
          <Text style={Type.caption} color={Palette.text.tertiary}>
            {date}
          </Text>
        ) : null}
      </View>

      <View>
        {tiles.map((tile, index) => {
          const { Icon, color } = moduleStyle(tile.code, tile.label);
          return (
            <Pressable
              key={tile.id}
              style={({ pressed }) => [
                styles.todayRow,
                index > 0 && styles.divided,
                pressed && styles.pressed,
              ]}
              onPress={() => onSelect?.(tile)}
            >
              <View style={styles.todayIcon}>
                <Icon weight="fill" size={IconSize.row} color={color ?? colors.primary} />
              </View>
              <Text style={[Type.rowLabel, styles.flex]} numberOfLines={1}>
                {tile.label}
              </Text>
              <Text
                style={[Type.meta, styles.medium]}
                color={todayValueColor(tile)}
                numberOfLines={1}
              >
                {tile.value}
              </Text>
              <CaretRightIcon weight="bold" size={IconSize.chevron} color={Palette.text.chevron} />
            </Pressable>
          );
        })}
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
      <SectionTitle title="Upcoming" />

      <View style={styles.upcomingCard}>
        {items.length === 0 ? (
          <View style={styles.emptyRow}>
            <CalendarBlankIcon size={18} color={Palette.text.tertiary} />
            <Text style={Type.meta} color={Palette.text.tertiary}>
              No upcoming events
            </Text>
          </View>
        ) : (
          items.map((item, index) => {
            const { color } = moduleStyle(item.type, item.title);
            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.upcomingRow,
                  index > 0 && styles.divided,
                  pressed && styles.pressed,
                ]}
                onPress={() => onSelect?.(item)}
              >
                <View style={styles.dateColumn}>
                  <Text style={Type.monthAbbr} color={color ?? colors.primary}>
                    {item.month.toUpperCase()}
                  </Text>
                  <Text style={styles.day}>{item.day}</Text>
                </View>

                <View style={styles.flex}>
                  <Text style={[Type.rowLabel, styles.medium]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.subtitle ? (
                    <Text style={Type.caption} color={Palette.text.tertiary} numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })
        )}
      </View>
    </View>
  );
});
UpcomingList.displayName = "UpcomingList";

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
    const styles = useStyles(createStyles);

    return (
      <Modal isVisible={visible} closeModal={onClose}>
        <View style={styles.sheet}>
          <Text style={Type.sheetTitle}>
            {actionLabel ? `${actionLabel} for…` : "Choose a child"}
          </Text>

          {students.map((child, index) => (
            <Pressable
              key={child.id}
              style={({ pressed }) => [
                styles.pickRow,
                pressed && { backgroundColor: Palette.surface.pressedRow },
              ]}
              onPress={() => onSelect(child)}
            >
              <View
                style={[
                  styles.pickAvatar,
                  {
                    backgroundColor:
                      Palette.avatar.children[index % Palette.avatar.children.length],
                  },
                ]}
              >
                <Text style={Type.cardHeading} color={Palette.text.onBrand}>
                  {child.initial}
                </Text>
              </View>
              <View style={styles.flex}>
                <Text style={Type.listTitleRead} numberOfLines={1}>
                  {child.name}
                </Text>
                {child.grade ? (
                  <Text style={Type.caption} color={Palette.text.tertiary}>
                    {child.grade}
                  </Text>
                ) : null}
              </View>
              <CaretRightIcon weight="bold" size={IconSize.chevron} color={Palette.text.chevron} />
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
      gap: Spacing.sectionTitleToContent,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    flex: {
      flex: 1,
    },
    medium: {
      fontWeight: "500",
    },
    regular: {
      fontWeight: "400",
    },
    pressed: {
      opacity: Opacity.pressed,
    },
    pressedCard: {
      opacity: Opacity.pressedCard,
    },
    dim: {
      opacity: 0.6,
    },
    wrapGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    iconCircle: {
      width: Size.iconCircle.sm,
      height: Size.iconCircle.sm,
      borderRadius: Size.iconCircle.sm / 2,
      alignItems: "center",
      justifyContent: "center",
    },
    divided: {
      borderTopWidth: 1,
      borderTopColor: Palette.border.divider,
    },

    // Quick actions
    actionTile: {
      height: Size.quickActionTile,
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      backgroundColor: colors.surface,
      borderRadius: Radius.card,
      paddingHorizontal: 6,
    },
    actionText: {
      alignItems: "center",
      maxWidth: "100%",
    },
    emptyActions: {
      height: Size.quickActionTile,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderRadius: Radius.card,
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: Palette.border.dashed,
    },

    // Children — the row bleeds to the screen edge so cards scroll under it
    bleed: {
      marginHorizontal: -Spacing.screenX,
    },
    childRow: {
      gap: Spacing.listGap.childCards,
      paddingHorizontal: Spacing.screenX,
      // Room for the card shadow, which a ScrollView would otherwise clip.
      paddingBottom: 4,
    },
    childCard: {
      backgroundColor: colors.surface,
      borderRadius: Radius.card,
      ...Spacing.cardPadding.default,
      ...Shadow.card,
    },
    childHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    childAvatar: {
      width: Size.avatar.child,
      height: Size.avatar.child,
      borderRadius: Size.avatar.child / 2,
      alignItems: "center",
      justifyContent: "center",
    },
    childInitial: {
      fontSize: 18,
      fontWeight: "600",
      lineHeight: 22,
    },
    childStats: {
      flexDirection: "row",
      gap: 14,
      marginTop: 11,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: Palette.border.divider,
    },

    // At a Glance
    glanceTile: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      backgroundColor: colors.surface,
      borderRadius: Radius.card,
      paddingVertical: 12,
      paddingHorizontal: 14,
    },

    // Newsletters
    list: {
      gap: Spacing.listGap.newsletterCards,
    },
    newsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: Palette.border.default,
      borderRadius: Radius.card,
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    newsIcon: {
      width: Size.iconCircle.md,
      height: Size.iconCircle.md,
      borderRadius: Size.iconCircle.md / 2,
    },

    // Today
    todayCard: {
      width: "100%",
      backgroundColor: colors.surface,
      borderRadius: Radius.card,
      paddingTop: 14,
      paddingHorizontal: 15,
      paddingBottom: 6,
    },
    todayRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: Spacing.rowPaddingY.today,
    },
    todayIcon: {
      width: 18,
      alignItems: "center",
    },

    // Upcoming
    upcomingCard: {
      backgroundColor: colors.surface,
      borderRadius: Radius.card,
      paddingVertical: 4,
      paddingHorizontal: 15,
    },
    upcomingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: Spacing.rowPaddingY.upcoming,
    },
    dateColumn: {
      width: 40,
      alignItems: "center",
    },
    day: {
      fontSize: 17,
      fontWeight: "600",
      lineHeight: 19,
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
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: Palette.border.default,
    },
    pickAvatar: {
      width: Size.avatar.picker,
      height: Size.avatar.picker,
      borderRadius: Size.avatar.picker / 2,
      alignItems: "center",
      justifyContent: "center",
    },
  });
