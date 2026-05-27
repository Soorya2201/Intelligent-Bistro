import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { MenuItem } from '../../types';
import { useStore } from '../../store';
import { COLORS } from '../../constants/theme';
import { MENU_IMAGES } from '../../constants/menuImages';
import { getCustomizationGroups } from '../../utils/customizations';
import * as Haptics from 'expo-haptics';

interface MenuCardProps {
  item: MenuItem;
  index?: number;
}

const DIET_COLOR: Record<string, { bg: string; text: string }> = {
  vegetarian:    { bg: '#EAF4EE', text: '#2E7D52' },
  vegan:         { bg: '#EAF4EE', text: '#2E7D52' },
  'gluten-free': { bg: '#FEF6E4', text: '#8B6914' },
  gluten:        { bg: '#FEF0EF', text: '#C0392B' },
  spicy:         { bg: '#FEF0EF', text: '#C0392B' },
  popular:       { bg: '#FFF3E0', text: '#E65100' },
};

export default function MenuCard({ item, index = 0 }: MenuCardProps) {
  const addItem            = useStore(s => s.addItem);
  const addLine            = useStore(s => s.addLine);
  const removeLine         = useStore(s => s.removeLine);
  const cartItems          = useStore(s => s.items);
  const toggleLike         = useStore(s => s.toggleLike);
  const isLiked            = useStore(s => s.isLiked(item.id));
  const openCustomize      = useStore(s => s.openCustomize);
  const getLinesByMenuItem = useStore(s => s.getLinesByMenuItem);

  const lines       = cartItems.filter(i => i.menuItem.id === item.id);
  const qty         = lines.reduce((s, i) => s + i.quantity, 0);
  const hasGroups   = getCustomizationGroups(item.id).length > 0;
  const photo       = MENU_IMAGES[item.id];
  const dietaryTags = (item.tags ?? item.dietary ?? []).slice(0, 2);

  // First tap: just add (no auto-open customize)
  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addItem(item, 1);
  };

  // Each subsequent + creates a new independent line (so tabs show per unit)
  const handleIncrease = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addLine(item);
  };

  // − removes the most-recently-added line
  const handleDecrease = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentLines = getLinesByMenuItem(item.id);
    if (currentLines.length === 0) return;
    const last = currentLines[currentLines.length - 1];
    if (last.quantity <= 1) {
      removeLine(last.lineId);
    } else {
      // AI-added line with qty > 1 — just decrement
      removeLine(last.lineId);
    }
  };

  const handleLike = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleLike(item); };

  // Opens customize sheet showing all lines (tabs) for this item
  const handleCustomise = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentLines = getLinesByMenuItem(item.id);
    if (currentLines.length > 0) openCustomize(currentLines[0].lineId);
  };

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
            <TouchableOpacity style={styles.heartBtn} onPress={handleLike} activeOpacity={0.75}>
              <Feather name="heart" size={14} color={isLiked ? COLORS.danger : '#fff'} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.heroEmoji}>
              <Text style={styles.emoji}>{item.image}</Text>
              <TouchableOpacity style={styles.heartBtnEmoji} onPress={handleLike} activeOpacity={0.75}>
                <Feather name="heart" size={14} color={isLiked ? COLORS.danger : COLORS.medGray} />
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>

          {dietaryTags.length > 0 && (
            <View style={styles.tags}>
              {dietaryTags.map(d => {
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
            <View style={styles.qtyBlock}>
              {hasGroups && (
                <TouchableOpacity
                  onPress={handleCustomise}
                  style={styles.customiseBtn}
                  accessibilityLabel={`Customise ${item.name}`}
                >
                  <Text style={styles.customiseBtnText}>✦ Customise</Text>
                </TouchableOpacity>
              )}
              <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={handleDecrease} activeOpacity={0.7}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyNum}>{qty}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={handleIncrease} activeOpacity={0.7}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
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

  heroImage: { position: 'relative' },
  image: { width: '100%', height: 130 },
  heartBtn: {
    position: 'absolute', top: 10, right: 10,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },

  heroEmoji: {
    backgroundColor: COLORS.bistroCream, paddingVertical: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  emoji:        { fontSize: 48, lineHeight: 56 },
  heartBtnEmoji: {
    position: 'absolute', top: 8, right: 10,
    padding: 6,
  },

  body:    { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6 },
  name:    { fontSize: 13, fontWeight: '700', color: COLORS.bistroBrown, lineHeight: 18, marginBottom: 4 },
  desc:    { fontSize: 11, color: COLORS.medGray, lineHeight: 15, marginBottom: 7 },
  tags:    { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 4 },
  tag:     { borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
  tagText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },

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
  qtyBlock:   { alignItems: 'flex-end', gap: 6 },
  qtyRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn:     { width: 28, height: 28, borderRadius: 14, borderWidth: 0.5, borderColor: COLORS.border, backgroundColor: COLORS.bistroCream2, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 16, color: COLORS.bistroBrown, lineHeight: 20 },
  qtyNum:     { fontSize: 13, fontWeight: '600', minWidth: 18, textAlign: 'center', color: COLORS.bistroBrown },
  customiseBtn: {
    backgroundColor: COLORS.bistroGold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-end',
  },
  customiseBtnText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
