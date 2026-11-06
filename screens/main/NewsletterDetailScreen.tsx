import {
  CalendarBlankIcon,
  DownloadSimpleIcon,
  FileIcon,
  FilePdfIcon,
} from "phosphor-react-native";
import React, { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { useKindStyle } from "@/components/newsletter/NewsletterCard";
import { QueryState, ScreenTemplate, Text } from "@/components/ui";
import {
  Opacity,
  Palette,
  Radius,
  Size,
  Spacing,
  Type,
} from "@/constants/tokens";
import { useTheme } from "@/contexts/ThemeContext";
import { useNewsletterDetail, useStyles } from "@/hooks";
import type { RootStackScreenProps } from "@/navigation/types";
import { newslettersApi } from "@/services/api";
import type { NewsletterDetail } from "@/services/mappers";

type Props = RootStackScreenProps<"NewsletterDetail">;

/** One newsletter: body and attachment (Newsletter spec §9). */
export default function NewsletterDetailScreen({ navigation, route }: Props) {
  const styles = useStyles(createStyles);
  const { source, id } = route.params;
  // Loading this marks the newsletter read on the server.
  const { data, isLoading, error, refetch } = useNewsletterDetail(source, id);

  const openAttachment = useCallback(async () => {
    if (!data?.attachment) return;
    navigation.navigate("Pdf", {
      title: data.attachment.name || data.title,
      uri: newslettersApi.getFileUrl(source, id),
      headers: await newslettersApi.getFileHeaders(),
      kind: data.attachment.isPdf ? "pdf" : undefined,
    });
  }, [data, navigation, source, id]);

  return (
    <ScreenTemplate
      scrollHeader
      headerStyle={styles.header}
      title={
        <Text style={Type.headerTitleModule} color={Palette.text.onBrand} numberOfLines={1}>
          Newsletter
        </Text>
      }
    >
      <View style={styles.body}>
        <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
          {data ? <DetailContent item={data} onOpenAttachment={openAttachment} /> : null}
        </QueryState>
      </View>
    </ScreenTemplate>
  );
}

function DetailContent({
  item,
  onOpenAttachment,
}: {
  item: NewsletterDetail;
  onOpenAttachment: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const { Icon, color } = useKindStyle(item.kind);
  const attachment = item.attachment;
  const FileTypeIcon = attachment?.isPdf ? FilePdfIcon : FileIcon;

  return (
    <>
      <View style={styles.card}>
        <View style={styles.kindRow}>
          <View style={[styles.kindCircle, { backgroundColor: color }]}>
            <Icon weight="fill" size={16} color={Palette.text.onBrand} />
          </View>
          <Text style={styles.kindText} color={Palette.text.secondary} numberOfLines={1}>
            {[item.kindLabel, item.audience].filter(Boolean).join(" · ")}
          </Text>
        </View>

        <Text style={Type.detailTitle}>{item.title}</Text>

        <View style={styles.dateRow}>
          <CalendarBlankIcon size={16} color={Palette.text.tertiary} />
          <Text style={Type.meta} color={Palette.text.tertiary}>
            {item.date}
          </Text>
        </View>

        {item.body ? (
          <Text style={Type.body} color={Palette.text.body}>
            {item.body}
          </Text>
        ) : null}
      </View>

      {attachment ? (
        <Pressable
          onPress={onOpenAttachment}
          style={({ pressed }) => [styles.attachment, pressed && styles.pressed]}
        >
          <View style={styles.fileTile}>
            <FileTypeIcon weight="fill" size={22} color={Palette.status.pdf.fg} />
          </View>
          <View style={styles.flex}>
            <Text style={Type.cardHeading} numberOfLines={1}>
              {attachment.name}
            </Text>
            {attachment.meta ? (
              <Text style={Type.caption} color={Palette.text.tertiary}>
                {attachment.meta}
              </Text>
            ) : null}
          </View>
          <DownloadSimpleIcon weight="bold" size={18} color={colors.primary} />
        </Pressable>
      ) : null}
    </>
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
    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.detailCard,
      padding: Spacing.cardPadding.detail,
      gap: 14,
    },
    kindRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    kindCircle: {
      width: Size.iconCircle.sm,
      height: Size.iconCircle.sm,
      borderRadius: Size.iconCircle.sm / 2,
      alignItems: "center",
      justifyContent: "center",
    },
    kindText: {
      flex: 1,
      fontSize: 13,
      fontWeight: "600",
      lineHeight: 16,
    },
    dateRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    attachment: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 13,
      paddingHorizontal: 14,
      borderRadius: Radius.card,
      backgroundColor: colors.surface,
    },
    pressed: {
      opacity: Opacity.pressedCard,
    },
    fileTile: {
      width: 42,
      height: 42,
      borderRadius: Radius.iconTile,
      backgroundColor: Palette.status.pdf.tint,
      alignItems: "center",
      justifyContent: "center",
    },
    flex: {
      flex: 1,
    },
  });
