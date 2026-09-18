import React, { memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { ColorPalette } from '@/apps';
import { useStyles } from '@/hooks';
import { useTheme } from '@/contexts/ThemeContext';
import type { Vaccination } from '@/types/wellness';
import { generateId } from '@/utils/id';
import { Button, Text } from '@/components/ui';
import VaccinationCard from '../cards/VaccinationCard';
import VaccinationForm from '../forms/VaccinationForm';
import MedicalItemModal from '../modals/MedicalItemModal';

interface VaccinationsTabProps {
  items: Vaccination[];
  onAdd: (item: Vaccination) => void;
  onUpdate: (id: string, item: Vaccination) => void;
  onDelete: (id: string) => void;
}

type EditMode = { isOpen: boolean; item: Vaccination | null };

const VaccinationsTab = memo<VaccinationsTabProps>(({ items, onAdd, onUpdate, onDelete }) => {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  const [editMode, setEditMode] = useState<EditMode>({ isOpen: false, item: null });
  const [draft, setDraft] = useState<Partial<Vaccination>>({});

  const openAdd = () => {
    setDraft({});
    setEditMode({ isOpen: true, item: null });
  };

  const openEdit = (item: Vaccination) => {
    setDraft(item);
    setEditMode({ isOpen: true, item });
  };

  const handleClose = () => {
    setEditMode({ isOpen: false, item: null });
    setDraft({});
  };

  const handleSave = () => {
    if (editMode.item) {
      onUpdate(editMode.item.id, { ...editMode.item, ...draft } as Vaccination);
    } else {
      onAdd({ ...draft, id: generateId() } as Vaccination);
    }
    handleClose();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="label1" weight="semiBold">
          Vaccination Records
        </Text>
        <Button
          text="+ Add Vaccination"
          onPress={openAdd}
          variant="secondary"
          buttonStyle={styles.addBtn}
          textStyle={{ fontSize: 13 }}
        />
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="label2" weight="regular" color={colors.textSecondary}>
            No vaccinations recorded.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <VaccinationCard
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
        title={editMode.item ? 'Edit Vaccination' : 'Add Vaccination'}
        onClose={handleClose}
        onSave={handleSave}
      >
        <VaccinationForm draft={draft} onChange={setDraft} />
      </MedicalItemModal>
    </View>
  );
});

VaccinationsTab.displayName = 'VaccinationsTab';
export default VaccinationsTab;

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
