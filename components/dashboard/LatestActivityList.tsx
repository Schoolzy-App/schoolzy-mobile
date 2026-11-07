import {
  ArrowRightIcon,
  BookOpenIcon,
  ClipboardTextIcon,
  HeartIcon,
  type Icon,
  NotebookIcon,
} from "phosphor-react-native";
import React, { memo, useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { moduleStyle } from "@/components/home/moduleStyle";
import { Text } from "@/components/ui";
import { Palette, Radius, Size, Type } from "@/constants/tokens";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";
import type { HomeworkState, LatestActivity } from "@/services/mappers";

export interface LatestActivityListProps {
  activities: LatestActivity[];
  onSelect?: (activity: LatestActivity) => void;
}

/**
 * Icon and colour per activity type. `type` is for presentation only —
 * routing goes through `navigation.destination` — so an unrecognised type
 * still gets a sensible row rather than breaking the list.
 */
const TYPE_STYLE: Record<string, { Icon: Icon; color: string }> = {
  Clinic: { Icon: HeartIcon, color: Palette.module.wellness.solid },
  HealthProfileCreated: { Icon: HeartIcon, color: Palette.module.wellness.solid },
  HealthProfileUpdated: { Icon: HeartIcon, color: Palette.module.wellness.solid },
  MonthlyExam: { Icon: ClipboardTextIcon, color: Palette.module.reports.solid },
  ExamReport: { Icon: ClipboardTextIcon, color: Palette.module.reports.solid },
  TeacherExamPublished: { Icon: BookOpenIcon, color: Palette.module.agenda.solid },
  TeacherExamResult: { Icon: BookOpenIcon, color: Palette.module.agenda.solid },
  Homework: { Icon: NotebookIcon, color: Palette.module.agenda.solid },
};

const HOMEWORK_TONE: Record<Exclude<HomeworkState, null>, string> = {
  notSubmitted: Palette.status.danger.fg,
  submitted: Palette.status.warning.fg,
  graded: Palette.status.success.fg,
};

/** The design shows at most three rows in the Latest sheet. */
const MAX_ROWS = 3;

/** Rows of the "Latest For {child}" sheet (Student Dashboard spec §8). */
const LatestActivityList = memo<LatestActivityListProps>(
  ({ activities, onSelect }) => {
    const styles = useStyles(createStyles);

    return (
      <View style={styles.list}>
        {activities.slice(0, MAX_ROWS).map((activity) => (
          <ActivityRow
            key={activity.id}
            activity={activity}
            onSelect={onSelect}
          />
        ))}
      </View>
    );
  },
);
LatestActivityList.displayName = "LatestActivityList";
export default LatestActivityList;

const ActivityRow = memo<{
  activity: LatestActivity;
  onSelect?: (activity: LatestActivity) => void;
}>(({ activity, onSelect }) => {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  const handlePress = useCallback(
    () => onSelect?.(activity),
    [onSelect, activity],
  );

  const fallback = moduleStyle(activity.type, activity.title);
  const { Icon, color } = TYPE_STYLE[activity.type] ?? {
    Icon: fallback.Icon,
    color: fallback.color ?? colors.primary,
  };

  const tone = activity.homeworkState
    ? HOMEWORK_TONE[activity.homeworkState]
    : null;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: Palette.surface.pressedRow },
      ]}
      onPress={handlePress}
      disabled={!onSelect}
    >
      <View style={[styles.icon, { backgroundColor: color }]}>
        <Icon weight="fill" size={19} color={Palette.text.onBrand} />
      </View>

      <View style={styles.texts}>
        <Text style={Type.listTitleRead} numberOfLines={1}>
          {activity.title}
        </Text>
        <Text style={Type.meta} color={Palette.text.tertiary} numberOfLines={1}>
          {[activity.subtitle, activity.when].filter(Boolean).join(" · ")}
        </Text>

        {/* Homework is the only type with a submission state, so this line
            appears on those rows alone. */}
        {tone && activity.statusLabel ? (
          <View style={[styles.statusPill, { backgroundColor: `${tone}1A` }]}>
            <Text style={Type.pill} color={tone}>
              {activity.statusLabel}
            </Text>
          </View>
        ) : null}
      </View>

      {onSelect ? <ArrowRightIcon weight="bold" size={17} color={color} /> : null}
    </Pressable>
  );
});
ActivityRow.displayName = "ActivityRow";

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    list: {
      width: "100%",
      gap: 11,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
      paddingVertical: 14,
      paddingHorizontal: 15,
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: Palette.border.default,
      backgroundColor: colors.surface,
    },
    icon: {
      width: Size.iconCircle.lg,
      height: Size.iconCircle.lg,
      borderRadius: Size.iconCircle.lg / 2,
      alignItems: "center",
      justifyContent: "center",
    },
    texts: {
      flex: 1,
    },
    statusPill: {
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: Radius.pill,
      marginTop: 4,
    },
  });
