import React, { useCallback, useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import {
  Button,
  DefaultInput,
  QueryState,
  ScreenTemplate,
  Text,
} from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import {
  useCreateDocumentRequest,
  useDocumentRequestOptions,
  useStyles,
} from "@/hooks";
import type { RootStackScreenProps } from "@/navigation/types";
import { ApiError } from "@/types/api";

type Props = RootStackScreenProps<"AddRequest">;

/** Server caps notes at 2000 characters (see the multipart schema). */
const NOTES_MAX_LENGTH = 2000;

export default function AddRequestScreen({ navigation }: Props) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();

  const {
    data: options,
    isLoading,
    error: optionsError,
    refetch,
  } = useDocumentRequestOptions();

  const { mutateAsync: createRequest, isPending } = useCreateDocumentRequest();

  // ── Dropdown options — recomputed only when the payload changes ──────────
  const documentOptions = useMemo(
    () =>
      options?.documentTypes?.map((t) => ({
        label: t.name ?? "",
        value: String(t.id),
      })) ?? [],
    [options?.documentTypes],
  );

  const studentOptions = useMemo(
    () =>
      options?.students?.map((s) => ({
        label: s.studentName ?? "",
        value: String(s.studentSeasonId),
      })) ?? [],
    [options?.students],
  );

  // ── Form state ───────────────────────────────────────────────────────────
  const [documentTypeId, setDocumentTypeId] = useState("");
  const [studentSeasonId, setStudentSeasonId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canSubmit = !!documentTypeId && !!studentSeasonId && !isPending;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitError(null);

    try {
      await createRequest({
        documentRequestTypeId: Number(documentTypeId),
        studentSeasonId: Number(studentSeasonId),
        notes: notes.trim() || undefined,
      });
      // The list query is invalidated by the mutation, so going back shows it.
      navigation.goBack();
    } catch (e) {
      const message =
        e instanceof ApiError
          ? e.message
          : "Could not submit the request. Please try again.";
      setSubmitError(message);
      Alert.alert("Request failed", message);
    }
  }, [canSubmit, createRequest, documentTypeId, studentSeasonId, notes, navigation]);

  return (
    <ScreenTemplate
      title="New Request"
      bottomContent={
        <Button
          text="Submit"
          onPress={handleSubmit}
          disabled={!canSubmit}
          isLoading={isPending}
        />
      }
    >
      <QueryState
        isLoading={isLoading}
        error={optionsError}
        isEmpty={!documentOptions.length}
        emptyMessage="No document types available"
        onRetry={refetch}
      >
        <View style={styles.container}>
          {/* z-index descends top-to-bottom so each open dropdown overlays the next */}
          <View style={styles.dropdownTop}>
            <DefaultInput
              label="Document Type"
              value={documentTypeId}
              onChange={setDocumentTypeId}
              type="select"
              placeholder="Select a document"
              options={documentOptions}
            />
          </View>

          <View style={styles.dropdownBottom}>
            <DefaultInput
              label="For"
              value={studentSeasonId}
              onChange={setStudentSeasonId}
              type="select"
              placeholder="Select a student"
              options={studentOptions}
            />
          </View>

          <DefaultInput
            label="Additional Notes"
            value={notes}
            onChange={setNotes}
            type="text"
            placeholder="Add any extra details..."
            multiline
            numberOfLines={3}
            maxLength={NOTES_MAX_LENGTH}
            style={styles.multiline}
          />

          {submitError ? (
            <Text variant="label3" weight="regular" color={colors.errorText}>
              {submitError}
            </Text>
          ) : null}
        </View>
      </QueryState>
    </ScreenTemplate>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: {
      width: "100%",
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 24,
      gap: 16,
    },
    dropdownTop: {
      zIndex: 30,
    },
    dropdownBottom: {
      zIndex: 20,
    },
    multiline: {
      minHeight: 80,
      textAlignVertical: "top",
      paddingTop: 14,
    },
  });
