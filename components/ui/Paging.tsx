import React, { FC } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';

type PagingProps = {
  numOfPages: number;
  page: number;
  onSelect(page: number): void;
};

const Paging: FC<PagingProps> = ({ numOfPages, page, onSelect }) => {
  return numOfPages > 1 ? (
    <View style={styles.container}>
      {Array.from({ length: numOfPages }, (_, i) => i + 1).map(n => {
        return (
          <Pressable onPress={() => onSelect(n)} key={n}>
            <Text style={[page === n && styles.selected]}>{n}</Text>
          </Pressable>
        );
      })}
    </View>
  ) : null;
};

export default Paging;

const styles = StyleSheet.create({
  container: {
    paddingTop: 15,
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  selected: { color: '#0000ff' },
});
