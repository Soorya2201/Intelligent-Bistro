import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

const API_BASE         = 'http://100.64.155.208:3001';
const FETCH_TIMEOUT_MS = 20_000;

export function useVoiceInput(onTranscript: (text: string) => void, _speechRef?: any) {
  const [isListening, setIsListening] = useState(false);
  const [transcript,  setTranscript]  = useState('');
  const [error,       setError]       = useState<string | null>(null);

  const recordingRef    = useRef<Audio.Recording | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);

  const startListening = useCallback(async () => {
    setError(null);
    try {
      // Unload any previous recording before creating a new one — expo-av
      // only allows one active Recording at a time.
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') { setError('Microphone permission denied.'); return; }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setTranscript('');
      setIsListening(true);
      console.log('[Voice] Recording started');
    } catch (e: any) {
      console.error('[Voice] startListening failed:', e);
      setError('Could not start recording: ' + (e.message ?? 'unknown'));
    }
  }, []);

  const stopListening = useCallback(async () => {
    const recording = recordingRef.current;
    recordingRef.current = null;
    if (!recording) return; // already stopped / transcribing — ignore

    setTranscript('Transcribing…');
    console.log('[Voice] Recording stopped, beginning transcription');

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recording.getURI();
      console.log('[Voice] File URI:', uri);
      if (!uri) { setIsListening(false); setTranscript(''); setError('No audio file found.'); return; }

      const audioBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64' as any,
      });
      console.log('[Voice] Base64 length:', audioBase64.length, '— sending to backend');

      // Use XHR instead of fetch — fetch() with large POST bodies + AbortController
      // is unreliable on Android Hermes ("Network request failed").
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE}/transcribe`);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.timeout = FETCH_TIMEOUT_MS;

        xhr.onload = () => {
          console.log('[Voice] Backend response status:', xhr.status);
          if (xhr.status < 200 || xhr.status >= 300) {
            reject(new Error(`Server ${xhr.status}: ${xhr.responseText}`));
            return;
          }
          try {
            const data = JSON.parse(xhr.responseText);
            const text = (data.transcript ?? '').trim();
            console.log('[Voice] Transcript:', JSON.stringify(text));
            setIsListening(false);
            setTranscript('');
            if (text) onTranscriptRef.current(text);
            else      setError('No speech detected — try again.');
            resolve();
          } catch {
            reject(new Error('Invalid JSON from transcription server'));
          }
        };

        xhr.onerror   = () => reject(new Error('Cannot reach server — is the API running?'));
        xhr.ontimeout = () => reject(new Error(`Timed out — is the API server running at ${API_BASE}?`));

        xhr.send(JSON.stringify({ audioBase64, mimeType: 'audio/m4a' }));
      });
    } catch (e: any) {
      console.error('[Voice] Transcription error:', e);
      setIsListening(false);
      setTranscript('');
      setError('Transcription failed: ' + (e.message ?? 'Unknown error'));
    }
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    error,
    onSpeechResult: (_: string, __: boolean) => {},
    onSpeechEnd:    () => {},
    onSpeechError:  (_: string) => {},
  };
}
