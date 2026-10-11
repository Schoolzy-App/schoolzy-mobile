import { MaterialIcons } from "@expo/vector-icons";
import React, { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { COMPLAINT_TONE_COLOR } from "@/components/ComplaintItem";
import { Card, QueryState, ScreenTemplate, Text } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useComplaint, useStyles } from "@/hooks";
import type { RootStackScreenProps } from "@/navigation/types";
import { complaintsApi } from "@/services/api";
import type { ComplaintAttachment } from "@/services/mappers";

type Props = RootStackScreenProps<"ComplaintDetails">;

export default function ComplaintDetailsScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const { complaintId, title } = route.params;

  const { data, isLoading, error, refetch } = useComplaint(complaintId);

  /**
   * Attachments are authenticated raw bytes, so the viewer gets a URL plus an
   * Authorization header rather than the file being pulled into JS memory.
   * `kind` comes from the stored file name, since the URL has no extension.
   */
  const handleOpenAttachment = useCallback(
    async (file: ComplaintAttachment) => {
      navigation.navigate("Pdf", {
        title: file.name,
        uri:
          file.source === "response"
            ? complaintsApi.getResponseAttachmentUrl(complaintId)
            : complaintsApi.getAttachmentUrl(complaintId),
        headers: await complaintsApi.getAttachmentHeaders(),
        kind: file.kind,
      });
    },
    [navigation, complaintId],
  );

  const accent = data ? COMPLAINT_TONE_COLOR[data.tone] : colors.primary;

  return (
    <ScreenTemplate title={data?.title || title || "Complaint"}>
      <View style={styles.container}>
        <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
          {data ? (
            <>
              {/* ── Summary ─────────────────────────────────────── */}
              <Card style={styles.card}>
                <View style={styles.headerRow}>
                  <View style={styles.headerText}>
                    <Text variant="label1" weight="semiBold">
                      {data.title}
                    </Text>
                    <Text
                      variant="label3"
                      weight="regular"
                      color={colors.textSecondary}
                    >
                      {[
                        data.categoryLabel,
                        data.priorityLabel ? `${data.priorityLabel} priority` : null,
                        data.createdAt,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </Text>
                    {data.studentName ? (
                      <Text
                        variant="label3"
                        weight="regular"
                        color={colors.textSecondary}
                      >
                        For {data.studentName}
                      </Text>
                    ) : null}
                  </View>
                  <View
                    style={[styles.badge, { backgroundColor: accent + "20" }]}
                  >
                    <Text variant="caption1" weight="semiBold" color={accent}>
                      {data.statusLabel}
                    </Text>
                  </View>
                </View>
              </Card>

              {/* ── Outcome first: a parent opening a closed complaint
                     wants the answer, not the paperwork ───────────── */}
              {data.rejectionReason ? (
                <Field
                  label="Reason for rejection"
                  value={data.rejectionReason}
                  tone={colors.errorText}
                />
              ) : null}

              {data.resolution ? (
                <Field label="Resolution" value={data.resolution} />
              ) : null}

              {data.resolvedAt ? (
                <Field label="Resolved on" value={data.resolvedAt} />
              ) : null}

              {data.description ? (
                <Field label="What you reported" value={data.description} />
              ) : null}

              {data.coordinatorName ? (
                <Field
                  label="Assigned to"
                  value={
                    data.assignedAt
                      ? `${data.coordinatorName} · ${data.assignedAt}`
                      : data.coordinatorName
                  }
                />
              ) : null}

              {data.coordinatorNotes ? (
                <Field
                  label="Notes from the school"
                  value={data.coordinatorNotes}
                />
              ) : null}

              {data.followUpAt ? (
                <Field label="Follow-up date" value={data.followUpAt} />
              ) : null}

              {/* ── How the school will reach you ───────────────── */}
              {data.contactMethodLabel ||
              data.contactPhone ||
              data.contactEmail ||
              data.contactTime ? (
                <Field
                  label="Contact preference"
                  value={[
                    data.contactMethodLabel,
                    data.contactPhone,
                    data.contactEmail,
                    data.contactTime,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                />
              ) : null}

              {/* ── Attachments ─────────────────────────────────── */}
              {data.attachments.length ? (
                <View style={styles.section}>
                  <Text variant="label2" weight="semiBold">
                    Attachments
                  </Text>
                  {data.attachments.map((file) => (
                    <Pressable
                      key={file.source}
                      style={[styles.fileRow, { borderColor: colors.border }]}
                      onPress={() => handleOpenAttachment(file)}
                    >
                      <MaterialIcons
                        name={file.kind === "pdf" ? "picture-as-pdf" : "image"}
                        size={20}
                        color={colors.secondary}
                      />
                      <View style={styles.fileInfo}>
                        <Text
                          variant="label3"
                          weight="semiBold"
                          numberOfLines={1}
                        >
                          {file.name}
                        </Text>
                        <Text
                          variant="caption1"
                          weight="regular"
                          color={colors.textSecondary}
                        >
                          {file.source === "response"
                            ? "From the school"
                            : "You attached this"}
                        </Text>
                      </View>
                      <MaterialIcons
                        name="chevron-right"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </>
          ) : null}
        </QueryState>
      </View>
    </ScreenTemplate>
  );
}

function Field({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  return (
    <View style={styles.field}>
      <Text variant="label3" weight="semiBold" color={colors.textSecondary}>
        {label}
      </Text>
      <Text variant="label3" weight="regular" color={tone}>
        {value}
      </Text>
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      width: "100%",
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 24,
      gap: 16,
    },
    card: {
      gap: 8,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    headerText: {
      flex: 1,
      gap: 2,
    },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
    },
    field: {
      gap: 4,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
    },
    section: {
      gap: 10,
    },
    fileRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      backgroundColor: colors.surface,
    },
    fileInfo: {
      flex: 1,
      gap: 2,
    },
  });
