import { MaterialIcons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { useStyles } from '@/hooks';
import type { Vaccination } from '@/types/wellness';
import { Card, Text } from '@/components/ui';

interface VaccinationCardProps {
  item: Vaccination;
  onEdit: () => void;
  onDelete: () => void;
}

const VaccinationCard = memo<VaccinationCardProps>(({ item, onEdit, onDelete }) => {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  return (
    <Pressable onPress={onEdit}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.iconCircle, { backgroundColor: colors.secondary + '20' }]}>
            <MaterialIcons name="vaccines" size={18} color={colors.secondary} />
          </View>

          <View style={styles.info}>
            <Text variant="label2" weight="semiBold" numberOfLines={1}>
              {item.vaccineName || 'Untitled Vaccine'}
            </Text>
            <Text variant="label3" weight="regular" color={colors.textSecondary}>
              {item.dateTaken}
            </Text>
          </View>

          {/* The whole card is already a tap target for editing, but that was
              invisible — delete was the only icon, so the card looked read-only. */}
          <Pressable
            onPress={onEdit}
            hitSlop={8}
            accessibilityLabel="Edit"
            style={[styles.iconBtn, { backgroundColor: colors.primary + '15' }]}
          >
            <MaterialIcons name="edit" size={18} color={colors.primary} />
          </Pressable>
          <Pressable
            onPress={onDelete}
            hitSlop={8}
            style={[styles.iconBtn, { backgroundColor: colors.danger + '15' }]}
          >
            <MaterialIcons name="delete-outline" size={18} color={colors.danger} />
          </Pressable>
        </View>

        {item.notes ? (
          <Text variant="label3" weight="regular" color={colors.textSecondary} numberOfLines={2}>
            {item.notes}
          </Text>
        ) : null}
      </Card>
    </Pressable>
  );
});

VaccinationCard.displayName = 'VaccinationCard';
export default VaccinationCard;

const createStyles = () =>
  StyleSheet.create({
    card: {
      gap: 6,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    info: {
      flex: 1,
      gap: 2,
    },
    iconBtn: {
      width: 30,
      height: 30,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
