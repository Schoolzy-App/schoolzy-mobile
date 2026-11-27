import React from "react";
import { StyleSheet, View } from "react-native";

import { Text } from "@/components/ui";
import { Palette, Radius, Size, Type } from "@/constants/tokens";
import {
  consentLinkLabel,
  consentStatusLabel,
  type ConsentLinkKind,
  type ConsentStatus,
} from "@/services/mappers";

type Tone = { fg: string; tint: string };

/** Same shape as the gate / complaint status chips: a dot and a label on a tint. */
export function ToneChip({
  label,
  tone,
  dot = true,
  large,
}: {
  label: string;
  tone: Tone;
  dot?: boolean;
  large?: boolean;
}) {
  return (
    <View style={[styles.chip, large && styles.chipLarge, { backgroundColor: tone.tint }]}>
      {dot ? <View style={[styles.dot, { backgroundColor: tone.fg }]} /> : null}
      <Text
        style={[Type.statusChipText, large && styles.textLarge]}
        color={tone.fg}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const STATUS_TONE: Record<ConsentStatus, Tone> = {
  pending: Palette.status.warning,
  approved: Palette.status.success,
  declined: Palette.status.danger,
};

/** Approved = success, Declined = danger, Not answered = warning. */
export function ConsentStatusChip({
  status,
  large,
}: {
  status: ConsentStatus;
  large?: boolean;
}) {
  return (
    <ToneChip label={consentStatusLabel(status)} tone={STATUS_TONE[status]} large={large} />
  );
}

/** Trip / Club / Policy, neutral info tone without a dot. */
export function ConsentTypeChip({ kind }: { kind: ConsentLinkKind }) {
  return <ToneChip label={consentLinkLabel(kind)} tone={Palette.status.info} dot={false} />;
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
