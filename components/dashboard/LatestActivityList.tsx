import { MaterialIcons } from "@expo/vector-icons";
import React, { memo, useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { Text } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";
import type { HomeworkState, LatestActivity } from "@/services/mappers";

export interface LatestActivityListProps {
  activities: LatestActivity[];
  onSelect?: (activity: LatestActivity) => void;
}

/**
 * Icon per activity type. `type` is for presentation only — routing goes
 * through `navigation.destination` — so an unrecognised type still gets a
 * sensible row rather than breaking the list.
 */
const ICON: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  Clinic: "local-hospital",
  MonthlyExam: "assessment",
  ExamReport: "assessment",
  TeacherExamPublished: "quiz",
  TeacherExamResult: "grading",
  Homework: "assignment",
  HealthProfileCreated: "favorite-border",
  HealthProfileUpdated: "favorite-border",
};

const HOMEWORK_TONE: Record<Exclude<HomeworkState, null>, string> = {
  notSubmitted: "#CA1616",
  submitted: "#E8A923",
  graded: "#22863A",
};

const LatestActivityList = memo<LatestActivityListProps>(
  ({ activities, onSelect }) => {
    const styles = useStyles(createStyles);

    return (
      <View style={styles.list}>
        {activities.map((activity) => (
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

  const tone = activity.homeworkState
    ? HOMEWORK_TONE[activity.homeworkState]
    : null;

  return (
    <Pressable
      style={styles.row}
      onPress={handlePress}
      disabled={!onSelect}
    >
      <View style={[styles.iconBg, { backgroundColor: colors.primary + "15" }]}>
        <MaterialIcons
          name={ICON[activity.type] ?? "history"}
          size={20}
          color={colors.primary}
        />
      </View>

      <View style={styles.texts}>
        <Text variant="label3" weight="semiBold" numberOfLines={1}>
          {activity.title}
        </Text>

        <Text
          variant="caption1"
          weight="regular"
          color={colors.textSecondary}
          numberOfLines={1}
        >
          {[activity.subtitle, activity.when].filter(Boolean).join(" · ")}
        </Text>

        {/* Homework is the only type with a submission state, so this line
            appears on those rows alone. */}
        {tone && activity.statusLabel ? (
          <View style={[styles.statusPill, { backgroundColor: tone + "18" }]}>
            <Text variant="caption2" weight="semiBold" color={tone}>
              {activity.statusLabel}
            </Text>
          </View>
        ) : null}
      </View>

      {onSelect ? (
        <MaterialIcons
          name="chevron-right"
          size={20}
          color={colors.textSecondary}
        />
      ) : null}
    </Pressable>
  );
});
ActivityRow.displayName = "ActivityRow";

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    list: {
      width: "100%",
      gap: 10,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    iconBg: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
    },
    texts: {
      flex: 1,
      gap: 3,
    },
    statusPill: {
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      marginTop: 1,
    },
  });
