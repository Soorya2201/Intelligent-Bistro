import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS } from '../../constants/theme';

interface WaveBarProps {
  isActive: boolean;
  mode: 'user' | 'ai';
}

const BAR_COUNT = 22;
const DURATIONS = Array.from({ length: BAR_COUNT }, (_, i) => 350 + ((i * 73) % 350));

export default function WaveBar({ isActive, mode }: WaveBarProps) {
  const bars = useRef(Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.1))).current;
  const loopsRef = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    loopsRef.current.forEach(a => a.stop());
    loopsRef.current = [];

    if (!isActive) {
      bars.forEach(b =>
        Animated.timing(b, { toValue: 0.1, duration: 300, useNativeDriver: false }).start()
      );
      return;
    }

    loopsRef.current = bars.map((bar, i) => {
      const dur = DURATIONS[i];
      const phase = (i / BAR_COUNT) * dur;
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(bar, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
          Animated.timing(bar, { toValue: 0.1, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        ])
      );
      // stagger start so bars aren't in sync
      setTimeout(() => loop.start(), phase);
      return loop;
    });

    return () => loopsRef.current.forEach(a => a.stop());
  }, [isActive, mode]);

  const color = mode === 'user' ? COLORS.bistroGold : '#5A7A3A';

  return (
    <View style={styles.container}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              backgroundColor: color,
              height: bar.interpolate({ inputRange: [0.1, 1], outputRange: [4, 38] }),
              opacity: bar.interpolate({ inputRange: [0.1, 1], outputRange: [0.25, 0.75] }),
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 16,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
});
