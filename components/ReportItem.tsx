import React, { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { Text } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";

export interface ReportData {
  id: string;
  title: string;
  description: string;
  date: string; // e.g. "11"
  day: string; // e.g. "Wed"
  type?: string;
  onPress?: () => void;
}

const ReportItem = memo<ReportData>(
  ({ title, description, date, day, onPress }) => {
    const { colors } = useTheme();
    const styles = useStyles(createStyles);

    return (
      <Pressable style={styles.container} onPress={onPress}>
        {/* Date badge */}
        <View style={styles.dateBadge}>
          <Text
            variant="label1"
            weight="bold"
            color={colors.textPrimaryInverted}
          >
            {date}
          </Text>
          <Text
            variant="caption1"
            weight="medium"
            color={colors.textPrimaryInverted}
          >
            {day}
          </Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text variant="label2" weight="medium" numberOfLines={1}>
            {title}
          </Text>
          <Text
            variant="label3"
            weight="regular"
            color={colors.textSecondary}
            numberOfLines={2}
          >
            {description}
          </Text>
        </View>
      </Pressable>
    );
  },
);

ReportItem.displayName = "ReportItem";
export default ReportItem;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dateBadge: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      flex: 1,
      gap: 4,
    },
  });
