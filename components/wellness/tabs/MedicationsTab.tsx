import React, { memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { ColorPalette } from '@/apps';
import { useStyles } from '@/hooks';
import { useTheme } from '@/contexts/ThemeContext';
import type { Medication } from '@/types/wellness';
import { generateId } from '@/utils/id';
import { Button, Text } from '@/components/ui';
import MedicationCard from '../cards/MedicationCard';
import MedicationForm from '../forms/MedicationForm';
import MedicalItemModal from '../modals/MedicalItemModal';

interface MedicationsTabProps {
  items: Medication[];
  onAdd: (item: Medication) => void;
  onUpdate: (id: string, item: Medication) => void;
  onDelete: (id: string) => void;
}

type EditMode = { isOpen: boolean; item: Medication | null };

const MedicationsTab = memo<MedicationsTabProps>(({ items, onAdd, onUpdate, onDelete }) => {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  const [editMode, setEditMode] = useState<EditMode>({ isOpen: false, item: null });
  const [draft, setDraft] = useState<Partial<Medication>>({});

  const openAdd = () => {
    setDraft({});
    setEditMode({ isOpen: true, item: null });
  };

  const openEdit = (item: Medication) => {
    setDraft(item);
    setEditMode({ isOpen: true, item });
  };

  const handleClose = () => {
    setEditMode({ isOpen: false, item: null });
    setDraft({});
  };

  const handleSave = () => {
    if (editMode.item) {
      onUpdate(editMode.item.id, { ...editMode.item, ...draft } as Medication);
    } else {
      onAdd({ ...draft, id: generateId() } as Medication);
    }
    handleClose();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="label1" weight="semiBold">
          Medications
        </Text>
        <Button
          text="+ Add Medication"
          onPress={openAdd}
          variant="secondary"
          buttonStyle={styles.addBtn}
          textStyle={{ fontSize: 13 }}
        />
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="label2" weight="regular" color={colors.textSecondary}>
            No medications recorded.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <MedicationCard
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
        title={editMode.item ? 'Edit Medication' : 'Add Medication'}
        onClose={handleClose}
        onSave={handleSave}
      >
        <MedicationForm draft={draft} onChange={setDraft} />
      </MedicalItemModal>
    </View>
  );
});

MedicationsTab.displayName = 'MedicationsTab';
export default MedicationsTab;

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
