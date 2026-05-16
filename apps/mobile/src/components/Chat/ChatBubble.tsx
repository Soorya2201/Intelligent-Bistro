import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle, withTiming, useSharedValue,
  FadeInDown, withDelay, withRepeat, withSequence,
} from 'react-native-reanimated';
import Markdown from 'react-native-markdown-display';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import MenuMicroTile from './MenuMicroTile';
import { SuggestedItem, RecommendationItem, ToolCallRecord } from '../../types';
import RecommendationCard from './RecommendationCard';

interface ChatBubbleProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isStreaming?: boolean;
    suggestedItems?: SuggestedItem[];
    recommendations?: RecommendationItem[];
    toolCalls?: ToolCallRecord[];
    inputMethod?: 'voice' | 'text';
  };
}

function Dot({ delay }: { delay: number }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-5, { duration: 300 }),
          withTiming(0,  { duration: 300 }),
        ),
        -1,
        false,
      ),
    );
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

function ActionChip({ toolCall }: { toolCall: ToolCallRecord }) {
  const [expanded, setExpanded] = useState(false);
  const isApplied = toolCall.status === 'applied';

  const chipColor = isApplied ? COLORS.success : COLORS.danger;
  const label = toolCall.name.replace(/_/g, ' ');

  return (
    <TouchableOpacity
      onLongPress={() => setExpanded(e => !e)}
      activeOpacity={0.7}
    >
      <View style={[styles.actionChip, { borderColor: chipColor }]}>
        <Feather
          name={isApplied ? 'check-circle' : 'x-circle'}
          size={11}
          color={chipColor}
        />
        <Text style={[styles.actionChipText, { color: chipColor }]}>{label}</Text>
      </View>
      {expanded && (
        <View style={styles.inspectorCard}>
          <Text style={styles.inspectorTitle}>AI Tool Inspector</Text>
          <View style={styles.inspectorRow}>
            <Text style={styles.inspectorLabel}>Tool</Text>
            <Text style={styles.inspectorValue}>{toolCall.name}</Text>
          </View>
          <View style={styles.inspectorRow}>
            <Text style={styles.inspectorLabel}>Status</Text>
            <Text style={[styles.inspectorStatus, { color: chipColor }]}>
              {isApplied ? '✓ Applied' : '✗ Rejected'}
            </Text>
          </View>
          {toolCall.rejectionReason && (
            <View style={styles.inspectorRow}>
              <Text style={styles.inspectorLabel}>Reason</Text>
              <Text style={styles.inspectorValue}>{toolCall.rejectionReason}</Text>
            </View>
          )}
          <Text style={styles.inspectorJson}>
            {JSON.stringify(toolCall.input, null, 2)}
          </Text>
          <Text style={styles.inspectorFooter}>Long-press to dismiss</Text>
        </View>
      )}
    </TouchableOpacity>
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

  const hasTiles = !isUser && !!message.suggestedItems?.length;
  const hasRecs  = !isUser && !!message.recommendations?.length;
  const hasTools = !isUser && !!message.toolCalls?.length;

  return (
    <Animated.View
      entering={FadeInDown.duration(280).springify().damping(18)}
      style={styles.outerCol}
    >
      <View style={[styles.row, isUser ? styles.rowUser : styles.rowAi]}>
        {!isUser && (
          <View style={styles.avatarAi}>
            <Text style={styles.avatarTextAi}>B</Text>
          </View>
        )}

        <View style={[styles.col, isUser && styles.colUser]}>
          <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi,
            isUser && message.inputMethod === 'voice' && styles.bubbleVoice]}>
            {isTyping ? (
              <TypingDots />
            ) : isUser ? (
              <Text style={[styles.text, styles.textUser]}>{content}</Text>
            ) : (
              <Markdown style={markdownStyles}>{content}</Markdown>
            )}
          </View>

          {/* Input method indicator for user messages */}
          {isUser && message.inputMethod && (
            <View style={styles.methodIndicator}>
              <Feather
                name={message.inputMethod === 'voice' ? 'mic' : 'type'}
                size={10}
                color={COLORS.medGray}
              />
            </View>
          )}

          {/* Tool action chips */}
          {hasTools && (
            <View style={styles.chipRow}>
              {message.toolCalls!.map((tc, i) => (
                <ActionChip key={i} toolCall={tc} />
              ))}
            </View>
          )}

          <Text style={[styles.time, isUser && styles.timeUser]}>{timeStr}</Text>
        </View>
      </View>

      {hasTiles && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tilesScroll}
          contentContainerStyle={styles.tilesContent}
        >
          {message.suggestedItems!.map(item => (
            <MenuMicroTile key={item.id} item={item} />
          ))}
        </ScrollView>
      )}

      {hasRecs && (
        <View style={styles.recsSection}>
          <Text style={styles.recsLabel}>You might also like →</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recsContent}
          >
            {message.recommendations!.map(item => (
              <RecommendationCard key={item.item_id} item={item} compact />
            ))}
          </ScrollView>
        </View>
      )}
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
  outerCol:  { marginVertical: 7 },
  row:       { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 20 },
  tilesScroll:  { marginTop: 8 },
  tilesContent: { paddingHorizontal: 20, paddingBottom: 2 },
  recsSection:  { marginTop: 10, paddingLeft: 60 },
  recsLabel:    { fontSize: 11, color: COLORS.medGray, fontWeight: '600', marginBottom: 6, paddingLeft: 20 },
  recsContent:  { paddingHorizontal: 20, gap: 8 },
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

  bubble:     { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  bubbleUser: { backgroundColor: COLORS.bistroBrown, borderBottomRightRadius: 4 },
  bubbleVoice: { backgroundColor: '#3D2B35' },  // slight purple tint for voice messages
  bubbleAi:   { backgroundColor: COLORS.card, borderWidth: 0.5, borderColor: COLORS.border, borderBottomLeftRadius: 4 },
  text:       { fontSize: 14, lineHeight: 21, color: COLORS.bistroBrown },
  textUser:   { color: '#fff' },
  time:       { fontSize: 10, color: COLORS.medGray, marginTop: 3 },
  timeUser:   { textAlign: 'right' },

  methodIndicator: {
    alignSelf: 'flex-end',
    marginTop: 2,
    marginRight: 2,
    opacity: 0.5,
  },

  chipRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 4,
    marginTop: 6,
  },
  actionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 0.5, borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  actionChipText: { fontSize: 10, fontWeight: '600' },

  inspectorCard: {
    marginTop: 6,
    backgroundColor: COLORS.bistroBrown,
    borderRadius: 12,
    padding: 12,
    maxWidth: 280,
  },
  inspectorTitle:  { color: COLORS.bistroGold, fontSize: 11, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 },
  inspectorRow:    { flexDirection: 'row', gap: 8, marginBottom: 4 },
  inspectorLabel:  { fontSize: 10, color: COLORS.medGray, width: 50 },
  inspectorValue:  { fontSize: 10, color: '#fff', flex: 1 },
  inspectorStatus: { fontSize: 10, fontWeight: '700' },
  inspectorJson:   {
    fontSize: 9, color: COLORS.bistroWarm, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 8, lineHeight: 14,
  },
  inspectorFooter: { fontSize: 9, color: COLORS.medGray, marginTop: 8, textAlign: 'center' },

  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2 },
  dot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.medGray },
});

import { Platform } from 'react-native';
