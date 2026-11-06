import React from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";

import type { ColorPalette } from "@/apps";
import { Text } from "@/components/ui";
import { Opacity, Palette, Radius, Size, Spacing, Type } from "@/constants/tokens";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";

export interface FilterChipOption<T extends string> {
  value: T;
  label: string;
  /** Shown after the label at 75% opacity; omitted when undefined. */
  count?: number;
}

export interface FilterChipsProps<T extends string> {
  options: FilterChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** "md" on Newsletter and Reports, "sm" on Finance history. */
  size?: "md" | "sm";
  /** Selected fill; defaults to the brand. Complaints use action blue. */
  accent?: string;
}

/**
 * A horizontal row of filter chips (Newsletter spec §4, Finance §6). The row
 * bleeds to the screen edges, so place it inside the screen's padding.
 */
export default function FilterChips<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  accent,
}: FilterChipsProps<T>) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const small = size === "sm";
  const selectedColor = accent ?? colors.primary;
  const chipSize = small ? Size.chipSmall : Size.chip;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.bleed}
      contentContainerStyle={styles.row}
    >
      {options.map((option) => {
        const selected = option.value === value;
        const textColor = selected ? Palette.text.onBrand : Palette.text.primary;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.chip,
              {
                height: chipSize.height,
                paddingHorizontal: chipSize.paddingX,
                borderRadius: small ? Radius.chipSmall : Radius.chip,
              },
              selected && {
                backgroundColor: selectedColor,
                borderColor: selectedColor,
              },
              pressed && styles.pressed,
            ]}
          >
            <Text style={small ? Type.chipSmall : Type.chip} color={textColor} numberOfLines={1}>
              {option.label}
            </Text>
            {option.count !== undefined ? (
              <Text
                style={[
                  small ? styles.countSmall : styles.count,
                  { opacity: Opacity.chipCount },
                ]}
                color={textColor}
              >
                {option.count}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    bleed: {
      marginHorizontal: -Spacing.screenX,
      flexGrow: 0,
    },
    row: {
      gap: Spacing.listGap.chips,
      paddingHorizontal: Spacing.screenX,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: Palette.border.default,
      backgroundColor: colors.surface,
    },
    pressed: {
      opacity: Opacity.pressed,
    },
    count: {
      fontSize: 12,
      fontWeight: "600",
      lineHeight: 15,
    },
    countSmall: {
      fontSize: 11,
      fontWeight: "600",
      lineHeight: 14,
    },
  });
