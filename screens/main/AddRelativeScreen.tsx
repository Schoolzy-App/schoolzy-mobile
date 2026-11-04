import * as ImagePicker from "expo-image-picker";
import {
  CameraIcon,
  CheckSquareIcon,
  LockSimpleIcon,
  SquareIcon,
  TrashIcon,
  UserIcon,
  UserMinusIcon,
} from "phosphor-react-native";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ErrorBanner, Field, FieldError, RadioCard, TextField } from "@/components/form/FormParts";
import { SelectField } from "@/components/form/SelectField";
import FormButton from "@/components/FormButton";
import { Modal, QueryState, ScreenTemplate, Text } from "@/components/ui";
import { Palette, Radius, Size, Spacing, Type } from "@/constants/tokens";
import {
  useDeleteRelative,
  useGenders,
  useGuardianStudents,
  useNationalities,
  useParentInfo,
  useRelative,
  useRelativeTypes,
  useSaveRelative,
  useUpdateLinkPermission,
} from "@/hooks";
import type { RootStackScreenProps } from "@/navigation/types";
import type { UploadFile } from "@/services/api/multipart";
import type { RelativeDetail } from "@/services/mappers";
import { ApiError } from "@/types/api";
import type { AssignRelativeStudentInput } from "@/types/api";

type Props = RootStackScreenProps<"AddRelative">;

type TextFieldKey = "nameEn" | "phone" | "email" | "nationalId";
type FieldKey = TextFieldKey | "nationalityId" | "type" | "genderId" | "side" | "children" | "photo";

/** Server rules (ParentProfileAppService): ≤200 name, JPG/PNG ≤ 5 MB. */
const NAME_MAX_LENGTH = 200;
const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const PHOTO_EXTENSIONS = ["jpg", "jpeg", "png"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LABELS: Record<FieldKey, string> = {
  nameEn: "Full name",
  phone: "Phone",
  email: "Email",
  nationalId: "National ID",
  nationalityId: "Nationality",
  type: "Relationship",
  genderId: "Gender",
  side: "Relative of",
  children: "Children",
  photo: "Photo",
};

const digitsOnly = (text: string) => text.replace(/\D/g, "");

function savedValue(relative: RelativeDetail | undefined, field: TextFieldKey | "nationalityId") {
  if (!relative) return "";
  if (field === "nationalityId") return relative.nationalityId ? String(relative.nationalityId) : "";
  return relative[field];
}

type Side = "father" | "mother";

/** Per child: chosen, and whether the relative may act for them. */
interface ChildChoice {
  selected: boolean;
  permission: boolean;
}

/** Add / Edit relative (Documentation/Relative-Setting.md §3–5). */
export default function AddRelativeScreen({ navigation, route }: Props) {
  const editingId = route.params?.relativeId;
  const editing = typeof editingId === "number";

  const guardians = useGuardianStudents();
  const relativeTypes = useRelativeTypes();
  const nationalities = useNationalities();
  const genders = useGenders();
  const parentInfo = useParentInfo();
  const existing = useRelative(editingId);
  const relative = existing.data;
  const { mutateAsync: setPermission } = useUpdateLinkPermission(editingId);
  const { mutateAsync: deleteRelative, isPending: deleting } = useDeleteRelative();

  /** Edits only, falling back to the saved relative — no seeding effect. */
  const [draft, setDraft] = useState<
    Partial<Record<TextFieldKey | "nationalityId" | "type" | "genderId" | "side", string>>
  >({});
  const [photo, setPhoto] = useState<UploadFile | null>(null);
  const [children, setChildren] = useState<Record<number, ChildChoice>>({});
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  /** The save went through but a permission change after it didn't. */
  const [permissionError, setPermissionError] = useState<string | null>(null);
  /** Permission changes to send once the save succeeds. */
  const permissionChangesRef = useRef<{ linkId: number; hasPermission: boolean }[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  /**
   * Links that already exist, by studentSeasonId. Save Relative leaves an
   * active link as it is — its child can't be unlinked and its relationship
   * can't change here — so those children show checked and locked, and only
   * their permission (its own endpoint) can be changed.
   */
  const existingLinks = useMemo(
    () =>
      new Map(
        (relative?.links ?? [])
          .filter((link) => link.studentSeasonId !== null)
          .map((link) => [link.studentSeasonId as number, link]),
      ),
    [relative],
  );
  const relationshipLocked = existingLinks.size > 0;

  const valueOf = (field: TextFieldKey | "nationalityId") => draft[field] ?? savedValue(relative, field);
  const typeValue =
    draft.type ?? (relative?.relationshipType ? String(relative.relationshipType) : "");

  const genderValue = draft.genderId ?? (relative?.genderId ? String(relative.genderId) : "");

  /**
   * Whose side of the family the relative is on — a link's `mainParentId`,
   * which is that child's father or mother. An existing link's value wins
   * (and is locked, like the relationship); otherwise it defaults to the
   * signed-in parent, and the parent can switch it.
   */
  const existingSide = useMemo((): Side | "" => {
    for (const student of guardians.data ?? []) {
      const link = existingLinks.get(student.studentSeasonId);
      if (!link?.mainParentId) continue;
      if (link.mainParentId === student.fatherId) return "father";
      if (link.mainParentId === student.motherId) return "mother";
    }
    return "";
  }, [guardians.data, existingLinks]);
  const ownSide: Side | "" =
    parentInfo.data?.role?.toLowerCase() === "father"
      ? "father"
      : parentInfo.data?.role?.toLowerCase() === "mother"
        ? "mother"
        : "";
  const sideLocked = existingSide !== "";
  const sideValue = (sideLocked ? existingSide : (draft.side as Side | undefined) ?? ownSide) || "";
  const firstStudent = guardians.data?.[0];

  const clearError = (field: FieldKey) =>
    errors[field] && setErrors((prev) => ({ ...prev, [field]: undefined }));
  const setValue = (field: TextFieldKey | "nationalityId" | "type" | "genderId" | "side") => (next: string) => {
    setDraft((prev) => ({ ...prev, [field]: next }));
    clearError(field);
  };

  const choiceOf = (studentSeasonId: number): ChildChoice => {
    const link = existingLinks.get(studentSeasonId);
    const choice = children[studentSeasonId];
    if (link) return { selected: true, permission: choice?.permission ?? link.hasPermission };
    return choice ?? { selected: false, permission: true };
  };
  const setChoice = (studentSeasonId: number, patch: Partial<ChildChoice>) => {
    setChildren((prev) => ({ ...prev, [studentSeasonId]: { ...choiceOf(studentSeasonId), ...patch } }));
    clearError("children");
  };

  const goBackWith = useCallback(
    (toast: string) => navigation.navigate("Relatives", { toast }),
    [navigation],
  );

  const { submit, retry, canRetry, isProcessing, isPending, error: saveError } = useSaveRelative(
    async () => {
      try {
        await Promise.all(permissionChangesRef.current.map((change) => setPermission(change)));
        goBackWith("Relative saved.");
      } catch (e) {
        setPermissionError(
          e instanceof ApiError ? e.message : "The relative was saved, but a permission wasn't updated.",
        );
      }
    },
  );
  const serverErrors: string[] | null = permissionError
    ? [permissionError]
    : saveError
      ? saveError instanceof ApiError && saveError.errors.length
        ? saveError.errors
        : [saveError instanceof ApiError ? saveError.message : "The relative was not saved."]
      : null;

  // ── Photo ──────────────────────────────────────────────────────────────
  const handlePickPhoto = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setErrors((prev) => ({ ...prev, photo: "Allow photo access to choose a photo." }));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const name = asset.fileName ?? asset.uri.split("/").pop() ?? "photo.jpg";
    const extension = name.split(".").pop()?.toLowerCase() ?? "";
    if (!PHOTO_EXTENSIONS.includes(extension)) {
      setErrors((prev) => ({ ...prev, photo: `${name} isn't a JPG or PNG.` }));
      return;
    }
    if (asset.fileSize && asset.fileSize > PHOTO_MAX_BYTES) {
      const mb = (asset.fileSize / 1024 / 1024).toFixed(1);
      setErrors((prev) => ({ ...prev, photo: `${name} is ${mb} MB. The maximum is 5 MB.` }));
      return;
    }
    // The backend rejects application/octet-stream, so a real image type is set.
    setPhoto({ uri: asset.uri, name, type: extension === "png" ? "image/png" : "image/jpeg" });
    clearError("photo");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errors.photo]);

  // ── Save ───────────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    if (isPending) return;
    setPermissionError(null);

    const value = (field: TextFieldKey) => valueOf(field).trim();
    const selected = (guardians.data ?? []).filter((s) => choiceOf(s.studentSeasonId).selected);

    const next: Partial<Record<FieldKey, string>> = {};
    if (!value("nameEn")) next.nameEn = "Enter the relative's full name.";
    else if (value("nameEn").length > NAME_MAX_LENGTH)
      next.nameEn = `Keep it under ${NAME_MAX_LENGTH} characters.`;
    if (!typeValue) next.type = "Choose the relationship.";
    if (value("email") && !EMAIL_PATTERN.test(value("email")))
      next.email = "Enter a valid email address.";
    if (!value("nationalId")) next.nationalId = "Enter the National ID or passport number.";
    if (!selected.length) next.children = "Select at least one child.";
    if (errors.photo) next.photo = errors.photo;
    setErrors(next);
    if (Object.keys(next).length) return;

    // Every selected child goes in — the server needs at least one and keeps
    // already-active links exactly as they are.
    const students: AssignRelativeStudentInput[] = selected.map((s) => ({
      studentSeasonId: s.studentSeasonId,
      type: Number(typeValue),
      mainParentId: sideValue === "father" ? s.fatherId : sideValue === "mother" ? s.motherId : null,
      hasPermission: choiceOf(s.studentSeasonId).permission,
    }));

    // Permission changes on existing links use their own endpoint, after the save.
    permissionChangesRef.current = [...existingLinks.entries()]
      .filter(([seasonId, link]) => link.linkId !== null && choiceOf(seasonId).permission !== link.hasPermission)
      .map(([seasonId, link]) => ({
        linkId: link.linkId as number,
        hasPermission: choiceOf(seasonId).permission,
      }));

    submit({
      request: {
          relativeId: editingId ?? null,
          nameEn: value("nameEn"),
          // Not on this form; kept as saved so an edit doesn't clear it.
          nameAr: relative?.nameAr || null,
          genderId: genderValue ? Number(genderValue) : null,
          nationalId: value("nationalId"),
          phone: value("phone") || null,
          email: value("email") || null,
          nationalityId: valueOf("nationalityId") ? Number(valueOf("nationalityId")) : null,
          students,
        },
      photo: photo ?? undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending, draft, children, photo, errors.photo, guardians.data, relative, existingLinks, typeValue, genderValue, sideValue]);

  const handleDelete = useCallback(async () => {
    if (!editing) return;
    setDeleteError(null);
    try {
      await deleteRelative(editingId);
      setConfirmDelete(false);
      goBackWith("Relative deleted.");
    } catch (e) {
      setDeleteError(e instanceof ApiError ? e.message : "Couldn't delete this relative.");
    }
  }, [editing, editingId, deleteRelative, goBackWith]);

  // ── Not found ──────────────────────────────────────────────────────────
  const notFound = editing && existing.error instanceof ApiError && existing.error.status === 404;
  if (notFound) {
    return (
      <ScreenTemplate variant="form" title="Edit Relative">
        <View style={styles.notFound}>
          <View style={styles.notFoundIcon}>
            <UserMinusIcon size={30} color={Palette.text.secondary} />
          </View>
          <Text style={styles.notFoundTitle}>This relative is no longer available.</Text>
          <FormButton
            label="Back to Relatives"
            height={48}
            onPress={() => navigation.navigate("Relatives", {})}
          />
        </View>
      </ScreenTemplate>
    );
  }

  const errorList = (Object.keys(errors) as FieldKey[])
    .filter((key) => errors[key])
    .map((key) => `${LABELS[key]}: ${errors[key]}`);
  const saving = isPending || isProcessing;

  return (
    <ScreenTemplate
      variant="form"
      title={editing ? "Edit Relative" : "Add Relative"}
      bottomContent={
        <View style={styles.footer}>
          <Pressable style={styles.cancel} onPress={() => navigation.goBack()} disabled={saving}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <View style={styles.saveCell}>
            <FormButton
              label={saving ? "Saving…" : canRetry ? "Retry save" : "Save"}
              loading={saving}
              onPress={canRetry ? retry : handleSave}
            />
          </View>
        </View>
      }
    >
      <QueryState
        isLoading={guardians.isLoading || (editing && existing.isLoading)}
        error={guardians.error ?? (editing ? existing.error : null)}
        onRetry={() => {
          guardians.refetch();
          if (editing) existing.refetch();
        }}
      >
        <View style={styles.body}>
          {errorList.length ? (
            <ErrorBanner title="Please correct the highlighted fields." items={errorList} />
          ) : serverErrors ? (
            <ErrorBanner
              title="Something went wrong. Your changes were not saved."
              items={serverErrors}
              message={
                canRetry
                  ? "It may still have gone through — Retry save resends the same request, so it won't add the relative twice."
                  : undefined
              }
            />
          ) : null}

          {/* ── Photo ─────────────────────────────────────────────── */}
          <View>
            <View style={styles.photoRow}>
              <Pressable
                onPress={handlePickPhoto}
                style={[
                  styles.photoCircle,
                  { backgroundColor: photo || relative?.hasPhoto ? "#4E73DF14" : Palette.form.skeleton },
                ]}
              >
                {photo || relative?.hasPhoto ? (
                  <UserIcon weight="fill" size={28} color={Palette.action.primary} />
                ) : (
                  <CameraIcon size={26} color={Palette.text.tertiary} />
                )}
              </Pressable>
              <View style={styles.photoText}>
                <Text style={Type.fieldLabel}>
                  Photo <Text style={Type.fieldHint} color={Palette.text.tertiary}>· Optional</Text>
                </Text>
                {photo ? (
                  <View style={styles.photoSet}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {photo.name}
                    </Text>
                    <Pressable onPress={() => setPhoto(null)} hitSlop={8}>
                      <Text style={styles.remove} color={Palette.form.inputError}>
                        Remove
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <>
                    <Pressable onPress={handlePickPhoto} hitSlop={6}>
                      <Text style={styles.choose} color={Palette.action.primary}>
                        {relative?.hasPhoto ? "Change photo" : "Choose photo"}
                      </Text>
                    </Pressable>
                    <Text style={styles.photoHint} color={Palette.text.secondary}>
                      JPG, JPEG or PNG · up to 5 MB
                    </Text>
                  </>
                )}
              </View>
            </View>
            {errors.photo ? (
              <View style={styles.photoError}>
                <FieldError message={errors.photo} />
              </View>
            ) : null}
          </View>

          <Field label="Full name" hint="Required" error={errors.nameEn}>
            <TextField
              value={valueOf("nameEn")}
              onChangeText={setValue("nameEn")}
              placeholder="e.g. Samir Hassan"
              invalid={!!errors.nameEn}
              maxLength={NAME_MAX_LENGTH}
              editable={!saving}
            />
          </Field>

          <Field label="Gender" hint="Optional">
            <View style={styles.chips}>
              {(genders.data ?? []).map((option) => {
                const selected = option.value === genderValue;
                return (
                  <Pressable
                    key={option.value}
                    disabled={saving}
                    onPress={() => setValue("genderId")(selected ? "" : option.value)}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text
                      style={styles.chipText}
                      color={selected ? Palette.text.onBrand : Palette.text.primary}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>

          <Field label="Relationship" hint={relationshipLocked ? undefined : "Required"} error={errors.type}>
            <View style={styles.chips}>
              {(relativeTypes.data ?? []).map((option) => {
                const selected = option.value === typeValue;
                return (
                  <Pressable
                    key={option.value}
                    disabled={relationshipLocked || saving}
                    onPress={() => setValue("type")(option.value)}
                    style={[
                      styles.chip,
                      selected && styles.chipSelected,
                      !selected && !!errors.type && { borderColor: Palette.form.optionErrorBorder },
                      relationshipLocked && !selected && styles.chipLocked,
                    ]}
                  >
                    <Text
                      style={styles.chipText}
                      color={selected ? Palette.text.onBrand : Palette.text.primary}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {relationshipLocked ? (
              <View style={styles.lockedNote}>
                <LockSimpleIcon size={14} color={Palette.text.tertiary} />
                <Text style={[styles.photoHint, styles.flex]} color={Palette.text.secondary}>
                  Set when the relative was added. Contact the school office to change it.
                </Text>
              </View>
            ) : null}
          </Field>

          {firstStudent && (firstStudent.fatherId || firstStudent.motherId) ? (
            <Field label="Relative of">
              <View style={styles.sides}>
                {(["father", "mother"] as const)
                  .filter((side) => (side === "father" ? firstStudent.fatherId : firstStudent.motherId))
                  .map((side) => {
                    const name = side === "father" ? firstStudent.fatherName : firstStudent.motherName;
                    return (
                      <View key={side} style={sideLocked && sideValue !== side ? styles.chipLocked : undefined}>
                        <RadioCard
                          title={side === "father" ? "Father's side" : "Mother's side"}
                          description={[name, side === ownSide ? "You" : ""].filter(Boolean).join(" · ")}
                          selected={sideValue === side}
                          onPress={() => !sideLocked && !saving && setValue("side")(side)}
                        />
                      </View>
                    );
                  })}
              </View>
              {sideLocked ? (
                <View style={styles.lockedNote}>
                  <LockSimpleIcon size={14} color={Palette.text.tertiary} />
                  <Text style={[styles.photoHint, styles.flex]} color={Palette.text.secondary}>
                    Set when the relative was added. Contact the school office to change it.
                  </Text>
                </View>
              ) : null}
            </Field>
          ) : null}

          <Field label="Phone" hint="Optional">
            <TextField
              value={valueOf("phone")}
              onChangeText={(text) => setValue("phone")(digitsOnly(text))}
              keyboardType="number-pad"
              editable={!saving}
            />
          </Field>

          <Field label="Email" hint="Optional" error={errors.email}>
            <TextField
              value={valueOf("email")}
              onChangeText={setValue("email")}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              invalid={!!errors.email}
              editable={!saving}
            />
          </Field>

          {/* The design marks this optional; the API requires it (duplicate check). */}
          <Field label="National ID" hint="Required" error={errors.nationalId}>
            <TextField
              value={valueOf("nationalId")}
              onChangeText={setValue("nationalId")}
              placeholder="National ID or passport number"
              autoCapitalize="characters"
              invalid={!!errors.nationalId}
              editable={!saving}
            />
          </Field>

          <Field label="Nationality" hint="Optional">
            <SelectField
              title="Nationality"
              placeholder="Select nationality"
              value={valueOf("nationalityId")}
              options={nationalities.data ?? []}
              onChange={setValue("nationalityId")}
              disabled={saving}
              loading={nationalities.isLoading}
              emptyText="Nationality list is unavailable."
            />
          </Field>

          {/* ── Children ──────────────────────────────────────────── */}
          <View style={styles.childrenBlock}>
            <View>
              <Text style={Type.fieldLabel}>Children</Text>
              <Text style={styles.childrenHint} color={Palette.text.secondary}>
                Select at least one child.
              </Text>
            </View>
            {(guardians.data ?? []).map((student) => {
              const choice = choiceOf(student.studentSeasonId);
              const linked = existingLinks.has(student.studentSeasonId);
              return (
                <View
                  key={student.id}
                  style={[
                    styles.childCard,
                    choice.selected && { borderColor: Palette.action.primary },
                    !choice.selected && !!errors.children && { borderColor: Palette.form.optionErrorBorder },
                  ]}
                >
                  <Pressable
                    style={styles.childRow}
                    disabled={linked || saving}
                    onPress={() => setChoice(student.studentSeasonId, { selected: !choice.selected })}
                  >
                    {choice.selected ? (
                      <CheckSquareIcon weight="fill" size={22} color={Palette.action.primary} />
                    ) : (
                      <SquareIcon size={22} color={Palette.text.chevron} />
                    )}
                    <Text style={[styles.childName, styles.flex]} numberOfLines={1}>
                      {student.studentName}
                    </Text>
                    {linked ? (
                      <Text style={Type.meta} color={Palette.text.tertiary}>
                        Linked
                      </Text>
                    ) : null}
                  </Pressable>
                  {choice.selected ? (
                    <View style={styles.permissionRow}>
                      <Text style={[styles.permissionText, styles.flex]}>
                        Allow this relative to act for this child
                      </Text>
                      <Switch
                        value={choice.permission}
                        disabled={saving}
                        onChange={(permission) => setChoice(student.studentSeasonId, { permission })}
                      />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>

          <Text style={styles.help} color={Palette.text.secondary}>
            You stay the main guardian. Permission on means the school may hand that
            child over to this person — on the day, you still send the school a pickup
            request naming them.
          </Text>

          {editing ? (
            <Pressable style={styles.deleteButton} onPress={() => setConfirmDelete(true)}>
              <TrashIcon weight="bold" size={18} color={Palette.form.inputError} />
              <Text style={styles.deleteText} color={Palette.form.inputError}>
                Delete relative
              </Text>
            </Pressable>
          ) : null}
        </View>
      </QueryState>

      {/* ── Delete confirmation ─────────────────────────────────────── */}
      <Modal isVisible={confirmDelete} closeModal={() => !deleting && setConfirmDelete(false)}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Delete {relative?.name ?? "this relative"}?</Text>
          <Text style={styles.sheetBody}>
            They'll be removed from all your children and the school won't be able to
            select them to collect anyone.
          </Text>
          {deleteError ? <ErrorBanner title={deleteError} /> : null}
          <FormButton
            label={deleting ? "Deleting…" : "Delete relative"}
            color={Palette.form.inputError}
            loading={deleting}
            onPress={handleDelete}
          />
          <Pressable style={styles.sheetCancel} onPress={() => setConfirmDelete(false)} disabled={deleting}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>
    </ScreenTemplate>
  );
}

/** Track 46×28, knob 22 (Relative Setting §3). */
function Switch({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onChange(!value)}
      hitSlop={6}
      style={[styles.track, { backgroundColor: value ? Palette.form.switchOn : Palette.form.switchOff }]}
    >
      <View style={[styles.knob, { left: value ? 21 : 3 }]} />
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
    gap: 18,
  },
  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  photoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  photoText: {
    flex: 1,
    gap: 3,
  },
  photoSet: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fileName: {
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 17,
    color: Palette.text.body,
  },
  remove: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 17,
  },
  choose: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
  },
  photoHint: {
    fontSize: 12,
    lineHeight: 16,
  },
  photoError: {
    marginTop: 8,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: Size.inputBorderWidth,
    borderColor: Palette.form.inputBorder,
    backgroundColor: Palette.surface.card,
    justifyContent: "center",
  },
  chipSelected: {
    backgroundColor: Palette.action.primary,
    borderColor: Palette.action.primary,
  },
  chipLocked: {
    opacity: 0.5,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 17,
  },
  sides: {
    gap: 8,
  },
  lockedNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  childrenBlock: {
    gap: 10,
  },
  childrenHint: {
    fontSize: 13,
    lineHeight: 17,
    marginTop: 2,
  },
  childCard: {
    borderRadius: Radius.input,
    borderWidth: Size.inputBorderWidth,
    borderColor: Palette.form.inputBorder,
    backgroundColor: Palette.surface.card,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  childRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  childName: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 20,
  },
  permissionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Palette.form.permissionRowBg,
  },
  permissionText: {
    fontSize: 14,
    lineHeight: 19,
  },
  track: {
    width: 46,
    height: 28,
    borderRadius: 14,
  },
  knob: {
    position: "absolute",
    top: 3,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  help: {
    fontSize: 13,
    lineHeight: 19,
  },
  deleteButton: {
    height: 46,
    borderRadius: 23,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  deleteText: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
  },
  cancel: {
    flex: 1,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 19,
    color: Palette.text.primary,
  },
  saveCell: {
    flex: 1.6,
  },
  sheet: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    gap: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 22,
  },
  sheetBody: {
    fontSize: 15,
    lineHeight: 22,
    color: Palette.text.body,
    marginBottom: 6,
  },
  sheetCancel: {
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  notFound: {
    alignItems: "center",
    gap: 14,
    paddingTop: 72,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  notFoundIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Palette.form.emptyIconBg,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 22,
    textAlign: "center",
  },
});
