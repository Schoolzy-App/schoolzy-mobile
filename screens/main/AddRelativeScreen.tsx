import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  type ImageStyle,
  Pressable,
  StyleSheet,
  Switch,
  View,
} from "react-native";

import type { ColorPalette } from "@/apps";
import {
  Button,
  DefaultInput,
  QueryState,
  ScreenTemplate,
  Text,
} from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import {
  useGenders,
  useGuardianStudents,
  useNationalities,
  useRelative,
  useRelativeTypes,
  useSaveRelative,
  useStyles,
} from "@/hooks";
import type { RootStackScreenProps } from "@/navigation/types";
import type { UploadFile } from "@/services/api/multipart";
import type { GuardianStudent, RelativeDetail } from "@/services/mappers";
import { ApiError } from "@/types/api";
import type { AssignRelativeStudentInput } from "@/types/api";

type Props = RootStackScreenProps<"AddRelative">;

/** Per-student assignment state, keyed by studentSeasonId. */
interface Assignment {
  selected: boolean;
  type: string;
  mainParentId: string;
  hasPermission: boolean;
}

type PersonField =
  | "nameEn"
  | "nameAr"
  | "nationalId"
  | "phone"
  | "email"
  | "genderId"
  | "nationalityId";

/** The loaded relative's value for a field, as a string the inputs hold. */
function personValue(
  relative: RelativeDetail | undefined,
  field: PersonField,
): string {
  if (!relative) return "";
  if (field === "genderId") {
    return relative.genderId ? String(relative.genderId) : "";
  }
  if (field === "nationalityId") {
    return relative.nationalityId ? String(relative.nationalityId) : "";
  }
  return relative[field];
}

const EMPTY_ASSIGNMENT: Assignment = {
  selected: false,
  type: "",
  mainParentId: "",
  hasPermission: false,
};

export default function AddRelativeScreen({ navigation, route }: Props) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const editingId = route.params?.relativeId;

  const guardians = useGuardianStudents();
  const genders = useGenders();
  const relativeTypes = useRelativeTypes();
  const nationalities = useNationalities();
  const existing = useRelative(editingId);

  const lookupsLoading =
    guardians.isLoading || genders.isLoading || relativeTypes.isLoading;
  // Students are the only lookup the form cannot work without — at least one
  // assignment is required by the contract.
  const lookupsError = guardians.error;

  /**
   * Edits only, falling back to the loaded relative when editing.
   *
   * No seeding effect, and a background refetch can't overwrite something the
   * parent is halfway through typing.
   *
   * Existing links are deliberately not pre-selected: Save Relative cannot
   * edit an active link, so offering their fields would imply a change that
   * silently wouldn't happen.
   */
  const [draft, setDraft] = useState<Partial<Record<PersonField, string>>>({});
  const [photo, setPhoto] = useState<UploadFile | null>(null);
  const [assignments, setAssignments] = useState<Record<string, Assignment>>({});

  // Memoized so the submit callback isn't rebuilt on every keystroke.
  const valueOf = useCallback(
    (field: PersonField): string =>
      draft[field] ?? personValue(existing.data, field),
    [draft, existing.data],
  );

  const setValue = (field: PersonField) => (next: string) =>
    setDraft((prev) => ({ ...prev, [field]: next }));

  const {
    submit,
    retry,
    canRetry,
    isProcessing,
    isPending,
    error: saveError,
  } = useSaveRelative(() => navigation.goBack());

  const setAssignment = useCallback(
    (key: string, patch: Partial<Assignment>) =>
      setAssignments((prev) => ({
        ...prev,
        [key]: { ...EMPTY_ASSIGNMENT, ...prev[key], ...patch },
      })),
    [],
  );

  /**
   * ⚠️ The backend rejects `application/octet-stream` even when the filename
   * ends in .png, so a real image MIME type is required. Images only —
   * attaching other document types needs `expo-document-picker`, a native
   * dependency and therefore a new build.
   */
  const handlePickPhoto = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow photo library access to add a photo.",
      );
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
    const extension = asset.uri.split(".").pop()?.toLowerCase();
    const type =
      asset.mimeType && asset.mimeType.startsWith("image/")
        ? asset.mimeType
        : extension === "png"
          ? "image/png"
          : "image/jpeg";

    setPhoto({
      uri: asset.uri,
      name: asset.fileName ?? `relative-${Date.now()}.${extension ?? "jpg"}`,
      type,
    });
  }, []);

  const selectedStudents = Object.entries(assignments).filter(
    ([, a]) => a.selected,
  );

  const canSubmit =
    !!valueOf("nameEn").trim() &&
    !!valueOf("nationalId").trim() &&
    selectedStudents.length > 0 &&
    !isPending;

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;

    const students: AssignRelativeStudentInput[] = selectedStudents.map(
      ([key, a]) => ({
        studentSeasonId: Number(key),
        // Null lets the backend default to Other rather than guessing a value.
        type: a.type ? Number(a.type) : null,
        mainParentId: a.mainParentId ? Number(a.mainParentId) : null,
        hasPermission: a.hasPermission,
      }),
    );

    submit({
      request: {
        relativeId: editingId ?? null,
        nameEn: valueOf("nameEn").trim(),
        // Swagger: optional, English is used when empty.
        nameAr: valueOf("nameAr").trim() || null,
        nationalId: valueOf("nationalId").trim(),
        phone: valueOf("phone").trim() || null,
        email: valueOf("email").trim() || null,
        genderId: valueOf("genderId") ? Number(valueOf("genderId")) : null,
        nationalityId: valueOf("nationalityId")
          ? Number(valueOf("nationalityId"))
          : null,
        students,
      },
      photo: photo ?? undefined,
    });
  }, [canSubmit, selectedStudents, submit, editingId, valueOf, photo]);

  const errorMessage =
    saveError instanceof ApiError
      ? saveError.message
      : saveError
        ? "Could not save the relative. Please try again."
        : null;

  return (
    <ScreenTemplate
      title={editingId ? "Edit Relative" : "Add Relative"}
      bottomContent={
        <Button
          text={canRetry ? "Retry save" : "Save"}
          onPress={canRetry ? retry : handleSubmit}
          disabled={canRetry ? isPending : !canSubmit}
          isLoading={isPending}
        />
      }
    >
      <QueryState
        isLoading={lookupsLoading}
        error={lookupsError}
        onRetry={guardians.refetch}
      >
        <View style={styles.container}>
          {/* ── Photo ──────────────────────────────────────────── */}
          <View style={styles.photoRow}>
            <Pressable onPress={handlePickPhoto}>
              {photo ? (
                <Image
                  source={{ uri: photo.uri }}
                  style={styles.photo as ImageStyle}
                />
              ) : (
                <View style={[styles.photo, styles.photoEmpty]}>
                  <MaterialIcons
                    name="add-a-photo"
                    size={22}
                    color={colors.textSecondary}
                  />
                </View>
              )}
            </Pressable>
            <View style={styles.photoText}>
              <Text variant="label3" weight="medium">
                {photo ? "Photo selected" : "Add a photo (optional)"}
              </Text>
              <Text
                variant="caption1"
                weight="regular"
                color={colors.textSecondary}
              >
                {editingId && !photo
                  ? "Leaving this empty keeps the current photo."
                  : "JPEG or PNG, up to 5 MB."}
              </Text>
            </View>
          </View>

          {/* ── Person ─────────────────────────────────────────── */}
          <DefaultInput
            label="Name (English)"
            value={valueOf("nameEn")}
            onChange={setValue("nameEn")}
            type="text"
            placeholder="Full name"
          />

          <DefaultInput
            label="Name (Arabic)"
            value={valueOf("nameAr")}
            onChange={setValue("nameAr")}
            type="text"
            placeholder="Optional — English is used when empty"
          />

          <DefaultInput
            label="National ID or passport"
            value={valueOf("nationalId")}
            onChange={setValue("nationalId")}
            type="text"
            placeholder="Identity number"
            autoCapitalize="characters"
          />

          <DefaultInput
            label="Phone"
            value={valueOf("phone")}
            onChange={setValue("phone")}
            type="text"
            placeholder="Digits only"
            keyboardType="phone-pad"
          />

          <DefaultInput
            label="Email"
            value={valueOf("email")}
            onChange={setValue("email")}
            type="text"
            placeholder="Optional"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.z30}>
            <DefaultInput
              label="Gender"
              value={valueOf("genderId")}
              onChange={setValue("genderId")}
              type="select"
              placeholder="Optional"
              options={genders.data ?? []}
            />
          </View>

          <View style={styles.z20}>
            <DefaultInput
              label="Nationality"
              value={valueOf("nationalityId")}
              onChange={setValue("nationalityId")}
              type="select"
              placeholder="Optional"
              options={nationalities.data ?? []}
            />
          </View>

          {/* ── Children ───────────────────────────────────────── */}
          <View style={styles.section}>
            <Text variant="label2" weight="semiBold">
              Link to children
            </Text>
            <Text
              variant="caption1"
              weight="regular"
              color={colors.textSecondary}
            >
              Choose at least one. The relationship is set per child, and the
              parent list below is that child&apos;s own.
            </Text>

            {guardians.data?.map((student) => (
              <StudentAssignment
                key={student.id}
                student={student}
                assignment={assignments[student.id]}
                typeOptions={relativeTypes.data ?? []}
                onChange={setAssignment}
              />
            ))}
          </View>

          {/* Editing note: active links are untouched by Save. */}
          {editingId ? (
            <Text
              variant="caption1"
              weight="regular"
              color={colors.textSecondary}
            >
              Saving updates this person&apos;s details and adds any new child
              links. Children already linked keep their existing relationship —
              change pickup permission from the relative&apos;s page.
            </Text>
          ) : null}

          {isProcessing ? (
            <View style={styles.notice}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text
                variant="label3"
                weight="regular"
                color={colors.textSecondary}
              >
                Still saving. Don&apos;t submit again — retrying resends the
                same request.
              </Text>
            </View>
          ) : null}

          {errorMessage ? (
            <Text variant="label3" weight="regular" color={colors.errorText}>
              {errorMessage}
              {canRetry
                ? " It may still have gone through, so retrying resends the same save rather than creating a second record."
                : ""}
            </Text>
          ) : null}
        </View>
      </QueryState>
    </ScreenTemplate>
  );
}

// ─── One child's assignment block ───────────────────────────────────────────
function StudentAssignment({
  student,
  assignment,
  typeOptions,
  onChange,
}: {
  student: GuardianStudent;
  assignment?: Assignment;
  typeOptions: { label: string; value: string }[];
  onChange: (key: string, patch: Partial<Assignment>) => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const selected = !!assignment?.selected;

  return (
    <View
      style={[
        styles.studentCard,
        selected && { borderColor: colors.primary },
      ]}
    >
      <Pressable
        style={styles.studentHeader}
        onPress={() => onChange(student.id, { selected: !selected })}
      >
        <MaterialIcons
          name={selected ? "check-box" : "check-box-outline-blank"}
          size={22}
          color={selected ? colors.primary : colors.textSecondary}
        />
        <Text variant="label3" weight="semiBold" style={styles.studentName}>
          {student.studentName}
        </Text>
      </Pressable>

      {selected ? (
        <View style={styles.studentBody}>
          <DefaultInput
            label="Relationship"
            value={assignment?.type ?? ""}
            onChange={(v) => onChange(student.id, { type: v })}
            type="select"
            placeholder="Defaults to Other"
            options={typeOptions}
          />

          {student.parentOptions.length ? (
            <DefaultInput
              label="Main parent"
              value={assignment?.mainParentId ?? ""}
              onChange={(v) => onChange(student.id, { mainParentId: v })}
              type="select"
              placeholder="Optional"
              options={student.parentOptions}
            />
          ) : (
            <Text
              variant="caption1"
              weight="regular"
              color={colors.textSecondary}
            >
              No parent on file for this child.
            </Text>
          )}

          <View style={styles.permissionRow}>
            <View style={styles.permissionText}>
              <Text variant="label3" weight="medium">
                Can collect from school
              </Text>
              <Text
                variant="caption1"
                weight="regular"
                color={colors.textSecondary}
              >
                Off unless you turn it on.
              </Text>
            </View>
            <Switch
              value={!!assignment?.hasPermission}
              onValueChange={(v) =>
                onChange(student.id, { hasPermission: v })
              }
              trackColor={{ true: colors.primary }}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      width: "100%",
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 24,
      gap: 16,
    },
    photoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    photo: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.surface,
    },
    photoEmpty: {
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: colors.border,
    },
    photoText: {
      flex: 1,
      gap: 2,
    },
    z30: { zIndex: 30 },
    z20: { zIndex: 20 },
    section: {
      gap: 10,
    },
    studentCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.surface,
      padding: 12,
      gap: 12,
    },
    studentHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    studentName: {
      flex: 1,
    },
    studentBody: {
      gap: 12,
    },
    permissionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    permissionText: {
      flex: 1,
      gap: 2,
    },
    notice: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
  });
