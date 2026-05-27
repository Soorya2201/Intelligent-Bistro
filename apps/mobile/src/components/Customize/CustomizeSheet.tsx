import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useStore } from '../../store';
import { CartLineCustomization } from '../../types';
import {
  getCustomizationGroups,
  getDefaultCustomizations,
  calculatePriceDelta,
  CustomizationGroup,
} from '../../utils/customizations';
import { COLORS, RADIUS } from '../../constants/theme';

function GroupRow({
  group,
  selections,
  onToggle,
}: {
  group: CustomizationGroup;
  selections: string[];
  onToggle: (groupId: string, optionId: string) => void;
}) {
  return (
    <View style={styles.groupBlock}>
      <View style={styles.groupHeader}>
        <Text style={styles.groupLabel}>{group.label}</Text>
        {group.maxPicks && group.maxPicks > 1 && (
          <Text style={styles.groupHint}>
            {group.minPicks ? `${group.minPicks}–` : 'Up to '}{group.maxPicks}
          </Text>
        )}
      </View>
      <View style={styles.pillRow}>
        {group.options.map(opt => {
          const selected = selections.includes(opt.id);
          return (
            <TouchableOpacity
              key={opt.id}
              accessible
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${opt.label}${opt.priceDelta > 0 ? ` +$${opt.priceDelta.toFixed(2)}` : ''}`}
              style={[styles.pill, selected && styles.pillSelected]}
              onPress={() => onToggle(group.id, opt.id)}
            >
              <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                {opt.label}
                {opt.priceDelta > 0 ? ` +$${opt.priceDelta.toFixed(2)}` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function CustomizeSheet() {
  const activeLineId    = useStore(s => s.activeLineId);
  const closeCustomize  = useStore(s => s.closeCustomize);
  const items           = useStore(s => s.items);
  const updateLineCustomizations = useStore(s => s.updateLineCustomizations);

  const slideAnim = useRef(new Animated.Value(-600)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const line     = items.find(i => i.lineId === activeLineId);
  const itemId   = line?.menuItem.id ?? '';
  const groups   = getCustomizationGroups(itemId);

  const [localSelections, setLocalSelections] = useState<Record<string, string[]>>({});

  // Initialise local state from cart line or defaults whenever the sheet opens
  useEffect(() => {
    if (!activeLineId) return;
    const source = line?.customizations ?? getDefaultCustomizations(itemId);
    const map: Record<string, string[]> = {};
    for (const c of source) {
      map[c.groupId] = [...c.selectedOptionIds];
    }
    // Ensure every group has an entry
    for (const g of groups) {
      if (!map[g.id]) map[g.id] = [...g.defaultIds];
    }
    setLocalSelections(map);
  }, [activeLineId]);

  // Slide down from top on open
  useEffect(() => {
    if (activeLineId) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -600, duration: 250, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [activeLineId]);

  if (!activeLineId) return null;

  const handleToggle = (groupId: string, optionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalSelections(prev => {
      const group     = groups.find(g => g.id === groupId);
      if (!group) return prev;
      const current   = prev[groupId] ?? [];
      const isSelected = current.includes(optionId);

      if (group.type === 'single') {
        return { ...prev, [groupId]: isSelected ? [] : [optionId] };
      }

      // multi
      if (isSelected) {
        const minPicks = group.minPicks ?? 0;
        if (current.length <= minPicks) return prev; // enforce min
        return { ...prev, [groupId]: current.filter(id => id !== optionId) };
      }
      const maxPicks = group.maxPicks ?? Infinity;
      if (current.length >= maxPicks) {
        // Replace oldest selection
        return { ...prev, [groupId]: [...current.slice(1), optionId] };
      }
      return { ...prev, [groupId]: [...current, optionId] };
    });
  };

  const handleDone = () => {
    const customs: CartLineCustomization[] = groups.map(g => ({
      groupId: g.id,
      selectedOptionIds: localSelections[g.id] ?? g.defaultIds,
    }));
    updateLineCustomizations(activeLineId, customs);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    closeCustomize();
  };

  const currentCustoms: CartLineCustomization[] = groups.map(g => ({
    groupId: g.id,
    selectedOptionIds: localSelections[g.id] ?? g.defaultIds,
  }));
  const priceDelta = calculatePriceDelta(itemId, currentCustoms);

  return (
    <Animated.View style={[styles.wrapper, { opacity: opacityAnim }]}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeCustomize} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <SafeAreaView style={styles.inner}>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Customise</Text>
              {line && <Text style={styles.subtitle}>{line.menuItem.name}</Text>}
            </View>
            <TouchableOpacity onPress={closeCustomize} style={styles.closeBtn} accessibilityLabel="Close">
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Option groups */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {groups.map(group => (
              <GroupRow
                key={group.id}
                group={group}
                selections={localSelections[group.id] ?? group.defaultIds}
                onToggle={handleToggle}
              />
            ))}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.doneBtn} onPress={handleDone} accessibilityRole="button">
              <Text style={styles.doneBtnText}>
                Done{priceDelta > 0 ? `  +$${priceDelta.toFixed(2)}` : ''}
              </Text>
            </TouchableOpacity>
          </View>

        </SafeAreaView>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    maxHeight: '75%',
    backgroundColor: COLORS.bistroCream,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 12,
  },
  inner: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  title:    { fontSize: 18, fontWeight: '600', color: COLORS.bistroBrown },
  subtitle: { fontSize: 12, color: COLORS.medGray, marginTop: 2 },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 18, color: COLORS.medGray },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 8 },

  groupBlock: { marginBottom: 20 },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.bistroBrown,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  groupHint: {
    fontSize: 10,
    color: COLORS.medGray,
    letterSpacing: 0.5,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bistroCream2,
  },
  pillSelected: {
    backgroundColor: COLORS.bistroAccent,
    borderColor: COLORS.bistroAccent,
  },
  pillText: {
    fontSize: 12,
    color: COLORS.bistroBrown2,
    fontWeight: '500',
  },
  pillTextSelected: {
    color: COLORS.white,
  },

  footer: {
    padding: 16,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  doneBtn: {
    backgroundColor: COLORS.bistroBrown,
    padding: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  doneBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
