import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants/theme';
import { RecommendationItem } from '../../types';
import { useStore } from '../../store';
import { MENU_IMAGES } from '../../constants/menuImages';

interface RecommendationCardProps {
  item: RecommendationItem;
  compact?: boolean;
}

function ReasonChip({ reason, source }: { reason: string; source: string }) {
  let bg    = COLORS.bistroGold;
  let label = '🔥 ' + reason;

  if (source.includes('pairing'))  { bg = '#27AE60'; label = '✓ ' + reason; }
  else if (source.includes('affinity')) { bg = '#3498DB'; label = '⭐ ' + reason; }

  return (
    <View style={[styles.reasonChip, { backgroundColor: bg + '22', borderColor: bg }]}>
      <Text style={[styles.reasonText, { color: bg }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

export default function RecommendationCard({ item, compact = false }: RecommendationCardProps) {
  const addItem = useStore(s => s.addItem);
  const photo   = MENU_IMAGES[item.item_id];

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addItem({
      id: item.item_id, name: item.name, price: item.price,
      description: '', pairings: [],
      image: item.image || '🍽️',
    }, 1);
  };

  const imgHeight = compact ? 64 : 80;

  return (
    <TouchableOpacity
      onPress={handleAdd}
      activeOpacity={0.75}
      style={[styles.base, compact ? styles.cardCompact : styles.card]}
    >
      {/* Image or emoji hero */}
      {photo ? (
        <Image source={photo} style={[styles.photo, { height: imgHeight }]} resizeMode="cover" />
      ) : (
        <View style={[styles.emojiArea, { height: imgHeight }]}>
          <Text style={compact ? styles.emojiSm : styles.emoji}>{item.image || '🍽️'}</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={[styles.name, compact && styles.nameCompact]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
        <ReasonChip reason={item.reason} source={item.source} />
      </View>

      <View style={styles.addBtn}>
        <Text style={styles.addBtnText}>+</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    overflow: 'hidden',
    position: 'relative',
  },
  card:        { width: 140, marginRight: 10 },
  cardCompact: { width: 120, marginRight: 8 },

  photo: { width: '100%' },
  emojiArea: {
    width: '100%',
    backgroundColor: COLORS.bistroCream2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji:   { fontSize: 36 },
  emojiSm: { fontSize: 28 },

  info:        { padding: 8, gap: 3 },
  name:        { fontSize: 13, fontWeight: '700', color: COLORS.bistroBrown },
  nameCompact: { fontSize: 11 },
  price:       { fontSize: 12, color: COLORS.bistroGold, fontWeight: '600' },

  reasonChip: {
    borderRadius: 8, borderWidth: 0.5,
    paddingHorizontal: 5, paddingVertical: 2, alignSelf: 'flex-start',
  },
  reasonText: { fontSize: 9, fontWeight: '600' },

  addBtn: {
    position: 'absolute', top: 6, right: 6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.bistroGold,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 20 },
});
