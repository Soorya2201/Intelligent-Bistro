import { useCallback } from 'react';
import { useStore } from '../store';

export function useTTS() {
  const setAiSpeaking = useStore(state => state.setAiSpeaking);

  const speak = useCallback((text: string) => {
    let cleaned = text.replace(/✦ACTION✦.*?✦END✦/gs, '');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    if (!cleaned || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = 'en-US';
    utterance.pitch = 1.0;
    utterance.rate = 0.95;
    utterance.onstart = () => setAiSpeaking(true);
    utterance.onend = () => setAiSpeaking(false);
    utterance.onerror = () => setAiSpeaking(false);

    setAiSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [setAiSpeaking]);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setAiSpeaking(false);
  }, [setAiSpeaking]);

  return { speak, stop };
}
