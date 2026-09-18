import React, { useCallback, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";

import { AppConfig, type ColorPalette } from "@/apps";
import type { PaymentMethodData } from "@/components";
import { PaymentCard, PaymentMethodItem } from "@/components";
import {
  DefaultInput,
  QueryState,
  ScreenTemplate,
  SegmentedTabs,
  Text,
} from "@/components/ui";
import { FeatureFlags, Icons } from "@/constants";
import { useTheme } from "@/contexts/ThemeContext";
import {
  useIgAccountOptions,
  usePaymentCategories,
  useStyles,
  useWalletBalance,
  useWalletPayment,
} from "@/hooks";
import type {
  PaymentFeeKind,
  RootStackScreenProps,
} from "@/navigation/types";
import { ApiError } from "@/types/api";
import { formatCurrency } from "@/utils/format";
import {
  availableFeeKinds,
  categoriesForKind,
  soleCategoryId,
} from "@/utils/paymentSelection";

// ─── Payment Methods ────────────────────────────────────────────────────────
/** Every method the screen knows about, each gated by its own feature flag. */
const ALL_PAYMENT_METHODS: (PaymentMethodData & { enabled: boolean })[] = [
  {
    id: "apple",
    label: "Apple Pay",
    sublabel: "⚡ Instant payment",
    iconEmoji: Icons.ApplePay,
    enabled: FeatureFlags.paymentMethods.applePay,
  },
  {
    id: "instapay",
    label: "InstaPay",
    sublabel: "Transfer, then upload your receipt",
    iconEmoji: Icons.Instapay,
    enabled: FeatureFlags.paymentMethods.instapay,
  },
  {
    id: "wallet",
    label: AppConfig.name + " Wallet",
    // Replaced at render time with the live balance from /wallet/{id}/balance.
    sublabel: "⚡ Pay instantly from your wallet",
    iconEmoji: Icons.WalletIcon,
    enabled: FeatureFlags.paymentMethods.wallet,
  },
];

// Filtered once at module scope — the flags are build-time constants.
const PAYMENT_METHODS: PaymentMethodData[] = ALL_PAYMENT_METHODS.filter(
  (method) => method.enabled,
);

const FEE_TAB_LABELS: Record<PaymentFeeKind, string> = {
  school: "School Fees",
  ig: "IG Fees",
};

/** "EGP 4,000" / "4,000" → 4000. Returns 0 when nothing numeric is present. */
function parseAmount(value: string): number {
  const numeric = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

type Props = RootStackScreenProps<"PaymentDetails">;

export default function PaymentDetailsScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const { studentName, studentSeasonId, prefill } = route.params;

  // ── Form state ────────────────────────────────────────────────────────────
  // Empty means "not chosen explicitly"; the effective values below fall back
  // to what the tapped due item implies.
  const [feeKind, setFeeKind] = useState<PaymentFeeKind | null>(
    prefill?.kind ?? null,
  );
  const [categoryId, setCategoryId] = useState("");
  const [subjectAccountId, setSubjectAccountId] = useState("");
  const [amountText, setAmountText] = useState(() =>
    String(prefill?.amountValue || ""),
  );
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // ── Categories (§5) ───────────────────────────────────────────────────────
  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = usePaymentCategories();

  // Which fee streams the server actually offers, and the active one. Deriving
  // rather than syncing in an effect keeps this to a single render.
  const feeKinds = useMemo(() => availableFeeKinds(categories), [categories]);
  const activeKind: PaymentFeeKind | null =
    feeKind && feeKinds.includes(feeKind) ? feeKind : (feeKinds[0] ?? null);

  const tabs = useMemo(
    () => feeKinds.map((k) => ({ value: k, label: FEE_TAB_LABELS[k] })),
    [feeKinds],
  );

  /** Only the categories belonging to the active tab are selectable. */
  const kindCategories = useMemo(
    () => (activeKind ? categoriesForKind(categories, activeKind) : []),
    [categories, activeKind],
  );

  // A tab with exactly one category selects it; otherwise the parent picks.
  const effectiveCategoryId = categoryId || soleCategoryId(kindCategories);

  const selectedCategory = useMemo(
    () => kindCategories.find((c) => String(c.id) === effectiveCategoryId) ?? null,
    [kindCategories, effectiveCategoryId],
  );

  // Branch on the flag, never on the category name or id — the guide is
  // explicit that neither is a reliable signal.
  const needsSubjectAccount = !!selectedCategory?.requiresSubjectAccount;

  // ── IG accounts (§6) — only fetched when the category requires one ────────
  const {
    data: igAccounts,
    isLoading: igLoading,
    error: igError,
  } = useIgAccountOptions(studentSeasonId, needsSubjectAccount);

  const categoryOptions = useMemo(
    () => kindCategories.map((c) => ({ label: c.name, value: String(c.id) })),
    [kindCategories],
  );

  const igOptions = useMemo(
    () =>
      (igAccounts ?? []).map((a) => ({
        label: a.name,
        value: String(a.subjectAccountId),
      })),
    [igAccounts],
  );

  const effectiveSubjectAccountId = subjectAccountId;

  // ── Wallet (§7) ───────────────────────────────────────────────────────────
  const wallet = useWalletPayment(() => setShowSuccess(true));

  const { data: balance } = useWalletBalance(
    studentSeasonId,
    FeatureFlags.paymentMethods.wallet,
  );

  // ── Validation ────────────────────────────────────────────────────────────
  const amountValue = parseAmount(amountText);
  const subjectAccountValue = effectiveSubjectAccountId
    ? Number(effectiveSubjectAccountId)
    : null;

  const validationError = useMemo(() => {
    if (!activeKind) return "No payment categories are available.";
    if (!selectedCategory)
      return activeKind === "ig"
        ? "Select an IG fee category."
        : "Select a school fee category.";
    if (needsSubjectAccount && !subjectAccountValue)
      return "Subject account is required for IG payments.";
    if (amountValue <= 0) return "Payment amount must be greater than zero.";
    if (!selectedMethod) return "Select a payment method.";
    return null;
  }, [
    activeKind,
    selectedCategory,
    needsSubjectAccount,
    subjectAccountValue,
    amountValue,
    selectedMethod,
  ]);

  const canSubmit =
    !validationError && typeof studentSeasonId === "number" && !wallet.isPending;

  // Changing the category invalidates any account picked under the old one.
  const handleCategoryChange = useCallback((value: string) => {
    setCategoryId(value);
    setSubjectAccountId("");
  }, []);

  // Tabs scope the category list, so switching tab invalidates both choices.
  const handleFeeKindChange = useCallback((value: PaymentFeeKind) => {
    setFeeKind(value);
    setCategoryId("");
    setSubjectAccountId("");
  }, []);

  /**
   * Editing the form after a failed attempt makes it a different business
   * action, so the retained idempotency key must be dropped — reusing it could
   * return the previous attempt's stored response instead of paying the new
   * amount.
   */
  const startNewAttempt = wallet.startNewAttempt;
  const handleAmountChange = useCallback(
    (value: string) => {
      setAmountText(value);
      startNewAttempt();
    },
    [startNewAttempt],
  );

  const handleContinue = useCallback(() => {
    if (!canSubmit || typeof studentSeasonId !== "number" || !selectedCategory)
      return;

    if (selectedMethod === "wallet") {
      wallet.submit({
        studentSeasonId,
        categoryId: selectedCategory.id,
        subjectAccountId: needsSubjectAccount ? subjectAccountValue : null,
        amount: amountValue,
      });
      return;
    }

    // InstaPay and anything else online: the proof is collected on the next
    // screen, which owns the actual submission.
    navigation.navigate("ConfirmDeposit", {
      studentName,
      studentSeasonId,
      amountValue,
      categoryId: selectedCategory.id,
      subjectAccountId: needsSubjectAccount ? subjectAccountValue : null,
      categoryName: selectedCategory.name,
      payingFor: prefill?.label,
    });
  }, [
    canSubmit,
    studentSeasonId,
    selectedCategory,
    selectedMethod,
    needsSubjectAccount,
    subjectAccountValue,
    amountValue,
    wallet,
    navigation,
    studentName,
    prefill,
  ]);

  const handleDone = useCallback(() => {
    setShowSuccess(false);
    navigation.navigate("Finances", { studentName, studentSeasonId });
  }, [navigation, studentName, studentSeasonId]);

  const submitLabel = wallet.isPending
    ? "Processing…"
    : selectedMethod === "wallet"
      ? "Pay Now"
      : "Continue";

  return (
    <ScreenTemplate
      title="Payment Details"
      bottomContent={
        <Pressable
          style={[
            styles.cta,
            { backgroundColor: colors.primary },
            !canSubmit && styles.ctaDisabled,
          ]}
          onPress={handleContinue}
          disabled={!canSubmit}
        >
          <Text variant="label1" weight="bold" color={colors.buttonText}>
            {submitLabel}
          </Text>
        </Pressable>
      }
    >
      {/* ── What is being paid ────────────────────────────────────── */}
      <View style={styles.cardWrapper}>
        <PaymentCard
          id={prefill?.label ?? "new"}
          title={prefill?.label ?? "New payment"}
          amount={formatCurrency(prefill?.amountValue ?? amountValue)}
          subtitle={prefill?.subjects?.join(", ")}
          dueDate={prefill?.dueDate}
          fullWidth
        />
      </View>

      <QueryState
        isLoading={categoriesLoading}
        error={categoriesError}
        isEmpty={!categoryOptions.length}
        emptyMessage="No payment categories are available."
        onRetry={refetchCategories}
      >
        <View style={styles.form}>
          {/* School vs IG. The two streams have separate category lists, so
              this scopes everything below it. */}
          {tabs.length > 1 && activeKind ? (
            <SegmentedTabs
              tabs={tabs}
              value={activeKind}
              onChange={handleFeeKindChange}
            />
          ) : null}

          {/* z-index descends top-to-bottom so each open dropdown overlays
              whatever follows it */}
          <View style={styles.dropdownTop}>
            <DefaultInput
              label={activeKind === "ig" ? "IG Fee" : "School Fee"}
              value={effectiveCategoryId}
              onChange={handleCategoryChange}
              type="select"
              placeholder={
                activeKind === "ig"
                  ? "Select an IG fee"
                  : "Select a school fee"
              }
              options={categoryOptions}
            />
          </View>

          {/* Shown only when the chosen category requires it (§6) */}
          {needsSubjectAccount ? (
            <View style={styles.dropdownBottom}>
              <DefaultInput
                label="Subject Account"
                value={effectiveSubjectAccountId}
                onChange={setSubjectAccountId}
                type="select"
                placeholder={
                  igLoading ? "Loading accounts…" : "Select an account"
                }
                options={igOptions}
              />
              {igError ? (
                <Text
                  variant="caption1"
                  weight="regular"
                  color={colors.errorText}
                >
                  Couldn&apos;t load IG accounts. Go back and try again.
                </Text>
              ) : null}
              {!igLoading && !igError && !igOptions.length ? (
                <Text
                  variant="caption1"
                  weight="regular"
                  color={colors.textSecondary}
                >
                  No IG accounts are available for this student.
                </Text>
              ) : null}
            </View>
          ) : null}

          <DefaultInput
            label="Amount"
            value={amountText}
            onChange={handleAmountChange}
            placeholder="0"
            keyboardType="numeric"
            type="text"
            leftAdornment={
              <Text
                variant="label3"
                weight="medium"
                color={colors.textSecondary}
              >
                EGP
              </Text>
            }
          />
        </View>
      </QueryState>

      {/* ── Payment Method List ──────────────────────────────────── */}
      <View style={styles.methodList}>
        {PAYMENT_METHODS.length === 0 ? (
          <Text
            variant="label3"
            weight="regular"
            color={colors.textSecondary}
            style={styles.emptyMethods}
          >
            No payment methods are available right now. Please contact the
            school to arrange payment.
          </Text>
        ) : (
          PAYMENT_METHODS.map((method) => (
            <PaymentMethodItem
              key={method.id}
              {...method}
              // A negative balance is a valid state and is shown as returned.
              sublabel={
                method.id === "wallet" && balance
                  ? `Available balance: ${balance.label}`
                  : method.sublabel
              }
              selected={selectedMethod === method.id}
              onPress={() => setSelectedMethod(method.id)}
            />
          ))
        )}

        <PaymentFeedback wallet={wallet} validationError={validationError} />
      </View>

      {/* ── Wallet Success ───────────────────────────────────────── */}
      <Modal
        visible={showSuccess}
        transparent
        animationType="slide"
        onRequestClose={handleDone}
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
                Payment Complete
              </Text>
              <Text
                variant="label3"
                weight="regular"
                color={colors.textSecondary}
                style={styles.successSubtitle}
              >
                {formatCurrency(wallet.data?.amount ?? amountValue)} has been
                paid from your wallet.
              </Text>
            </View>
            <Pressable
              style={[styles.cta, { backgroundColor: colors.primary }]}
              onPress={handleDone}
            >
              <Text variant="label1" weight="bold" color={colors.buttonText}>
                Back to Finances
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenTemplate>
  );
}

/**
 * Error / retry surface for the wallet attempt.
 *
 * A 409 is deliberately NOT presented as a failure the user can re-submit: the
 * first request is still running, and starting another attempt would risk a
 * duplicate deduction.
 */
function PaymentFeedback({
  wallet,
  validationError,
}: {
  wallet: ReturnType<typeof useWalletPayment>;
  validationError: string | null;
}) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  if (wallet.isProcessing) {
    return (
      <Text variant="label3" weight="regular" color={colors.textSecondary}>
        This payment is still being processed. Please check your payment history
        in a moment — don&apos;t pay again.
      </Text>
    );
  }

  if (wallet.error) {
    const message =
      wallet.error instanceof ApiError
        ? wallet.error.message
        : "Something went wrong. Please try again.";

    return (
      <View style={styles.feedback}>
        <Text variant="label3" weight="regular" color={colors.errorText}>
          {message}
        </Text>
        {wallet.canRetry ? (
          <>
            <Text
              variant="caption1"
              weight="regular"
              color={colors.textSecondary}
            >
              We couldn&apos;t confirm whether this went through. Retrying is
              safe — it won&apos;t pay twice.
            </Text>
            <Pressable onPress={wallet.retry} hitSlop={8}>
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
    cardWrapper: {
      width: "100%",
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    form: {
      width: "100%",
      paddingHorizontal: 16,
      paddingTop: 20,
      gap: 16,
    },
    dropdownTop: {
      zIndex: 30,
    },
    dropdownBottom: {
      zIndex: 20,
      gap: 6,
    },
    emptyMethods: {
      textAlign: "center",
      paddingVertical: 24,
      paddingHorizontal: 8,
    },
    methodList: {
      width: "100%",
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 24,
      gap: 12,
    },
    feedback: {
      gap: 6,
    },
    cta: {
      borderRadius: 32,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    ctaDisabled: {
      opacity: 0.5,
    },

    // Modal
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
