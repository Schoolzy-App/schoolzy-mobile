import React, { memo } from "react";
import { StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { Button, Card, IconContainer, Image, Text } from "@/components/ui";
import { Images } from "@/constants";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";

export interface AccountWalletCardProps {
  title: string;
  amount: string;
  actionText?: string;
  onActionPress?: () => void;
  /** When true, the action button is non-interactive and visually dimmed. */
  disabled?: boolean;
  /**
   * Renders the minus ahead of the currency ("-EGP 120") instead of between it
   * and the number, where it reads as part of the amount. A negative wallet is
   * a real state the API returns and must be shown as-is.
   */
  negative?: boolean;
  /** Small line under the amount, e.g. when the balance couldn't be loaded. */
  note?: string;
}

const AccountWalletCard = memo<AccountWalletCardProps>(
  ({
    title,
    amount,
    actionText = "Top up",
    onActionPress,
    disabled,
    negative,
    note,
  }) => {
    const styles = useStyles(createStyles);
    const { colors } = useTheme();

    return (
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.content}>
            <Text
              variant="label2"
              weight="medium"
              color={colors.textPrimaryInverted}
            >
              {title}
            </Text>
            <View style={styles.amountRow}>
              <Text
                variant="label1"
                weight="medium"
                color={colors.textPrimaryInverted}
                style={styles.egp}
              >
                {negative ? "-EGP" : "EGP"}
              </Text>
              <Text
                variant="h3"
                weight="bold"
                color={colors.textPrimaryInverted}
              >
                {amount}
              </Text>
            </View>
            {note ? (
              <Text
                variant="caption1"
                weight="regular"
                color={colors.textPrimaryInverted}
                style={styles.note}
              >
                {note}
              </Text>
            ) : null}
          </View>
          <IconContainer color={colors.surface} size={70}>
            <Image
              source={Images.logo}
              style={styles.logo}
              resizeMode="contain"
            />
          </IconContainer>
        </View>

        <Button
          text={actionText}
          onPress={onActionPress ?? (() => {})}
          disabled={disabled}
          buttonStyle={[styles.actionButton, disabled && styles.actionDisabled]}
          textStyle={styles.actionText}
        />
      </Card>
    );
  },
);

AccountWalletCard.displayName = "AccountWalletCard";
export default AccountWalletCard;

const createStyles = (_colors: ColorPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: _colors.primary,
      gap: 20,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    content: {
      gap: 10,
    },
    amountRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 4,
    },
    logo: {
      width: 54,
      height: 54,
    },
    actionButton: {
      backgroundColor: "rgba(255,255,255,0.12)",
      shadowOpacity: 0,
      elevation: 0,
      paddingVertical: 14,
    },
    actionDisabled: {
      // Keep the same translucent white tone but make it visibly dimmer
      backgroundColor: "rgba(255,255,255,0.06)",
      opacity: 0.6,
    },
    actionText: {
      color: "#FFFFFF",
    },
    egp: { marginBottom: 6 },
    note: { opacity: 0.75 },
  });
