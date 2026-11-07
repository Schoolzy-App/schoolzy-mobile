import React, { memo } from "react";
import { StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { Card, IconContainer, Text } from "@/components/ui";
import { Icons } from "@/constants";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";
import type { ChildAvatarIcon } from "@/types/child";

export interface StudentStat {
  label: string;
  value: string;
  /** Override the value's text color (defaults to textPrimary). */
  color?: string;
}

export interface StudentCardProps {
  name: string;
  year: string;
  activeBus: boolean;
  allergies: string;
  bloodType: string;
  attendance: string;
  avatarIcon: ChildAvatarIcon;
  trailingElement?: React.ReactNode;
  showStats?: boolean;
  /**
   * Override the third stat cell (defaults to "Attendance").
   * Useful for context-specific cards (e.g., Wellness shows a wellness metric).
   */
  thirdStat?: StudentStat;
}

const StudentCard = memo<StudentCardProps>(
  ({
    name,
    year,
    activeBus,
    allergies,
    bloodType,
    attendance,
    avatarIcon,
    trailingElement,
    showStats,
    thirdStat,
  }) => {
    const { colors } = useTheme();
    const styles = useStyles(createStyles);

    const Avatar = avatarIcon;
    const BusIcon = activeBus ? Icons.BusActiveIcon : Icons.BusInactiveIcon;

    return (
      <View style={styles.cardContainer}>
        <Card style={styles.studentCard}>
          {/* ── Student Row ───────────────────────────── */}
          <View style={styles.studentRow}>
            <IconContainer size={50} color={colors.secondary}>
              <Avatar width={40} height={40} />
            </IconContainer>
            <View style={styles.studentInfo}>
              <Text variant="label1" weight="semiBold">
                {name}
              </Text>
              <Text
                variant="label3"
                weight="regular"
                color={colors.textSecondary}
              >
                {year}
              </Text>
            </View>
            {trailingElement ?? <BusIcon width={20} height={20} />}
          </View>

          {/* ── Stats Row ─────────────────────────────── */}
          {showStats && (
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text
                  variant="label3"
                  weight="regular"
                  color={colors.textSecondary}
                >
                  Allergies
                </Text>
                <Text variant="label2" weight="semiBold">
                  {allergies}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text
                  variant="label3"
                  weight="regular"
                  color={colors.textSecondary}
                >
                  Blood Type
                </Text>
                <Text variant="label2" weight="semiBold">
                  {bloodType}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text
                  variant="label3"
                  weight="regular"
                  color={colors.textSecondary}
                >
                  {thirdStat?.label ?? "Attendance"}
                </Text>
                <Text
                  variant="label2"
                  weight="semiBold"
                  color={
                    thirdStat
                      ? (thirdStat.color ?? colors.textPrimary)
                      : colors.danger
                  }
                >
                  {thirdStat?.value ?? attendance}
                </Text>
              </View>
            </View>
          )}
        </Card>
      </View>
    );
  },
);

StudentCard.displayName = "StudentCard";
export default StudentCard;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    cardContainer: {
      width: "100%",
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    studentCard: {
      gap: 16,
    },
    studentRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    studentInfo: {
      flex: 1,
      gap: 2,
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 8,
    },
    stat: {
      flex: 1,
      alignItems: "center",
      gap: 2,
    },
    statDivider: {
      width: 1,
      height: 28,
      backgroundColor: colors.border,
    },
  });
