import React, { memo, useCallback, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { Text } from "@/components/ui";
import { Icons } from "@/constants";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";

const { CalendarIcon, ChevronIcon } = Icons;

// ─── Helpers ────────────────────────────────────────────────────────────────
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const FULL_DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const FULL_MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

// ─── Types ──────────────────────────────────────────────────────────────────
export interface WeekCalendarProps {
  /** Dates that should appear disabled (greyed out, not selectable) */
  disabledDates?: Date[];
  /**
   * Weekdays that are always disabled, as `Date.getDay()` values (0 = Sunday).
   * Prefer this over `disabledDates` for a recurring rule: the strip can show
   * any week, so a fixed list of dates only covers whichever week it was built
   * from.
   */
  disabledWeekdays?: number[];
  /** Dates to mark with a small dot indicator (e.g. absence) */
  markedDates?: Date[];
  /** Color of the marked-date dot. Defaults to the theme's secondary color. */
  markedColor?: string;
  /** Called when a day is selected */
  onSelectDate?: (date: Date) => void;
  /** Initially selected date (defaults to today) */
  selectedDate?: Date;
  /**
   * Whether the calendar icon (which opens the full month picker) is shown.
   * Defaults to true. Set false when only the current week strip is needed.
   */
  showMonthPicker?: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────
const WeekCalendar = memo<WeekCalendarProps>(
  ({
    disabledDates = [],
    disabledWeekdays = [],
    markedDates = [],
    markedColor,
    onSelectDate,
    selectedDate: controlledDate,
    showMonthPicker: monthPickerEnabled = true,
  }) => {
    const { colors } = useTheme();
    const styles = useStyles(createStyles);
    const today = useMemo(() => new Date(), []);

    const [internalSelected, setInternalSelected] = useState(
      controlledDate ?? today,
    );
    const selected = controlledDate ?? internalSelected;

    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [pickerYear, setPickerYear] = useState(selected.getFullYear());
    const [pickerMonth, setPickerMonth] = useState(selected.getMonth());

    /**
     * The Sunday→Saturday week containing the selected date.
     *
     * It follows the selection rather than starting at today, so picking a date
     * from another week in the month picker brings that week into view instead
     * of leaving the strip on the current one — which read as the header and
     * the strip disagreeing about which day was selected.
     */
    const weekDays = useMemo(() => {
      const start = new Date(selected);
      start.setDate(start.getDate() - start.getDay()); // back to Sunday
      const days: Date[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        days.push(d);
      }
      return days;
    }, [selected]);

    const isDisabled = useCallback(
      (date: Date) =>
        disabledWeekdays.includes(date.getDay()) ||
        disabledDates.some((d) => isSameDay(d, date)),
      [disabledDates, disabledWeekdays],
    );

    const isMarked = useCallback(
      (date: Date) => markedDates.some((d) => isSameDay(d, date)),
      [markedDates],
    );

    const dotColor = markedColor ?? colors.secondary;

    const handleSelect = useCallback(
      (date: Date) => {
        if (isDisabled(date)) return;
        setInternalSelected(date);
        onSelectDate?.(date);
      },
      [isDisabled, onSelectDate],
    );

    const handleMonthDaySelect = useCallback(
      (day: number) => {
        const date = new Date(pickerYear, pickerMonth, day);
        // The grid greys these out too; bail in case one is tapped anyway.
        if (isDisabled(date)) return;
        setInternalSelected(date);
        onSelectDate?.(date);
        setShowMonthPicker(false);
      },
      [pickerYear, pickerMonth, onSelectDate, isDisabled],
    );

    return (
      <View style={styles.container}>
        {/* ── Date Header ────────────────────────────────────────── */}
        <View style={styles.dateHeader}>
          <View style={styles.dateHeaderLeft}>
            <Text variant="h4" weight="bold">
              {selected.getDate()}
            </Text>
            <View style={styles.dateHeaderTexts}>
              <Text variant="label2" weight="semiBold">
                {FULL_DAY_NAMES[selected.getDay()]}
              </Text>
              <Text variant="label3" weight="medium" color={colors.primary}>
                {FULL_MONTH_NAMES[selected.getMonth()]} {selected.getFullYear()}
              </Text>
            </View>
          </View>
          {monthPickerEnabled ? (
            <Pressable
              onPress={() => {
                setPickerYear(selected.getFullYear());
                setPickerMonth(selected.getMonth());
                setShowMonthPicker(true);
              }}
              hitSlop={8}
            >
              <CalendarIcon width={24} height={24} />
            </Pressable>
          ) : null}
        </View>

        {/* ── 7-Day Strip ────────────────────────────────────────── */}
        <View style={styles.weekStrip}>
          {weekDays.map((day) => {
            const isSelected = isSameDay(day, selected);
            const disabled = isDisabled(day);
            const marked = isMarked(day);

            return (
              <Pressable
                key={day.toISOString()}
                style={[
                  styles.dayCell,
                  isSelected && { backgroundColor: colors.primary },
                  disabled && styles.dayCellDisabled,
                ]}
                onPress={() => handleSelect(day)}
                disabled={disabled}
              >
                {marked ? (
                  <View
                    style={[styles.markedDot, { backgroundColor: dotColor }]}
                  />
                ) : null}
                <Text
                  variant="label1"
                  weight="bold"
                  color={
                    disabled
                      ? colors.textSecondary
                      : isSelected
                        ? colors.buttonText
                        : colors.textPrimary
                  }
                >
                  {day.getDate()}
                </Text>
                <Text
                  variant="caption1"
                  weight="medium"
                  color={
                    disabled
                      ? colors.textSecondary
                      : isSelected
                        ? colors.buttonText
                        : colors.textSecondary
                  }
                >
                  {DAY_NAMES[day.getDay()]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Month Picker Modal ─────────────────────────────────── */}
        <Modal
          visible={showMonthPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMonthPicker(false)}
          statusBarTranslucent
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowMonthPicker(false)}
          >
            <Pressable
              style={styles.modalContent}
              onPress={(e) => e.stopPropagation()}
            >
              {/* ── Title bar ───────────────────────────────────────── */}
              <View style={styles.titleBar}>
                <View style={styles.titleTexts}>
                  <Text variant="label1" weight="bold">
                    Select a Date
                  </Text>
                  <Text
                    variant="label3"
                    weight="regular"
                    color={colors.textSecondary}
                  >
                    {FULL_MONTH_NAMES[pickerMonth]} {pickerYear}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowMonthPicker(false)}
                  hitSlop={8}
                  style={[
                    styles.closeBtn,
                    { backgroundColor: colors.background },
                  ]}
                >
                  <Text
                    variant="label2"
                    weight="bold"
                    color={colors.textPrimary}
                  >
                    ✕
                  </Text>
                </Pressable>
              </View>

              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />

              {/* ── Year navigation ─────────────────────────────────── */}
              <View style={styles.yearRow}>
                <Pressable
                  onPress={() => setPickerYear((y) => y - 1)}
                  hitSlop={8}
                  style={[
                    styles.yearNavBtn,
                    { backgroundColor: colors.background },
                  ]}
                >
                  <View style={styles.chevronLeft}>
                    <ChevronIcon
                      width={16}
                      height={16}
                      color={colors.primary}
                    />
                  </View>
                </Pressable>
                <Text variant="h6" weight="bold">
                  {pickerYear}
                </Text>
                <Pressable
                  onPress={() => setPickerYear((y) => y + 1)}
                  hitSlop={8}
                  style={[
                    styles.yearNavBtn,
                    { backgroundColor: colors.background },
                  ]}
                >
                  <ChevronIcon
                    width={16}
                    height={16}
                    color={colors.primary}
                  />
                </Pressable>
              </View>

              {/* ── Month grid ──────────────────────────────────────── */}
              <View style={styles.monthGrid}>
                {MONTH_NAMES.map((name, index) => {
                  const isViewing = pickerMonth === index;
                  const isSelectedMonth =
                    selected.getMonth() === index &&
                    selected.getFullYear() === pickerYear;
                  return (
                    <Pressable
                      key={name}
                      style={[
                        styles.monthCell,
                        isViewing && {
                          backgroundColor: colors.primary,
                        },
                        !isViewing && isSelectedMonth && {
                          borderWidth: 1,
                          borderColor: colors.primary,
                        },
                      ]}
                      onPress={() => setPickerMonth(index)}
                    >
                      <Text
                        variant="label3"
                        weight={isViewing ? "bold" : "medium"}
                        color={
                          isViewing
                            ? colors.buttonText
                            : isSelectedMonth
                              ? colors.primary
                              : colors.textPrimary
                        }
                      >
                        {name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />

              {/* ── Day grid for selected month ─────────────────────── */}
              <View style={styles.dayGrid}>
                {/* Day name headers */}
                <View style={styles.dayGridRow}>
                  {DAY_NAMES.map((d) => (
                    <View key={d} style={styles.dayHeaderCell}>
                      <Text
                        variant="caption1"
                        weight="bold"
                        color={colors.textSecondary}
                      >
                        {d.toUpperCase()}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Day numbers */}
                {(() => {
                  const daysInMonth = getDaysInMonth(pickerYear, pickerMonth);
                  const firstDay = new Date(
                    pickerYear,
                    pickerMonth,
                    1,
                  ).getDay();
                  const rows: React.ReactNode[] = [];
                  let dayNum = 1;

                  for (let row = 0; row < 6 && dayNum <= daysInMonth; row++) {
                    const cells: React.ReactNode[] = [];
                    for (let col = 0; col < 7; col++) {
                      if (row === 0 && col < firstDay) {
                        cells.push(
                          <View
                            key={`empty-${col}`}
                            style={styles.dayGridCell}
                          />,
                        );
                      } else if (dayNum <= daysInMonth) {
                        const d = dayNum;
                        const dayDate = new Date(pickerYear, pickerMonth, d);
                        const isSelectedDay = isSameDay(dayDate, selected);
                        const isToday = isSameDay(dayDate, today);
                        const marked = isMarked(dayDate);
                        const dayDisabled = isDisabled(dayDate);
                        cells.push(
                          <View key={d} style={styles.dayGridCell}>
                            <Pressable
                              style={[
                                styles.dayCircle,
                                isSelectedDay && {
                                  backgroundColor: colors.primary,
                                },
                                !isSelectedDay && isToday && {
                                  borderWidth: 1.5,
                                  borderColor: colors.primary,
                                },
                                dayDisabled && styles.dayCellDisabled,
                              ]}
                              onPress={() => handleMonthDaySelect(d)}
                              disabled={dayDisabled}
                            >
                              {marked ? (
                                <View
                                  style={[
                                    styles.markedDot,
                                    styles.markedDotGrid,
                                    { backgroundColor: dotColor },
                                  ]}
                                />
                              ) : null}
                              <Text
                                variant="label3"
                                weight={
                                  isSelectedDay || isToday ? "bold" : "regular"
                                }
                                color={
                                  isSelectedDay
                                    ? colors.buttonText
                                    : dayDisabled
                                      ? colors.textSecondary
                                      : isToday
                                        ? colors.primary
                                        : colors.textPrimary
                                }
                              >
                                {d}
                              </Text>
                            </Pressable>
                          </View>,
                        );
                        dayNum++;
                      } else {
                        cells.push(
                          <View
                            key={`empty-end-${col}`}
                            style={styles.dayGridCell}
                          />,
                        );
                      }
                    }
                    rows.push(
                      <View key={`row-${row}`} style={styles.dayGridRow}>
                        {cells}
                      </View>,
                    );
                  }
                  return rows;
                })()}
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    );
  },
);

WeekCalendar.displayName = "WeekCalendar";
export default WeekCalendar;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      gap: 12,
    },

    // ── Date Header ─────────────────────────────────────────
    dateHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    dateHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    dateHeaderTexts: {
      gap: 0,
    },

    // ── Week Strip ──────────────────────────────────────────
    weekStrip: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 4,
    },
    dayCell: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 2,
    },
    dayCellDisabled: {
      opacity: 0.4,
    },
    markedDot: {
      position: "absolute",
      top: 4,
      right: 6,
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    markedDotGrid: {
      top: 2,
      right: 4,
    },

    // ── Modal ───────────────────────────────────────────────
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    modalContent: {
      width: "100%",
      maxWidth: 380,
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 20,
      gap: 16,
    },

    // ── Title Bar ───────────────────────────────────────────
    titleBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    titleTexts: {
      gap: 2,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    divider: {
      height: 1,
      width: "100%",
    },

    // ── Year Row ────────────────────────────────────────────
    yearRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 4,
    },
    yearNavBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    chevronLeft: {
      transform: [{ rotate: "180deg" }],
    },

    // ── Month Grid ──────────────────────────────────────────
    monthGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: 8,
    },
    monthCell: {
      width: "23.5%",
      alignItems: "center",
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "transparent",
    },

    // ── Day Grid (full month) ───────────────────────────────
    dayGrid: {
      gap: 4,
    },
    dayGridRow: {
      flexDirection: "row",
    },
    dayGridCell: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 2,
    },
    dayHeaderCell: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 6,
    },
    dayCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
  });
