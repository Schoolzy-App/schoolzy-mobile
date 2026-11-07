import {
  EnvelopeSimpleIcon,
  MegaphoneIcon,
  PaperclipIcon,
} from "phosphor-react-native";
import React, { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { Text } from "@/components/ui";
import { Opacity, Palette, Radius, Size, Type } from "@/constants/tokens";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";
import type { NewsletterKind, NewsletterListItem } from "@/services/mappers";

/** Announcement blue / letter brand, as the design's kind avatars. */
export function useKindStyle(kind: NewsletterKind) {
  const { colors } = useTheme();
  return kind === "letter"
    ? { Icon: EnvelopeSimpleIcon, color: colors.primary }
    : { Icon: MegaphoneIcon, color: Palette.newsletterKind.announcement };
}

export interface NewsletterCardProps {
  item: NewsletterListItem;
  onSelect: (item: NewsletterListItem) => void;
}

/** One newsletter in the list (Newsletter spec §6–7). */
const NewsletterCard = memo<NewsletterCardProps>(({ item, onSelect }) => {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const { Icon, color } = useKindStyle(item.kind);

  return (
    <Pressable
      onPress={() => onSelect(item)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.avatar, { backgroundColor: color }]}>
        <Icon weight="fill" size={IconSize21} color={Palette.text.onBrand} />
      </View>

      <View style={styles.flex}>
        <View style={styles.titleRow}>
          <Text
            style={[Type.listTitleRead, !item.isRead && styles.unreadTitle, styles.shrink]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {!item.isRead ? (
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          ) : null}
        </View>
        <View style={styles.meta}>
          {/* Shrinks so a long audience truncates before the paperclip. */}
          <Text
            style={[Type.caption, styles.shrink]}
            color={Palette.text.tertiary}
            numberOfLines={1}
          >
            {[item.kindLabel, item.audience].filter(Boolean).join(" · ")}
          </Text>
          {item.hasAttachment ? (
            <PaperclipIcon size={13} color={Palette.text.tertiary} />
          ) : null}
        </View>
      </View>

      <Text style={Type.caption} color={Palette.text.tertiary}>
        {item.shortDate}
      </Text>
    </Pressable>
  );
});

NewsletterCard.displayName = "NewsletterCard";
export default NewsletterCard;

const IconSize21 = 21;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
      paddingVertical: 13,
      paddingHorizontal: 14,
      borderRadius: Radius.card,
      backgroundColor: colors.surface,
    },
    pressed: {
      opacity: Opacity.pressedCard,
    },
    avatar: {
      width: Size.iconCircle.newsletter,
      height: Size.iconCircle.newsletter,
      borderRadius: Size.iconCircle.newsletter / 2,
      alignItems: "center",
      justifyContent: "center",
    },
    flex: {
      flex: 1,
      gap: 3,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    shrink: {
      flexShrink: 1,
    },
    unreadTitle: {
      fontWeight: "700",
    },
    dot: {
      width: Size.unreadDot,
      height: Size.unreadDot,
      borderRadius: Size.unreadDot / 2,
    },
    meta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
  });
