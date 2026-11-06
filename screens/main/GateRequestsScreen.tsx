import {
  CalendarBlankIcon,
  ClockIcon,
  DoorOpenIcon,
  PlusIcon,
  UserIcon,
} from "phosphor-react-native";
import React, { memo, useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import FormButton from "@/components/FormButton";
import GateStatusChip from "@/components/gateRequests/GateStatusChip";
import { QueryState, ScreenTemplate, Text } from "@/components/ui";
import { Palette, Radius, Size, Spacing, Type } from "@/constants/tokens";
import { useGateRequests } from "@/hooks";
import type { RootStackScreenProps } from "@/navigation/types";
import type { GateRequest } from "@/services/mappers";
import { formatDate } from "@/utils/format";

type Props = RootStackScreenProps<"GateRequests">;

/** Gate Requests list (spec §6.5.1): Today / Earlier, newest first. */
export default function GateRequestsScreen({ navigation }: Props) {
  const { data, isLoading, error, refetch } = useGateRequests();

  const handleOpen = useCallback(
    (request: GateRequest) =>
      navigation.navigate("GateRequestDetails", { requestId: request.id }),
    [navigation],
  );

  const handleAdd = useCallback(
    () => navigation.navigate("AddGateRequest"),
    [navigation],
  );

  const today = data?.today ?? [];
  const earlier = data?.earlier ?? [];
  const isEmpty = !isLoading && !error && today.length + earlier.length === 0;

  return (
    <ScreenTemplate
      variant="form"
      title="Gate Requests"
      headerStyle={styles.header}
      bottomContent={
        isEmpty ? undefined : (
          <FormButton label="New request" Icon={PlusIcon} onPress={handleAdd} />
        )
      }
    >
      <View style={styles.body}>
        <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
          {isEmpty ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <DoorOpenIcon size={30} color={Palette.action.primary} />
              </View>
              <Text style={Type.emptyTitle}>No gate requests yet</Text>
              <Text style={styles.emptyBody} color={Palette.text.secondary}>
                Picking your child up early, or sending someone else to collect
                them? Let the school know here, and follow its confirmation.
              </Text>
              <FormButton
                label="New request"
                Icon={PlusIcon}
                onPress={handleAdd}
                height={48}
              />
            </View>
          ) : (
            <>
              {today.length ? (
                <Section title="Today" items={today} onSelect={handleOpen} />
              ) : null}
              {earlier.length ? (
                <Section
                  title="Earlier"
                  items={earlier}
                  onSelect={handleOpen}
                  showDate
                />
              ) : null}
            </>
          )}
        </QueryState>
      </View>
    </ScreenTemplate>
  );
}

function Section({
  title,
  items,
  onSelect,
  showDate,
}: {
  title: string;
  items: GateRequest[];
  onSelect: (request: GateRequest) => void;
  showDate?: boolean;
}) {
  return (
    <View style={styles.section}>
      <Text style={[Type.groupLabel, styles.sectionLabel]} color={Palette.text.tertiary}>
        {title}
      </Text>
      {items.map((request) => (
        <GateRequestCard
          key={request.id}
          request={request}
          onSelect={onSelect}
          showDate={showDate}
        />
      ))}
    </View>
  );
}

const GateRequestCard = memo(function GateRequestCard({
  request,
  onSelect,
  showDate,
}: {
  request: GateRequest;
  onSelect: (request: GateRequest) => void;
  showDate?: boolean;
}) {
  return (
    <Pressable
      onPress={() => onSelect(request)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardTop}>
        <Text style={[Type.cardTitle, styles.flex]} numberOfLines={1}>
          {request.studentName}
        </Text>
        <GateStatusChip status={request.status} />
      </View>

      <View style={styles.meta}>
        {request.collectPersonName ? (
          <View style={styles.metaItem}>
            <UserIcon size={15} color={Palette.text.secondary} />
            <Text style={Type.meta} color={Palette.text.secondary} numberOfLines={1}>
              {request.collectPersonName}
            </Text>
          </View>
        ) : null}
        {request.time ? (
          <View style={styles.metaItem}>
            <ClockIcon size={15} color={Palette.text.secondary} />
            <Text style={Type.meta} color={Palette.text.secondary}>
              {request.time}
            </Text>
          </View>
        ) : null}
        {showDate ? (
          <View style={styles.metaItem}>
            <CalendarBlankIcon size={15} color={Palette.text.secondary} />
            <Text style={Type.meta} color={Palette.text.secondary}>
              {formatDate(request.createdAt.toISOString())}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    paddingBottom: Spacing.form.headerPaddingBottom,
  },
  body: {
    width: "100%",
    padding: Spacing.form.bodyPadding,
    gap: Spacing.form.bodyGap.form,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    marginHorizontal: 4,
  },
  card: {
    backgroundColor: Palette.surface.card,
    borderRadius: Radius.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 9,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardPressed: {
    backgroundColor: Palette.surface.pressedRow,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 4,
    columnGap: 14,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  emptyCard: {
    alignItems: "center",
    gap: 12,
    backgroundColor: Palette.surface.card,
    borderRadius: Radius.card,
    paddingVertical: 40,
    paddingHorizontal: 22,
  },
  emptyIcon: {
    width: Size.emptyIconCircle,
    height: Size.emptyIconCircle,
    borderRadius: Size.emptyIconCircle / 2,
    backgroundColor: Palette.action.tint8,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});
