import type { Icon } from "phosphor-react-native";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";

import { Text } from "@/components/ui";
import { Palette, Size, Type } from "@/constants/tokens";

export interface FormButtonProps {
  label: string;
  onPress?: () => void;
  /**
   * "primary": filled. "secondary": white with a grey border (Back).
   * "outline": white with a coloured border (Load more, Open).
   */
  variant?: "primary" | "secondary" | "outline";
  /** Fill / border colour; defaults to the form screens' action blue. */
  color?: string;
  Icon?: Icon;
  disabled?: boolean;
  /** Shows a spinner in place of the icon and blocks presses. */
  loading?: boolean;
  /** 50 by default; 44 for the outline buttons. */
  height?: number;
}

/** The form screens' pill button (Complaints spec §3, Update Information). */
export default function FormButton({
  label,
  onPress,
  variant = "primary",
  color = Palette.action.primary,
  Icon,
  disabled,
  loading,
  height = Size.formPrimaryButton,
}: FormButtonProps) {
  const primary = variant === "primary";
  const textColor = primary
    ? Palette.text.onBrand
    : variant === "outline"
      ? color
      : Palette.text.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { height, borderRadius: height / 2 },
        primary && { backgroundColor: color },
        variant === "secondary" && styles.secondary,
        variant === "outline" && { borderWidth: 1, borderColor: color, backgroundColor: Palette.surface.card },
        pressed && (primary ? styles.pressedPrimary : { backgroundColor: `${color}14` }),
        disabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : Icon ? (
        <Icon weight="bold" size={18} color={textColor} />
      ) : null}
      <Text style={height < 48 ? Type.button : Type.formButton} color={textColor} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  secondary: {
    backgroundColor: Palette.surface.card,
    borderWidth: 1,
    borderColor: Palette.form.secondaryButtonBorder,
  },
  pressedPrimary: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.6,
  },
});
