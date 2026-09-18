import React, { useCallback, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";

import { Button, PasswordInput, ScreenTemplate, Text } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";
import { authApi } from "@/services/api";
import { ApiError } from "@/types/api";
import type { RootStackScreenProps } from "@/navigation/types";

type Props = RootStackScreenProps<"ChangePassword">;

export default function ChangePasswordScreen({ navigation }: Props) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** POST /api/v1/auth/change-password */
  const handleChangePassword = useCallback(async () => {
    if (isSubmitting) return;

    if (!currentPassword || !password) {
      setError("Please fill in every field.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The two passwords don't match.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword: password });
      Alert.alert("Password changed", "Your password has been updated.");
      navigation.goBack();
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "Could not change the password. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    currentPassword,
    password,
    confirmPassword,
    navigation,
  ]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScreenTemplate
        title="Change Password"
        bottomContent={
          <Button
            text="Change Password"
            onPress={handleChangePassword}
            isLoading={isSubmitting}
          />
        }
      >
        <View style={styles.container}>
          <View style={styles.heading}>
            <Text variant="h5" weight="bold">
              Enter Your New Password
            </Text>
            <Text
              variant="body3"
              weight="regular"
              color={colors.textSecondary}
              style={styles.subtitle}
            >
              Password should be no longer than 8 characters, upper and lower
              case letters
            </Text>
          </View>

          <View style={styles.form}>
            <PasswordInput
              label="Current Password"
              placeholder="Enter current password"
              onSubmit={setCurrentPassword}
            />
            <PasswordInput
              label="New Password"
              placeholder="Enter new password"
              onSubmit={setPassword}
            />
            <PasswordInput
              label="Confirm Password"
              placeholder="Confirm new password"
              onSubmit={setConfirmPassword}
            />

            {error ? (
              <Text variant="label3" weight="regular" color={colors.errorText}>
                {error}
              </Text>
            ) : null}
          </View>
        </View>
      </ScreenTemplate>
    </KeyboardAvoidingView>
  );
}

const createStyles = () =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    container: {
      width: "100%",
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 24,
      gap: 32,
    },
    heading: {
      gap: 8,
    },
    subtitle: {
      lineHeight: 22,
    },
    form: {
      gap: 16,
    },
  });
