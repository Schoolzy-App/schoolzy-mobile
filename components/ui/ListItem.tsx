import React, { FC } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { Colors, Images } from '@/constants';

import Card from './Card';
import Image from './Image';
import Text from './Text';

type ListItemProps = {
  onPress?(): void;
  style?: StyleProp<ViewStyle>;
  title: string;
  subtitle?: string;
  icon: string;
  isSelected?: boolean;
};

const ListItem: FC<ListItemProps> = ({
  onPress,
  title,
  subtitle,
  icon,
  isSelected,
}: ListItemProps) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={isSelected}
      style={[styles.itemContainer, isSelected && styles.selected]}
    >
      <Text variant="h2">{icon}</Text>
      {/* <Image source={icon} /> */}
      <View style={styles.textContainer}>
        <Text>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <Image source={Images.arrowRight_blue} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 12,
    padding: 12,
  },
  selected: { backgroundColor: Colors.disabled },
  textContainer: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', lineHeight: 24 },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
});

export default ListItem;
