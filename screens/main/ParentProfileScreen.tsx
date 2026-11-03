import { MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ParentAvatar, RelativeItem } from "@/components";
import { Button, Card, QueryState, ScreenTemplate, Text } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import {
  useCurrentUser,
  useParentInfo,
  useRelatives,
  useStyles,
} from "@/hooks";
import type { RootStackScreenProps } from "@/navigation/types";
import { parentProfileApi } from "@/services/api";
import { parentInfoFields } from "@/services/mappers";
import type { Relative } from "@/services/mappers";

type Props = RootStackScreenProps<"ParentProfile">;

export default function ParentProfileScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  const info = useParentInfo();
  const relatives = useRelatives();
  // Name and gender for the header come from the session, so the card renders
  // before /parent/profile resolves.
  const { data: currentUser } = useCurrentUser();

  /**
   * Relative photos are behind the bearer token, so the <Image> needs an
   * Authorization header. Resolved once here rather than per row.
   */
  const [photoHeaders, setPhotoHeaders] = useState<Record<string, string>>();
  useEffect(() => {
    let cancelled = false;
    parentProfileApi.getPhotoHeaders().then((headers) => {
      if (!cancelled) setPhotoHeaders(headers);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleEditInfo = useCallback(
    () => navigation.navigate("EditParentInfo"),
    [navigation],
  );

  const handleAddRelative = useCallback(
    () => navigation.navigate("AddRelative", {}),
    [navigation],
  );

  const handleOpenRelative = useCallback(
    (relative: Relative) =>
      navigation.navigate("RelativeDetails", {
        relativeId: relative.relativeId,
        name: relative.name,
      }),
    [navigation],
  );

  const fields = info.data ? parentInfoFields(info.data) : [];
  const displayName = info.data?.name || currentUser?.name || "";
  const displayRole = info.data?.role || currentUser?.roleLabel || "";

  return (
    <ScreenTemplate
      title="Parent Profile"
      bottomContent={
        <Button text="+ Add Relative" onPress={handleAddRelative} />
      }
    >
      <View style={styles.container}>
        {/* ── Who you are ─────────────────────────────────────────── */}
        <Card style={styles.headerCard}>
          <ParentAvatar gender={currentUser?.gender} size={56} />
          <View style={styles.headerText}>
            <Text variant="label1" weight="semiBold" numberOfLines={1}>
              {displayName}
            </Text>
            {displayRole ? (
              <Text
                variant="label3"
                weight="regular"
                color={colors.textSecondary}
              >
                {displayRole}
              </Text>
            ) : null}
          </View>
        </Card>

        {/* ── My Information ──────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="label2" weight="semiBold">
              My Information
            </Text>
            <Pressable onPress={handleEditInfo} hitSlop={8}>
              <Text variant="label3" weight="semiBold" color={colors.primary}>
                Edit
              </Text>
            </Pressable>
          </View>

          <QueryState
            isLoading={info.isLoading}
            error={info.error}
            onRetry={info.refetch}
          >
            {fields.length ? (
              <Card style={styles.infoCard}>
                {fields.map((field, index) => (
                  <View
                    key={field.key}
                    style={[
                      styles.infoRow,
                      index > 0 && { borderTopColor: colors.border },
                      index > 0 && styles.infoRowDivided,
                    ]}
                  >
                    <Text
                      variant="label3"
                      weight="regular"
                      color={colors.textSecondary}
                    >
                      {field.label}
                    </Text>
                    <Text
                      variant="label3"
                      weight="medium"
                      numberOfLines={2}
                      style={styles.infoValue}
                    >
                      {field.value}
                    </Text>
                  </View>
                ))}
              </Card>
            ) : (
              <Text
                variant="label3"
                weight="regular"
                color={colors.textSecondary}
              >
                No details on file yet. Tap Edit to add them.
              </Text>
            )}
          </QueryState>
        </View>

        {/* ── Relatives ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text variant="label2" weight="semiBold">
            Relatives
          </Text>
          <Text variant="caption1" weight="regular" color={colors.textSecondary}>
            People who may be contacted about, or collect, your children.
          </Text>

          <QueryState
            isLoading={relatives.isLoading}
            error={relatives.error}
            isEmpty={!relatives.data?.length}
            emptyMessage="No relatives added yet"
            onRetry={relatives.refetch}
          >
            <View style={styles.list}>
              {relatives.data?.map((relative) => (
                <RelativeItem
                  key={relative.id}
                  relative={relative}
                  photoHeaders={photoHeaders}
                  onSelect={handleOpenRelative}
                />
              ))}
            </View>
          </QueryState>

          {/* The list is family-wide and carries no link metadata, so it
              can't say which child each relative belongs to — the detail
              screen is where that lives. */}
          {relatives.data?.length ? (
            <View style={styles.hint}>
              <MaterialIcons
                name="info-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text
                variant="caption1"
                weight="regular"
                color={colors.textSecondary}
                style={styles.hintText}
              >
                Open a relative to see which children they&apos;re linked to.
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </ScreenTemplate>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: {
      width: "100%",
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 24,
      gap: 20,
    },
    headerCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    headerText: {
      flex: 1,
      gap: 2,
    },
    section: {
      width: "100%",
      gap: 10,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    infoCard: {
      padding: 0,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    infoRowDivided: {
      borderTopWidth: 1,
    },
    infoValue: {
      flex: 1,
      textAlign: "right",
    },
    list: {
      gap: 10,
    },
    hint: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 6,
      paddingTop: 2,
    },
    hintText: {
      flex: 1,
    },
  });
