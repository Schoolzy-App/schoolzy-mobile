import React, { memo } from "react";
import {
  ColorValue,
  Text as RNText,
  StyleSheet,
  TextProps,
  TextStyle,
} from "react-native";

import { useTheme } from "@/contexts/ThemeContext";

// ─── Variant → { fontSize, lineHeight } ──────────────────────────────────────
export type TextVariant =
  // Title
  | "title1" // 72/88
  | "title2" // 64/76
  | "title3" // 56/68
  // Heading
  | "h1" // 56/68
  | "h2" // 48/58
  | "h3" // 40/48
  | "h4" // 32/38
  | "h5" // 24/30
  | "h6" // 20/24
  // Label
  | "label1" // 16/22
  | "label2" // 14/20
  | "label3" // 12/16
  // Body
  | "body1" // 18/28
  | "body2" // 16/24
  | "body3" // 14/20
  | "body4" // 12/16
  // Caption
  | "caption1" // 10/12
  | "caption2" // 9/10
  // Utility
  | "link";

// ─── Weight ───────────────────────────────────────────────────────────────────
export type TextWeight = "regular" | "medium" | "semiBold" | "bold";

const weightMap: Record<TextWeight, TextStyle["fontWeight"]> = {
  regular: "400",
  medium: "500",
  semiBold: "600",
  bold: "700",
};

// ─── Default weight per variant ───────────────────────────────────────────────
const defaultWeight: Record<TextVariant, TextWeight> = {
  title1: "bold",
  title2: "bold",
  title3: "bold",
  h1: "bold",
  h2: "bold",
  h3: "semiBold",
  h4: "semiBold",
  h5: "semiBold",
  h6: "semiBold",
  label1: "medium",
  label2: "medium",
  label3: "medium",
  body1: "regular",
  body2: "regular",
  body3: "regular",
  body4: "regular",
  caption1: "medium",
  caption2: "medium",
  link: "regular",
};

export interface CustomTextProps extends TextProps {
  variant?: TextVariant;
  weight?: TextWeight;
  color?: ColorValue;
}

const Text = memo<CustomTextProps>(
  ({ variant, weight, children, style, color, ...props }) => {
    const { colors } = useTheme();

    const resolvedWeight =
      weight ?? (variant ? defaultWeight[variant] : "regular");

    return (
      <RNText
        style={[
          baseStyle,
          { color: colors.textPrimary },
          variant && variantStyles[variant],
          { fontWeight: weightMap[resolvedWeight] },
          variant === "caption1" && { color: colors.textSecondary },
          variant === "caption2" && { color: colors.textSecondary },
          variant === "link" && { color: colors.primary },
          color && { color },
          style,
        ]}
        {...props}
      >
        {children}
      </RNText>
    );
  },
);

Text.displayName = "Text";
export default Text;

// ─── Base ─────────────────────────────────────────────────────────────────────
const baseStyle: TextStyle = {
  fontSize: 16,
  lineHeight: 24,
  fontFamily: "Inter",
  textAlign: "left",
  fontWeight: "400",
};

// ─── Variant styles (size + lineHeight only) ──────────────────────────────────
const variantStyles = StyleSheet.create<Record<TextVariant, TextStyle>>({
  // Title
  title1: { fontSize: 72, lineHeight: 88 },
  title2: { fontSize: 64, lineHeight: 76 },
  title3: { fontSize: 56, lineHeight: 68 },
  // Heading
  h1: { fontSize: 56, lineHeight: 68 },
  h2: { fontSize: 48, lineHeight: 58 },
  h3: { fontSize: 40, lineHeight: 48 },
  h4: { fontSize: 32, lineHeight: 38 },
  h5: { fontSize: 24, lineHeight: 30 },
  h6: { fontSize: 20, lineHeight: 24 },
  // Label
  label1: { fontSize: 16, lineHeight: 22 },
  label2: { fontSize: 14, lineHeight: 20 },
  label3: { fontSize: 12, lineHeight: 16 },
  // Body
  body1: { fontSize: 18, lineHeight: 28 },
  body2: { fontSize: 16, lineHeight: 24 },
  body3: { fontSize: 14, lineHeight: 20 },
  body4: { fontSize: 12, lineHeight: 16 },
  // Caption
  caption1: { fontSize: 10, lineHeight: 12 },
  caption2: { fontSize: 9, lineHeight: 10 },
  // Utility
  link: { textDecorationLine: "underline" },
});
