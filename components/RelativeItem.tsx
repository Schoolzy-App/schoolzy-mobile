import { MaterialIcons } from "@expo/vector-icons";
import React, { memo, useCallback } from "react";
import { Image, type ImageStyle, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { Card, Text } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";
import type { Relative } from "@/services/mappers";

export interface RelativeItemProps {
  relative: Relative;
  /** Auth headers for the photo — it sits behind the bearer token. */
  photoHeaders?: Record<string, string>;
  onSelect?: (relative: Relative) => void;
}

const RelativeItem = memo<RelativeItemProps>(
  ({ relative, photoHeaders, onSelect }) => {
    const { colors } = useTheme();
    const styles = useStyles(createStyles);

    const handlePress = useCallback(
      () => onSelect?.(relative),
      [onSelect, relative],
    );

    return (
      <Card style={styles.card} onPress={handlePress} disabled={!onSelect}>
        {/* The photo is optional and often missing, so the initial is the
            default rather than a broken-image placeholder. */}
        {relative.photoUrl ? (
          <Image
            source={{ uri: relative.photoUrl, headers: photoHeaders }}
            style={styles.photo as ImageStyle}
          />
        ) : (
          <View style={[styles.photo, styles.initialBg]}>
            <Text variant="label1" weight="bold" color={colors.buttonText}>
              {relative.initial}
            </Text>
          </View>
        )}

        <View style={styles.texts}>
          <Text variant="label2" weight="semiBold" numberOfLines={1}>
            {relative.name}
          </Text>
          {relative.contact ? (
            <Text
              variant="caption1"
              weight="regular"
              color={colors.textSecondary}
              numberOfLines={1}
            >
              {relative.contact}
            </Text>
          ) : null}
        </View>

        {onSelect ? (
          <MaterialIcons
            name="chevron-right"
            size={20}
            color={colors.textSecondary}
          />
        ) : null}
      </Card>
    );
  },
);

RelativeItem.displayName = "RelativeItem";
export default RelativeItem;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 12,
    },
    photo: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.background,
    },
    initialBg: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.secondary,
    },
    texts: {
      flex: 1,
      gap: 2,
    },
  });
