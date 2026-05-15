import * as Speech from 'expo-speech';
import { useCallback } from 'react';
import { useStore } from '../store';

export function useTTS() {
  const setAiSpeaking = useStore(state => state.setAiSpeaking);

  const speak = useCallback((text: string) => {
    // Strip sentinel blocks before speaking
    let cleaned = text.replace(/✦ACTION✦.*?✦END✦/gs, '');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    if (!cleaned) return;

    Speech.stop();

    Speech.speak(cleaned, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.95,
      onStart: () => setAiSpeaking(true),
      onDone: () => setAiSpeaking(false),
      onError: () => setAiSpeaking(false),
      onStopped: () => setAiSpeaking(false),
    });
  }, [setAiSpeaking]);

  const stop = useCallback(() => {
    Speech.stop();
    setAiSpeaking(false);
  }, [setAiSpeaking]);

  return { speak, stop };
}
