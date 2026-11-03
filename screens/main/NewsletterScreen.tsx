import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import FilterChips from "@/components/FilterChips";
import NewsletterCard from "@/components/newsletter/NewsletterCard";
import SearchField from "@/components/SearchField";
import { QueryState, ScreenTemplate, Text } from "@/components/ui";
import { Palette, Radius, Spacing, Type } from "@/constants/tokens";
import { useNewsletters } from "@/hooks";
import type { RootStackScreenProps } from "@/navigation/types";
import type { NewsletterListItem } from "@/services/mappers";

type Props = RootStackScreenProps<"Newsletter">;

type Filter = "all" | "unread" | "letter" | "announcement";

const matchesFilter = (item: NewsletterListItem, filter: Filter) =>
  filter === "all" ||
  (filter === "unread" ? !item.isRead : item.kind === filter);

export default function NewsletterScreen({ navigation }: Props) {
  const { data, isLoading, error, refetch } = useNewsletters();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const items = useMemo(() => data ?? [], [data]);

  // Counts follow the whole list, not the search, so the chips stay steady
  // while typing.
  const chips = useMemo(
    () => [
      { value: "all" as const, label: "All", count: items.length },
      { value: "unread" as const, label: "Unread", count: items.filter((i) => !i.isRead).length },
      { value: "letter" as const, label: "Letters", count: items.filter((i) => i.kind === "letter").length },
      { value: "announcement" as const, label: "Announcements", count: items.filter((i) => i.kind === "announcement").length },
    ],
    [items],
  );

  // Newest first from the server; grouping keeps that order.
  const groups = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result: { label: string; items: NewsletterListItem[] }[] = [];
    for (const item of items) {
      if (!matchesFilter(item, filter)) continue;
      if (query && !item.title.toLowerCase().includes(query)) continue;
      const last = result[result.length - 1];
      if (last && last.label === item.dayLabel) last.items.push(item);
      else result.push({ label: item.dayLabel, items: [item] });
    }
    return result;
  }, [items, filter, search]);

  // Stable across renders, so every memoized card keeps its identity.
  const handleSelect = useCallback(
    (item: NewsletterListItem) =>
      navigation.navigate("NewsletterDetail", {
        source: item.source,
        id: item.newsletterId,
        title: item.title,
      }),
    [navigation],
  );

  return (
    <ScreenTemplate
      scrollHeader
      headerStyle={styles.header}
      title={
        <Text style={Type.headerTitleModule} color={Palette.text.onBrand} numberOfLines={1}>
          Newsletter
        </Text>
      }
    >
      <View style={styles.body}>
        <SearchField
          value={search}
          onChangeText={setSearch}
          placeholder="Search newsletters"
        />
        <FilterChips options={chips} value={filter} onChange={setFilter} />

        <QueryState
          isLoading={isLoading}
          error={error}
          isEmpty={!items.length}
          emptyMessage="No newsletters yet"
          onRetry={refetch}
        >
          {groups.length ? (
            groups.map((group) => (
              <View key={group.label} style={styles.group}>
                <Text style={[Type.groupLabel, styles.groupLabel]} color={Palette.text.tertiary}>
                  {group.label}
                </Text>
                {group.items.map((item) => (
                  <NewsletterCard key={item.id} item={item} onSelect={handleSelect} />
                ))}
              </View>
            ))
          ) : (
            <Text style={[Type.rowLabel, styles.empty]} color={Palette.text.tertiary}>
              No newsletters match
            </Text>
          )}
        </QueryState>
      </View>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomLeftRadius: Radius.header,
    borderBottomRightRadius: Radius.header,
  },
  body: {
    width: "100%",
    paddingHorizontal: Spacing.screenX,
    paddingTop: Spacing.contentTop.modules,
    paddingBottom: Spacing.bottomInset.modulesScroll,
    gap: 15,
  },
  group: {
    gap: Spacing.listGap.newsletterCards,
  },
  groupLabel: {
    paddingTop: 4,
    paddingHorizontal: 2,
  },
  empty: {
    fontSize: 15,
    textAlign: "center",
    paddingVertical: 40,
  },
});
