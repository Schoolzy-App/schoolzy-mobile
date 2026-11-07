import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { Text } from "@/components/ui";
import { Palette, Radius, Size, Type } from "@/constants/tokens";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";

export interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** Equal-width segments on a grey track (Reports spec §3). */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  return (
    <View style={styles.track}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && styles.selected]}
          >
            <Text
              style={Type.chipSmall}
              color={selected ? colors.primary : Palette.text.secondary}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    track: {
      flexDirection: "row",
      gap: 4,
      padding: Size.segmented.trackPadding,
      borderRadius: Radius.statusChip,
      backgroundColor: Palette.surface.segmentTrack,
    },
    segment: {
      flex: 1,
      height: Size.segmented.height,
      borderRadius: Radius.pill,
      alignItems: "center",
      justifyContent: "center",
    },
    selected: {
      backgroundColor: colors.surface,
    },
  });
