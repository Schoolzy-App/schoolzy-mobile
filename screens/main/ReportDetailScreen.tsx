import {
  CalendarBlankIcon,
  DownloadSimpleIcon,
  FilePdfIcon,
  UserIcon,
} from "phosphor-react-native";
import React, { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import {
  directionalAlign,
  reportIcon,
  reportTypeLabel,
} from "@/components/report/ReportCard";
import { ScreenTemplate, Text } from "@/components/ui";
import { Opacity, Palette, Radius, Spacing, Type } from "@/constants/tokens";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";
import type { RootStackScreenProps } from "@/navigation/types";
import { studentsApi } from "@/services/api";

type Props = RootStackScreenProps<"ReportDetail">;

/**
 * One report (Reports spec §6). The design's status pill, Acknowledge button
 * and form questions are left out — the API has no endpoints for them yet
 * (docs/api-notes.md).
 */
export default function ReportDetailScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const { studentSeasonId, report } = route.params;
  const TypeIcon = reportIcon(report.category);

  const openFile = useCallback(async () => {
    navigation.navigate("Pdf", {
      title: report.title,
      uri: studentsApi.getReportFileUrl(studentSeasonId, report.reportId),
      headers: await studentsApi.getReportFileHeaders(),
      kind: "pdf",
    });
  }, [navigation, studentSeasonId, report]);

  return (
    <ScreenTemplate
      scrollHeader
      headerStyle={styles.header}
      title={
        <Text style={Type.headerTitleModule} color={Palette.text.onBrand} numberOfLines={1}>
          Report ·{" "}
          <Text style={[Type.headerTitleModule, Type.bold]} color={Palette.text.onBrand}>
            {report.categoryLabel}
          </Text>
        </Text>
      }
    >
      <View style={styles.body}>
        <View style={styles.card}>
          <View style={[styles.typePill, { backgroundColor: `${colors.primary}14` }]}>
            <TypeIcon size={13} color={colors.primary} />
            <Text style={Type.statusChipText} color={colors.primary}>
              {reportTypeLabel(report)}
            </Text>
          </View>

          <Text style={[Type.detailTitle, directionalAlign(report.title)]}>{report.title}</Text>

          <View style={styles.meta}>
            <CalendarBlankIcon size={16} color={Palette.text.tertiary} />
            <Text style={Type.meta} color={Palette.text.tertiary}>
              {report.dateLabel}
            </Text>
            {report.sender ? (
              <>
                <Text style={Type.meta} color={Palette.text.tertiary}>
                  ·
                </Text>
                <UserIcon size={16} color={Palette.text.tertiary} />
                <Text style={Type.meta} color={Palette.text.tertiary} numberOfLines={1}>
                  {report.sender}
                </Text>
              </>
            ) : null}
          </View>

          {report.description ? (
            <Text style={[Type.body, directionalAlign(report.description)]} color={Palette.text.body}>
              {report.description}
            </Text>
          ) : null}
        </View>

        {report.hasFile ? (
          <Pressable
            onPress={openFile}
            style={({ pressed }) => [styles.fileRow, pressed && styles.pressed]}
          >
            <View style={styles.fileTile}>
              <FilePdfIcon weight="fill" size={22} color={Palette.status.pdf.fg} />
            </View>
            <View style={styles.flex}>
              <Text style={Type.cardHeading} numberOfLines={1}>
                {report.title}
              </Text>
              <Text style={Type.caption} color={Palette.text.tertiary}>
                PDF · Tap to view
              </Text>
            </View>
            <DownloadSimpleIcon weight="bold" size={18} color={colors.primary} />
          </Pressable>
        ) : null}
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
    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.detailCard,
      padding: Spacing.cardPadding.detail,
      gap: 14,
    },
    typePill: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderRadius: Radius.pill,
      paddingHorizontal: 9,
      paddingVertical: 2,
    },
    meta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    fileRow: {
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
