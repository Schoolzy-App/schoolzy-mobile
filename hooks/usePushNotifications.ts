import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import type { RootStackParamList } from "@/navigation/types";
import {
  getInitialNotification,
  onForegroundMessage,
  onNotificationOpened,
} from "@/services/notifications";
import type { PushMessage } from "@/types/api";
import { queryClient } from "@/providers/QueryProvider";
import { queryKeys } from "@/hooks/queries/queryKeys";
import { createLogger } from "@/utils/logger";

const log = createLogger("push:route");

/**
 * Maps `data.type` from the push payload to a destination.
 *
 * ⚠️ The set of `type` values the backend sends has not been documented yet;
 * these are matched loosely (substring, case-insensitive) so a near-miss like
 * "PaymentDue" still routes correctly. Tighten once the list is confirmed.
 */
export function resolveDestination(message: PushMessage): {
  screen: keyof RootStackParamList;
  params?: object;
} | null {
  const type = message.data.type?.toLowerCase() ?? "";
  const referenceId = message.data.referenceId;
  const studentSeasonId = referenceId ? Number(referenceId) : undefined;
  const hasStudent = typeof studentSeasonId === "number" && !Number.isNaN(studentSeasonId);

  if (type.includes("newsletter")) return { screen: "Newsletter" };

  if (type.includes("report")) {
    // A push does carry a referenceId, but it is the report's own id — not a
    // studentSeasonId — so the student-scoped Reports screen can't be opened
    // from it. The newsletter list shows published reports too.
    return { screen: "Newsletter" };
  }

  if (type.includes("request") || type.includes("document")) {
    return { screen: "Request" };
  }

  if (type.includes("payment") || type.includes("invoice")) {
    return hasStudent
      ? { screen: "Finances", params: { studentName: "", studentSeasonId } }
      : null;
  }

  if (type.includes("health") || type.includes("clinic") || type.includes("medical")) {
    return hasStudent
      ? { screen: "Wellness", params: { studentName: "", studentSeasonId } }
      : null;
  }

  if (type.includes("homework") || type.includes("agenda") || type.includes("exam")) {
    return hasStudent
      ? { screen: "Agenda", params: { studentName: "", studentSeasonId } }
      : null;
  }

  return null;
}

/**
 * Destination for an inbox notification, whose payload differs from a push: it
 * identifies a section by label and carries no entity id at all.
 *
 * ⚠️ The inbox used to carry `actionUrl`, which named both the section and the
 * record. It has been removed, so a tap can only open a list — never the
 * specific item the notification is about.
 *
 * ⚠️ Complaints have no screen in the mobile app, so those rows currently have
 * nowhere to go — see the note in NotificationScreen.
 */
export function resolveTargetDestination(
  target: { section: string; id: number | null } | null,
): { screen: keyof RootStackParamList; params?: object } | null {
  const section = target?.section.toLowerCase() ?? "";
  if (!section) return null;

  if (section.includes("documentrequest")) return { screen: "Request" };
  if (section.includes("newsletter")) return { screen: "Newsletter" };

  // Reports reach parents through the newsletter list, which now carries
  // student reports alongside real newsletters. Reports also live under a
  // student's own Reports screen, but that needs a studentSeasonId and the
  // inbox payload has no entity id to supply one.
  if (section.includes("report")) return { screen: "Newsletter" };

  // Complaints, and anything else, have no mobile destination yet.
  return null;
}

/** Server state a notification of the given type invalidates. */
function invalidateFor(message: PushMessage) {
  const type = message.data.type?.toLowerCase() ?? "";
  log.debug(`invalidating caches for type="${type || "(none)"}"`);

  if (type.includes("newsletter") || type.includes("report")) {
    // A published report shows up in both places.
    queryClient.invalidateQueries({ queryKey: queryKeys.newsletters.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
  } else if (type.includes("request") || type.includes("document")) {
    queryClient.invalidateQueries({ queryKey: queryKeys.documentRequests.all });
  } else if (type.includes("payment")) {
    queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
  } else if (type.includes("health") || type.includes("clinic")) {
    queryClient.invalidateQueries({ queryKey: queryKeys.healthProfile.all });
  } else if (type.includes("homework") || type.includes("agenda")) {
    queryClient.invalidateQueries({ queryKey: queryKeys.agenda.all });
  }

  // The profile's "latest" roll-up reflects most notification types.
  queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
  // The message is also persisted server-side, so the inbox and the unread
  // badge are now stale.
  queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
}

/**
 * Wires push delivery into the app:
 * - foreground messages refresh the affected screens and surface an in-app banner
 * - taps (background or cold start) navigate to the referenced screen
 *
 * Returns the most recent foreground message so a banner can be rendered.
 */
export function usePushNotifications() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { authenticated } = useAuth();
  const [banner, setBanner] = useState<PushMessage | null>(null);

  /** Guards against handling the cold-start notification twice. */
  const handledInitial = useRef(false);

  const openFrom = useCallback(
    (message: PushMessage) => {
      const destination = resolveDestination(message);
      if (!destination) {
        log.warn(
          `no destination for type="${message.data.type ?? "(none)"}" ` +
            `referenceId="${message.data.referenceId ?? "(none)"}" — staying put`,
          message,
        );
        return;
      }

      log.info(`navigating to ${destination.screen}`, destination.params);

      // The destination is resolved from an untyped server string, so the
      // param pairing can't be proven statically — one contained cast here
      // instead of a `never` cast at every call site.
      const navigate = navigation.navigate as (
        screen: string,
        params?: object,
      ) => void;
      navigate(destination.screen, destination.params);
    },
    [navigation],
  );

  // ── Foreground: refresh data, show a banner (the OS shows nothing) ──────
  useEffect(() => {
    if (!authenticated) return;

    return onForegroundMessage((message) => {
      invalidateFor(message);
      if (message.title || message.body) setBanner(message);
    });
  }, [authenticated]);

  // ── Tapped while the app was backgrounded ───────────────────────────────
  useEffect(() => {
    if (!authenticated) return;

    return onNotificationOpened((message) => {
      invalidateFor(message);
      openFrom(message);
    });
  }, [authenticated, openFrom]);

  // ── Tapped from a fully quit state ──────────────────────────────────────
  useEffect(() => {
    if (!authenticated || handledInitial.current) return;
    handledInitial.current = true;

    let cancelled = false;
    (async () => {
      const message = await getInitialNotification();
      if (cancelled || !message) return;
      invalidateFor(message);
      openFrom(message);
    })();

    return () => {
      cancelled = true;
    };
  }, [authenticated, openFrom]);

  const dismissBanner = useCallback(() => setBanner(null), []);

  return { banner, dismissBanner, openFrom };
}
