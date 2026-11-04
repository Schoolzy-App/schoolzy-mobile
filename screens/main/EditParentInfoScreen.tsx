import { ClockIcon, InfoIcon, LockSimpleIcon, XCircleIcon } from "phosphor-react-native";
import React, { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import { ErrorBanner, Field, TextField } from "@/components/form/FormParts";
import { SelectField } from "@/components/form/SelectField";
import { Toast, type ToastMessage } from "@/components/form/Toast";
import FormButton from "@/components/FormButton";
import { ScreenTemplate, Text } from "@/components/ui";
import { Palette, Radius, Size, Spacing, Type } from "@/constants/tokens";
import { useNationalities, useParentInfo, useUpdateParentInfo } from "@/hooks";
import type { RootStackScreenProps } from "@/navigation/types";
import type { ParentInfo, ParentInfoChange } from "@/services/mappers";
import { ApiError } from "@/types/api";
import type {
  ParentInfoSaveResultDto,
  UpdateParentInfoInput,
} from "@/types/api";

type Props = RootStackScreenProps<"EditParentInfo">;

type EditableField =
  "name" | "mobile" | "phone" | "email" | "address" | "job" | "nationalityId";

const NAME_MAX_LENGTH = 200;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LABELS: Record<EditableField, string> = {
  name: "Full name",
  mobile: "Mobile",
  phone: "Phone",
  email: "Email",
  address: "Address",
  job: "Job",
  nationalityId: "Nationality",
};

/** The server's current value for a field, as a string the inputs can hold. */
function initialValue(
  info: ParentInfo | undefined,
  field: EditableField,
): string {
  if (!info) return "";
  if (field === "nationalityId") {
    return info.nationalityId ? String(info.nationalityId) : "";
  }
  return info[field];
}

const digitsOnly = (text: string) => text.replace(/\D/g, "");

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/** Mirrors the server's own wording for the save result. */
function savedMessage(result: ParentInfoSaveResultDto | undefined): string {
  const applied = result?.applied?.length ?? 0;
  const pending = result?.pendingReview?.length ?? 0;
  if (pending && applied)
    return "Some changes were saved. The rest were sent to the school for review.";
  if (pending) return "Your changes were sent to the school for review.";
  return "Your information was saved.";
}

/** "My Information" (Design-Handoff/Documentation/Update-Information.md). */
export default function EditParentInfoScreen(_props: Props) {
  const info = useParentInfo();
  const nationalities = useNationalities();
  const { mutateAsync: save, isPending } = useUpdateParentInfo();

  /**
   * Only the fields the parent actually edited. Holding edits rather than a
   * copy of the record means a refetch can't clobber half-typed input, and
   * the changed set the endpoint wants is just the draft's keys.
   */
  const [draft, setDraft] = useState<Partial<Record<EditableField, string>>>(
    {},
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<EditableField, string>>
  >({});
  const [serverError, setServerError] = useState<{
    invalid: boolean;
    items: string[];
  } | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const hideToast = useCallback(() => setToast(null), []);

  const data = info.data;
  const locked = isPending || data?.canEdit === false;
  const valueOf = (field: EditableField): string =>
    draft[field] ?? initialValue(data, field);

  const setValue = (field: EditableField) => (next: string) => {
    setDraft((prev) => ({ ...prev, [field]: next }));
    if (fieldErrors[field])
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSave = useCallback(async () => {
    if (isPending || !data) return;
    setServerError(null);

    const value = (field: EditableField) =>
      (draft[field] ?? initialValue(data, field)).trim();
    const errors: Partial<Record<EditableField, string>> = {};
    if (!value("name")) errors.name = "Enter your full name.";
    else if (value("name").length > NAME_MAX_LENGTH)
      errors.name = `Keep it under ${NAME_MAX_LENGTH} characters.`;
    if (value("email") && !EMAIL_PATTERN.test(value("email")))
      errors.email = "Enter a valid email address.";
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    // The endpoint "saves changed fields": an unchanged value would otherwise
    // be queued for school review for nothing.
    const changes: UpdateParentInfoInput = {};
    (Object.keys(draft) as EditableField[]).forEach((field) => {
      const next = value(field);
      if (next === initialValue(data, field)) return;
      if (field === "nationalityId")
        changes.nationalityId = next ? Number(next) : null;
      else changes[field] = next;
    });

    if (Object.keys(changes).length === 0) {
      setToast({ text: "No changes to save.", kind: "info" });
      return;
    }

    try {
      const result = await save(changes);
      setDraft({});
      setToast({ text: savedMessage(result) });
    } catch (e) {
      // The server sends its field errors as a flat list (no keys), so they
      // go in the banner.
      // A 400 with errors is the server's validation; anything else is a
      // failure the parent can retry.
      const invalid =
        e instanceof ApiError && e.status === 400 && e.errors.length > 0;
      setServerError({ invalid, items: e instanceof ApiError ? e.errors : [] });
    }
  }, [isPending, data, draft, save]);

  const errorList = (Object.keys(fieldErrors) as EditableField[])
    .filter((field) => fieldErrors[field])
    .map((field) => `${LABELS[field]}: ${fieldErrors[field]}`);

  const name = valueOf("name").trim() || data?.name || "";

  return (
    <View style={styles.flex}>
      <ScreenTemplate
        variant="form"
        title="My Information"
        bottomContent={
          data && data.canEdit !== false ? (
            <FormButton
              label={isPending ? "Saving…" : "Save"}
              loading={isPending}
              onPress={handleSave}
            />
          ) : undefined
        }
      >
        {info.isLoading ? (
          <Skeleton />
        ) : !data ? (
          <View style={styles.body}>
            <ErrorBanner
              title="Couldn't load your information."
              message={info.error?.message}
              onRetry={() => info.refetch()}
            />
          </View>
        ) : (
          <View style={styles.body}>
            <Text style={styles.intro} color={Palette.text.secondary}>
              Update the details the school uses to reach you.
            </Text>

            <ReviewSummary data={data} />

            {errorList.length ? (
              <ErrorBanner
                title="Please correct the highlighted fields."
                items={errorList}
              />
            ) : serverError?.invalid ? (
              <ErrorBanner
                title="Please correct the highlighted fields."
                items={serverError.items}
              />
            ) : serverError ? (
              <ErrorBanner
                title="Something went wrong. Your changes were not saved."
                items={serverError.items}
                onRetry={handleSave}
              />
            ) : null}

            {/* ── Read-only identity ─────────────────────────────── */}
            <View>
              <View style={styles.idCard}>
                <View style={styles.idTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.initials} color={Palette.text.onBrand}>
                      {initialsOf(name)}
                    </Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.idName} numberOfLines={1}>
                      {name}
                    </Text>
                    {data.role ? (
                      <Text style={Type.meta} color={Palette.text.secondary}>
                        {data.role}
                      </Text>
                    ) : null}
                  </View>
                  <LockSimpleIcon size={18} color={Palette.text.tertiary} />
                </View>
                {/* Rows the API has a value for; a blank one is left out. */}
                {[
                  { key: "National ID", value: data.nationalId },
                  { key: "Sign-in email", value: data.loginEmail },
                ]
                  .filter((row) => row.value)
                  .map((row, index, rows) => (
                    <View
                      key={row.key}
                      style={[
                        styles.idRow,
                        index < rows.length - 1 && styles.idRowDivided,
                      ]}
                    >
                      <Text style={styles.idKey} color={Palette.text.secondary}>
                        {row.key}
                      </Text>
                      <Text
                        style={styles.idValue}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {row.value}
                      </Text>
                    </View>
                  ))}
              </View>
              <Text style={styles.idNote} color={Palette.text.tertiary}>
                {data.canEdit === false
                  ? "Contact the school office to change your details."
                  : "Contact the school office to change these."}
              </Text>
            </View>

            {/* ── Editable ─────────────────────────────────────────── */}
            <EditField
              field="name"
              hint="Required"
              data={data}
              value={valueOf("name")}
              onText={setValue("name")}
              error={fieldErrors.name}
              editable={!locked}
              maxLength={NAME_MAX_LENGTH}
            />
            <EditField
              field="mobile"
              hint="Optional"
              data={data}
              value={valueOf("mobile")}
              onText={(text) => setValue("mobile")(digitsOnly(text))}
              editable={!locked}
              keyboardType="number-pad"
            />
            <EditField
              field="phone"
              hint="Optional"
              data={data}
              value={valueOf("phone")}
              onText={(text) => setValue("phone")(digitsOnly(text))}
              editable={!locked}
              keyboardType="number-pad"
            />
            <EditField
              field="email"
              hint="For school contact"
              data={data}
              value={valueOf("email")}
              onText={setValue("email")}
              error={fieldErrors.email}
              editable={!locked}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <EditField
              field="address"
              hint="Optional"
              data={data}
              value={valueOf("address")}
              onText={setValue("address")}
              editable={!locked}
            />
            <EditField
              field="job"
              hint="Optional"
              data={data}
              value={valueOf("job")}
              onText={setValue("job")}
              editable={!locked}
            />

            <Field label="Nationality" hint="Optional">
              <SelectField
                title="Nationality"
                placeholder="Select nationality"
                value={valueOf("nationalityId")}
                fallbackLabel={data.nationalityName}
                options={nationalities.data ?? []}
                onChange={setValue("nationalityId")}
                disabled={locked}
                loading={nationalities.isLoading}
                emptyText="Nationality list is unavailable."
              />
              <ReviewNote change={data.changes.nationalityId} />
            </Field>
          </View>
        )}
      </ScreenTemplate>
      <Toast message={toast} onHide={hideToast} />
    </View>
  );
}

// ─── Pieces ──────────────────────────────────────────────────────────────────

function EditField({
  field,
  hint,
  data,
  value,
  onText,
  error,
  ...input
}: {
  field: Exclude<EditableField, "nationalityId">;
  hint: string;
  data: ParentInfo;
  value: string;
  onText: (text: string) => void;
  error?: string;
} & Omit<
  React.ComponentProps<typeof TextField>,
  "value" | "onChangeText" | "onChange"
>) {
  return (
    <Field label={LABELS[field]} hint={hint} error={error}>
      <TextField
        value={value}
        onChangeText={onText}
        invalid={!!error}
        style={input.editable === false && styles.inputLocked}
        {...input}
      />
      <ReviewNote change={data.changes[field]} />
    </Field>
  );
}

/** "name" → "Full name", for the review lines. */
const labelOf = (key: string) => LABELS[key as EditableField] ?? key;

function joinLabels(keys: string[]): string {
  const labels = keys.map(labelOf);
  if (labels.length <= 1) return labels.join("");
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}

/**
 * Tells the parent, before and after saving, that the school reviews some
 * changes. Both parts come from the API, so they follow each school's
 * settings: `reviewFields` is empty when every field saves at once, and
 * then nothing shows.
 */
function ReviewSummary({ data }: { data: ParentInfo }) {
  const pending = Object.entries(data.changes)
    .filter(([, change]) => change.status === "pending")
    .map(([key]) => key);

  if (pending.length) {
    return (
      <View style={[styles.reviewBox, styles.reviewBoxPending]}>
        <ClockIcon weight="fill" size={20} color={Palette.feedback.waiting} />
        <View style={styles.flex}>
          <Text style={Type.cardHeading}>Waiting for school review</Text>
          <Text style={styles.reviewText}>
            Your new {joinLabels(pending)} {pending.length > 1 ? "are" : "is"} with the
            school. The school still uses your current details until it approves the
            change.
          </Text>
        </View>
      </View>
    );
  }

  if (!data.reviewFields.length) return null;
  return (
    <View style={styles.reviewBox}>
      <InfoIcon weight="fill" size={20} color={Palette.action.primary} />
      <Text style={[styles.reviewText, styles.flex]}>
        Changes to your {joinLabels(data.reviewFields)} are reviewed by the school
        before they take effect. Other changes save straight away.
      </Text>
    </View>
  );
}

/**
 * The school-review state of a field, from the profile's `pendingChanges`:
 * a change still waiting, or the latest one turned down.
 */
function ReviewNote({ change }: { change?: ParentInfoChange }) {
  if (!change || change.status === "approved") return null;
  const pending = change.status === "pending";
  const Icon = pending ? ClockIcon : XCircleIcon;
  const color = pending ? Palette.feedback.waiting : Palette.form.inputError;
  const text = pending
    ? `Waiting for school review${change.requestedValue ? `: ${change.requestedValue}` : ""}`
    : `Change not approved${change.rejectReason ? `: ${change.rejectReason}` : ""}`;
  return (
    <View style={styles.review}>
      <Icon weight="fill" size={14} color={color} />
      <Text style={[Type.fieldError, styles.flex]} color={color}>
        {text}
      </Text>
    </View>
  );
}

function Skeleton() {
  return (
    <View style={styles.body}>
      <View style={[styles.idCard, styles.skeletonCard]}>
        <View style={styles.skeletonRow}>
          <View
            style={[styles.avatar, { backgroundColor: Palette.form.skeleton }]}
          />
          <View style={[styles.flex, { gap: 8 }]}>
            <View style={[styles.bar, { width: "55%" }]} />
            <View style={[styles.bar, { width: "30%" }]} />
          </View>
        </View>
        <View style={[styles.bar, { width: "80%" }]} />
        <View style={[styles.bar, { width: "70%" }]} />
      </View>
      {Array.from({ length: 5 }, (_, i) => (
        <View key={i} style={{ gap: Spacing.form.fieldGap }}>
          <View style={styles.labelBar} />
          <View style={styles.boxBar} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  body: {
    width: "100%",
    paddingTop: Spacing.form.bodyPadding,
    paddingHorizontal: Spacing.form.bodyPadding,
    paddingBottom: 24,
    gap: 16,
  },
  reviewBox: {
    flexDirection: "row",
    gap: 10,
    borderRadius: Radius.input,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: Palette.action.infoNote,
  },
  reviewBoxPending: {
    backgroundColor: Palette.feedback.waitingTint,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    color: Palette.text.body,
  },
  intro: {
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 4,
  },
  idCard: {
    backgroundColor: Palette.surface.card,
    borderRadius: Radius.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  idTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border.divider,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.avatar.children[0],
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 19,
  },
  idName: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 20,
  },
  idRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: 11,
    paddingBottom: 2,
  },
  idRowDivided: {
    paddingBottom: 11,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border.divider,
  },
  idKey: {
    fontSize: 14,
    lineHeight: 18,
  },
  idValue: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 19,
    textAlign: "right",
  },
  idNote: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  inputLocked: {
    color: Palette.text.secondary,
  },
  review: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
  },
  skeletonCard: {
    gap: 12,
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bar: {
    height: 11,
    borderRadius: 6,
    backgroundColor: Palette.form.skeleton,
  },
  labelBar: {
    width: 90,
    height: 11,
    borderRadius: 6,
    backgroundColor: Palette.form.skeletonLabel,
  },
  boxBar: {
    height: Size.input,
    borderRadius: Radius.input,
    backgroundColor: Palette.surface.card,
  },
});
