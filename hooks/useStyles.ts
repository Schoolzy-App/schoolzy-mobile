import { useMemo } from 'react';
import { ImageStyle, StyleSheet, TextStyle, ViewStyle } from 'react-native';

import { ColorPalette } from '@/apps';
import { useTheme } from '@/contexts/ThemeContext';

type NamedStyles<T> = {
  [P in keyof T]: ViewStyle | TextStyle | ImageStyle;
};

/**
 * Create theme-aware StyleSheet styles.
 *
 * @example
 * const styles = useStyles((colors) => ({
 *   container: { backgroundColor: colors.background },
 *   title: { color: colors.textPrimary },
 * }));
 */
export function useStyles<T extends NamedStyles<T>>(
  factory: (colors: ColorPalette) => T,
): StyleSheet.NamedStyles<T> {
  const { colors } = useTheme();
  return useMemo(() => StyleSheet.create(factory(colors)), [colors, factory]);
}
