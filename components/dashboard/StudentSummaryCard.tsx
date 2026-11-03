import { BusIcon } from "phosphor-react-native";
import React, { memo } from "react";
import { StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { Text } from "@/components/ui";
import { Palette, Radius, Shadow, Size, Type } from "@/constants/tokens";
import { useStyles } from "@/hooks";

export interface StudentSummaryCardProps {
  name: string;
  year: string;
  hasBus: boolean;
  /** Today's status as the school recorded it ("Present"); hidden when empty. */
  attendanceToday?: string | null;
}

/**
 * The student card at the top of the Student Dashboard (spec §3).
 *
 * The design shows a bus status ("Dropped off") under the bus icon; the API
 * only says whether the student has a bus, so the icon stands alone.
 */
const StudentSummaryCard = memo<StudentSummaryCardProps>(
  ({ name, year, hasBus, attendanceToday }) => {
    const styles = useStyles(createStyles);
    const initial = name.trim().charAt(0).toUpperCase();
    const status = attendanceToday?.trim();
    // Only a recorded "present" is green; anything else reads as a warning.
    const present = /present/i.test(status ?? "");
    const tone = present ? Palette.status.success : Palette.status.danger;

    return (
      <View style={[styles.card, Shadow.card]}>
        <View style={styles.avatar}>
          <Text style={styles.initial} color={Palette.text.onBrand}>
            {initial}
          </Text>
        </View>

        <View style={styles.info}>
          <Text style={Type.cardTitle} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.meta}>
            {year ? (
              <Text style={Type.meta} color={Palette.text.tertiary} numberOfLines={1}>
                {year}
              </Text>
            ) : null}
            {status ? (
              <View style={[styles.pill, { backgroundColor: tone.tint }]}>
                <View style={[styles.dot, { backgroundColor: tone.solid }]} />
                <Text style={Type.pill} color={tone.fg}>
                  {status}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {hasBus ? <BusIcon weight="bold" size={22} color={Palette.nav.active} /> : null}
      </View>
    );
  },
);

StudentSummaryCard.displayName = "StudentSummaryCard";
export default StudentSummaryCard;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    card: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
      padding: 15,
      borderRadius: Radius.card,
      backgroundColor: colors.surface,
    },
    avatar: {
      width: Size.avatar.student,
      height: Size.avatar.student,
      borderRadius: Size.avatar.student / 2,
      backgroundColor: Palette.avatar.children[0],
      alignItems: "center",
      justifyContent: "center",
    },
    initial: {
      fontSize: 20,
      fontWeight: "600",
      lineHeight: 24,
    },
    info: {
      flex: 1,
      gap: 2,
    },
    meta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    pill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
  });
