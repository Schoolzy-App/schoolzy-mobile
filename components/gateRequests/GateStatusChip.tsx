import React from "react";
import { StyleSheet, View } from "react-native";

import { Text } from "@/components/ui";
import { Palette, Radius, Size, Type } from "@/constants/tokens";
import {
  gateStatusLabel,
  gateStatusTone,
  type GateRequestStatus,
  type GateStatusTone,
} from "@/services/mappers";

/**
 * Gate request status (spec §6.5): Pending = warning, Confirmed = success,
 * both Cancelled states and Expired = neutral. Same shape as the Complaints
 * status chip: a dot and a label on the tone's tint.
 */
const TONE: Record<GateStatusTone, { fg: string; tint: string }> = {
  warning: Palette.status.warning,
  success: Palette.status.success,
  neutral: Palette.status.neutral,
};

export default function GateStatusChip({
  status,
  large,
}: {
  status: GateRequestStatus;
  /** Detail screen size. */
  large?: boolean;
}) {
  const tone = TONE[gateStatusTone(status)];
  return (
    <View
      style={[styles.chip, large && styles.chipLarge, { backgroundColor: tone.tint }]}
    >
      <View style={[styles.dot, { backgroundColor: tone.fg }]} />
      <Text
        style={[Type.statusChipText, large && styles.textLarge]}
        color={tone.fg}
        numberOfLines={1}
      >
        {gateStatusLabel(status)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    height: Size.statusChip,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.statusChip,
  },
  chipLarge: {
    height: Size.statusChipLarge,
    paddingHorizontal: 11,
    borderRadius: 13,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  textLarge: {
    fontSize: 13,
    lineHeight: 16,
  },
});
