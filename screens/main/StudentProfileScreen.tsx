import { CommonActions } from "@react-navigation/native";
import {
  ArrowUUpLeftIcon,
  BookOpenIcon,
  BowlFoodIcon,
  ClipboardTextIcon,
  ClockIcon,
  CurrencyCircleDollarIcon,
  GearSixIcon,
  HeartIcon,
  type Icon,
} from "phosphor-react-native";
import React, { useCallback } from "react";
import { Dimensions, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ColorPalette } from "@/apps";
import {
  FinanceSummaryCard,
  LatestActivityList,
  NeedsAttentionList,
  StudentSummaryCard,
  TodayTiles,
} from "@/components";
import { BottomSection, QueryState, ScreenTemplate, Text } from "@/components/ui";
import { Icons } from "@/constants";
import { TAB_BAR_HEIGHT } from "@/constants/layout";
import {
  IconSize,
  Opacity,
  Palette,
  Radius,
  Size,
  Spacing,
  Type,
} from "@/constants/tokens";
import {
  useLatestActivities,
  useNeedsAttention,
  useStudentFinancialSummary,
  useStudentProfile,
  useStudentsRaw,
  useStudentToday,
  useWalletBalance,
} from "@/hooks";
import { useStyles } from "@/hooks";
import { StackTabBar } from "@/navigation/FloatingTabBar";
import type { RootStackScreenProps } from "@/navigation/types";
import { studentsApi } from "@/services/api";
import type { AttentionItem, LatestActivity } from "@/services/mappers";

// ─── Module grid config ──────────────────────────────────────────────────────
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
  Icon: Icon;
  color: string;
}[] = [
  { key: "finances", label: "Finances", Icon: CurrencyCircleDollarIcon, color: Palette.module.finance.solid },
  { key: "reports", label: "Reports", Icon: ClipboardTextIcon, color: Palette.module.reports.solid },
  { key: "wellness", label: "Wellness", Icon: HeartIcon, color: Palette.module.wellness.solid },
  { key: "agenda", label: "Agenda", Icon: BookOpenIcon, color: Palette.module.agenda.solid },
  { key: "meals", label: "Meals", Icon: BowlFoodIcon, color: Palette.module.meals.solid },
  { key: "timesheet", label: "Timesheet", Icon: ClockIcon, color: Palette.module.timesheet.solid },
];

const GRID_COLUMNS = 3;

type Props = RootStackScreenProps<"StudentProfile">;

export default function StudentProfileScreen({ navigation, route }: Props) {
  const styles = useStyles(createStyles);
  const insets = useSafeAreaInsets();

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

  // Three independent dashboard sections. Separate queries so one slow or
  // failing section never holds up the others.
  const today = useStudentToday(studentSeasonId);
  const attention = useNeedsAttention(studentSeasonId);
  const latest = useLatestActivities(studentSeasonId);

  // Modules the school hasn't switched on are left out. Until the profile
  // loads everything shows, so nothing flickers out of a correct grid.
  const showMeals = profile?.features.meals ?? true;
  const showFinance = profile?.features.finance ?? true;
  const modules = QUICK_ACTIONS.filter(
    (action) =>
      (action.key !== "meals" || showMeals) &&
      (action.key !== "finances" || showFinance),
  );

  const finance = useStudentFinancialSummary(studentSeasonId, showFinance);
  const wallet = useWalletBalance(studentSeasonId, showFinance);

  // Today's attendance status only comes on the students list — a cached
  // request the rest of the app already makes.
  const { data: students } = useStudentsRaw();
  const attendanceToday = students?.find(
    (s) => s.studentSeasonId === studentSeasonId,
  )?.attendance;

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

  const goToFinances = useCallback(
    () =>
      navigation.navigate("Finances", {
        studentName: displayName,
        studentSeasonId,
      }),
    [navigation, displayName, studentSeasonId],
  );

  // No dedicated settings screen is registered; Account is where the app's
  // settings live, so the header's gear opens that tab.
  const goToSettings = useCallback(
    () =>
      navigation.dispatch(
        CommonActions.navigate({ name: "Main", params: { screen: "Account" } }),
      ),
    [navigation],
  );

  const tileWidth = Math.floor(
    (Dimensions.get("window").width -
      Spacing.screenX * 2 -
      Spacing.gridGap.modulesColumn * (GRID_COLUMNS - 1)) /
      GRID_COLUMNS,
  );

  return (
    <View style={styles.root}>
      <ScreenTemplate
        scrollHeader
        headerStyle={styles.header}
        headerContent={
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={8}
              style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
            >
              <ArrowUUpLeftIcon
                weight="bold"
                size={IconSize.header}
                color={Palette.text.primary}
              />
            </Pressable>
            <Text style={Type.headerTitle} color={Palette.text.onBrand}>
              Student Profile
            </Text>
            <Pressable
              onPress={goToSettings}
              hitSlop={8}
              style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
            >
              <GearSixIcon size={20} color={Palette.text.primary} />
            </Pressable>
          </View>
        }
        // The Latest sheet runs to the screen bottom, under the tab bar.
        contentStyle={styles.content}
      >
        <View style={styles.body}>
          <StudentSummaryCard
            name={displayName}
            year={displayYear}
            hasBus={activeBus}
            attendanceToday={attendanceToday}
          />

          {/* ── Modules ──────────────────────────────────────────────── */}
          <View style={styles.grid}>
            {modules.map((action) => (
              <QuickAction
                key={action.key}
                action={action}
                width={tileWidth}
                onPress={handleQuickAction}
              />
            ))}
          </View>

          {/* ── Needs attention — hides itself when there's nothing ────── */}
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

          {/* ── Today ────────────────────────────────────────────────── */}
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

          {/* ── Finance summary ──────────────────────────────────────── */}
          {showFinance && finance.data ? (
            <FinanceSummaryCard
              outstanding={finance.data.totalOutstanding}
              overdue={finance.data.overdueAmount}
              currency={finance.data.currency}
              wallet={wallet.data?.amount}
              onPress={goToFinances}
            />
          ) : null}
        </View>

        {/* ── Latest ─────────────────────────────────────────────────── */}
        <BottomSection
          title={`Latest For ${displayName.split(" ")[0]}`}
          bottomInset={TAB_BAR_HEIGHT + insets.bottom}
        >
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

      <StackTabBar active="Home" />
    </View>
  );
}

// ─── Memoized grid cell ──────────────────────────────────────────────────────
// Keeps each tile from re-rendering when unrelated screen state changes.
interface QuickActionProps {
  action: (typeof QUICK_ACTIONS)[number];
  width: number;
  onPress: (key: QuickActionKey) => void;
}

const QuickAction = React.memo<QuickActionProps>(({ action, width, onPress }) => {
  const styles = useStyles(createStyles);
  return (
    <Pressable
      style={({ pressed }) => [styles.tile, { width }, pressed && styles.pressed]}
      onPress={() => onPress(action.key)}
    >
      <action.Icon weight="fill" size={IconSize.module} color={action.color} />
      <Text style={Type.moduleLabel} numberOfLines={1}>
        {action.label}
      </Text>
    </Pressable>
  );
});
QuickAction.displayName = "QuickAction";

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    header: {
      minHeight: Size.headerHeight.studentDashboard,
      borderBottomLeftRadius: Radius.header,
      borderBottomRightRadius: Radius.header,
      paddingBottom: 10,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.screenX,
    },
    headerButton: {
      width: Size.headerButton,
      height: Size.headerButton,
      borderRadius: Size.headerButton / 2,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    pressed: {
      opacity: Opacity.pressed,
    },
    content: {
      paddingBottom: 0,
    },
    body: {
      width: "100%",
      paddingHorizontal: Spacing.screenX,
      paddingTop: Spacing.contentTop.studentDashboard,
      paddingBottom: 15,
      gap: Spacing.sectionGap.studentDashboard,
    },

    // ── Modules ──────────────────────────────────────────────
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      rowGap: Spacing.gridGap.modulesRow,
      columnGap: Spacing.gridGap.modulesColumn,
    },
    tile: {
      height: Size.moduleTile,
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
      backgroundColor: colors.surface,
      borderRadius: Radius.moduleTile,
    },
  });
