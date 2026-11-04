import { CaretDownIcon, CheckIcon } from "phosphor-react-native";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Modal, Text } from "@/components/ui";
import type { DefaultInputOption } from "@/components/ui";
import { Palette, Radius, Size } from "@/constants/tokens";

/**
 * The forms' select (Update Information §4): an input-styled box with a caret
 * that opens a sheet of options. Empty list → disabled at half opacity with
 * `emptyText` under it.
 */
export function SelectField({
  title,
  placeholder,
  value,
  /** Shown when `value` isn't in `options` yet (e.g. before they load). */
  fallbackLabel,
  options,
  onChange,
  disabled,
  loading,
  emptyText,
  invalid,
}: {
  title: string;
  placeholder: string;
  value: string;
  fallbackLabel?: string;
  options: DefaultInputOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
  emptyText?: string;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const empty = !loading && options.length === 0;
  const label = value
    ? options.find((option) => option.value === value)?.label || fallbackLabel || ""
    : "";

  return (
    <>
      <Pressable
        disabled={disabled || empty || loading}
        onPress={() => setOpen(true)}
        style={[
          styles.select,
          invalid && { borderColor: Palette.form.inputError },
          (disabled || empty) && styles.disabled,
        ]}
      >
        <Text
          style={styles.selectText}
          color={label ? Palette.text.primary : Palette.text.tertiary}
          numberOfLines={1}
        >
          {label || placeholder}
        </Text>
        <CaretDownIcon weight="bold" size={16} color={Palette.text.tertiary} />
      </Pressable>
      {empty && emptyText ? (
        <Text style={styles.helper} color={Palette.text.secondary}>
          {emptyText}
        </Text>
      ) : null}

      <Modal bare isVisible={open} closeModal={() => setOpen(false)}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {options.map((option, index) => {
              const selected = option.value === value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  style={[styles.option, index > 0 && styles.divided]}
                >
                  <Text
                    style={[styles.optionText, selected && styles.optionSelected]}
                    color={selected ? Palette.action.primary : Palette.text.primary}
                  >
                    {option.label}
                  </Text>
                  {selected ? (
                    <CheckIcon weight="bold" size={18} color={Palette.action.primary} />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  select: {
    height: Size.input,
    borderRadius: Radius.input,
    borderWidth: Size.inputBorderWidth,
    borderColor: Palette.form.inputBorder,
    backgroundColor: Palette.surface.card,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  disabled: {
    opacity: 0.5,
  },
  selectText: {
    flex: 1,
    fontSize: 16,
  },
  helper: {
    fontSize: 13,
    lineHeight: 17,
  },
  sheet: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 21,
    paddingHorizontal: 4,
  },
  list: {
    maxHeight: 420,
    borderRadius: Radius.card,
    backgroundColor: Palette.surface.card,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
  },
  divided: {
    borderTopWidth: 1,
    borderTopColor: Palette.border.divider,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
  },
  optionSelected: {
    fontWeight: "600",
  },
});
