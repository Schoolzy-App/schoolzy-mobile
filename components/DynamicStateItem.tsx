import React, { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { Text } from "@/components/ui";
import { Icons } from "@/constants";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";

const {
  GoodRoundIcon,
  WellnessRoundIcon,
  AgendaRoundIcon,
  EmergencyRoundIcon,
  FinanceRoundIcon,
} = Icons;

export type DynamicStateType =
  | "success"
  | "medical"
  | "homework"
  | "emergency"
  | "payment";

export interface DynamicStateData {
  id: string;
  type: DynamicStateType;
  title: string;
  subtitle?: string;
  /** Optional child id this state refers to — used by parents to dispatch onPress. */
  studentId?: string;
  onPress?: () => void;
}

// ─── Per-type config ─────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<
  DynamicStateType,
  { Icon: React.FC<{ width?: number; height?: number }>; arrowColor: string }
> = {
  success: { Icon: GoodRoundIcon, arrowColor: "#4F7DCA" },
  medical: { Icon: WellnessRoundIcon, arrowColor: "#36BD0D" },
  homework: { Icon: AgendaRoundIcon, arrowColor: "#FFAF44" },
  emergency: { Icon: EmergencyRoundIcon, arrowColor: "#CA1616" },
  payment: { Icon: FinanceRoundIcon, arrowColor: "#5F70F2" },
};

// Detect a leading clock emoji (⏰ / U+23F0) so we can swap it for the SVG icon
const CLOCK_PREFIX_RE = /^\s*⏰\s*/;

const DynamicStateItem = memo<DynamicStateData>(
  ({ type, title, subtitle, onPress }) => {
    const { colors } = useTheme();
    const styles = useStyles(createStyles);
    const { Icon, arrowColor } = TYPE_CONFIG[type];

    const hasClock = !!subtitle && CLOCK_PREFIX_RE.test(subtitle);
    const subtitleText = hasClock
      ? subtitle!.replace(CLOCK_PREFIX_RE, "")
      : subtitle;

    return (
      <Pressable style={styles.container} onPress={onPress}>
        {/* Round type icon */}
        <Icon width={40} height={40} />

        {/* Text content */}
        <View style={styles.content}>
          <Text variant="label2" weight="medium" numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <View style={styles.subtitleRow}>
              {hasClock ? (
                <Icons.ClockIcon width={12} height={12} />
              ) : null}
              <Text
                variant="label3"
                weight="regular"
                color={colors.textSecondary}
                numberOfLines={1}
                style={styles.subtitleText}
              >
                {subtitleText}
              </Text>
            </View>
          )}
        </View>

        {/* Colored arrow for actionable items */}
        {onPress && (
          <Text variant="label2" weight="bold" color={arrowColor}>
            →
          </Text>
        )}
      </Pressable>
    );
  },
);

DynamicStateItem.displayName = "DynamicStateItem";
export default DynamicStateItem;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      gap: 12,
      minHeight: 56,
    },
    content: {
      flex: 1,
      gap: 2,
    },
    subtitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    subtitleText: {
      flex: 1,
    },
  });
