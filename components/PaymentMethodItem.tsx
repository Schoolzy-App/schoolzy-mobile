import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { IconContainer, Text } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";
import { SvgProps } from "react-native-svg";

export type PaymentMethodData = {
  id: string;
  label: string;
  sublabel: string;
  sublabelColor?: string;
  iconEmoji?: React.FC<SvgProps>;
  rightAction?: { label: string; onPress?: () => void };
};

type PaymentMethodItemProps = PaymentMethodData & {
  selected?: boolean;
  onPress?: () => void;
};

export default function PaymentMethodItem({
  label,
  sublabel,
  sublabelColor,
  iconEmoji: IconEmoji,
  rightAction,
  selected,
  onPress,
}: PaymentMethodItemProps) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <IconContainer color={colors.border} size={44}>
        {IconEmoji && <IconEmoji />}
      </IconContainer>
      <View style={styles.text}>
        <Text variant="label2" weight="semiBold">
          {label}
        </Text>
        <Text
          variant="caption1"
          weight="regular"
          color={sublabelColor ?? colors.textSecondary}
        >
          {sublabel}
        </Text>
      </View>
      {rightAction ? (
        <Pressable
          style={[styles.rightButton, { backgroundColor: colors.primary }]}
          onPress={rightAction.onPress}
        >
          <Text variant="caption1" weight="semiBold" color={colors.buttonText}>
            {rightAction.label}
          </Text>
        </Pressable>
      ) : (
        <View
          style={[styles.radio, selected && { borderColor: colors.primary }]}
        >
          {selected && (
            <View
              style={[styles.radioDot, { backgroundColor: colors.primary }]}
            />
          )}
        </View>
      )}
    </Pressable>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    icon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    text: {
      flex: 1,
      gap: 2,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    radioDot: {
      width: 11,
      height: 11,
      borderRadius: 6,
    },
    rightButton: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 16,
    },
  });
