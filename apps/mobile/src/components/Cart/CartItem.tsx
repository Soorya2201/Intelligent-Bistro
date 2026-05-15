import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInRight, Layout } from 'react-native-reanimated';
import { CartItem as CartItemType } from '../../types';
import { useStore } from '../../store';
import { COLORS } from '../../constants/theme';

export default function CartItem({ item }: { item: CartItemType }) {
  const updateQuantity = useStore(s => s.updateQuantity);
  const removeItem     = useStore(s => s.removeItem);

  return (
    <Animated.View
      entering={FadeInRight.springify().damping(20)}
      layout={Layout.springify()}
      style={styles.container}
    >
      {/* gold left border accent */}
      <View style={styles.accent} />

      <Text style={styles.emoji}>{item.menuItem.image}</Text>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.menuItem.name}</Text>
        <Text style={styles.price}>${item.menuItem.price.toFixed(2)}</Text>
      </View>

      <View style={styles.qtyRow}>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
        >
          <Text style={styles.qtyBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.qtyNum}>{item.quantity}</Text>
        <TouchableOpacity
          style={[styles.qtyBtn, styles.qtyBtnPlus]}
          onPress={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
        >
          <Text style={[styles.qtyBtnText, { color: COLORS.bistroBrown }]}>+</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    marginBottom: 8,
    paddingRight: 12,
    paddingVertical: 11,
    paddingLeft: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  accent: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 3,
    backgroundColor: COLORS.bistroGold,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  emoji:  { fontSize: 24, flexShrink: 0, marginLeft: 4 },
  info:   { flex: 1, minWidth: 0 },
  name:   { fontSize: 13, fontWeight: '500', color: COLORS.bistroBrown },
  price:  { fontSize: 12, color: COLORS.bistroGold, fontWeight: '500', marginTop: 1 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 0.5, borderColor: COLORS.border,
    backgroundColor: COLORS.bistroCream2,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnPlus: { backgroundColor: COLORS.bistroCream2 },
  qtyBtnText: { fontSize: 14, color: COLORS.bistroBrown, lineHeight: 18 },
  qtyNum: { fontSize: 13, fontWeight: '500', minWidth: 16, textAlign: 'center', color: COLORS.bistroBrown },
});
