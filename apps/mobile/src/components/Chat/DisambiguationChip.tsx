import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants/theme';

interface Props {
  original: string;
  suggestion: string;
  suggestionName: string;
  onConfirm: () => void;
  onDismiss: () => void;
}

export default function DisambiguationChip({ original, suggestionName, onConfirm, onDismiss }: Props) {
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.card}>
      <Text style={styles.label}>Did you mean</Text>
      <Text style={styles.name}>{suggestionName}</Text>
      <Text style={styles.original}>Instead of "{original}"?</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.btn, styles.yes]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onConfirm(); }} activeOpacity={0.8}>
          <Text style={styles.yesText}>Yes, add it</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.no]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onDismiss(); }} activeOpacity={0.8}>
          <Text style={styles.noText}>No</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 20, marginVertical: 6, backgroundColor: COLORS.card, borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: COLORS.bistroGold + '88' },
  label: { fontSize: 11, color: COLORS.medGray, fontWeight: '600', marginBottom: 2 },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.bistroBrown, marginBottom: 2 },
  original: { fontSize: 11, color: COLORS.medGray, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  yes: { backgroundColor: COLORS.bistroBrown },
  no: { backgroundColor: COLORS.bistroCream2, borderWidth: 0.5, borderColor: COLORS.border },
  yesText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  noText: { color: COLORS.bistroBrown, fontWeight: '600', fontSize: 13 },
});
