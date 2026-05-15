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

// On web, voice input is handled directly by useVoiceInput.web.ts via the
// browser SpeechRecognition API — no WebView bridge needed.
const SpeechWebView = forwardRef<SpeechWebViewRef, Props>((_props, ref) => {
  useImperativeHandle(ref, () => ({
    start: () => {},
    stop:  () => {},
  }));
  return null;
});

export default SpeechWebView;
