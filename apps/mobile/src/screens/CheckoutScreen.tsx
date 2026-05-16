import React, { useEffect, useState, useRef } from 'react';
import { View, SafeAreaView, TouchableOpacity, Text, ScrollView, StyleSheet, Animated, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store';
import OrderRecap from '../components/Checkout/OrderRecap';
import { streamChat, placeOrder } from '../services/api';
import { useTTS } from '../hooks/useTTS';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import * as Haptics from 'expo-haptics';

const SESSION_ID = `checkout_${Date.now()}`;

const ORDER_STAGES = [
  { label: 'Order received',   emoji: '📋', delay: 0    },
  { label: 'In the kitchen',   emoji: '👨‍🍳', delay: 15000 },
  { label: 'Almost ready',     emoji: '🔥', delay: 45000 },
  { label: 'Ready for pickup!', emoji: '✅', delay: 90000 },
];

function OrderStatusBar({ stage }: { stage: number }) {
  return (
    <View style={styles.statusContainer}>
      {ORDER_STAGES.map((s, i) => (
        <View key={i} style={styles.stageRow}>
          <View style={[
            styles.stageDot,
            i < stage  && styles.stageDotDone,
            i === stage && styles.stageDotActive,
          ]}>
            <Text style={styles.stageDotText}>{i < stage ? '✓' : s.emoji}</Text>
          </View>
          <View style={styles.stageInfo}>
            <Text style={[
              styles.stageLabel,
              i === stage && styles.stageLabelActive,
              i < stage   && styles.stageLabelDone,
            ]}>{s.label}</Text>
          </View>
          {i < ORDER_STAGES.length - 1 && (
            <View style={[styles.stageLine, i < stage && styles.stageLineDone]} />
          )}
        </View>
      ))}
    </View>
  );
}

export default function CheckoutScreen() {
  const navigation    = useNavigation<any>();
  const cartItems     = useStore(state => state.items);
  const clearCart     = useStore(state => state.clearCart);
  const getTotal      = useStore(state => state.getTotal);
  const addOrderToHistory = useStore(state => state.addOrderToHistory);
  const profileEmail  = useStore(state => state.email);
  const setEmail      = useStore(state => state.setEmail);

  const [narration, setNarration]     = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [orderStage, setOrderStage]   = useState(0);
  const [orderId, setOrderId]         = useState<string | null>(null);

  // Receipt email opt-in state
  const [wantsReceipt, setWantsReceipt] = useState(!!profileEmail);
  const [emailInput, setEmailInput]     = useState(profileEmail);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  const { speak, stop } = useTTS();

  useEffect(() => {
    let currentNarration = '';
    const messages = [
      {
        id: '1',
        role: 'user' as const,
        content: 'Please narrate my current order naturally before I confirm it.',
        timestamp: new Date(),
      },
    ];

    streamChat(
      messages,
      cartItems,
      { restrictions: [] },
      {
        onActions: () => {},
        onDelta: (chunk) => {
          currentNarration += chunk;
          setNarration(currentNarration);
        },
        onRecommendations: () => {},
        onDone: () => { speak(currentNarration); },
        onError: () => {
          setNarration('Ready to place your order?');
          speak('Ready to place your order?');
        },
      },
      SESSION_ID,
    );

    return () => stop();
  }, []);

  const handleConfirm = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addOrderToHistory(cartItems, getTotal());
    setIsConfirmed(true);

    // Persist email to profile so it pre-fills next time
    const resolvedEmail = wantsReceipt && emailInput.trim() ? emailInput.trim() : undefined;
    if (resolvedEmail) setEmail(resolvedEmail);

    // Try to persist order to backend
    try {
      const subtotal = getTotal();
      const tax      = subtotal * 0.1;
      const total    = subtotal + tax;
      const result   = await placeOrder({
        sessionId: SESSION_ID,
        items: cartItems.map(c => ({
          item_id:  c.menuItem.id,
          name:     c.menuItem.name,
          quantity: c.quantity,
          price:    c.menuItem.price,
        })),
        subtotal,
        tax,
        total,
        email: resolvedEmail,
      });
      setOrderId(result.orderId);
    } catch {
      // Proceed offline
    }

    // Start 4-stage progress animation
    let currentStage = 0;
    setOrderStage(0);

    const advance = (stageIndex: number) => {
      Animated.timing(progressAnim, {
        toValue: stageIndex / (ORDER_STAGES.length - 1),
        duration: 600,
        useNativeDriver: false,
      }).start();
      setOrderStage(stageIndex);

      if (stageIndex === ORDER_STAGES.length - 1) {
        // Confetti celebration
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Animated.sequence([
          Animated.timing(confettiAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.delay(2000),
          Animated.timing(confettiAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start();
      }
    };

    ORDER_STAGES.forEach((stage, i) => {
      if (i === 0) { advance(0); return; }
      setTimeout(() => advance(i), stage.delay);
    });

    // Clear cart after all stages
    setTimeout(() => {
      clearCart();
    }, 95000);
  };

  if (isConfirmed) {
    const progressWidth = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.lightGray }}>
        <ScrollView contentContainerStyle={{ padding: SPACING.md, flexGrow: 1 }}>
          <View style={styles.confirmedContainer}>
            <Text style={styles.confirmedTitle}>Order Placed! 🎉</Text>
            {orderId && (
              <Text style={styles.orderId}>Order #{orderId.slice(0, 8).toUpperCase()}</Text>
            )}

            {/* Progress bar */}
            <View style={styles.progressBarBg}>
              <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
            </View>

            {/* Stage display */}
            <OrderStatusBar stage={orderStage} />

            {orderStage === ORDER_STAGES.length - 1 && (
              <Animated.View style={[styles.confettiContainer, { opacity: confettiAnim }]}>
                <Text style={styles.confettiText}>🎊 🎉 🎊</Text>
                <Text style={styles.readyText}>Your order is ready!</Text>
              </Animated.View>
            )}

            <TouchableOpacity
              onPress={() => { clearCart(); navigation.goBack(); }}
              style={styles.doneBtn}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.lightGray }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: SPACING.md, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <OrderRecap narrationText={narration} />

          {/* Receipt opt-in card */}
          <View style={styles.receiptCard}>
            <TouchableOpacity
              style={styles.receiptRow}
              onPress={() => {
                Haptics.selectionAsync();
                setWantsReceipt(v => !v);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.receiptLeft}>
                <View style={[styles.checkbox, wantsReceipt && styles.checkboxChecked]}>
                  {wantsReceipt && <Feather name="check" size={12} color="#fff" />}
                </View>
                <View>
                  <Text style={styles.receiptLabel}>Send me a receipt</Text>
                  <Text style={styles.receiptSub}>Optional — via email</Text>
                </View>
              </View>
              <Feather name="mail" size={18} color={wantsReceipt ? COLORS.bistroGold : COLORS.medGray} />
            </TouchableOpacity>

            {wantsReceipt && (
              <View style={styles.emailInputWrap}>
                <Feather name="at-sign" size={15} color={COLORS.medGray} style={styles.emailIcon} />
                <TextInput
                  style={styles.emailInput}
                  placeholder="your@email.com"
                  placeholderTextColor={COLORS.medGray}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={emailInput}
                  onChangeText={setEmailInput}
                  returnKeyType="done"
                />
              </View>
            )}
          </View>

          <View style={{ marginTop: 'auto', paddingTop: SPACING.lg }}>
            <TouchableOpacity onPress={handleConfirm} style={styles.confirmBtn}>
              <Text style={styles.confirmBtnText}>Confirm Order</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackBtn}>
              <Text style={styles.goBackBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  confirmedContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: SPACING.xl,
  },
  confirmedTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.bistroBrown,
    marginBottom: SPACING.sm,
  },
  orderId: {
    fontSize: 13,
    color: COLORS.medGray,
    marginBottom: SPACING.lg,
    fontFamily: 'monospace',
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.bistroCream2,
    borderRadius: 3,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.bistroGold,
    borderRadius: 3,
  },
  statusContainer: {
    width: '100%',
    paddingHorizontal: SPACING.sm,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    position: 'relative',
  },
  stageDot: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.bistroCream2,
    borderWidth: 1.5, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  stageDotActive: {
    backgroundColor: COLORS.bistroGold + '20',
    borderColor: COLORS.bistroGold,
  },
  stageDotDone: {
    backgroundColor: COLORS.success + '20',
    borderColor: COLORS.success,
  },
  stageDotText: { fontSize: 16 },
  stageInfo: { flex: 1, paddingTop: 8 },
  stageLabel: {
    fontSize: 14,
    color: COLORS.medGray,
    fontWeight: '500',
  },
  stageLabelActive: { color: COLORS.bistroGold, fontWeight: '700' },
  stageLabelDone:   { color: COLORS.success, fontWeight: '600' },
  stageLine: {
    position: 'absolute',
    left: 17,
    top: 36,
    width: 2,
    height: 28,
    backgroundColor: COLORS.border,
  },
  stageLineDone: { backgroundColor: COLORS.success },
  confettiContainer: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  confettiText: { fontSize: 40, marginBottom: SPACING.sm },
  readyText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.success,
  },
  doneBtn: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.bistroGold,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
  },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  confirmBtn: {
    backgroundColor: COLORS.success,
    padding: SPACING.md,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  confirmBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 18 },
  goBackBtn: {
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  goBackBtnText: { color: COLORS.darkGray, fontWeight: '600', fontSize: 16 },

  receiptCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    marginTop: SPACING.md,
    overflow: 'hidden',
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  receiptLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.bistroCream2,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.bistroGold,
    borderColor: COLORS.bistroGold,
  },
  receiptLabel: {
    fontSize: 14, fontWeight: '600', color: COLORS.bistroBrown,
  },
  receiptSub: {
    fontSize: 11, color: COLORS.medGray, marginTop: 1,
  },
  emailInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.bistroCream,
  },
  emailIcon: { marginRight: 8 },
  emailInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.bistroBrown,
    paddingVertical: 4,
  },
});
