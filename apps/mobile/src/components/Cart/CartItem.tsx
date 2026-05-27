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

export default function CartItem({ item }: { item: CartItemType }) {
  const updateQuantity     = useStore(s => s.updateQuantity);
  const updateInstructions = useStore(s => s.updateInstructions);
  const openCustomize      = useStore(s => s.openCustomize);

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
      updateInstructions(item.menuItem.id, draft.trim());
    }
  };

  const handleBlur = () => {
    updateInstructions(item.menuItem.id, draft.trim());
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
          <Text style={styles.name} numberOfLines={1}>{item.menuItem.name}</Text>
          <Text style={styles.price}>${displayPrice.toFixed(2)}</Text>
          {customSummary ? (
            <Text style={styles.customSummary} numberOfLines={1}>{customSummary}</Text>
          ) : null}
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
      </View>

      {/* Action row — Customise + note */}
      <View style={styles.actionRow}>
        {hasGroups && (
          <TouchableOpacity
            onPress={() => openCustomize(item.lineId)}
            style={styles.customiseBtn}
            accessibilityRole="button"
            accessibilityLabel={`Customise ${item.menuItem.name}`}
          >
            <Text style={styles.customiseBtnText}>⚙ Customise</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={toggleNote} style={styles.noteTrigger}>
          <Text style={styles.noteTriggerText}>
            {noteOpen ? '↑ Done' : hasNote ? `✎ ${item.specialInstructions}` : '✎ Note'}
          </Text>
        </TouchableOpacity>
      </View>

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
  emoji:  { fontSize: 24, flexShrink: 0 },
  info:   { flex: 1, minWidth: 0 },
  name:   { fontSize: 13, fontWeight: '500', color: COLORS.bistroBrown },
  price:  { fontSize: 12, color: COLORS.bistroGold, fontWeight: '500', marginTop: 1 },
  customSummary: {
    fontSize: 10,
    color: COLORS.medGray,
    marginTop: 2,
    fontStyle: 'italic',
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
    gap: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  customiseBtn: { alignSelf: 'flex-start' },
  customiseBtnText: {
    fontSize: 11,
    color: COLORS.bistroAccent,
    fontWeight: '600',
  },
  noteTrigger: { alignSelf: 'flex-start' },
  noteTriggerText: {
    fontSize: 11,
    color: COLORS.medGray,
    fontStyle: 'italic',
    maxWidth: 200,
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
