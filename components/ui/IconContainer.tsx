import React, { memo } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import type { ColorPalette } from "@/apps";
import { useStyles } from "@/hooks";

interface IconContainerProps {
  children: React.ReactNode;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

const IconContainer = memo<IconContainerProps>(
  ({ children, size = 40, color, style }) => {
    const styles = useStyles(createStyles);

    return (
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            ...(color ? { backgroundColor: color } : {}),
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  },
);

IconContainer.displayName = "IconContainer";
export default IconContainer;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      justifyContent: "center",
      alignItems: "center",
    },
  });
