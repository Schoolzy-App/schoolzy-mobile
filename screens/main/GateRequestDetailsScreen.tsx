import {
  CheckCircleIcon,
  HourglassMediumIcon,
  type Icon,
  ProhibitIcon,
  XCircleIcon,
} from "phosphor-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { ErrorBanner, InfoHint } from "@/components/form/FormParts";
import { Toast, type ToastMessage } from "@/components/form/Toast";
import FormButton from "@/components/FormButton";
import GateStatusChip from "@/components/gateRequests/GateStatusChip";
import { QueryState, ScreenTemplate, Text } from "@/components/ui";
import { Palette, Radius, Spacing, Type } from "@/constants/tokens";
import { useCancelGateRequest, useGateRequest } from "@/hooks";
import type { RootStackScreenProps } from "@/navigation/types";
import type { GateRequestDetail } from "@/services/mappers";
import { ApiError } from "@/types/api";
import { formatDateTime } from "@/utils/format";

type Props = RootStackScreenProps<"GateRequestDetails">;

/** Fixed copy (spec §6.5.3). */
const PENDING_COPY =
  "Waiting for school confirmation. The school may call you if there's an issue.";
const CONFIRMED_NOTE = "To cancel, please contact the school.";
const EXPIRED_COPY = "This request wasn't confirmed on its day.";
const CANCELLED_BY_SCHOOL_COPY =
  "The school cancelled this request. Please contact the school if needed.";

const dateTime = (value: Date | null) => (value ? formatDateTime(value.toISOString()) : "");

/** One gate request (spec §6.5.3). */
export default function GateRequestDetailsScreen({ route }: Props) {
  const { requestId } = route.params;
  const { data, isLoading, error, refetch } = useGateRequest(requestId);

  const [toast, setToast] = useState<ToastMessage | null>(null);
  const hideToast = useCallback(() => setToast(null), []);

  // On success the hook seeds the detail cache from the response, so the
  // screen re-renders as Cancelled in place.
  const cancel = useCancelGateRequest(requestId, () =>
    setToast({ text: "Request cancelled." }),
  );

  // A 409 (already confirmed, expired, cancelled, just updated) means what we
  // show is stale: refresh it under the server's message.
  const { error: cancelError, isProcessing } = cancel;
  useEffect(() => {
    if (cancelError instanceof ApiError && cancelError.status === 409 && !isProcessing) {
      void refetch();
    }
  }, [cancelError, isProcessing, refetch]);

  const { submit, retry, canRetry } = cancel;
  // One dialog at a time: a quick double tap must not stack two confirms.
  const dialogOpen = useRef(false);
  const confirmCancel = useCallback(() => {
    if (dialogOpen.current) return;
    dialogOpen.current = true;
    const close = () => {
      dialogOpen.current = false;
    };
    Alert.alert(
      "Cancel this request?",
      "The school will no longer act on it.",
      [
        { text: "Keep request", style: "cancel", onPress: close },
        {
          text: "Cancel request",
          style: "destructive",
          onPress: () => {
            close();
            if (canRetry) retry();
            else submit();
          },
        },
      ],
      { cancelable: true, onDismiss: close },
    );
  }, [canRetry, retry, submit]);

  const cancelMessage =
    cancelError instanceof ApiError
      ? cancelError.message
      : cancelError
        ? "Could not cancel the request. Please try again."
        : null;

  const showCancel = !!data && data.status === "pending" && data.canCancel;

  return (
    <View style={styles.flex}>
      <ScreenTemplate
        variant="form"
        title="Gate Request"
        headerStyle={styles.header}
        bottomContent={
          showCancel ? (
            <FormButton
              label={cancel.isPending ? "Cancelling…" : "Cancel request"}
              variant="outline"
              color={Palette.status.danger.solid}
              loading={cancel.isPending}
              onPress={confirmCancel}
            />
          ) : undefined
        }
      >
        <View style={styles.body}>
          {/* A failed background refetch (refocus, push invalidation) keeps
              the cached request; only a failure with nothing loaded blocks. */}
          <QueryState isLoading={isLoading} error={data ? null : error} onRetry={refetch}>
            {data ? (
              <>
                {error ? (
                  <InfoHint text="Couldn't refresh. Showing the last loaded details." />
                ) : null}

                <StatusBanner item={data} />

                {isProcessing ? (
                  <InfoHint text="Your cancellation is still being processed. Trying again reuses the same request." />
                ) : null}

                {cancelMessage && !isProcessing ? (
                  <ErrorBanner
                    title="Couldn't cancel the request"
                    message={
                      canRetry
                        ? `${cancelMessage} It may still have gone through, so trying again resends the same cancellation.`
                        : cancelMessage
                    }
                  />
                ) : null}

                <DetailCard item={data} />
              </>
            ) : null}
          </QueryState>
        </View>
      </ScreenTemplate>
      <Toast message={toast} onHide={hideToast} />
    </View>
  );
}

// ─── Pieces ──────────────────────────────────────────────────────────────────

function StatusBanner({ item }: { item: GateRequestDetail }) {
  switch (item.status) {
    case "pending":
      return (
        <Banner
          Icon={HourglassMediumIcon}
          color={Palette.feedback.waiting}
          tint={Palette.feedback.waitingTint}
          text={PENDING_COPY}
        />
      );
    case "confirmed":
      return (
        <Banner
          Icon={CheckCircleIcon}
          color={Palette.status.success.fg}
          tint={Palette.status.success.tint}
          title={item.confirmedAt ? `Confirmed ${dateTime(item.confirmedAt)}` : "Confirmed"}
          text={CONFIRMED_NOTE}
        />
      );
    case "expired":
      return (
        <Banner
          Icon={ProhibitIcon}
          color={Palette.status.neutral.fg}
          tint={Palette.status.neutral.tint}
          text={EXPIRED_COPY}
        />
      );
    case "cancelledBySchool":
      return (
        <Banner
          Icon={XCircleIcon}
          color={Palette.status.neutral.fg}
          tint={Palette.status.neutral.tint}
          text={CANCELLED_BY_SCHOOL_COPY}
          meta={item.cancelledAt ? `Cancelled ${dateTime(item.cancelledAt)}` : undefined}
        />
      );
    case "cancelledByParent":
      return (
        <Banner
          Icon={XCircleIcon}
          color={Palette.status.neutral.fg}
          tint={Palette.status.neutral.tint}
          text="You cancelled this request."
          meta={item.cancelledAt ? `Cancelled ${dateTime(item.cancelledAt)}` : undefined}
        />
      );
  }
}

function Banner({
  Icon,
  color,
  tint,
  title,
  text,
  meta,
}: {
  Icon: Icon;
  color: string;
  tint: string;
  title?: string;
  text: string;
  meta?: string;
}) {
  return (
    <View style={[styles.card, styles.banner]}>
      <View style={[styles.bannerIcon, { backgroundColor: tint }]}>
        <Icon weight="fill" size={22} color={color} />
      </View>
      <View style={[styles.flex, styles.bannerText]}>
        {title ? <Text style={Type.cardHeading}>{title}</Text> : null}
        <Text style={styles.bodyText}>{text}</Text>
        {meta ? (
          <Text style={Type.meta} color={Palette.text.secondary}>
            {meta}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function DetailCard({ item }: { item: GateRequestDetail }) {
  const rows: { label: string; value: string | null }[] = [
    { label: "Reason", value: item.typeName },
    { label: "Who will collect", value: item.collectPersonName },
    { label: "Pickup time", value: item.time },
    { label: "Submitted", value: dateTime(item.createdAt) },
    { label: "Requested by", value: item.requestedByName },
  ];
  const shown = rows.filter((row) => row.value);

  return (
    <View style={[styles.card, styles.details]}>
      <View style={styles.summary}>
        <Text style={[Type.detailTitleComplaint, styles.flex]} numberOfLines={2}>
          {item.studentName}
        </Text>
        <GateStatusChip status={item.status} large />
      </View>

      {shown.map((row, index) => (
        <View
          key={row.label}
          style={[styles.kv, (index < shown.length - 1 || !!item.notes) && styles.kvDivided]}
        >
          <Text style={Type.rowLabel} color={Palette.text.secondary}>
            {row.label}
          </Text>
          <Text style={[styles.value, styles.valueText]} numberOfLines={2}>
            {row.value}
          </Text>
        </View>
      ))}

      {item.notes ? (
        <>
          <Text style={styles.notesLabel} color={Palette.text.secondary}>
            Notes
          </Text>
          <Text style={styles.notes}>{item.notes}</Text>
        </>
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
    paddingBottom: 32,
    gap: Spacing.form.bodyGap.detail,
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
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingBottom: 8,
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
  notesLabel: {
    fontSize: 14,
    lineHeight: 17,
    marginTop: 12,
    marginBottom: 6,
  },
  notes: {
    fontSize: 16,
    lineHeight: 25,
  },
});
