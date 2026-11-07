import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChatCircleTextIcon, PlusIcon } from "phosphor-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import {
  ComplaintCard,
  SummaryTiles,
} from "@/components/complaints/ComplaintParts";
import FilterChips from "@/components/FilterChips";
import FormButton from "@/components/FormButton";
import SearchField from "@/components/SearchField";
import { QueryState, ScreenTemplate, Text } from "@/components/ui";
import { Palette, Radius, Size, Spacing, Type } from "@/constants/tokens";
import { useComplaints } from "@/hooks";
import type { RootStackParamList } from "@/navigation/types";
import type { Complaint } from "@/services/mappers";

type StatusFilter = "all" | "1" | "2" | "3" | "4" | "5" | "6";

/** "My Complaints" (Complaints spec §2). */
export default function ComplaintsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const status = filter === "all" ? undefined : Number(filter);

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useComplaints(status);

  // Counts come from the server and ignore the active filter.
  const counts = data?.statusCounts;
  const chips = useMemo(
    () => [
      { value: "all" as const, label: "All", count: counts?.all },
      { value: "1" as const, label: "Submitted", count: counts?.submitted },
      { value: "2" as const, label: "Under Review", count: counts?.underReview },
      { value: "3" as const, label: "In Progress", count: counts?.inProgress },
      { value: "4" as const, label: "Resolved", count: counts?.resolved },
      { value: "5" as const, label: "Closed", count: counts?.closed },
      { value: "6" as const, label: "Rejected", count: counts?.rejected },
    ],
    [counts],
  );

  // Search filters the loaded titles; the server has no text search.
  const shown = useMemo(() => {
    const query = search.trim().toLowerCase();
    const all = data?.all ?? [];
    return query ? all.filter((c) => c.title.toLowerCase().includes(query)) : all;
  }, [data?.all, search]);

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

  const loaded = data?.all.length ?? 0;
  const total = data?.totalCount;
  // Nothing at all yet — the empty card replaces the whole list.
  const noComplaints = !isLoading && !error && counts?.all === 0;

  return (
    <ScreenTemplate
      variant="form"
      title="My Complaints"
      headerStyle={styles.header}
      bottomContent={
        noComplaints ? undefined : (
          <FormButton label="New Complaint" Icon={PlusIcon} onPress={handleAdd} />
        )
      }
    >
      <View style={styles.body}>
        {noComplaints ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <ChatCircleTextIcon size={30} color={Palette.action.primary} />
            </View>
            <Text style={Type.emptyTitle}>No complaints yet</Text>
            <Text style={[styles.emptyBody]} color={Palette.text.secondary}>
              If something isn't right, let the school know and follow it here.
            </Text>
            <FormButton
              label="Submit your first complaint"
              Icon={PlusIcon}
              onPress={handleAdd}
              height={48}
            />
          </View>
        ) : (
          <>
            {data?.summary ? <SummaryTiles summary={data.summary} /> : null}

            <SearchField
              value={search}
              onChangeText={setSearch}
              placeholder="Search by title"
            />

            <FilterChips
              options={chips}
              value={filter}
              onChange={setFilter}
              accent={Palette.action.primary}
            />

            <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
              {shown.length ? (
                <View style={styles.list}>
                  {shown.map((complaint) => (
                    <ComplaintCard
                      key={complaint.id}
                      complaint={complaint}
                      onSelect={handleOpen}
                    />
                  ))}
                </View>
              ) : (
                <Text style={styles.noResults} color={Palette.text.secondary}>
                  {search.trim()
                    ? "No complaints match your search"
                    : "No complaints with this status"}
                </Text>
              )}

              {loaded > 0 ? (
                <View style={styles.more}>
                  {hasNextPage ? (
                    <>
                      {total != null ? (
                        <Text style={Type.meta} color={Palette.text.secondary}>
                          Showing {loaded} of {total}
                        </Text>
                      ) : null}
                      <FormButton
                        label="Load more"
                        variant="outline"
                        height={Size.outlineButton}
                        loading={isFetchingNextPage}
                        onPress={handleLoadMore}
                      />
                    </>
                  ) : (
                    <Text style={Type.meta} color={Palette.text.tertiary}>
                      {loaded === 1 ? "1 complaint shown" : `All ${loaded} complaints shown`}
                    </Text>
                  )}
                </View>
              ) : null}
            </QueryState>
          </>
        )}
      </View>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: Spacing.form.headerPaddingBottom,
  },
  body: {
    width: "100%",
    padding: Spacing.form.bodyPadding,
    gap: Spacing.form.bodyGap.list,
  },
  list: {
    gap: Spacing.form.bodyGap.list,
  },
  noResults: {
    fontSize: 15,
    lineHeight: 18,
    textAlign: "center",
    paddingVertical: 28,
  },
  more: {
    alignItems: "center",
    gap: 10,
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
