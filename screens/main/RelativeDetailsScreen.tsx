import { MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  type ImageStyle,
  Pressable,
  StyleSheet,
  Switch,
  View,
} from "react-native";

import type { ColorPalette } from "@/apps";
import { Card, QueryState, ScreenTemplate, Text } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import {
  useDeleteRelative,
  useRelative,
  useStyles,
  useUpdateLinkPermission,
} from "@/hooks";
import type { RootStackScreenProps } from "@/navigation/types";
import { parentProfileApi } from "@/services/api";
import type { RelativeLink } from "@/services/mappers";
import { ApiError } from "@/types/api";

type Props = RootStackScreenProps<"RelativeDetails">;

export default function RelativeDetailsScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const { relativeId, name } = route.params;

  const { data, isLoading, error, refetch } = useRelative(relativeId);
  const { mutateAsync: setPermission } = useUpdateLinkPermission(relativeId);
  const { mutateAsync: removeRelative, isPending: isDeleting } =
    useDeleteRelative();

  const [photoHeaders, setPhotoHeaders] = useState<Record<string, string>>();
  useEffect(() => {
    let cancelled = false;
    parentProfileApi.getPhotoHeaders().then((h) => {
      if (!cancelled) setPhotoHeaders(h);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleEdit = useCallback(
    () => navigation.navigate("AddRelative", { relativeId }),
    [navigation, relativeId],
  );

  /**
   * The only field of an existing link that can be changed. Applied through
   * the dedicated endpoint — Save Relative deliberately leaves active links
   * untouched, so this is the one path that works.
   */
  const handleTogglePermission = useCallback(
    async (link: RelativeLink, next: boolean) => {
      if (link.linkId === null) return;
      try {
        await setPermission({ linkId: link.linkId, hasPermission: next });
      } catch (e) {
        Alert.alert(
          "Couldn't update",
          e instanceof ApiError
            ? e.message
            : "The permission wasn't changed. Please try again.",
        );
      }
    },
    [setPermission],
  );

  const handleDelete = useCallback(() => {
    Alert.alert(
      "Remove relative",
      `Remove ${data?.name || name || "this relative"} from your family? They will no longer be linked to any of your children.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeRelative(relativeId);
              navigation.goBack();
            } catch (e) {
              Alert.alert(
                "Couldn't remove",
                e instanceof ApiError
                  ? e.message
                  : "The relative wasn't removed. Please try again.",
              );
            }
          },
        },
      ],
    );
  }, [data?.name, name, removeRelative, relativeId, navigation]);

  return (
    <ScreenTemplate title={data?.name || name || "Relative"}>
      <View style={styles.container}>
        <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
          {data ? (
            <>
              {/* ── Person ──────────────────────────────────────── */}
              <Card style={styles.headerCard}>
                {data.photoUrl ? (
                  <Image
                    source={{ uri: data.photoUrl, headers: photoHeaders }}
                    style={styles.photo as ImageStyle}
                  />
                ) : (
                  <View style={[styles.photo, styles.initialBg]}>
                    <Text
                      variant="h6"
                      weight="bold"
                      color={colors.buttonText}
                    >
                      {data.initial}
                    </Text>
                  </View>
                )}

                <View style={styles.headerText}>
                  <Text variant="label1" weight="semiBold" numberOfLines={1}>
                    {data.name}
                  </Text>
                  {data.nameAr && data.nameAr !== data.name ? (
                    <Text
                      variant="label3"
                      weight="regular"
                      color={colors.textSecondary}
                    >
                      {data.nameAr}
                    </Text>
                  ) : null}
                  {data.contact ? (
                    <Text
                      variant="caption1"
                      weight="regular"
                      color={colors.textSecondary}
                    >
                      {data.contact}
                    </Text>
                  ) : null}
                </View>

                <Pressable onPress={handleEdit} hitSlop={8}>
                  <Text
                    variant="label3"
                    weight="semiBold"
                    color={colors.primary}
                  >
                    Edit
                  </Text>
                </Pressable>
              </Card>

              {data.nationalId ? (
                <View style={styles.field}>
                  <Text
                    variant="label3"
                    weight="semiBold"
                    color={colors.textSecondary}
                  >
                    National ID / passport
                  </Text>
                  <Text variant="label3" weight="regular">
                    {data.nationalId}
                  </Text>
                </View>
              ) : null}

              {/* ── Linked children ─────────────────────────────── */}
              <View style={styles.section}>
                <Text variant="label2" weight="semiBold">
                  Linked children
                </Text>

                {data.links.length === 0 ? (
                  <Text
                    variant="label3"
                    weight="regular"
                    color={colors.textSecondary}
                  >
                    No linked children to show.
                  </Text>
                ) : (
                  data.links.map((link) => (
                    <View key={link.id} style={styles.linkCard}>
                      <View style={styles.linkHeader}>
                        <MaterialIcons
                          name="school"
                          size={18}
                          color={colors.secondary}
                        />
                        <Text
                          variant="label3"
                          weight="semiBold"
                          style={styles.linkName}
                          numberOfLines={1}
                        >
                          {link.studentName || "Student"}
                        </Text>
                        {link.typeName ? (
                          <View
                            style={[
                              styles.typePill,
                              { backgroundColor: colors.secondary + "18" },
                            ]}
                          >
                            <Text
                              variant="caption2"
                              weight="semiBold"
                              color={colors.secondary}
                            >
                              {link.typeName}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      {link.mainParentName ? (
                        <Text
                          variant="caption1"
                          weight="regular"
                          color={colors.textSecondary}
                        >
                          Main parent: {link.mainParentName}
                        </Text>
                      ) : null}

                      <View style={styles.permissionRow}>
                        <View style={styles.permissionText}>
                          <Text variant="label3" weight="medium">
                            Can collect from school
                          </Text>
                          {link.linkId === null ? (
                            <Text
                              variant="caption1"
                              weight="regular"
                              color={colors.textSecondary}
                            >
                              Can&apos;t be changed — this link has no id.
                            </Text>
                          ) : null}
                        </View>
                        <Switch
                          value={link.hasPermission}
                          onValueChange={(v) => handleTogglePermission(link, v)}
                          disabled={link.linkId === null}
                          trackColor={{ true: colors.primary }}
                        />
                      </View>
                    </View>
                  ))
                )}
              </View>

              {/* ── Remove ──────────────────────────────────────── */}
              <Pressable
                style={[styles.deleteRow, { borderColor: colors.danger }]}
                onPress={handleDelete}
                disabled={isDeleting}
              >
                <MaterialIcons
                  name="person-remove"
                  size={18}
                  color={colors.danger}
                />
                <Text variant="label3" weight="semiBold" color={colors.danger}>
                  {isDeleting ? "Removing…" : "Remove relative"}
                </Text>
              </Pressable>
            </>
          ) : null}
        </QueryState>
      </View>
    </ScreenTemplate>
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
    headerCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    photo: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.background,
    },
    initialBg: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.secondary,
    },
    headerText: {
      flex: 1,
      gap: 2,
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
    linkCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.surface,
      padding: 12,
      gap: 8,
    },
    linkHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    linkName: {
      flex: 1,
    },
    typePill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
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
    deleteRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
    },
  });
