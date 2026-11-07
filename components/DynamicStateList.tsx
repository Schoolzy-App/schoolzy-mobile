import React, { memo, useState } from "react";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from "react-native";

import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";

import DynamicStateItem, { DynamicStateData } from "./DynamicStateItem";

export interface DynamicStateListProps {
  data: DynamicStateData[];
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 32; // full width minus list horizontal padding

const DynamicStateList = memo<DynamicStateListProps>(({ data }) => {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + 16));
    setActiveIndex(index);
  };

  return (
    <View style={styles.wrapper}>
      <FlatList
        data={data}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 16}
        decelerationRate="fast"
        contentContainerStyle={styles.list}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.card, { width: CARD_WIDTH }]}>
            <DynamicStateItem {...item} />
          </View>
        )}
      />

      {/* Indicator dots */}
      {data.length > 1 && (
        <View style={styles.indicators}>
          {data.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === activeIndex
                      ? colors.secondary
                      : colors.buttonText,
                  width: index === activeIndex ? 100 : 30,
                  opacity: index === activeIndex ? 1 : 0.5,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
});

DynamicStateList.displayName = "DynamicStateList";
export default DynamicStateList;

const createStyles = () =>
  StyleSheet.create({
    wrapper: {
      gap: 8,
    },
    list: {
      paddingHorizontal: 16,
      gap: 16,
    },
    card: {},
    indicators: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 4,
    },
    dot: {
      height: 4,
      borderRadius: 2,
    },
  });
