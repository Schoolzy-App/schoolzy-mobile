import React, { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { WeekCalendar } from "@/components";
import { QueryState, ScreenTemplate, Text } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles, useTimetable } from "@/hooks";
import type { RootStackScreenProps } from "@/navigation/types";

type Props = RootStackScreenProps<"Timesheet">;

export default function TimesheetScreen({ route }: Props) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const { studentName, studentSeasonId } = route.params;
  const firstName = studentName.split(" ")[0];

  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data, isLoading, isFetching, error, refetch } = useTimetable(
    studentSeasonId,
    selectedDate,
  );

  const slots = data?.slots ?? [];

  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  return (
    <ScreenTemplate
      title={
        <Text variant="label1" weight="medium" color={colors.buttonText}>
          Timesheet for{" "}
          <Text variant="label1" weight="bold" color={colors.buttonText}>
            {firstName}
          </Text>
        </Text>
      }
    >
      {/* ── Calendar ─────────────────────────────────────────────── */}
      <View style={styles.calendarCard}>
        {/* No day is blocked: the backend decides which days have a published
            timetable, and a day without one renders the empty state below. */}
        <WeekCalendar
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
        />
      </View>

      {/* ── Day, as resolved by the backend ──────────────────────── */}
      {data?.day ? (
        <View style={styles.dayHeader}>
          <Text variant="label1" weight="semiBold">
            {data.day}
          </Text>
        </View>
      ) : null}

      {/* ── Periods ──────────────────────────────────────────────── */}
      <View style={styles.slotsList}>
        <QueryState
          // placeholderData keeps the previous day on screen while loading.
          isLoading={isLoading && isFetching}
          error={error}
          // An empty `periods` array is a valid success, not a failure: the day
          // simply has no published timetable.
          isEmpty={!slots.length}
          emptyMessage="No timetable available for this day."
          onRetry={refetch}
        >
          {slots.map((slot) => (
            <View key={slot.id} style={styles.slotCard}>
              <View style={styles.timeColumn}>
                <Text variant="label2" weight="bold" color={colors.primary}>
                  {slot.from}
                </Text>
                <Text
                  variant="caption1"
                  weight="medium"
                  color={colors.textSecondary}
                >
                  {slot.to}
                </Text>
              </View>
              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />
              <View style={styles.subjectColumn}>
                <Text variant="label2" weight="semiBold">
                  {slot.subject}
                </Text>
                {/* Both lines are nullable by contract, so each is optional. */}
                {slot.teacher ? (
                  <Text
                    variant="label3"
                    weight="regular"
                    color={colors.textSecondary}
                  >
                    {slot.teacher}
                  </Text>
                ) : null}
                {slot.duration ? (
                  <Text
                    variant="caption1"
                    weight="regular"
                    color={colors.textSecondary}
                  >
                    {slot.duration}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </QueryState>
      </View>
    </ScreenTemplate>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    calendarCard: {
      width: "100%",
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginTop: 16,
      marginHorizontal: 16,
      alignSelf: "center",
    },
    dayHeader: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    slotsList: {
      width: "100%",
      paddingHorizontal: 16,
      paddingVertical: 16,
      gap: 10,
    },
    slotCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    timeColumn: {
      width: 64,
      alignItems: "center",
      gap: 2,
    },
    divider: {
      width: 1,
      alignSelf: "stretch",
    },
    subjectColumn: {
      flex: 1,
      gap: 2,
    },
  });
