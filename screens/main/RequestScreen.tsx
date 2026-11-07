import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FileTextIcon, PlusIcon } from "phosphor-react-native";
import React, { memo, useCallback } from "react";
import { StyleSheet, View } from "react-native";

import { RequestItem } from "@/components";
import FormButton from "@/components/FormButton";
import { QueryState, ScreenTemplate, Text } from "@/components/ui";
import { Palette, Radius, Size, Type } from "@/constants/tokens";
import { useTheme } from "@/contexts/ThemeContext";
import { useDocumentRequestOptions, useDocumentRequests, useStyles } from "@/hooks";
import type { RootStackParamList } from "@/navigation/types";
import type { Request } from "@/types/request";

export default function RequestScreen() {
  const styles = useStyles(createStyles);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Grouping happens inside the query's `select`, so no filtering on render.
  const { data, isLoading, error, refetch } = useDocumentRequests();

  /**
   * Opens the first attached file of a completed request.
   * ⚠️ The list payload only carries `filesCount`; file ids live on the detail
   * endpoint, so the detail is fetched on demand before opening the viewer.
   */
  /**
   * Opens the detail rather than jumping straight into the first file. The
   * detail carries what the list can't: the rejection reason, the school's
   * notes, the coordinator, and every attached document rather than just one.
   */
  const handleOpenRequest = useCallback(
    (request: Request) =>
      navigation.navigate("RequestDetails", {
        requestId: request.requestId,
        title: request.documentLabel,
      }),
    [navigation],
  );

  const handleAddRequest = useCallback(
    () => navigation.navigate("AddRequest"),
    [navigation],
  );

  // Nothing requested yet: a welcoming card instead of a bare grey page.
  const noRequests = !isLoading && !error && data !== undefined && !data.all.length;

  return (
    <ScreenTemplate
      variant="form"
      title="My Requests"
      bottomContent={
        noRequests ? undefined : (
          <FormButton label="New Request" Icon={PlusIcon} onPress={handleAddRequest} />
        )
      }
    >
      <View style={styles.container}>
        {noRequests ? (
          <EmptyRequests onAdd={handleAddRequest} />
        ) : null}
        <QueryState
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
        >
          {/* ── Pending ─────────────────────────────────────────── */}
          {noRequests ? null : (
            <RequestSection
              title="Pending"
              requests={data?.pending ?? []}
              emptyText="No pending requests"
              onSelect={handleOpenRequest}
            />
          )}

          {/* ── Closed: completed, rejected and cancelled ───────── */}
          {data?.closed.length ? (
            <RequestSection title="Closed" requests={data.closed} onSelect={handleOpenRequest} />
          ) : null}
        </QueryState>
      </View>
    </ScreenTemplate>
  );
}

// ─── Empty ───────────────────────────────────────────────────────────────────

/**
 * Shown before the first request. The document names come from the
 * create-options endpoint, so the card only lists what this school offers —
 * and simply leaves the list out if those can't be loaded.
 */
function EmptyRequests({ onAdd }: { onAdd: () => void }) {
  const styles = useStyles(createStyles);
  const { data: options } = useDocumentRequestOptions();
  const types = (options?.documentTypes ?? [])
    .map((t) => t.name?.trim())
    .filter((name): name is string => !!name);

  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <FileTextIcon size={30} color={Palette.action.primary} />
      </View>
      <Text style={Type.emptyTitle}>No requests yet</Text>
      <Text style={styles.emptyBody} color={Palette.text.secondary}>
        Ask the school for an official document and follow it here until it's
        ready.
      </Text>

      {types.length ? (
        <View style={styles.typeChips}>
          {types.slice(0, 6).map((name) => (
            <View key={name} style={styles.typeChip}>
              <Text style={Type.caption} color={Palette.text.body} numberOfLines={1}>
                {name}
              </Text>
            </View>
          ))}
          {types.length > 6 ? (
            <View style={styles.typeChip}>
              <Text style={Type.caption} color={Palette.text.secondary}>
                +{types.length - 6} more
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.emptyButton}>
        <FormButton label="Request a document" Icon={PlusIcon} onPress={onAdd} height={48} />
      </View>
    </View>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────
// Memoized so an unrelated section re-rendering doesn't walk this list again.
interface RequestSectionProps {
  title: string;
  requests: Request[];
  emptyText?: string;
  onSelect?: (request: Request) => void;
}

const RequestSection = memo<RequestSectionProps>(
  ({ title, requests, emptyText, onSelect }) => {
    const { colors } = useTheme();
    const styles = useStyles(createStyles);

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="label2" weight="semiBold">
            {title}
          </Text>
          <View
            style={[styles.countPill, { backgroundColor: colors.background }]}
          >
            <Text
              variant="caption1"
              weight="semiBold"
              color={colors.textSecondary}
            >
              {requests.length}
            </Text>
          </View>
        </View>

        {requests.length === 0 ? (
          emptyText ? (
            <View style={styles.empty}>
              <Text
                variant="label3"
                weight="regular"
                color={colors.textSecondary}
              >
                {emptyText}
              </Text>
            </View>
          ) : null
        ) : (
          <View style={styles.list}>
            {requests.map((req) => (
              <RequestItem key={req.id} request={req} onSelect={onSelect} />
            ))}
          </View>
        )}
      </View>
    );
  },
);
RequestSection.displayName = "RequestSection";

const createStyles = () =>
  StyleSheet.create({
    container: {
      width: "100%",
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 24,
      gap: 20,
    },
    section: {
      width: "100%",
      gap: 10,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    countPill: {
      minWidth: 22,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
    },
    list: {
      gap: 10,
    },
    empty: {
      paddingVertical: 16,
      alignItems: "center",
    },
    emptyCard: {
      alignItems: "center",
      gap: 12,
      backgroundColor: Palette.surface.card,
      borderRadius: Radius.card,
      paddingVertical: 36,
      paddingHorizontal: 22,
    },
    emptyIcon: {
      width: Size.emptyIconCircle,
      height: Size.emptyIconCircle,
      borderRadius: Size.emptyIconCircle / 2,
      backgroundColor: Palette.action.tint8,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyBody: {
      fontSize: 15,
      lineHeight: 22,
      textAlign: "center",
    },
    typeChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 6,
      marginTop: 4,
    },
    typeChip: {
      borderRadius: 13,
      paddingVertical: 5,
      paddingHorizontal: 10,
      backgroundColor: Palette.form.neutralChip,
    },
    emptyButton: {
      alignSelf: "stretch",
      marginTop: 8,
    },
  });
