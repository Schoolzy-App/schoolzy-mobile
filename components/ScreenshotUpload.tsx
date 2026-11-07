import * as ImagePicker from "expo-image-picker";
import React, { useCallback } from "react";
import type { ImageStyle } from "react-native";
import { Alert, Image, Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/ui";
import { Icons } from "@/constants";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";

export interface PickedImage {
  uri: string;
  fileName?: string;
  width?: number;
  height?: number;
  /** Bytes, when the picker reports it — used for upload size limits. */
  size?: number;
  /** e.g. "image/jpeg". Needed for the multipart file part. */
  mimeType?: string;
}

type ScreenshotUploadProps = {
  /** The currently-picked image. Pass `null` / `undefined` when none. */
  image?: PickedImage | null;
  /** Called with the picked image (or null when removed). */
  onChange?: (image: PickedImage | null) => void;
  title?: string;
  subtitle?: string;
  /** Override the icon/border accent color. Defaults to theme secondary. */
  accentColor?: string;
};

export default function ScreenshotUpload({
  image,
  onChange,
  title = "Add Deposit Screenshot",
  subtitle = "Supported files: JPEG, PNG",
  accentColor,
}: ScreenshotUploadProps) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const accent = accentColor ?? colors.secondary;

  const handlePick = useCallback(async () => {
    // Ask permission once (no-op on subsequent calls)
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow photo library access to upload a screenshot.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false, // single image only
      allowsEditing: false,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    onChange?.({
      uri: asset.uri,
      fileName: asset.fileName ?? undefined,
      width: asset.width,
      height: asset.height,
      size: asset.fileSize,
      mimeType: asset.mimeType,
    });
  }, [onChange]);

  // ── With image: show preview + remove ─────────────────────────────────
  if (image) {
    return (
      <Pressable
        style={[
          styles.box,
          { borderColor: accent, backgroundColor: colors.surface },
        ]}
        onPress={handlePick}
      >
        <Image
          source={{ uri: image.uri }}
          style={styles.preview as ImageStyle}
        />
        <View style={styles.previewMeta}>
          <Text variant="label3" weight="semiBold" numberOfLines={1}>
            {image.fileName ?? "Selected image"}
          </Text>
          <Text variant="caption1" weight="regular" color={colors.textSecondary}>
            Tap to replace · or
          </Text>
        </View>
        <Pressable
          hitSlop={8}
          onPress={() => onChange?.(null)}
          style={[styles.removeBtn, { backgroundColor: colors.danger + "15" }]}
        >
          <Text variant="caption1" weight="bold" color={colors.danger}>
            ✕
          </Text>
        </Pressable>
      </Pressable>
    );
  }

  // ── Empty state: dashed box with icon ─────────────────────────────────
  return (
    <Pressable
      style={[
        styles.box,
        styles.emptyBox,
        { borderColor: accent, backgroundColor: colors.surface },
      ]}
      onPress={handlePick}
    >
      <View style={[styles.iconBg, { backgroundColor: accent + "1A" }]}>
        <Icons.UploadPhotoIcon width={40} height={40} color={accent} />
      </View>
      <Text variant="label2" weight="semiBold">
        {title}
      </Text>
      <Text variant="caption1" weight="regular" color={colors.textSecondary}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

const createStyles = () =>
  StyleSheet.create({
    box: {
      width: "100%",
      borderRadius: 16,
      borderWidth: 1.5,
      borderStyle: "dashed",
      paddingVertical: 20,
      paddingHorizontal: 16,
      gap: 6,
    },
    emptyBox: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 24,
    },
    iconBg: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    preview: {
      width: "100%",
      height: 160,
      borderRadius: 12,
    },
    previewMeta: {
      gap: 2,
    },
    removeBtn: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
  });
