import React, { useCallback, useState } from "react";
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
  useNationalities,
  useParentInfo,
  useStyles,
  useUpdateParentInfo,
} from "@/hooks";
import type { RootStackScreenProps } from "@/navigation/types";
import type { ParentInfo } from "@/services/mappers";
import { ApiError } from "@/types/api";
import type { UpdateParentInfoInput } from "@/types/api";

type Props = RootStackScreenProps<"EditParentInfo">;

type EditableField =
  | "name"
  | "mobile"
  | "phone"
  | "email"
  | "job"
  | "address"
  | "nationalityId";

/** The server's current value for a field, as a string the inputs can hold. */
function initialValue(info: ParentInfo | undefined, field: EditableField): string {
  if (!info) return "";
  if (field === "nationalityId") {
    return info.nationalityId ? String(info.nationalityId) : "";
  }
  return info[field];
}

export default function EditParentInfoScreen({ navigation }: Props) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();

  const info = useParentInfo();
  const nationalities = useNationalities();
  const { mutateAsync: save, isPending } = useUpdateParentInfo();

  /**
   * Only the fields the parent actually edited.
   *
   * Holding edits rather than a full copy of the record means no seeding
   * effect, a refetch can't clobber half-typed input, and the set of changed
   * fields the endpoint wants is just the draft's keys.
   */
  const [draft, setDraft] = useState<Partial<Record<EditableField, string>>>({});
  const [error, setError] = useState<string | null>(null);

  const valueOf = (field: EditableField): string =>
    draft[field] ?? initialValue(info.data, field);

  const setValue = (field: EditableField) => (next: string) =>
    setDraft((prev) => ({ ...prev, [field]: next }));

  const handleSave = useCallback(async () => {
    if (isPending || !info.data) return;
    setError(null);

    // The endpoint "saves changed fields", so only what differs is sent — an
    // unchanged value could otherwise be queued for school review for nothing.
    const current = info.data;
    const changes: UpdateParentInfoInput = {};

    (Object.keys(draft) as EditableField[]).forEach((field) => {
      const next = (draft[field] ?? "").trim();
      if (next === initialValue(current, field)) return;

      if (field === "nationalityId") {
        changes.nationalityId = next ? Number(next) : null;
      } else {
        changes[field] = next;
      }
    });

    if (Object.keys(changes).length === 0) {
      navigation.goBack();
      return;
    }

    try {
      await save(changes);
      Alert.alert(
        "Saved",
        "Your details have been submitted. Some changes may need the school to review them before they appear.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch (e) {
      const message =
        e instanceof ApiError
          ? e.message
          : "Could not save your details. Please try again.";
      setError(message);
    }
  }, [isPending, info.data, draft, save, navigation]);

  return (
    <ScreenTemplate
      title="My Information"
      bottomContent={
        <Button text="Save" onPress={handleSave} isLoading={isPending} />
      }
    >
      <QueryState
        isLoading={info.isLoading}
        error={info.error}
        onRetry={info.refetch}
      >
        <View style={styles.container}>
          <Text variant="caption1" weight="regular" color={colors.textSecondary}>
            Depending on your school&apos;s settings, some changes are reviewed
            before they take effect.
          </Text>

          <DefaultInput
            label="Name"
            value={valueOf("name")}
            onChange={setValue("name")}
            type="text"
            placeholder="Full name"
          />

          <DefaultInput
            label="Mobile"
            value={valueOf("mobile")}
            onChange={setValue("mobile")}
            type="text"
            placeholder="Mobile number"
            keyboardType="phone-pad"
          />

          <DefaultInput
            label="Phone"
            value={valueOf("phone")}
            onChange={setValue("phone")}
            type="text"
            placeholder="Landline or alternate number"
            keyboardType="phone-pad"
          />

          <DefaultInput
            label="Email"
            value={valueOf("email")}
            onChange={setValue("email")}
            type="text"
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <DefaultInput
            label="Job"
            value={valueOf("job")}
            onChange={setValue("job")}
            type="text"
            placeholder="Occupation"
          />

          <DefaultInput
            label="Address"
            value={valueOf("address")}
            onChange={setValue("address")}
            type="text"
            placeholder="Home address"
            multiline
            numberOfLines={3}
            style={styles.multiline}
          />

          <View style={styles.dropdown}>
            <DefaultInput
              label="Nationality"
              value={valueOf("nationalityId")}
              onChange={setValue("nationalityId")}
              type="select"
              placeholder="Select a nationality"
              options={nationalities.data ?? []}
            />
          </View>

          {error ? (
            <Text variant="label3" weight="regular" color={colors.errorText}>
              {error}
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
    multiline: {
      minHeight: 80,
      textAlignVertical: "top",
      paddingTop: 14,
    },
    dropdown: {
      zIndex: 20,
    },
  });
