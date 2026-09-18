import React, { memo } from "react";
import type { ImageStyle } from "react-native";
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import type { ColorPalette } from "@/apps";
import { Text } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";

export interface MealData {
  id: string;
  title: string;
  description: string;
  price: number; // EGP
  /**
   * Optional. The cafeteria API carries no artwork, so cards normally render
   * in a compact, text-only form rather than reserving space for a picture
   * that never arrives.
   */
  image?: ImageSourcePropType;
}

interface MealItemProps extends MealData {
  selected?: boolean;
  onPress?: () => void;
}

const MealItem = memo<MealItemProps>(
  ({ title, description, price, image, selected, onPress }) => {
    const { colors } = useTheme();
    const styles = useStyles(createStyles);

    const tick = selected ? (
      <View style={[styles.badge, { backgroundColor: colors.primary }]}>
        <Text variant="caption1" weight="bold" color={colors.buttonText}>
          ✓
        </Text>
      </View>
    ) : null;

    return (
      <Pressable
        style={[
          styles.container,
          !image && styles.compact,
          selected && {
            borderColor: colors.primary,
            backgroundColor: colors.primary + "08",
          },
        ]}
        onPress={onPress}
      >
        {/* ── Image + selection badge ───────────────────────────── */}
        {image ? (
          <View style={styles.imageWrapper}>
            <Image source={image} style={styles.image as ImageStyle} />
            {tick}
          </View>
        ) : (
          // Without artwork the tick sits on the card itself, so the row keeps
          // its height instead of reserving space for an empty frame.
          tick
        )}

        {/* ── Title ──────────────────────────────────────────────── */}
        <Text
          variant="label2"
          weight="semiBold"
          numberOfLines={2}
          style={!image ? styles.compactTitle : undefined}
        >
          {title}
        </Text>

        {/* ── Description ───────────────────────────────────────── */}
        <Text
          variant="label3"
          weight="regular"
          color={colors.textSecondary}
          numberOfLines={1}
        >
          {description}
        </Text>

        {/* ── Price ─────────────────────────────────────────────── */}
        <Text
          variant="label2"
          weight="bold"
          color={selected ? colors.primary : colors.textPrimary}
        >
          {price} EGP
        </Text>
      </Pressable>
    );
  },
);

MealItem.displayName = "MealItem";
export default MealItem;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      width: 140,
      gap: 4,
      padding: 8,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: "transparent",
      backgroundColor: "transparent",
    },
    /** Text-only card: narrower, and outlined so it still reads as a target. */
    compact: {
      width: 150,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      justifyContent: "space-between",
      minHeight: 96,
    },
    compactTitle: {
      paddingRight: 24,
    },
    imageWrapper: {
      position: "relative",
      width: "100%",
      marginBottom: 6,
    },
    image: {
      width: "100%",
      height: 110,
      borderRadius: 12,
    },
    badge: {
      position: "absolute",
      top: 6,
      right: 6,
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      // small ring so the badge pops against the image
      borderWidth: 2,
      borderColor: "#FFFFFF",
    },
  });
