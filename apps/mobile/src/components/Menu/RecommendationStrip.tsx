import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING } from '../../constants/theme';
import { RecommendationItem } from '../../types';
import { fetchRecommendations } from '../../services/api';
import { useStore } from '../../store';
import { MENU_IMAGES } from '../../constants/menuImages';

interface RecommendationStripProps {
  sessionId: string;
  label?: string;
}

function SkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, { width: '60%' }]} />
    </View>
  );
}

function RecCard({
  item,
  onAdd,
  index,
}: {
  item: RecommendationItem;
  onAdd: (item: RecommendationItem) => void;
  index: number;
}) {
  const photo = MENU_IMAGES[item.item_id];

  let reasonColor = COLORS.bistroGold;
  let reasonLabel = '🔥 ' + item.reason;
  if (item.source.includes('pairing'))  { reasonColor = '#27AE60'; reasonLabel = '✓ ' + item.reason; }
  if (item.source.includes('affinity')) { reasonColor = '#3498DB'; reasonLabel = '⭐ ' + item.reason; }

  return (
    <Animated.View entering={FadeInRight.delay(index * 80).duration(300).springify()}>
      <TouchableOpacity onPress={() => onAdd(item)} activeOpacity={0.78} style={styles.card}>

        {/* Hero */}
        {photo ? (
          <Image source={photo} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={styles.emojiArea}>
            <Text style={styles.emoji}>{item.image || '🍽️'}</Text>
          </View>
        )}

        {/* + badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>+</Text>
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
          <View style={[styles.reasonChip, { backgroundColor: reasonColor + '18', borderColor: reasonColor }]}>
            <Text style={[styles.reasonText, { color: reasonColor }]} numberOfLines={1}>
              {reasonLabel}
            </Text>
          </View>
        </View>

      </TouchableOpacity>
    </Animated.View>
  );
}

export default function RecommendationStrip({ sessionId, label = 'For You' }: RecommendationStripProps) {
  const [recs, setRecs]       = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const cartItems    = useStore(s => s.items);
  const addItem      = useStore(s => s.addItem);
  const restrictions = useStore(s => s.restrictions);

  const cartItemIds = cartItems.map(c => c.menuItem.id);

  const load = useCallback(async () => {
    setLoading(true);
    const results = await fetchRecommendations(sessionId, cartItemIds, restrictions);
    setRecs(results);
    setLoading(false);
  }, [sessionId, cartItemIds.join(','), restrictions.join(',')]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = (item: RecommendationItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addItem({
      id: item.item_id, name: item.name, price: item.price,
      description: '', pairings: [],
      image: item.image || '🍽️',
    }, 1);
  };

  if (!loading && recs.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.stripLabel}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
        ) : (
          recs.map((item, i) => (
            <RecCard key={item.item_id} item={item} onAdd={handleAdd} index={i} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const CARD_W = 130;

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bistroCream,
  },
  stripLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.bistroGold,
    letterSpacing: 1,
    marginLeft: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },

  card: {
    width: CARD_W,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    overflow: 'hidden',
    position: 'relative',
  },
  cardImage: {
    width: CARD_W,
    height: 84,
  },
  emojiArea: {
    height: 84,
    backgroundColor: COLORS.bistroCream2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 34 },

  badge: {
    position: 'absolute', top: 6, right: 6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.bistroGold,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 13, fontWeight: '700', lineHeight: 21 },

  cardInfo: { padding: 8, gap: 3 },
  itemName:  { fontSize: 12, fontWeight: '700', color: COLORS.bistroBrown },
  itemPrice: { fontSize: 11, color: COLORS.bistroGold, fontWeight: '600' },
  reasonChip: {
    borderWidth: 0.5, borderRadius: 6,
    paddingHorizontal: 5, paddingVertical: 2,
    alignSelf: 'flex-start', marginTop: 2,
  },
  reasonText: { fontSize: 9, fontWeight: '600' },

  skeletonCard: {
    width: CARD_W,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    overflow: 'hidden',
    padding: 8,
  },
  skeletonImage: {
    height: 84,
    backgroundColor: COLORS.bistroCream2,
    borderRadius: 8,
    marginBottom: 8,
  },
  skeletonLine: {
    height: 10,
    backgroundColor: COLORS.bistroCream2,
    borderRadius: 5,
    marginBottom: 6,
    width: '80%',
  },
});
