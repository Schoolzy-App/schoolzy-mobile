import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";

import { AnnouncementList } from "@/components";
import { QueryState, ScreenTemplate } from "@/components/ui";
import { useNewsletters } from "@/hooks";
import type { RootStackScreenProps } from "@/navigation/types";
import { newslettersApi } from "@/services/api";
import type { NewsletterListItem } from "@/services/mappers";

type Props = RootStackScreenProps<"Newsletter">;

export default function NewsletterScreen({ navigation }: Props) {
  const { data, isLoading, error, refetch } = useNewsletters();

  // Stable across renders, so every memoized row keeps its identity.
  const handleSelect = useCallback(
    async (item: NewsletterListItem) => {
      navigation.navigate("Pdf", {
        title: item.title,
        uri: item.fileUrl ?? newslettersApi.getFileUrl(item.newsletterId),
        headers: await newslettersApi.getFileHeaders(),
      });
    },
    [navigation],
  );

  return (
    <ScreenTemplate title="Newsletter">
      <View style={styles.list}>
        <QueryState
          isLoading={isLoading}
          error={error}
          isEmpty={!data?.length}
          emptyMessage="No newsletters yet"
          onRetry={refetch}
        >
          <AnnouncementList data={data ?? []} onSelect={handleSelect} />
        </QueryState>
      </View>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  list: {
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
});
