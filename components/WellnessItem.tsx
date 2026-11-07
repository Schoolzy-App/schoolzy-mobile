import React, { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";
import { IconContainer, Text } from "@/components/ui";
import { Icons } from "@/constants";

export interface WellnessData {
  id: string;
  title: string;
  date: string; // e.g. "25/08/2026 | 11:09 PM"
  trustedBy: string; // e.g. "Brighton Med. Center"
  fileSize: string; // e.g. "1.2 MB"
  type?: string;
  onPress?: () => void;
}

const WellnessItem = memo<WellnessData>(
  ({ title, date, trustedBy, fileSize, onPress }) => {
    const { colors } = useTheme();
    const styles = useStyles(createStyles);

    return (
      <Pressable style={styles.container} onPress={onPress}>
        {/* ── Header Row ─────────────────────────────────────────── */}
        <View style={styles.header}>
          <IconContainer size={36} color={colors.background}>
            <Text variant="caption1" weight="bold" color={colors.primary}>
              DOC
            </Text>
          </IconContainer>
          <View style={styles.headerText}>
            <Text variant="label2" weight="bold" numberOfLines={1}>
              {title}
            </Text>
            <View style={styles.dateRow}>
              <Icons.ClockIcon width={12} height={12} />
              <Text
                variant="label3"
                weight="regular"
                color={colors.textSecondary}
                numberOfLines={1}
                style={styles.dateText}
              >
                {date}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Document Preview Placeholder ────────────────────────── */}
        <View style={styles.preview}>
          <View style={styles.previewLine} />
          <View style={styles.previewLineShort} />
          <View style={styles.previewLine} />
          <View style={styles.previewTable}>
            <View style={styles.previewTableRow}>
              <View style={[styles.previewCell, { backgroundColor: colors.primary + "20" }]} />
              <View style={[styles.previewCell, { backgroundColor: colors.primary + "20" }]} />
              <View style={[styles.previewCell, { backgroundColor: colors.primary + "20" }]} />
            </View>
            <View style={styles.previewTableRow}>
              <View style={[styles.previewCell, { backgroundColor: colors.secondary + "15" }]} />
              <View style={[styles.previewCell, { backgroundColor: colors.secondary + "15" }]} />
              <View style={[styles.previewCell, { backgroundColor: colors.secondary + "15" }]} />
            </View>
          </View>
        </View>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <View style={styles.footer}>
          <View style={styles.trustedRow}>
            <IconContainer size={24} color="#36BD0D">
              <Text variant="caption2" weight="bold" color="#FFFFFF">
                {"\u2713"}
              </Text>
            </IconContainer>
            <Text
              variant="label3"
              weight="medium"
              color={colors.textSecondary}
              numberOfLines={1}
              style={styles.trustedText}
            >
              Trusted by {trustedBy}
            </Text>
          </View>
          <Text variant="label3" weight="medium" color={colors.textSecondary}>
            {fileSize}
          </Text>
        </View>
      </Pressable>
    );
  },
);

WellnessItem.displayName = "WellnessItem";
export default WellnessItem;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },

    // ── Header ──────────────────────────────────────────────
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    headerText: {
      flex: 1,
      gap: 2,
    },
    dateRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    dateText: {
      flex: 1,
    },

    // ── Preview ─────────────────────────────────────────────
    preview: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      gap: 8,
    },
    previewLine: {
      height: 6,
      width: "70%",
      borderRadius: 3,
      backgroundColor: colors.border,
    },
    previewLineShort: {
      height: 6,
      width: "45%",
      borderRadius: 3,
      backgroundColor: colors.border,
    },
    previewTable: {
      marginTop: 4,
      gap: 4,
    },
    previewTableRow: {
      flexDirection: "row",
      gap: 4,
    },
    previewCell: {
      flex: 1,
      height: 20,
      borderRadius: 4,
    },

    // ── Footer ──────────────────────────────────────────────
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    trustedRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flex: 1,
    },
    trustedText: {
      flex: 1,
    },
  });
