import { useState, useRef, useCallback, useEffect } from 'react';

export function useVoiceInput(
  onTranscript: (text: string) => void,
  _speechRef?: any,
) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);

  const startListening = useCallback(async () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError('Voice recognition is not supported in this browser. Use the text box to order.');
      return;
    }

    try {
      const recognition = new SR();
      recognitionRef.current = recognition;
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onresult = (event: any) => {
        const result = event.results[event.results.length - 1];
        const text = result[0].transcript;
        setTranscript(text);
        if (result.isFinal) {
          onTranscriptRef.current(text);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setTranscript('');
      };

      recognition.onerror = (event: any) => {
        const friendly: Record<string, string> = {
          'not-allowed': 'Microphone permission denied. Allow access in your browser settings.',
          'no-speech': 'No speech detected. Try speaking closer to the mic.',
          'network': 'Network error during recognition. Check your connection.',
          'aborted': '',
        };
        const msg = friendly[event.error] ?? event.error ?? 'Speech recognition error';
        if (msg) setError(msg);
        setIsListening(false);
      };

      setError(null);
      setTranscript('');
      setIsListening(true);
      recognition.start();
    } catch (err: any) {
      setError(err.message || 'Could not start voice recognition.');
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    error,
    // no-ops so ChatScreen can destructure the same shape on all platforms
    onSpeechResult: (_text: string, _isFinal: boolean) => {},
    onSpeechEnd:    () => {},
    onSpeechError:  (_msg: string) => {},
  };
}
