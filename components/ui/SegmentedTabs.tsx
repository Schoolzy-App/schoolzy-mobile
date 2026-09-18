import React, { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";

import Text from "./Text";

export interface SegmentedTab<T extends string> {
  value: T;
  label: string;
}

interface SegmentedTabsProps<T extends string> {
  tabs: SegmentedTab<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * Two-or-three-way switch for mutually exclusive modes. Renders nothing when
 * only one tab is available — a switch with a single option is just noise.
 */
function SegmentedTabsInner<T extends string>({
  tabs,
  value,
  onChange,
}: SegmentedTabsProps<T>) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  if (tabs.length < 2) return null;

  return (
    <View style={styles.track}>
      {tabs.map((tab) => {
        const isActive = tab.value === value;
        return (
          <Pressable
            key={tab.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={[
              styles.segment,
              isActive && { backgroundColor: colors.primary },
            ]}
            onPress={() => onChange(tab.value)}
          >
            <Text
              variant="label3"
              weight={isActive ? "semiBold" : "medium"}
              color={isActive ? colors.buttonText : colors.textSecondary}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const SegmentedTabs = memo(SegmentedTabsInner) as typeof SegmentedTabsInner;
export default SegmentedTabs;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    track: {
      flexDirection: "row",
      backgroundColor: colors.background,
      borderRadius: 24,
      padding: 4,
      gap: 4,
    },
    segment: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 20,
    },
  });
