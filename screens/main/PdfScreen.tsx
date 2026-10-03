import React, { useCallback, useMemo, useState } from "react";
import type { ImageStyle } from "react-native";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";
import Pdf from "react-native-pdf";

import type { ColorPalette } from "@/apps";
import { ScreenTemplate, Text } from "@/components/ui";
import { useStyles } from "@/hooks";
import { api } from "@/services/api/client";
import { createLogger } from "@/utils/logger";
import { useTheme } from "@/contexts/ThemeContext";
import type { RootStackScreenProps } from "@/navigation/types";
import { ApiError } from "@/types/api";

// Fallback used when no `uri` is passed (e.g. screens not yet wired to the API).
// Metro resolves this through `assetExts: ["pdf"]` in metro.config.js.
const SAMPLE_PDF = require("@/assets/sample-document.pdf");

const log = createLogger("pdf");

type Mode = "pdf" | "image";

/**
 * Best guess from the URL. Health-profile attachments are served from
 * `/attachments/{id}/file` with no extension, so this often can't tell —
 * which is why the viewer also falls back when a renderer fails.
 */
function guessMode(uri?: string): Mode {
  if (!uri) return "pdf";
  const path = uri.split("?")[0].toLowerCase();
  return /\.(png|jpe?g|gif|webp|heic|bmp)$/.test(path) ? "image" : "pdf";
}

/**
 * Neither renderer reports a plain Error: react-native-pdf passes its own
 * object and <Image> passes a native event, so `String(error)` yields
 * "[object Object]" and tells us nothing.
 */
function describeError(error: unknown): string {
  if (!error) return "unknown error";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;

  const source = error as Record<string, unknown>;
  const nativeEvent = source.nativeEvent as Record<string, unknown> | undefined;
  const candidate =
    source.message ?? source.description ?? nativeEvent?.error ?? nativeEvent?.message;

  if (typeof candidate === "string" && candidate) return candidate;

  try {
    return JSON.stringify(nativeEvent ?? source);
  } catch {
    return "unserializable error";
  }
}

type Props = RootStackScreenProps<"Pdf">;

export default function PdfScreen({ route }: Props) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const { title, uri, headers, kind } = route.params;

  const [mode, setMode] = useState<Mode>(kind ?? guessMode(uri));
  /** Set once both renderers have failed, so we stop ping-ponging. */
  const [failed, setFailed] = useState(false);
  /** Underlying renderer error — surfaced in dev so failures are diagnosable. */
  const [reason, setReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!uri);

  // A new source object on every render would restart the download.
  const source = useMemo(
    () => (uri ? { uri, headers, cache: true } : SAMPLE_PDF),
    [uri, headers],
  );

  /**
   * The server doesn't tell us the type up front, so a failure is most likely
   * the wrong renderer rather than a broken file — try the other one once.
   */
  const handleError = useCallback(
    async (error: unknown) => {
      const message = describeError(error);
      log.warn(`render failed (${mode}) for ${uri ?? "bundled sample"}`, {
        message,
      });
      setReason(message);
      setLoading(false);

      // `mode` is this render's value, so it says which renderer just failed.
      // Deriving it here rather than from inside a setState updater matters:
      // React doesn't run updaters synchronously, so a flag set in one is
      // still false by the time the code below reads it.
      const exhausted = mode === "image";
      if (exhausted) setFailed(true);
      else setMode("image");

      /**
       * react-native-pdf downloads the file itself and never checks the HTTP
       * status — a 401 or 404 body gets saved and then fails to parse, which
       * surfaces only as "Failed to load <url>". Re-fetch through the API
       * client once both renderers are out of options, so the real reason
       * reaches the screen instead of a generic message.
       */
      if (exhausted && uri) {
        try {
          const probe = await api.get(uri, { responseType: "text" });
          setReason(
            `Server returned ${probe.status} ${probe.headers?.["content-type"] ?? ""}`.trim(),
          );
        } catch (probeError) {
          const status =
            probeError instanceof ApiError ? probeError.status : undefined;
          setReason(
            status
              ? `Server returned ${status}: ${(probeError as ApiError).message}`
              : message,
          );
        }
      }
    },
    [mode, uri],
  );

  const stopLoading = useCallback(() => setLoading(false), []);

  return (
    <ScreenTemplate title={title}>
      <View style={styles.viewer}>
        {failed ? (
          <View style={styles.center}>
            <Text
              variant="label3"
              weight="regular"
              color={colors.textSecondary}
              style={styles.message}
            >
              This file can&apos;t be previewed here.
            </Text>
            {__DEV__ && reason ? (
              <Text
                variant="caption1"
                weight="regular"
                color={colors.textSecondary}
                style={styles.message}
              >
                {reason}
              </Text>
            ) : null}
          </View>
        ) : mode === "image" && uri ? (
          <Image
            source={{ uri, headers }}
            style={styles.image as ImageStyle}
            resizeMode="contain"
            onLoadEnd={stopLoading}
            onError={handleError}
          />
        ) : (
          <Pdf
            source={source}
            style={styles.pdf}
            trustAllCerts={false}
            onLoadComplete={stopLoading}
            onError={handleError}
          />
        )}

        {loading && !failed ? (
          <View style={styles.center} pointerEvents="none">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null}
      </View>
    </ScreenTemplate>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    viewer: {
      flex: 1,
      width: "100%",
      backgroundColor: colors.background,
    },
    pdf: {
      flex: 1,
      width: "100%",
    },
    image: {
      flex: 1,
      width: "100%",
    },
    center: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
    },
    message: {
      textAlign: "center",
      paddingHorizontal: 32,
    },
  });
