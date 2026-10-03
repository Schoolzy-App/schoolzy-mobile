import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { memo, useCallback } from "react";
import { StyleSheet, View } from "react-native";

import { RequestItem } from "@/components";
import { Button, QueryState, ScreenTemplate, Text } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useDocumentRequests, useStyles } from "@/hooks";
import type { RootStackParamList } from "@/navigation/types";
import type { Request } from "@/types/request";

export default function RequestScreen() {
  const styles = useStyles(createStyles);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Grouping happens inside the query's `select`, so no filtering on render.
  const { data, isLoading, error, refetch } = useDocumentRequests();

  /**
   * Opens the first attached file of a completed request.
   * ⚠️ The list payload only carries `filesCount`; file ids live on the detail
   * endpoint, so the detail is fetched on demand before opening the viewer.
   */
  /**
   * Opens the detail rather than jumping straight into the first file. The
   * detail carries what the list can't: the rejection reason, the school's
   * notes, the coordinator, and every attached document rather than just one.
   */
  const handleOpenRequest = useCallback(
    (request: Request) =>
      navigation.navigate("RequestDetails", {
        requestId: request.requestId,
        title: request.documentLabel,
      }),
    [navigation],
  );

  const handleAddRequest = useCallback(
    () => navigation.navigate("AddRequest"),
    [navigation],
  );

  return (
    <ScreenTemplate
      title="Requests"
      bottomContent={<Button text="+ Add Request" onPress={handleAddRequest} />}
    >
      <View style={styles.container}>
        <QueryState
          isLoading={isLoading}
          error={error}
          isEmpty={!data?.all.length}
          emptyMessage="No requests yet"
          onRetry={refetch}
        >
          {/* ── Pending ─────────────────────────────────────────── */}
          <RequestSection
            title="Pending"
            requests={data?.pending ?? []}
            emptyText="No pending requests"
            onSelect={handleOpenRequest}
          />

          {/* ── Closed: completed, rejected and cancelled ───────── */}
          {data?.closed.length ? (
            <RequestSection title="Closed" requests={data.closed} onSelect={handleOpenRequest} />
          ) : null}
        </QueryState>
      </View>
    </ScreenTemplate>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────
// Memoized so an unrelated section re-rendering doesn't walk this list again.
interface RequestSectionProps {
  title: string;
  requests: Request[];
  emptyText?: string;
  onSelect?: (request: Request) => void;
}

const RequestSection = memo<RequestSectionProps>(
  ({ title, requests, emptyText, onSelect }) => {
    const { colors } = useTheme();
    const styles = useStyles(createStyles);

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="label2" weight="semiBold">
            {title}
          </Text>
          <View
            style={[styles.countPill, { backgroundColor: colors.background }]}
          >
            <Text
              variant="caption1"
              weight="semiBold"
              color={colors.textSecondary}
            >
              {requests.length}
            </Text>
          </View>
        </View>

        {requests.length === 0 ? (
          emptyText ? (
            <View style={styles.empty}>
              <Text
                variant="label3"
                weight="regular"
                color={colors.textSecondary}
              >
                {emptyText}
              </Text>
            </View>
          ) : null
        ) : (
          <View style={styles.list}>
            {requests.map((req) => (
              <RequestItem key={req.id} request={req} onSelect={onSelect} />
            ))}
          </View>
        )}
      </View>
    );
  },
);
RequestSection.displayName = "RequestSection";

const createStyles = () =>
  StyleSheet.create({
    container: {
      width: "100%",
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 24,
      gap: 20,
    },
    section: {
      width: "100%",
      gap: 10,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    countPill: {
      minWidth: 22,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
    },
    list: {
      gap: 10,
    },
    empty: {
      paddingVertical: 16,
      alignItems: "center",
    },
  });
