import {
  CaretRightIcon,
  CheckCircleIcon,
  CheckSquareIcon,
  CircleIcon,
  CreditCardIcon,
  type Icon,
  InfoIcon,
  LockSimpleIcon,
  PaperclipIcon,
  PaperPlaneTiltIcon,
  SealCheckIcon,
  SquareIcon,
  StorefrontIcon,
  WalletIcon,
  XCircleIcon,
} from "phosphor-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import { ConsentStatusChip, ConsentTypeChip, ToneChip } from "@/components/consentForms/ConsentChips";
import {
  ErrorBanner,
  Field,
  InfoHint,
  LockNote,
  OptionTile,
  TextField,
} from "@/components/form/FormParts";
import { SelectField } from "@/components/form/SelectField";
import FormButton from "@/components/FormButton";
import { QueryState, ScreenTemplate, Text } from "@/components/ui";
import { consentStrings } from "@/constants/consentFormStrings";
import { Opacity, Palette, Radius, Size, Spacing, Type } from "@/constants/tokens";
import { useConsentForm, useRespondConsentForm } from "@/hooks";
import type { RootStackScreenProps } from "@/navigation/types";
import { consentFormsApi } from "@/services/api/consentForms";
import { consentStatusLabel, type ConsentFormDetail, type ConsentQuestion } from "@/services/mappers";
import { ApiError, ConsentDecision, ConsentErrorCode, ConsentPayWith } from "@/types/api";
import { describeDevice } from "@/utils/deviceInfo";
import { formatCurrency, formatDateTime } from "@/utils/format";

type Props = RootStackScreenProps<"ConsentFormDetails">;

type Decision = "approve" | "decline";
type PayChoice = typeof ConsentPayWith.Wallet | typeof ConsentPayWith.Online | typeof ConsentPayWith.PayAtSchool;

const NAME_MIN = 3;
const ANSWER_MAX = 1000;

/** Server rejections that mean what's on screen is stale. */
const REFETCH_ON: string[] = [
  ConsentErrorCode.Closed,
  ConsentErrorCode.InsufficientBalance,
  ConsentErrorCode.AlreadyPaidContactSchool,
  ConsentErrorCode.CapacityFull,
  ConsentErrorCode.OnlineNotAvailable,
];

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|heic|bmp)$/i;

/** One consent form: read it, answer the questions, approve or decline. */
export default function ConsentFormDetailsScreen({ route, navigation }: Props) {
  const s = consentStrings();
  const { recipientId } = route.params;
  const { data, isLoading, error, refetch } = useConsentForm(recipientId);

  // ── Form state, seeded once per loaded form ───────────────────────────
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [decision, setDecision] = useState<Decision | null>(null);
  const [payWith, setPayWith] = useState<PayChoice | null>(null);
  const [signerName, setSignerName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [tried, setTried] = useState(false);

  // Prefill from the previous answer when the form first loads (adjusting
  // state while rendering, as React recommends over an effect).
  const [seededFor, setSeededFor] = useState<number | null>(null);
  if (data && seededFor !== data.id) {
    setSeededFor(data.id);
    const prefill: Record<number, string> = {};
    for (const q of data.questions) if (q.previousValue) prefill[q.id] = q.previousValue;
    setAnswers(prefill);
    setDecision(
      data.status === "approved" ? "approve" : data.status === "declined" ? "decline" : null,
    );
    setSignerName(data.lastSignerName ?? "");
  }

  const respond = useRespondConsentForm(recipientId, () => {
    Alert.alert(s.success, undefined, [{ text: "OK", onPress: () => navigation.goBack() }], {
      cancelable: true,
      onDismiss: () => navigation.goBack(),
    });
  });
  const { submit, retry, canRetry, isProcessing, isPending, error: submitError } = respond;

  // A closed form, a changed balance or a full trip: refresh under the message.
  useEffect(() => {
    if (submitError instanceof ApiError && !isProcessing) {
      const code = submitError.errors?.[0];
      if (code && REFETCH_ON.includes(code)) void refetch();
    }
  }, [submitError, isProcessing, refetch]);

  const openAttachment = useCallback(async () => {
    if (!data) return;
    const name = data.attachmentName ?? "";
    navigation.navigate("Pdf", {
      title: name || s.attachment,
      uri: consentFormsApi.getAttachmentUrl(data.id),
      headers: await consentFormsApi.getAttachmentHeaders(),
      kind: IMAGE_EXT.test(name) ? "image" : /\.pdf$/i.test(name) ? "pdf" : undefined,
    });
  }, [data, navigation, s.attachment]);

  // ── Validation ────────────────────────────────────────────────────────
  const approving = decision === "approve";
  const needsPayment = !!data?.needsPayment && approving;
  const walletEnough =
    !!data && data.walletBalance != null && data.walletBalance >= data.amount;

  const errors: Record<string, string | null> = {};
  if (data) {
    errors.decision = decision ? null : s.errDecision;
    for (const q of data.questions) {
      errors[`q${q.id}`] =
        approving && q.isRequired && !(answers[q.id] ?? "").trim() ? s.errAnswerRequired : null;
    }
    const payValid =
      payWith === ConsentPayWith.PayAtSchool ||
      (payWith === ConsentPayWith.Wallet && walletEnough) ||
      (payWith === ConsentPayWith.Online && data.onlinePaymentAvailable);
    errors.payment = needsPayment && !payValid ? s.errPayment : null;
    errors.name = signerName.trim().length < NAME_MIN ? s.errName : null;
    errors.agree = agreed ? null : s.errAgree;
  }
  const show = (key: string) => (tried ? errors[key] ?? null : null);
  const hasErrors = Object.values(errors).some(Boolean);

  // ── Submit ────────────────────────────────────────────────────────────
  const dialogOpen = useRef(false);
  const handleSubmit = () => {
    if (!data) return;
    setTried(true);
    if (canRetry) {
      // The last attempt's outcome is unknown: resend it with its key.
      retry();
      return;
    }
    if (hasErrors || !decision) return;

    const input = {
      decision: approving ? ConsentDecision.Approved : ConsentDecision.Declined,
      signerName: signerName.trim(),
      agreed: true as const,
      answers: approving
        ? data.questions
            .map((q) => ({ questionId: q.id, value: (answers[q.id] ?? "").trim() }))
            .filter((a) => a.value)
        : [],
      payWith: needsPayment && payWith != null ? payWith : ConsentPayWith.None,
      deviceInfo: describeDevice(),
    };

    if (dialogOpen.current) return;
    dialogOpen.current = true;
    const close = () => {
      dialogOpen.current = false;
    };
    const lines = [approving ? s.confirmApprove(data.studentName) : s.confirmDecline(data.studentName)];
    if (input.payWith === ConsentPayWith.Wallet) lines.push(s.confirmCharge(formatCurrency(data.amount)));
    Alert.alert(
      s.confirmTitle,
      lines.join("\n"),
      [
        { text: s.cancel, style: "cancel", onPress: close },
        {
          text: s.send,
          onPress: () => {
            close();
            submit(input);
          },
        },
      ],
      { cancelable: true, onDismiss: close },
    );
  };

  const submitMessage =
    submitError instanceof ApiError
      ? submitError.message || s.errorGeneric
      : submitError
        ? s.errorGeneric
        : null;

  const readOnly = !!data && !data.canRespond;

  return (
    <ScreenTemplate
      variant="form"
      title={s.formTitle}
      headerStyle={styles.header}
      bottomContent={
        data && !readOnly ? (
          <FormButton
            label={isPending ? s.sending : canRetry ? s.retry : s.submit}
            Icon={PaperPlaneTiltIcon}
            loading={isPending}
            onPress={handleSubmit}
          />
        ) : undefined
      }
    >
      <View style={styles.body}>
        <QueryState isLoading={isLoading} error={data ? null : error} onRetry={refetch}>
          {data ? (
            <>
              {error ? <InfoHint text={s.refreshFailedDetail} /> : null}

              <AnswerBanner item={data} />

              <SummaryCard item={data} onOpenAttachment={openAttachment} />

              {data.questions.length ? (
                <View style={styles.group}>
                  <Text style={[Type.groupLabel, styles.groupLabel]} color={Palette.text.tertiary}>
                    {s.questions}
                  </Text>
                  {data.questions.map((q) => (
                    <QuestionField
                      key={q.id}
                      question={q}
                      value={answers[q.id] ?? ""}
                      onChange={(value) => setAnswers((prev) => ({ ...prev, [q.id]: value }))}
                      error={show(`q${q.id}`)}
                      readOnly={readOnly}
                    />
                  ))}
                </View>
              ) : null}

              {readOnly ? null : (
                <>
                  <Field label={s.decision} error={show("decision")}>
                    <View style={styles.row}>
                      <View style={styles.flex}>
                        <OptionTile
                          label={s.approve}
                          Icon={CheckCircleIcon}
                          iconWeight="fill"
                          accent={Palette.status.success.solid}
                          selected={decision === "approve"}
                          onPress={() => setDecision("approve")}
                          invalid={!!show("decision")}
                          height={56}
                          centered
                          labelStyle="semibold"
                        />
                      </View>
                      <View style={styles.flex}>
                        <OptionTile
                          label={s.decline}
                          Icon={XCircleIcon}
                          iconWeight="fill"
                          accent={Palette.status.danger.solid}
                          selected={decision === "decline"}
                          onPress={() => setDecision("decline")}
                          invalid={!!show("decision")}
                          height={56}
                          centered
                          labelStyle="semibold"
                        />
                      </View>
                    </View>
                  </Field>

                  {needsPayment ? (
                    <Field
                      label={`${s.payment} · ${formatCurrency(data.amount)}`}
                      error={show("payment")}
                    >
                      <View style={styles.stack}>
                        <PayOption
                          Icon={WalletIcon}
                          title={s.payWallet}
                          description={
                            data.walletBalance != null
                              ? s.walletBalance(formatCurrency(data.walletBalance))
                              : null
                          }
                          warning={walletEnough ? null : s.notEnoughBalance}
                          selected={payWith === ConsentPayWith.Wallet}
                          disabled={!walletEnough}
                          onPress={() => setPayWith(ConsentPayWith.Wallet)}
                          invalid={!!show("payment")}
                        />
                        <PayOption
                          Icon={CreditCardIcon}
                          title={s.payOnline}
                          description={data.onlinePaymentAvailable ? null : s.comingSoon}
                          selected={payWith === ConsentPayWith.Online}
                          disabled={!data.onlinePaymentAvailable}
                          onPress={() => setPayWith(ConsentPayWith.Online)}
                          invalid={!!show("payment")}
                        />
                        <PayOption
                          Icon={StorefrontIcon}
                          title={s.payAtSchool}
                          selected={payWith === ConsentPayWith.PayAtSchool}
                          onPress={() => setPayWith(ConsentPayWith.PayAtSchool)}
                          invalid={!!show("payment")}
                        />
                      </View>
                    </Field>
                  ) : null}

                  <Field label={s.signerName} error={show("name")}>
                    <TextField
                      value={signerName}
                      onChangeText={setSignerName}
                      placeholder={s.signerPlaceholder}
                      autoCapitalize="words"
                      autoComplete="name"
                      maxLength={150}
                      invalid={!!show("name")}
                    />
                  </Field>

                  <View style={styles.stack}>
                    <Pressable
                      onPress={() => setAgreed((v) => !v)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: agreed }}
                      style={[
                        styles.checkRow,
                        agreed && { borderColor: Palette.action.primary },
                        !!show("agree") && { borderColor: Palette.form.optionErrorBorder },
                      ]}
                    >
                      {agreed ? (
                        <CheckSquareIcon weight="fill" size={22} color={Palette.action.primary} />
                      ) : (
                        <SquareIcon size={22} color={Palette.text.chevron} />
                      )}
                      <Text style={[styles.checkText, styles.flex]}>
                        {s.agree(data.studentName)}
                      </Text>
                    </Pressable>
                    {show("agree") ? (
                      <Text style={Type.fieldError} color={Palette.form.inputError}>
                        {show("agree")}
                      </Text>
                    ) : null}
                  </View>

                  <LockNote text={s.signedNote} />

                  {tried && hasErrors && !canRetry ? <InfoHint text={s.fixBelow} /> : null}

                  {isProcessing ? <InfoHint text={s.processing} /> : null}

                  {submitMessage && !isProcessing ? (
                    <ErrorBanner
                      title={s.errorTitle}
                      message={canRetry ? `${submitMessage} ${s.errorMayHaveGone}` : submitMessage}
                    />
                  ) : null}
                </>
              )}
            </>
          ) : null}
        </QueryState>
      </View>
    </ScreenTemplate>
  );
}

// ─── Pieces ──────────────────────────────────────────────────────────────────

/** "You answered …" for an answered form, or the closed note. */
function AnswerBanner({ item }: { item: ConsentFormDetail }) {
  const s = consentStrings();
  const answered = item.status !== "pending";
  if (!answered && item.canRespond) return null;

  let Icon: Icon = LockSimpleIcon;
  let tone: { fg: string; tint: string } = Palette.status.neutral;
  if (item.status === "approved") {
    Icon = SealCheckIcon;
    tone = Palette.status.success;
  } else if (item.status === "declined") {
    Icon = XCircleIcon;
    tone = Palette.status.danger;
  }

  const lines: string[] = [];
  if (answered && item.lastSignerName) lines.push(s.signedBy(item.lastSignerName));
  if (answered && item.respondedAt) lines.push(formatDateTime(item.respondedAt.toISOString()));

  return (
    <View style={[styles.card, styles.banner]}>
      <View style={[styles.bannerIcon, { backgroundColor: tone.tint }]}>
        <Icon weight="fill" size={22} color={tone.fg} />
      </View>
      <View style={[styles.flex, styles.bannerText]}>
        {answered ? (
          <Text style={Type.cardHeading}>{s.youAnswered(consentStatusLabel(item.status))}</Text>
        ) : null}
        {lines.length ? (
          <Text style={Type.meta} color={Palette.text.secondary}>
            {lines.join(" · ")}
          </Text>
        ) : null}
        <Text style={styles.bodyText}>{item.canRespond ? s.canChange : s.closed}</Text>
      </View>
    </View>
  );
}

function SummaryCard({
  item,
  onOpenAttachment,
}: {
  item: ConsentFormDetail;
  onOpenAttachment: () => void;
}) {
  const s = consentStrings();
  const rows: { label: string; value: string }[] = [
    { label: s.child, value: item.studentName },
    { label: s.answerBy, value: item.deadlineText ? formatDateTime(item.deadlineText) : "" },
    {
      label: s.amount,
      value: item.collectPayment && item.amount > 0 ? formatCurrency(item.amount) : "",
    },
  ].filter((row) => row.value);

  return (
    <View style={[styles.card, styles.details]}>
      <View style={styles.summaryTop}>
        <Text style={[Type.detailTitleComplaint, styles.flex]}>{item.title}</Text>
        <ConsentStatusChip status={item.status} large />
      </View>
      <View style={styles.chips}>
        <ConsentTypeChip kind={item.linkKind} />
        {item.isPaid ? <ToneChip label={s.paid} tone={Palette.status.success} dot={false} /> : null}
      </View>
      {item.linkName ? (
        <Text style={Type.cardHeading} color={Palette.text.secondary}>
          {item.linkName}
        </Text>
      ) : null}

      {rows.map((row, index) => (
        <View key={row.label} style={[styles.kv, index < rows.length - 1 && styles.kvDivided]}>
          <Text style={Type.rowLabel} color={Palette.text.secondary}>
            {row.label}
          </Text>
          <Text style={[styles.value, styles.valueText]} numberOfLines={2}>
            {row.value}
          </Text>
        </View>
      ))}

      {item.description ? <Text style={styles.description}>{item.description}</Text> : null}

      {item.hasAttachment ? (
        <Pressable
          onPress={onOpenAttachment}
          accessibilityRole="button"
          accessibilityLabel={s.openAttachment}
          style={({ pressed }) => [styles.attachment, pressed && styles.pressed]}
        >
          <View style={styles.attachmentIcon}>
            <PaperclipIcon size={18} color={Palette.action.primary} />
          </View>
          <View style={styles.flex}>
            <Text style={Type.cardHeading} numberOfLines={1}>
              {item.attachmentName || s.attachment}
            </Text>
            <Text style={Type.meta} color={Palette.text.secondary}>
              {s.openAttachment}
            </Text>
          </View>
          <CaretRightIcon weight="bold" size={14} color={Palette.text.chevron} />
        </Pressable>
      ) : null}
    </View>
  );
}

function QuestionField({
  question,
  value,
  onChange,
  error,
  readOnly,
}: {
  question: ConsentQuestion;
  value: string;
  onChange: (value: string) => void;
  error: string | null;
  readOnly: boolean;
}) {
  const s = consentStrings();
  const hint = question.isRequired ? s.required : s.optional;
  const label = question.isRequired ? `${question.text} *` : question.text;

  let control: React.ReactNode;
  switch (question.kind) {
    case "yesNo":
      control = (
        <View style={[styles.row, readOnly && styles.readOnly]} pointerEvents={readOnly ? "none" : "auto"}>
          {(["Yes", "No"] as const).map((v) => (
            <View key={v} style={styles.flex}>
              <OptionTile
                label={v === "Yes" ? s.yes : s.no}
                selected={value === v}
                onPress={() => onChange(v)}
                invalid={!!error}
                centered
              />
            </View>
          ))}
        </View>
      );
      break;
    case "choice":
      control = (
        <SelectField
          title={question.text}
          placeholder={s.choose}
          value={value}
          fallbackLabel={value}
          options={question.options.map((o) => ({ value: o.value, label: o.label }))}
          onChange={onChange}
          disabled={readOnly}
          invalid={!!error}
        />
      );
      break;
    case "phone":
      control = (
        <TextField
          value={value}
          onChangeText={onChange}
          placeholder={s.phonePlaceholder}
          keyboardType="phone-pad"
          autoComplete="tel"
          maxLength={20}
          editable={!readOnly}
          invalid={!!error}
        />
      );
      break;
    default:
      control = (
        <TextField
          value={value}
          onChangeText={onChange}
          placeholder={s.typeHere}
          maxLength={ANSWER_MAX}
          multilineArea
          editable={!readOnly}
          invalid={!!error}
        />
      );
  }

  return (
    <Field label={label} hint={readOnly ? undefined : hint} error={error}>
      {control}
    </Field>
  );
}

function PayOption({
  Icon,
  title,
  description,
  warning,
  selected,
  disabled,
  onPress,
  invalid,
}: {
  Icon: Icon;
  title: string;
  description?: string | null;
  warning?: string | null;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
  invalid?: boolean;
}) {
  const accent = Palette.action.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled: !!disabled }}
      style={[
        styles.payCard,
        selected && { borderColor: accent, backgroundColor: Palette.action.tint7 },
        !selected && invalid && { borderColor: Palette.form.optionErrorBorder },
        disabled && styles.readOnly,
      ]}
    >
      <Icon size={22} color={selected ? accent : Palette.text.secondary} />
      <View style={styles.flex}>
        <Text style={Type.cardHeading}>{title}</Text>
        {description ? (
          <Text style={Type.meta} color={Palette.text.secondary}>
            {description}
          </Text>
        ) : null}
        {warning ? (
          <View style={styles.warnRow}>
            <InfoIcon size={14} color={Palette.status.danger.fg} />
            <Text style={Type.meta} color={Palette.status.danger.fg}>
              {warning}
            </Text>
          </View>
        ) : null}
      </View>
      {selected ? (
        <CheckCircleIcon weight="fill" size={22} color={accent} />
      ) : (
        <CircleIcon size={22} color={Palette.text.chevron} />
      )}
    </Pressable>
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
    paddingBottom: 32,
    gap: Spacing.form.bodyGap.form,
  },
  group: {
    gap: Spacing.form.bodyGap.form,
  },
  groupLabel: {
    marginHorizontal: 4,
    marginBottom: -6,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  stack: {
    gap: 8,
  },
  readOnly: {
    opacity: Opacity.disabled,
  },
  card: {
    backgroundColor: Palette.surface.card,
    borderRadius: Radius.card,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerText: {
    gap: 4,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: Palette.text.body,
  },
  details: {
    padding: 16,
    gap: 10,
  },
  summaryTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  kv: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
  },
  kvDivided: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.border.divider,
  },
  value: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 18,
  },
  valueText: {
    flexShrink: 1,
    textAlign: "right",
  },
  description: {
    fontSize: 16,
    lineHeight: 25,
    color: Palette.text.body,
  },
  attachment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: Radius.input,
    borderWidth: Size.inputBorderWidth,
    borderColor: Palette.form.inputBorder,
  },
  attachmentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.action.tint8,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    backgroundColor: Palette.surface.pressedRow,
  },
  payCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: Radius.option,
    borderWidth: Size.inputBorderWidth,
    borderColor: Palette.form.inputBorder,
    backgroundColor: Palette.surface.card,
  },
  warnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.input,
    borderWidth: Size.inputBorderWidth,
    borderColor: Palette.form.inputBorder,
    backgroundColor: Palette.surface.card,
  },
  checkText: {
    fontSize: 15,
    lineHeight: 22,
  },
});
