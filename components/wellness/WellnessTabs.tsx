import React, { memo, useRef } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import type { ColorPalette } from '@/apps';
import { useStyles } from '@/hooks';
import { useTheme } from '@/contexts/ThemeContext';
import type { WellnessTabKey } from '@/types/wellness';
import { Text } from '@/components/ui';

interface Tab {
  key: WellnessTabKey;
  label: string;
}

const TABS: Tab[] = [
  { key: 'chronic', label: 'Chronic Diseases' },
  { key: 'past', label: 'Past Conditions' },
  { key: 'medications', label: 'Medications' },
  { key: 'vaccinations', label: 'Vaccinations' },
  { key: 'special', label: 'Special Requirements' },
  { key: 'attachments', label: 'Attachments & Notes' },
];

interface WellnessTabsProps {
  activeTab: WellnessTabKey;
  onSelect: (tab: WellnessTabKey) => void;
}

const WellnessTabs = memo<WellnessTabsProps>(({ activeTab, onSelect }) => {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const listRef = useRef<FlatList<Tab>>(null);

  const handleSelect = (tab: Tab, index: number) => {
    onSelect(tab.key);
    listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
  };

  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={listRef}
        data={TABS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.row}
        onScrollToIndexFailed={() => {}}
        renderItem={({ item, index }) => {
          const isActive = item.key === activeTab;
          return (
            <Pressable
              style={[
                styles.chip,
                isActive
                  ? { backgroundColor: colors.surface }
                  : { backgroundColor: 'rgba(255,255,255,0.18)' },
              ]}
              onPress={() => handleSelect(item, index)}
            >
              <Text
                variant="label3"
                weight={isActive ? 'semiBold' : 'regular'}
                color={isActive ? colors.primary : colors.buttonText}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
});

WellnessTabs.displayName = 'WellnessTabs';
export default WellnessTabs;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    wrapper: {
      width: '100%',
      marginTop: 12,
    },
    row: {
      paddingHorizontal: 16,
      gap: 8,
      paddingBottom: 4,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
    },
  });
