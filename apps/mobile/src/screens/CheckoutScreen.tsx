import React, { useEffect, useState } from 'react';
import { View, SafeAreaView, TouchableOpacity, Text, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store';
import OrderRecap from '../components/Checkout/OrderRecap';
import { streamChat } from '../services/api';
import { useTTS } from '../hooks/useTTS';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import * as Haptics from 'expo-haptics';

export default function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const cartItems = useStore(state => state.items);
  const clearCart = useStore(state => state.clearCart);
  const getTotal = useStore(state => state.getTotal);
  const addOrderToHistory = useStore(state => state.addOrderToHistory);
  
  const [narration, setNarration] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  
  const { speak, stop } = useTTS();

  useEffect(() => {
    // Kick off narration
    let currentNarration = '';
    const messages = [
      { id: '1', role: 'user' as const, content: 'Please narrate my current order naturally before I confirm. Cart: ' + JSON.stringify(cartItems), timestamp: new Date() }
    ];

    streamChat(
      messages,
      cartItems,
      { restrictions: [] },
      (chunk) => {
        // Here we just append directly since we are not doing sentinel parsing for the narration
        // Wait, the AI might still send sentinels. Let's filter them out.
        const cleaned = chunk.replace(/✦ACTION✦.*?✦END✦/gs, '');
        currentNarration += cleaned;
        setNarration(currentNarration);
      },
      () => {
        // Stream done
        speak(currentNarration);
      },
      (err) => {
        setNarration("Ready to place your order?");
        speak("Ready to place your order?");
      }
    );

    return () => stop();
  }, []);

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addOrderToHistory(cartItems, getTotal());
    setIsConfirmed(true);
    setTimeout(() => {
      clearCart();
      navigation.goBack();
    }, 2000);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.lightGray }}>
      <ScrollView contentContainerStyle={{ padding: SPACING.md, flexGrow: 1 }}>
        {isConfirmed ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 60, marginBottom: SPACING.md }}>✅</Text>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.success }}>Order Confirmed!</Text>
            <Text style={{ fontSize: 16, color: COLORS.medGray, marginTop: SPACING.sm }}>Preparing your meal...</Text>
          </View>
        ) : (
          <>
            <OrderRecap narrationText={narration} />
            
            <View style={{ marginTop: 'auto', paddingTop: SPACING.xl }}>
              <TouchableOpacity 
                onPress={handleConfirm}
                style={{
                  backgroundColor: COLORS.success,
                  padding: SPACING.md,
                  borderRadius: RADIUS.full,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: COLORS.white, fontWeight: 'bold', fontSize: 18 }}>Confirm Order</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                style={{
                  padding: SPACING.md,
                  alignItems: 'center',
                  marginTop: SPACING.sm
                }}
              >
                <Text style={{ color: COLORS.darkGray, fontWeight: '600', fontSize: 16 }}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
