import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { memo, useCallback } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { ComplaintItem } from "@/components";
import { Button, QueryState, ScreenTemplate, Text } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useComplaints, useStyles } from "@/hooks";
import type { RootStackParamList } from "@/navigation/types";
import type { Complaint } from "@/services/mappers";

export default function ComplaintsScreen() {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Grouping happens inside the query's `select`, so no filtering on render.
  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useComplaints();

  const handleOpen = useCallback(
    (complaint: Complaint) =>
      navigation.navigate("ComplaintDetails", {
        complaintId: complaint.complaintId,
        title: complaint.title,
      }),
    [navigation],
  );

  const handleAdd = useCallback(
    () => navigation.navigate("AddComplaint"),
    [navigation],
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <ScreenTemplate
      title="Complaints"
      bottomContent={<Button text="+ New Complaint" onPress={handleAdd} />}
    >
      <View style={styles.container}>
        <QueryState
          isLoading={isLoading}
          error={error}
          isEmpty={!data?.all.length}
          emptyMessage="You haven't raised any complaints"
          onRetry={refetch}
        >
          {/* ── Open: submitted, under review, in progress ──────── */}
          <ComplaintSection
            title="Open"
            complaints={data?.open ?? []}
            emptyText="Nothing open right now"
            onSelect={handleOpen}
          />

          {/* ── Closed: resolved, closed and rejected ───────────── */}
          {data?.closed.length ? (
            <ComplaintSection
              title="Closed"
              complaints={data.closed}
              onSelect={handleOpen}
            />
          ) : null}

          {hasNextPage ? (
            <Pressable
              style={[styles.loadMore, { borderColor: colors.border }]}
              onPress={handleLoadMore}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text variant="label3" weight="medium" color={colors.primary}>
                  Load more
                </Text>
              )}
            </Pressable>
          ) : null}
        </QueryState>
      </View>
    </ScreenTemplate>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────
// Memoized so one section re-rendering doesn't walk the other's list again.
interface ComplaintSectionProps {
  title: string;
  complaints: Complaint[];
  emptyText?: string;
  onSelect?: (complaint: Complaint) => void;
}

const ComplaintSection = memo<ComplaintSectionProps>(
  ({ title, complaints, emptyText, onSelect }) => {
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
              {complaints.length}
            </Text>
          </View>
        </View>

        {complaints.length === 0 ? (
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
            {complaints.map((complaint) => (
              <ComplaintItem
                key={complaint.id}
                complaint={complaint}
                onSelect={onSelect}
              />
            ))}
          </View>
        )}
      </View>
    );
  },
);
ComplaintSection.displayName = "ComplaintSection";

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
    loadMore: {
      alignSelf: "center",
      minWidth: 140,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 24,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
  });
