import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle, withTiming, useSharedValue,
  FadeInDown,
} from 'react-native-reanimated';
import Markdown from 'react-native-markdown-display';
import { COLORS } from '../../constants/theme';

interface ChatBubbleProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isStreaming?: boolean;
  };
}

function Dot({ delay }: { delay: number }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    const loop = () => {
      setTimeout(() => {
        translateY.value = withTiming(-5, { duration: 300 }, () => {
          translateY.value = withTiming(0, { duration: 300 }, loop);
        });
      }, delay);
    };
    loop();
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

function TypingDots() {
  return (
    <View style={styles.dotsRow}>
      <Dot delay={0} />
      <Dot delay={150} />
      <Dot delay={300} />
    </View>
  );
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    if (!message.isStreaming || !message.content) return;
    const iv = setInterval(() => setCursorVisible(v => !v), 500);
    return () => clearInterval(iv);
  }, [message.isStreaming, message.content]);

  const ts = message.timestamp instanceof Date
    ? message.timestamp
    : new Date(message.timestamp);
  const timeStr = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const isTyping = message.isStreaming && !message.content;

  const content = message.content + (message.isStreaming && message.content
    ? (cursorVisible ? ' |' : '  ')
    : '');

  return (
    <Animated.View
      entering={FadeInDown.duration(280).springify().damping(18)}
      style={[styles.row, isUser ? styles.rowUser : styles.rowAi]}
    >
      {!isUser && (
        <View style={styles.avatarAi}>
          <Text style={styles.avatarTextAi}>B</Text>
        </View>
      )}

      <View style={[styles.col, isUser && styles.colUser]}>
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi]}>
          {isTyping ? (
            <TypingDots />
          ) : isUser ? (
            <Text style={[styles.text, styles.textUser]}>{content}</Text>
          ) : (
            <Markdown style={markdownStyles}>{content}</Markdown>
          )}
        </View>
        <Text style={[styles.time, isUser && styles.timeUser]}>{timeStr}</Text>
      </View>
    </Animated.View>
  );
}

const markdownStyles = {
  body:             { fontSize: 14, lineHeight: 21, color: COLORS.bistroBrown, margin: 0, padding: 0 },
  strong:           { fontWeight: '700' as const, color: COLORS.bistroBrown },
  em:               { fontStyle: 'italic' as const, color: COLORS.bistroBrown },
  bullet_list:      { marginVertical: 2 },
  ordered_list:     { marginVertical: 2 },
  list_item:        { marginVertical: 1 },
  bullet_list_icon: { color: COLORS.bistroGold, fontSize: 14, lineHeight: 21, marginRight: 6 },
  heading1:         { fontSize: 16, fontWeight: '700' as const, color: COLORS.bistroBrown, marginBottom: 4 },
  heading2:         { fontSize: 15, fontWeight: '600' as const, color: COLORS.bistroBrown, marginBottom: 3 },
  paragraph:        { marginTop: 0, marginBottom: 2, fontSize: 14, lineHeight: 21, color: COLORS.bistroBrown },
  code_inline:      { backgroundColor: 'rgba(61,43,31,0.08)', borderRadius: 4, paddingHorizontal: 4, fontSize: 13, color: COLORS.bistroBrown },
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    marginVertical: 7,
  },
  rowUser: { flexDirection: 'row-reverse' },
  rowAi:   {},
  col:     { maxWidth: '82%' },
  colUser: { alignItems: 'flex-end' },

  avatarAi: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.bistroGold,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatarTextAi: { color: '#fff', fontSize: 13, fontWeight: '600', fontStyle: 'italic' },

  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  bubbleUser: { backgroundColor: COLORS.bistroBrown, borderBottomRightRadius: 4 },
  bubbleAi:   { backgroundColor: COLORS.card, borderWidth: 0.5, borderColor: COLORS.border, borderBottomLeftRadius: 4 },
  text:     { fontSize: 14, lineHeight: 21, color: COLORS.bistroBrown },
  textUser: { color: '#fff' },
  time:     { fontSize: 10, color: COLORS.medGray, marginTop: 3 },
  timeUser: { textAlign: 'right' },

  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2 },
  dot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.medGray },
});
