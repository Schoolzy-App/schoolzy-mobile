import React, { memo, useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { IconContainer, Text } from "@/components/ui";
import { Icons } from "@/constants";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";
import type { ChildData } from "@/types/child";

const { BusActiveIcon, BusInactiveIcon } = Icons;

interface ChildItemProps extends ChildData {
  /** Stable list-level handler; receives the whole child. */
  onSelect?: (child: ChildData) => void;
}

const ChildItem = memo<ChildItemProps>((props) => {
  const {
    name,
    year,
    onPress,
    onSelect,
    avatarIcon,
    activeBus,
    itemWidth,
    gender,
  } = props;
    const { colors } = useTheme();
    const styles = useStyles(createStyles);
    const Avatar = avatarIcon;
    const BusIcon = activeBus ? BusActiveIcon : BusInactiveIcon;

    // Defined inside a memoized component, so this closure is only rebuilt
    // when the item itself re-renders — not on every parent render.
    const handlePress = useCallback(() => {
      if (onSelect) {
        onSelect(props);
        return;
      }
      onPress?.();
    }, [onSelect, onPress, props]);

    return (
      <Pressable
        style={[styles.container, itemWidth ? { width: itemWidth } : undefined]}
        onPress={handlePress}
      >
        <View style={styles.content}>
          <View style={styles.avaText}>
            {/* Avatar */}
            <IconContainer
              color={gender === "male" ? colors.tertiary : colors.secondary}
              size={45}
            >
              {<Avatar width={40} height={40} />}
            </IconContainer>
            {/* Name */}
            <View style={styles.textGroup}>
              <Text
                variant="label2"
                weight="medium"
                color={colors.textPrimaryInverted}
              >
                {name}
              </Text>
              <Text
                variant="body4"
                weight="regular"
                color={colors.textSecondaryInverted}
              >
                {year}
              </Text>
            </View>
          </View>

          {/* Bus icon */}
          <BusIcon width={20} height={20} />
        </View>
      </Pressable>
    );
});

ChildItem.displayName = "ChildItem";
export default ChildItem;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      alignItems: "center",
      gap: 4,
      padding: 12,
      backgroundColor: colors.cardInverted,
      borderRadius: 16,
      minWidth: 88,
    },
    content: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      width: "100%",
    },
    textGroup: { gap: 2 },
    avaText: { gap: 8 },
  });
