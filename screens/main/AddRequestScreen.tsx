import * as ImagePicker from "expo-image-picker";
import {
  CheckIcon,
  FileImageIcon,
  InfoIcon,
  PaperclipIcon,
  PaperPlaneTiltIcon,
  XIcon,
} from "phosphor-react-native";
import React, { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import {
  ChildOption,
  ErrorBanner,
  Field,
  RadioCard,
  TextField,
} from "@/components/form/FormParts";
import FormButton from "@/components/FormButton";
import { QueryState, ScreenTemplate, Text } from "@/components/ui";
import { Palette, Radius, Size, Spacing, Type } from "@/constants/tokens";
import { useCreateDocumentRequest, useDocumentRequestOptions } from "@/hooks";
import type { RootStackScreenProps } from "@/navigation/types";
import type { UploadFile } from "@/services/api/multipart";
import { ApiError } from "@/types/api";

type Props = RootStackScreenProps<"AddRequest">;

/** Server caps notes at 2000 characters (see the multipart schema). */
const NOTES_MAX_LENGTH = 2000;

/**
 * Document descriptions are several paragraphs: what it is, then required
 * attachments and notes. The first paragraph goes on the card; the rest
 * shows once that document is chosen.
 */
function splitDescription(text?: string | null) {
  const paragraphs = (text ?? "").trim().split(/\n\s*\n/);
  return {
    summary: paragraphs[0]?.trim() ?? "",
    details: paragraphs.slice(1).join("\n\n").trim(),
  };
}

/**
 * New document request, in the form screens' style (as New Complaint). One
 * page — three fields don't need steps — then a confirmation.
 */
export default function AddRequestScreen({ navigation }: Props) {
  const {
    data: options,
    isLoading,
    error: optionsError,
    refetch,
  } = useDocumentRequestOptions();

  const { mutateAsync: createRequest, isPending } = useCreateDocumentRequest();

  // ── Form state ───────────────────────────────────────────────────────────
  const [documentTypeId, setDocumentTypeId] = useState<number | null>(null);
  const [studentSeasonId, setStudentSeasonId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [attachment, setAttachment] = useState<UploadFile | null>(null);
  const [tried, setTried] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<number | null>(null);

  const documentTypes = options?.documentTypes ?? [];
  const students = options?.students ?? [];
  const selectedDetails = splitDescription(
    documentTypes.find((t) => t.id === documentTypeId)?.description,
  ).details;

  // A single child needs no choosing.
  const effectiveStudent =
    studentSeasonId ?? (students.length === 1 ? students[0].studentSeasonId : null);

  const typeError = tried && !documentTypeId ? "Choose the document you need." : null;
  const studentError = tried && !effectiveStudent ? "Choose which child it's for." : null;

  /**
   * ⚠️ Images only, as on New Complaint: other files need
   * `expo-document-picker`, a native dependency and so a new build.
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
      name: asset.fileName ?? `request-${Date.now()}.${extension ?? "jpg"}`,
      type: asset.mimeType ?? (extension === "png" ? "image/png" : "image/jpeg"),
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    setTried(true);
    if (!documentTypeId || !effectiveStudent || isPending) return;
    setSubmitError(null);

    try {
      const result = await createRequest({
        documentRequestTypeId: documentTypeId,
        studentSeasonId: effectiveStudent,
        notes: notes.trim() || undefined,
        files: attachment ? [attachment] : undefined,
      });
      // The list query is invalidated by the mutation.
      setCreatedId(result.documentRequestId);
    } catch (e) {
      setSubmitError(
        e instanceof ApiError
          ? e.message
          : "Could not submit the request. Please try again.",
      );
    }
  }, [documentTypeId, effectiveStudent, isPending, createRequest, notes, attachment]);

  // ── Submitted ────────────────────────────────────────────────────────────
  if (createdId !== null) {
    return (
      <ScreenTemplate variant="form" title="Request sent" onBack={() => navigation.navigate("Request")}>
        <View style={styles.success}>
          <View style={styles.successCircle}>
            <CheckIcon weight="bold" size={46} color={Palette.feedback.success} />
          </View>
          <Text style={Type.successTitle}>Request submitted</Text>
          <View style={styles.referencePill}>
            <Text style={Type.cardHeading}>#{createdId}</Text>
          </View>
          <Text style={styles.successBody} color={Palette.text.secondary}>
            The school will prepare it and let you know. You can follow it in My
            Requests.
          </Text>
          <View style={styles.successButtons}>
            <FormButton
              label="View request"
              onPress={() =>
                navigation.replace("RequestDetails", { requestId: createdId })
              }
            />
            <FormButton
              label="Back to My Requests"
              variant="secondary"
              onPress={() => navigation.navigate("Request")}
            />
          </View>
        </View>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate
      variant="form"
      title="New Request"
      headerStyle={styles.header}
      bottomContent={
        <FormButton
          label={isPending ? "Sending…" : "Submit request"}
          Icon={PaperPlaneTiltIcon}
          loading={isPending}
          onPress={handleSubmit}
        />
      }
    >
      <QueryState
        isLoading={isLoading}
        error={optionsError}
        isEmpty={!documentTypes.length}
        emptyMessage="No document types available"
        onRetry={refetch}
      >
        <View style={styles.body}>
          <Field label="Document" error={typeError}>
            <View style={styles.stack}>
              {documentTypes.map((type) => (
                <RadioCard
                  key={type.id}
                  title={type.name ?? `Document ${type.id}`}
                  description={splitDescription(type.description).summary}
                  selected={documentTypeId === type.id}
                  onPress={() => setDocumentTypeId(type.id)}
                  invalid={!!typeError}
                />
              ))}
            </View>
          </Field>

          {/* The rest of the description — required attachments, processing
              time — for the chosen document only, so the list stays short. */}
          {selectedDetails ? (
            <View style={styles.details}>
              <InfoIcon size={18} color={Palette.action.primary} />
              <Text style={[styles.detailsText, styles.flex]}>{selectedDetails}</Text>
            </View>
          ) : null}

          {students.length > 1 ? (
            <Field label="For which child?" error={studentError}>
              <View style={styles.stack}>
                {students.map((student, index) => (
                  <ChildOption
                    key={student.studentSeasonId}
                    name={student.studentName ?? ""}
                    index={index}
                    selected={studentSeasonId === student.studentSeasonId}
                    onPress={() => setStudentSeasonId(student.studentSeasonId)}
                    invalid={!!studentError}
                  />
                ))}
              </View>
            </Field>
          ) : null}

          <Field label="Notes" hint={notes.length ? `${notes.length}/${NOTES_MAX_LENGTH}` : "Optional"}>
            <TextField
              value={notes}
              onChangeText={setNotes}
              placeholder="Anything the school should know — copies, language, a deadline…"
              maxLength={NOTES_MAX_LENGTH}
              multilineArea
            />
          </Field>

          <Field label="Attachment" hint="Optional">
            {attachment ? (
              <View style={styles.fileRow}>
                <View style={styles.fileTile}>
                  <FileImageIcon size={20} color={Palette.action.primary} />
                </View>
                <Text style={[Type.cardHeading, styles.flex]} numberOfLines={1}>
                  {attachment.name}
                </Text>
                <Pressable onPress={() => setAttachment(null)} style={styles.remove}>
                  <XIcon weight="bold" size={13} color={Palette.form.inputError} />
                  <Text style={Type.chipSmall} color={Palette.form.inputError}>
                    Remove
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={handlePickAttachment} style={styles.upload}>
                <PaperclipIcon size={22} color={Palette.action.primary} />
                <View style={styles.flex}>
                  <Text style={Type.cardHeading} color={Palette.action.primary}>
                    Choose file
                  </Text>
                  <Text style={Type.caption} color={Palette.text.secondary}>
                    JPG or PNG photo
                  </Text>
                </View>
              </Pressable>
            )}
          </Field>

          {submitError ? (
            <ErrorBanner title="Couldn't send your request" message={submitError} />
          ) : null}
        </View>
      </QueryState>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    paddingBottom: Spacing.form.headerPaddingBottom,
  },
  body: {
    width: "100%",
    paddingTop: Spacing.form.bodyPadding,
    paddingHorizontal: Spacing.form.bodyPadding,
    paddingBottom: 24,
    gap: Spacing.form.bodyGap.form,
  },
  stack: {
    gap: 8,
  },
  details: {
    flexDirection: "row",
    gap: 10,
    marginTop: -8,
    borderRadius: Radius.input,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: Palette.action.infoNote,
  },
  detailsText: {
    fontSize: 14,
    lineHeight: 20,
    color: Palette.text.body,
  },
  upload: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radius.input,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Palette.form.dashedUpload,
    backgroundColor: Palette.surface.card,
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radius.input,
    borderWidth: 1,
    borderColor: Palette.border.default,
    backgroundColor: Palette.surface.card,
  },
  fileTile: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Palette.action.tint8,
    alignItems: "center",
    justifyContent: "center",
  },
  remove: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: Palette.border.divider,
  },
  success: {
    alignItems: "center",
    gap: 14,
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  successCircle: {
    width: Size.successCircle,
    height: Size.successCircle,
    borderRadius: Size.successCircle / 2,
    backgroundColor: Palette.feedback.successTint,
    alignItems: "center",
    justifyContent: "center",
  },
  referencePill: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.border.default,
    backgroundColor: Palette.surface.card,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  successBody: {
    maxWidth: 300,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  successButtons: {
    alignSelf: "stretch",
    gap: 10,
    marginTop: 8,
  },
});
