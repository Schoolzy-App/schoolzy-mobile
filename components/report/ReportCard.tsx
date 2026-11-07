import {
  CalendarCheckIcon,
  CaretRightIcon,
  ChartLineUpIcon,
  EnvelopeSimpleIcon,
  ExamIcon,
  FirstAidIcon,
  type Icon,
  ListChecksIcon,
} from "phosphor-react-native";
import React, { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { Text } from "@/components/ui";
import { Opacity, Palette, Radius, Size, Type } from "@/constants/tokens";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";
import type { StudentReport } from "@/services/mappers";

/**
 * Icon per report category (Reports spec §5). Categories the design doesn't
 * name — Other, Newsletter, StudentDynamic — read as letters.
 */
const CATEGORY_ICON: Record<number, Icon> = {
  1: ExamIcon,
  2: ChartLineUpIcon,
  3: FirstAidIcon,
  6: ListChecksIcon,
  7: CalendarCheckIcon,
};

export const reportIcon = (category: number): Icon =>
  CATEGORY_ICON[category] ?? EnvelopeSimpleIcon;

/**
 * Right-aligns text that starts in Arabic, as the design's dir="auto".
 * Android ignores textAlign "auto" for this, so the script is checked here.
 */
export const directionalAlign = (text: string) =>
  ({ textAlign: /^[^A-Za-z]*[؀-ۿ]/.test(text) ? "right" : "left" }) as const;

/** "Exams · Mid of year" */
export const reportTypeLabel = (report: StudentReport) =>
  [report.categoryLabel, report.examTermLabel].filter(Boolean).join(" · ");

export interface ReportCardProps {
  report: StudentReport;
  onSelect: (report: StudentReport) => void;
}

/**
 * One report in the list. The design's status pills and filled "action
 * needed" date block aren't shown: the API has no report status yet
 * (docs/api-notes.md).
 */
const ReportCard = memo<ReportCardProps>(({ report, onSelect }) => {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const TypeIcon = reportIcon(report.category);

  return (
    <Pressable
      onPress={() => onSelect(report)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.dateBlock, { backgroundColor: `${colors.primary}14` }]}>
        <Text style={Type.reportDay} color={colors.primary}>
          {report.day}
        </Text>
        <Text style={styles.weekday} color={colors.primary}>
          {report.weekday}
        </Text>
      </View>

      <View style={styles.flex}>
        {/* Arabic titles align right, as the design's dir="auto". */}
        <Text style={[Type.listTitleRead, directionalAlign(report.title)]} numberOfLines={1}>
          {report.title}
        </Text>
        <View style={styles.meta}>
          <TypeIcon size={12} color={Palette.text.secondary} />
          <Text style={Type.caption} color={Palette.text.secondary} numberOfLines={1}>
            {reportTypeLabel(report)}
          </Text>
        </View>
      </View>

      <CaretRightIcon weight="bold" size={14} color={Palette.text.chevron} />
    </Pressable>
  );
});

ReportCard.displayName = "ReportCard";
export default ReportCard;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: Radius.card,
      backgroundColor: colors.surface,
    },
    pressed: {
      opacity: Opacity.pressedCard,
    },
    dateBlock: {
      width: Size.reportDateBlock.width,
      height: Size.reportDateBlock.height,
      borderRadius: Radius.iconTile,
      alignItems: "center",
      justifyContent: "center",
    },
    weekday: {
      fontSize: 11,
      lineHeight: 13,
    },
    flex: {
      flex: 1,
      gap: 4,
    },
    meta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
  });
