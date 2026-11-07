import React, { memo } from "react";
import { StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { Card, Text } from "@/components/ui";
import { Icons } from "@/constants";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";

export interface NotificationData {
  id: string;
  title: string;
  description: string;
  /** Display-friendly relative time, e.g. "6 min ago" */
  time: string;
  /** Unread → shows the colored dot on the right */
  unread?: boolean;
  onPress?: () => void;
}

const NotificationItem = memo<NotificationData>(
  ({ title, description, time, unread, onPress }) => {
    const { colors } = useTheme();
    const styles = useStyles(createStyles);

    return (
      <Card style={styles.card} onPress={onPress} disabled={!onPress}>
        {/* ── Bell icon ──────────────────────────────────── */}
        <View
          style={[styles.iconBg, { backgroundColor: colors.background }]}
        >
          <Icons.NotificationIcon width={22} height={22} color={colors.primary} />
        </View>

        {/* ── Texts ──────────────────────────────────────── */}
        <View style={styles.texts}>
          <Text variant="label1" weight="bold" numberOfLines={1}>
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
          <View style={styles.timeRow}>
            <Icons.ClockIcon width={12} height={12} />
            <Text variant="caption1" weight="semiBold" color={colors.primary}>
              {time}
            </Text>
          </View>
        </View>

        {/* ── Unread dot ─────────────────────────────────── */}
        {unread ? (
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
        ) : null}
      </Card>
    );
  },
);

NotificationItem.displayName = "NotificationItem";
export default NotificationItem;

const createStyles = (_colors: ColorPalette) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    iconBg: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    texts: {
      flex: 1,
      gap: 4,
    },
    timeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 4,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginTop: 4,
    },
  });
