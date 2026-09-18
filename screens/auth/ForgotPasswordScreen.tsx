import React, { useCallback, useState } from "react";

import { Button, Input, Text } from "@/components/ui";
import { Icons } from "@/constants";
import { useTheme } from "@/contexts/ThemeContext";
import type { AuthStackScreenProps } from "@/navigation/types";
import { authApi } from "@/services/api";
import { ApiError } from "@/types/api";

import AuthFormLayout from "./AuthFormLayout";

const { MailInactive } = Icons;

type Props = AuthStackScreenProps<"ForgotPassword">;

/** Step 1 of 3 — POST /api/v1/auth/otp/send */
export default function ForgotPasswordScreen({ navigation }: Props) {
  const { colors } = useTheme();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleSend = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed || isSending) return;

    setError(null);
    setIsSending(true);
    try {
      await authApi.sendOtp({ email: trimmed });
      navigation.navigate("VerifyOtp", { email: trimmed });
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "Couldn't send the code. Please try again.",
      );
    } finally {
      setIsSending(false);
    }
  }, [email, isSending, navigation]);

  return (
    <AuthFormLayout
      title="Forgot your password?"
      subtitle="Enter your email address and we'll send you a verification code."
      onBack={navigation.goBack}
    >
      <Input
        label="Email Address"
        placeholder="Email Address"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        returnKeyType="send"
        change={setEmail}
        onSubmitEditing={handleSend}
        renderLeft={() => <MailInactive />}
      />

      {error ? (
        <Text variant="label3" weight="regular" color={colors.errorText}>
          {error}
        </Text>
      ) : null}

      <Button
        text="Send Code"
        onPress={handleSend}
        isLoading={isSending}
        disabled={!email.trim() || isSending}
      />
    </AuthFormLayout>
  );
}
