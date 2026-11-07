import React, { memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { ColorPalette } from '@/apps';
import { useStyles } from '@/hooks';
import { useTheme } from '@/contexts/ThemeContext';
import type { ChronicDisease } from '@/types/wellness';
import { generateId } from '@/utils/id';
import { Button, Text } from '@/components/ui';
import ChronicDiseaseCard from '../cards/ChronicDiseaseCard';
import ChronicDiseaseForm from '../forms/ChronicDiseaseForm';
import MedicalItemModal from '../modals/MedicalItemModal';

interface ChronicDiseasesTabProps {
  items: ChronicDisease[];
  onAdd: (item: ChronicDisease) => void;
  onUpdate: (id: string, item: ChronicDisease) => void;
  onDelete: (id: string) => void;
}

type EditMode = { isOpen: boolean; item: ChronicDisease | null };

const ChronicDiseasesTab = memo<ChronicDiseasesTabProps>(({ items, onAdd, onUpdate, onDelete }) => {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  const [editMode, setEditMode] = useState<EditMode>({ isOpen: false, item: null });
  const [draft, setDraft] = useState<Partial<ChronicDisease>>({});

  const openAdd = () => {
    setDraft({});
    setEditMode({ isOpen: true, item: null });
  };

  const openEdit = (item: ChronicDisease) => {
    setDraft(item);
    setEditMode({ isOpen: true, item });
  };

  const handleClose = () => {
    setEditMode({ isOpen: false, item: null });
    setDraft({});
  };

  const handleSave = () => {
    if (editMode.item) {
      onUpdate(editMode.item.id, { ...editMode.item, ...draft } as ChronicDisease);
    } else {
      onAdd({ recovered: false, ...draft, id: generateId() } as ChronicDisease);
    }
    handleClose();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="label1" weight="semiBold">
          Chronic Diseases
        </Text>
        <Button
          text="+ Add Disease"
          onPress={openAdd}
          variant="secondary"
          buttonStyle={styles.addBtn}
          textStyle={{ fontSize: 13 }}
        />
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="label2" weight="regular" color={colors.textSecondary}>
            No chronic diseases recorded.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <ChronicDiseaseCard
              key={item.id}
              item={item}
              onEdit={() => openEdit(item)}
              onDelete={() => onDelete(item.id)}
            />
          ))}
        </View>
      )}

      <MedicalItemModal
        isVisible={editMode.isOpen}
        title={editMode.item ? 'Edit Chronic Disease' : 'Add Chronic Disease'}
        onClose={handleClose}
        onSave={handleSave}
      >
        <ChronicDiseaseForm draft={draft} onChange={setDraft} />
      </MedicalItemModal>
    </View>
  );
});

ChronicDiseasesTab.displayName = 'ChronicDiseasesTab';
export default ChronicDiseasesTab;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      width: '100%',
      padding: 16,
      gap: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    addBtn: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      width: 'auto',
      borderRadius: 20,
    },
    list: {
      gap: 10,
    },
    empty: {
      paddingVertical: 32,
      alignItems: 'center',
    },
  });
