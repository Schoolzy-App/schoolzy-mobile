import { CheckCircleIcon, InfoIcon } from "phosphor-react-native";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";

import { Text } from "@/components/ui";
import { Palette, Radius } from "@/constants/tokens";

export interface ToastMessage {
  text: string;
  kind?: "success" | "info";
}

/**
 * Dark toast over the screen (Relative Setting §6): left/right 20, bottom
 * 100, gone after 2 s. Render it as a sibling of the screen's scroll view,
 * inside a `flex: 1` wrapper, and clear it with `onHide`.
 */
export function Toast({
  message,
  onHide,
  duration = 2000,
}: {
  message: ToastMessage | null;
  onHide: () => void;
  duration?: number;
}) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onHide, duration);
    return () => clearTimeout(timer);
  }, [message, onHide, duration]);

  if (!message) return null;
  return (
    <View style={styles.toast} pointerEvents="none">
      {message.kind === "info" ? (
        <InfoIcon weight="bold" size={18} color={Palette.text.onBrand} />
      ) : (
        <CheckCircleIcon weight="fill" size={18} color={Palette.feedback.success} />
      )}
      <Text style={styles.text} color={Palette.text.onBrand}>
        {message.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.input,
    backgroundColor: Palette.text.primary,
  },
  text: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
  },
});
