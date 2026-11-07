import { MaterialIcons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { useStyles } from '@/hooks';
import type { ChronicDisease } from '@/types/wellness';
import { CHRONIC_DISEASE_OPTIONS, SEVERITY_OPTIONS } from '@/types/wellness';
import { Card, Text } from '@/components/ui';

interface ChronicDiseaseCardProps {
  item: ChronicDisease;
  onEdit: () => void;
  onDelete: () => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  mild: '#36BD0D',
  moderate: '#E8A923',
  severe: '#CB2431',
};

const ChronicDiseaseCard = memo<ChronicDiseaseCardProps>(({ item, onEdit, onDelete }) => {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  const diseaseLabel =
    CHRONIC_DISEASE_OPTIONS.find((o) => o.value === item.disease)?.label ?? item.disease;
  const severityLabel =
    SEVERITY_OPTIONS.find((o) => o.value === item.severity)?.label ?? item.severity;
  const severityColor = SEVERITY_COLORS[item.severity] ?? colors.textSecondary;

  return (
    <Pressable onPress={onEdit}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.info}>
            <Text variant="label2" weight="semiBold" numberOfLines={1}>
              {diseaseLabel}
            </Text>
            <Text variant="label3" weight="regular" color={colors.textSecondary}>
              Since {item.sinceWhen}
            </Text>
          </View>

          <View style={styles.actions}>
            <View style={[styles.badge, { backgroundColor: severityColor + '20' }]}>
              <Text variant="caption1" weight="semiBold" color={severityColor}>
                {severityLabel}
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
        </View>

        {item.recovered ? (
          <View style={[styles.recoveredBadge, { backgroundColor: '#36BD0D20' }]}>
            <Text variant="caption1" weight="semiBold" color="#36BD0D">
              Recovered
            </Text>
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
});

ChronicDiseaseCard.displayName = 'ChronicDiseaseCard';
export default ChronicDiseaseCard;

const createStyles = () =>
  StyleSheet.create({
    card: {
      gap: 8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    info: {
      flex: 1,
      gap: 2,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 20,
    },
    iconBtn: {
      width: 30,
      height: 30,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    recoveredBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 20,
    },
  });
