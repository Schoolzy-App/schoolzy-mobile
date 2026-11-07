import React, { memo, useCallback } from "react";
import { Dimensions, FlatList, type ListRenderItem, StyleSheet } from "react-native";

import { useStyles } from "@/hooks";
import type { ChildData } from "@/types/child";

import ChildItem from "./ChildItem";

export interface ChildrenListProps {
  data: ChildData[];
  /**
   * Stable handler invoked with the tapped child. Preferred over baking an
   * `onPress` closure into each data object — that would give every item a new
   * prop identity on each render and defeat `ChildItem`'s memoization.
   */
  onSelect?: (child: ChildData) => void;
}

const PADDING = 16;
const GAP = 8;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

function getItemWidth(count: number): number {
  if (count <= 2) {
    // Both items fill the full width
    return (SCREEN_WIDTH - PADDING * 2 - GAP * (count - 1)) / count;
  }
  // Show 2 full items + 50% of the third
  return (SCREEN_WIDTH - PADDING * 2 - GAP * 2) / 2.5;
}

const keyExtractor = (item: ChildData) => item.id;

const ChildrenList = memo<ChildrenListProps>(({ data, onSelect }) => {
  const styles = useStyles(createStyles);
  const itemWidth = getItemWidth(data.length);

  const renderItem = useCallback<ListRenderItem<ChildData>>(
    ({ item }) => (
      <ChildItem {...item} itemWidth={itemWidth} onSelect={onSelect} />
    ),
    [itemWidth, onSelect],
  );

  return (
    <FlatList
      data={data}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      // Children lists are short; render them in one pass and skip the
      // incremental-mount work FlatList does by default.
      initialNumToRender={4}
      windowSize={3}
      removeClippedSubviews={false}
    />
  );
});

ChildrenList.displayName = "ChildrenList";
export default ChildrenList;

const createStyles = () =>
  StyleSheet.create({
    list: {
      paddingHorizontal: PADDING,
      gap: GAP,
    },
  });
