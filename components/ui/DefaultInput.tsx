import React, { memo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

import type { ColorPalette } from "@/apps";
import WeekCalendar from "@/components/WeekCalendar";
import { Icons } from "@/constants";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";

import Text from "./Text";

type DefaultInputType = "text" | "date" | "select";

export interface DefaultInputOption {
  label: string;
  value: string;
}

export interface DefaultInputProps extends Omit<
  TextInputProps,
  "value" | "onChangeText" | "onChange"
> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: DefaultInputType;
  disabled?: boolean;
  options?: DefaultInputOption[];
  leftAdornment?: React.ReactNode;
}

function formatDate(date: Date) {
  const day = `${date.getDate()}`.padStart(2, "0");
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const year = `${date.getFullYear()}`;
  return `${day}/${month}/${year}`;
}

function parseDate(value: string) {
  const [day, month, year] = value.split("/").map((part) => Number(part));
  if (!day || !month || !year) return null;

  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

const DefaultInput = memo<DefaultInputProps>(
  ({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    disabled,
    options = [],
    leftAdornment,
    ...inputProps
  }) => {
    const styles = useStyles(createStyles);
    const { colors } = useTheme();

    const [isDateModalVisible, setIsDateModalVisible] = useState(false);
    const [isSelectOpen, setIsSelectOpen] = useState(false);

    const isReadOnly = disabled || type === "date" || type === "select";
    const selectedDate = parseDate(value);

    /**
     * A select's `value` is the option's id (e.g. a documentTypeId), which is
     * not what the user should see — resolve it back to the option's label.
     * Falls back to the placeholder when the value matches no option, which is
     * the case while the options are still loading.
     */
    const displayValue =
      type === "select"
        ? (options.find((option) => option.value === value)?.label ?? "")
        : value;

    const openDateModal = () => {
      if (disabled) return;
      setIsDateModalVisible(true);
    };

    const onPressField = () => {
      if (type === "date") {
        openDateModal();
        return;
      }

      if (type === "select" && !disabled) {
        setIsSelectOpen((prev) => !prev);
      }
    };

    const rightNode =
      type === "date" ? (
        <Icons.CalendarGray
          width={20}
          height={20}
          color={colors.textSecondary}
        />
      ) : type === "select" ? (
        <View style={[styles.chevron, isSelectOpen && styles.chevronOpen]}>
          <Icons.Arrow width={12} height={12} />
        </View>
      ) : null;

    return (
      <View style={styles.wrapper}>
        <Text variant="label3" weight="semiBold">
          {label}
        </Text>

        <View style={styles.fieldContainer}>
          <Pressable
            style={[styles.inputContainer, disabled && styles.inputDisabled]}
            onPress={onPressField}
          >
            {leftAdornment ? (
              <View style={styles.left}>{leftAdornment}</View>
            ) : null}

            {type === "text" ? (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                editable={!isReadOnly}
                style={styles.input}
                placeholderTextColor={colors.placeholder}
                textAlignVertical="center"
                {...inputProps}
              />
            ) : (
              <Text
                variant="label2"
                weight="regular"
                color={displayValue ? colors.textPrimary : colors.placeholder}
                style={styles.readOnlyValue}
              >
                {displayValue || placeholder || "Select"}
              </Text>
            )}

            {rightNode}
          </Pressable>

          {type === "select" && isSelectOpen ? (
            <View style={styles.dropdown}>
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    style={styles.optionRow}
                    onPress={() => {
                      onChange(option.value);
                      setIsSelectOpen(false);
                    }}
                  >
                    <Text
                      variant="label2"
                      weight={isSelected ? "semiBold" : "regular"}
                      color={isSelected ? colors.secondary : colors.textPrimary}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>

        <Modal
          visible={type === "date" && isDateModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsDateModalVisible(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setIsDateModalVisible(false)}
          >
            <Pressable style={styles.calendarCard} onPress={() => {}}>
              <WeekCalendar
                selectedDate={selectedDate ?? new Date()}
                onSelectDate={(date) => {
                  onChange(formatDate(date));
                  setIsDateModalVisible(false);
                }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    );
  },
);

DefaultInput.displayName = "DefaultInput";
export default DefaultInput;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    wrapper: {
      gap: 8,
    },
    fieldContainer: {
      gap: 8,
      zIndex: 20,
    },
    inputContainer: {
      minHeight: 56,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      gap: 8,
    },
    inputDisabled: {
      opacity: 0.9,
    },
    left: {
      justifyContent: "center",
      alignItems: "center",
    },
    input: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 14,
      padding: 0, // removes Android's built-in TextInput padding
      includeFontPadding: false, // removes Android extra font ascender space
      minHeight: 56, // keeps tap area tall enough
    },
    readOnlyValue: {
      flex: 1,
    },
    chevron: {
      transform: [{ rotate: "0deg" }],
    },
    chevronOpen: {
      transform: [{ rotate: "180deg" }],
    },
    dropdown: {
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: "hidden",
    },
    optionRow: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.35)",
      justifyContent: "center",
      padding: 16,
    },
    calendarCard: {
      borderRadius: 16,
      backgroundColor: colors.surface,
      padding: 16,
      gap: 10,
    },
  });
