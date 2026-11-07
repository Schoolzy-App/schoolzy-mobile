import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { ColorPalette } from '@/apps';
import { useStyles } from '@/hooks';
import { useTheme } from '@/contexts/ThemeContext';
import { Text } from '@/components/ui';

interface CheckboxRowProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

const CheckboxRow = memo<CheckboxRowProps>(({ label, value, onChange }) => {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  return (
    <Pressable style={styles.row} onPress={() => onChange(!value)}>
      <View
        style={[
          styles.box,
          { borderColor: value ? colors.primary : colors.border },
          value && { backgroundColor: colors.primary },
        ]}
      >
        {value ? (
          <Text variant="caption2" weight="bold" color={colors.buttonText}>
            ✓
          </Text>
        ) : null}
      </View>
      <Text variant="label2" weight="regular">
        {label}
      </Text>
    </Pressable>
  );
});

CheckboxRow.displayName = 'CheckboxRow';
export default CheckboxRow;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 4,
    },
    box: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
