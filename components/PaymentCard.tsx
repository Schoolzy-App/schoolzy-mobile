import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { IconContainer, Text } from "@/components/ui";
import { Icons } from "@/constants";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";

export type PaymentCardData = {
  id: string;
  title: string;
  amount: string; // e.g. "EGP 50,000"
  dueDate?: string; // e.g. "Due 25/12/2026"
  /** Secondary line, e.g. the subjects an IG account covers. */
  subtitle?: string;
  /** "EGP 6,000 of EGP 10,000 paid" — only on partially paid installments. */
  paidLabel?: string;
  /** 0–1. Renders a progress bar when greater than zero. */
  progress?: number;
};

type PaymentCardProps = PaymentCardData & {
  selected?: boolean;
  onPress?: () => void;
  fullWidth?: boolean;
};

export default function PaymentCard({
  title,
  amount,
  dueDate,
  subtitle,
  paidLabel,
  progress = 0,
  selected,
  onPress,
  fullWidth,
}: PaymentCardProps) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  return (
    <Pressable
      style={[
        styles.card,
        fullWidth && styles.fullWidth,
        selected && { borderColor: colors.primary, borderWidth: 1.5 },
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <IconContainer color={colors.secondary}>
        <Icons.FinanceWhite width={20} height={20} />
      </IconContainer>
      <View style={styles.info}>
        <Text variant="label3" weight="regular" color={colors.textSecondary}>
          {title}
        </Text>
        <Text variant="label1" weight="bold">
          {amount}
        </Text>

        {subtitle ? (
          <Text
            variant="caption1"
            weight="regular"
            color={colors.textSecondary}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}

        {dueDate ? (
          <Text
            variant="caption1"
            weight="regular"
            color={colors.textSecondary}
            numberOfLines={1}
          >
            {dueDate}
          </Text>
        ) : null}

        {/* Partially paid installments show how much is already covered, so
            the outstanding figure above doesn't read as the full fee. */}
        {progress > 0 ? (
          <View style={styles.progressBlock}>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  {
                    backgroundColor: colors.success,
                    width: `${Math.round(progress * 100)}%`,
                  },
                ]}
              />
            </View>
            {paidLabel ? (
              <Text
                variant="caption2"
                weight="regular"
                color={colors.textSecondary}
                numberOfLines={1}
              >
                {paidLabel}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    card: {
      width: 170,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 12,
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    fullWidth: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    info: {
      gap: 2,
      flex: 1,
    },
    progressBlock: {
      marginTop: 6,
      gap: 4,
    },
    track: {
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      overflow: "hidden",
    },
    fill: {
      height: "100%",
      borderRadius: 2,
    },
  });
