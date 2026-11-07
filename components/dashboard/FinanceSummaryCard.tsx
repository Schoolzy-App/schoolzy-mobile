import { CaretRightIcon, CurrencyCircleDollarIcon } from "phosphor-react-native";
import React, { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { Text } from "@/components/ui";
import {
  Opacity,
  Palette,
  Radius,
  Shadow,
  Size,
  Type,
} from "@/constants/tokens";
import { useStyles } from "@/hooks";
import { formatCurrency } from "@/utils/format";

export interface FinanceSummaryCardProps {
  /** From dashboard/financial-summary; the card hides until it loads. */
  outstanding?: number;
  overdue?: number;
  currency?: string | null;
  /** From wallet/{id}/balance; "—" while it loads or if it fails. */
  wallet?: number;
  onPress?: () => void;
}

/** The Student Dashboard's finance summary (spec §7), tappable → Finance. */
const FinanceSummaryCard = memo<FinanceSummaryCardProps>(
  ({ outstanding, overdue, currency, wallet, onPress }) => {
    const styles = useStyles(createStyles);
    const code = currency || "EGP";
    const walletEmpty = !wallet;

    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, Shadow.card, pressed && styles.pressed]}
      >
        <View style={styles.icon}>
          <CurrencyCircleDollarIcon
            weight="fill"
            size={18}
            color={Palette.module.finance.solid}
          />
        </View>

        <View style={[styles.column, styles.wide]}>
          <Text style={Type.statLabel} color={Palette.text.tertiary}>
            Outstanding
          </Text>
          <Text style={Type.cardHeading} numberOfLines={1}>
            {formatCurrency(outstanding ?? 0, code)}
          </Text>
          {overdue ? (
            <Text style={Type.statLabel} color={Palette.text.tertiary} numberOfLines={1}>
              {formatCurrency(overdue, code)} overdue
            </Text>
          ) : null}
        </View>

        <View style={styles.column}>
          <Text style={Type.statLabel} color={Palette.text.tertiary}>
            Wallet
          </Text>
          <Text
            style={Type.cardHeading}
            color={walletEmpty ? Palette.text.tertiary : Palette.text.primary}
            numberOfLines={1}
          >
            {wallet === undefined ? "—" : formatCurrency(wallet, code)}
          </Text>
        </View>

        <CaretRightIcon weight="bold" size={16} color={Palette.text.chevron} />
      </Pressable>
    );
  },
);

FinanceSummaryCard.displayName = "FinanceSummaryCard";
export default FinanceSummaryCard;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    card: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 15,
      borderRadius: Radius.card,
      backgroundColor: colors.surface,
    },
    pressed: {
      opacity: Opacity.pressedCard,
    },
    icon: {
      width: Size.iconCircle.sm,
      height: Size.iconCircle.sm,
      borderRadius: Size.iconCircle.sm / 2,
      backgroundColor: Palette.module.finance.tint,
      alignItems: "center",
      justifyContent: "center",
    },
    // The design splits the two figures 1.3 : 1.
    column: {
      flex: 1,
    },
    wide: {
      flex: 1.3,
    },
  });
