import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from "react-native";

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
  useComplaintCategories,
  useComplaintContactMethods,
  useComplaintPriorities,
  useComplaintStudents,
  useCreateComplaint,
  useStyles,
} from "@/hooks";
import type { RootStackScreenProps } from "@/navigation/types";
import type { UploadFile } from "@/services/api/multipart";
import { ApiError } from "@/types/api";

type Props = RootStackScreenProps<"AddComplaint">;

const TITLE_MAX_LENGTH = 200;
const DESCRIPTION_MAX_LENGTH = 2000;

export default function AddComplaintScreen({ navigation }: Props) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();

  // Four lookups back this form. They are cached, so reopening the form
  // after a failed submit doesn't refetch them.
  const students = useComplaintStudents();
  const categories = useComplaintCategories();
  const priorities = useComplaintPriorities();
  const contactMethods = useComplaintContactMethods();

  const lookupsLoading =
    students.isLoading ||
    categories.isLoading ||
    priorities.isLoading ||
    contactMethods.isLoading;

  // Category, priority and contact method are non-nullable server-side, so
  // the form cannot be completed without them — their lookup failing is what
  // blocks the screen, not the optional student list.
  const lookupsError =
    categories.error ?? priorities.error ?? contactMethods.error;

  const retryLookups = useCallback(() => {
    students.refetch();
    categories.refetch();
    priorities.refetch();
    contactMethods.refetch();
  }, [students, categories, priorities, contactMethods]);

  // ── Form state ───────────────────────────────────────────────────────────
  const [studentSeasonId, setStudentSeasonId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactTime, setContactTime] = useState("");
  const [attachment, setAttachment] = useState<UploadFile | null>(null);

  const {
    submit,
    retry,
    canRetry,
    isProcessing,
    isPending,
    error: submitError,
  } = useCreateComplaint(() => navigation.goBack());

  /**
   * ⚠️ Images only. Attaching a PDF needs `expo-document-picker`, which is
   * not installed — adding it is a native dependency and therefore a new
   * build, not an OTA update.
   */
  const handlePickAttachment = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow photo library access to attach a file.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const extension = asset.uri.split(".").pop()?.toLowerCase();
    setAttachment({
      uri: asset.uri,
      name: asset.fileName ?? `complaint-${Date.now()}.${extension ?? "jpg"}`,
      type: asset.mimeType ?? (extension === "png" ? "image/png" : "image/jpeg"),
    });
  }, []);

  // Title and description are nullable in the server DTO but the service
  // treats them as required, so the form enforces them rather than letting
  // the request fail server-side.
  const canSubmit =
    !!title.trim() &&
    !!description.trim() &&
    !!category &&
    !!priority &&
    !!contactMethod &&
    !isPending;

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    submit({
      studentSeasonId: studentSeasonId ? Number(studentSeasonId) : undefined,
      title: title.trim(),
      description: description.trim(),
      category: Number(category),
      priority: Number(priority),
      preferredContactMethod: Number(contactMethod),
      contactPhone: contactPhone.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      preferredContactTime: contactTime.trim() || undefined,
      attachment: attachment ?? undefined,
    });
  }, [
    canSubmit,
    submit,
    studentSeasonId,
    title,
    description,
    category,
    priority,
    contactMethod,
    contactPhone,
    contactEmail,
    contactTime,
    attachment,
  ]);

  const errorMessage =
    submitError instanceof ApiError
      ? submitError.message
      : submitError
        ? "Could not submit the complaint. Please try again."
        : null;

  return (
    <ScreenTemplate
      title="New Complaint"
      bottomContent={
        <Button
          text={canRetry ? "Retry submission" : "Submit"}
          onPress={canRetry ? retry : handleSubmit}
          disabled={canRetry ? isPending : !canSubmit}
          isLoading={isPending}
        />
      }
    >
      <QueryState
        isLoading={lookupsLoading}
        error={lookupsError}
        onRetry={retryLookups}
      >
        <View style={styles.container}>
          {/* z-index descends top-to-bottom so each open dropdown overlays
              the fields below it */}
          <View style={styles.z40}>
            <DefaultInput
              label="About"
              value={studentSeasonId}
              onChange={setStudentSeasonId}
              type="select"
              placeholder="Select a student (optional)"
              options={students.data ?? []}
            />
          </View>

          <DefaultInput
            label="Title"
            value={title}
            onChange={setTitle}
            type="text"
            placeholder="A short summary"
            maxLength={TITLE_MAX_LENGTH}
          />

          <DefaultInput
            label="Description"
            value={description}
            onChange={setDescription}
            type="text"
            placeholder="What happened?"
            multiline
            numberOfLines={4}
            maxLength={DESCRIPTION_MAX_LENGTH}
            style={styles.multiline}
          />

          <View style={styles.z30}>
            <DefaultInput
              label="Category"
              value={category}
              onChange={setCategory}
              type="select"
              placeholder="Select a category"
              options={categories.data ?? []}
            />
          </View>

          <View style={styles.z20}>
            <DefaultInput
              label="Priority"
              value={priority}
              onChange={setPriority}
              type="select"
              placeholder="Select a priority"
              options={priorities.data ?? []}
            />
          </View>

          <View style={styles.z10}>
            <DefaultInput
              label="Preferred contact method"
              value={contactMethod}
              onChange={setContactMethod}
              type="select"
              placeholder="How should the school reach you?"
              options={contactMethods.data ?? []}
            />
          </View>

          <DefaultInput
            label="Contact phone"
            value={contactPhone}
            onChange={setContactPhone}
            type="text"
            placeholder="Optional"
            keyboardType="phone-pad"
          />

          <DefaultInput
            label="Contact email"
            value={contactEmail}
            onChange={setContactEmail}
            type="text"
            placeholder="Optional"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <DefaultInput
            label="Best time to reach you"
            value={contactTime}
            onChange={setContactTime}
            type="text"
            placeholder="e.g. Evening"
          />

          {/* ── Attachment ─────────────────────────────────────── */}
          <View style={styles.section}>
            <Text variant="label2" weight="semiBold">
              Attachment
            </Text>

            {attachment ? (
              <View style={[styles.fileRow, { borderColor: colors.border }]}>
                <MaterialIcons name="image" size={20} color={colors.secondary} />
                <Text
                  variant="label3"
                  weight="regular"
                  numberOfLines={1}
                  style={styles.fileName}
                >
                  {attachment.name}
                </Text>
                <Pressable hitSlop={8} onPress={() => setAttachment(null)}>
                  <MaterialIcons name="close" size={18} color={colors.danger} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={[
                  styles.uploadArea,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                ]}
                onPress={handlePickAttachment}
              >
                <MaterialIcons
                  name="attach-file"
                  size={22}
                  color={colors.textSecondary}
                />
                <Text
                  variant="label3"
                  weight="regular"
                  color={colors.textSecondary}
                >
                  Add a photo (optional)
                </Text>
              </Pressable>
            )}
          </View>

          {/* ── Submission state ───────────────────────────────── */}
          {isProcessing ? (
            <View style={styles.notice}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text
                variant="label3"
                weight="regular"
                color={colors.textSecondary}
              >
                Your complaint is still being processed. Don&apos;t submit it
                again — retrying reuses the same request.
              </Text>
            </View>
          ) : null}

          {errorMessage ? (
            <Text variant="label3" weight="regular" color={colors.errorText}>
              {errorMessage}
              {canRetry
                ? " It may still have gone through, so retrying resends the same complaint rather than filing a second one."
                : ""}
            </Text>
          ) : null}
        </View>
      </QueryState>
    </ScreenTemplate>
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
    z40: { zIndex: 40 },
    z30: { zIndex: 30 },
    z20: { zIndex: 20 },
    z10: { zIndex: 10 },
    multiline: {
      minHeight: 100,
      textAlignVertical: "top",
      paddingTop: 14,
    },
    section: {
      gap: 10,
    },
    uploadArea: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: 16,
      borderRadius: 8,
      borderWidth: 1.5,
      borderStyle: "dashed",
    },
    fileRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      backgroundColor: colors.surface,
    },
    fileName: {
      flex: 1,
    },
    notice: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
  });
