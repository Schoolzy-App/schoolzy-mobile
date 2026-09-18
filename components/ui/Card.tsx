import React, { memo } from "react";
import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";

import type { ColorPalette } from "@/apps";
import { useStyles } from "@/hooks";

export interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const Card = memo<CardProps>(({ children, style, ...props }) => {
  const styles = useStyles(createStyles);

  return (
    <Pressable style={[styles.card, style]} {...props}>
      {children}
    </Pressable>
  );
});

Card.displayName = "Card";
export default Card;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      width: "100%",
      borderRadius: 12,
      padding: 16,
      ...Platform.select({
        ios: {
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
        },
        android: {
          elevation: 3,
        },
      }),
    },
  });
