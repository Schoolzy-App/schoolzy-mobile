import { MagnifyingGlassIcon } from "phosphor-react-native";
import React from "react";
import { StyleSheet, TextInput, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { Palette, Radius, Size } from "@/constants/tokens";
import { useStyles } from "@/hooks";

export interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

/** The design's search field (Newsletter spec §3, Complaints §2). */
export default function SearchField({
  value,
  onChangeText,
  placeholder = "Search",
}: SearchFieldProps) {
  const styles = useStyles(createStyles);

  return (
    <View style={styles.field}>
      <MagnifyingGlassIcon size={18} color={Palette.text.tertiary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Palette.text.tertiary}
        style={styles.input}
        returnKeyType="search"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    field: {
      width: "100%",
      height: Size.search,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 14,
      borderRadius: Radius.search,
      borderWidth: 1,
      borderColor: Palette.border.default,
      backgroundColor: colors.surface,
    },
    input: {
      flex: 1,
      height: "100%",
      fontSize: 15,
      color: Palette.text.primary,
      paddingVertical: 0,
    },
  });
