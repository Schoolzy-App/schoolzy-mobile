import { BellIcon } from "phosphor-react-native";
import React, { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { Text } from "@/components/ui";
import { IconSize, Palette, Size, Type } from "@/constants/tokens";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";

export interface ParentHeaderProps {
  parentName: string;
  /** Shown in the avatar circle, e.g. "RH". */
  initials: string;
  onNotificationPress?: () => void;
  /** Unread notification count; the badge is hidden when 0 or undefined. */
  unreadCount?: number;
}

const ParentHeader = memo<ParentHeaderProps>(
  ({ parentName, initials, onNotificationPress, unreadCount = 0 }) => {
    const { colors } = useTheme();
    const styles = useStyles(createStyles);

    return (
      <View style={styles.container}>
        {/* Left: avatar + greeting */}
        <View style={styles.left}>
          <View style={styles.avatar}>
            <Text style={[styles.initials, { color: colors.primary }]}>
              {initials}
            </Text>
          </View>
          <View style={styles.textGroup}>
            <Text style={Type.meta} color={colors.textPrimaryInverted}>
              Welcome Back!
            </Text>
            <Text
              style={Type.listTitleRead}
              color={colors.textPrimaryInverted}
              numberOfLines={1}
            >
              {parentName}
            </Text>
          </View>
        </View>

        {/* Right: notification bell */}
        <Pressable
          onPress={onNotificationPress}
          hitSlop={8}
          style={({ pressed }) => [styles.bell, pressed && styles.pressed]}
        >
          <BellIcon
            weight="fill"
            size={IconSize.bell}
            color={Palette.nav.active}
          />

          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={Type.badge} color={Palette.text.onBrand}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>
    );
  },
);

ParentHeader.displayName = "ParentHeader";
export default ParentHeader;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    left: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    avatar: {
      width: Size.avatar.parent,
      height: Size.avatar.parent,
      borderRadius: Size.avatar.parent / 2,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    initials: {
      fontSize: 15,
      fontWeight: "600",
      lineHeight: 18,
    },
    textGroup: {
      flex: 1,
    },
    bell: {
      width: Size.avatar.parent,
      height: Size.avatar.parent,
      borderRadius: Size.avatar.parent / 2,
      backgroundColor: Palette.surface.iconButton,
      alignItems: "center",
      justifyContent: "center",
    },
    pressed: {
      opacity: 0.7,
    },
    badge: {
      position: "absolute",
      top: -4,
      right: -4,
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 2,
      backgroundColor: Palette.nav.badge,
      alignItems: "center",
      justifyContent: "center",
    },
  });
