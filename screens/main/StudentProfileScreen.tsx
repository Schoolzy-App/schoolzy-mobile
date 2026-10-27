import React, { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import {
  LatestActivityList,
  NeedsAttentionList,
  StudentCard,
  TodayTiles,
} from "@/components";
import { BottomSection, QueryState, ScreenTemplate, Text } from "@/components/ui";
import { Icons } from "@/constants";
import {
  useLatestActivities,
  useNeedsAttention,
  useStudentProfile,
  useStudentToday,
} from "@/hooks";
import { useStyles } from "@/hooks";
import type { RootStackScreenProps } from "@/navigation/types";
import { studentsApi } from "@/services/api";
import type { AttentionItem, LatestActivity } from "@/services/mappers";

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

  // Only the header reads this now — Latest comes from the dashboard
  // endpoint, so the profile request no longer gates any section's state.
  const { data: profile } = useStudentProfile(studentSeasonId);

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

  // Three independent dashboard sections. Separate queries so one slow or
  // failing section never holds up the others.
  const today = useStudentToday(studentSeasonId);
  const attention = useNeedsAttention(studentSeasonId);
  const latest = useLatestActivities(studentSeasonId);

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

  /** Wellness takes the whole student header, so it gets its own helper. */
  const goToWellness = useCallback(
    () =>
      navigation.navigate("Wellness", {
        studentName: displayName,
        studentSeasonId,
        year: displayYear,
        activeBus,
        allergies,
        bloodType,
        attendance,
        avatarIcon,
      }),
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

  /**
   * Both dashboard lists route by `navigation.destination`, never by the
   * activity's `type` — the guides are explicit that type is for display and
   * destination is the stable contract. Unknown destinations are ignored
   * rather than crashing, so a new backend value degrades to an inert row.
   */
  const handleDestination = useCallback(
    async (destination: string, id: number, title: string) => {
      switch (destination) {
        case "StudentReport":
          // `id` is the StudentReport id, which is exactly what the report
          // file endpoint is keyed on — so this opens the document itself
          // rather than dropping the parent on the reports list.
          navigation.navigate("Pdf", {
            title,
            uri: studentsApi.getReportFileUrl(studentSeasonId, id),
            headers: await studentsApi.getReportFileHeaders(),
          });
          return;

        case "HealthProfile":
          goToWellness();
          return;

        case "StudentPayments":
        case "WalletTopUp":
          navigation.navigate("Finances", {
            studentName: displayName,
            studentSeasonId,
          });
          return;

        case "CafeteriaMeals":
          navigation.navigate("Meals", {
            studentName: displayName,
            studentSeasonId,
          });
          return;

        // ⚠️ HomeworkDetails, TeacherExamGrade and TeacherExamDetails have no
        // screens yet — their endpoints are part of a refactor the guide
        // itself flags as unverified. Agenda is where homework and exams live
        // today, so taps land somewhere useful instead of doing nothing.
        case "HomeworkDetails":
        case "TeacherExamGrade":
        case "TeacherExamDetails":
          navigation.navigate("Agenda", {
            studentName: displayName,
            studentSeasonId,
          });
          return;

        default:
          return;
      }
    },
    [navigation, studentSeasonId, displayName, goToWellness],
  );

  const handleAttentionPress = useCallback(
    (item: AttentionItem) =>
      handleDestination(item.destination, item.navigationId, item.title),
    [handleDestination],
  );

  const handleActivityPress = useCallback(
    (activity: LatestActivity) =>
      handleDestination(
        activity.destination,
        activity.navigationId,
        activity.title,
      ),
    [handleDestination],
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

      {/* ── Needs Attention ───────────────────────────────────────────
          Above the module grid: these are the things the parent may need to
          act on today, so they shouldn't sit below six navigation tiles. */}
      {attention.isLoading || attention.data ? (
        <View style={styles.section}>
          <Text variant="label2" weight="semiBold" style={styles.sectionTitle}>
            Needs Attention
          </Text>
          <View style={styles.sectionBody}>
            <QueryState
              isLoading={attention.isLoading}
              error={attention.error}
              onRetry={attention.refetch}
            >
              <NeedsAttentionList
                data={attention.data}
                onSelect={handleAttentionPress}
              />
            </QueryState>
          </View>
        </View>
      ) : null}

      {/* ── Today ─────────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text variant="label2" weight="semiBold" style={styles.sectionTitle}>
          Today
        </Text>
        <QueryState
          isLoading={today.isLoading}
          error={today.error}
          onRetry={today.refetch}
        >
          {today.data ? (
            <TodayTiles
              tiles={today.data.tiles}
              isPartial={today.data.isPartial}
            />
          ) : null}
        </QueryState>
      </View>

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
          isLoading={latest.isLoading}
          error={latest.error}
          isEmpty={!latest.data?.length}
          emptyMessage="Nothing new right now"
          onRetry={latest.refetch}
        >
          <LatestActivityList
            activities={latest.data ?? []}
            onSelect={handleActivityPress}
          />
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

    // ── Dashboard sections ───────────────────────────────────
    section: {
      width: "100%",
      paddingTop: 16,
      gap: 10,
    },
    // Only the title and body are inset: TodayTiles scrolls edge to edge, so
    // its own padding lives inside the component.
    sectionTitle: {
      paddingHorizontal: 16,
    },
    sectionBody: {
      paddingHorizontal: 16,
    },

    // ── Latest Section ───────────────────────────────────────
    latestItem: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
  });
