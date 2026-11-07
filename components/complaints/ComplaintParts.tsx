import {
  BriefcaseIcon,
  BuildingsIcon,
  BusIcon,
  CalendarBlankIcon,
  CalendarCheckIcon,
  ChalkboardTeacherIcon,
  ChatCircleTextIcon,
  DotsThreeCircleIcon,
  FlagIcon,
  GraduationCapIcon,
  type Icon,
  StudentIcon,
  UsersThreeIcon,
} from "phosphor-react-native";
import React, { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { Text } from "@/components/ui";
import { Palette, Radius, Size, Type } from "@/constants/tokens";
import { useStyles } from "@/hooks";
import type { Complaint } from "@/services/mappers";
import type { ComplaintSummaryDto } from "@/types/api";

/**
 * Shared pieces of the Complaints screens (Complaints spec §2, §5). Colours
 * key on the numeric status / priority / category; the words are the
 * server's display strings.
 */

/** 1 Submitted … 6 Rejected */
export const STATUS_COLOR: Record<number, string> = {
  1: Palette.complaintStatus.Submitted,
  2: Palette.complaintStatus.UnderReview,
  3: Palette.complaintStatus.InProgress,
  4: Palette.complaintStatus.Resolved,
  5: Palette.complaintStatus.Closed,
  6: Palette.complaintStatus.Rejected,
};

/** 1 Low … 4 Urgent */
export const PRIORITY_COLOR: Record<number, string> = {
  1: Palette.complaintPriority.Low,
  2: Palette.complaintPriority.Medium,
  3: Palette.complaintPriority.High,
  4: Palette.complaintPriority.Urgent,
};

/** 1 Academic … 7 Other */
const CATEGORY_ICON: Record<number, Icon> = {
  1: GraduationCapIcon,
  2: UsersThreeIcon,
  3: BriefcaseIcon,
  4: BuildingsIcon,
  5: ChalkboardTeacherIcon,
  6: BusIcon,
  7: DotsThreeCircleIcon,
};

export const categoryIcon = (category: number): Icon =>
  CATEGORY_ICON[category] ?? DotsThreeCircleIcon;

// ─── Chips ───────────────────────────────────────────────────────────────────

export function StatusChip({
  status,
  label,
  large,
}: {
  status: number;
  label: string;
  /** Detail screen size. */
  large?: boolean;
}) {
  const styles = useStyles(createStyles);
  const color = STATUS_COLOR[status] ?? Palette.text.tertiary;
  return (
    <View
      style={[
        styles.statusChip,
        large && styles.statusChipLarge,
        { backgroundColor: `${color}26` },
      ]}
    >
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={[Type.statusChipText, large && styles.chipTextLarge]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function PriorityChip({
  priority,
  label,
  large,
}: {
  priority: number;
  label: string;
  large?: boolean;
}) {
  const styles = useStyles(createStyles);
  const color = PRIORITY_COLOR[priority] ?? Palette.text.tertiary;
  return (
    <View style={[styles.priorityChip, large && styles.priorityChipLarge, { borderColor: color }]}>
      <FlagIcon weight="fill" size={12} color={color} />
      <Text style={[Type.statusChipText, large && styles.chipTextLarge]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

// ─── Summary tiles ───────────────────────────────────────────────────────────

const TILES: { key: keyof ComplaintSummaryDto; label: string; dot: string }[] = [
  { key: "total", label: "Total", dot: Palette.text.primary },
  { key: "pending", label: "Pending", dot: Palette.complaintStatus.Submitted },
  { key: "inProgress", label: "In Progress", dot: Palette.complaintStatus.InProgress },
  { key: "resolved", label: "Resolved", dot: Palette.complaintStatus.Resolved },
];

export function SummaryTiles({ summary }: { summary: ComplaintSummaryDto }) {
  const styles = useStyles(createStyles);
  return (
    <View style={styles.tiles}>
      {TILES.map((tile) => (
        <View key={tile.key} style={styles.tile}>
          <Text style={Type.summaryValue}>{summary[tile.key]}</Text>
          <View style={styles.tileLabel}>
            <View style={[styles.tileDot, { backgroundColor: tile.dot }]} />
            <Text style={styles.tileText} color={Palette.text.secondary} numberOfLines={1}>
              {tile.label}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────

export interface ComplaintCardProps {
  complaint: Complaint;
  onSelect: (complaint: Complaint) => void;
}

export const ComplaintCard = memo<ComplaintCardProps>(({ complaint, onSelect }) => {
  const styles = useStyles(createStyles);
  const CategoryIcon = categoryIcon(complaint.category);

  return (
    <Pressable
      onPress={() => onSelect(complaint)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardTop}>
        <Text style={Type.reference} color={Palette.text.secondary} numberOfLines={1}>
          {complaint.reference}
        </Text>
        <StatusChip status={complaint.status} label={complaint.statusLabel} />
      </View>

      <Text style={Type.complaintCardTitle}>{complaint.title}</Text>

      <View style={styles.meta}>
        {complaint.studentName ? (
          <View style={styles.metaItem}>
            <StudentIcon size={15} color={Palette.text.secondary} />
            <Text style={Type.meta} color={Palette.text.secondary}>
              {complaint.studentName}
            </Text>
          </View>
        ) : null}
        {complaint.categoryLabel ? (
          <View style={styles.metaItem}>
            <CategoryIcon size={15} color={Palette.text.secondary} />
            <Text style={Type.meta} color={Palette.text.secondary}>
              {complaint.categoryLabel}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <PriorityChip priority={complaint.priority} label={complaint.priorityLabel} />
        {complaint.submittedLabel ? (
          <View style={styles.metaItem}>
            <CalendarBlankIcon size={14} color={Palette.text.secondary} />
            <Text style={Type.caption} color={Palette.text.secondary}>
              {complaint.submittedLabel}
            </Text>
          </View>
        ) : null}
        {complaint.followUpLabel ? (
          <View style={styles.metaItem}>
            <CalendarCheckIcon size={14} color={Palette.text.secondary} />
            <Text style={Type.caption} color={Palette.text.secondary}>
              {complaint.followUpLabel}
            </Text>
          </View>
        ) : null}
        {complaint.hasReply ? (
          <View style={[styles.metaItem, styles.replied]}>
            <ChatCircleTextIcon weight="fill" size={14} color={Palette.action.primary} />
            <Text style={Type.buttonXSmall} color={Palette.action.primary}>
              School replied
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});
ComplaintCard.displayName = "ComplaintCard";

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    statusChip: {
      alignSelf: "flex-start",
      height: Size.statusChip,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      borderRadius: Radius.statusChip,
    },
    statusChipLarge: {
      height: Size.statusChipLarge,
      paddingHorizontal: 11,
      borderRadius: 13,
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
    },
    chipTextLarge: {
      fontSize: 13,
      lineHeight: 16,
    },
    priorityChip: {
      height: Size.priorityChip,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 8,
      borderRadius: 11,
      borderWidth: 1,
    },
    priorityChipLarge: {
      height: 24,
      paddingHorizontal: 9,
      borderRadius: 12,
    },

    tiles: {
      flexDirection: "row",
      gap: 8,
    },
    tile: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingVertical: 10,
      paddingHorizontal: 8,
      gap: 3,
    },
    tileLabel: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    tileDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    tileText: {
      flexShrink: 1,
      fontSize: 12,
      lineHeight: 14,
    },

    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.card,
      paddingVertical: 14,
      paddingHorizontal: 16,
      gap: 9,
      shadowColor: "#000",
      shadowOpacity: 0.04,
      shadowRadius: 2,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
    cardPressed: {
      backgroundColor: Palette.surface.pressedRow,
    },
    cardTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    meta: {
      flexDirection: "row",
      flexWrap: "wrap",
      rowGap: 4,
      columnGap: 14,
    },
    metaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    footer: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      rowGap: 8,
      columnGap: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: Palette.border.divider,
    },
    replied: {
      marginLeft: "auto",
    },
  });
