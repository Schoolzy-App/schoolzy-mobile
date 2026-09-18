import React, { memo, useCallback } from "react";
import { FlatList, type ListRenderItem, StyleSheet } from "react-native";

import AnnouncementItem, { AnnouncementData } from "./AnnouncementItem";

export interface AnnouncementListProps<T extends AnnouncementData = AnnouncementData> {
  data: T[];
  /**
   * Stable handler receiving the tapped item. Preferred over per-item `onPress`
   * closures, which would break `AnnouncementItem`'s memoization.
   */
  onSelect?: (item: T) => void;
  onSeeAll?: () => void;
}

const keyExtractor = (item: AnnouncementData) => item.id;

function AnnouncementListInner<T extends AnnouncementData>({
  data,
  onSelect,
}: AnnouncementListProps<T>) {
  const renderItem = useCallback<ListRenderItem<T>>(
    ({ item }) => (
      <AnnouncementItem
        {...item}
        onSelect={onSelect as ((item: AnnouncementData) => void) | undefined}
      />
    ),
    [onSelect],
  );

  return (
    <FlatList
      data={data}
      scrollEnabled={false}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.separator}
      renderItem={renderItem}
      // Nested in a ScrollView and never independently scrolled, so windowing
      // only adds work — render the rows in one pass.
      initialNumToRender={data.length || 1}
      removeClippedSubviews={false}
    />
  );
}

const AnnouncementList = memo(AnnouncementListInner) as typeof AnnouncementListInner;

export default AnnouncementList;

const styles = StyleSheet.create({
  separator: {
    gap: 12,
  },
});
