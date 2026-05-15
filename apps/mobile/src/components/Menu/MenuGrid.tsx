import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { FlashList } from '@shopify/flash-list';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MenuCard from './MenuCard';
import { COLORS } from '../../constants/theme';
import { MenuItem } from '../../types';
import menuData from '../../../../api/src/data/menu.json';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const CAT_ICONS: Record<string, MCIcon> = {
  burgers:  'hamburger',
  sides:    'french-fries',
  drinks:   'cup-water',
  desserts: 'cupcake',
};

export default function MenuGrid() {
  const [activeCategory, setActiveCategory] = useState(menuData.categories[0].id);
  const [listKey, setListKey] = useState(0);

  const categories = menuData.categories;
  const items = (categories.find(c => c.id === activeCategory)?.items ?? []) as MenuItem[];

  const handleCategoryChange = (id: string) => {
    if (id === activeCategory) return;
    setActiveCategory(id);
    setListKey(k => k + 1);
  };

  return (
    <View style={styles.root}>

      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContent}
        style={styles.tabsRow}
      >
        {categories.map(cat => {
          const active = cat.id === activeCategory;
          const iconName: MCIcon = CAT_ICONS[cat.id] ?? 'silverware-fork-knife';
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => handleCategoryChange(cat.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.tab, active && styles.tabActive]}>
                <MaterialCommunityIcons
                  name={iconName}
                  size={16}
                  color={active ? '#fff' : COLORS.bistroGold}
                />
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                  {cat.name}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Item count hint */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>{items.length} items</Text>
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        <Animated.View key={listKey} entering={FadeIn.duration(220)} style={{ flex: 1 }}>
          <FlashList
            data={items}
            renderItem={({ item, index }) => (
              <View style={styles.cell}>
                <MenuCard item={item} index={index} />
              </View>
            )}
            // @ts-ignore
            estimatedItemSize={290}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        </Animated.View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  tabsRow: { maxHeight: 68, flexGrow: 0 },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: COLORS.bistroCream,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: COLORS.bistroBrown,
    borderColor: COLORS.bistroBrown,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.medGray,
  },
  tabLabelActive: {
    color: '#fff',
  },

  countRow: {
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  countText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.medGray,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  grid: { flex: 1, paddingHorizontal: 10 },
  cell: { flex: 1, padding: 6 },
  listContent: { paddingBottom: 120 },
});
