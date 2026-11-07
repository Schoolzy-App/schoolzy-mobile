import React, { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { Text } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";

export interface FoodItemData {
  id: string;
  name: string;
  price: number; // EGP
}

interface FoodItemRowProps extends FoodItemData {
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}

const FoodItemRow = memo<FoodItemRowProps>(
  ({ name, price, selected, disabled, onPress }) => {
    const { colors } = useTheme();
    const styles = useStyles(createStyles);

    return (
      <Pressable
        style={[
          styles.container,
          selected && {
            borderColor: colors.primary,
            backgroundColor: colors.primary + "08",
          },
          disabled && styles.disabled,
        ]}
        onPress={onPress}
        disabled={disabled}
      >
        <View style={styles.textCol}>
          <Text variant="label2" weight="semiBold" numberOfLines={2}>
            {name}
          </Text>
          <Text
            variant="label3"
            weight="regular"
            color={selected ? colors.primary : colors.textSecondary}
          >
            {price} EGP
          </Text>
        </View>

        <View
          style={[
            styles.checkbox,
            selected && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
          ]}
        >
          {selected ? (
            <Text variant="caption1" weight="bold" color={colors.buttonText}>
              ✓
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  },
);

FoodItemRow.displayName = "FoodItemRow";
export default FoodItemRow;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    textCol: {
      flex: 1,
      gap: 2,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    disabled: {
      opacity: 0.5,
    },
  });
