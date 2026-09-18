import React, { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import ParentAvatar from "@/components/ParentAvatar";
import { IconContainer, Text } from "@/components/ui";
import { Icons } from "@/constants";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";

const { NotificationIcon } = Icons;

export interface ParentHeaderProps {
  parentName: string;
  /** Drives the avatar illustration. From /home/current-user. */
  gender?: string;
  onNotificationPress?: () => void;
  /** Unread notification count; the badge is hidden when 0 or undefined. */
  unreadCount?: number;
}

const ParentHeader = memo<ParentHeaderProps>(
  ({ parentName, gender, onNotificationPress, unreadCount = 0 }) => {
    const { colors } = useTheme();
    const styles = useStyles(createStyles);

    return (
      <View style={styles.container}>
        {/* Left: avatar + greeting */}
        <View style={styles.left}>
          <IconContainer size={44} color={colors.surface}>
            <ParentAvatar gender={gender} size={24} />
          </IconContainer>
          <View style={styles.textGroup}>
            <Text
              variant="body3"
              weight="regular"
              color={colors.textPrimaryInverted}
            >
              Welcome Back!
            </Text>
            <Text
              variant="label1"
              weight="medium"
              color={colors.textPrimaryInverted}
            >
              {parentName}
            </Text>
          </View>
        </View>

        {/* Right: notification bell */}
        <Pressable onPress={onNotificationPress} hitSlop={8}>
          <IconContainer size={44} color={colors.background}>
            <NotificationIcon width={20} height={20} />
          </IconContainer>

          {unreadCount > 0 ? (
            <View style={[styles.badge, { backgroundColor: colors.danger }]}>
              <Text
                variant="caption2"
                weight="bold"
                color={colors.textPrimaryInverted}
              >
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

const createStyles = () =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
    },
    badge: {
      position: "absolute",
      top: -2,
      right: -2,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      paddingHorizontal: 5,
      alignItems: "center",
      justifyContent: "center",
    },
    left: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    textGroup: {
      gap: 1,
    },
  });
