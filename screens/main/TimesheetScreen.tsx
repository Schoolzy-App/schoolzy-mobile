import { CalendarXIcon } from "phosphor-react-native";
import React, { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { WeekCalendar } from "@/components";
import { ScheduleEmpty, subjectColor } from "@/components/schedule/ScheduleParts";
import { QueryState, ScreenTemplate, Text } from "@/components/ui";
import { Palette, Radius, Spacing, Type } from "@/constants/tokens";
import { useStyles, useTimetable } from "@/hooks";
import type { RootStackScreenProps } from "@/navigation/types";

type Props = RootStackScreenProps<"Timesheet">;

/** The class timetable for a day (Agenda-Timesheet-Handoff/02-TIMESHEET.md). */
export default function TimesheetScreen({ route }: Props) {
  const styles = useStyles(createStyles);
  const { studentName, studentSeasonId } = route.params;
  const firstName = studentName.split(" ")[0];

  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data, isLoading, isFetching, error, refetch } = useTimetable(
    studentSeasonId,
    selectedDate,
  );

  const slots = data?.slots ?? [];
  // The backend resolves the weekday; before it answers, the date gives it.
  const weekday =
    data?.day || selectedDate.toLocaleDateString("en-GB", { weekday: "long" });

  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  return (
    <ScreenTemplate
      scrollHeader
      headerStyle={styles.header}
      title={
        <Text style={Type.headerTitleModule} color={Palette.text.onBrand} numberOfLines={1}>
          Timesheet for{" "}
          <Text style={[Type.headerTitleModule, Type.bold]} color={Palette.text.onBrand}>
            {firstName}
          </Text>
        </Text>
      }
    >
      <View style={styles.body}>
        {/* No day is blocked: the backend decides which days have a published
            timetable, and a day without one renders the empty state below. */}
        <View style={styles.calendarCard}>
          <WeekCalendar selectedDate={selectedDate} onSelectDate={handleSelectDate} />
        </View>

        <Text style={styles.weekday}>{weekday}</Text>

        <QueryState
          // placeholderData keeps the previous day on screen while loading.
          isLoading={isLoading && isFetching}
          error={error}
          onRetry={refetch}
        >
          {slots.length ? (
            slots.map((slot) => (
              <View key={slot.id} style={styles.row}>
                <View style={styles.time}>
                  <Text style={styles.start}>{slot.from}</Text>
                  <Text style={Type.caption} color={Palette.text.tertiary}>
                    {slot.to}
                  </Text>
                </View>
                <View style={[styles.bar, { backgroundColor: subjectColor(slot.subject) }]} />
                <View style={styles.text}>
                  <Text style={Type.cardHeading} numberOfLines={1}>
                    {slot.subject}
                  </Text>
                  {/* The API has no room, so the line is the teacher alone. */}
                  {slot.teacher ? (
                    <Text style={Type.meta} color={Palette.text.tertiary} numberOfLines={1}>
                      {slot.teacher}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))
          ) : (
            // An empty `periods` array is a valid success: the day has no
            // published timetable — a weekend, a holiday, or a school that
            // doesn't use timetables in the system.
            <ScheduleEmpty
              Icon={CalendarXIcon}
              title="No classes for this day"
              hint="When the school publishes a timetable for this day, the classes will show here."
            />
          )}
        </QueryState>
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
    calendarCard: {
      backgroundColor: colors.surface,
      borderRadius: Radius.detailCard,
      paddingVertical: 16,
      paddingHorizontal: 15,
    },
    weekday: {
      fontSize: 19,
      fontWeight: "600",
      lineHeight: 23,
      textAlign: "center",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingVertical: 13,
      paddingHorizontal: 15,
      borderRadius: Radius.card,
      backgroundColor: colors.surface,
    },
    time: {
      width: 54,
      gap: 1,
    },
    start: {
      fontSize: 15,
      fontWeight: "700",
      lineHeight: 18,
    },
    bar: {
      width: 3,
      alignSelf: "stretch",
      borderRadius: 2,
    },
    text: {
      flex: 1,
      gap: 2,
    },
  });
