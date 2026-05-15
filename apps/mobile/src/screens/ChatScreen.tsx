import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import {
  View, SafeAreaView, KeyboardAvoidingView, Platform,
  Text, TextInput, TouchableOpacity, StyleSheet, Modal,
  Animated, Easing,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useStore } from '../store';
import ChatList from '../components/Chat/ChatList';
import QuickReplyChips from '../components/Chat/QuickReplyChips';
import SpeechWebView, { SpeechWebViewRef } from '../components/Chat/SpeechWebView';
import WaveBar from '../components/Chat/WaveBar';
import CartSheet from '../components/Cart/CartSheet';
import { useStreamParser } from '../hooks/useStreamParser';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { useTTS } from '../hooks/useTTS';
import { streamChat } from '../services/api';
import { COLORS } from '../constants/theme';

function CartHeaderButton({ onPress }: { onPress: () => void }) {
  const itemCount = useStore(s => s.getItemCount());
  const scale     = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (itemCount === 0) return;
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.45, useNativeDriver: true, speed: 22, bounciness: 14 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 22 }),
    ]).start();
  }, [itemCount]);

  return (
    <TouchableOpacity onPress={onPress} style={styles.cartBtn} activeOpacity={0.7}>
      <Feather name="shopping-bag" size={22} color={COLORS.bistroBrown} />
      {itemCount > 0 && (
        <Animated.View style={[styles.cartBadge, { transform: [{ scale }] }]}>
          <Text style={styles.cartBadgeText}>{itemCount}</Text>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
}

export default function ChatScreen() {
  const navigation   = useNavigation<any>();
  const headerHeight = useHeaderHeight();
  const [cartVisible, setCartVisible] = useState(false);
  const [textInput, setTextInput]     = useState('');

  const messages      = useStore(s => s.messages);
  const cartItems     = useStore(s => s.items);
  const profile       = useStore(s => s);
  const quickReplies  = useStore(s => s.quickReplies);
  const isStreaming   = useStore(s => s.isStreaming);

  const addMessage                   = useStore(s => s.addMessage);
  const setStreaming                  = useStore(s => s.setStreaming);
  const appendToLastAssistantMessage = useStore(s => s.appendToLastAssistantMessage);
  const addRestriction               = useStore(s => s.addRestriction);
  const clearQuickReplies            = useStore(s => s.clearQuickReplies);

  const { processChunk, reset } = useStreamParser();
  const { speak, stop: stopTTS } = useTTS();

  const speechRef = useRef<SpeechWebViewRef>(null);

  const {
    isListening, transcript, startListening, stopListening, error: voiceError,
    onSpeechResult, onSpeechEnd, onSpeechError,
  } = useVoiceInput(
    (finalText) => { if (finalText.trim()) handleSend(finalText); },
    speechRef,
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <CartHeaderButton onPress={() => setCartVisible(true)} />,
    });
  }, [navigation]);

  const waveBarHeight = useRef(new Animated.Value(0)).current;

  // Pulse ring + wave bar animations
  const pulseScale   = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    Animated.timing(waveBarHeight, {
      toValue: isListening ? 90 : 0,
      duration: 420,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();

    if (isListening) {
      pulseLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseScale,   { toValue: 1.8, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(pulseOpacity, { toValue: 0,   duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(pulseScale,   { toValue: 1,   duration: 0, useNativeDriver: true }),
            Animated.timing(pulseOpacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
          ]),
        ])
      );
      pulseOpacity.setValue(0.5);
      pulseScale.setValue(1);
      pulseLoopRef.current.start();
    } else {
      pulseLoopRef.current?.stop();
      // stopAnimation callback fires after the native thread fully halts,
      // preventing the race where setValue is overridden by an in-flight frame.
      pulseOpacity.stopAnimation(() => pulseOpacity.setValue(0));
      pulseScale.stopAnimation(() => pulseScale.setValue(1));
    }
  }, [isListening]);

  const detectDietary = (text: string) => {
    const keywords = ['vegan','vegetarian','gluten-free','no nuts','nut allergy','dairy-free','lactose','kosher','halal'];
    const lower = text.toLowerCase();
    keywords.forEach(kw => { if (lower.includes(kw)) addRestriction(kw); });
  };

  const handleSend = async (text: string) => {
    detectDietary(text);
    const userMsg = { id: Date.now().toString(), role: 'user' as const, content: text, timestamp: new Date() };
    addMessage(userMsg);
    const astMsg  = { id: (Date.now() + 1).toString(), role: 'assistant' as const, content: '', timestamp: new Date(), isStreaming: true };
    addMessage(astMsg);
    setStreaming(true);
    reset();
    const currentMessages = [...messages, userMsg];
    await streamChat(
      currentMessages,
      cartItems,
      { restrictions: profile.restrictions },
      (chunk) => {
        const { visibleText } = processChunk(chunk);
        if (visibleText) appendToLastAssistantMessage(visibleText);
      },
      () => {
        setStreaming(false);
        const latest = useStore.getState().messages;
        const last   = latest[latest.length - 1];
        if (last?.role === 'assistant') speak(last.content);
      },
      (err) => {
        console.error('Stream error:', err);
        appendToLastAssistantMessage('\n[Error: could not reach server]');
        setStreaming(false);
      }
    );
  };

  const handleTextSend = () => {
    const t = textInput.trim();
    if (!t || isStreaming) return;
    setTextInput('');
    handleSend(t);
  };

  const handleQuickReply = (reply: string) => {
    clearQuickReplies();
    handleSend(reply);
  };

  const toggleMic = () => {
    if (isListening) stopListening();
    else { stopTTS(); startListening(); }
  };

  // What to display in the text input
  const inputDisplayValue = isListening ? transcript : textInput;
  const inputPlaceholder  = isListening
    ? 'Listening…'
    : isStreaming
    ? 'Bistro is thinking…'
    : 'Type your order…';

  return (
    <SafeAreaView style={styles.root}>

      <SpeechWebView
        ref={speechRef}
        onResult={onSpeechResult}
        onEnd={onSpeechEnd}
        onError={onSpeechError}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={headerHeight}
      >

        <View style={{ flex: 1 }}>
          <ChatList />
        </View>

        {quickReplies.length > 0 && (
          <QuickReplyChips onSelect={handleQuickReply} />
        )}

        <View style={styles.inputZone}>

          {voiceError ? (
            <Text style={styles.voiceError} numberOfLines={2}>{voiceError}</Text>
          ) : null}

          <Animated.View style={{ height: waveBarHeight, overflow: 'hidden' }}>
            <WaveBar isActive={isListening} mode="user" />
          </Animated.View>

          <View style={styles.inputRow}>

            {/* Mic button with pulse ring */}
            <View style={styles.micWrap}>
              <Animated.View style={[
                styles.pulseRing,
                { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
              ]} />
              <TouchableOpacity
                onPress={toggleMic}
                style={[styles.micBtn, isListening && styles.micBtnActive]}
              >
                <Feather name="mic" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Unified text input — shows transcript when listening */}
            <TextInput
              style={[styles.textInput, isListening && styles.textInputRecording]}
              placeholder={inputPlaceholder}
              placeholderTextColor={isListening ? COLORS.bistroGold : COLORS.medGray}
              value={inputDisplayValue}
              onChangeText={isListening ? undefined : setTextInput}
              onSubmitEditing={handleTextSend}
              returnKeyType="send"
              editable={!isStreaming && !isListening}
              multiline
            />

            {/* Stop button — visible only while listening */}
            {isListening && (
              <TouchableOpacity style={styles.stopBtn} onPress={stopListening}>
                <Feather name="square" size={14} color={COLORS.bistroBrown} />
              </TouchableOpacity>
            )}

            {/* Send button — visible only when not listening */}
            {!isListening && (
              <TouchableOpacity
                onPress={handleTextSend}
                disabled={!textInput.trim() || isStreaming}
                style={[
                  styles.sendBtn,
                  (!textInput.trim() || isStreaming) && styles.sendBtnDisabled,
                ]}
              >
                <Feather name="send" size={17} color="#fff" />
              </TouchableOpacity>
            )}

          </View>
        </View>

      </KeyboardAvoidingView>

      <Modal visible={cartVisible} animationType="slide" transparent>
        <CartSheet onClose={() => setCartVisible(false)} />
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bistroCream },
  cartBtn: { marginRight: 16, padding: 4 },
  cartBadge: {
    position: 'absolute', top: -5, right: -6,
    backgroundColor: COLORS.bistroGold,
    borderRadius: 10, minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  inputZone: {
    borderTopWidth: 0.5, borderTopColor: COLORS.border,
    paddingHorizontal: 16, paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 12 : 14,
    backgroundColor: COLORS.bistroCream,
  },
  voiceError: {
    fontSize: 12, color: COLORS.danger, marginBottom: 6,
    paddingHorizontal: 4, lineHeight: 16,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  micWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  pulseRing: {
    position: 'absolute', width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.danger,
  },
  micBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.bistroGold,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.bistroGold, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35, shadowRadius: 6, elevation: 4,
  },
  micBtnActive: { backgroundColor: COLORS.danger, shadowColor: COLORS.danger },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.card, borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 11,
    fontSize: 14, color: COLORS.bistroBrown,
    borderWidth: 0.5, borderColor: COLORS.border, maxHeight: 100,
  },
  textInputRecording: { borderColor: COLORS.bistroGold, backgroundColor: '#fffdf8' },
  stopBtn: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 0.5, borderColor: COLORS.border,
    backgroundColor: COLORS.bistroCream2,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.bistroBrown,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: COLORS.bistroWarm },
});
