import { ShieldCheckIcon } from "phosphor-react-native";
import React, { memo, useState } from "react";
import {
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import type { ColorPalette } from "@/apps";
import { Text } from "@/components/ui";
import {
  IconSize,
  Opacity,
  Palette,
  Radius,
  Size,
  Type,
} from "@/constants/tokens";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";
import type { DashboardAttention } from "@/services/mappers";

import { moduleStyle } from "./moduleStyle";

export interface AttentionCardProps {
  items: DashboardAttention[];
  onAction?: (item: DashboardAttention) => void;
}

/**
 * The "needs your attention" card in the Home header: a one-item-per-page
 * carousel with pager dots, or the quiet state when nothing is pending.
 */
const AttentionCard = memo<AttentionCardProps>(({ items, onAction }) => {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  // Pages are as wide as the card's content box, which is only known after
  // layout; nothing renders in the carousel until then.
  const [pageWidth, setPageWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const onLayout = (e: LayoutChangeEvent) =>
    setPageWidth(e.nativeEvent.layout.width);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!pageWidth) return;
    setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / pageWidth));
  };

  if (!items.length) {
    return (
      <View style={[styles.card, styles.quiet]}>
        <View style={styles.quietIcon}>
          <ShieldCheckIcon weight="fill" size={19} color={Palette.text.onBrand} />
        </View>
        <View style={styles.flex}>
          <Text style={Type.listTitleRead} numberOfLines={1}>
            Everything looks good!
          </Text>
          <Text style={Type.meta} color={Palette.text.tertiary} numberOfLines={1}>
            No action needed right now
          </Text>
        </View>
      </View>
    );
  }

  const count = items.length;

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={[Type.cardHeading, styles.flex]} numberOfLines={1}>
          {count === 1
            ? "1 thing needs your attention"
            : `${count} things need your attention`}
        </Text>
        {count > 1 ? (
          <View style={styles.dots}>
            {items.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.dot,
                  index === activeIndex && {
                    width: Size.pagerDot.activeWidth,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            ))}
          </View>
        ) : null}
      </View>

      <View onLayout={onLayout}>
        {pageWidth ? (
          <FlatList
            data={items}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <AttentionItem
                item={item}
                width={pageWidth}
                onAction={onAction}
              />
            )}
          />
        ) : null}
      </View>
    </View>
  );
});

AttentionCard.displayName = "AttentionCard";
export default AttentionCard;

// ─── Item ────────────────────────────────────────────────────────────────────

function AttentionItem({
  item,
  width,
  onAction,
}: {
  item: DashboardAttention;
  width: number;
  onAction?: (item: DashboardAttention) => void;
}) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const { Icon, color } = moduleStyle(item.actionCode, `${item.type} ${item.title}`);

  return (
    <View style={[styles.item, { width }]}>
      <View style={[styles.itemIcon, { backgroundColor: color ?? colors.primary }]}>
        <Icon weight="fill" size={IconSize.inCircle34} color={Palette.text.onBrand} />
      </View>
      <View style={styles.flex}>
        <Text style={Type.itemTitle} numberOfLines={1}>
          {item.title}
        </Text>
        {item.subtitle ? (
          <Text style={Type.caption} color={Palette.text.tertiary} numberOfLines={1}>
            {item.subtitle}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={() => onAction?.(item)}
        hitSlop={6}
        style={({ pressed }) => [
          styles.action,
          { backgroundColor: colors.primary },
          pressed && styles.actionPressed,
        ]}
      >
        <Text style={Type.buttonSmall} color={Palette.text.onBrand} numberOfLines={1}>
          {item.actionLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.card,
      padding: 15,
    },
    flex: {
      flex: 1,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    dots: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    dot: {
      width: Size.pagerDot.size,
      height: Size.pagerDot.size,
      borderRadius: Size.pagerDot.size / 2,
      backgroundColor: Palette.border.dashed,
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      paddingTop: 9,
    },
    itemIcon: {
      width: Size.iconCircle.sm,
      height: Size.iconCircle.sm,
      borderRadius: Size.iconCircle.sm / 2,
      alignItems: "center",
      justifyContent: "center",
    },
    action: {
      height: Size.actionButton.height,
      paddingHorizontal: Size.actionButton.paddingX,
      borderRadius: Radius.actionButton,
      alignItems: "center",
      justifyContent: "center",
    },
    // The design darkens to #5E0A28 on Brighton; opacity gives every school's
    // brand colour the same pressed feedback without a per-school token.
    actionPressed: {
      opacity: Opacity.pressed,
    },
    quiet: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
    },
    quietIcon: {
      width: Size.iconCircle.lg,
      height: Size.iconCircle.lg,
      borderRadius: Size.iconCircle.lg / 2,
      backgroundColor: Palette.avatar.allClear,
      alignItems: "center",
      justifyContent: "center",
    },
  });
