import {
  CalendarCheckIcon,
  ExamIcon,
  NotebookIcon,
} from "phosphor-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { CircularProgress, WeekCalendar } from "@/components";
import { ScheduleEmpty } from "@/components/schedule/ScheduleParts";
import { QueryState, ScreenTemplate, Text } from "@/components/ui";
import { Palette, Radius, Spacing, Type } from "@/constants/tokens";
import { useTheme } from "@/contexts/ThemeContext";
import { useAgenda, useStyles } from "@/hooks";
import type { AgendaEntry } from "@/services/mappers";
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

type Props = RootStackScreenProps<"Agenda">;

/** Attendance and the day's homework and exams (Agenda-Timesheet-Handoff/01-AGENDA.md). */
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
  const entries = data?.entries ?? [];

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

  return (
    <ScreenTemplate
      scrollHeader
      headerStyle={styles.header}
      title={
        <Text style={Type.headerTitleModule} color={Palette.text.onBrand} numberOfLines={1}>
          Agenda for{" "}
          <Text style={[Type.headerTitleModule, Type.bold]} color={Palette.text.onBrand}>
            {firstName}
          </Text>
        </Text>
      }
      contentStyle={styles.content}
    >
      <View style={styles.body}>
        <View style={styles.calendarCard}>
          <WeekCalendar
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            disabledWeekdays={DISABLED_WEEKDAYS}
            markedDates={absentDates}
            markedColor={colors.danger}
          />
        </View>

        <View style={styles.cards}>
          {/* Term-level, not per selected day. */}
          <View style={styles.card}>
            <CircularProgress
              percentage={data?.attendancePercentage ?? 0}
              size={66}
              strokeWidth={6}
              color="#2E8B3A"
              label="Attendance"
            />
          </View>
          <View style={[styles.card, styles.countCard]}>
            <Text style={styles.count}>{entries.length || "–"}</Text>
            <Text style={styles.caption} color={Palette.text.secondary}>
              {entries.length ? "Homework & exams" : "Today"}
            </Text>
          </View>
        </View>

        {/* ── Latest Updates ─────────────────────────────────────── */}
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Latest Updates</Text>
          <QueryState
            // `placeholderData` keeps the previous day visible while the next
            // loads, so only the very first fetch shows a spinner.
            isLoading={isLoading && isFetching}
            error={error}
            onRetry={refetch}
          >
            {entries.length ? (
              entries.map((entry, index) => (
                <EntryRow key={entry.id} entry={entry} divided={index > 0} />
              ))
            ) : (
              // A day with nothing set — or a school that doesn't use the
              // agenda in the system.
              <ScheduleEmpty
                plain
                Icon={CalendarCheckIcon}
                title="Nothing scheduled for this day"
                hint="Homework and exams the school adds for this day will show here."
              />
            )}
          </QueryState>
        </View>
      </View>
    </ScreenTemplate>
  );
}

const KIND = {
  homework: { Icon: NotebookIcon, color: "#4E7FD0", label: "Homework" },
  exam: { Icon: ExamIcon, color: "#800E37", label: "Exam" },
} as const;

function EntryRow({ entry, divided }: { entry: AgendaEntry; divided: boolean }) {
  const styles = useStyles(createStyles);
  const { Icon, color, label } = KIND[entry.kind];
  return (
    <View style={[styles.row, divided && styles.divided]}>
      <View style={[styles.iconTile, { backgroundColor: `${color}1A` }]}>
        <Icon weight="fill" size={20} color={color} />
      </View>
      <View style={styles.text}>
        <Text style={Type.cardHeading} numberOfLines={2}>
          {entry.title}
        </Text>
        {entry.subtitle ? (
          <Text style={Type.meta} color={Palette.text.tertiary} numberOfLines={1}>
            {entry.subtitle}
          </Text>
        ) : null}
      </View>
      <View style={[styles.tag, { backgroundColor: `${color}1A` }]}>
        <Text style={Type.pill} color={color} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    header: {
      borderBottomLeftRadius: Radius.header,
      borderBottomRightRadius: Radius.header,
    },
    content: {
      flexGrow: 1,
    },
    body: {
      flex: 1,
      width: "100%",
      paddingHorizontal: Spacing.screenX,
      paddingTop: Spacing.contentTop.modules,
      paddingBottom: 24,
      gap: 15,
    },
    calendarCard: {
      backgroundColor: colors.surface,
      borderRadius: Radius.detailCard,
      paddingVertical: 16,
      paddingHorizontal: 15,
    },
    cards: {
      flexDirection: "row",
      gap: 12,
    },
    card: {
      flex: 1,
      alignItems: "center",
      gap: 8,
      paddingTop: 18,
      paddingHorizontal: 12,
      paddingBottom: 14,
      borderRadius: Radius.detailCard,
      backgroundColor: colors.surface,
    },
    countCard: {
      justifyContent: "center",
      gap: 6,
    },
    count: {
      fontSize: 24,
      fontWeight: "700",
      lineHeight: 29,
    },
    caption: {
      fontSize: 14,
      lineHeight: 17,
    },
    sheet: {
      minHeight: 320,
      gap: 12,
      paddingTop: 10,
      paddingHorizontal: 15,
      paddingBottom: 18,
      borderRadius: Radius.sheet,
      backgroundColor: colors.surface,
    },
    handle: {
      alignSelf: "center",
      width: 64,
      height: 5,
      borderRadius: 3,
      backgroundColor: Palette.border.default,
    },
    sheetTitle: {
      fontSize: 17,
      fontWeight: "500",
      lineHeight: 21,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 10,
    },
    divided: {
      borderTopWidth: 1,
      borderTopColor: Palette.border.divider,
    },
    iconTile: {
      width: 40,
      height: 40,
      borderRadius: Radius.iconTile,
      alignItems: "center",
      justifyContent: "center",
    },
    text: {
      flex: 1,
      gap: 2,
    },
    tag: {
      borderRadius: Radius.pill,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
  });
