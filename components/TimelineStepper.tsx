import React from "react";
import { StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { Text } from "@/components/ui";
import { Icons } from "@/constants";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";

export type TimelineStatus = "done" | "current" | "pending";

/**
 * A refund or adjustment derived from the row above it. Rendered indented under
 * its parent rather than as a row of its own, so it never reads as a separate
 * payment.
 */
export type TimelineSubItem = {
  id: string;
  label: string; // "Refund" / "Adjustment"
  amount: string; // already formatted, e.g. "−EGP 500"
  date?: string;
  /** Tints the amount to signal money moving back out. */
  negative?: boolean;
};

export type TimelineStep = {
  id: string;
  title: string;
  subtitle?: string;
  status: TimelineStatus;
  badge?: string; // optional right-side badge label (e.g. "Bank Transfer")
  children?: TimelineSubItem[];
};

type TimelineStepperProps = {
  items: TimelineStep[];
  /** When false, hides the dot + connector line column entirely. */
  showTimeline?: boolean;
  /** When false, keeps the dots but hides the vertical connector line. */
  showConnector?: boolean;
};

export default function TimelineStepper({
  items,
  showTimeline = true,
  showConnector = true,
}: TimelineStepperProps) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  return (
    <View style={styles.wrapper}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isDone = item.status === "done";
        const isCurrent = item.status === "current";

        return (
          <View key={item.id} style={styles.row}>
            {/* ── Dot + connector line ─────────────────────────── */}
            {showTimeline ? (
              <View style={styles.iconCol}>
                <View
                  style={[
                    styles.dot,
                    isDone && {
                      backgroundColor: "transparent",
                      borderColor: "transparent",
                    },
                    isCurrent && {
                      backgroundColor: colors.textPrimary,
                      borderColor: colors.textPrimary,
                    },
                  ]}
                >
                  {isDone && <Icons.Tick width={16} height={16} />}
                </View>
                {!isLast && showConnector && (
                  <View
                    style={[
                      styles.line,
                      isDone && { backgroundColor: colors.success },
                    ]}
                  />
                )}
              </View>
            ) : null}

            {/* ── Text ────────────────────────────────────────── */}
            <View style={styles.textCol}>
              <View style={styles.titleRow}>
                <Text
                  variant="label2"
                  weight={isCurrent ? "semiBold" : "medium"}
                  style={styles.title}
                  color={
                    item.status === "pending"
                      ? colors.textSecondary
                      : colors.textPrimary
                  }
                >
                  {item.title}
                </Text>
                {item.badge ? (
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: `${colors.success}1F`,
                      },
                    ]}
                  >
                    <Text
                      variant="caption2"
                      weight="medium"
                      color={colors.success}
                    >
                      {item.badge}
                    </Text>
                  </View>
                ) : null}
              </View>
              {item.subtitle ? (
                <View style={styles.subtitleRow}>
                  <Icons.ClockIcon width={12} height={12} />
                  <Text
                    variant="caption1"
                    weight="regular"
                    color={colors.textSecondary}
                  >
                    {item.subtitle}
                  </Text>
                </View>
              ) : null}

              {/* Refunds / adjustments belonging to this payment */}
              {item.children?.length ? (
                <View style={styles.childList}>
                  {item.children.map((child) => (
                    <View key={child.id} style={styles.childRow}>
                      <Text
                        variant="caption1"
                        weight="regular"
                        color={colors.textSecondary}
                        style={styles.childLabel}
                        numberOfLines={1}
                      >
                        {child.date ? `${child.label} · ${child.date}` : child.label}
                      </Text>
                      <Text
                        variant="caption1"
                        weight="medium"
                        color={
                          child.negative ? colors.danger : colors.textSecondary
                        }
                      >
                        {child.amount}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    wrapper: {
      gap: 0,
      alignItems: "center",
    },
    row: {
      flexDirection: "row",
      gap: 12,
    },
    iconCol: {
      alignItems: "center",
      width: 20,
      marginVertical: 4,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    line: {
      flex: 1,
      width: 2,
      backgroundColor: colors.border,
      marginTop: 10,
      marginBottom: 4,
      minHeight: 24,
    },
    textCol: {
      flex: 1,
      paddingBottom: 20,
      gap: 2,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    title: {
      flex: 1,
    },
    badge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    subtitleRow: {
      marginTop: 4,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    childList: {
      marginTop: 8,
      gap: 6,
      paddingLeft: 10,
      borderLeftWidth: 2,
      borderLeftColor: colors.border,
    },
    childRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    childLabel: {
      flex: 1,
    },
  });
