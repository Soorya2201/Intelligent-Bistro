import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { MenuItem } from '../../types';
import { useStore } from '../../store';
import { COLORS } from '../../constants/theme';
import * as Haptics from 'expo-haptics';

interface MenuCardProps {
  item: MenuItem;
  index?: number;
}

// Static map — require() paths must be literals for Metro to bundle them
const ITEM_IMAGES: Record<string, any> = {
  // Burgers
  'classic-burger':      require('../../../../../assets/Classic Bistro Burger.jpeg'),
  'vegan-burger':        require('../../../../../assets/Beyond bistro Burger.jpeg'),
  'mushroom-burger':     require('../../../../../assets/Mushroom swiss burger.jpeg'),
  'bbq-burger':          require('../../../../../assets/Smokehouse BBQ Burger.jpeg'),
  'spicy-chicken':       require('../../../../../assets/Spicy Chicken Sandwich.jpeg'),
  // Sides
  'truffle-fries':       require('../../../../../assets/truffle fries.jpeg'),
  'sweet-potato-fries':  require('../../../../../assets/sweet potato fries.jpeg'),
  'side-salad':          require('../../../../../assets/garden side salad.jpeg'),
  'onion-rings':         require('../../../../../assets/onion Rings.jpeg'),
  // Drinks
  'classic-soda':        require('../../../../../assets/classic soda.jpeg'),
  'lemonade':            require('../../../../../assets/Fresh Lemonade.jpeg'),
  'iced-tea':            require('../../../../../assets/professional-food-photography-iced-tea-w_kwJ2A0h-UcqkyFQqCO4GAg_6jMsN8xHQxO_pTpK76cipg_sd.jpeg'),
  'sparkling-water':     require('../../../../../assets/sparkling water.jpeg'),
  'large-water':         require('../../../../../assets/Still Water (Large).jpeg'),
};

const DIET_COLOR: Record<string, { bg: string; text: string }> = {
  vegetarian:    { bg: '#EAF4EE', text: '#2E7D52' },
  vegan:         { bg: '#EAF4EE', text: '#2E7D52' },
  'gluten-free': { bg: '#FEF6E4', text: '#8B6914' },
  gluten:        { bg: '#FEF0EF', text: '#C0392B' },
};

export default function MenuCard({ item, index = 0 }: MenuCardProps) {
  const addItem        = useStore(s => s.addItem);
  const updateQuantity = useStore(s => s.updateQuantity);
  const cartItems      = useStore(s => s.items);
  const qty            = cartItems.find(i => i.menuItem.id === item.id)?.quantity ?? 0;

  const handleAdd      = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); addItem(item, 1); };
  const handleIncrease = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); updateQuantity(item.id, qty + 1); };
  const handleDecrease = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); updateQuantity(item.id, qty - 1); };

  const photo = ITEM_IMAGES[item.id];

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 55).duration(400).springify().damping(18)}
      style={styles.shadow}
    >
      <View style={styles.card}>

        {/* Hero — real photo or emoji fallback */}
        {photo ? (
          <View style={styles.heroImage}>
            <Image source={photo} style={styles.image} resizeMode="cover" />
            <View style={styles.imageAccent} />
          </View>
        ) : (
          <>
            <View style={styles.accent} />
            <View style={styles.heroEmoji}>
              <Text style={styles.emoji}>{item.image}</Text>
            </View>
          </>
        )}

        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>

          {item.dietary.length > 0 && (
            <View style={styles.tags}>
              {item.dietary.slice(0, 2).map(d => {
                const c = DIET_COLOR[d] ?? { bg: COLORS.bistroCream, text: COLORS.medGray };
                return (
                  <View key={d} style={[styles.tag, { backgroundColor: c.bg }]}>
                    <Text style={[styles.tagText, { color: c.text }]}>{d}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.price}>${item.price.toFixed(2)}</Text>

          {qty === 0 ? (
            <TouchableOpacity onPress={handleAdd} activeOpacity={0.75} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <View style={styles.addBtn}>
                <Feather name="plus" size={18} color="#fff" />
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.qtyBtn} onPress={handleDecrease} activeOpacity={0.7}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyNum}>{qty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={handleIncrease} activeOpacity={0.7}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 18,
    shadowColor: COLORS.bistroBrown,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 4,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },

  // ── Photo hero ───────────────────────────────────────────────
  heroImage: { position: 'relative' },
  image: { width: '100%', height: 130 },
  imageAccent: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 3, backgroundColor: COLORS.bistroGold,
  },

  // ── Emoji hero ───────────────────────────────────────────────
  accent:    { height: 3, backgroundColor: COLORS.bistroGold },
  heroEmoji: { backgroundColor: COLORS.bistroCream, paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  emoji:     { fontSize: 48, lineHeight: 56 },

  // ── Body ─────────────────────────────────────────────────────
  body: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6 },
  name: { fontSize: 13, fontWeight: '700', color: COLORS.bistroBrown, lineHeight: 18, marginBottom: 4 },
  desc: { fontSize: 11, color: COLORS.medGray, lineHeight: 15, marginBottom: 7 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 4 },
  tag:  { borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
  tagText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },

  // ── Footer ───────────────────────────────────────────────────
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingBottom: 12, paddingTop: 6,
  },
  price: { fontSize: 17, fontWeight: '700', color: COLORS.bistroBrown, letterSpacing: -0.3 },

  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.bistroBrown,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.bistroBrown,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22, shadowRadius: 5, elevation: 3,
  },
  qtyRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn:     { width: 28, height: 28, borderRadius: 14, borderWidth: 0.5, borderColor: COLORS.border, backgroundColor: COLORS.bistroCream2, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 16, color: COLORS.bistroBrown, lineHeight: 20 },
  qtyNum:     { fontSize: 13, fontWeight: '600', minWidth: 18, textAlign: 'center', color: COLORS.bistroBrown },
});
