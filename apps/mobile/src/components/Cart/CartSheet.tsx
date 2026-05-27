import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../../store';
import CartItem from './CartItem';
import { COLORS } from '../../constants/theme';
import { getMenuItem } from '../../utils/menuLookup';

const RECO_IDS = ['truffle-fries', 'fresh-lemonade', 'onion-rings', 'sweet-potato-fries'];
const RECO_ITEMS = RECO_IDS.map(id => getMenuItem(id)).filter(Boolean) as NonNullable<ReturnType<typeof getMenuItem>>[];

export default function CartSheet({ onClose }: { onClose: () => void }) {
  const items    = useStore(s => s.items);
  const total    = useStore(s => s.getTotal());
  const addItem  = useStore(s => s.addItem);
  const navigation = useNavigation<any>();

  const itemsInCart = new Set(items.map(i => i.menuItem.id));
  const recoVisible = RECO_ITEMS.filter(r => !itemsInCart.has(r.id));

  return (
    <View style={styles.backdrop}>
      <SafeAreaView style={styles.sheet}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Your Order</Text>
            <Text style={styles.subtitle}>Tap an item to customise or add a note</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Often paired */}
        {recoVisible.length > 0 && (
          <View style={styles.recoSection}>
            <Text style={styles.recoLabel}>Often paired</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6 }}
            >
              {recoVisible.map(r => (
                <TouchableOpacity
                  key={r.id}
                  style={styles.recoPill}
                  onPress={() => addItem(r, 1)}
                >
                  <Text style={styles.recoPillText}>+ {r.image} {r.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Cart items */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={{ padding: 16, paddingBottom: 4 }}
          showsVerticalScrollIndicator={false}
        >
          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🛒</Text>
              <Text style={styles.emptyText}>Your cart is empty.{'\n'}Chat or tap a suggestion above.</Text>
            </View>
          ) : (
            items.map(item => <CartItem key={item.menuItem.id} item={item} />)
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>SUBTOTAL</Text>
              <Text style={styles.taxNote}>+ 10% tax at checkout</Text>
            </View>
            <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.checkoutBtn, !items.length && styles.checkoutBtnDisabled]}
            disabled={!items.length}
            onPress={() => { onClose(); navigation.navigate('Checkout'); }}
          >
            <Text style={styles.checkoutText}>Place Order →</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: COLORS.bistroCream,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    minHeight: '50%',
  },
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
  subtitle: { fontSize: 12, color: COLORS.medGray, letterSpacing: 0.4, marginTop: 1 },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 18, color: COLORS.medGray },

  recoSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  recoLabel: {
    fontSize: 10,
    color: COLORS.medGray,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  recoPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bistroCream2,
  },
  recoPillText: { fontSize: 12, color: COLORS.bistroBrown2 },

  list: { flex: 1 },

  emptyState: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyIcon:  { fontSize: 40, opacity: 0.35 },
  emptyText:  { fontSize: 13, color: COLORS.medGray, textAlign: 'center', lineHeight: 20 },

  footer: {
    padding: 16,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 12, color: COLORS.medGray,
    letterSpacing: 0.8, textTransform: 'uppercase',
  },
  taxNote: {
    fontSize: 11, color: COLORS.medGray,
    marginTop: 2, opacity: 0.7,
  },
  totalAmount: {
    fontSize: 22, fontWeight: '700',
    color: COLORS.bistroBrown, fontStyle: 'italic',
  },
  checkoutBtn: {
    backgroundColor: COLORS.bistroBrown,
    padding: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutBtnDisabled: { opacity: 0.4 },
  checkoutText: {
    color: '#fff', fontSize: 14,
    fontWeight: '500', letterSpacing: 0.3,
  },
});
