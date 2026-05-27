import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  LayoutAnimation, Platform, UIManager,
} from 'react-native';
import Animated, { FadeInRight, Layout } from 'react-native-reanimated';
import { CartItem as CartItemType } from '../../types';
import { useStore } from '../../store';
import { COLORS } from '../../constants/theme';
import { getCustomizationGroups, summariseCustomizations } from '../../utils/customizations';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

// ─── Sub-row: one unit inside a grouped card ─────────────────────────────────

function SubRow({ line, index }: { line: CartItemType; index: number }) {
  const removeLine             = useStore(s => s.removeLine);
  const updateLineQuantity     = useStore(s => s.updateLineQuantity);
  const updateLineInstructions = useStore(s => s.updateLineInstructions);

  const customSummary = summariseCustomizations(line.menuItem.id, line.customizations ?? []);
  const displayPrice  = line.menuItem.price + (line.customizationPriceDelta ?? 0);
  const hasNote       = !!line.specialInstructions;
  const [noteOpen, setNoteOpen] = useState(false);
  const [draft, setDraft]       = useState(line.specialInstructions ?? '');
  const inputRef = useRef<TextInput>(null);

  const toggleNote = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (!noteOpen) {
      setNoteOpen(true);
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setNoteOpen(false);
      updateLineInstructions(line.lineId, draft.trim());
    }
  };

  return (
    <View style={styles.subRow}>
      <View style={styles.subLeft}>
        <View style={styles.subLabelRow}>
          <Text style={styles.subItemLabel}>Item {index + 1}</Text>
          <Text style={styles.subPrice}>${displayPrice.toFixed(2)}</Text>
        </View>
        {customSummary ? (
          <Text style={styles.subCustomSummary} numberOfLines={2}>{customSummary}</Text>
        ) : (
          <Text style={styles.subDefault}>Default</Text>
        )}
        {!noteOpen && hasNote && (
          <Text style={styles.notePreview} numberOfLines={1}>"{line.specialInstructions}"</Text>
        )}
        {noteOpen && (
          <TextInput
            ref={inputRef}
            style={styles.noteInput}
            value={draft}
            onChangeText={setDraft}
            onBlur={() => updateLineInstructions(line.lineId, draft.trim())}
            placeholder="e.g. extra spice, no onions…"
            placeholderTextColor={COLORS.medGray}
            returnKeyType="done"
            onSubmitEditing={toggleNote}
            multiline={false}
          />
        )}
      </View>

      <View style={styles.subRight}>
        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => line.quantity <= 1 ? removeLine(line.lineId) : updateLineQuantity(line.lineId, line.quantity - 1)}
          >
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyNum}>{line.quantity}</Text>
          <TouchableOpacity
            style={[styles.qtyBtn, styles.qtyBtnPlus]}
            onPress={() => updateLineQuantity(line.lineId, line.quantity + 1)}
          >
            <Text style={[styles.qtyBtnText, { color: COLORS.bistroBrown }]}>+</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={toggleNote}
          style={[styles.noteBtn, noteOpen && styles.noteBtnActive]}
        >
          <Text style={[styles.noteBtnText, noteOpen && styles.noteBtnTextActive]}>
            {noteOpen ? '✓ Done' : '✎ Note'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Single-line card (no duplication for this item) ─────────────────────────

function SingleCard({ line, onCustomise, hasGroups }: {
  line: CartItemType;
  onCustomise: () => void;
  hasGroups: boolean;
}) {
  const removeLine             = useStore(s => s.removeLine);
  const updateLineQuantity     = useStore(s => s.updateLineQuantity);
  const updateLineInstructions = useStore(s => s.updateLineInstructions);

  const customSummary = summariseCustomizations(line.menuItem.id, line.customizations ?? []);
  const displayPrice  = line.menuItem.price + (line.customizationPriceDelta ?? 0);
  const hasNote       = !!line.specialInstructions;
  const [noteOpen, setNoteOpen] = useState(hasNote);
  const [draft, setDraft]       = useState(line.specialInstructions ?? '');
  const inputRef = useRef<TextInput>(null);

  const toggleNote = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (!noteOpen) {
      setNoteOpen(true);
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setNoteOpen(false);
      updateLineInstructions(line.lineId, draft.trim());
    }
  };

  return (
    <>
      <View style={styles.mainRow}>
        <Text style={styles.emoji}>{line.menuItem.image}</Text>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{line.menuItem.name}</Text>
          <Text style={styles.price}>${displayPrice.toFixed(2)}</Text>
          {customSummary ? (
            <Text style={styles.customSummary} numberOfLines={2}>{customSummary}</Text>
          ) : null}
        </View>
        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => line.quantity <= 1 ? removeLine(line.lineId) : updateLineQuantity(line.lineId, line.quantity - 1)}
          >
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyNum}>{line.quantity}</Text>
          <TouchableOpacity
            style={[styles.qtyBtn, styles.qtyBtnPlus]}
            onPress={() => updateLineQuantity(line.lineId, line.quantity + 1)}
          >
            <Text style={[styles.qtyBtnText, { color: COLORS.bistroBrown }]}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.actionRow}>
        {hasGroups && (
          <TouchableOpacity onPress={onCustomise} style={styles.customiseBtn}>
            <Text style={styles.customiseBtnText}>✦ Customise</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={toggleNote}
          style={[styles.noteBtn, noteOpen && styles.noteBtnActive]}
        >
          <Text style={[styles.noteBtnText, noteOpen && styles.noteBtnTextActive]}>
            {noteOpen ? '✓ Done' : '✎ Note'}
          </Text>
        </TouchableOpacity>
      </View>

      {!noteOpen && hasNote && (
        <Text style={styles.notePreview} numberOfLines={1}>"{line.specialInstructions}"</Text>
      )}
      {noteOpen && (
        <TextInput
          ref={inputRef}
          style={styles.noteInput}
          value={draft}
          onChangeText={setDraft}
          onBlur={() => updateLineInstructions(line.lineId, draft.trim())}
          placeholder="e.g. extra spice, no onions, light sauce…"
          placeholderTextColor={COLORS.medGray}
          returnKeyType="done"
          onSubmitEditing={toggleNote}
          multiline={false}
        />
      )}
    </>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function GroupedCartItem({ lines }: { lines: CartItemType[] }) {
  const splitLine     = useStore(s => s.splitLine);
  const openCustomize = useStore(s => s.openCustomize);

  const item      = lines[0];
  const hasGroups = getCustomizationGroups(item.menuItem.id).length > 0;

  const handleCustomise = () => {
    let firstLineId = lines[0].lineId;
    for (const line of lines) {
      const ids = splitLine(line.lineId);
      if (line.lineId === lines[0].lineId) firstLineId = ids[0];
    }
    openCustomize(firstLineId);
  };

  return (
    <Animated.View
      entering={FadeInRight.springify().damping(20)}
      layout={Layout.springify()}
      style={styles.container}
    >
      <View style={styles.accent} />

      {lines.length === 1 ? (
        <SingleCard line={lines[0]} onCustomise={handleCustomise} hasGroups={hasGroups} />
      ) : (
        <>
          {/* Group header row */}
          <View style={styles.groupHeader}>
            <Text style={styles.emoji}>{item.menuItem.image}</Text>
            <Text style={styles.name} numberOfLines={1}>{item.menuItem.name}</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{lines.length}</Text>
            </View>
            {hasGroups && (
              <TouchableOpacity onPress={handleCustomise} style={styles.customiseBtn}>
                <Text style={styles.customiseBtnText}>✦ Customise</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.groupDivider} />

          {lines.map((line, i) => (
            <React.Fragment key={line.lineId}>
              {i > 0 && <View style={styles.subDivider} />}
              <SubRow line={line} index={i} />
            </React.Fragment>
          ))}
        </>
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

  // ── Single-line ───────────────────────────────────────────────────────────
  mainRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginLeft: 4 },
  emoji:      { fontSize: 24, flexShrink: 0 },
  info:       { flex: 1, minWidth: 0 },
  name:       { fontSize: 13, fontWeight: '500', color: COLORS.bistroBrown, flexShrink: 1 },
  price:      { fontSize: 12, color: COLORS.bistroGold, fontWeight: '500', marginTop: 1 },
  customSummary: {
    fontSize: 10,
    color: COLORS.medGray,
    marginTop: 2,
    fontStyle: 'italic',
    lineHeight: 14,
  },
  qtyRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 0.5, borderColor: COLORS.border,
    backgroundColor: COLORS.bistroCream2,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnPlus: { backgroundColor: COLORS.bistroCream2 },
  qtyBtnText: { fontSize: 14, color: COLORS.bistroBrown, lineHeight: 18 },
  qtyNum: {
    fontSize: 13, fontWeight: '500',
    minWidth: 16, textAlign: 'center',
    color: COLORS.bistroBrown,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginLeft: 4,
  },
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
  noteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.bistroBrown,
  },
  noteBtnActive:     { backgroundColor: COLORS.bistroBrown },
  noteBtnText:       { fontSize: 11, color: COLORS.bistroBrown, fontWeight: '600', letterSpacing: 0.2 },
  noteBtnTextActive: { color: COLORS.white },
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

  // ── Multi-line group ──────────────────────────────────────────────────────
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 4,
  },
  countBadge: {
    backgroundColor: COLORS.bistroGold,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: 2,
  },
  countBadgeText: { fontSize: 10, color: COLORS.white, fontWeight: '700' },

  groupDivider: {
    height: 0.5,
    backgroundColor: COLORS.border,
    marginTop: 10,
    marginBottom: 2,
    marginLeft: 4,
  },

  // Sub-row
  subRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 7,
    marginLeft: 4,
    gap: 8,
  },
  subLeft:  { flex: 1, minWidth: 0 },
  subRight: { alignItems: 'flex-end', gap: 5, flexShrink: 0 },

  subLabelRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subItemLabel: { fontSize: 11, fontWeight: '700', color: COLORS.bistroBrown },
  subPrice:     { fontSize: 11, color: COLORS.bistroGold, fontWeight: '600' },
  subCustomSummary: {
    fontSize: 10,
    color: COLORS.medGray,
    fontStyle: 'italic',
    marginTop: 2,
    lineHeight: 14,
  },
  subDefault: {
    fontSize: 10,
    color: COLORS.medGray,
    marginTop: 2,
    fontStyle: 'italic',
  },
  subDivider: {
    height: 0.5,
    backgroundColor: COLORS.border,
    marginLeft: 4,
    opacity: 0.4,
  },
});
