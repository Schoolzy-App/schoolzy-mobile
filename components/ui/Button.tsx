import React, { memo } from "react";
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from "react-native";

import type { ColorPalette } from "@/apps";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks/useStyles";

import Text from "./Text";

export interface ButtonProps extends Omit<PressableProps, "style"> {
  text: string;
  onPress: () => void;
  buttonStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  isLoading?: boolean;
  variant?: "primary" | "secondary";
  // added to fix style prop conflict
  style?: StyleProp<ViewStyle>;
}

const Button = memo<ButtonProps>(
  ({
    buttonStyle,
    textStyle,
    disabled,
    isLoading,
    text,
    onPress,
    style,
    variant = "primary",
    ...props
  }) => {
    const { colors } = useTheme();
    const styles = useStyles(createStyles);

    return (
      <Pressable
        style={[
          styles.button,
          styles[variant],
          buttonStyle,
          style,
          disabled && styles.disabled,
        ]}
        disabled={disabled}
        onPress={onPress}
        {...props}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.buttonText} />
        ) : (
          <Text
            style={textStyle}
            variant="label2"
            color={
              variant === "primary" ? colors.buttonText : colors.textSecondary
            }
          >
            {text}
          </Text>
        )}
      </Pressable>
    );
  },
);

Button.displayName = "Button";
export default Button;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    button: {
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 52,
      padding: 16,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
      width: "100%",
    },
    primary: {
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
    },
    secondary: {
      borderWidth: 1.5,
      borderColor: colors.textSecondary,
      shadowColor: colors.textSecondary,
      shadowOpacity: 0,
      elevation: 0,
    },
    disabled: {
      backgroundColor: colors.disabled,
      shadowOpacity: 0,
      elevation: 0,
    },
  });
