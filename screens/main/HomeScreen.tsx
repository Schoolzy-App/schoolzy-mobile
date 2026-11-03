import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { CustomizeQuickActions, ParentHeader } from "@/components";
import AttentionCard from "@/components/home/AttentionCard";
import type { QuickActionDraft } from "@/components/home/CustomizeQuickActions";
import {
  ChildPicker,
  ChildSummaryList,
  GlanceGrid,
  NewsletterList,
  QuickActionsRow,
  TodayList,
  UpcomingList,
} from "@/components/home/HomeSections";
import { QueryState, ScreenTemplate } from "@/components/ui";
import { Radius, Spacing } from "@/constants/tokens";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCurrentUser,
  useParentDashboard,
  useQuickActionsCatalog,
  useResetQuickActions,
  useSaveQuickActions,
  useStyles,
} from "@/hooks";
import type { RootStackParamList } from "@/navigation/types";
import {
  isQuickActionsCleared,
  setQuickActionsCleared,
} from "@/services/quickActionsPreference";
import type {
  DashboardAttention,
  DashboardChild,
  DashboardUpcoming,
  GlanceTile,
  QuickAction,
} from "@/services/mappers";

/**
 * Catalogue codes that don't need a child.
 *
 * The payload's `scope` is authoritative; this is only the fallback for a
 * code the server sends without one.
 */
const PARENT_ONLY = new Set([
  "add-request",
  "add-complaint",
  "requests",
  "newsletter",
  "update-data",
  "change-password",
]);

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const styles = useStyles(createStyles);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Name and gender for the header still come from the session, so the
  // greeting renders before the dashboard resolves.
  const { user } = useAuth();
  const { data: currentUser } = useCurrentUser();

  const { data, isLoading, error, refetch } = useParentDashboard();

  const [editing, setEditing] = useState(false);
  /**
   * `undefined` until the stored preference is read. The server hands back
   * its defaults for a parent who cleared the list, so until this resolves
   * we don't know whether to show those or the empty line.
   */
  const [cleared, setCleared] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    isQuickActionsCleared().then((value) => {
      if (!cancelled) setCleared(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Only fetched once the editor is open — nothing on Home needs it.
  const catalog = useQuickActionsCatalog(editing);
  const { mutateAsync: saveQuickActions, isPending: isSavingActions } =
    useSaveQuickActions();
  const { mutateAsync: resetQuickActions } = useResetQuickActions();

  /** Set while waiting for the parent to pick a child for an action. */
  const [pending, setPending] = useState<{
    label: string;
    run: (child: DashboardChild) => void;
  } | null>(null);

  const children = useMemo(() => data?.children ?? [], [data?.children]);

  const pinnedNames = useMemo(() => {
    const map: Record<number, string> = {};
    children.forEach((child) => {
      map[child.studentId] = child.name;
    });
    return map;
  }, [children]);

  const childBySeason = useCallback(
    (studentId: number | null) =>
      children.find((c) => c.studentId === studentId) ?? null,
    [children],
  );

  // ── Destinations ────────────────────────────────────────────────────────
  const openForChild = useCallback(
    (code: string, child: DashboardChild) => {
      const params = {
        studentName: child.name,
        studentSeasonId: child.studentSeasonId,
      };

      switch (code) {
        case "pay-fees":
        case "finance":
        case "finances":
        case "wallet":
        case "top-up":
          navigation.navigate("Finances", params);
          return;
        case "reports":
          navigation.navigate("Reports", params);
          return;
        case "wellness":
          navigation.navigate("Wellness", {
            ...params,
            year: child.grade,
            activeBus: child.busAssigned,
          });
          return;
        case "agenda":
        case "attendance":
        case "homework":
          navigation.navigate("Agenda", params);
          return;
        case "meals":
          navigation.navigate("Meals", params);
          return;
        case "timesheet":
          navigation.navigate("Timesheet", params);
          return;
        default:
          // Unknown code: the student profile is the safe landing place.
          navigation.navigate("StudentProfile", {
            id: String(child.studentSeasonId),
            studentSeasonId: child.studentSeasonId,
            name: child.name,
            year: child.grade,
            activeBus: child.busAssigned,
          });
      }
    },
    [navigation],
  );

  const openForParent = useCallback(
    (code: string): boolean => {
      switch (code) {
        case "add-request":
          navigation.navigate("AddRequest");
          return true;
        case "requests":
        case "my-requests":
          navigation.navigate("Request");
          return true;
        case "add-complaint":
          navigation.navigate("AddComplaint");
          return true;
        case "complaints":
          navigation.navigate("Complaints");
          return true;
        case "newsletter":
          navigation.navigate("Newsletter");
          return true;
        case "update-data":
          navigation.navigate("EditParentInfo");
          return true;
        case "change-password":
          navigation.navigate("ChangePassword");
          return true;
        default:
          return false;
      }
    },
    [navigation],
  );

  /**
   * Routes a tap by catalogue code.
   *
   * A student-scoped action opens straight away when it is pinned or there is
   * only one child; otherwise it asks which child first — the alternative is
   * silently guessing on the parent's behalf.
   */
  const runAction = useCallback(
    (code: string, label: string, studentId: number | null) => {
      if (openForParent(code)) return;

      const direct =
        childBySeason(studentId) ?? (children.length === 1 ? children[0] : null);

      if (direct) {
        openForChild(code, direct);
        return;
      }
      if (children.length === 0) return;

      setPending({
        label,
        run: (child) => openForChild(code, child),
      });
    },
    [openForParent, childBySeason, children, openForChild],
  );

  const handleQuickAction = useCallback(
    (action: QuickAction) => {
      const parentScoped =
        !action.isStudentScoped || PARENT_ONLY.has(action.code);
      if (parentScoped && openForParent(action.code)) return;
      runAction(action.code, action.label, action.pinnedStudentId);
    },
    [openForParent, runAction],
  );

  const handleAttention = useCallback(
    (item: DashboardAttention) =>
      runAction(item.actionCode, item.title, item.studentId),
    [runAction],
  );

  const handleTile = useCallback(
    (tile: GlanceTile) => runAction(tile.code, tile.label, tile.studentId),
    [runAction],
  );

  const handleUpcoming = useCallback(
    (item: DashboardUpcoming) => {
      const code = item.type === "Payment" ? "pay-fees" : "agenda";
      runAction(code, item.title, item.studentId);
    },
    [runAction],
  );

  const handleChild = useCallback(
    (child: DashboardChild) =>
      navigation.navigate("StudentProfile", {
        id: String(child.studentSeasonId),
        studentSeasonId: child.studentSeasonId,
        name: child.name,
        year: child.grade,
        activeBus: child.busAssigned,
      }),
    [navigation],
  );

  const handleSaveActions = useCallback(
    async (items: QuickActionDraft[]) => {
      // Saving an empty list can't be stored server-side — the API treats it
      // as "restore defaults" — so the choice is remembered on the device and
      // the section is hidden locally.
      await setQuickActionsCleared(items.length === 0);
      setCleared(items.length === 0);

      try {
        await saveQuickActions({
          items: items.map((item, index) => ({
            code: item.code,
            order: index + 1,
            pinnedStudentId: item.pinnedStudentId,
          })),
        });
      } catch {
        // The mutation surfaces its own error state; closing anyway would
        // hide it, so the sheet stays open.
        return;
      }
      setEditing(false);
    },
    [saveQuickActions],
  );

  const handleResetActions = useCallback(async () => {
    await setQuickActionsCleared(false);
    setCleared(false);
    await resetQuickActions();
    setEditing(false);
  }, [resetQuickActions]);

  const handleNotifications = useCallback(
    () => navigation.navigate("Notification"),
    [navigation],
  );

  const handlePick = useCallback(
    (child: DashboardChild) => {
      pending?.run(child);
      setPending(null);
    },
    [pending],
  );

  const handleNewsletters = useCallback(
    () => navigation.navigate("Newsletter"),
    [navigation],
  );

  const parentName =
    data?.parent.name || currentUser?.name || user?.name || "";

  return (
    <ScreenTemplate
      scrollHeader
      headerStyle={styles.header}
      headerContent={
        <View style={styles.headerInner}>
          <ParentHeader
            parentName={parentName}
            initials={data?.parent.initials || initialsOf(parentName)}
            onNotificationPress={handleNotifications}
            unreadCount={data?.parent.unreadNotifications}
          />
          {/* Held back until the dashboard loads, so the quiet state doesn't
              flash before real attention items arrive. */}
          {data ? (
            <AttentionCard items={data.attention} onAction={handleAttention} />
          ) : null}
        </View>
      }
      style={styles.screen}
    >
      <View style={styles.body}>
        <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
          {data ? (
            <>
              {/* The section always renders so Edit stays reachable. A
                  parent who cleared their list gets the empty line, not the
                  defaults the server returns for them. */}
              <QuickActionsRow
                actions={cleared ? [] : data.quickActions}
                ready={cleared !== undefined}
                pinnedNames={pinnedNames}
                onSelect={handleQuickAction}
                onCustomise={() => setEditing(true)}
              />

              <ChildSummaryList
                students={data.children}
                showFinance={data.features.finance}
                onSelect={handleChild}
              />

              {data.glance.length ? (
                <GlanceGrid tiles={data.glance} onSelect={handleTile} />
              ) : null}

              <NewsletterList
                items={data.newsletters}
                onSelect={handleNewsletters}
                onSeeAll={handleNewsletters}
              />

              <TodayList
                tiles={data.today}
                date={data.todayDate}
                onSelect={handleTile}
              />

              <UpcomingList
                items={data.upcoming}
                onSelect={handleUpcoming}
              />
            </>
          ) : null}
        </QueryState>
      </View>

      <CustomizeQuickActions
        visible={editing}
        current={cleared ? [] : (data?.quickActions ?? [])}
        catalog={catalog.data ?? []}
        students={children}
        isSaving={isSavingActions}
        onSave={handleSaveActions}
        onReset={handleResetActions}
        onClose={() => setEditing(false)}
      />

      <ChildPicker
        visible={!!pending}
        actionLabel={pending?.label}
        students={children}
        onSelect={handlePick}
        onClose={() => setPending(null)}
      />
    </ScreenTemplate>
  );
}

/** Fallback for the avatar while the dashboard (which sends them) loads. */
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    screen: {
      backgroundColor: colors.background,
    },
    header: {
      borderBottomLeftRadius: Radius.header,
      borderBottomRightRadius: Radius.header,
      paddingBottom: 15,
    },
    headerInner: {
      width: "100%",
      paddingHorizontal: Spacing.screenX,
      gap: 12,
    },
    body: {
      width: "100%",
      paddingHorizontal: Spacing.screenX,
      paddingTop: Spacing.contentTop.home,
      paddingBottom: 24,
      gap: Spacing.sectionGap.home,
    },
  });
