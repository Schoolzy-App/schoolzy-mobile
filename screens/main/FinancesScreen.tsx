import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import FilterChips from "@/components/FilterChips";
import {
  FeesSummaryCard,
  FinanceSectionTitle,
  HistoryMonths,
  IgAccountList,
  InstallmentList,
  WalletCard,
} from "@/components/finance/FinanceSections";
import { QueryState, ScreenTemplate, Text } from "@/components/ui";
import { Palette, Radius, Spacing, Type } from "@/constants/tokens";
import { useTheme } from "@/contexts/ThemeContext";
import {
  useDuePayments,
  usePaymentHistory,
  useStudentFinancialSummary,
  useStyles,
  useWalletBalance,
} from "@/hooks";
import type { DueInstallmentCard, IgOutstandingRow } from "@/services/mappers";
import type {
  PaymentFeeKind,
  PaymentPrefill,
  RootStackScreenProps,
} from "@/navigation/types";
import type { PaymentHistoryKind } from "@/types/api";
import { formatCurrency } from "@/utils/format";

const FEE_TAB_LABELS: Record<PaymentFeeKind, string> = {
  school: "School fees",
  ig: "IG fees",
};

type HistoryFilter = "all" | "schoolFees" | "walletTopUp" | "other";

/** Chip → the history endpoint's `type`. */
const HISTORY_TYPE: Record<HistoryFilter, PaymentHistoryKind | undefined> = {
  all: undefined,
  schoolFees: 1,
  walletTopUp: 2,
  other: 3,
};

type Props = RootStackScreenProps<"Finances">;

export default function FinancesScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const { studentName, studentSeasonId } = route.params;
  const firstName = studentName.split(" ")[0];

  // `all` brings the paid installments too, so the list shows the whole year.
  const {
    data: due,
    isLoading: dueLoading,
    error: dueError,
    refetch: refetchDue,
  } = useDuePayments(studentSeasonId, true);

  // The wallet belongs to the student, so it lives here rather than on the
  // parent's Account screen.
  const { data: wallet, isLoading: walletLoading } =
    useWalletBalance(studentSeasonId);

  // Paid / total for the progress bar — the due list can't give the year's
  // total once installments are settled.
  const { data: summary } = useStudentFinancialSummary(studentSeasonId);

  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const {
    data: history,
    isLoading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePaymentHistory(studentSeasonId, HISTORY_TYPE[historyFilter]);

  const installments = due?.installments ?? [];
  const igAccounts = due?.ig ?? [];
  // Both sections empty means nothing was ever set up — distinct from a failed load.
  const nothingDue = !installments.length && !igAccounts.length;

  // ── School / IG ───────────────────────────────────────────────────────
  // Driven by what this student actually has, not by the category list.
  const [feeKind, setFeeKind] = useState<PaymentFeeKind | null>(null);

  const feeKinds = useMemo<PaymentFeeKind[]>(() => {
    const kinds: PaymentFeeKind[] = [];
    if (installments.length) kinds.push("school");
    if (igAccounts.length) kinds.push("ig");
    return kinds;
  }, [installments.length, igAccounts.length]);

  // Falls back to the first available stream, so the choice stays valid when
  // the data changes underneath it. Derived, so no effect and no extra render.
  const activeKind: PaymentFeeKind | null =
    feeKind && feeKinds.includes(feeKind) ? feeKind : (feeKinds[0] ?? null);

  const overdueValue = installments
    .filter((i) => i.status === "overdue")
    .reduce((sum, i) => sum + i.amountValue, 0);

  const progress =
    summary && summary.total > 0
      ? Math.min(1, Math.max(0, summary.paid / summary.total))
      : undefined;

  // ── Payment ───────────────────────────────────────────────────────────
  // Pay opens the payment screen, pre-filled with the item tapped.
  const openPayment = useCallback(
    (prefill?: PaymentPrefill) => {
      if (typeof studentSeasonId !== "number") return;
      navigation.navigate("PaymentDetails", {
        studentName,
        studentSeasonId,
        prefill,
      });
    },
    [navigation, studentName, studentSeasonId],
  );

  const handlePayInstallment = useCallback(
    (card: DueInstallmentCard) =>
      openPayment({
        kind: "school",
        label: card.title,
        amountValue: card.amountValue,
        dueDate: card.dueDate,
      }),
    [openPayment],
  );

  const handlePayIg = useCallback(
    (account: IgOutstandingRow) =>
      openPayment({
        kind: "ig",
        label: account.accountName,
        subjects: account.subjects,
        amountValue: account.amountValue,
      }),
    [openPayment],
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ── History chips ─────────────────────────────────────────────────────
  // "Other" (books, bus, …) only appears when there is something under it.
  const counts = history?.counts;
  const historyChips = useMemo(
    () => [
      { value: "all" as const, label: "All", count: counts?.all },
      {
        value: "schoolFees" as const,
        label: "School fees",
        count: counts?.schoolFees,
      },
      {
        value: "walletTopUp" as const,
        label: "Wallet",
        count: counts?.walletTopUp,
      },
      ...(counts?.other || historyFilter === "other"
        ? [{ value: "other" as const, label: "Other", count: counts?.other }]
        : []),
    ],
    [counts, historyFilter],
  );

  return (
    <ScreenTemplate
      scrollHeader
      headerStyle={styles.header}
      title={
        <Text style={Type.headerTitleModule} color={Palette.text.onBrand}>
          Finances for{" "}
          <Text
            style={[Type.headerTitleModule, Type.bold]}
            color={Palette.text.onBrand}
          >
            {firstName}
          </Text>
        </Text>
      }
    >
      <View style={styles.body}>
        {/* ── Wallet ───────────────────────────────────────────────── */}
        <WalletCard
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
          // A top-up is an online payment into the wallet top-up category;
          // it reaches the wallet once the school approves it.
          onTopUp={
            typeof studentSeasonId === "number"
              ? () =>
                  navigation.navigate("PaymentDetails", {
                    studentName,
                    studentSeasonId,
                    topUp: true,
                  })
              : undefined
          }
          onActivity={() => setHistoryFilter("walletTopUp")}
        />

        <QueryState
          isLoading={dueLoading}
          error={dueError}
          isEmpty={nothingDue}
          emptyMessage="No fees set up yet"
          onRetry={refetchDue}
        >
          <View style={styles.section}>
            {/* ── School / IG ──────────────────────────────────────── */}
            {feeKinds.length > 1 && activeKind ? (
              <FilterChips
                options={feeKinds.map((k) => ({
                  value: k,
                  label: FEE_TAB_LABELS[k],
                }))}
                value={activeKind}
                onChange={setFeeKind}
              />
            ) : null}

            {activeKind === "school" ? (
              <>
                <FeesSummaryCard
                  label="School fees outstanding"
                  outstanding={due?.schoolOutstanding ?? ""}
                  overdue={
                    overdueValue > 0
                      ? `${formatCurrency(overdueValue)} overdue`
                      : undefined
                  }
                  progress={progress}
                  paidLabel={
                    summary ? `Paid ${formatCurrency(summary.paid)}` : undefined
                  }
                  totalLabel={
                    summary
                      ? `Total ${formatCurrency(summary.total)}`
                      : undefined
                  }
                />
                <FinanceSectionTitle
                  title="Installments"
                  hint="Tap Pay to pay one"
                />
                <InstallmentList
                  items={installments}
                  onPay={handlePayInstallment}
                />
              </>
            ) : null}

            {activeKind === "ig" ? (
              <>
                {/* IG accounts carry no total or paid amount, so no bar. */}
                <FeesSummaryCard
                  label="IG fees outstanding"
                  outstanding={due?.igOutstanding ?? ""}
                />
                <FinanceSectionTitle
                  title="IG accounts"
                  hint="Tap Pay to pay one"
                />
                <IgAccountList items={igAccounts} onPay={handlePayIg} />
              </>
            ) : null}
          </View>
        </QueryState>

        {/* ── Payment History ──────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.historyTitle}>
            <Text style={Type.financeSection}>Payment History</Text>
          </View>
          <FilterChips
            size="sm"
            options={historyChips}
            value={historyFilter}
            onChange={setHistoryFilter}
          />
          <QueryState
            isLoading={historyLoading}
            error={historyError}
            isEmpty={!history?.months.length}
            emptyMessage="No payments recorded yet"
            onRetry={refetchHistory}
          >
            <HistoryMonths months={history?.months ?? []} />

            {hasNextPage ? (
              <Pressable
                style={styles.loadMore}
                onPress={handleLoadMore}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={Type.link} color={colors.primary}>
                    Load more
                  </Text>
                )}
              </Pressable>
            ) : null}
          </QueryState>
        </View>
      </View>
    </ScreenTemplate>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    header: {
      borderBottomLeftRadius: Radius.header,
      borderBottomRightRadius: Radius.header,
    },
    body: {
      width: "100%",
      paddingHorizontal: Spacing.screenX,
      paddingTop: Spacing.contentTop.modules,
      paddingBottom: Spacing.bottomInset.modulesScroll,
      gap: 15,
    },
    section: {
      width: "100%",
      gap: 15,
    },
    historyTitle: {
      paddingTop: 6,
    },
    loadMore: {
      alignSelf: "center",
      minWidth: 140,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: Palette.border.default,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
    },
  });
