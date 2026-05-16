import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Modal, StyleSheet } from 'react-native';
import Animated, { FadeInDown, useSharedValue, withSpring } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import MenuGrid from '../components/Menu/MenuGrid';
import CartSheet from '../components/Cart/CartSheet';
import RecommendationStrip from '../components/Menu/RecommendationStrip';
import { useStore } from '../store';
import { COLORS } from '../constants/theme';

// Stable session ID shared with ChatScreen
const SESSION_ID = `session_home_${Date.now()}`;

export default function HomeScreen() {
  const navigation   = useNavigation<any>();
  const [cartVisible, setCartVisible] = useState(false);
  const itemCount    = useStore(s => s.getItemCount());
  const badgeScale   = useSharedValue(1);
  const prevCount    = useRef(itemCount);

  useEffect(() => {
    if (itemCount !== prevCount.current) {
      badgeScale.value = withSpring(1.45, { damping: 8, stiffness: 350 }, () => {
        badgeScale.value = withSpring(1, { damping: 12, stiffness: 220 });
      });
      prevCount.current = itemCount;
    }
  }, [itemCount]);

  return (
    <SafeAreaView style={styles.root}>

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400).springify().damping(18)} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.tagline}>INTELLIGENT BISTRO</Text>
            <Text style={styles.heading}>Today's Menu</Text>
          </View>

          <View style={styles.actions}>
            {/* Cart button */}
            <TouchableOpacity
              onPress={() => setCartVisible(true)}
              style={styles.cartBtn}
              activeOpacity={0.75}
            >
              <Feather name="shopping-bag" size={19} color={COLORS.bistroBrown} />
              {itemCount > 0 && (
                <Animated.View style={[styles.badge, { transform: [{ scale: badgeScale }] }]}>
                  <Text style={styles.badgeText}>{itemCount}</Text>
                </Animated.View>
              )}
            </TouchableOpacity>

            {/* Chat pill */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Chat')}
              style={styles.chatPill}
              activeOpacity={0.8}
            >
              <Feather name="message-circle" size={15} color="#fff" />
              <Text style={styles.chatPillText}>Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.sub}>Tap + to add · Or chat to order</Text>
      </Animated.View>

      {/* Recommendation Strip */}
      <RecommendationStrip sessionId={SESSION_ID} label="For You" />

      {/* Menu */}
      <MenuGrid />

      {/* Cart Sheet */}
      <Modal visible={cartVisible} animationType="slide" transparent>
        <CartSheet onClose={() => setCartVisible(false)} />
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bistroCream,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: COLORS.bistroCream,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.bistroGold,
    letterSpacing: 2,
    marginBottom: 2,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.bistroBrown,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 12,
    color: COLORS.medGray,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cartBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bistroCream2,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4, right: -4,
    backgroundColor: COLORS.bistroGold,
    borderRadius: 9,
    minWidth: 17, height: 17,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: COLORS.bistroCream,
  },
  badgeText: {
    color: '#fff', fontSize: 9, fontWeight: '700',
  },
  chatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.bistroBrown,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    shadowColor: COLORS.bistroBrown,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  chatPillText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
