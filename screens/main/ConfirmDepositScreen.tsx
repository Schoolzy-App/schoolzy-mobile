import React, { useCallback, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { ScreenshotUpload } from "@/components";
import type { PickedImage } from "@/components/ScreenshotUpload";
import { DefaultInput, ScreenTemplate, Text } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useOnlinePayment, useStyles } from "@/hooks";
import type { RootStackScreenProps } from "@/navigation/types";
import type { PaymentProofFile } from "@/services/api/payments";
import { ApiError } from "@/types/api";
import { formatCurrency } from "@/utils/format";

type Props = RootStackScreenProps<"ConfirmDeposit">;

/** "EGP 4,000" / "4,000" → 4000. */
function parseAmount(value: string): number {
  const numeric = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

/** Derives the multipart file part from a picked image. */
function toProofFile(image: PickedImage): PaymentProofFile {
  // The picker doesn't always report a name or type; both are required by the
  // multipart part, so fall back to the extension in the uri.
  const extension = image.uri.split(".").pop()?.toLowerCase();
  const type =
    image.mimeType ??
    (extension === "png" ? "image/png" : "image/jpeg");

  return {
    uri: image.uri,
    name: image.fileName ?? `payment-proof.${extension ?? "jpg"}`,
    type,
    size: image.size,
  };
}

export default function ConfirmDepositScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const {
    studentName,
    studentSeasonId,
    amountValue,
    categoryId,
    subjectAccountId,
    categoryName,
    payingFor,
  } = route.params;
  const firstName = studentName.split(" ")[0];

  const [pickedImage, setPickedImage] = useState<PickedImage | null>(null);
  const [payerName, setPayerName] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [amountText, setAmountText] = useState(() => String(amountValue || ""));

  const online = useOnlinePayment();
  const submittedAmount = parseAmount(amountText);

  const validationError = useMemo(() => {
    if (!pickedImage) return "Payment proof is required.";
    if (!payerName.trim()) return "Payer name is required.";
    if (!payerPhone.trim()) return "Payer phone number is required.";
    if (submittedAmount <= 0) return "Payment amount must be greater than zero.";
    return null;
  }, [pickedImage, payerName, payerPhone, submittedAmount]);

  const canSubmit =
    !validationError &&
    typeof studentSeasonId === "number" &&
    !online.isPending;

  /**
   * Any edit to the form makes this a different business action, so the
   * retained idempotency key is dropped — reusing it could return the previous
   * attempt's stored response instead of submitting the new data.
   */
  const startNewAttempt = online.startNewAttempt;
  const editField = useCallback(
    <T,>(setter: (value: T) => void) =>
      (value: T) => {
        setter(value);
        startNewAttempt();
      },
    [startNewAttempt],
  );

  const handleSubmit = useCallback(() => {
    if (!canSubmit || typeof studentSeasonId !== "number" || !pickedImage) return;

    online.submit({
      body: {
        studentSeasonId,
        categoryId,
        subjectAccountId: subjectAccountId ?? null,
        amount: submittedAmount,
        payerName: payerName.trim(),
        payerPhoneNumber: payerPhone.trim(),
      },
      files: [toProofFile(pickedImage)],
    });
  }, [
    canSubmit,
    studentSeasonId,
    pickedImage,
    online,
    categoryId,
    subjectAccountId,
    submittedAmount,
    payerName,
    payerPhone,
  ]);

  const handleBackToFinances = useCallback(() => {
    navigation.navigate("Finances", { studentName, studentSeasonId });
  }, [navigation, studentName, studentSeasonId]);

  return (
    <ScreenTemplate
      title="Confirm Deposit"
      bottomContent={
        <Pressable
          style={[
            styles.cta,
            { backgroundColor: colors.primary },
            !canSubmit && styles.ctaDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <Text variant="label1" weight="bold" color={colors.buttonText}>
            {online.isPending ? "Submitting…" : "Submit"}
          </Text>
        </Pressable>
      }
    >
      <View style={styles.container}>
        {payingFor || categoryName ? (
          <Text variant="label3" weight="regular" color={colors.textSecondary}>
            Paying {payingFor ?? categoryName}
            {payingFor && categoryName ? ` (${categoryName})` : ""} for{" "}
            {firstName}
          </Text>
        ) : null}

        {/* ── Payment proof (required) ──────────────────────────── */}
        <ScreenshotUpload
          image={pickedImage}
          onChange={editField(setPickedImage)}
          title="Add Deposit Screenshot"
          subtitle="Supported files: JPEG, PNG"
        />

        {/* ── Payer details — both required by the API ──────────── */}
        <DefaultInput
          label="Payer Name"
          value={payerName}
          onChange={editField(setPayerName)}
          placeholder="Name on the transfer"
          type="text"
        />

        <DefaultInput
          label="Payer Phone Number"
          value={payerPhone}
          onChange={editField(setPayerPhone)}
          placeholder="01012345678"
          keyboardType="phone-pad"
          type="text"
        />

        <DefaultInput
          label="Amount Deposited"
          value={amountText}
          onChange={editField(setAmountText)}
          placeholder="0"
          keyboardType="numeric"
          type="text"
          leftAdornment={
            <Text variant="label3" weight="medium" color={colors.textSecondary}>
              EGP
            </Text>
          }
        />

        <SubmitFeedback online={online} validationError={validationError} />
      </View>

      {/* ── Submission Success Modal ──────────────────────────────── */}
      <Modal
        visible={online.isSuccess}
        transparent
        animationType="slide"
        onRequestClose={handleBackToFinances}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <View style={styles.successContent}>
              <View
                style={[
                  styles.successCircle,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text variant="h3" weight="bold" color={colors.buttonText}>
                  ✓
                </Text>
              </View>
              <Text variant="h5" weight="bold" style={styles.successTitle}>
                Deposit Submitted
              </Text>
              {/* Deliberately not "Payment complete": the transaction starts as
                  Pending and still has to be approved by the school. */}
              <Text
                variant="label3"
                weight="regular"
                color={colors.textSecondary}
                style={styles.successSubtitle}
              >
                {formatCurrency(submittedAmount)} is pending review. The school
                will confirm it shortly — it won&apos;t appear in your payment
                history until then.
              </Text>
            </View>

            <Pressable
              style={[styles.cta, { backgroundColor: colors.primary }]}
              onPress={handleBackToFinances}
            >
              <Text variant="label1" weight="bold" color={colors.buttonText}>
                Back to Finances for {firstName}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenTemplate>
  );
}

/**
 * Error / retry surface. A 409 means the first submission is still running, so
 * it is shown as a wait rather than something to re-send.
 */
function SubmitFeedback({
  online,
  validationError,
}: {
  online: ReturnType<typeof useOnlinePayment>;
  validationError: string | null;
}) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  if (online.isProcessing) {
    return (
      <Text variant="label3" weight="regular" color={colors.textSecondary}>
        This deposit is still being submitted. Give it a moment before trying
        again — don&apos;t send it twice.
      </Text>
    );
  }

  if (online.error) {
    const message =
      online.error instanceof ApiError
        ? online.error.message
        : "Something went wrong. Please try again.";

    return (
      <View style={styles.feedback}>
        <Text variant="label3" weight="regular" color={colors.errorText}>
          {message}
        </Text>
        {online.canRetry ? (
          <>
            <Text
              variant="caption1"
              weight="regular"
              color={colors.textSecondary}
            >
              We couldn&apos;t confirm whether this was received. Retrying is
              safe — it won&apos;t submit twice.
            </Text>
            <Pressable onPress={online.retry} hitSlop={8}>
              <Text variant="label3" weight="semiBold" color={colors.primary}>
                Retry
              </Text>
            </Pressable>
          </>
        ) : null}
      </View>
    );
  }

  if (validationError) {
    return (
      <Text variant="caption1" weight="regular" color={colors.textSecondary}>
        {validationError}
      </Text>
    );
  }

  return null;
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      width: "100%",
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 24,
      gap: 20,
    },
    feedback: {
      gap: 6,
    },
    cta: {
      backgroundColor: colors.primary,
      borderRadius: 32,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    ctaDisabled: {
      opacity: 0.5,
    },

    // ── Success Modal ─────────────────────────────────────────
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 32,
      gap: 16,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center",
    },
    successContent: {
      alignItems: "center",
      paddingVertical: 24,
      gap: 12,
    },
    successCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 4,
      borderColor: colors.surface,
    },
    successTitle: {
      textAlign: "center",
      marginTop: 8,
    },
    successSubtitle: {
      textAlign: "center",
      paddingHorizontal: 12,
    },
  });
