import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import FilterChips from "@/components/FilterChips";
import ReportCard from "@/components/report/ReportCard";
import SegmentedControl from "@/components/SegmentedControl";
import { QueryState, ScreenTemplate, Text } from "@/components/ui";
import { Palette, Radius, Spacing, Type } from "@/constants/tokens";
import { useTheme } from "@/contexts/ThemeContext";
import { useStudentReports } from "@/hooks";
import { CLINIC_CATEGORY, EXAM_CATEGORY } from "@/services/mappers";
import type { StudentReport } from "@/services/mappers";
import type { RootStackScreenProps } from "@/navigation/types";

type Props = RootStackScreenProps<"Reports">;

type Term = "all" | "1" | "2";

const TERMS: { value: Term; label: string }[] = [
  { value: "all", label: "All exams" },
  { value: "1", label: "Mid of year" },
  { value: "2", label: "End of year" },
];

export default function ReportsScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { studentName, studentSeasonId } = route.params;

  // "all" or a category number. Filtering keys on the category number, never
  // the display name.
  const [chip, setChip] = useState("all");
  const [term, setTerm] = useState<Term>("all");
  const category = chip === "all" ? undefined : Number(chip);

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useStudentReports(studentSeasonId, category);

  // The API returns the student's name at the root; the route param is the
  // fallback for when the request hasn't resolved yet.
  const firstName = (data?.studentName || studentName).split(" ")[0];

  const showTerms = category === EXAM_CATEGORY;

  // Clinic reports live under Health, so Reports leaves them out — their
  // chip goes, and "All" counts without them.
  const chips = useMemo(() => {
    const all = data?.chips ?? [];
    const clinic = all.find((c) => c.key === String(CLINIC_CATEGORY));
    return all
      .filter((c) => c.key !== String(CLINIC_CATEGORY))
      .map((c) =>
        c.key === "all" && clinic ? { ...c, count: c.count - clinic.count } : c,
      );
  }, [data?.chips]);

  // Newest first from the server; grouping keeps that order.
  const groups = useMemo(() => {
    const result: { label: string; reports: StudentReport[] }[] = [];
    for (const report of data?.reports ?? []) {
      if (report.category === CLINIC_CATEGORY) continue;
      if (showTerms && term !== "all" && String(report.examTerm) !== term) continue;
      const last = result[result.length - 1];
      if (last && last.label === report.monthLabel) last.reports.push(report);
      else result.push({ label: report.monthLabel, reports: [report] });
    }
    return result;
  }, [data?.reports, showTerms, term]);

  const handleChip = useCallback((value: string) => {
    setChip(value);
    setTerm("all");
  }, []);

  const handleOpen = useCallback(
    (report: StudentReport) => {
      if (typeof studentSeasonId !== "number") return;
      navigation.navigate("ReportDetail", { studentSeasonId, report });
    },
    [navigation, studentSeasonId],
  );

  return (
    <ScreenTemplate
      scrollHeader
      headerStyle={styles.header}
      title={
        <Text style={Type.headerTitleModule} color={Palette.text.onBrand} numberOfLines={1}>
          Reports for{" "}
          <Text style={[Type.headerTitleModule, Type.bold]} color={Palette.text.onBrand}>
            {firstName}
          </Text>
        </Text>
      }
    >
      <View style={styles.body}>
        {chips.length > 1 ? (
          <FilterChips options={chips.map((c) => ({ value: c.key, label: c.label, count: c.count }))} value={chip} onChange={handleChip} />
        ) : null}

        {showTerms ? (
          <SegmentedControl options={TERMS} value={term} onChange={setTerm} />
        ) : null}

        <QueryState
          isLoading={isLoading}
          error={error}
          // Categories with no reports is a valid state, not a failure.
          isEmpty={!chips.length && !data?.reports.length}
          emptyMessage="No reports published yet"
          onRetry={refetch}
        >
          {groups.length ? (
            groups.map((group) => (
              <View key={group.label} style={styles.group}>
                <Text style={[Type.groupLabel, styles.groupLabel]} color={Palette.text.tertiary}>
                  {group.label}
                </Text>
                {group.reports.map((report) => (
                  <ReportCard key={report.id} report={report} onSelect={handleOpen} />
                ))}
              </View>
            ))
          ) : (
            <Text style={[Type.rowLabel, styles.empty]} color={Palette.text.tertiary}>
              No reports in this category
            </Text>
          )}

          {hasNextPage ? (
            <Pressable
              style={styles.loadMore}
              onPress={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={Type.link} color={colors.primary}>
                  Load more
                </Text>
              )}
            </Pressable>
          ) : null}
        </QueryState>
      </View>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
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
  group: {
    gap: 10,
  },
  groupLabel: {
    paddingTop: 4,
    paddingHorizontal: 2,
  },
  empty: {
    fontSize: 15,
    lineHeight: 18,
    textAlign: "center",
    paddingVertical: 40,
  },
  loadMore: {
    alignSelf: "center",
    minWidth: 140,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Palette.border.default,
    backgroundColor: Palette.surface.card,
    alignItems: "center",
    justifyContent: "center",
  },
});
