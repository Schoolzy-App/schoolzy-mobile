import React, { useCallback, useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { DynamicStateItem, StudentCard } from "@/components";
import type { DynamicStateData } from "@/components/DynamicStateItem";
import { BottomSection, QueryState, ScreenTemplate, Text } from "@/components/ui";
import { Icons } from "@/constants";
import { useStudentProfile, useStyles } from "@/hooks";
import type { RootStackScreenProps } from "@/navigation/types";
import { selectLatestStates } from "@/services/mappers";

// ─── Quick‑action grid config ────────────────────────────────────────────────
type QuickActionKey =
  | "finances"
  | "reports"
  | "wellness"
  | "agenda"
  | "meals"
  | "timesheet";

const QUICK_ACTIONS: {
  key: QuickActionKey;
  label: string;
  Icon: React.FC<{ width?: number; height?: number }>;
}[] = [
  { key: "finances", label: "Finances", Icon: Icons.FinanceIcon },
  { key: "reports", label: "Reports", Icon: Icons.ReportIcon },
  { key: "wellness", label: "Wellness", Icon: Icons.WellnessIcon },
  { key: "agenda", label: "Agenda", Icon: Icons.AgendaIcon },
  { key: "meals", label: "Meals", Icon: Icons.MealsIcon },
  { key: "timesheet", label: "Timesheet", Icon: Icons.AgendaIcon },
];

type Props = RootStackScreenProps<"StudentProfile">;

export default function StudentProfileScreen({ navigation, route }: Props) {
  const styles = useStyles(createStyles);

  const {
    studentSeasonId,
    name,
    year,
    activeBus = false,
    allergies = "N/A",
    bloodType = "N/A",
    attendance = "N/A",
    avatarIcon = Icons.GirlAvatar,
  } = route.params;

  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useStudentProfile(studentSeasonId);

  // Prefer live profile data; fall back to the params the list passed in so the
  // header renders instantly instead of waiting on the request.
  const displayName = profile?.name || name;
  const displayYear = profile?.year || year;
  // Gender arrives with the profile, so the avatar corrects itself once loaded.
  const displayAvatar = profile
    ? profile.gender === "male"
      ? Icons.BoyAvatar
      : Icons.GirlAvatar
    : avatarIcon;

  const latestEvents = useMemo(
    () => selectLatestStates(profile?.latest, String(studentSeasonId)),
    [profile?.latest, studentSeasonId],
  );

  // ── Dispatch a quick-action tap to the matching screen ──────────────────
  const handleQuickAction = useCallback(
    (key: QuickActionKey) => {
      switch (key) {
        case "reports":
          navigation.navigate("Reports", {
            studentName: displayName,
            studentSeasonId,
          });
          return;
        case "wellness":
          navigation.navigate("Wellness", {
            studentName: displayName,
            studentSeasonId,
            year: displayYear,
            activeBus,
            allergies,
            bloodType,
            attendance,
            avatarIcon,
          });
          return;
        case "agenda":
          navigation.navigate("Agenda", {
            studentName: displayName,
            studentSeasonId,
          });
          return;
        case "timesheet":
          navigation.navigate("Timesheet", {
            studentName: displayName,
            studentSeasonId,
          });
          return;
        case "meals":
          navigation.navigate("Meals", {
            studentName: displayName,
            studentSeasonId,
          });
          return;
        case "finances":
          navigation.navigate("Finances", {
            studentName: displayName,
            studentSeasonId,
          });
          return;
      }
    },
    [
      navigation,
      displayName,
      displayYear,
      studentSeasonId,
      activeBus,
      allergies,
      bloodType,
      attendance,
      avatarIcon,
    ],
  );

  // ── Dispatch a "Latest" event tap to its natural destination ────────────
  const handleEventPress = useCallback(
    (event: DynamicStateData) => {
      switch (event.type) {
        case "medical":
        case "emergency":
          navigation.navigate("Wellness", {
            studentName: displayName,
            studentSeasonId,
            year: displayYear,
            activeBus,
            allergies,
            bloodType,
            attendance,
            avatarIcon,
          });
          return;
        case "homework":
          navigation.navigate("Agenda", {
            studentName: displayName,
            studentSeasonId,
          });
          return;
        case "payment":
          navigation.navigate("Finances", {
            studentName: displayName,
            studentSeasonId,
          });
          return;
        case "success":
          // Info-only state — no destination
          return;
      }
    },
    [
      navigation,
      displayName,
      displayYear,
      studentSeasonId,
      activeBus,
      allergies,
      bloodType,
      attendance,
      avatarIcon,
    ],
  );

  return (
    <ScreenTemplate title="Student Profile">
      {/* ── Student Card ──────────────────────────────────────────────── */}
      <StudentCard
        name={displayName}
        year={displayYear}
        activeBus={activeBus}
        allergies={allergies}
        bloodType={bloodType}
        attendance={attendance}
        avatarIcon={displayAvatar}
      />

      {/* ── Quick Actions Grid ────────────────────────────────────────── */}
      <View style={styles.actionsGrid}>
        {QUICK_ACTIONS.map((action) => (
          <QuickAction
            key={action.key}
            action={action}
            onPress={handleQuickAction}
            style={styles.actionItem}
          />
        ))}
      </View>

      {/* ── Latest Section ────────────────────────────────────────────── */}
      <BottomSection title={`Latest For ${displayName.split(" ")[0]}`}>
        <QueryState
          isLoading={isLoading}
          error={error}
          isEmpty={!latestEvents.length}
          emptyMessage="Nothing new right now"
          onRetry={refetch}
        >
          {latestEvents.map((event) => (
            <View key={event.id} style={styles.latestItem}>
              <DynamicStateItem
                {...event}
                onPress={
                  event.type === "success"
                    ? undefined
                    : () => handleEventPress(event)
                }
              />
            </View>
          ))}
        </QueryState>
      </BottomSection>
    </ScreenTemplate>
  );
}

// ─── Memoized grid cell ──────────────────────────────────────────────────────
// Keeps each tile from re-rendering when unrelated screen state changes.
interface QuickActionProps {
  action: (typeof QUICK_ACTIONS)[number];
  onPress: (key: QuickActionKey) => void;
  style: object;
}

const QuickAction = React.memo<QuickActionProps>(
  ({ action, onPress, style }) => (
    <Pressable style={style} onPress={() => onPress(action.key)}>
      <action.Icon width={32} height={32} />
      <Text variant="label3" weight="medium">
        {action.label}
      </Text>
    </Pressable>
  ),
);
QuickAction.displayName = "QuickAction";

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    // ── Quick Actions ────────────────────────────────────────
    actionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      padding: 16,
      gap: 12,
      width: "100%",
    },
    actionItem: {
      width: "30%",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingVertical: 16,
      gap: 8,
    },

    // ── Latest Section ───────────────────────────────────────
    latestItem: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
  });
