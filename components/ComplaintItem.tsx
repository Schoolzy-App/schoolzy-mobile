import { MaterialIcons } from "@expo/vector-icons";
import React, { memo, useCallback } from "react";
import { StyleSheet, View } from "react-native";

import { Card, Text } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";
import type { Complaint, ComplaintTone } from "@/services/mappers";

export interface ComplaintItemProps {
  complaint: Complaint;
  /**
   * Stable handler receiving the complaint. Preferred over a per-row closure,
   * which would give every row a new prop identity each render.
   */
  onSelect?: (complaint: Complaint) => void;
}

/** Mirrors RequestItem's palette so the two lists read the same way. */
export const COMPLAINT_TONE_COLOR: Record<ComplaintTone, string> = {
  submitted: "#4F7DCA", // filed, not yet picked up
  active: "#E8A923", // under review / in progress
  resolved: "#22863A",
  rejected: "#CA1616",
};

const ComplaintItem = memo<ComplaintItemProps>(({ complaint, onSelect }) => {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const accent = COMPLAINT_TONE_COLOR[complaint.tone];

  const handlePress = useCallback(
    () => onSelect?.(complaint),
    [onSelect, complaint],
  );

  // Card is itself a Pressable, so onPress goes straight to it — wrapping it
  // in another Pressable would swallow the touch.
  return (
    <Card style={styles.card} onPress={handlePress} disabled={!onSelect}>
      <View style={styles.row}>
        <View style={[styles.iconBg, { backgroundColor: accent + "18" }]}>
          <MaterialIcons name="report-problem" size={20} color={accent} />
        </View>

        <View style={styles.texts}>
          <Text variant="label2" weight="semiBold" numberOfLines={1}>
            {complaint.title}
          </Text>
          {complaint.meta ? (
            <Text
              variant="label3"
              weight="regular"
              color={colors.textSecondary}
              numberOfLines={1}
            >
              {complaint.meta}
            </Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          <View style={[styles.badge, { backgroundColor: accent + "20" }]}>
            <Text variant="caption1" weight="semiBold" color={accent}>
              {complaint.statusLabel}
            </Text>
          </View>
          {onSelect ? (
            <MaterialIcons
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          ) : null}
        </View>
      </View>

      {/* Second line: who it concerns and when. Kept out of the title row so a
          long title doesn't push the date off screen. */}
      <Text variant="caption1" weight="regular" color={colors.textSecondary}>
        {[
          complaint.studentName ? `For ${complaint.studentName}` : null,
          complaint.createdAt,
          complaint.coordinatorName
            ? `With ${complaint.coordinatorName}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ")}
      </Text>
    </Card>
  );
});

ComplaintItem.displayName = "ComplaintItem";
export default ComplaintItem;

const createStyles = () =>
  StyleSheet.create({
    card: {
      gap: 8,
    },
    row: {
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
