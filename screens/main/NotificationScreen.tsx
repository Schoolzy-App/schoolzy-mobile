import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { NotificationItem } from "@/components";
import { QueryState, ScreenTemplate, Text } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useStyles,
} from "@/hooks";
import { resolveTargetDestination } from "@/hooks/usePushNotifications";
import type { RootStackScreenProps } from "@/navigation/types";
import type { NotificationListItem } from "@/services/mappers";

type Props = RootStackScreenProps<"Notification">;

export default function NotificationScreen({ navigation }: Props) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotifications();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: isMarkingAll } =
    useMarkAllNotificationsRead();

  const hasUnread = !!data?.some((n) => n.unread);

  /**
   * react-query's focus tracking follows AppState, not navigation — without
   * this, returning to the inbox from another screen would render the cached
   * list and never re-check for new notifications.
   */
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  /**
   * Tapping marks the row read and routes from the notification's `actionUrl`.
   * Rows with no mobile destination (complaints) still get marked read.
   */
  const handlePress = useCallback(
    (item: NotificationListItem) => {
      if (item.unread) markRead(item.notificationId);

      const destination = resolveTargetDestination(item.target);
      if (!destination) return;

      const navigate = navigation.navigate as (
        screen: string,
        params?: object,
      ) => void;
      navigate(destination.screen, destination.params);
    },
    [markRead, navigation],
  );

  return (
    <ScreenTemplate title="Notifications">
      <View style={styles.container}>
        <QueryState
          isLoading={isLoading}
          error={error}
          isEmpty={!data?.length}
          emptyMessage="You will see new updates here."
          onRetry={refetch}
        >
          {hasUnread ? (
            <Pressable
              style={styles.markAllRow}
              onPress={() => markAllRead()}
              disabled={isMarkingAll}
              hitSlop={8}
            >
              <Text variant="label3" weight="semiBold" color={colors.primary}>
                Mark all as read
              </Text>
            </Pressable>
          ) : null}

          <View style={styles.list}>
            {data?.map((item) => (
              <NotificationItem
                key={item.id}
                {...item}
                onPress={() => handlePress(item)}
              />
            ))}
          </View>

          {hasNextPage ? (
            <Pressable
              style={styles.loadMore}
              onPress={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              <Text variant="label3" weight="semiBold" color={colors.primary}>
                {isFetchingNextPage ? "Loading…" : "Load more"}
              </Text>
            </Pressable>
          ) : null}
        </QueryState>
      </View>
    </ScreenTemplate>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: {
      width: "100%",
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 24,
    },
    markAllRow: {
      alignSelf: "flex-end",
      paddingVertical: 8,
    },
    list: {
      gap: 12,
    },
    loadMore: {
      alignSelf: "center",
      paddingVertical: 16,
    },
  });
