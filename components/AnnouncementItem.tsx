import React, { memo, useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { IconContainer, Text } from "@/components/ui";
import { Icons } from "@/constants";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";

const { Announcement } = Icons;

export interface AnnouncementData {
  id: string;
  title: string;
  subtitle: string;
  /** "03/10/2026" — shown above the time. */
  date?: string;
  time: string;
  /** Override icon bg color */
  iconColor?: string;
  onPress?: () => void;
}

interface AnnouncementItemProps extends AnnouncementData {
  /** Stable list-level handler; receives the whole item. */
  onSelect?: (item: AnnouncementData) => void;
}

const AnnouncementItem = memo<AnnouncementItemProps>((props) => {
  const { id, title, subtitle, date, time, iconColor, onPress, onSelect } =
    props;
    const { colors } = useTheme();
    const styles = useStyles(createStyles);

    const handlePress = useCallback(() => {
      if (onSelect) {
        onSelect(props);
        return;
      }
      onPress?.();
    }, [onSelect, onPress, props]);

    // Alternate between primary and secondary based on the item id,
    // so newsletters get a consistent two-tone rhythm in the list.
    const themeColors = [colors.primary, colors.secondary];
    const resolvedColor =
      iconColor ?? themeColors[parseInt(id, 10) % themeColors.length];

    return (
      <Pressable style={styles.container} onPress={handlePress}>
        {/* Colored rounded-square icon */}
        <IconContainer size={44} color={resolvedColor}>
          <Announcement width={22} height={22} />
        </IconContainer>

        {/* Text */}
        <View style={styles.content}>
          <Text variant="label2" weight="semiBold" numberOfLines={1}>
            {title}
          </Text>
          <Text
            variant="label3"
            weight="regular"
            color={colors.textSecondary}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        </View>

        {/* Date above time — a time alone says nothing on a list that
            spans weeks. */}
        <View style={styles.timestamp}>
          {date ? (
            <Text
              variant="caption1"
              weight="medium"
              color={colors.textSecondary}
            >
              {date}
            </Text>
          ) : null}
          {time ? (
            <Text
              variant="caption2"
              weight="regular"
              color={colors.textSecondary}
            >
              {time}
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
});

AnnouncementItem.displayName = "AnnouncementItem";
export default AnnouncementItem;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "flex-start",
      padding: 16,
      gap: 12,
      borderRadius: 12,
      borderColor: colors.border,
      borderWidth: 1,
    },
    timestamp: {
      alignItems: "flex-end",
      marginTop: 2,
      gap: 2,
    },
    content: {
      flex: 1,
      gap: 2,
    },
  });
