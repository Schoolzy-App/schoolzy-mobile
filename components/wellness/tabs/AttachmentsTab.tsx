import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { memo, useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import type { ColorPalette } from '@/apps';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useStyles, useUploadHealthAttachments } from '@/hooks';
import { useTheme } from '@/contexts/ThemeContext';
import type { RootStackParamList } from '@/navigation/types';
import { healthProfileApi } from '@/services/api';
import { ApiError } from '@/types/api';
import type { UploadFile } from '@/services/api/multipart';
import type { AttachmentsState } from '@/types/wellness';
import { DefaultInput, Text } from '@/components/ui';
import CheckboxRow from '../CheckboxRow';

interface AttachmentsTabProps {
  data: AttachmentsState;
  studentSeasonId?: number;
  onSave: (updated: AttachmentsState) => void;
}

const AttachmentsTab = memo<AttachmentsTabProps>(
  ({ data, studentSeasonId, onSave }) => {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  const [form, setForm] = useState<AttachmentsState>(data);
  /** Names of files uploaded in this session, for immediate feedback. */
  const [justUploaded, setJustUploaded] = useState<string[]>([]);

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { mutateAsync: upload, isPending: isUploading } =
    useUploadHealthAttachments();

  /**
   * Opens a saved attachment in the document viewer.
   *
   * The file endpoint returns raw bytes and is authenticated, so it is handed
   * to the viewer as a URL plus an Authorization header rather than fetched
   * into JS memory — the same approach as newsletters and request files.
   */
  const handleOpenDocument = useCallback(
    async (documentId: string, name: string) => {
      if (typeof studentSeasonId !== 'number') return;

      const attachmentId = Number(documentId);
      if (!Number.isFinite(attachmentId)) return;

      const headers = await healthProfileApi.getAttachmentHeaders();
      navigation.navigate('Pdf', {
        title: name,
        uri: healthProfileApi.getAttachmentUrl(studentSeasonId, attachmentId),
        headers,
        // The file URL has no extension, so the viewer can't guess — the stored
        // file name can. Attachments uploaded from here are photos.
        kind: /\.pdf$/i.test(name) ? 'pdf' : 'image',
      });
    },
    [studentSeasonId, navigation],
  );

  /**
   * Lifts every edit immediately. This tab used to stage changes behind its own
   * "Save" button, which sat directly above the screen's real Save and did
   * something different — the in-tab one only updated the draft, the bottom one
   * persisted it.
   */
  const set = <K extends keyof AttachmentsState>(
    key: K,
    value: AttachmentsState[K],
  ) => {
    const next = { ...form, [key]: value };
    setForm(next);
    onSave(next);
  };

  /**
   * Attachments do NOT go through the screen's Save: that sends the health
   * profile JSON, which has no file field. They have their own multipart
   * endpoint, so they upload as soon as they are chosen.
   *
   * ⚠️ Images only. Picking PDFs needs `expo-document-picker`, which is not
   * installed — adding it is a native dependency and therefore a new build,
   * not an OTA update.
   */
  const handleChooseFiles = useCallback(async () => {
    if (typeof studentSeasonId !== 'number' || isUploading) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'Please allow photo library access to attach documents.',
      );
      return;
    }

    // `MediaTypeOptions` is deprecated in expo-image-picker 55; the current API
    // takes an array of MediaType.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;

    const files: UploadFile[] = result.assets.map((asset, index) => {
      const extension = asset.uri.split('.').pop()?.toLowerCase();
      return {
        uri: asset.uri,
        name: asset.fileName ?? `attachment-${Date.now()}-${index}.${extension ?? 'jpg'}`,
        type: asset.mimeType ?? (extension === 'png' ? 'image/png' : 'image/jpeg'),
      };
    });

    try {
      await upload({ studentSeasonId, files });
      setJustUploaded((prev) => [...prev, ...files.map((f) => f.name)]);
    } catch (e) {
      Alert.alert(
        'Upload failed',
        e instanceof ApiError
          ? e.message
          : 'Could not upload the files. Please try again.',
      );
    }
  }, [studentSeasonId, isUploading, upload]);

  return (
    <View style={styles.container}>
      <Text variant="label1" weight="semiBold">
        Attachments & Notes
      </Text>

      <View style={styles.section}>
        <Text variant="label2" weight="semiBold">
          Current Documents
        </Text>

        {form.documents.length === 0 ? (
          <Text variant="label3" weight="regular" color={colors.textSecondary}>
            No existing documents.
          </Text>
        ) : (
          <View style={styles.docList}>
            {form.documents.map((doc) => (
              <Pressable
                key={doc.id}
                style={[styles.docRow, { borderColor: colors.border }]}
                onPress={() => handleOpenDocument(doc.id, doc.name)}
              >
                <MaterialIcons name="insert-drive-file" size={20} color={colors.secondary} />
                <View style={styles.docInfo}>
                  <Text variant="label3" weight="semiBold" numberOfLines={1}>
                    {doc.name}
                  </Text>
                  <Text variant="caption1" weight="regular" color={colors.textSecondary}>
                    {doc.size ? `${doc.size} · Tap to view` : 'Tap to view'}
                  </Text>
                </View>
                <Pressable
                  hitSlop={8}
                  onPress={() =>
                    set('documents', form.documents.filter((d) => d.id !== doc.id))
                  }
                >
                  <MaterialIcons name="close" size={18} color={colors.danger} />
                </Pressable>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text variant="label2" weight="semiBold">
          Upload New Documents
        </Text>

        <Pressable
          style={[
            styles.uploadArea,
            { borderColor: colors.border, backgroundColor: colors.surface },
            isUploading && styles.uploadAreaBusy,
          ]}
          onPress={handleChooseFiles}
          disabled={isUploading || typeof studentSeasonId !== 'number'}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <MaterialIcons name="upload-file" size={24} color={colors.textSecondary} />
          )}
          <Text variant="label3" weight="regular" color={colors.textSecondary}>
            {isUploading ? 'Uploading…' : 'Choose Files'}
          </Text>
        </Pressable>

        {justUploaded.length ? (
          <View style={styles.docList}>
            {justUploaded.map((name, i) => (
              <View key={`${name}-${i}`} style={styles.uploadedRow}>
                <MaterialIcons name="check-circle" size={16} color={colors.success} />
                <Text
                  variant="caption1"
                  weight="regular"
                  color={colors.textSecondary}
                  numberOfLines={1}
                  style={styles.docInfo}
                >
                  {name}
                </Text>
              </View>
            ))}
            <Text variant="caption1" weight="regular" color={colors.textSecondary}>
              Uploaded. They will appear under Current Documents next time you
              open this screen.
            </Text>
          </View>
        ) : null}

        <CheckboxRow
          label="Replace all existing files with the new ones"
          value={form.replaceAll}
          onChange={(v) => set('replaceAll', v)}
        />
      </View>

      <DefaultInput
        label="Notes"
        value={form.notes}
        onChange={(v) => set('notes', v)}
        type="text"
        placeholder="Enter any relevant notes..."
        multiline
        numberOfLines={4}
        style={{ minHeight: 100, textAlignVertical: 'top', paddingTop: 14 }}
      />

    </View>
  );
  },
);

AttachmentsTab.displayName = 'AttachmentsTab';
export default AttachmentsTab;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      width: '100%',
      padding: 16,
      gap: 20,
      paddingBottom: 32,
    },
    section: {
      gap: 12,
    },
    docList: {
      gap: 8,
    },
    docRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      backgroundColor: colors.surface,
    },
    docInfo: {
      flex: 1,
      gap: 2,
    },
    uploadArea: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 16,
      borderRadius: 8,
      borderWidth: 1.5,
      borderStyle: 'dashed',
    },
    uploadAreaBusy: {
      opacity: 0.6,
    },
    uploadedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
  });
