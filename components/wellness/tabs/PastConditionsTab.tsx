import React, { memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { ColorPalette } from '@/apps';
import { useStyles } from '@/hooks';
import { useTheme } from '@/contexts/ThemeContext';
import type { PastCondition } from '@/types/wellness';
import { generateId } from '@/utils/id';
import { Button, Text } from '@/components/ui';
import PastConditionCard from '../cards/PastConditionCard';
import PastConditionForm from '../forms/PastConditionForm';
import MedicalItemModal from '../modals/MedicalItemModal';

interface PastConditionsTabProps {
  items: PastCondition[];
  onAdd: (item: PastCondition) => void;
  onUpdate: (id: string, item: PastCondition) => void;
  onDelete: (id: string) => void;
}

type EditMode = { isOpen: boolean; item: PastCondition | null };

const PastConditionsTab = memo<PastConditionsTabProps>(({ items, onAdd, onUpdate, onDelete }) => {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  const [editMode, setEditMode] = useState<EditMode>({ isOpen: false, item: null });
  const [draft, setDraft] = useState<Partial<PastCondition>>({});

  const openAdd = () => {
    setDraft({});
    setEditMode({ isOpen: true, item: null });
  };

  const openEdit = (item: PastCondition) => {
    setDraft(item);
    setEditMode({ isOpen: true, item });
  };

  const handleClose = () => {
    setEditMode({ isOpen: false, item: null });
    setDraft({});
  };

  const handleSave = () => {
    if (editMode.item) {
      onUpdate(editMode.item.id, { ...editMode.item, ...draft } as PastCondition);
    } else {
      onAdd({ ...draft, id: generateId() } as PastCondition);
    }
    handleClose();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="label1" weight="semiBold">
          Past Medical Conditions
        </Text>
        <Button
          text="+ Add Condition"
          onPress={openAdd}
          variant="secondary"
          buttonStyle={styles.addBtn}
          textStyle={{ fontSize: 13 }}
        />
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="label2" weight="regular" color={colors.textSecondary}>
            No past conditions recorded.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <PastConditionCard
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
        title={editMode.item ? 'Edit Past Condition' : 'Add Past Condition'}
        onClose={handleClose}
        onSave={handleSave}
      >
        <PastConditionForm draft={draft} onChange={setDraft} />
      </MedicalItemModal>
    </View>
  );
});

PastConditionsTab.displayName = 'PastConditionsTab';
export default PastConditionsTab;

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
