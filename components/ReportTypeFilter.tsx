import React, { memo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";
import { Text } from "@/components/ui";

export interface ReportType {
  key: string;
  label: string;
}

interface ReportTypeFilterProps {
  types: ReportType[];
  selected: string;
  onSelect: (key: string) => void;
}

const ReportTypeFilter = memo<ReportTypeFilterProps>(
  ({ types, selected, onSelect }) => {
    const { colors } = useTheme();
    const styles = useStyles(createStyles);

    const allTypes: ReportType[] = [{ key: "all", label: "All" }, ...types];

    return (
      <View style={styles.container}>
        <FlatList
          data={allTypes}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isActive = selected === item.key;
            return (
              <Pressable
                style={[
                  styles.chip,
                  isActive && {
                    backgroundColor: colors.primary,
                  },
                ]}
                onPress={() => onSelect(item.key)}
              >
                <Text
                  variant="label3"
                  weight="medium"
                  color={isActive ? colors.buttonText : colors.textSecondary}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>
    );
  },
);

ReportTypeFilter.displayName = "ReportTypeFilter";
export default ReportTypeFilter;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      width: "100%",
    },
    list: {
      paddingHorizontal: 16,
      gap: 8,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
  });
