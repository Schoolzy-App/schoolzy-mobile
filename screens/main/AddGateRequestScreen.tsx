import { useFocusEffect } from "@react-navigation/native";
import {
  CheckIcon,
  CheckSquareIcon,
  MinusIcon,
  PaperPlaneTiltIcon,
  PlusIcon,
  SquareIcon,
} from "phosphor-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import {
  ChildOption,
  ErrorBanner,
  Field,
  InfoHint,
  RadioCard,
  TextField,
} from "@/components/form/FormParts";
import FormButton from "@/components/FormButton";
import { QueryState, ScreenTemplate, Text } from "@/components/ui";
import { Opacity, Palette, Radius, Size, Spacing, Type } from "@/constants/tokens";
import {
  useCreateGateRequest,
  useGateCreateOptions,
  useGateStudents,
} from "@/hooks";
import type { RootStackScreenProps } from "@/navigation/types";
import type { GateCreateOptionsDto, GateLookupDto } from "@/types/api";
import { ApiError, GateCollectPerson } from "@/types/api";

type Props = RootStackScreenProps<"AddGateRequest">;

const NOTES_MAX_LENGTH = 500;
const QUARTER_HOUR = 15;
const LAST_MINUTE_OF_DAY = 23 * 60 + 59;
/** "9:30" or "09:30"; sent normalised to HH:mm. */
const TIME_PATTERN = /^([01]?\d|2[0-3]):[0-5]\d$/;
const normaliseTime = (value: string) =>
  TIME_PATTERN.test(value.trim()) ? value.trim().padStart(5, "0") : value.trim();

/** Fixed copy (spec §6.5.2). */
const SUCCESS_COPY =
  "Request sent. Waiting for the school to confirm. It isn't valid at the gate until confirmed.";
// The existing request may be a school-made one the parent's list doesn't show.
const HAS_REQUEST_TODAY_HINT = "A request already exists today. Contact the school to change it.";
const NO_RELATIVES_HINT = "No relatives have pickup permission yet.";

/**
 * Client checks reuse the server's own wording (Task 5 contract), so the
 * parent reads the same sentence whichever side catches it.
 */
const MESSAGES = {
  student: "Choose at least one student.",
  type: "Choose a request type.",
  collector: "Choose who will collect: father, mother or a permitted relative.",
  relative: "Choose a permitted relative.",
  timeFormat: "Pickup time must be in HH:mm format.",
  timePast: "Pickup time can't be in the past.",
  notes: "Notes can't be longer than 500 characters.",
};

// ─── Time helpers (device clock; the server re-checks in school time) ───────

const pad = (n: number) => String(n).padStart(2, "0");
const toHHmm = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const nowMinutes = (now: Date) => now.getHours() * 60 + now.getMinutes();

/** The next quarter hour after now, capped at 23:59 so it stays today. */
function nextQuarterHour(now: Date = new Date()): string {
  const next = (Math.floor(nowMinutes(now) / QUARTER_HOUR) + 1) * QUARTER_HOUR;
  return toHHmm(Math.min(next, LAST_MINUTE_OF_DAY));
}

/** New gate request (spec §6.5.2), then the fixed success view. */
export default function AddGateRequestScreen({ navigation }: Props) {
  const students = useGateStudents();

  // ── Form state ───────────────────────────────────────────────────────────
  const [pickedStudentId, setStudentId] = useState<number | null>(null);
  const [siblingIds, setSiblingIds] = useState<number[]>([]);
  const [type, setType] = useState<number | null>(null);
  const [collector, setCollector] = useState<number | null>(null);
  const [relativeId, setRelativeId] = useState<number | null>(null);
  const [time, setTime] = useState(() => nextQuarterHour());
  const [notes, setNotes] = useState("");
  /** Errors show only after Send was tried. */
  const [tried, setTried] = useState(false);
  const [createdIds, setCreatedIds] = useState<number[] | null>(null);

  // A picked student counts only while it can still be used: once the latest
  // data says it already has a request today, it is no longer selected.
  const pickedStudent = students.data?.find((s) => s.studentSeasonId === pickedStudentId);
  const pickedUsable = !!pickedStudent && !pickedStudent.hasRequestToday;
  // Auto-selected when there is only one student and it can still be used.
  const onlyStudent = students.data?.length === 1 ? students.data[0] : null;
  const studentId = pickedUsable
    ? pickedStudentId
    : onlyStudent && !onlyStudent.hasRequestToday
      ? onlyStudent.studentSeasonId
      : null;

  const options = useGateCreateOptions(studentId ?? undefined);

  // Siblings sent are only those the latest options still offer as usable,
  // so a sibling that became "already has a request today" is never resent.
  const usableSiblingIds = useMemo(() => {
    const usable = new Set(
      (options.data?.siblings ?? [])
        .filter((s) => !s.hasRequestToday)
        .map((s) => s.studentSeasonId),
    );
    return siblingIds.filter((id) => usable.has(id));
  }, [options.data, siblingIds]);

  // Keep the stored selection in step with fresh students / options data
  // (adjusting state while rendering, as React recommends over an effect):
  // drop a main student that became unusable, with everything that depended
  // on it, and drop siblings that became unusable.
  const [syncedWith, setSyncedWith] = useState<{ s: unknown; o: unknown }>({
    s: undefined,
    o: undefined,
  });
  if (syncedWith.s !== students.data || syncedWith.o !== options.data) {
    setSyncedWith({ s: students.data, o: options.data });
    if (pickedStudentId !== null && students.data && !pickedUsable) {
      setStudentId(null);
      setSiblingIds([]);
      setCollector(null);
      setRelativeId(null);
    } else if (options.data && usableSiblingIds.length !== siblingIds.length) {
      setSiblingIds(usableSiblingIds);
    }
  }

  // Coming back from Relatives (after granting permission) should show the
  // newly permitted relatives, so refetch the options on refocus. The student
  // is read from a ref so picking one doesn't re-run this and double-fetch.
  const studentIdRef = useRef(studentId);
  useEffect(() => {
    studentIdRef.current = studentId;
  }, [studentId]);
  const firstFocus = useRef(true);
  const { refetch: refetchOptions } = options;
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      if (studentIdRef.current !== null) void refetchOptions();
    }, [refetchOptions]),
  );

  const selectStudent = useCallback((id: number) => {
    setStudentId(id);
    // Siblings, collectors and relatives all depend on the student.
    setSiblingIds([]);
    setCollector(null);
    setRelativeId(null);
  }, []);

  const toggleSibling = useCallback((id: number) => {
    setSiblingIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
  }, []);

  const selectCollector = useCallback((id: number) => {
    setCollector(id);
    if (id !== GateCollectPerson.Relative) setRelativeId(null);
  }, []);

  const stepTime = useCallback((delta: number) => {
    setTime((current) => {
      const base = TIME_PATTERN.test(current.trim()) ? minutesOf(current) : minutesOf(nextQuarterHour());
      return toHHmm(Math.max(0, Math.min(LAST_MINUTE_OF_DAY, base + delta)));
    });
  }, []);

  const {
    submit,
    retry,
    canRetry,
    isProcessing,
    isPending,
    error: submitError,
  } = useCreateGateRequest((ids) => setCreatedIds(ids));

  // A business rejection (e.g. "… already has a gate request today") means
  // the cached flags are stale: refresh them so the hints catch up.
  // Runs once per error, not again on every later student change.
  const { refetch: refetchStudents } = students;
  useEffect(() => {
    if (submitError instanceof ApiError && submitError.status === 409 && !isProcessing) {
      void refetchStudents();
      if (studentIdRef.current !== null) void refetchOptions();
    }
  }, [submitError, isProcessing, refetchStudents, refetchOptions]);

  // ── Validation ───────────────────────────────────────────────────────────
  const validate = (now: Date): Record<string, string | null> => ({
    student: studentId === null ? MESSAGES.student : null,
    type: type === null ? MESSAGES.type : null,
    collector:
      collector === null ||
      !(options.data?.collectPersonTypes ?? []).some((c) => c.id === collector)
        ? MESSAGES.collector
        : null,
    relative:
      collector === GateCollectPerson.Relative && relativeId === null
        ? MESSAGES.relative
        : null,
    time: !TIME_PATTERN.test(time.trim())
      ? MESSAGES.timeFormat
      : minutesOf(normaliseTime(time)) < nowMinutes(now)
        ? MESSAGES.timePast
        : null,
    notes: notes.length > NOTES_MAX_LENGTH ? MESSAGES.notes : null,
  });
  const errors = validate(new Date());
  const show = (field: string) => (tried ? errors[field] : null);

  const handleSend = () => {
    setTried(true);
    if (canRetry) {
      // The outcome of the last attempt is unknown: resend it with its key.
      retry();
      return;
    }
    // Re-check against the clock at the moment of sending.
    const fresh = validate(new Date());
    if (Object.values(fresh).some(Boolean) || studentId === null || type === null || collector === null) {
      return;
    }
    submit({
      studentSeasonIds: [studentId, ...usableSiblingIds],
      type,
      collectPerson: collector,
      studentRelativeId: collector === GateCollectPerson.Relative ? relativeId : null,
      time: normaliseTime(time),
      notes: notes.trim() || null,
    });
  };

  const errorMessage =
    submitError instanceof ApiError
      ? submitError.message
      : submitError
        ? "Could not send the request. Please try again."
        : null;

  // ── Sent ─────────────────────────────────────────────────────────────────
  if (createdIds !== null) {
    const backToList = () => navigation.navigate("GateRequests");
    return (
      <ScreenTemplate variant="form" title="Gate Requests" onBack={backToList}>
        <View style={styles.success}>
          <View style={styles.successCircle}>
            <CheckIcon weight="bold" size={46} color={Palette.feedback.success} />
          </View>
          <Text style={styles.successBody}>{SUCCESS_COPY}</Text>
          {createdIds.length > 1 ? (
            <Text style={Type.meta} color={Palette.text.secondary}>
              {createdIds.length} requests, one per child.
            </Text>
          ) : null}
          <View style={styles.successButtons}>
            {createdIds.length ? (
              <FormButton
                label="View request"
                onPress={() =>
                  navigation.replace("GateRequestDetails", { requestId: createdIds[0] })
                }
              />
            ) : null}
            <FormButton label="Back to Gate Requests" variant="secondary" onPress={backToList} />
          </View>
        </View>
      </ScreenTemplate>
    );
  }

  const studentList = students.data ?? [];

  return (
    <ScreenTemplate
      variant="form"
      title="New Gate Request"
      headerStyle={styles.header}
      bottomContent={
        // Nothing to send while the students are loading, failed or empty.
        studentList.length ? (
          <FormButton
            label={isPending ? "Sending…" : canRetry ? "Retry" : "Send request"}
            Icon={PaperPlaneTiltIcon}
            loading={isPending}
            onPress={handleSend}
          />
        ) : undefined
      }
    >
      {/* A failed background refetch (409 resync, refocus) keeps the cached
          students/options and the form; only a failure with nothing loaded blocks. */}
      <QueryState
        isLoading={students.isLoading}
        error={students.data ? null : students.error}
        onRetry={students.refetch}
        isEmpty={!studentList.length}
        emptyMessage="There are no children you can send a gate request for."
      >
        <View style={styles.body}>
          {(students.error && students.data) ||
          (studentId !== null && options.error && options.data) ? (
            <InfoHint text="Couldn't refresh. Showing the last loaded details." />
          ) : null}

          {/* ── Student ─────────────────────────────────────────────── */}
          <Field label="Student" error={show("student")}>
            <View style={styles.stack}>
              {studentList.map((student, index) => (
                <ChildOption
                  key={student.studentSeasonId}
                  name={student.name}
                  index={index}
                  selected={studentId === student.studentSeasonId}
                  onPress={() => selectStudent(student.studentSeasonId)}
                  invalid={!!show("student")}
                  disabled={student.hasRequestToday}
                  hint={student.hasRequestToday ? HAS_REQUEST_TODAY_HINT : undefined}
                />
              ))}
            </View>
          </Field>

          {studentId !== null ? (
            <QueryState
              isLoading={options.isLoading}
              error={options.data ? null : options.error}
              onRetry={options.refetch}
            >
              {options.data ? (
                <OptionFields
                  options={options.data}
                  siblingIds={usableSiblingIds}
                  onToggleSibling={toggleSibling}
                  type={type}
                  onType={setType}
                  collector={collector}
                  onCollector={selectCollector}
                  relativeId={relativeId}
                  onRelative={setRelativeId}
                  onOpenRelatives={() => navigation.navigate("Relatives")}
                  show={show}
                />
              ) : null}
            </QueryState>
          ) : null}

          {/* ── Time ────────────────────────────────────────────────── */}
          <Field label="Pickup time" hint="Today, 24-hour" error={show("time")}>
            <View style={styles.timeRow}>
              <Pressable
                onPress={() => stepTime(-QUARTER_HOUR)}
                style={styles.stepButton}
                accessibilityRole="button"
                accessibilityLabel="15 minutes earlier"
                hitSlop={4}
              >
                <MinusIcon weight="bold" size={18} color={Palette.action.primary} />
              </Pressable>
              <View style={styles.flex}>
                <TextField
                  value={time}
                  onChangeText={setTime}
                  placeholder="HH:mm"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  accessibilityLabel="Pickup time, 24-hour, hours and minutes"
                  style={styles.timeInput}
                  invalid={!!show("time")}
                />
              </View>
              <Pressable
                onPress={() => stepTime(QUARTER_HOUR)}
                style={styles.stepButton}
                accessibilityRole="button"
                accessibilityLabel="15 minutes later"
                hitSlop={4}
              >
                <PlusIcon weight="bold" size={18} color={Palette.action.primary} />
              </Pressable>
            </View>
          </Field>

          {/* ── Notes ───────────────────────────────────────────────── */}
          <Field
            label="Notes"
            hint={`Optional · ${notes.length}/${NOTES_MAX_LENGTH}`}
            error={show("notes")}
          >
            <TextField
              value={notes}
              onChangeText={setNotes}
              placeholder="Anything the school should know"
              maxLength={NOTES_MAX_LENGTH}
              multilineArea
              invalid={!!show("notes")}
            />
          </Field>

          {isProcessing ? (
            <InfoHint text="Your request is still being processed. Don't send it again — retrying reuses the same request." />
          ) : null}

          {canRetry ? (
            <InfoHint text="Retry resends your previous request exactly as it was sent. Changes made since then are not included." />
          ) : null}

          {errorMessage ? (
            <ErrorBanner
              title="Couldn't send your request"
              message={
                canRetry
                  ? `${errorMessage} It may still have gone through, so retrying resends the same request rather than filing a second one.`
                  : errorMessage
              }
            />
          ) : null}
        </View>
      </QueryState>
    </ScreenTemplate>
  );
}

// ─── Pieces ──────────────────────────────────────────────────────────────────

/** Siblings, reason and collector: everything /create-options drives. */
function OptionFields({
  options,
  siblingIds,
  onToggleSibling,
  type,
  onType,
  collector,
  onCollector,
  relativeId,
  onRelative,
  onOpenRelatives,
  show,
}: {
  options: GateCreateOptionsDto;
  siblingIds: number[];
  onToggleSibling: (id: number) => void;
  type: number | null;
  onType: (id: number) => void;
  collector: number | null;
  onCollector: (id: number) => void;
  relativeId: number | null;
  onRelative: (id: number) => void;
  onOpenRelatives: () => void;
  show: (field: string) => string | null;
}) {
  const collectorDescription = (option: GateLookupDto) => {
    if (option.id === GateCollectPerson.Father) return options.fatherName;
    if (option.id === GateCollectPerson.Mother) return options.motherName;
    return null;
  };

  return (
    <View style={styles.group}>
      {/* ── Siblings ─────────────────────────────────────────────── */}
      {options.siblings.length ? (
        <Field label="Also for siblings" hint="Optional">
          <View style={styles.stack}>
            {options.siblings.map((sibling) => {
              const checked = siblingIds.includes(sibling.studentSeasonId);
              return (
                <Pressable
                  key={sibling.studentSeasonId}
                  onPress={() => onToggleSibling(sibling.studentSeasonId)}
                  // Only ticking is blocked: a ticked sibling can always be
                  // unticked, whatever the latest flags say.
                  disabled={sibling.hasRequestToday && !checked}
                  accessibilityRole="checkbox"
                  accessibilityLabel={
                    sibling.hasRequestToday
                      ? `${sibling.name}, ${HAS_REQUEST_TODAY_HINT}`
                      : sibling.name
                  }
                  accessibilityState={{
                    checked,
                    disabled: sibling.hasRequestToday && !checked,
                  }}
                  style={[
                    styles.checkRow,
                    checked && { borderColor: Palette.action.primary },
                    sibling.hasRequestToday && styles.disabled,
                  ]}
                >
                  {checked ? (
                    <CheckSquareIcon weight="fill" size={22} color={Palette.action.primary} />
                  ) : (
                    <SquareIcon size={22} color={Palette.text.chevron} />
                  )}
                  <View style={styles.flex}>
                    <Text style={Type.cardTitle} numberOfLines={1}>
                      {sibling.name}
                    </Text>
                    {sibling.hasRequestToday ? (
                      <Text style={Type.meta} color={Palette.text.secondary}>
                        {HAS_REQUEST_TODAY_HINT}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Field>
      ) : null}

      {/* ── Reason ───────────────────────────────────────────────── */}
      <Field label="Reason" error={show("type")}>
        <View style={styles.stack}>
          {options.holdingTypes.map((option) => (
            <RadioCard
              key={option.id}
              title={option.name}
              selected={type === option.id}
              onPress={() => onType(option.id)}
              invalid={!!show("type")}
            />
          ))}
        </View>
      </Field>

      {/* ── Who will collect ─────────────────────────────────────── */}
      <Field label="Who will collect" error={show("collector")}>
        <View style={styles.stack}>
          {options.collectPersonTypes.map((option) => (
            <RadioCard
              key={option.id}
              title={option.name}
              description={collectorDescription(option)}
              selected={collector === option.id}
              onPress={() => onCollector(option.id)}
              invalid={!!show("collector")}
            />
          ))}
        </View>
        {options.permittedRelatives.length === 0 ? (
          <View style={styles.relativesHint}>
            <InfoHint text={NO_RELATIVES_HINT} />
            <Pressable
              onPress={onOpenRelatives}
              hitSlop={8}
              style={styles.link}
              accessibilityRole="link"
            >
              <Text style={Type.link} color={Palette.action.primary}>
                Go to Relatives
              </Text>
            </Pressable>
          </View>
        ) : null}
      </Field>

      {collector === GateCollectPerson.Relative ? (
        <Field label="Relative" error={show("relative")}>
          <View style={styles.stack}>
            {options.permittedRelatives.map((relative) => (
              <RadioCard
                key={relative.studentRelativeId}
                title={relative.name}
                description={relative.relativeTypeName}
                selected={relativeId === relative.studentRelativeId}
                onPress={() => onRelative(relative.studentRelativeId)}
                invalid={!!show("relative")}
              />
            ))}
          </View>
        </Field>
      ) : null}
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
  group: {
    gap: Spacing.form.bodyGap.form,
  },
  stack: {
    gap: 8,
  },
  checkRow: {
    minHeight: Size.optionTile,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.input,
    borderWidth: Size.inputBorderWidth,
    borderColor: Palette.form.inputBorder,
    backgroundColor: Palette.surface.card,
  },
  disabled: {
    opacity: Opacity.disabled,
  },
  relativesHint: {
    gap: 4,
  },
  link: {
    alignSelf: "flex-start",
    marginLeft: 25,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeInput: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },
  stepButton: {
    width: Size.input,
    height: Size.input,
    borderRadius: Radius.input,
    borderWidth: Size.inputBorderWidth,
    borderColor: Palette.form.inputBorder,
    backgroundColor: Palette.surface.card,
    alignItems: "center",
    justifyContent: "center",
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
  successBody: {
    maxWidth: 320,
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 25,
    textAlign: "center",
  },
  successButtons: {
    alignSelf: "stretch",
    gap: 10,
    marginTop: 8,
  },
});
