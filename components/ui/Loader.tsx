import React, { memo } from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { Colors } from '@/constants';

export interface LoaderProps {
  size?: 'small' | 'large';
  color?: string;
  style?: StyleProp<ViewStyle>;
}

const Loader = memo<LoaderProps>(({ size = 'large', color = Colors.primary, style }) => {
  return (
    <View style={[styles.loaderContainer, style]}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
});

Loader.displayName = 'Loader';

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Loader;
