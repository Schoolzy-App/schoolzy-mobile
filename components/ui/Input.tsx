import React, { memo, useEffect, useRef, useState } from "react";
import {
  Animated,
  I18nManager,
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";

import { ColorPalette } from "@/apps";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";

import Text from "./Text";

export type InputProps = TextInputProps & {
  renderRight?(): React.ReactNode;
  renderLeft?(): React.ReactNode;
  label?: string;
  validation?: RegExp;
  helperText?: string;
  containerStyle?: StyleProp<ViewStyle>;
  change?(value: string): void;
};

const Input = memo<InputProps>(
  ({
    renderRight,
    renderLeft,
    label,
    validation,
    helperText,
    containerStyle,
    change,
    ...props
  }) => {
    const { colors } = useTheme();
    const styles = useStyles(createStyles);
    const [isValid, setIsValid] = useState(true);
    const [value, setValue] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<TextInput>(null);

    // ─── Floating label animation ────────────────────────────────────────────
    const isFloating = isFocused || value.length > 0;
    const [floatAnim] = useState(() => new Animated.Value(0));

    useEffect(() => {
      Animated.timing(floatAnim, {
        toValue: isFloating ? 1 : 0,
        duration: 150,
        useNativeDriver: false,
      }).start();
    }, [isFloating, floatAnim]);

    const labelTop = floatAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [17, 5],
    });
    const labelFontSize = floatAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [15, 12],
    });
    const labelColor = floatAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [
        colors.placeholder,
        isFocused ? colors.secondary : colors.textSecondary,
      ],
    });

    // ─── Handlers ───────────────────────────────────────────────────────────
    const onChangeText = (text: string) => {
      setValue(text);
      if (!validation) return change?.(text);
      if (!validation.test(text) && validation.test(value)) change?.("");
      if (validation.test(text)) change?.(text);
    };

    const onFocus = () => setIsFocused(true);

    const onBlur = () => {
      setIsFocused(false);
      if (value && validation && !validation.test(value)) setIsValid(false);
    };

    // ─── Render ─────────────────────────────────────────────────────────────
    return (
      <View style={styles.container}>
        <Pressable
          onPress={() => inputRef.current?.focus()}
          style={[
            styles.inputContainer,
            containerStyle,
            isFocused && styles.focused,
            !isValid && styles.error,
          ]}
        >
          <View style={styles.row}>
            {renderLeft?.()}
            <View style={styles.inputWrapper}>
              {label && (
                <Animated.Text
                  style={[
                    styles.label,
                    {
                      top: labelTop,
                      fontSize: labelFontSize,
                      color: labelColor,
                      backgroundColor: isFloating
                        ? colors.surface
                        : "transparent",
                    },
                  ]}
                >
                  {label}
                </Animated.Text>
              )}
              <TextInput
                ref={inputRef}
                style={[styles.input, isFloating && styles.inputFloating]}
                placeholderTextColor="transparent"
                onFocus={onFocus}
                onBlur={onBlur}
                value={value}
                onChangeText={onChangeText}
                {...props}
              />
            </View>
            {renderRight?.()}
          </View>
        </Pressable>

        {!isValid && helperText && (
          <Text variant="caption1" style={styles.helper}>
            {helperText}
          </Text>
        )}
      </View>
    );
  },
);

Input.displayName = "Input";
export default Input;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: { gap: 4 },
    inputContainer: {
      height: 56,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderColor: colors.border,
      borderWidth: 1,
      paddingHorizontal: 16,
    },
    focused: {
      borderColor: colors.secondary,
    },
    error: {
      borderColor: colors.danger,
    },
    row: {
      flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
      height: "100%",
    },
    inputWrapper: {
      flex: 1,
      alignSelf: "stretch",
      justifyContent: "center",
    },
    label: {
      position: "absolute",
      left: 0,
      paddingHorizontal: 4,
      fontWeight: "400",
      zIndex: 1,
    },
    input: {
      color: colors.textPrimary,
      fontSize: 15,
      textAlignVertical: "center",
    },
    inputFloating: {
      paddingTop: 14,
      textAlignVertical: "top",
    },
    helper: {
      marginLeft: 4,
      color: colors.danger,
    },
  });
