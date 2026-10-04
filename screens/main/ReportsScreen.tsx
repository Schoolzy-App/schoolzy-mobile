import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { ReportItem, ReportTypeFilter } from "@/components";
import { QueryState, ScreenTemplate, Text } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useStudentReports, useStyles } from "@/hooks";
import { studentsApi } from "@/services/api";
import type { StudentReport } from "@/services/mappers";
import type { RootStackScreenProps } from "@/navigation/types";

type Props = RootStackScreenProps<"Reports">;

export default function ReportsScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const { studentName, studentSeasonId } = route.params;

  const { data, isLoading, error, refetch } = useStudentReports(studentSeasonId);

  // The API returns the student's name at the root; the route param is the
  // fallback for when the request hasn't resolved yet.
  const firstName = (data?.studentName || studentName).split(" ")[0];

  const [selectedType, setSelectedType] = useState("all");

  // Filtering keys on categoryId, never on the display name — the guide is
  // explicit that categoryName must not drive logic.
  //
  // The `?? []` lives inside the memo: outside it would allocate a new array
  // on every render and defeat the memo it feeds.
  const filteredReports = useMemo(() => {
    const all = data?.reports ?? [];
    return selectedType === "all"
      ? all
      : all.filter((r) => r.categoryKey === selectedType);
  }, [data?.reports, selectedType]);

  const handleOpen = useCallback(
    async (report: StudentReport) => {
      // The payload carries no URL any more: the file is built from the
      // student and report ids, and the endpoint needs the bearer token. With
      // no student there is no URL to build — and no reports either, so the
      // list this runs from is empty.
      if (typeof studentSeasonId !== "number") return;

      navigation.navigate("Pdf", {
        title: report.title,
        uri: studentsApi.getReportFileUrl(studentSeasonId, report.reportId),
        headers: await studentsApi.getReportFileHeaders(),
      });
    },
    [navigation, studentSeasonId],
  );

  return (
    <ScreenTemplate
      title={
        <Text variant="label1" weight="medium" color={colors.buttonText}>
          Reports for{" "}
          <Text variant="label1" weight="bold" color={colors.buttonText}>
            {firstName}
          </Text>
        </Text>
      }
    >
      <QueryState
        isLoading={isLoading}
        error={error}
        // Categories with no reports is a valid state, not a failure.
        isEmpty={!data?.reports.length}
        emptyMessage="No reports published yet"
        onRetry={refetch}
      >
        {/* ── Type Filter ──────────────────────────────────────────── */}
        {data?.types.length ? (
          <View style={styles.filterContainer}>
            <ReportTypeFilter
              types={data.types}
              selected={selectedType}
              onSelect={setSelectedType}
            />
          </View>
        ) : null}

        {/* ── Reports List ─────────────────────────────────────────── */}
        <View style={styles.reportsList}>
          {filteredReports.length ? (
            filteredReports.map((report) => (
              <ReportItem
                key={report.id}
                {...report}
                onPress={() => handleOpen(report)}
              />
            ))
          ) : (
            <Text
              variant="label3"
              weight="regular"
              color={colors.textSecondary}
              style={styles.emptyCategory}
            >
              No reports in this category.
            </Text>
          )}
        </View>
      </QueryState>
    </ScreenTemplate>
  );
}

const createStyles = () =>
  StyleSheet.create({
    // ── Filter ──────────────────────────────────────────────
    filterContainer: {
      width: "100%",
      paddingTop: 20,
      paddingBottom: 8,
    },

    // ── Reports List ─────────────────────────────────────────
    reportsList: {
      width: "100%",
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 24,
      gap: 12,
    },
    emptyCategory: {
      textAlign: "center",
      paddingVertical: 24,
    },
  });
