import {
  CheckCircleIcon,
  ClipboardTextIcon,
  ClockIcon,
  ExamIcon,
  type Icon,
  InfoIcon,
  NotebookIcon,
} from "phosphor-react-native";
import React, { memo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { Text } from "@/components/ui";
import {
  Palette,
  Radius,
  Shadow,
  Spacing,
  Type,
} from "@/constants/tokens";
import { useStyles } from "@/hooks";
import type { TodayTile } from "@/services/mappers";

export interface TodayTilesProps {
  tiles: TodayTile[];
  /** One or more sections failed server-side; shown as a quiet footnote. */
  isPartial?: boolean;
}

const ICON: Record<string, { Icon: Icon; color: string }> = {
  Attendance: { Icon: CheckCircleIcon, color: Palette.status.success.solid },
  Classes: { Icon: ClockIcon, color: Palette.module.agenda.solid },
  Homework: { Icon: NotebookIcon, color: Palette.module.agenda.solid },
  Exams: { Icon: ExamIcon, color: Palette.module.agenda.solid },
  Reports: { Icon: ClipboardTextIcon, color: Palette.module.reports.solid },
};

const COLUMNS = 3;
const GAP = 8;
const CARD_PADDING_X = 15;

/** "Thu, 8 Oct" */
function todayLabel(): string {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/**
 * The Today card (spec §6): a 3-column grid of stat tiles.
 *
 * A failed tile is rendered greyed with "Couldn't load" instead of a zero —
 * the one thing the integration guide insists on, because a fabricated 0%
 * attendance is worse than an obvious gap.
 */
const TodayTiles = memo<TodayTilesProps>(({ tiles, isPartial }) => {
  const styles = useStyles(createStyles);
  const inner =
    Dimensions.get("window").width - Spacing.screenX * 2 - CARD_PADDING_X * 2;
  // Floored so three tiles never round up past the row and wrap.
  const tileWidth = Math.floor((inner - GAP * (COLUMNS - 1)) / COLUMNS);

  return (
    <View style={[styles.card, Shadow.card]}>
      <View style={styles.header}>
        <Text style={Type.cardHeading}>Today</Text>
        <Text style={Type.caption} color={Palette.text.tertiary}>
          {todayLabel()}
        </Text>
      </View>

      <View style={styles.grid}>
        {tiles.map((tile) => {
          const failed = tile.status === "failed";
          const { Icon, color } = ICON[tile.key] ?? {
            Icon: InfoIcon,
            color: Palette.text.tertiary,
          };

          return (
            <View
              key={tile.key}
              style={[styles.tile, { width: tileWidth }, failed && styles.failed]}
            >
              <View style={styles.labelRow}>
                <Icon
                  weight="fill"
                  size={13}
                  color={failed ? Palette.text.tertiary : color}
                />
                <Text style={Type.statLabel} color={Palette.text.tertiary} numberOfLines={1}>
                  {tile.label}
                </Text>
              </View>

              <Text
                style={Type.cardHeading}
                color={failed ? Palette.text.tertiary : Palette.text.primary}
                numberOfLines={1}
              >
                {tile.value}
              </Text>

              {tile.detail ? (
                <Text style={Type.statLabel} color={Palette.text.tertiary} numberOfLines={1}>
                  {tile.detail}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>

      {isPartial ? (
        <Text style={[Type.caption, styles.partial]} color={Palette.text.tertiary}>
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
    card: {
      width: "100%",
      backgroundColor: colors.surface,
      borderRadius: Radius.card,
      paddingVertical: 14,
      paddingHorizontal: CARD_PADDING_X,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: GAP,
    },
    tile: {
      backgroundColor: Palette.surface.subtle,
      borderRadius: Radius.statTile,
      paddingVertical: 9,
      paddingHorizontal: 10,
      gap: 2,
    },
    failed: {
      opacity: 0.6,
    },
    labelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    partial: {
      marginTop: 10,
    },
  });
