import { MaterialIcons } from "@expo/vector-icons";
import React, { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { Card, QueryState, ScreenTemplate, Text } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useDocumentRequest, useStyles } from "@/hooks";
import type { RootStackScreenProps } from "@/navigation/types";
import { documentRequestsApi } from "@/services/api";
import type { RequestFile } from "@/services/mappers";
import type { RequestStatus } from "@/types/request";

/** Mirrors RequestItem so a status reads the same in both places. */
const STATUS_COLOR: Record<RequestStatus, string> = {
  pending: "#E8A923",
  completed: "#22863A",
  rejected: "#CA1616",
  cancelled: "#81828B",
};

type Props = RootStackScreenProps<"RequestDetails">;

export default function RequestDetailsScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const { requestId, title } = route.params;

  const { data, isLoading, error, refetch } = useDocumentRequest(requestId);

  /**
   * Files are authenticated raw bytes, so the viewer gets a URL plus an
   * Authorization header. `kind` comes from the server's contentType, so a
   * scanned image opens as an image rather than failing in the PDF renderer.
   */
  const handleOpenFile = useCallback(
    async (file: RequestFile) => {
      navigation.navigate("Pdf", {
        title: file.name,
        uri: documentRequestsApi.getFileUrl(file.fileId),
        headers: await documentRequestsApi.getFileHeaders(),
        kind: file.kind,
      });
    },
    [navigation],
  );

  return (
    <ScreenTemplate title={data?.documentLabel || title || "Request"}>
      <View style={styles.container}>
        <QueryState
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
        >
          {data ? (
            <>
              {/* ── Summary ─────────────────────────────────────── */}
              <Card style={styles.card}>
                <View style={styles.headerRow}>
                  <View style={styles.headerText}>
                    <Text variant="label1" weight="semiBold">
                      {data.documentLabel}
                    </Text>
                    <Text
                      variant="label3"
                      weight="regular"
                      color={colors.textSecondary}
                    >
                      For {data.studentName} · {data.createdAt}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: STATUS_COLOR[data.status] + "20" },
                    ]}
                  >
                    <Text
                      variant="caption1"
                      weight="semiBold"
                      color={STATUS_COLOR[data.status]}
                    >
                      {data.statusLabel}
                    </Text>
                  </View>
                </View>
              </Card>

              {/* ── Why it was rejected — the most important thing
                     on a rejected request, and it was never shown ── */}
              {data.rejectionReason ? (
                <Field
                  label="Reason for rejection"
                  value={data.rejectionReason}
                  tone={colors.errorText}
                />
              ) : null}

              {data.completedAt ? (
                <Field label="Completed on" value={data.completedAt} />
              ) : null}

              {data.notes ? (
                <Field label="Your notes" value={data.notes} />
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
                <Field label="Notes from the school" value={data.coordinatorNotes} />
              ) : null}

              {/* ── Files ───────────────────────────────────────── */}
              <View style={styles.section}>
                <Text variant="label2" weight="semiBold">
                  Documents
                </Text>

                {data.files.length === 0 ? (
                  <Text
                    variant="label3"
                    weight="regular"
                    color={colors.textSecondary}
                  >
                    {data.status === "completed"
                      ? "No document attached yet."
                      : "Documents appear here once the request is completed."}
                  </Text>
                ) : (
                  data.files.map((file) => (
                    <Pressable
                      key={file.id}
                      style={[styles.fileRow, { borderColor: colors.border }]}
                      onPress={() => handleOpenFile(file)}
                    >
                      <MaterialIcons
                        name={file.kind === "pdf" ? "picture-as-pdf" : "image"}
                        size={20}
                        color={colors.secondary}
                      />
                      <View style={styles.fileInfo}>
                        <Text variant="label3" weight="semiBold" numberOfLines={1}>
                          {file.name}
                        </Text>
                        {file.meta ? (
                          <Text
                            variant="caption1"
                            weight="regular"
                            color={colors.textSecondary}
                            numberOfLines={1}
                          >
                            {file.meta}
                          </Text>
                        ) : null}
                      </View>
                      <MaterialIcons
                        name="chevron-right"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </Pressable>
                  ))
                )}
              </View>
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
      alignItems: "center",
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
