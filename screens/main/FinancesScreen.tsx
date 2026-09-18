import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import type { ColorPalette } from "@/apps";
import { AccountWalletCard, PaymentCard, TimelineStepper } from "@/components";
import {
  QueryState,
  ScreenTemplate,
  SegmentedTabs,
  Text,
} from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import {
  useDuePayments,
  usePaymentHistory,
  useStyles,
  useWalletBalance,
} from "@/hooks";
import type { DueInstallmentCard, IgOutstandingRow } from "@/services/mappers";
import type {
  PaymentFeeKind,
  PaymentPrefill,
  RootStackScreenProps,
} from "@/navigation/types";

const FEE_TAB_LABELS: Record<PaymentFeeKind, string> = {
  school: "School Fees",
  ig: "IG Fees",
};

type Props = RootStackScreenProps<"Finances">;

export default function FinancesScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const { studentName, studentSeasonId } = route.params;
  const firstName = studentName.split(" ")[0];

  const {
    data: due,
    isLoading: dueLoading,
    error: dueError,
    refetch: refetchDue,
  } = useDuePayments(studentSeasonId);

  // The wallet belongs to the student, so it lives here rather than on the
  // parent's Account screen.
  const { data: wallet, isLoading: walletLoading } =
    useWalletBalance(studentSeasonId);

  const {
    data: history,
    isLoading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePaymentHistory(studentSeasonId);

  const installments = due?.installments ?? [];
  const igAccounts = due?.ig ?? [];
  // Both sections empty means nothing is owed — distinct from a failed load.
  const nothingDue = !installments.length && !igAccounts.length;

  // ── School / IG tabs ──────────────────────────────────────────────────
  // Driven by what this student actually owes, not by the category list —
  // Finances doesn't load categories, and a stream with nothing due has
  // nothing to show.
  const [feeKind, setFeeKind] = useState<PaymentFeeKind | null>(null);

  const feeKinds = useMemo<PaymentFeeKind[]>(() => {
    const kinds: PaymentFeeKind[] = [];
    if (installments.length) kinds.push("school");
    if (igAccounts.length) kinds.push("ig");
    return kinds;
  }, [installments.length, igAccounts.length]);

  const tabs = useMemo(
    () => feeKinds.map((k) => ({ value: k, label: FEE_TAB_LABELS[k] })),
    [feeKinds],
  );

  // Falls back to the first available stream, so the tab stays valid when the
  // data changes underneath it. Derived, so no effect and no extra render.
  const activeKind: PaymentFeeKind | null =
    feeKind && feeKinds.includes(feeKind) ? feeKind : (feeKinds[0] ?? null);

  const outstandingLabel =
    activeKind === "ig" ? due?.igOutstanding : due?.schoolOutstanding;

  // The payment screen picks its own category and amount, so it is reachable
  // even with nothing outstanding — tapping a due item just pre-fills it.
  const canPay = typeof studentSeasonId === "number";

  const openPayment = useCallback(
    (prefill?: PaymentPrefill) => {
      if (!canPay) return;
      navigation.navigate("PaymentDetails", {
        studentName,
        studentSeasonId,
        prefill,
      });
    },
    [canPay, navigation, studentName, studentSeasonId],
  );

  /** One stable callback for the whole strip, keyed by installment. */
  const handleSelectInstallment = useCallback(
    (card: DueInstallmentCard) =>
      openPayment({
        kind: "school",
        label: card.title,
        amountValue: card.amountValue,
        dueDate: card.dueDate,
      }),
    [openPayment],
  );

  const handleSelectIg = useCallback(
    (account: IgOutstandingRow) =>
      openPayment({
        kind: "ig",
        label: account.accountName,
        subjects: account.subjects,
        amountValue: account.amountValue,
      }),
    [openPayment],
  );

  /* Paired with the commented-out "Make a Payment" CTA below — restore both
     together to allow a payment when nothing is outstanding.
  const handleNewPayment = useCallback(() => openPayment(), [openPayment]);
  */

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Stable renderer — FlatList would otherwise re-render every card on any
  // state change in this screen.
  const renderInstallment = useCallback(
    ({ item }: { item: DueInstallmentCard }) => (
      <PaymentCard {...item} onPress={() => handleSelectInstallment(item)} />
    ),
    [handleSelectInstallment],
  );

  return (
    <ScreenTemplate
      title={
        <Text variant="label1" weight="medium" color={colors.buttonText}>
          Finances for{" "}
          <Text variant="label1" weight="bold" color={colors.buttonText}>
            {firstName}
          </Text>
        </Text>
      }
      /* Free-form payments are parked for now — every payment starts by
         tapping an outstanding item above, which pre-fills its stream and
         amount. Restore this to allow a payment with nothing due:

      bottomContent={
        <Pressable
          style={[
            styles.cta,
            { backgroundColor: colors.primary },
            !canPay && styles.ctaDisabled,
          ]}
          onPress={handleNewPayment}
          disabled={!canPay}
        >
          <Text variant="label1" weight="bold" color={colors.buttonText}>
            Make a Payment
          </Text>
        </Pressable>
      }
      */
    >
      {/* ── Wallet ───────────────────────────────────────────────── */}
      <View style={styles.walletSection}>
        <AccountWalletCard
          title={`${firstName}'s Wallet`}
          amount={wallet?.amountText ?? "0"}
          negative={wallet?.isNegative}
          note={
            walletLoading
              ? "Loading balance…"
              : wallet
                ? undefined
                : "Balance unavailable right now"
          }
          actionText="Top up"
          // ⚠️ There is no top-up endpoint: the wallet API exposes only the two
          // balance reads. Enable this the moment one exists.
          disabled
        />
      </View>

      <QueryState
        isLoading={dueLoading}
        error={dueError}
        isEmpty={nothingDue}
        emptyMessage="No outstanding payments"
        onRetry={refetchDue}
      >
        {/* ── School / IG tabs ────────────────────────────────────── */}
        {tabs.length > 1 && activeKind ? (
          <View style={styles.tabsWrapper}>
            <SegmentedTabs tabs={tabs} value={activeKind} onChange={setFeeKind} />
          </View>
        ) : null}

        {/* ── Outstanding for the active stream ───────────────────── */}
        <View style={styles.totalBlock}>
          <Text variant="label3" weight="regular" color={colors.textSecondary}>
            {activeKind === "ig" ? "IG fees outstanding" : "School fees outstanding"}
          </Text>
          <Text variant="h4" weight="bold">
            {outstandingLabel}
          </Text>
        </View>

        {/* ── School Fees ─────────────────────────────────────────── */}
        {activeKind === "school" ? (
          <View style={styles.cardsSection}>
            <Text
              variant="caption1"
              weight="regular"
              color={colors.textSecondary}
              style={styles.sectionTitle}
            >
              Tap an installment to pay it
            </Text>
            <FlatList
              data={installments}
              horizontal
              keyExtractor={keyExtractor}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardsList}
              renderItem={renderInstallment}
            />
          </View>
        ) : null}

        {/* ── IG Outstanding ──────────────────────────────────────── */}
        {activeKind === "ig" ? (
          <View style={styles.igSection}>
            <Text variant="caption1" weight="regular" color={colors.textSecondary}>
              Tap an account to pay it
            </Text>
            {igAccounts.map((account) => (
              <IgAccountRow
                key={account.id}
                account={account}
                onSelect={handleSelectIg}
              />
            ))}
          </View>
        ) : null}
      </QueryState>

      {/* ── Payment History ───────────────────────────────────────── */}
      <View style={styles.historySection}>
        <Text variant="label1" weight="semiBold" style={styles.historyTitle}>
          Payment History
        </Text>
        <QueryState
          isLoading={historyLoading}
          error={historyError}
          isEmpty={!history?.length}
          emptyMessage="No payments recorded yet"
          onRetry={refetchHistory}
        >
          <TimelineStepper items={history ?? []} />

          {hasNextPage ? (
            <Pressable
              style={[styles.loadMore, { borderColor: colors.border }]}
              onPress={handleLoadMore}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text variant="label3" weight="medium" color={colors.primary}>
                  Load more
                </Text>
              )}
            </Pressable>
          ) : null}
        </QueryState>
      </View>

    </ScreenTemplate>
  );
}

const keyExtractor = (item: DueInstallmentCard) => item.id;

/**
 * An IG account with a balance. Unlike a school-fee installment it has no due
 * date — the subjects it covers are what identifies it to a parent.
 */
function IgAccountRow({
  account,
  onSelect,
}: {
  account: IgOutstandingRow;
  onSelect: (account: IgOutstandingRow) => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  return (
    <Pressable style={styles.igRow} onPress={() => onSelect(account)}>
      <View style={styles.igInfo}>
        <Text variant="label2" weight="medium" numberOfLines={1}>
          {account.accountName}
        </Text>
        {account.subjectsLabel ? (
          <Text
            variant="caption1"
            weight="regular"
            color={colors.textSecondary}
            numberOfLines={2}
          >
            {account.subjectsLabel}
          </Text>
        ) : null}
      </View>
      <Text variant="label2" weight="bold">
        {account.amount}
      </Text>
    </Pressable>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    walletSection: {
      width: "100%",
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    tabsWrapper: {
      width: "100%",
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    totalBlock: {
      width: "100%",
      paddingHorizontal: 16,
      paddingTop: 16,
      gap: 2,
    },
    cardsSection: {
      width: "100%",
      paddingTop: 16,
      gap: 12,
    },
    sectionTitle: {
      paddingHorizontal: 16,
    },
    cardsList: {
      paddingHorizontal: 16,
      gap: 12,
    },
    igSection: {
      width: "100%",
      paddingHorizontal: 16,
      paddingTop: 20,
      gap: 12,
    },
    igRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
    },
    igInfo: {
      flex: 1,
      gap: 2,
    },
    historySection: {
      width: "100%",
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 24,
      gap: 12,
    },
    historyTitle: {
      marginBottom: 4,
    },
    loadMore: {
      alignSelf: "center",
      minWidth: 140,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 24,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
    },
    ctaDisabled: {
      opacity: 0.5,
    },
    cta: {
      borderRadius: 32,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
    },

  });
