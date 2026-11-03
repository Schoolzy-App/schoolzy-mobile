import { MaterialIcons } from "@expo/vector-icons";
import React, { memo, useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { Button, Modal, Text } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";
import type { DashboardChild, QuickAction } from "@/services/mappers";

/** One row of the draft list. */
export interface QuickActionDraft {
  code: string;
  /** null means "ask each time" — the default for a student shortcut. */
  pinnedStudentId: number | null;
}

export interface CustomizeQuickActionsProps {
  visible: boolean;
  /** What is on Home right now. */
  current: QuickAction[];
  /** Everything this account may add. */
  catalog: QuickAction[];
  students: DashboardChild[];
  max?: number;
  isSaving?: boolean;
  onSave: (items: QuickActionDraft[]) => void;
  onReset: () => void;
  onClose: () => void;
}

const DEFAULT_MAX = 6;

/**
 * The Quick Actions editor.
 *
 * Reordering is done with up/down controls rather than drag: the list lives
 * inside a scrollable bottom sheet, where a long-press drag fights the
 * scroll, and the artifact offers the same arrows beside its drag handle.
 *
 * Pinning cycles through the children rather than opening a second sheet —
 * "Ask each time" → first child → … → back to asking. A nested sheet over a
 * sheet is the thing worth avoiding here.
 */
const CustomizeQuickActions = memo<CustomizeQuickActionsProps>(
  ({
    visible,
    current,
    catalog,
    students,
    max = DEFAULT_MAX,
    isSaving,
    onSave,
    onReset,
    onClose,
  }) => {
    const { colors } = useTheme();
    const styles = useStyles(createStyles);

    /**
     * `null` means untouched, so the saved list shows through. Derived rather
     * than seeded in an effect: no cascading render, and a refetch can't wipe
     * edits in progress. Discarded on close, so reopening starts fresh.
     */
    const [edits, setEdits] = useState<QuickActionDraft[] | null>(null);

    const draft = useMemo(
      () =>
        edits ??
        current.map((a) => ({
          code: a.code,
          pinnedStudentId: a.pinnedStudentId,
        })),
      [edits, current],
    );

    const handleClose = useCallback(() => {
      setEdits(null);
      onClose();
    }, [onClose]);

    /** Catalogue entry for a code, for labels and scope. */
    const byCode = useMemo(() => {
      const map: Record<string, QuickAction> = {};
      catalog.forEach((a) => {
        map[a.code] = a;
      });
      current.forEach((a) => {
        if (!map[a.code]) map[a.code] = a;
      });
      return map;
    }, [catalog, current]);

    const chosen = useMemo(
      () => new Set(draft.map((d) => d.code)),
      [draft],
    );

    /** Available actions, split the way the catalogue scopes them. */
    const groups = useMemo(() => {
      const available = catalog.filter((a) => !chosen.has(a.code));
      return [
        {
          title: "For a child",
          items: available.filter((a) => a.isStudentScoped),
        },
        {
          title: "For you",
          items: available.filter((a) => !a.isStudentScoped),
        },
      ].filter((g) => g.items.length > 0);
    }, [catalog, chosen]);

    const full = draft.length >= max;

    // Each mutator writes the whole next list from `draft`, which is already
    // in scope — an updater function would need the same fallback repeated.
    const add = useCallback(
      (code: string) => {
        if (draft.length >= max) return;
        setEdits([...draft, { code, pinnedStudentId: null }]);
      },
      [draft, max],
    );

    const remove = useCallback(
      (index: number) => setEdits(draft.filter((_, i) => i !== index)),
      [draft],
    );

    const move = useCallback(
      (index: number, delta: number) => {
        const next = index + delta;
        if (next < 0 || next >= draft.length) return;
        const copy = [...draft];
        [copy[index], copy[next]] = [copy[next], copy[index]];
        setEdits(copy);
      },
      [draft],
    );

    /** Ask each time → child 1 → … → child n → ask each time. */
    const cyclePin = useCallback(
      (index: number) => {
        if (!students.length) return;
        setEdits(
          draft.map((item, i) => {
            if (i !== index) return item;
            const at = students.findIndex(
              (s) => s.studentId === item.pinnedStudentId,
            );
            const nextChild = students[at + 1];
            return {
              ...item,
              pinnedStudentId: nextChild ? nextChild.studentId : null,
            };
          }),
        );
      },
      [draft, students],
    );

    const nameOf = useCallback(
      (studentId: number | null) =>
        students.find((s) => s.studentId === studentId)?.name ?? "",
      [students],
    );

    const handleSave = useCallback(() => onSave(draft), [onSave, draft]);

    return (
      <Modal isVisible={visible} closeModal={handleClose}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text variant="label1" weight="semiBold">
              Customize Quick Actions
            </Text>
            <Pressable onPress={onReset} hitSlop={8}>
              <Text variant="label3" weight="semiBold" color={colors.primary}>
                Reset
              </Text>
            </Pressable>
          </View>

          <Text variant="caption1" weight="regular" color={colors.textSecondary}>
            Choose what appears on Home · {draft.length} of {max}
          </Text>

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {/* ── On Home ──────────────────────────────────────── */}
            <Text variant="caption1" weight="semiBold" color={colors.textSecondary}>
              ON HOME
            </Text>

            {draft.length === 0 ? (
              <Text
                variant="label3"
                weight="regular"
                color={colors.textSecondary}
                style={styles.emptyNote}
              >
                No shortcuts selected. Home will keep the section with nothing in it.
              </Text>
            ) : (
              draft.map((item, index) => {
                const action = byCode[item.code];
                const studentScoped = action?.isStudentScoped ?? false;
                const pinName = nameOf(item.pinnedStudentId);

                return (
                  <View key={item.code} style={styles.row}>
                    <View style={styles.rowText}>
                      <View style={styles.rowTitle}>
                        <Text variant="label3" weight="semiBold" numberOfLines={1}>
                          {action?.label ?? item.code}
                        </Text>
                        {!studentScoped ? (
                          <View
                            style={[
                              styles.badge,
                              { backgroundColor: colors.background },
                            ]}
                          >
                            <Text
                              variant="caption2"
                              weight="medium"
                              color={colors.textSecondary}
                            >
                              You
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      {/* Only student shortcuts need a child. */}
                      {studentScoped && students.length ? (
                        <Pressable
                          style={[
                            styles.pin,
                            {
                              backgroundColor: pinName
                                ? colors.primary + "15"
                                : colors.background,
                            },
                          ]}
                          onPress={() => cyclePin(index)}
                        >
                          <MaterialIcons
                            name={pinName ? "push-pin" : "help-outline"}
                            size={12}
                            color={pinName ? colors.primary : colors.textSecondary}
                          />
                          <Text
                            variant="caption2"
                            weight="medium"
                            color={pinName ? colors.primary : colors.textSecondary}
                          >
                            {pinName || "Ask each time"}
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>

                    <View style={styles.rowActions}>
                      <Pressable
                        hitSlop={6}
                        onPress={() => move(index, -1)}
                        disabled={index === 0}
                      >
                        <MaterialIcons
                          name="keyboard-arrow-up"
                          size={22}
                          color={index === 0 ? colors.border : colors.textSecondary}
                        />
                      </Pressable>
                      <Pressable
                        hitSlop={6}
                        onPress={() => move(index, 1)}
                        disabled={index === draft.length - 1}
                      >
                        <MaterialIcons
                          name="keyboard-arrow-down"
                          size={22}
                          color={
                            index === draft.length - 1
                              ? colors.border
                              : colors.textSecondary
                          }
                        />
                      </Pressable>
                      <Pressable hitSlop={6} onPress={() => remove(index)}>
                        <MaterialIcons
                          name="remove-circle-outline"
                          size={20}
                          color={colors.danger}
                        />
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}

            {/* ── Available ────────────────────────────────────── */}
            {groups.map((group) => (
              <View key={group.title} style={styles.group}>
                <Text
                  variant="caption1"
                  weight="semiBold"
                  color={colors.textSecondary}
                >
                  {group.title.toUpperCase()}
                </Text>
                {group.items.map((action) => (
                  <Pressable
                    key={action.code}
                    style={[styles.addRow, full && styles.disabled]}
                    onPress={() => add(action.code)}
                    disabled={full}
                  >
                    <MaterialIcons
                      name="add-circle-outline"
                      size={18}
                      color={full ? colors.border : colors.primary}
                    />
                    <Text variant="label3" weight="regular" numberOfLines={1}>
                      {action.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ))}

            <Text
              variant="caption1"
              weight="regular"
              color={colors.textSecondary}
              style={styles.footnote}
            >
              {full
                ? `That's the maximum of ${max}. Remove one to add another.`
                : "Child shortcuts ask which child each time. Tap the chip to pin one to a single child and skip that step."}
            </Text>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.cancel} onPress={handleClose}>
              <Text variant="label2" weight="medium" color={colors.textSecondary}>
                Cancel
              </Text>
            </Pressable>
            <View style={styles.saveWrap}>
              <Button text="Save" onPress={handleSave} isLoading={isSaving} />
            </View>
          </View>
        </View>
      </Modal>
    );
  },
);

CustomizeQuickActions.displayName = "CustomizeQuickActions";
export default CustomizeQuickActions;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    sheet: {
      width: "100%",
      gap: 10,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    scroll: {
      maxHeight: 420,
    },
    scrollBody: {
      gap: 10,
      paddingBottom: 4,
    },
    emptyNote: {
      paddingVertical: 10,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    rowText: {
      flex: 1,
      gap: 6,
    },
    rowTitle: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    pin: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
    },
    rowActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    group: {
      gap: 8,
      paddingTop: 4,
    },
    addRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: colors.background,
    },
    disabled: {
      opacity: 0.45,
    },
    footnote: {
      paddingTop: 4,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingTop: 4,
    },
    cancel: {
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    saveWrap: {
      flex: 1,
    },
  });
