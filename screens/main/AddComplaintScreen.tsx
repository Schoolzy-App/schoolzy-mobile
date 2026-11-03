import * as ImagePicker from "expo-image-picker";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  CheckIcon,
  CircleIcon,
  EnvelopeSimpleIcon,
  FileImageIcon,
  FlagIcon,
  type Icon,
  PaperclipIcon,
  PaperPlaneTiltIcon,
  PhoneIcon,
  UsersIcon,
  XIcon,
} from "phosphor-react-native";
import React, { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import {
  categoryIcon,
  PRIORITY_COLOR,
} from "@/components/complaints/ComplaintParts";
import {
  ErrorBanner,
  Field,
  InfoHint,
  LockNote,
  OptionTile,
  StepProgress,
  TextField,
} from "@/components/form/FormParts";
import FormButton from "@/components/FormButton";
import { QueryState, ScreenTemplate, Text } from "@/components/ui";
import { Palette, Radius, Size, Spacing, Type } from "@/constants/tokens";
import {
  useComplaintCategories,
  useComplaintContactMethods,
  useComplaintPriorities,
  useComplaintStudents,
  useCreateComplaint,
} from "@/hooks";
import type { RootStackScreenProps } from "@/navigation/types";
import type { UploadFile } from "@/services/api/multipart";
import { ApiError } from "@/types/api";

type Props = RootStackScreenProps<"AddComplaint">;

const TITLE_MAX_LENGTH = 200;
const DESCRIPTION_MAX_LENGTH = 2000;

const STEP_NAMES = ["Complaint", "Priority and child", "Contact and file"];

/** 1 Phone, 2 Email, 3 Meeting — the contact-method lookup's ids. */
const CONTACT_ICON: Record<number, Icon> = {
  1: PhoneIcon,
  2: EnvelopeSimpleIcon,
  3: UsersIcon,
};

/** New Complaint, in three steps, then a confirmation (Complaints spec §3–4). */
export default function AddComplaintScreen({ navigation }: Props) {
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
  const [step, setStep] = useState(1);
  /** Errors show only after Continue was tried on that step. */
  const [tried, setTried] = useState<Record<number, boolean>>({});
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
  const [createdId, setCreatedId] = useState<number | null>(null);

  const {
    submit,
    retry,
    canRetry,
    isProcessing,
    isPending,
    error: submitError,
  } = useCreateComplaint((id) => setCreatedId(id));

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

  // ── Validation ───────────────────────────────────────────────────────────
  // Title and description are nullable in the server DTO but the service
  // treats them as required, so the form enforces them rather than letting
  // the request fail server-side.
  const errors: Record<string, string | null> = {
    title: title.trim() ? null : "Enter a title for your complaint.",
    category: category ? null : "Choose a category.",
    description: description.trim() ? null : "Describe what happened.",
    priority: priority ? null : "Choose a priority.",
    contactMethod: contactMethod ? null : "Choose how the school should reach you.",
  };
  const stepFields: Record<number, string[]> = {
    1: ["title", "category", "description"],
    2: ["priority"],
    3: ["contactMethod"],
  };
  const stepValid = (n: number) => stepFields[n].every((f) => !errors[f]);
  const show = (field: string, n: number) => (tried[n] ? errors[field] : null);

  const handleSubmit = useCallback(() => {
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

  const handleNext = () => {
    setTried((t) => ({ ...t, [step]: true }));
    if (!stepValid(step)) return;
    if (step < 3) setStep(step + 1);
    else if (canRetry) retry();
    else handleSubmit();
  };

  const handleBack = () => (step > 1 ? setStep(step - 1) : navigation.goBack());

  const errorMessage =
    submitError instanceof ApiError
      ? submitError.message
      : submitError
        ? "Could not submit the complaint. Please try again."
        : null;

  // ── Submitted ────────────────────────────────────────────────────────────
  if (createdId !== null) {
    return (
      <ScreenTemplate variant="form" title="Complaint sent" onBack={() => navigation.navigate("Complaints")}>
        <SubmittedView
          complaintId={createdId}
          onView={() =>
            navigation.replace("ComplaintDetails", { complaintId: createdId })
          }
          onBackToList={() => navigation.navigate("Complaints")}
        />
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate
      variant="form"
      title="New Complaint"
      onBack={handleBack}
      headerStyle={styles.header}
      bottomContent={
        <View style={styles.footer}>
          <View style={styles.footerBack}>
            <FormButton
              label="Back"
              variant="secondary"
              onPress={handleBack}
              disabled={isPending}
            />
          </View>
          <View style={styles.footerNext}>
            <FormButton
              label={
                isPending
                  ? "Sending…"
                  : step < 3
                    ? "Continue"
                    : canRetry
                      ? "Retry"
                      : "Submit"
              }
              Icon={step < 3 ? ArrowRightIcon : PaperPlaneTiltIcon}
              loading={isPending}
              onPress={handleNext}
            />
          </View>
        </View>
      }
    >
      <QueryState isLoading={lookupsLoading} error={lookupsError} onRetry={retryLookups}>
        <View style={styles.body}>
          <StepProgress step={step} total={3} name={STEP_NAMES[step - 1]} />

          {step === 1 ? (
            <>
              <Field
                label="Title"
                hint={`${title.length}/${TITLE_MAX_LENGTH}`}
                error={show("title", 1)}
              >
                <TextField
                  value={title}
                  onChangeText={setTitle}
                  placeholder="A short summary"
                  maxLength={TITLE_MAX_LENGTH}
                  invalid={!!show("title", 1)}
                />
              </Field>

              <Field label="Category" error={show("category", 1)}>
                <View style={styles.grid2}>
                  {(categories.data ?? []).map((option) => (
                    <View key={option.value} style={styles.half}>
                      <OptionTile
                        label={option.label}
                        Icon={categoryIcon(Number(option.value))}
                        selected={category === option.value}
                        onPress={() => setCategory(option.value)}
                        invalid={!!show("category", 1)}
                      />
                    </View>
                  ))}
                </View>
              </Field>

              <Field label="Description" error={show("description", 1)}>
                <TextField
                  value={description}
                  onChangeText={setDescription}
                  placeholder="What happened? Include dates and names if you can."
                  maxLength={DESCRIPTION_MAX_LENGTH}
                  multilineArea
                  invalid={!!show("description", 1)}
                />
              </Field>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Field label="Priority" error={show("priority", 2)}>
                <View style={styles.grid2}>
                  {(priorities.data ?? []).map((option) => {
                    const color = PRIORITY_COLOR[Number(option.value)] ?? Palette.text.secondary;
                    return (
                      <View key={option.value} style={styles.half}>
                        <OptionTile
                          label={option.label}
                          Icon={FlagIcon}
                          iconWeight="fill"
                          iconColor={color}
                          accent={color}
                          labelStyle="semibold"
                          selected={priority === option.value}
                          onPress={() => setPriority(option.value)}
                          invalid={!!show("priority", 2)}
                        />
                      </View>
                    );
                  })}
                </View>
              </Field>
              <InfoHint text="Choose Urgent only for safety or wellbeing concerns that need attention today." />

              {students.data?.length ? (
                <Field label="Which child is this about?" hint="Optional">
                  <View style={styles.stack}>
                    {students.data.map((option, index) => (
                      <ChildOption
                        key={option.value}
                        name={option.label}
                        index={index}
                        selected={studentSeasonId === option.value}
                        onPress={() =>
                          setStudentSeasonId(
                            studentSeasonId === option.value ? "" : option.value,
                          )
                        }
                      />
                    ))}
                  </View>
                </Field>
              ) : null}
            </>
          ) : null}

          {step === 3 ? (
            <>
              <Field label="Phone" hint="Optional">
                <TextField
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  placeholder="+20 1XX XXX XXXX"
                  keyboardType="phone-pad"
                />
              </Field>
              <Field label="Email" hint="Optional">
                <TextField
                  value={contactEmail}
                  onChangeText={setContactEmail}
                  placeholder="name@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </Field>
              <Field label="Preferred contact method" error={show("contactMethod", 3)}>
                <View style={styles.grid3}>
                  {(contactMethods.data ?? []).map((option) => (
                    <View key={option.value} style={styles.third}>
                      <OptionTile
                        label={option.label}
                        Icon={CONTACT_ICON[Number(option.value)]}
                        height={Size.methodOption}
                        centered
                        selected={contactMethod === option.value}
                        onPress={() => setContactMethod(option.value)}
                        invalid={!!show("contactMethod", 3)}
                      />
                    </View>
                  ))}
                </View>
              </Field>
              <Field label="Best time to reach you" hint="Optional">
                <TextField
                  value={contactTime}
                  onChangeText={setContactTime}
                  placeholder="e.g. Weekdays after 4 PM"
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

              <LockNote text="Your complaint is shared only with the staff handling it." />

              {isProcessing ? (
                <InfoHint text="Your complaint is still being processed. Don't submit it again — retrying reuses the same request." />
              ) : null}

              {errorMessage ? (
                <ErrorBanner
                  title="Couldn't send your complaint"
                  message={
                    canRetry
                      ? `${errorMessage} It may still have gone through, so retrying resends the same complaint rather than filing a second one.`
                      : errorMessage
                  }
                />
              ) : null}
            </>
          ) : null}
        </View>
      </QueryState>
    </ScreenTemplate>
  );
}

// ─── Pieces ──────────────────────────────────────────────────────────────────

function ChildOption({
  name,
  index,
  selected,
  onPress,
}: {
  name: string;
  index: number;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.child, selected && { borderColor: Palette.action.primary }]}
    >
      <View
        style={[
          styles.childAvatar,
          { backgroundColor: Palette.avatar.children[index % Palette.avatar.children.length] },
        ]}
      >
        <Text style={styles.childInitial} color={Palette.text.onBrand}>
          {name.trim().charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text style={[Type.cardTitle, styles.flex]} numberOfLines={1}>
        {name}
      </Text>
      {selected ? (
        <CheckCircleIcon weight="fill" size={22} color={Palette.action.primary} />
      ) : (
        <CircleIcon size={22} color={Palette.text.chevron} />
      )}
    </Pressable>
  );
}

function SubmittedView({
  complaintId,
  onView,
  onBackToList,
}: {
  complaintId: number;
  onView: () => void;
  onBackToList: () => void;
}) {
  return (
    <View style={styles.success}>
      <View style={styles.successCircle}>
        <CheckIcon weight="bold" size={46} color={Palette.feedback.success} />
      </View>
      <Text style={Type.successTitle}>Complaint submitted</Text>
      <View style={styles.referencePill}>
        <Text style={Type.cardHeading}>#{complaintId}</Text>
      </View>
      <Text style={styles.successBody} color={Palette.text.secondary}>
        The school will review it and reply here. You can follow its status in My
        Complaints.
      </Text>
      <View style={styles.successButtons}>
        <FormButton label="View complaint" onPress={onView} />
        <FormButton label="Back to My Complaints" variant="secondary" onPress={onBackToList} />
      </View>
    </View>
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
  footer: {
    flexDirection: "row",
    gap: Spacing.form.footerGap,
  },
  footerBack: {
    flex: 1,
  },
  footerNext: {
    flex: 1.6,
  },
  grid2: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  half: {
    width: "48.8%",
  },
  grid3: {
    flexDirection: "row",
    gap: 8,
  },
  third: {
    flex: 1,
  },
  stack: {
    gap: 8,
  },
  child: {
    minHeight: Size.childOption,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radius.option,
    borderWidth: Size.inputBorderWidth,
    borderColor: Palette.form.inputBorder,
    backgroundColor: Palette.surface.card,
  },
  childAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  childInitial: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 19,
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
