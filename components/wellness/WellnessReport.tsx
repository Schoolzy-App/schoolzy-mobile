import { MaterialIcons } from "@expo/vector-icons";
import React, { memo, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  UIManager,
  View,
} from "react-native";

import { Card, Text } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";
import type { HealthProfileSummary } from "@/services/mappers";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ReportRow {
  key: string;
  label: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
  /** Summary text (e.g. count or short status). */
  summary: string;
  /** Whether this section has any data (drives accent color). */
  filled: boolean;
}

function pluralize(count: number, singular: string, plural?: string) {
  const word = count === 1 ? singular : (plural ?? `${singular}s`);
  return `${count} ${word}`;
}

interface WellnessReportProps {
  defaultOpen?: boolean;
  /**
   * Counts derived from the API's health profile. Passed in rather than read
   * from a context so this card renders whatever the caller fetched.
   */
  summary: HealthProfileSummary;
}

const WellnessReport = memo<WellnessReportProps>(({ defaultOpen = false, summary }) => {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const {
    chronic,
    past,
    medications,
    vaccinations,
    specialRequirementCount,
    documentCount,
    hasNotes,
    hasAnyData,
  } = summary;

  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleOpen = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen((v) => !v);
  };

  const rows: ReportRow[] = [
    {
      key: "chronic",
      label: "Chronic Diseases",
      iconName: "medical-services",
      summary:
        chronic > 0 ? pluralize(chronic, "condition") : "None recorded",
      filled: chronic > 0,
    },
    {
      key: "past",
      label: "Past Conditions",
      iconName: "history",
      summary:
        past > 0 ? pluralize(past, "entry", "entries") : "None recorded",
      filled: past > 0,
    },
    {
      key: "medications",
      label: "Medications",
      iconName: "medication",
      summary:
        medications > 0
          ? pluralize(medications, "medication")
          : "None recorded",
      filled: medications > 0,
    },
    {
      key: "vaccinations",
      label: "Vaccinations",
      iconName: "vaccines",
      summary:
        vaccinations > 0 ? pluralize(vaccinations, "vaccine") : "None recorded",
      filled: vaccinations > 0,
    },
    {
      key: "special",
      label: "Special Requirements",
      iconName: "accessibility-new",
      summary:
        specialRequirementCount > 0
          ? pluralize(specialRequirementCount, "item")
          : "Not configured",
      filled: specialRequirementCount > 0,
    },
    {
      key: "attachments",
      label: "Attachments & Notes",
      iconName: "attach-file",
      summary: (() => {
        if (documentCount === 0 && !hasNotes) return "No documents";
        if (documentCount > 0 && hasNotes)
          return `${pluralize(documentCount, "doc")} + notes`;
        if (documentCount > 0) return pluralize(documentCount, "doc");
        return "Notes added";
      })(),
      filled: documentCount > 0 || hasNotes,
    },
  ];

  return (
    <Card style={styles.card}>
      {/* ── Header (accordion toggle) ─────────────────────── */}
      <Pressable onPress={toggleOpen} style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: colors.primary + "15" }]}>
          <MaterialIcons name="favorite" size={20} color={colors.primary} />
        </View>
        <View style={styles.headerTexts}>
          <Text variant="label1" weight="semiBold">
            Wellness Report
          </Text>
          <Text variant="label3" weight="regular" color={colors.textSecondary}>
            {hasAnyData
              ? "Summary of saved entries"
              : "Tap edit above to add wellness data"}
          </Text>
        </View>
        <MaterialIcons
          name={isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"}
          size={24}
          color={colors.primary}
        />
      </Pressable>

      {/* ── Expanded details ──────────────────────────────── */}
      {isOpen ? (
        <>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.rows}>
            {rows.map((row) => {
              const accent = row.filled ? colors.primary : colors.textSecondary;
              return (
                <View key={row.key} style={styles.row}>
                  <View
                    style={[
                      styles.rowIcon,
                      {
                        backgroundColor: row.filled
                          ? colors.primary + "15"
                          : colors.background,
                      },
                    ]}
                  >
                    <MaterialIcons name={row.iconName} size={18} color={accent} />
                  </View>
                  <Text
                    variant="label2"
                    weight={row.filled ? "semiBold" : "regular"}
                    style={styles.rowLabel}
                  >
                    {row.label}
                  </Text>
                  <Text
                    variant="label3"
                    weight={row.filled ? "semiBold" : "regular"}
                    color={accent}
                  >
                    {row.summary}
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      ) : null}
    </Card>
  );
});

WellnessReport.displayName = "WellnessReport";
export default WellnessReport;

const createStyles = () =>
  StyleSheet.create({
    card: {
      gap: 12,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    headerIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTexts: {
      flex: 1,
      gap: 2,
    },
    divider: {
      height: 1,
      width: "100%",
    },
    rows: {
      gap: 8,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 6,
    },
    rowIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    rowLabel: {
      flex: 1,
    },
  });
