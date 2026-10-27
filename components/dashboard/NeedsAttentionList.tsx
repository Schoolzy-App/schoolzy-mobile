import { MaterialIcons } from "@expo/vector-icons";
import React, { memo, useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { Text } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";
import type { AttentionItem, NeedsAttention } from "@/services/mappers";

export interface NeedsAttentionListProps {
  data?: NeedsAttention;
  onSelect?: (item: AttentionItem) => void;
}

const ICON: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  InstallmentOverdue: "error-outline",
  InstallmentDueToday: "event",
  WalletEmpty: "account-balance-wallet",
  MealNotOrdered: "restaurant",
};

/**
 * Actionable items for one student: overdue or due-today installments, an
 * empty wallet, an unordered meal.
 *
 * The empty state is deliberately two different messages. "All caught up" is
 * only true when every section actually loaded; when one failed and there is
 * nothing to show, saying all is well would be a claim the data doesn't
 * support — so it says the information is unavailable instead.
 */
const NeedsAttentionList = memo<NeedsAttentionListProps>(
  ({ data, onSelect }) => {
    const { colors } = useTheme();
    const styles = useStyles(createStyles);

    if (!data) return null;

    const { items, isPartial } = data;

    if (items.length === 0) {
      return (
        <View style={styles.emptyCard}>
          <MaterialIcons
            name={isPartial ? "cloud-off" : "check-circle"}
            size={20}
            color={isPartial ? colors.textSecondary : colors.success}
          />
          <Text variant="label3" weight="regular" color={colors.textSecondary}>
            {isPartial
              ? "Some information is unavailable right now."
              : "No attention needed."}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.list}>
        {items.map((item) => (
          <AttentionRow key={item.id} item={item} onSelect={onSelect} />
        ))}

        {/* Items present AND a failed section: what's shown is real but
            incomplete, so neither hide the cards nor imply completeness. */}
        {isPartial ? (
          <Text variant="caption1" weight="regular" color={colors.textSecondary}>
            Some information couldn&apos;t be loaded.
          </Text>
        ) : null}
      </View>
    );
  },
);
NeedsAttentionList.displayName = "NeedsAttentionList";
export default NeedsAttentionList;

const AttentionRow = memo<{
  item: AttentionItem;
  onSelect?: (item: AttentionItem) => void;
}>(({ item, onSelect }) => {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  const accent = item.severity === "danger" ? colors.danger : colors.warning;
  const handlePress = useCallback(() => onSelect?.(item), [onSelect, item]);

  return (
    <Pressable
      style={[styles.row, { borderLeftColor: accent }]}
      onPress={handlePress}
      disabled={!onSelect}
    >
      <View style={[styles.iconBg, { backgroundColor: accent + "18" }]}>
        <MaterialIcons
          name={ICON[item.type] ?? "info-outline"}
          size={20}
          color={accent}
        />
      </View>

      <View style={styles.texts}>
        <Text variant="label3" weight="semiBold" numberOfLines={1}>
          {item.title}
        </Text>
        {item.subtitle ? (
          <Text
            variant="caption1"
            weight="regular"
            color={colors.textSecondary}
            numberOfLines={2}
          >
            {item.subtitle}
          </Text>
        ) : null}
      </View>

      {onSelect ? (
        <View style={[styles.cta, { backgroundColor: accent }]}>
          <Text variant="caption1" weight="semiBold" color={colors.buttonText}>
            {item.cta}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
});
AttentionRow.displayName = "AttentionRow";

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    list: {
      width: "100%",
      gap: 10,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      // A colour-coded spine so overdue reads as more urgent at a glance.
      borderLeftWidth: 4,
      backgroundColor: colors.surface,
    },
    iconBg: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
    },
    texts: {
      flex: 1,
      gap: 2,
    },
    cta: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 16,
    },
    emptyCard: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 14,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
  });
