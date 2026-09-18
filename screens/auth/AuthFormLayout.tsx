import React from "react";
import {
  Image,
  ImageStyle,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import type { ColorPalette } from "@/apps";
import { Text } from "@/components/ui";
import { Images } from "@/constants";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";

interface AuthFormLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  /** Renders a back affordance; omitted on the first screen of a flow. */
  onBack?: () => void;
}

/**
 * Shared scaffold for the password-recovery screens: logo, heading and a
 * keyboard-aware scroll area. Matches LoginScreen so the flow doesn't visibly
 * change shape as the user moves through it.
 */
export default function AuthFormLayout({
  title,
  subtitle,
  children,
  onBack,
}: AuthFormLayoutProps) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.center}
        keyboardShouldPersistTaps="handled"
      >
        {onBack ? (
          <Pressable style={styles.backRow} onPress={onBack} hitSlop={8}>
            <Text variant="label2" weight="medium" color={colors.primary}>
              ← Back
            </Text>
          </Pressable>
        ) : null}

        <Image
          source={Images.loginLogo}
          style={styles.logo as ImageStyle}
          resizeMode="contain"
        />

        <Text variant="h6" weight="medium" style={styles.title}>
          {title}
        </Text>
        <Text
          variant="body3"
          weight="regular"
          color={colors.textSecondary}
          style={styles.subtitle}
        >
          {subtitle}
        </Text>

        <View style={styles.form}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor: colors.background,
    },
    center: {
      flexGrow: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      paddingVertical: 40,
    },
    backRow: {
      alignSelf: "flex-start",
      marginBottom: 12,
    },
    logo: {
      width: 100,
      height: 100,
      marginBottom: 24,
    } as ImageStyle,
    title: {
      textAlign: "center",
      marginBottom: 8,
    },
    subtitle: {
      textAlign: "center",
      marginBottom: 32,
    },
    form: {
      width: "100%",
      gap: 16,
    },
  });
