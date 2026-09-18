import { MaterialIcons } from '@expo/vector-icons';
import React, { memo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { ColorPalette } from '@/apps';
import { useStyles } from '@/hooks';
import { useTheme } from '@/contexts/ThemeContext';
import type { AttachmentsState } from '@/types/wellness';
import { Button, DefaultInput, Text } from '@/components/ui';
import CheckboxRow from '../CheckboxRow';

interface AttachmentsTabProps {
  data: AttachmentsState;
  onSave: (updated: AttachmentsState) => void;
}

const AttachmentsTab = memo<AttachmentsTabProps>(({ data, onSave }) => {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  const [form, setForm] = useState<AttachmentsState>(data);

  const set = <K extends keyof AttachmentsState>(key: K, value: AttachmentsState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

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
              <View key={doc.id} style={[styles.docRow, { borderColor: colors.border }]}>
                <MaterialIcons name="insert-drive-file" size={20} color={colors.secondary} />
                <View style={styles.docInfo}>
                  <Text variant="label3" weight="semiBold" numberOfLines={1}>
                    {doc.name}
                  </Text>
                  <Text variant="caption1" weight="regular" color={colors.textSecondary}>
                    {doc.size}
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
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text variant="label2" weight="semiBold">
          Upload New Documents
        </Text>

        <Pressable
          style={[styles.uploadArea, { borderColor: colors.border, backgroundColor: colors.surface }]}
        >
          <MaterialIcons name="upload-file" size={24} color={colors.textSecondary} />
          <Text variant="label3" weight="regular" color={colors.textSecondary}>
            Choose Files
          </Text>
        </Pressable>

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

      <Button text="Save" onPress={() => onSave(form)} />
    </View>
  );
});

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
  });
