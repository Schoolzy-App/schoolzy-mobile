import { CloudSlashIcon } from "phosphor-react-native";
import React, { memo, useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { moduleStyle } from "@/components/home/moduleStyle";
import { Text } from "@/components/ui";
import {
  IconSize,
  Opacity,
  Palette,
  Radius,
  Shadow,
  Size,
  Type,
} from "@/constants/tokens";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";
import type { AttentionItem, NeedsAttention } from "@/services/mappers";

export interface NeedsAttentionListProps {
  data?: NeedsAttention;
  onSelect?: (item: AttentionItem) => void;
}

/**
 * The Student Dashboard's "Needs attention" card (spec §5): overdue or
 * due-today installments, an empty wallet, an unordered meal — a vertical
 * list, unlike the carousel on Home.
 *
 * The design hides the card when there is nothing to do, but only "nothing to
 * do" when every section actually loaded. When one failed and there is
 * nothing to show, saying all is well would be a claim the data doesn't
 * support — so that case still renders, saying the information is
 * unavailable.
 */
const NeedsAttentionList = memo<NeedsAttentionListProps>(
  ({ data, onSelect }) => {
    const { colors } = useTheme();
    const styles = useStyles(createStyles);

    if (!data) return null;

    const { items, isPartial } = data;

    if (items.length === 0 && !isPartial) return null;

    return (
      <View style={[styles.card, Shadow.card]}>
        <View style={styles.header}>
          <Text style={Type.cardHeading} numberOfLines={1}>
            Needs attention
          </Text>
          {items.length ? (
            <View style={[styles.count, { backgroundColor: colors.primary }]}>
              <Text style={styles.countText} color={Palette.text.onBrand}>
                {items.length}
              </Text>
            </View>
          ) : null}
        </View>

        {items.length === 0 ? (
          <View style={styles.note}>
            <CloudSlashIcon size={IconSize.row} color={Palette.text.tertiary} />
            <Text style={Type.meta} color={Palette.text.tertiary}>
              Some information is unavailable right now.
            </Text>
          </View>
        ) : (
          items.map((item, index) => (
            <AttentionRow
              key={item.id}
              item={item}
              divided={index > 0}
              onSelect={onSelect}
            />
          ))
        )}

        {/* Items present AND a failed section: what's shown is real but
            incomplete, so neither hide the rows nor imply completeness. */}
        {items.length > 0 && isPartial ? (
          <View style={styles.note}>
            <CloudSlashIcon size={IconSize.inline} color={Palette.text.tertiary} />
            <Text style={Type.caption} color={Palette.text.tertiary}>
              Some information couldn&apos;t be loaded.
            </Text>
          </View>
        ) : null}
      </View>
    );
  },
);
NeedsAttentionList.displayName = "NeedsAttentionList";
export default NeedsAttentionList;

const AttentionRow = memo<{
  item: AttentionItem;
  divided: boolean;
  onSelect?: (item: AttentionItem) => void;
}>(({ item, divided, onSelect }) => {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const { Icon, color } = moduleStyle(item.type, item.title);

  const handlePress = useCallback(() => onSelect?.(item), [onSelect, item]);

  return (
    <View style={[styles.row, divided && styles.divided]}>
      <View style={[styles.icon, { backgroundColor: color ?? colors.primary }]}>
        <Icon weight="fill" size={IconSize.inCircle34} color={Palette.text.onBrand} />
      </View>

      <View style={styles.texts}>
        <Text style={Type.itemTitle} numberOfLines={1}>
          {item.title}
        </Text>
        {item.subtitle ? (
          <Text style={Type.caption} color={Palette.text.tertiary} numberOfLines={1}>
            {item.subtitle}
          </Text>
        ) : null}
      </View>

      {onSelect ? (
        <Pressable
          onPress={handlePress}
          hitSlop={6}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: colors.primary },
            pressed && styles.pressed,
          ]}
        >
          <Text style={Type.buttonSmall} color={Palette.text.onBrand} numberOfLines={1}>
            {item.cta}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
});
AttentionRow.displayName = "AttentionRow";

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    card: {
      width: "100%",
      backgroundColor: colors.surface,
      borderRadius: Radius.card,
      paddingTop: 14,
      paddingHorizontal: 15,
      paddingBottom: 6,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 2,
    },
    count: {
      borderRadius: 10,
      paddingHorizontal: 7,
      paddingVertical: 1,
    },
    countText: {
      fontSize: 11,
      fontWeight: "700",
      lineHeight: 14,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      paddingVertical: 9,
    },
    divided: {
      borderTopWidth: 1,
      borderTopColor: Palette.border.divider,
    },
    icon: {
      width: Size.iconCircle.sm,
      height: Size.iconCircle.sm,
      borderRadius: Size.iconCircle.sm / 2,
      alignItems: "center",
      justifyContent: "center",
    },
    texts: {
      flex: 1,
    },
    cta: {
      height: Size.actionButton.height,
      paddingHorizontal: Size.actionButton.paddingX,
      borderRadius: Radius.actionButton,
      alignItems: "center",
      justifyContent: "center",
    },
    pressed: {
      opacity: Opacity.pressed,
    },
    note: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 9,
    },
  });
