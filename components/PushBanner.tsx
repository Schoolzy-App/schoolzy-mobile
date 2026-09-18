import React, { memo, useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ColorPalette } from "@/apps";
import { Text } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";
import type { PushMessage } from "@/types/api";

interface PushBannerProps {
  message: PushMessage | null;
  onPress: (message: PushMessage) => void;
  onDismiss: () => void;
  /** How long the banner stays up before auto-dismissing. */
  durationMs?: number;
}

/**
 * In-app banner for notifications that arrive while the app is foregrounded —
 * FCM does not render a system notification in that state.
 */
const PushBanner = memo<PushBannerProps>(
  ({ message, onPress, onDismiss, durationMs = 5000 }) => {
    const { colors } = useTheme();
    const styles = useStyles(createStyles);
    const insets = useSafeAreaInsets();

    useEffect(() => {
      if (!message) return;
      const timer = setTimeout(onDismiss, durationMs);
      return () => clearTimeout(timer);
    }, [message, durationMs, onDismiss]);

    if (!message) return null;

    return (
      <View
        style={[styles.wrapper, { paddingTop: Math.max(insets.top, 12) }]}
        pointerEvents="box-none"
      >
        <Pressable
          style={styles.banner}
          onPress={() => {
            onDismiss();
            onPress(message);
          }}
        >
          <View style={styles.texts}>
            {message.title ? (
              <Text variant="label2" weight="semiBold" numberOfLines={1}>
                {message.title}
              </Text>
            ) : null}
            {message.body ? (
              <Text
                variant="label3"
                weight="regular"
                color={colors.textSecondary}
                numberOfLines={2}
              >
                {message.body}
              </Text>
            ) : null}
          </View>

          <Pressable onPress={onDismiss} hitSlop={12}>
            <Text variant="label2" weight="bold" color={colors.textSecondary}>
              ✕
            </Text>
          </Pressable>
        </Pressable>
      </View>
    );
  },
);

PushBanner.displayName = "PushBanner";
export default PushBanner;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    wrapper: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 12,
      zIndex: 1000,
    },
    banner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      // Subtle lift so it reads as an overlay on any screen.
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    texts: {
      flex: 1,
      gap: 2,
    },
  });
