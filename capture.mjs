// Drive headless Chrome via CDP (Node native WebSocket) to capture deterministic frames.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const DIR = process.cwd();
const FILE = `file://${DIR}/anim.html?capture=1`;
const W = 1080, H = 1080;
const FPS = 25, DURATION = 6800;
const FRAMES = Math.round(DURATION/1000*FPS); // ~152
const OUT = `${DIR}/frames`;
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const PORT = 9333;
const chrome = spawn('google-chrome', [
  '--headless=new','--disable-gpu','--hide-scrollbars','--no-first-run','--no-default-browser-check',
  `--remote-debugging-port=${PORT}`,`--window-size=${W},${H}`,'--force-device-scale-factor=1',
  'about:blank'
], { stdio: 'ignore' });

let msgId = 0; const pending = new Map();
function send(ws, method, params={}){
  const id = ++msgId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res,rej)=>pending.set(id,{res,rej}));
}

async function getWsUrl(){
  for(let i=0;i<50;i++){
    try{
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      const j = await r.json();
      if(j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl;
    }catch{}
    await sleep(100);
  }
  throw new Error('Chrome DevTools indisponible');
}

const wsUrl = await getWsUrl();
const ws = new WebSocket(wsUrl);
await new Promise(r=>ws.addEventListener('open', r, { once:true }));
ws.addEventListener('message', ev=>{
  const m = JSON.parse(ev.data);
  if(m.id && pending.has(m.id)){ const p=pending.get(m.id); pending.delete(m.id); m.error?p.rej(new Error(m.error.message)):p.res(m.result); }
});

// Use the browser target -> create a page target and attach a session
const { targetId } = await send(ws,'Target.createTarget',{ url:'about:blank', width:W, height:H });
const { sessionId } = await send(ws,'Target.attachToTarget',{ targetId, flatten:true });
// session-scoped send
function ssend(method, params={}){
  const id = ++msgId;
  ws.send(JSON.stringify({ id, sessionId, method, params }));
  return new Promise((res,rej)=>pending.set(id,{res,rej}));
}
await ssend('Page.enable');
await ssend('Runtime.enable');
await ssend('Emulation.setDeviceMetricsOverride',{ width:W, height:H, deviceScaleFactor:1, mobile:false });
await ssend('Page.navigate',{ url:FILE });
await sleep(1200);                                  // load + font decode
await ssend('Runtime.evaluate',{ expression:'document.fonts.ready.then(()=>1)', awaitPromise:true });

for(let f=0; f<FRAMES; f++){
  const t = Math.round(f/FPS*1000);
  await ssend('Runtime.evaluate',{ expression:`window.__seek(${t})` });
  const { data } = await ssend('Page.captureScreenshot',{ format:'png', clip:{ x:0,y:0,width:W,height:H,scale:1 }, captureBeyondViewport:true });
  writeFileSync(`${OUT}/frame_${String(f).padStart(4,'0')}.png`, Buffer.from(data,'base64'));
  if(f%25===0) process.stderr.write(`frame ${f}/${FRAMES}\n`);
}
process.stderr.write(`done ${FRAMES} frames\n`);
chrome.kill('SIGKILL');
process.exit(0);
