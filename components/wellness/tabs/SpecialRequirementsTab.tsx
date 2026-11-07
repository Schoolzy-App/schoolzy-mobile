import React, { memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { ColorPalette } from '@/apps';
import { useStyles } from '@/hooks';
import { useTheme } from '@/contexts/ThemeContext';
import type { DietaryRequirement, SpecialRequirements } from '@/types/wellness';
import { Button, DefaultInput, Text } from '@/components/ui';
import CheckboxRow from '../CheckboxRow';

interface SpecialRequirementsTabProps {
  data: SpecialRequirements;
  onSave: (updated: SpecialRequirements) => void;
}

const DIETARY_OPTIONS: { label: string; value: DietaryRequirement }[] = [
  { label: 'Vegetarian', value: 'vegetarian' },
  { label: 'Vegan', value: 'vegan' },
  { label: 'Lactose Intolerant', value: 'lactose_intolerant' },
  { label: 'Gluten Intolerant', value: 'gluten_intolerant' },
];

const SpecialRequirementsTab = memo<SpecialRequirementsTabProps>(({ data, onSave }) => {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  const [form, setForm] = useState<SpecialRequirements>(data);

  const set = <K extends keyof SpecialRequirements>(key: K, value: SpecialRequirements[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleDiet = (value: DietaryRequirement) => {
    setForm((prev) => {
      const exists = prev.dietaryRequirements.includes(value);
      return {
        ...prev,
        dietaryRequirements: exists
          ? prev.dietaryRequirements.filter((d) => d !== value)
          : [...prev.dietaryRequirements, value],
      };
    });
  };

  return (
    <View style={styles.container}>
      <Text variant="label1" weight="semiBold">
        Special Medical Requirements
      </Text>

      <View style={styles.section}>
        <DefaultInput
          label="Assistive Devices"
          value={form.assistiveDevices}
          onChange={(v) => set('assistiveDevices', v)}
          type="text"
          placeholder="e.g. Wheelchair, Hearing aid..."
          multiline
          numberOfLines={3}
          style={styles.multiline}
        />

        <DefaultInput
          label="Assistive Devices Notes"
          value={form.assistiveDevicesNotes}
          onChange={(v) => set('assistiveDevicesNotes', v)}
          type="text"
          placeholder="Additional notes..."
          multiline
          numberOfLines={3}
          style={styles.multiline}
        />

        <DefaultInput
          label="Physical Limitations"
          value={form.physicalLimitations}
          onChange={(v) => set('physicalLimitations', v)}
          type="text"
          placeholder="Describe physical limitations..."
          multiline
          numberOfLines={3}
          style={styles.multiline}
        />

        <DefaultInput
          label="Physical Limitations Notes"
          value={form.physicalLimitationsNotes}
          onChange={(v) => set('physicalLimitationsNotes', v)}
          type="text"
          placeholder="Additional notes..."
          multiline
          numberOfLines={3}
          style={styles.multiline}
        />

        <DefaultInput
          label="Learning Needs"
          value={form.learningNeeds}
          onChange={(v) => set('learningNeeds', v)}
          type="text"
          placeholder="Special learning requirements..."
          multiline
          numberOfLines={3}
          style={styles.multiline}
        />

        <DefaultInput
          label="Accommodations"
          value={form.accommodations}
          onChange={(v) => set('accommodations', v)}
          type="text"
          placeholder="Required accommodations at school..."
          multiline
          numberOfLines={3}
          style={styles.multiline}
        />
      </View>

      <View style={styles.dietSection}>
        <Text variant="label2" weight="semiBold">
          Dietary Requirements
        </Text>
        <View style={styles.dietGrid}>
          {DIETARY_OPTIONS.map((opt) => (
            <View key={opt.value} style={styles.dietItem}>
              <CheckboxRow
                label={opt.label}
                value={form.dietaryRequirements.includes(opt.value)}
                onChange={() => toggleDiet(opt.value)}
              />
            </View>
          ))}
        </View>

        <DefaultInput
          label="Religious Diet"
          value={form.religiousDiet}
          onChange={(v) => set('religiousDiet', v)}
          type="text"
          placeholder="e.g. Halal, Kosher..."
        />

        <DefaultInput
          label="Other Diet Instructions"
          value={form.otherDietInstructions}
          onChange={(v) => set('otherDietInstructions', v)}
          type="text"
          placeholder="Any other dietary requirements..."
          multiline
          numberOfLines={3}
          style={styles.multiline}
        />
      </View>

      <Button text="Save Requirements" onPress={() => onSave(form)} />
    </View>
  );
});

SpecialRequirementsTab.displayName = 'SpecialRequirementsTab';
export default SpecialRequirementsTab;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      width: '100%',
      padding: 16,
      gap: 20,
      paddingBottom: 32,
    },
    section: {
      gap: 16,
    },
    multiline: {
      minHeight: 80,
      textAlignVertical: 'top',
      paddingTop: 14,
    },
    dietSection: {
      gap: 16,
    },
    dietGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    dietItem: {
      width: '48%',
    },
  });
