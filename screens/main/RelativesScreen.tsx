import {
  CheckCircleIcon,
  CircleNotchIcon,
  MinusCircleIcon,
  PencilSimpleIcon,
  PlusIcon,
  StudentIcon,
  UsersThreeIcon,
} from "phosphor-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ErrorBanner, InfoNote } from "@/components/form/FormParts";
import { Toast, type ToastMessage } from "@/components/form/Toast";
import FormButton from "@/components/FormButton";
import { QueryState, ScreenTemplate, Text } from "@/components/ui";
import { Palette, Radius, Spacing, Type } from "@/constants/tokens";
import { useRelatives, useUpdateLinkPermission } from "@/hooks";
import type { RootStackScreenProps } from "@/navigation/types";
import type { Relative, RelativeLink } from "@/services/mappers";
import { ApiError } from "@/types/api";

type Props = RootStackScreenProps<"Relatives">;

/** Relatives and their per-child permission (Documentation/Relative-Setting.md §2). */
export default function RelativesScreen({ navigation, route }: Props) {
  const relatives = useRelatives();
  const { mutateAsync: setPermission } = useUpdateLinkPermission();

  const [toast, setToast] = useState<ToastMessage | null>(null);
  const hideToast = useCallback(() => setToast(null), []);
  /** Links being saved, with the value they are moving to. */
  const [pending, setPending] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  // A toast handed over by the form ("Relative saved." / "Relative deleted.").
  const handedToast = route.params?.toast;
  useEffect(() => {
    if (!handedToast) return;
    setToast({ text: handedToast });
    navigation.setParams({ toast: undefined });
  }, [handedToast, navigation]);

  const togglePermission = useCallback(
    async (link: RelativeLink) => {
      if (link.linkId === null || link.linkId in pending) return;
      const linkId = link.linkId;
      const next = !link.hasPermission;
      setError(null);
      setPending((prev) => ({ ...prev, [linkId]: next }));
      try {
        await setPermission({ linkId, hasPermission: next });
        setToast({ text: "Permission updated." });
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Couldn't update the permission.");
      } finally {
        setPending(({ [linkId]: _, ...rest }) => rest);
      }
    },
    [pending, setPermission],
  );

  const list = relatives.data ?? [];

  return (
    <View style={styles.flex}>
      <ScreenTemplate
        variant="form"
        title="Relatives"
        bottomContent={
          <FormButton
            label="Add Relative"
            Icon={PlusIcon}
            onPress={() => navigation.navigate("AddRelative", {})}
          />
        }
      >
        <View style={styles.body}>
          <Text style={styles.intro} color={Palette.text.secondary}>
            Add a relative and choose who may act for your child at school.
          </Text>

          <InfoNote
            title="What “Permission on” means"
            text="The school may hand that child over to this person. On the day they collect, you still send the school a pickup request naming them."
          />

          {error ? <ErrorBanner title={error} /> : null}

          <QueryState
            isLoading={relatives.isLoading}
            error={relatives.error}
            onRetry={relatives.refetch}
          >
            {list.length ? (
              list.map((relative) => (
                <RelativeCard
                  key={relative.id}
                  relative={relative}
                  pending={pending}
                  onEdit={() =>
                    navigation.navigate("AddRelative", { relativeId: relative.relativeId })
                  }
                  onToggle={togglePermission}
                />
              ))
            ) : (
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <UsersThreeIcon size={30} color={Palette.action.primary} />
                </View>
                <Text style={styles.emptyTitle}>No relatives yet</Text>
                <Text style={styles.emptyBody} color={Palette.text.secondary}>
                  Add a grandparent, a driver or anyone else who may collect your
                  children from school.
                </Text>
              </View>
            )}
          </QueryState>
        </View>
      </ScreenTemplate>
      <Toast message={toast} onHide={hideToast} />
    </View>
  );
}

function RelativeCard({
  relative,
  pending,
  onEdit,
  onToggle,
}: {
  relative: Relative;
  pending: Record<number, boolean>;
  onEdit: () => void;
  onToggle: (link: RelativeLink) => void;
}) {
  const meta = [relative.relationship, relative.phone].filter(Boolean).join(" · ");
  return (
    <View style={styles.card}>
      <Pressable onPress={onEdit} style={styles.header}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: relative.hasPhoto ? Palette.action.primary : Palette.form.skeleton },
          ]}
        >
          <Text
            style={styles.initials}
            color={relative.hasPhoto ? Palette.text.onBrand : Palette.text.secondary}
          >
            {relative.initials}
          </Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.name} numberOfLines={1}>
            {relative.name}
          </Text>
          {meta ? (
            <Text style={Type.meta} color={Palette.text.secondary} numberOfLines={1}>
              {meta}
            </Text>
          ) : null}
        </View>
        <PencilSimpleIcon weight="bold" size={18} color={Palette.text.tertiary} />
      </Pressable>

      {relative.links.length ? (
        <View style={styles.children}>
          {relative.links.map((link) => {
            const isPending = link.linkId !== null && link.linkId in pending;
            const on = isPending ? pending[link.linkId as number] : link.hasPermission;
            return (
              <View key={link.id} style={styles.childRow}>
                <StudentIcon size={16} color={Palette.text.secondary} />
                <Text style={[styles.childName, styles.flex]} numberOfLines={1}>
                  {link.studentName}
                </Text>
                <PermissionPill
                  on={on}
                  pending={isPending}
                  disabled={link.linkId === null}
                  onPress={() => onToggle(link)}
                />
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function PermissionPill({
  on,
  pending,
  disabled,
  onPress,
}: {
  on: boolean;
  pending: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={pending || disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: on, busy: pending }}
      style={[styles.pill, on ? styles.pillOn : styles.pillOff]}
    >
      {pending ? (
        <CircleNotchIcon weight="bold" size={15} color={Palette.text.secondary} />
      ) : on ? (
        <CheckCircleIcon weight="fill" size={15} color={Palette.feedback.success} />
      ) : (
        <MinusCircleIcon size={15} color={Palette.text.tertiary} />
      )}
      <Text style={styles.pillText} numberOfLines={1}>
        {on ? "Permission on" : "Permission off"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  body: {
    width: "100%",
    paddingTop: Spacing.form.bodyPadding,
    paddingHorizontal: Spacing.form.bodyPadding,
    paddingBottom: 24,
    gap: 14,
  },
  intro: {
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: Palette.surface.card,
    borderRadius: Radius.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 19,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 20,
  },
  children: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Palette.border.divider,
    gap: 8,
  },
  childRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  childName: {
    fontSize: 14,
    lineHeight: 18,
  },
  pill: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pillOn: {
    backgroundColor: "#1CC88A1F",
    borderColor: "#1CC88A66",
  },
  pillOff: {
    backgroundColor: Palette.form.neutralChip,
    borderColor: Palette.form.inputBorder,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 16,
    color: Palette.text.primary,
  },
  empty: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 40,
    paddingHorizontal: 22,
    borderRadius: Radius.card,
    backgroundColor: Palette.surface.card,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#4E73DF14",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 22,
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});
