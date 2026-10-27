import { MaterialIcons } from "@expo/vector-icons";
import React, { memo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { Text } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";
import type { TodayTile } from "@/services/mappers";

export interface TodayTilesProps {
  tiles: TodayTile[];
  /** One or more sections failed server-side; shown as a quiet footnote. */
  isPartial?: boolean;
}

const ICON: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  Attendance: "check-circle-outline",
  Classes: "schedule",
  Homework: "assignment",
  Exams: "quiz",
  Reports: "description",
};

/**
 * The five Today summary tiles.
 *
 * Horizontally scrolled rather than wrapped into a grid: five tiles at a
 * readable width don't fit a phone, and a 2x3 grid would leave a hole.
 *
 * A failed tile is rendered greyed with "Couldn't load" instead of a zero —
 * the one thing the integration guide insists on, because a fabricated 0%
 * attendance is worse than an obvious gap.
 */
const TodayTiles = memo<TodayTilesProps>(({ tiles, isPartial }) => {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {tiles.map((tile) => {
          const failed = tile.status === "failed";
          const accent = failed ? colors.textSecondary : colors.primary;

          return (
            <View
              key={tile.key}
              style={[styles.tile, failed && styles.tileFailed]}
            >
              <View style={styles.tileHeader}>
                <MaterialIcons
                  name={ICON[tile.key] ?? "info-outline"}
                  size={16}
                  color={accent}
                />
                <Text
                  variant="caption1"
                  weight="medium"
                  color={colors.textSecondary}
                >
                  {tile.label}
                </Text>
              </View>

              <Text
                variant="h6"
                weight="bold"
                color={failed ? colors.textSecondary : colors.textPrimary}
              >
                {tile.value}
              </Text>

              <Text
                variant="caption2"
                weight="regular"
                color={colors.textSecondary}
                numberOfLines={2}
              >
                {tile.detail}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {isPartial ? (
        <Text
          variant="caption1"
          weight="regular"
          color={colors.textSecondary}
          style={styles.partial}
        >
          Some information couldn&apos;t be loaded.
        </Text>
      ) : null}
    </View>
  );
});

TodayTiles.displayName = "TodayTiles";
export default TodayTiles;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    wrapper: {
      width: "100%",
      gap: 8,
    },
    row: {
      paddingHorizontal: 16,
      gap: 10,
    },
    tile: {
      width: 132,
      minHeight: 96,
      padding: 12,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
      justifyContent: "space-between",
    },
    tileFailed: {
      opacity: 0.6,
    },
    tileHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    partial: {
      paddingHorizontal: 16,
    },
  });
