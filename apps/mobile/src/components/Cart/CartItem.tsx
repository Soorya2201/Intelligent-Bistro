import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, LayoutAnimation, Platform, UIManager } from 'react-native';
import Animated, { FadeInRight, Layout } from 'react-native-reanimated';
import { CartItem as CartItemType } from '../../types';
import { useStore } from '../../store';
import { COLORS } from '../../constants/theme';
import { getCustomizationGroups, summariseCustomizations } from '../../utils/customizations';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export default function CartItem({
  item,
  itemNumber,
  totalCount,
}: {
  item: CartItemType;
  itemNumber?: number;
  totalCount?: number;
}) {
  const removeLine             = useStore(s => s.removeLine);
  const splitLine              = useStore(s => s.splitLine);
  const updateLineQuantity     = useStore(s => s.updateLineQuantity);
  const updateLineInstructions = useStore(s => s.updateLineInstructions);
  const openCustomize          = useStore(s => s.openCustomize);

  const hasGroups   = getCustomizationGroups(item.menuItem.id).length > 0;
  const customSummary = summariseCustomizations(item.menuItem.id, item.customizations ?? []);
  const hasNote     = !!item.specialInstructions;
  const [noteOpen, setNoteOpen] = useState(hasNote);
  const [draft, setDraft]       = useState(item.specialInstructions ?? '');
  const inputRef = useRef<TextInput>(null);

  const displayPrice = item.menuItem.price + (item.customizationPriceDelta ?? 0);

  const toggleNote = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (!noteOpen) {
      setNoteOpen(true);
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setNoteOpen(false);
      updateLineInstructions(item.lineId, draft.trim());
    }
  };

  const handleBlur = () => {
    updateLineInstructions(item.lineId, draft.trim());
  };

  return (
    <Animated.View
      entering={FadeInRight.springify().damping(20)}
      layout={Layout.springify()}
      style={styles.container}
    >
      <View style={styles.accent} />

      <View style={styles.mainRow}>
        <Text style={styles.emoji}>{item.menuItem.image}</Text>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{item.menuItem.name}</Text>
            {itemNumber != null && (
              <View style={styles.itemBadge}>
                <Text style={styles.itemBadgeText}>{itemNumber}/{totalCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.price}>${displayPrice.toFixed(2)}</Text>
          {customSummary ? (
            <Text style={styles.customSummary} numberOfLines={2}>{customSummary}</Text>
          ) : null}
        </View>

        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => {
              if (item.quantity <= 1) removeLine(item.lineId);
              else updateLineQuantity(item.lineId, item.quantity - 1);
            }}
          >
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyNum}>{item.quantity}</Text>
          <TouchableOpacity
            style={[styles.qtyBtn, styles.qtyBtnPlus]}
            onPress={() => updateLineQuantity(item.lineId, item.quantity + 1)}
          >
            <Text style={[styles.qtyBtnText, { color: COLORS.bistroBrown }]}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action row — Customise + note */}
      <View style={styles.actionRow}>
        {hasGroups && (
          <TouchableOpacity
            onPress={() => {
              const lineIds = splitLine(item.lineId);
              openCustomize(lineIds[0]);
            }}
            style={styles.customiseBtn}
            accessibilityRole="button"
            accessibilityLabel={`Customise ${item.menuItem.name}`}
          >
            <Text style={styles.customiseBtnText}>✦ Customise</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={toggleNote}
          style={[styles.noteBtn, noteOpen && styles.noteBtnActive]}
          accessibilityRole="button"
        >
          <Text style={[styles.noteBtnText, noteOpen && styles.noteBtnTextActive]}>
            {noteOpen ? '✓ Done' : '✎ Note'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Inline note preview when collapsed and has note */}
      {!noteOpen && hasNote && (
        <Text style={styles.notePreview} numberOfLines={1}>
          "{item.specialInstructions}"
        </Text>
      )}

      {noteOpen && (
        <TextInput
          ref={inputRef}
          style={styles.noteInput}
          value={draft}
          onChangeText={setDraft}
          onBlur={handleBlur}
          placeholder="e.g. extra spice, no onions, light sauce…"
          placeholderTextColor={COLORS.medGray}
          returnKeyType="done"
          onSubmitEditing={toggleNote}
          multiline={false}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 4,
  },
  emoji:   { fontSize: 24, flexShrink: 0 },
  info:    { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name:    { fontSize: 13, fontWeight: '500', color: COLORS.bistroBrown, flexShrink: 1 },
  itemBadge: {
    backgroundColor: COLORS.bistroGold,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  itemBadgeText: { fontSize: 9, color: COLORS.white, fontWeight: '700' },
  price:  { fontSize: 12, color: COLORS.bistroGold, fontWeight: '500', marginTop: 1 },
  customSummary: {
    fontSize: 10,
    color: COLORS.medGray,
    marginTop: 2,
    fontStyle: 'italic',
    lineHeight: 14,
  },

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

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginLeft: 4,
  },
  // Solid gold pill — Customise
  customiseBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: COLORS.bistroGold,
    borderWidth: 1,
    borderColor: COLORS.bistroGold,
  },
  customiseBtnText: {
    fontSize: 11,
    color: COLORS.white,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  // Outline pill — Note (transparent + brown border)
  noteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.bistroBrown,
  },
  noteBtnActive: {
    backgroundColor: COLORS.bistroBrown,
  },
  noteBtnText: {
    fontSize: 11,
    color: COLORS.bistroBrown,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  noteBtnTextActive: {
    color: COLORS.white,
  },
  notePreview: {
    fontSize: 10,
    color: COLORS.medGray,
    fontStyle: 'italic',
    marginTop: 4,
    marginLeft: 4,
    lineHeight: 14,
  },
  noteInput: {
    marginTop: 6,
    marginLeft: 4,
    fontSize: 12,
    color: COLORS.bistroBrown,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.bistroGold,
    paddingBottom: 4,
    paddingTop: 2,
  },
});
