import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export interface SpeechWebViewRef {
  start: () => void;
  stop:  () => void;
}

interface Props {
  onResult: (transcript: string, isFinal: boolean) => void;
  onEnd:    () => void;
  onError:  (error: string) => void;
}

const SPEECH_HTML = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/></head>
<body><script>
var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
var rec = null;

function post(obj) {
  try { window.ReactNativeWebView.postMessage(JSON.stringify(obj)); } catch(e) {}
}

if (!SR) {
  post({ type: 'error', message: 'not-supported' });
} else {
  rec = new SR();
  rec.lang           = 'en-US';
  rec.interimResults = true;
  rec.continuous     = false;
  rec.maxAlternatives = 1;

  rec.onstart = function() { post({ type: 'started' }); };

  rec.onresult = function(e) {
    var r = e.results[e.results.length - 1];
    post({ type: 'result', transcript: r[0].transcript, isFinal: r.isFinal });
  };

  rec.onend   = function()  { post({ type: 'end' }); };
  rec.onerror = function(e) { post({ type: 'error', message: e.error || 'error' }); };
}

// Commands arrive via injectJavaScript — these functions are called directly.
function rnStart() {
  if (!rec) return;
  try { rec.abort(); } catch(_) {}
  setTimeout(function() {
    try { rec.start(); } catch(e) { post({ type: 'error', message: e.message || 'start-failed' }); }
  }, 100);
}
function rnStop() {
  if (!rec) return;
  try { rec.abort(); } catch(_) {}
}
<\/script></body></html>`;

const SpeechWebView = forwardRef<SpeechWebViewRef, Props>(
  ({ onResult, onEnd, onError }, ref) => {
    const webViewRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      // injectJavaScript runs directly in the WebView JS context — far more
      // reliable on Android than postMessage for imperative commands.
      start: () => webViewRef.current?.injectJavaScript('rnStart(); true;'),
      stop:  () => webViewRef.current?.injectJavaScript('rnStop(); true;'),
    }));

    const handleMessage = (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'result')  onResult(data.transcript, data.isFinal);
        if (data.type === 'end')     onEnd();
        if (data.type === 'error' && data.message && data.message !== 'aborted') {
          onError(
            data.message === 'not-supported' ? 'Speech recognition not supported on this device.' :
            data.message === 'not-allowed'   ? 'Microphone permission denied.' :
            'Speech error: ' + data.message
          );
        }
      } catch (_) {}
    };

    return (
      <WebView
        ref={webViewRef}
        style={styles.hidden}
        source={{ html: SPEECH_HTML, baseUrl: 'http://localhost' }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        originWhitelist={['*']}
        onPermissionRequest={(e: any) => {
          const req = e?.nativeEvent ?? e;
          if (req?.grant) req.grant(req.resources ?? []);
        }}
      />
    );
  }
);

const styles = StyleSheet.create({
  hidden: { position: 'absolute', top: -9999, left: -9999, width: 1, height: 1 },
});

export default SpeechWebView;
