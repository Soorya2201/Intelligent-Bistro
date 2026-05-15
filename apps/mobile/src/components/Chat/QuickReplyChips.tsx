import React from 'react';
import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useStore } from '../../store';
import { COLORS } from '../../constants/theme';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle, useSharedValue,
  withSequence, withSpring, withTiming,
  FadeInDown,
} from 'react-native-reanimated';

interface QuickReplyChipsProps {
  onSelect: (text: string) => void;
}

export default function QuickReplyChips({ onSelect }: QuickReplyChipsProps) {
  const quickReplies = useStore(s => s.quickReplies);
  const clearQuickReplies = useStore(s => s.clearQuickReplies);

  if (!quickReplies.length) return null;

  return (
    <View style={{ height: 46, marginBottom: 8 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {quickReplies.map((reply, i) => (
          <Chip
            key={i}
            text={reply}
            delay={i * 50}
            onPress={() => {
              Haptics.selectionAsync();
              clearQuickReplies();
              onSelect(reply);
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function Chip({ text, onPress, delay }: { text: string; onPress: () => void; delay: number }) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.93, { duration: 80 }),
      withSpring(1, { damping: 12, stiffness: 260 })
    );
    setTimeout(onPress, 80);
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(250).springify().damping(16)}
      style={animStyle}
    >
      <TouchableOpacity onPress={handlePress} activeOpacity={1} style={styles.chip}>
        <Text style={styles.chipText}>{text}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.bistroGold,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  chipText: {
    fontSize: 13,
    color: COLORS.bistroGold,
    fontWeight: '500',
  },
});
