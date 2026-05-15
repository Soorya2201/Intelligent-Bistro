import { forwardRef, useImperativeHandle } from 'react';

export interface SpeechWebViewRef {
  start: () => void;
  stop:  () => void;
}

interface Props {
  onResult: (transcript: string, isFinal: boolean) => void;
  onEnd:    () => void;
  onError:  (error: string) => void;
}

// Android voice input is handled by useVoiceInput.android.ts via expo-av + Whisper.
// The WebView-based Web Speech API is unreliable on Android System WebView.
const SpeechWebView = forwardRef<SpeechWebViewRef, Props>((_props, ref) => {
  useImperativeHandle(ref, () => ({
    start: () => {},
    stop:  () => {},
  }));
  return null;
});

export default SpeechWebView;
