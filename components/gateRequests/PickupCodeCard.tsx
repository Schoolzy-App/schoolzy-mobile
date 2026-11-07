import {
  ArrowClockwiseIcon,
  KeyIcon,
  ShareNetworkIcon,
  TimerIcon,
} from "phosphor-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Share, StyleSheet, View } from "react-native";

import { ErrorBanner, InfoHint } from "@/components/form/FormParts";
import FormButton from "@/components/FormButton";
import { Text } from "@/components/ui";
import { Palette, Radius, Type } from "@/constants/tokens";
import { useGenerateGateOtp } from "@/hooks";
import type { GateRequestDetail } from "@/services/mappers";
import { ApiError, GateOtpErrorCode } from "@/types/api";
import { formatTime } from "@/utils/format";

/** Readable copy for the POST /otp machine codes (`errors[0]`). */
const OTP_ERROR_COPY: Record<string, string> = {
  [GateOtpErrorCode.Disabled]: "The school has turned off pickup codes.",
  [GateOtpErrorCode.NotConfirmed]: "Codes are only available once the school confirms the request.",
  [GateOtpErrorCode.NotToday]: "Codes are only available on the day of the request.",
  [GateOtpErrorCode.AlreadyCollected]: "Your child has already been collected.",
  [GateOtpErrorCode.DailyLimitReached]: "You've used all of today's codes for this request.",
};

function otpErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof ApiError) {
    const code = error.errors[0];
    return (code && OTP_ERROR_COPY[code]) || error.message;
  }
  return "Couldn't create a code. Please try again.";
}

/** Seconds left until `expiresAt`, ticking every second; 0 once expired. */
function useSecondsLeft(expiresAt: Date | null): number {
  const [now, setNow] = useState(() => Date.now());
  const expiresMs = expiresAt?.getTime() ?? null;
  useEffect(() => {
    if (expiresMs === null) return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (t >= expiresMs) clearInterval(timer);
    };
    // Sync right away for a new code (a stale `now` would overstate the time).
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [expiresMs]);
  return expiresMs === null ? 0 : Math.max(0, Math.ceil((expiresMs - now) / 1000));
}

const mmss = (total: number) =>
  `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;

interface Props {
  item: GateRequestDetail;
  /** Refetch the detail (after an expiry or a business 409). */
  onRefresh: () => void;
}

/**
 * Pickup code (OTP) on a confirmed request: generate a 15-minute code, show it
 * with a countdown, share it with the person collecting. Renders nothing when
 * the school has the option off or the request can't have a code.
 */
export default function PickupCodeCard({ item, onRefresh }: Props) {
  const generate = useGenerateGateOtp(item.id);
  const { submit, retry, canRetry, isPending, isProcessing, error } = generate;

  const secondsLeft = useSecondsLeft(item.activeOtp?.expiresAt ?? null);
  const active = item.activeOtp && secondsLeft > 0 ? item.activeOtp : null;

  // The code just ran out: refresh so tries left / canGenerateOtp are current.
  const expiredOnce = useRef<string | null>(null);
  useEffect(() => {
    const code = item.activeOtp?.code ?? null;
    if (code && secondsLeft === 0 && expiredOnce.current !== code) {
      expiredOnce.current = code;
      onRefresh();
    }
  }, [item.activeOtp?.code, secondsLeft, onRefresh]);

  // Business 409s mean the screen is stale.
  useEffect(() => {
    if (error instanceof ApiError && (error.status === 409 || error.status === 403) && !isProcessing) {
      onRefresh();
    }
  }, [error, isProcessing, onRefresh]);

  const send = useCallback(() => {
    if (canRetry) retry();
    else submit();
  }, [canRetry, retry, submit]);

  const dialogOpen = useRef(false);
  const confirmNewCode = useCallback(() => {
    if (dialogOpen.current) return;
    dialogOpen.current = true;
    const close = () => {
      dialogOpen.current = false;
    };
    Alert.alert(
      "Create a new code?",
      "The current code will stop working. Share the new one with the person collecting.",
      [
        { text: "Keep current code", style: "cancel", onPress: close },
        {
          text: "New code",
          onPress: () => {
            close();
            send();
          },
        },
      ],
      { cancelable: true, onDismiss: close },
    );
  }, [send]);

  const share = useCallback(() => {
    if (!active) return;
    const until = formatTime(active.expiresAt.toISOString());
    void Share.share({
      message: `Pickup code for ${item.studentName}: ${active.code}\nGive this code to the school at the gate. Valid until ${until}.`,
    });
  }, [active, item.studentName]);

  if (!item.pickupOtpEnabled || item.status !== "confirmed" || item.collectedAt) return null;

  const triesLeft = `${item.otpGenerationsLeft} of ${item.otpDailyLimit} codes left today`;
  const errorMessage = isProcessing ? null : otpErrorMessage(error);
  const limitReached = !active && !item.canGenerateOtp && item.otpGenerationsLeft <= 0;

  // Confirmed for an earlier day, or otherwise not eligible: nothing to offer.
  if (!active && !item.canGenerateOtp && !limitReached) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <KeyIcon weight="fill" size={20} color={Palette.action.primary} />
        </View>
        <View style={styles.flex}>
          <Text style={Type.cardHeading}>Pickup code</Text>
          <Text style={Type.meta} color={Palette.text.secondary}>
            Share it with the person collecting. The school asks for it at the gate.
          </Text>
        </View>
      </View>

      {active ? (
        <>
          <View style={styles.codeBox}>
            <Text style={styles.code} accessibilityLabel={`Code ${active.code.split("").join(" ")}`}>
              {active.code}
            </Text>
            <View style={styles.timerRow}>
              <TimerIcon size={16} color={secondsLeft <= 60 ? Palette.status.danger.fg : Palette.text.secondary} />
              <Text
                style={styles.timer}
                color={secondsLeft <= 60 ? Palette.status.danger.fg : Palette.text.secondary}
              >
                Expires in {mmss(secondsLeft)}
              </Text>
            </View>
          </View>
          <FormButton label="Share code" Icon={ShareNetworkIcon} onPress={share} height={48} />
          {item.canGenerateOtp ? (
            <FormButton
              label={isPending ? "Creating…" : "Create a new code"}
              variant="secondary"
              Icon={ArrowClockwiseIcon}
              loading={isPending}
              onPress={confirmNewCode}
              height={44}
            />
          ) : null}
        </>
      ) : limitReached ? (
        <InfoHint text="You've used all of today's codes for this request. The school can still confirm pickup without a code." />
      ) : (
        <>
          {item.activeOtp ? (
            <Text style={styles.expired} color={Palette.text.secondary}>
              The last code expired.
            </Text>
          ) : null}
          <FormButton
            label={isPending ? "Creating…" : "Generate pickup code"}
            Icon={KeyIcon}
            loading={isPending}
            onPress={send}
            height={48}
          />
          <Text style={styles.note} color={Palette.text.tertiary}>
            Each code works once, for 15 minutes.
          </Text>
        </>
      )}

      {item.canGenerateOtp || active ? (
        <Text style={styles.tries} color={Palette.text.tertiary}>
          {triesLeft}
        </Text>
      ) : null}

      {isProcessing ? (
        <InfoHint text="Your code is still being created. Trying again returns the same code." />
      ) : null}
      {errorMessage ? (
        <ErrorBanner title="Couldn't create a code" message={errorMessage} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  card: {
    backgroundColor: Palette.surface.card,
    borderRadius: Radius.card,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.action.tint8,
  },
  codeBox: {
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: Radius.card,
    backgroundColor: Palette.form.notesBox,
    gap: 6,
  },
  code: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "700",
    letterSpacing: 8,
    fontVariant: ["tabular-nums"],
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timer: {
    fontSize: 14,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },
  expired: {
    fontSize: 14,
  },
  note: {
    fontSize: 13,
    textAlign: "center",
  },
  tries: {
    fontSize: 13,
    textAlign: "center",
  },
});
