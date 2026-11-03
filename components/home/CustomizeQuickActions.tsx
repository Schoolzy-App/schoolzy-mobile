import {
  CaretDownIcon,
  CaretUpIcon,
  DotsSixVerticalIcon,
  MinusCircleIcon,
  PlusCircleIcon,
  PushPinIcon,
  QuestionIcon,
} from "phosphor-react-native";
import React, { memo, useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ColorPalette } from "@/apps";
import FormButton from "@/components/FormButton";
import { Modal, Text } from "@/components/ui";
import { Opacity, Palette, Radius, Spacing, Type } from "@/constants/tokens";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";
import type { DashboardChild, QuickAction } from "@/services/mappers";

import { moduleStyle } from "./moduleStyle";

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
    const insets = useSafeAreaInsets();

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
      <Modal isVisible={visible} closeModal={handleClose} bare>
        {/* ── Header (white, under the sheet's handle) ───────────── */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={Type.sheetTitle}>Customize Quick Actions</Text>
            <Pressable onPress={onReset} hitSlop={8}>
              <Text style={Type.buttonSmall} color={colors.primary}>
                Reset
              </Text>
            </Pressable>
          </View>
          <Text style={Type.meta} color={Palette.text.tertiary}>
            Choose what appears on Home · {draft.length} of {max}
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollBody}
        >
          {/* ── On Home ──────────────────────────────────────── */}
          <GroupLabel title="On Home" />
          {draft.length === 0 ? (
            <Text style={[Type.meta, styles.emptyNote]} color={Palette.text.tertiary}>
              No shortcuts selected. Home will keep the section with nothing in it.
            </Text>
          ) : (
            <View style={styles.listCard}>
              {draft.map((item, index) => {
                const action = byCode[item.code];
                const studentScoped = action?.isStudentScoped ?? false;
                const pinName = nameOf(item.pinnedStudentId);
                const { Icon, color } = moduleStyle(item.code, action?.label);

                return (
                  <View key={item.code} style={[styles.row, index > 0 && styles.divided]}>
                    <DotsSixVerticalIcon weight="bold" size={16} color={Palette.text.chevron} />
                    <Icon weight="fill" size={20} color={color ?? colors.primary} />
                    <View style={styles.rowText}>
                      <Text style={Type.rowLabel} numberOfLines={1}>
                        {action?.label ?? item.code}
                      </Text>
                      {/* Only student shortcuts need a child. Tapping cycles
                          Ask each time → each child → back. */}
                      {studentScoped && students.length ? (
                        <Pressable
                          style={[
                            styles.pin,
                            pinName && { backgroundColor: `${colors.primary}14` },
                          ]}
                          onPress={() => cyclePin(index)}
                          hitSlop={4}
                        >
                          {pinName ? (
                            <PushPinIcon weight="fill" size={11} color={colors.primary} />
                          ) : (
                            <QuestionIcon size={11} color={Palette.text.secondary} />
                          )}
                          <Text
                            style={Type.tiny}
                            color={pinName ? colors.primary : Palette.text.secondary}
                          >
                            {pinName || "Ask each time"}
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>

                    <CircleButton
                      onPress={() => move(index, -1)}
                      disabled={index === 0}
                    >
                      <CaretUpIcon
                        weight="bold"
                        size={16}
                        color={index === 0 ? DISABLED : Palette.text.tertiary}
                      />
                    </CircleButton>
                    <CircleButton
                      onPress={() => move(index, 1)}
                      disabled={index === draft.length - 1}
                    >
                      <CaretDownIcon
                        weight="bold"
                        size={16}
                        color={index === draft.length - 1 ? DISABLED : Palette.text.tertiary}
                      />
                    </CircleButton>
                    <CircleButton onPress={() => remove(index)}>
                      <MinusCircleIcon weight="fill" size={20} color={Palette.nav.badge} />
                    </CircleButton>
                  </View>
                );
              })}
            </View>
          )}

          {/* ── Available ────────────────────────────────────── */}
          {groups.map((group) => (
            <View key={group.title} style={styles.group}>
              <GroupLabel title={group.title} />
              <View style={styles.listCard}>
                {group.items.map((action, index) => {
                  const { Icon, color } = moduleStyle(action.code, action.label);
                  return (
                    <Pressable
                      key={action.code}
                      style={({ pressed }) => [
                        styles.row,
                        index > 0 && styles.divided,
                        full && styles.disabled,
                        pressed && { backgroundColor: Palette.surface.pressedRow },
                      ]}
                      onPress={() => add(action.code)}
                      disabled={full}
                    >
                      <PlusCircleIcon weight="fill" size={20} color={colors.primary} />
                      <Icon weight="fill" size={20} color={color ?? colors.primary} />
                      <Text style={[Type.rowLabel, styles.rowText]} numberOfLines={1}>
                        {action.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}

          <Text style={[Type.caption, styles.footnote]} color={Palette.text.tertiary}>
            {full
              ? `That's the maximum of ${max}. Remove one to add another.`
              : "Child shortcuts ask which child each time. Tap the chip to pin one to a single child and skip that step."}
          </Text>
        </ScrollView>

        {/* ── Footer ─────────────────────────────────────────── */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 30) }]}>
          <View style={styles.flex}>
            <FormButton
              label="Cancel"
              variant="secondary"
              height={44}
              onPress={handleClose}
            />
          </View>
          <View style={styles.flex}>
            <FormButton
              label="Save"
              height={44}
              color={colors.primary}
              loading={isSaving}
              onPress={handleSave}
            />
          </View>
        </View>
      </Modal>
    );
  },
);

CustomizeQuickActions.displayName = "CustomizeQuickActions";
export default CustomizeQuickActions;

/** Up/down arrows at the ends of the list. */
const DISABLED = "#E0E0E3";

function GroupLabel({ title }: { title: string }) {
  const styles = useStyles(createStyles);
  return (
    <Text style={styles.groupLabel} color={Palette.text.tertiary}>
      {title.toUpperCase()}
    </Text>
  );
}

/** 30×30 round button, grey while pressed. */
function CircleButton({
  children,
  onPress,
  disabled,
}: {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
}) {
  const styles = useStyles(createStyles);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      style={({ pressed }) => [styles.circle, pressed && styles.circlePressed]}
    >
      {children}
    </Pressable>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    header: {
      backgroundColor: colors.surface,
      paddingHorizontal: Spacing.screenX,
      paddingBottom: 14,
      gap: 4,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    scroll: {
      flexGrow: 0,
    },
    scrollBody: {
      padding: Spacing.screenX,
      gap: 10,
    },
    emptyNote: {
      paddingVertical: 10,
    },
    groupLabel: {
      fontSize: 12,
      fontWeight: "600",
      lineHeight: 15,
      letterSpacing: 12 * 0.04,
      paddingHorizontal: 2,
    },
    listCard: {
      backgroundColor: colors.surface,
      borderRadius: Radius.card,
      paddingHorizontal: 12,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
    },
    divided: {
      borderTopWidth: 1,
      borderTopColor: Palette.border.divider,
    },
    rowText: {
      flex: 1,
      gap: 4,
    },
    pin: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: Radius.pill,
      backgroundColor: Palette.form.neutralChip,
    },
    circle: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
    },
    circlePressed: {
      backgroundColor: Palette.border.divider,
    },
    group: {
      gap: 10,
      paddingTop: 4,
    },
    disabled: {
      opacity: Opacity.disabled,
    },
    footnote: {
      paddingHorizontal: 2,
    },
    footer: {
      flexDirection: "row",
      gap: 10,
      paddingTop: 12,
      paddingHorizontal: Spacing.screenX,
      backgroundColor: colors.surface,
    },
  });
