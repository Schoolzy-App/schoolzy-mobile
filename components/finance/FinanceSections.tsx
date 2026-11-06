import {
  CalendarBlankIcon,
  CheckCircleIcon,
  ClockCounterClockwiseIcon,
  GraduationCapIcon,
  type Icon,
  PlusIcon,
  WalletIcon,
  WarningCircleIcon,
} from "phosphor-react-native";
import React, { memo } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { Text } from "@/components/ui";
import { Images } from "@/constants";
import { Opacity, Palette, Radius, Size, Type } from "@/constants/tokens";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";
import type {
  DueInstallmentCard,
  IgOutstandingRow,
  InstallmentStatus,
  PaymentHistoryMonth,
  PaymentHistoryRowKind,
} from "@/services/mappers";

/**
 * The Finances screen's sections (Design-Handoff/Documentation/Finance.md).
 * Grouped in one file because they are thin presentational pieces over the
 * same payloads.
 */

// ─── Wallet card (§3) ────────────────────────────────────────────────────────

// Outside useStyles, whose loose style type an <Image> won't accept.
const LOGO_IMAGE = { width: 40, height: 40 };

export interface WalletCardProps {
  title: string;
  /** Absolute value, no currency — the card renders "EGP" itself. */
  amount: string;
  negative?: boolean;
  /** Replaces the amount's meaning while loading or on failure. */
  note?: string;
  /** Unset disables Top up — there is no top-up endpoint yet. */
  onTopUp?: () => void;
  onActivity?: () => void;
}

export const WalletCard = memo<WalletCardProps>(
  ({ title, amount, negative, note, onTopUp, onActivity }) => {
    const { colors } = useTheme();
    const styles = useStyles(createStyles);

    return (
      <View style={[styles.wallet, { backgroundColor: colors.primary }]}>
        <View style={styles.walletTop}>
          <View style={styles.flex}>
            <Text style={[Type.rowLabel, styles.walletTitle]} color={Palette.text.onBrand} numberOfLines={1}>
              {title}
            </Text>
            <View style={styles.amountRow}>
              <Text style={styles.currency} color={Palette.text.onBrand}>
                {negative ? "−EGP" : "EGP"}
              </Text>
              <Text style={Type.walletAmount} color={Palette.text.onBrand} numberOfLines={1}>
                {amount}
              </Text>
            </View>
            {note ? (
              <Text style={Type.caption} color={Palette.text.onBrand}>
                {note}
              </Text>
            ) : null}
          </View>
          <View style={styles.logo}>
            {/* The design's "BBS" text badge is a stand-in for the school logo. */}
            <Image source={Images.logo} style={LOGO_IMAGE} resizeMode="contain" />
          </View>
        </View>

        <View style={styles.walletButtons}>
          <Pressable
            onPress={onTopUp}
            disabled={!onTopUp}
            style={({ pressed }) => [
              styles.walletButton,
              styles.topUp,
              !onTopUp && styles.disabled,
              pressed && styles.topUpPressed,
            ]}
          >
            <PlusIcon weight="bold" size={16} color={colors.primary} />
            <Text style={Type.button} color={colors.primary}>
              Top up
            </Text>
          </Pressable>
          <Pressable
            onPress={onActivity}
            style={({ pressed }) => [
              styles.walletButton,
              styles.activity,
              pressed && styles.activityPressed,
            ]}
          >
            <ClockCounterClockwiseIcon weight="bold" size={16} color={Palette.text.onBrand} />
            <Text style={Type.button} color={Palette.text.onBrand}>
              Activity
            </Text>
          </Pressable>
        </View>
      </View>
    );
  },
);
WalletCard.displayName = "WalletCard";

// ─── Fees summary card (§4) ──────────────────────────────────────────────────

export interface FeesSummaryCardProps {
  label: string;
  outstanding: string;
  /** "EGP 70,560 overdue"; the pill hides when unset. */
  overdue?: string;
  /** 0–1 share paid. The bar and footer hide when unset (IG has no total). */
  progress?: number;
  paidLabel?: string;
  totalLabel?: string;
}

export const FeesSummaryCard = memo<FeesSummaryCardProps>(
  ({ label, outstanding, overdue, progress, paidLabel, totalLabel }) => {
    const styles = useStyles(createStyles);

    return (
      <View style={styles.feesCard}>
        <View style={styles.feesTop}>
          <View style={styles.flex}>
            <Text style={Type.meta} color={Palette.text.secondary}>
              {label}
            </Text>
            <Text style={Type.amountLarge} numberOfLines={1}>
              {outstanding}
            </Text>
          </View>
          {overdue ? (
            <View style={styles.overduePill}>
              <Text style={Type.statusChipText} color={Palette.status.danger.fg} numberOfLines={1}>
                {overdue}
              </Text>
            </View>
          ) : null}
        </View>

        {progress !== undefined ? (
          <>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
            <View style={styles.feesFooter}>
              <Text style={Type.caption} color={Palette.text.tertiary}>
                {paidLabel}
              </Text>
              <Text style={Type.caption} color={Palette.text.tertiary}>
                {totalLabel}
              </Text>
            </View>
          </>
        ) : null}
      </View>
    );
  },
);
FeesSummaryCard.displayName = "FeesSummaryCard";

// ─── Section title (§5, §6) ──────────────────────────────────────────────────

export function FinanceSectionTitle({ title, hint }: { title: string; hint?: string }) {
  const styles = useStyles(createStyles);
  return (
    <View style={styles.sectionTitle}>
      <Text style={Type.financeSection}>{title}</Text>
      {hint ? (
        <Text style={Type.caption} color={Palette.text.tertiary}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

// ─── Installments (§5) ───────────────────────────────────────────────────────

const STATUS_STYLE: Record<
  InstallmentStatus,
  { Icon: Icon; color: string; subColor: string }
> = {
  paid: {
    Icon: CheckCircleIcon,
    color: Palette.status.successStrong.solid,
    subColor: Palette.text.tertiary,
  },
  overdue: {
    Icon: WarningCircleIcon,
    color: Palette.status.danger.solid,
    subColor: Palette.status.danger.fg,
  },
  // Not in the build; the spec recommends the Upcoming tile with warning text.
  dueToday: {
    Icon: CalendarBlankIcon,
    color: Palette.module.agenda.solid,
    subColor: Palette.status.warning.fg,
  },
  upcoming: {
    Icon: CalendarBlankIcon,
    color: Palette.module.agenda.solid,
    subColor: Palette.text.tertiary,
  },
};

function installmentSub(item: DueInstallmentCard): string {
  // `dueDate` arrives as "Due 01/05/2026".
  const due = item.dueDate ?? "";
  switch (item.status) {
    case "paid":
      // The API has no paid date, so a paid row keeps its due date.
      return due ? `Paid · ${due.toLowerCase()}` : "Paid";
    case "overdue":
      return due ? `Overdue · ${due.toLowerCase()}` : "Overdue";
    case "dueToday":
      return "Due today";
    default:
      return due;
  }
}

export interface InstallmentListProps {
  items: DueInstallmentCard[];
  onPay: (item: DueInstallmentCard) => void;
}

export const InstallmentList = memo<InstallmentListProps>(({ items, onPay }) => {
  const styles = useStyles(createStyles);

  return (
    <View style={styles.listCard}>
      {items.map((item, index) => {
        const { Icon, color, subColor } = STATUS_STYLE[item.status];
        const paid = item.status === "paid";
        return (
          <View key={item.id} style={[styles.row, index > 0 && styles.divided]}>
            <View style={[styles.statusTile, { backgroundColor: `${color}1A` }]}>
              <Icon weight="fill" size={20} color={color} />
            </View>
            <View style={styles.flex}>
              <Text style={Type.cardHeading} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={Type.caption} color={subColor} numberOfLines={1}>
                {installmentSub(item)}
              </Text>
              {/* Partly paid and still open: what's left is the amount shown. */}
              {!paid && item.paidLabel ? (
                <Text style={Type.caption} color={Palette.text.tertiary} numberOfLines={1}>
                  {item.paidLabel}
                </Text>
              ) : null}
            </View>
            <View style={styles.rowEnd}>
              <Text style={Type.amount} numberOfLines={1}>
                {paid ? item.fullAmount : item.amount}
              </Text>
              {paid ? <PaidPill /> : <PayButton onPress={() => onPay(item)} />}
            </View>
          </View>
        );
      })}
    </View>
  );
});
InstallmentList.displayName = "InstallmentList";

// ─── IG accounts ─────────────────────────────────────────────────────────────

export interface IgAccountListProps {
  items: IgOutstandingRow[];
  onPay: (item: IgOutstandingRow) => void;
}

/**
 * IG accounts, laid out like installment rows. An account has no due date or
 * status — the subjects it covers are what identify it, so they are listed
 * in full under the name.
 */
export const IgAccountList = memo<IgAccountListProps>(({ items, onPay }) => {
  const styles = useStyles(createStyles);

  return (
    <View style={styles.listCard}>
      {items.map((item, index) => (
        <View key={item.id} style={[styles.row, styles.rowTop, index > 0 && styles.divided]}>
          <View style={[styles.statusTile, { backgroundColor: Palette.module.finance.tint }]}>
            <GraduationCapIcon weight="fill" size={20} color={Palette.module.finance.solid} />
          </View>
          <View style={styles.flex}>
            <Text style={Type.cardHeading} numberOfLines={1}>
              {item.accountName}
            </Text>
            <Text style={Type.caption} color={Palette.text.tertiary}>
              {item.subjects.length === 1 ? "1 subject" : `${item.subjects.length} subjects`}
            </Text>
            {item.subjects.length ? (
              <View style={styles.subjects}>
                {item.subjects.map((subject) => (
                  <Text key={subject} style={Type.caption} color={Palette.text.secondary}>
                    {subject}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
          <View style={styles.rowEnd}>
            <Text style={Type.amount} numberOfLines={1}>
              {item.amount}
            </Text>
            <PayButton onPress={() => onPay(item)} />
          </View>
        </View>
      ))}
    </View>
  );
});
IgAccountList.displayName = "IgAccountList";

function PayButton({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.pay,
        { backgroundColor: colors.primary },
        pressed && styles.pressed,
      ]}
    >
      <Text style={Type.buttonXSmall} color={Palette.text.onBrand}>
        Pay
      </Text>
    </Pressable>
  );
}

function PaidPill() {
  const styles = useStyles(createStyles);
  return (
    <View style={styles.paidPill}>
      <Text style={Type.pill} color={Palette.status.success.fg}>
        Paid
      </Text>
    </View>
  );
}

// ─── Payment history (§6) ────────────────────────────────────────────────────

const KIND_STYLE: Record<PaymentHistoryRowKind, { Icon: Icon; color: string }> = {
  schoolFees: { Icon: GraduationCapIcon, color: Palette.module.finance.solid },
  walletTopUp: { Icon: WalletIcon, color: Palette.module.meals.solid },
  other: { Icon: GraduationCapIcon, color: Palette.module.finance.solid },
};

export const HistoryMonths = memo<{ months: PaymentHistoryMonth[] }>(({ months }) => {
  const styles = useStyles(createStyles);

  return (
    <View style={styles.months}>
      {months.map((month) => (
        <View key={month.label} style={styles.month}>
          <Text style={[Type.groupLabel, styles.monthLabel]} color={Palette.text.tertiary}>
            {month.label}
          </Text>
          <View style={styles.listCard}>
            {month.rows.map((row, index) => {
              const { Icon, color } = KIND_STYLE[row.kind];
              return (
                <View key={row.id} style={[styles.row, index > 0 && styles.divided]}>
                  <View style={[styles.kindCircle, { backgroundColor: `${color}1A` }]}>
                    <Icon weight="fill" size={19} color={color} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={Type.cardHeading} numberOfLines={1}>
                      {row.title}
                    </Text>
                    <Text style={Type.caption} color={Palette.text.tertiary} numberOfLines={1}>
                      {row.subtitle}
                    </Text>
                    {/* Refunds and adjustments belong to this payment. */}
                    {row.adjustments.map((adj) => (
                      <Text key={adj.id} style={Type.caption} color={Palette.text.tertiary} numberOfLines={1}>
                        {adj.label} {adj.amount} · {adj.date}
                      </Text>
                    ))}
                  </View>
                  <Text style={Type.amount} color={Palette.status.success.fg} numberOfLines={1}>
                    {row.amount}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
});
HistoryMonths.displayName = "HistoryMonths";

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    pressed: {
      opacity: Opacity.pressed,
    },
    disabled: {
      opacity: Opacity.disabled,
    },

    // Wallet
    wallet: {
      width: "100%",
      borderRadius: Radius.financeCard,
      paddingTop: 18,
      paddingHorizontal: 18,
      paddingBottom: 16,
      gap: 16,
    },
    walletTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    walletTitle: {
      opacity: 0.85,
    },
    amountRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 6,
      marginTop: 6,
    },
    currency: {
      fontSize: 15,
      fontWeight: "400",
      lineHeight: 18,
    },
    logo: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: Palette.surface.card,
      alignItems: "center",
      justifyContent: "center",
    },
    walletButtons: {
      flexDirection: "row",
      gap: 10,
    },
    walletButton: {
      flex: 1,
      height: Size.walletButton,
      borderRadius: Radius.walletButton,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    topUp: {
      backgroundColor: Palette.surface.card,
    },
    topUpPressed: {
      opacity: 0.85,
    },
    activity: {
      borderWidth: 1.5,
      borderColor: Palette.border.onBrand,
    },
    activityPressed: {
      backgroundColor: "rgba(255,255,255,0.12)",
    },

    // Fees summary
    feesCard: {
      width: "100%",
      backgroundColor: colors.surface,
      borderRadius: Radius.financeCard,
      padding: 16,
      gap: 12,
    },
    feesTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    overduePill: {
      backgroundColor: Palette.status.danger.tint,
      borderRadius: Radius.pill,
      paddingHorizontal: 9,
      paddingVertical: 3,
    },
    track: {
      height: Size.progressBar,
      borderRadius: Radius.progress,
      backgroundColor: Palette.border.divider,
      overflow: "hidden",
    },
    fill: {
      height: "100%",
      borderRadius: Radius.progress,
      backgroundColor: Palette.status.successStrong.solid,
    },
    feesFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
    },

    // Section title
    sectionTitle: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      paddingTop: 2,
    },

    // Shared list card
    listCard: {
      width: "100%",
      backgroundColor: colors.surface,
      borderRadius: Radius.financeCard,
      paddingVertical: 4,
      paddingHorizontal: 16,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
    },
    rowTop: {
      alignItems: "flex-start",
    },
    divided: {
      borderTopWidth: 1,
      borderTopColor: Palette.border.divider,
    },
    statusTile: {
      width: Size.iconTile,
      height: Size.iconTile,
      borderRadius: Radius.iconTile,
      alignItems: "center",
      justifyContent: "center",
    },
    rowEnd: {
      alignItems: "flex-end",
      gap: 5,
    },
    subjects: {
      marginTop: 6,
      gap: 2,
    },
    pay: {
      height: Size.payButton.height,
      paddingHorizontal: Size.payButton.paddingX,
      borderRadius: Radius.payButton,
      alignItems: "center",
      justifyContent: "center",
    },
    paidPill: {
      backgroundColor: Palette.status.success.tint,
      borderRadius: Radius.pill,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },

    // History
    months: {
      gap: 8,
    },
    month: {
      gap: 8,
    },
    monthLabel: {
      paddingTop: 4,
      paddingHorizontal: 2,
    },
    kindCircle: {
      width: Size.iconCircle.finance,
      height: Size.iconCircle.finance,
      borderRadius: Size.iconCircle.finance / 2,
      alignItems: "center",
      justifyContent: "center",
    },
  });
