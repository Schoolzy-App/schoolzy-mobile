import React, { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";

import { Button, PasswordInput, Text } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import type { AuthStackScreenProps } from "@/navigation/types";
import { authApi } from "@/services/api";
import { ApiError } from "@/types/api";

import AuthFormLayout from "./AuthFormLayout";

type Props = AuthStackScreenProps<"ResetPassword">;

/** Matches the policy implied by the collection's "NewPass123!" example. */
const MIN_LENGTH = 8;

/** Step 3 of 3 — POST /api/v1/auth/reset-password */
export default function ResetPasswordScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { email, resetToken } = route.params;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Local checks only catch the obvious cases. The backend owns the real policy
   * and its message is shown verbatim when it rejects a password.
   */
  const validationError = useMemo(() => {
    if (!password) return null;
    if (password.length < MIN_LENGTH)
      return `Use at least ${MIN_LENGTH} characters.`;
    if (confirm && password !== confirm) return "Passwords don't match.";
    return null;
  }, [password, confirm]);

  const canSubmit =
    !!password && !!confirm && !validationError && !isSaving;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;

    setError(null);
    setIsSaving(true);
    try {
      await authApi.resetPassword({ email, resetToken, newPassword: password });
      Alert.alert(
        "Password updated",
        "You can now sign in with your new password.",
        // Collapse the recovery stack rather than leaving it behind the login
        // screen, so Back can't return to a spent reset token.
        [{ text: "OK", onPress: () => navigation.popToTop() }],
      );
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "Couldn't update your password. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }, [canSubmit, email, resetToken, password, navigation]);

  return (
    <AuthFormLayout
      title="Set a new password"
      subtitle="Choose a password you haven't used before."
      onBack={navigation.goBack}
    >
      <PasswordInput
        label="New Password"
        placeholder="New Password"
        onSubmit={setPassword}
      />

      <PasswordInput
        label="Confirm Password"
        placeholder="Confirm Password"
        onSubmit={setConfirm}
      />

      {validationError || error ? (
        <Text variant="label3" weight="regular" color={colors.errorText}>
          {error ?? validationError}
        </Text>
      ) : null}

      <Button
        text="Update Password"
        onPress={handleSubmit}
        isLoading={isSaving}
        disabled={!canSubmit}
      />
    </AuthFormLayout>
  );
}
