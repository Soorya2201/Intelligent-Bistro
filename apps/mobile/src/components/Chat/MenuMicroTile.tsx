import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useStore } from '../../store';
import { COLORS, RADIUS } from '../../constants/theme';
import { SuggestedItem } from '../../types';

interface Props {
  item: SuggestedItem;
}

export default function MenuMicroTile({ item }: Props) {
  const addItem = useStore(s => s.addItem);

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addItem(
      { id: item.id, name: item.name, price: item.price, description: '', dietary: [], pairings: [], image: item.image },
      1,
    );
  };

  return (
    <TouchableOpacity style={styles.tile} onPress={handleAdd} activeOpacity={0.75}>
      <View style={styles.emojiArea}>
        <Text style={styles.emoji}>{item.image}</Text>
      </View>
      <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
      <View style={styles.footer}>
        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
        <View style={styles.addBtn}>
          <Feather name="plus" size={10} color="#fff" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 84,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    padding: 8,
    marginRight: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  emojiArea: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  emoji: { fontSize: 26 },
  name: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.bistroBrown,
    lineHeight: 13,
    minHeight: 26,
    marginBottom: 5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.bistroGold,
  },
  addBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.bistroGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
