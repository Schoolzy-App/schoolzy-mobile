import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { CircularProgress, DynamicStateItem, WeekCalendar } from "@/components";
import { BottomSection, QueryState, ScreenTemplate, Text } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useAgenda, useStyles } from "@/hooks";
import type { AttendanceState } from "@/services/mappers";
import type { RootStackScreenProps } from "@/navigation/types";

const today = new Date();

/**
 * Weekend — Sunday (0) and Saturday (6).
 *
 * Expressed as weekdays rather than a list of dates: the strip follows the
 * selected date, so a list built from this week would leave the weekend
 * selectable in every other week.
 */
const DISABLED_WEEKDAYS = [0, 6];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const DAY_LABEL: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "numeric",
  month: "short",
};

/**
 * Colour for an attendance status. "unknown" keeps the default text colour —
 * the API's status is free text, and a status we don't recognise shouldn't be
 * painted as either good or bad news.
 */
function statusColor(
  state: AttendanceState | undefined,
  colors: ColorPalette,
): string {
  switch (state) {
    case "present":
      return colors.success;
    case "absent":
      return colors.danger;
    case "late":
      return colors.warning;
    default:
      return colors.textPrimary;
  }
}

type Props = RootStackScreenProps<"Agenda">;

export default function AgendaScreen({ route }: Props) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const { studentName, studentSeasonId } = route.params;

  const [selectedDate, setSelectedDate] = useState(today);

  const { data, isLoading, isFetching, error, refetch } = useAgenda(
    studentSeasonId,
    selectedDate,
  );

  const firstName = (data?.studentName || studentName).split(" ")[0];

  /**
   * ⚠️ Absences are only known for days already fetched — the API exposes
   * attendance per requested day, not a range. Ask the backend for a
   * month/range attendance endpoint to mark the whole strip at once.
   */
  const absentDates = useMemo(
    () => (data?.isAbsent ? [selectedDate] : []),
    [data?.isAbsent, selectedDate],
  );

  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const isToday = isSameDay(selectedDate, today);

  return (
    <ScreenTemplate
      title={
        <Text variant="label1" weight="medium" color={colors.buttonText}>
          Agenda for{" "}
          <Text variant="label1" weight="bold" color={colors.buttonText}>
            {firstName}
          </Text>
        </Text>
      }
    >
      {/* ── Calendar Card ────────────────────────────────────────── */}
      <View style={styles.calendarCard}>
        <WeekCalendar
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          disabledWeekdays={DISABLED_WEEKDAYS}
          markedDates={absentDates}
          markedColor={colors.danger}
        />

        {/* ── Legend ──────────────────────────────────────────────
            Only when a day is actually dotted. Shown unconditionally it
            read as the selected day's status, which contradicted the
            "Present" card beside it. */}
        {absentDates.length ? (
          <View style={styles.legendRow}>
            <View
              style={[styles.legendDot, { backgroundColor: colors.danger }]}
            />
            <Text
              variant="label3"
              weight="regular"
              color={colors.textSecondary}
            >
              Absence
            </Text>
          </View>
        ) : null}
      </View>

      {/* ── Stats Cards ──────────────────────────────────────────── */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <CircularProgress
            percentage={data?.attendancePercentage ?? 0}
            size={64}
            strokeWidth={5}
            color="#22863A"
            label="Attendance"
          />
        </View>
        <View style={styles.statCard}>
          <Text
            variant="label2"
            weight="semiBold"
            color={statusColor(data?.attendanceState, colors)}
          >
            {data?.attendanceStatus || "—"}
          </Text>
          {/* Attendance is fetched for the selected day, so labelling it
              "Today" was wrong as soon as another day was picked. */}
          <Text variant="label3" weight="regular" color={colors.textSecondary}>
            {isToday ? "Today" : selectedDate.toLocaleDateString(undefined, DAY_LABEL)}
          </Text>
        </View>
      </View>

      {/* ── Agenda items for the selected day ─────────────────────── */}
      <BottomSection title="Latest Updates">
        <QueryState
          // `placeholderData` keeps the previous day visible while the next
          // loads, so only the very first fetch shows a spinner.
          isLoading={isLoading && isFetching}
          error={error}
          isEmpty={!data?.items.length}
          emptyMessage="Nothing scheduled for this day"
          onRetry={refetch}
        >
          {data?.items.map((event) => (
            <View key={event.id} style={styles.latestItem}>
              <DynamicStateItem {...event} />
            </View>
          ))}
        </QueryState>
      </BottomSection>
    </ScreenTemplate>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    // ── Calendar Card ───────────────────────────────────────
    calendarCard: {
      width: "100%",
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginTop: 16,
      marginHorizontal: 16,
      alignSelf: "center",
      gap: 12,
    },

    // ── Legend ──────────────────────────────────────────────
    legendRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingTop: 4,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },

    // ── Stats ────────────────────────────────────────────────
    statsRow: {
      flexDirection: "row",
      width: "100%",
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingVertical: 20,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },

    // ── Latest Section ───────────────────────────────────────
    latestItem: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
  });
