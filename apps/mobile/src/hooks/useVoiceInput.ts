import { useState, useRef, useCallback, useEffect } from 'react';
import { SpeechWebViewRef } from '../components/Chat/SpeechWebView';

export function useVoiceInput(
  onTranscript: (text: string) => void,
  speechRef?: React.RefObject<SpeechWebViewRef>,
) {
  const [isListening, setIsListening] = useState(false);
  const [transcript,  setTranscript]  = useState('');
  const [error,       setError]       = useState<string | null>(null);

  const onTranscriptRef   = useRef(onTranscript);
  const pendingTranscript = useRef('');
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);

  const handleResult = useCallback((text: string, isFinal: boolean) => {
    setTranscript(text);
    pendingTranscript.current = text;
    if (isFinal) {
      pendingTranscript.current = '';
      onTranscriptRef.current(text);
    }
  }, []);

  const handleEnd = useCallback(() => {
    const pending = pendingTranscript.current.trim();
    pendingTranscript.current = '';
    setIsListening(false);
    setTranscript('');
    if (pending) onTranscriptRef.current(pending);
  }, []);

  const handleError = useCallback((msg: string) => {
    pendingTranscript.current = '';
    setError(msg);
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!speechRef?.current) { setError('Voice input not ready.'); return; }
    setError(null);
    setTranscript('');
    pendingTranscript.current = '';
    setIsListening(true);
    speechRef.current.start();
  }, [speechRef]);

  const stopListening = useCallback(() => {
    // Update state immediately — don't wait for the WebView's onend event,
    // which may never fire if Android STT doesn't produce results.
    const pending = pendingTranscript.current.trim();
    pendingTranscript.current = '';
    setIsListening(false);
    setTranscript('');
    speechRef?.current?.stop();
    if (pending) onTranscriptRef.current(pending);
  }, [speechRef]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    error,
    onSpeechResult: handleResult,
    onSpeechEnd:    handleEnd,
    onSpeechError:  handleError,
  };
}
