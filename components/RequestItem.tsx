import { MaterialIcons } from "@expo/vector-icons";
import React, { memo, useCallback } from "react";
import { StyleSheet, View } from "react-native";

import { Card, Text } from "@/components/ui";
import { Icons } from "@/constants";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";
import type { Request, RequestStatus } from "@/types/request";

export interface RequestItemProps {
  request: Request;
  /**
   * Stable handler receiving the request. Preferred over a per-row `onPress`
   * closure, which would give every row a new prop identity each render.
   */
  onSelect?: (request: Request) => void;
  /** Escape hatch for call sites that already have a bound callback. */
  onPress?: () => void;
}

const STATUS_COLOR: Record<RequestStatus, string> = {
  pending: "#E8A923", // warning
  accepted: "#22863A", // success
  rejected: "#CA1616", // danger
  cancelled: "#81828B", // grey
};

const RequestItem = memo<RequestItemProps>(({ request, onSelect, onPress }) => {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const accent = STATUS_COLOR[request.status];
  const isAccepted = request.status === "accepted";

  const handlePress = useCallback(() => {
    if (onSelect) {
      onSelect(request);
      return;
    }
    onPress?.();
  }, [onSelect, onPress, request]);

  const pressable = !!onSelect || !!onPress;

  // Card is itself a Pressable, so forward onPress directly to it
  // (wrapping it in another Pressable would swallow the touch event).
  return (
    <Card
      style={styles.card}
      onPress={handlePress}
      disabled={!pressable}
    >
      {/* ── Icon ──────────────────────────────────────────── */}
      <View
        style={[styles.iconBg, { backgroundColor: colors.primary + "15" }]}
      >
        <Icons.ReportIcon width={22} height={22} />
      </View>

      {/* ── Texts ─────────────────────────────────────────── */}
      <View style={styles.texts}>
        <Text variant="label2" weight="semiBold" numberOfLines={1}>
          {request.documentLabel}
        </Text>
        <Text
          variant="label3"
          weight="regular"
          color={colors.textSecondary}
          numberOfLines={1}
        >
          For {request.studentName.split(" ")[0]} · {request.createdAt}
        </Text>
      </View>

      {/* ── Status badge + chevron ────────────────────────── */}
      <View style={styles.actions}>
        <View style={[styles.badge, { backgroundColor: accent + "20" }]}>
          <Text variant="caption1" weight="semiBold" color={accent}>
            {request.statusLabel}
          </Text>
        </View>
        {isAccepted && pressable ? (
          <MaterialIcons
            name="chevron-right"
            size={20}
            color={colors.textSecondary}
          />
        ) : null}
      </View>
    </Card>
  );
});

RequestItem.displayName = "RequestItem";
export default RequestItem;

const createStyles = () =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
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
      gap: 2,
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
  });
