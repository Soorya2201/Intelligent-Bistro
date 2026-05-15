import React, { useRef, useEffect } from 'react';
import { View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

interface WaveBarProps {
  isActive: boolean;
  mode: 'user' | 'ai';
}

const WAVE_HTML = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no"/>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body{height:80px;overflow:hidden;background:transparent;}
canvas{display:block;width:100%;height:80px;}
</style>
</head>
<body>
<canvas id="c"></canvas>
<script>
const canvas=document.getElementById('c');
const ctx=canvas.getContext('2d');
const DPR=window.devicePixelRatio||1;
let mode='user', phase=0, waveAmp=0, waveTarget=0;
function resize(){
  const w=window.innerWidth||400;
  canvas.width=w*DPR; canvas.height=80*DPR;
  canvas.style.width=w+'px'; canvas.style.height='80px';
  ctx.setTransform(DPR,0,0,DPR,0,0);
}
resize();
window.addEventListener('resize',resize);
function draw(){
  const w=canvas.width/DPR, h=canvas.height/DPR;
  ctx.clearRect(0,0,w,h);
  waveAmp+=(waveTarget-waveAmp)*0.09;
  phase+=0.06;
  const color=mode==='user'?'#C9933A':'#5A7A3A';
  for(let layer=0;layer<3;layer++){
    const a=waveAmp*(1-layer*0.25);
    const f=1.8+layer*0.4;
    const ph=phase+layer*0.8;
    const op=(0.55-layer*0.15)*(waveAmp/45);
    const hex=Math.round(Math.max(0,op)*255).toString(16).padStart(2,'0');
    ctx.beginPath();
    ctx.lineWidth=1.6-layer*0.4;
    const g=ctx.createLinearGradient(0,0,w,0);
    g.addColorStop(0,color+'00');
    g.addColorStop(0.15,color+hex);
    g.addColorStop(0.5,color+hex);
    g.addColorStop(0.85,color+hex);
    g.addColorStop(1,color+'00');
    ctx.strokeStyle=g;
    for(let x=0;x<=w;x+=1.5){
      const nx=x/w;
      const env=1-Math.pow(Math.abs(nx-0.5)*2,2.2);
      const y=h/2
        +Math.sin(nx*Math.PI*2*f+ph)*a*env
        +Math.sin(nx*Math.PI*2*(f*1.6)+ph*1.2)*a*0.3*env;
      x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }
    ctx.stroke();
  }
  requestAnimationFrame(draw);
}
draw();
function setMode(m){
  mode=m;
  waveTarget=(m==='idle')?0:38;
}
window.addEventListener('rn-state-update',function(e){
  if(e.detail&&e.detail.mode!==undefined) setMode(e.detail.mode);
});
window.addEventListener('message',function(e){
  try{const d=JSON.parse(e.data);if(d.mode!==undefined)setMode(d.mode);}catch(err){}
});
</script>
</body>
</html>
`;

export default function WaveBar({ isActive, mode }: WaveBarProps) {
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const m = isActive ? mode : 'idle';
    webViewRef.current?.injectJavaScript(`setMode('${m}'); true;`);
  }, [isActive, mode]);

  // WaveBar.web.tsx handles this platform. This guard prevents the WebView
  // fallback error text from appearing if Metro resolves this file on web.
  if (Platform.OS === 'web') return null;

  return (
    <View style={{ height: 80, width: '100%', overflow: 'hidden' }}>
      <WebView
        ref={webViewRef}
        source={{ html: WAVE_HTML }}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        scrollEnabled={false}
        bounces={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}
