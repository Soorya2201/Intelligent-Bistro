import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Animated, Modal,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useStore } from '../../store';
import { CartLine, CartLineCustomization } from '../../types';
import {
  getCustomizationGroups,
  getDefaultCustomizations,
  calculatePriceDelta,
  summariseCustomizations,
  CustomizationGroup,
} from '../../utils/customizations';
import { COLORS, RADIUS } from '../../constants/theme';

// ─── Option pill row ──────────────────────────────────────────────────────────

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

// ─── Main sheet ───────────────────────────────────────────────────────────────

export default function CustomizeSheet() {
  const activeLineId             = useStore(s => s.activeLineId);
  const closeCustomize           = useStore(s => s.closeCustomize);
  const items                    = useStore(s => s.items);
  const updateLineCustomizations = useStore(s => s.updateLineCustomizations);

  const slideAnim = useRef(new Animated.Value(-700)).current;
  const [visible, setVisible]       = useState(false);
  const [activeTab, setActiveTab]   = useState(0);

  // All selections keyed by lineId → groupId → optionIds
  const [allSelections, setAllSelections] =
    useState<Record<string, Record<string, string[]>>>({});

  // Derive the set of lines for the active item (keep stable across renders)
  const anchorLine  = items.find(i => i.lineId === activeLineId);
  const relatedLines: CartLine[] = anchorLine
    ? items.filter(i => i.menuItem.id === anchorLine.menuItem.id)
    : [];
  const itemId  = anchorLine?.menuItem.id ?? '';
  const groups  = getCustomizationGroups(itemId);

  // Open modal when activeLineId arrives
  useEffect(() => {
    if (activeLineId) setVisible(true);
  }, [activeLineId]);

  // Initialise per-line selections when sheet becomes visible
  useEffect(() => {
    if (!activeLineId || !visible || relatedLines.length === 0) return;

    const map: Record<string, Record<string, string[]>> = {};
    for (const rl of relatedLines) {
      const source = rl.customizations?.length
        ? rl.customizations
        : getDefaultCustomizations(rl.menuItem.id);
      const lineMap: Record<string, string[]> = {};
      for (const c of source) lineMap[c.groupId] = [...c.selectedOptionIds];
      for (const g of groups) {
        if (!lineMap[g.id]) lineMap[g.id] = [...g.defaultIds];
      }
      map[rl.lineId] = lineMap;
    }
    setAllSelections(map);

    // Focus tab matching the tapped lineId
    const idx = relatedLines.findIndex(l => l.lineId === activeLineId);
    setActiveTab(Math.max(0, idx));

    // Slide in
    slideAnim.setValue(-700);
    Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }).start();
  }, [activeLineId, visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, { toValue: -700, duration: 250, useNativeDriver: true }).start(() => {
      setVisible(false);
      closeCustomize();
    });
  };

  const handleToggle = (groupId: string, optionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentLine = relatedLines[activeTab];
    if (!currentLine) return;
    const lineId = currentLine.lineId;

    setAllSelections(prev => {
      const group     = groups.find(g => g.id === groupId);
      if (!group) return prev;
      const current    = prev[lineId]?.[groupId] ?? [];
      const isSelected = current.includes(optionId);

      let next: string[];
      if (group.type === 'single') {
        next = isSelected ? [] : [optionId];
      } else if (isSelected) {
        const minPicks = group.minPicks ?? 0;
        next = current.length <= minPicks ? current : current.filter(id => id !== optionId);
      } else {
        const maxPicks = group.maxPicks ?? Infinity;
        next = current.length >= maxPicks
          ? [...current.slice(1), optionId]
          : [...current, optionId];
      }

      return {
        ...prev,
        [lineId]: { ...(prev[lineId] ?? {}), [groupId]: next },
      };
    });
  };

  const handleDone = () => {
    for (const rl of relatedLines) {
      const lineSelections = allSelections[rl.lineId] ?? {};
      const customs: CartLineCustomization[] = groups.map(g => ({
        groupId: g.id,
        selectedOptionIds: lineSelections[g.id] ?? g.defaultIds,
      }));
      updateLineCustomizations(rl.lineId, customs);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    handleClose();
  };

  // Current tab state
  const currentLine       = relatedLines[activeTab];
  const currentLineId     = currentLine?.lineId ?? '';
  const currentSelections = allSelections[currentLineId] ?? {};
  const currentCustoms: CartLineCustomization[] = groups.map(g => ({
    groupId: g.id,
    selectedOptionIds: currentSelections[g.id] ?? g.defaultIds,
  }));
  const priceDelta = calculatePriceDelta(itemId, currentCustoms);

  const multiLine = relatedLines.length > 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <SafeAreaView style={styles.inner}>

            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Customise</Text>
                {anchorLine && <Text style={styles.subtitle}>{anchorLine.menuItem.name}</Text>}
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn} accessibilityLabel="Close">
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Tab bar — only shown when multiple lines of same item */}
            {multiLine && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabBar}
                contentContainerStyle={styles.tabBarContent}
              >
                {relatedLines.map((rl, idx) => {
                  const isActive = idx === activeTab;
                  const tabCustoms: CartLineCustomization[] = groups.map(g => ({
                    groupId: g.id,
                    selectedOptionIds: (allSelections[rl.lineId] ?? {})[g.id] ?? g.defaultIds,
                  }));
                  const summary = summariseCustomizations(itemId, tabCustoms);
                  return (
                    <TouchableOpacity
                      key={rl.lineId}
                      style={[styles.tab, isActive && styles.tabActive]}
                      onPress={() => { Haptics.selectionAsync(); setActiveTab(idx); }}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: isActive }}
                    >
                      <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                        Item {idx + 1}
                      </Text>
                      {summary ? (
                        <Text style={[styles.tabSummary, isActive && styles.tabSummaryActive]} numberOfLines={1}>
                          {summary}
                        </Text>
                      ) : (
                        <Text style={[styles.tabSummary, isActive && styles.tabSummaryActive]}>
                          Default
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Options for the active tab */}
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {groups.map(group => (
                <GroupRow
                  key={`${currentLineId}-${group.id}`}
                  group={group}
                  selections={currentSelections[group.id] ?? group.defaultIds}
                  onToggle={handleToggle}
                />
              ))}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.doneBtn} onPress={handleDone} accessibilityRole="button">
                <Text style={styles.doneBtnText}>
                  {multiLine ? 'Save All Items' : 'Done'}
                  {priceDelta > 0 ? `  +$${priceDelta.toFixed(2)}` : ''}
                </Text>
              </TouchableOpacity>
            </View>

          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    maxHeight: '80%',
    backgroundColor: COLORS.bistroCream,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 20,
  },
  inner: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  title:    { fontSize: 18, fontWeight: '600', color: COLORS.bistroBrown },
  subtitle: { fontSize: 12, color: COLORS.medGray, marginTop: 2 },
  closeBtn:  { padding: 4, marginLeft: 8 },
  closeText: { fontSize: 18, color: COLORS.medGray },

  // ── Tab bar ─────────────────────────────────────────────────────────────────
  tabBar: {
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    maxHeight: 72,
  },
  tabBarContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.bistroCream2,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 80,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.bistroBrown,
    borderColor: COLORS.bistroBrown,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.bistroBrown2,
    letterSpacing: 0.2,
  },
  tabLabelActive: { color: COLORS.white },
  tabSummary: {
    fontSize: 9,
    color: COLORS.medGray,
    marginTop: 2,
    maxWidth: 100,
    textAlign: 'center',
  },
  tabSummaryActive: { color: 'rgba(255,255,255,0.7)' },

  // ── Options ──────────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 8 },

  groupBlock:  { marginBottom: 20 },
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
  groupHint: { fontSize: 10, color: COLORS.medGray, letterSpacing: 0.5 },
  pillRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
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
  pillText:         { fontSize: 12, color: COLORS.bistroBrown2, fontWeight: '500' },
  pillTextSelected: { color: COLORS.white },

  // ── Footer ───────────────────────────────────────────────────────────────────
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
