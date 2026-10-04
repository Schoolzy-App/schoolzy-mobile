import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import {
  AnnouncementList,
  ChildrenList,
  DynamicStateList,
  ParentHeader,
} from "@/components";
import type { DynamicStateData } from "@/components/DynamicStateItem";
import {
  BottomSection,
  QueryState,
  ScreenTemplate,
  Text,
} from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  useCurrentUser,
  useNewsletters,
  useStudents,
  useStyles,
  useUnreadNotificationCount,
} from "@/hooks";
import type { RootStackParamList } from "@/navigation/types";
import { newslettersApi } from "@/services/api";
import type { NewsletterListItem } from "@/services/mappers";
import type { ChildData } from "@/types/child";

// Show only a small preview on Home; the dedicated Newsletter screen shows all.
const HOME_PREVIEW_COUNT = 3;

/**
 * ⚠️ The home dashboard's "dynamic states" have no backing endpoint.
 * `GET /api/v1/home` exists but ships no response schema in the Swagger spec,
 * so this stays a static placeholder until the shape is published — see
 * `useHome()` in `hooks/queries/useNewsletters.ts`.
 */
const PLACEHOLDER_STATES: DynamicStateData[] = [
  {
    id: "1",
    type: "success",
    title: "Everything looks good!",
    subtitle: "No action needed right now",
  },
];

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const styles = useStyles(createStyles);

  const { colors } = useTheme();
  // The login response may or may not carry a name; /home/current-user is the
  // authoritative source and also provides gender.
  const { user } = useAuth();
  const { data: currentUser } = useCurrentUser();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const {
    data: children,
    isLoading: childrenLoading,
    error: childrenError,
    refetch: refetchChildren,
  } = useStudents();

  const { data: unreadCount } = useUnreadNotificationCount();

  const {
    data: newsletters,
    isLoading: newslettersLoading,
    error: newslettersError,
    refetch: refetchNewsletters,
  } = useNewsletters();

  // Slice only when the source array identity changes — not on every render.
  const newsletterPreview = useMemo(
    () => newsletters?.slice(0, HOME_PREVIEW_COUNT) ?? [],
    [newsletters],
  );

  // ── Stable handlers: passed by identity to memoized list rows ───────────
  const handleSelectChild = useCallback(
    (child: ChildData) => {
      navigation.navigate("StudentProfile", {
        id: child.id,
        studentSeasonId: Number(child.id),
        name: child.name,
        year: child.year,
        activeBus: child.activeBus,
        allergies: child.allergies,
        bloodType: child.bloodType,
        attendance: child.attendance,
        avatarIcon: child.avatarIcon,
      });
    },
    [navigation],
  );

  const handleSelectNewsletter = useCallback(
    async (item: NewsletterListItem) => {
      navigation.navigate("Pdf", {
        title: item.title,
        uri: newslettersApi.getFileUrl(item.source, item.newsletterId),
        headers: await newslettersApi.getFileHeaders(),
      });
    },
    [navigation],
  );

  const handleNotifications = useCallback(
    () => navigation.navigate("Notification"),
    [navigation],
  );

  const handleSeeAllNewsletters = useCallback(
    () => navigation.navigate("Newsletter"),
    [navigation],
  );

  return (
    <ScreenTemplate
      headerContent={
        <View style={styles.headerInner}>
          <ParentHeader
            parentName={currentUser?.name || user?.name || ""}
            gender={currentUser?.gender}
            onNotificationPress={handleNotifications}
            unreadCount={unreadCount}
          />
          <DynamicStateList data={PLACEHOLDER_STATES} />
        </View>
      }
      style={styles.screen}
    >
      {/* Children row */}
      <View style={styles.childrenSection}>
        <QueryState
          isLoading={childrenLoading}
          error={childrenError}
          isEmpty={!children?.length}
          emptyMessage="No students linked to this account"
          onRetry={refetchChildren}
        >
          <ChildrenList data={children ?? []} onSelect={handleSelectChild} />
        </QueryState>
      </View>

      {/* Newsletter — fills remaining space */}
      <BottomSection
        title="Newsletter"
        headerAction={
          <Pressable onPress={handleSeeAllNewsletters} hitSlop={8}>
            <Text variant="label3" weight="semiBold" color={colors.primary}>
              See all
            </Text>
          </Pressable>
        }
      >
        <QueryState
          isLoading={newslettersLoading}
          error={newslettersError}
          isEmpty={!newsletterPreview.length}
          emptyMessage="No newsletters yet"
          onRetry={refetchNewsletters}
        >
          <AnnouncementList
            data={newsletterPreview}
            onSelect={handleSelectNewsletter}
          />
        </QueryState>
      </BottomSection>
    </ScreenTemplate>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    screen: {
      backgroundColor: colors.backgroundInverted,
    },
    headerInner: {
      gap: 12,
    },
    childrenSection: {
      width: "100%",
      paddingVertical: 12,
    },
  });
