import * as LocalAuthentication from "expo-local-authentication";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  ImageStyle,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { AppConfig, type ColorPalette } from "@/apps";
import { Button, Input, PasswordInput, Text } from "@/components/ui";
import { Icons, Images } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";
import { ApiError } from "@/types/api";
import type { AuthStackScreenProps } from "@/navigation/types";

const { MailInactive } = Icons;

type Props = AuthStackScreenProps<"Login">;

export default function LoginScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { login, isLoggingIn, hasStoredSession, resumeSession } = useAuth();
  const styles = useStyles(createStyles);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<
    "faceid" | "fingerprint" | null
  >(null);

  // ─── Check biometric support on mount ───────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [compatible, enrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);
      if (cancelled || !compatible || !enrolled) return;

      setBiometricAvailable(true);
      const types =
        await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (cancelled) return;

      if (
        types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
      ) {
        setBiometricType("faceid");
      } else if (
        types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
      ) {
        setBiometricType("fingerprint");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleForgotPassword = useCallback(
    () => navigation.navigate("ForgotPassword"),
    [navigation],
  );

  // ─── Password login ─────────────────────────────────────────────────────────
  const handleLogin = useCallback(async () => {
    if (!email || !password || isLoggingIn) return;
    setError(null);
    try {
      await login(email, password);
      // On success the root navigator swaps to the main stack automatically.
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "Unable to sign in. Please try again.",
      );
    }
  }, [email, password, isLoggingIn, login]);

  /**
   * Biometric sign-in resumes the stored session via the refresh token — the
   * password is never written to the device.
   */
  const handleBiometricLogin = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Authenticate to sign in",
      fallbackLabel: "Use password",
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });
    if (!result.success) return;

    const resumed = await resumeSession();
    if (!resumed) {
      Alert.alert(
        "Session expired",
        "Please sign in with your email and password.",
      );
    }
  }, [resumeSession]);

  const biometricLabel = biometricType === "faceid" ? "Face ID" : "Fingerprint";
  const canSubmit = !!email && !!password && !isLoggingIn;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.center}>
        {/* ── Logo ─────────────────────────────────────────────────── */}
        <Image
          source={Images.loginLogo}
          style={styles.logo as ImageStyle}
          resizeMode="contain"
        />

        {/* ── Title & Subtitle ─────────────────────────────────────── */}
        <Text variant="h6" weight="medium" style={styles.title}>
          Welcome to {AppConfig.name} Schools
        </Text>
        <Text
          variant="body3"
          weight="regular"
          color={colors.textSecondary}
          style={styles.subtitle}
        >
          Here you&apos;ll easily track your child&apos;s finances, meals,
          schedules, and more..
        </Text>

        {/* ── Form ─────────────────────────────────────────────────── */}
        <View style={styles.form}>
          <Input
            label="Email Address"
            placeholder="Email Address"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="next"
            change={setEmail}
            renderLeft={() => <MailInactive />}
          />

          <PasswordInput
            label="Password"
            placeholder="Password"
            onSubmit={setPassword}
          />

          {error ? (
            <Text variant="label3" weight="regular" color={colors.errorText}>
              {error}
            </Text>
          ) : null}

          {/* Forget password */}
          <Pressable
            style={styles.forgotRow}
            disabled={isLoggingIn}
            onPress={handleForgotPassword}
            hitSlop={8}
          >
            <Text
              variant="label2"
              weight="regular"
              color={colors.textSecondary}
            >
              Forget password?
            </Text>
          </Pressable>

          {/* Login button */}
          <Button
            text="Log in"
            onPress={handleLogin}
            isLoading={isLoggingIn}
            disabled={!canSubmit}
            style={styles.loginButton}
          />

          {/* Biometric login — only when hardware is enrolled AND a stored
              session exists to resume. */}
          {biometricAvailable && hasStoredSession && (
            <Pressable
              style={styles.biometricButton}
              onPress={handleBiometricLogin}
              disabled={isLoggingIn}
            >
              <Text variant="label2" weight="regular" color={colors.primary}>
                Sign in with {biometricLabel}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
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
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      paddingVertical: 40,
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
    forgotRow: {
      alignSelf: "flex-end",
      marginTop: -4,
    },
    loginButton: {
      marginTop: 8,
    },
    biometricButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      height: 56,
      borderRadius: 52,
      borderWidth: 1.5,
      borderColor: colors.primary,
      backgroundColor: "transparent",
    },
  });
