import type { Icon } from "phosphor-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";

import { Text } from "@/components/ui";
import { Palette, Radius, Size, Type } from "@/constants/tokens";

/**
 * Subject colours (Timesheet spec). The API sends no colour, so the subject
 * name picks one from the design's table; anything else is grey.
 */
const SUBJECT_COLORS: { match: RegExp; color: string }[] = [
  { match: /math/i, color: "#4E7FD0" },
  { match: /english/i, color: "#800E37" },
  { match: /science|physic|chemi|biolog/i, color: "#2E8B3A" },
  { match: /arabic|عرب/i, color: "#C07A12" },
  { match: /\bpe\b|physical|sport/i, color: "#9437F0" },
];

export function subjectColor(subject: string): string {
  return SUBJECT_COLORS.find((s) => s.match.test(subject))?.color ?? Palette.text.tertiary;
}

/**
 * A friendly empty day: an icon, a line and a hint. Used when the school
 * hasn't put anything in the timetable or agenda for the selected day —
 * including schools that don't use the module at all.
 */
export function ScheduleEmpty({
  Icon,
  title,
  hint,
  plain,
}: {
  Icon: Icon;
  title: string;
  hint: string;
  /** Inside another card already: no card of its own. */
  plain?: boolean;
}) {
  return (
    <View style={[styles.empty, !plain && styles.card]}>
      <View style={styles.iconCircle}>
        <Icon size={28} color={Palette.text.tertiary} />
      </View>
      <Text style={Type.cardHeading} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.hint} color={Palette.text.tertiary}>
        {hint}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 30,
    paddingHorizontal: 22,
  },
  card: {
    backgroundColor: Palette.surface.card,
    borderRadius: Radius.card,
  },
  iconCircle: {
    width: Size.emptyIconCircle,
    height: Size.emptyIconCircle,
    borderRadius: Size.emptyIconCircle / 2,
    backgroundColor: Palette.form.emptyIconBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  hint: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
