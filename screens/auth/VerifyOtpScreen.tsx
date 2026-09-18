import React, { useCallback, useState } from "react";
import { Pressable } from "react-native";

import { Button, Input, Text } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import type { AuthStackScreenProps } from "@/navigation/types";
import { authApi } from "@/services/api";
import { ApiError } from "@/types/api";

import AuthFormLayout from "./AuthFormLayout";

type Props = AuthStackScreenProps<"VerifyOtp">;

/** Step 2 of 3 — POST /api/v1/auth/otp/verify */
export default function VerifyOtpScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { email } = route.params;

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = useCallback(async () => {
    const trimmed = code.trim();
    if (!trimmed || isVerifying) return;

    setError(null);
    setNotice(null);
    setIsVerifying(true);
    try {
      // Returns the reset token; see the tolerance note in `authApi.verifyOtp`.
      const resetToken = await authApi.verifyOtp({ email, code: trimmed });
      if (!resetToken) {
        setError("That code didn't work. Please request a new one.");
        return;
      }
      navigation.navigate("ResetPassword", { email, resetToken });
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "Couldn't verify the code. Please try again.",
      );
    } finally {
      setIsVerifying(false);
    }
  }, [code, email, isVerifying, navigation]);

  const handleResend = useCallback(async () => {
    if (isResending) return;
    setError(null);
    setNotice(null);
    setIsResending(true);
    try {
      await authApi.sendOtp({ email });
      setNotice("A new code is on its way.");
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "Couldn't resend the code. Please try again.",
      );
    } finally {
      setIsResending(false);
    }
  }, [email, isResending]);

  return (
    <AuthFormLayout
      title="Check your email"
      subtitle={`Enter the verification code we sent to ${email}.`}
      onBack={navigation.goBack}
    >
      <Input
        label="Verification Code"
        placeholder="123456"
        keyboardType="number-pad"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        maxLength={10}
        change={setCode}
        onSubmitEditing={handleVerify}
      />

      {error ? (
        <Text variant="label3" weight="regular" color={colors.errorText}>
          {error}
        </Text>
      ) : null}
      {notice ? (
        <Text variant="label3" weight="regular" color={colors.textSecondary}>
          {notice}
        </Text>
      ) : null}

      <Button
        text="Verify"
        onPress={handleVerify}
        isLoading={isVerifying}
        disabled={!code.trim() || isVerifying}
      />

      <Pressable onPress={handleResend} disabled={isResending} hitSlop={8}>
        <Text variant="label2" weight="medium" color={colors.primary}>
          {isResending ? "Sending…" : "Resend code"}
        </Text>
      </Pressable>
    </AuthFormLayout>
  );
}
