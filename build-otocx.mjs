// Carte animée oto.cx « L'OS pour vous et votre agent » : capture CDP -> mp4 + gif.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const DIR = process.cwd();
const FILE = `file://${DIR}/anim-otocx.html?capture=1`;
const W = 1200, H = 1500, FPS = 25;
const FDIR = `${DIR}/frames-otocx`;
rmSync(FDIR, { recursive: true, force: true });
mkdirSync(FDIR, { recursive: true });
mkdirSync(`${DIR}/out`, { recursive: true });

const PORT = 9334;
const chrome = spawn('google-chrome', [
  '--headless=new','--disable-gpu','--hide-scrollbars','--no-first-run','--no-default-browser-check',
  '--user-data-dir=/tmp/oto-build-chrome-otocx',
  `--remote-debugging-port=${PORT}`,'--force-device-scale-factor=1','about:blank'
], { stdio: 'ignore' });

let msgId = 0; const pending = new Map();
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
function send(method, params={}){ const id=++msgId; ws.send(JSON.stringify({ id, method, params })); return new Promise((res,rej)=>pending.set(id,{res,rej})); }
const { targetId } = await send('Target.createTarget',{ url:'about:blank' });
const { sessionId } = await send('Target.attachToTarget',{ targetId, flatten:true });
function ss(method, params={}){ const id=++msgId; ws.send(JSON.stringify({ id, sessionId, method, params })); return new Promise((res,rej)=>pending.set(id,{res,rej})); }

await ss('Page.enable');
await ss('Runtime.enable');
await ss('Emulation.setDeviceMetricsOverride',{ width:W, height:H, deviceScaleFactor:1, mobile:false });
await ss('Page.navigate',{ url:FILE });
await sleep(1500);
await ss('Runtime.evaluate',{ expression:'document.fonts.ready.then(()=>1)', awaitPromise:true });

const { result } = await ss('Runtime.evaluate',{ expression:'window.__DURATION' });
const DURATION = result.value;
const FRAMES = Math.round(DURATION/1000*FPS);
for(let f=0; f<FRAMES; f++){
  const t = Math.round(f/FPS*1000);
  await ss('Runtime.evaluate',{ expression:`window.__seek(${t})` });
  const { data } = await ss('Page.captureScreenshot',{ format:'png', clip:{ x:0,y:0,width:W,height:H,scale:1 }, captureBeyondViewport:true });
  writeFileSync(`${FDIR}/frame_${String(f).padStart(4,'0')}.png`, Buffer.from(data,'base64'));
  if(f%25===0) process.stderr.write(`frame ${f}/${FRAMES}\n`);
}
process.stderr.write(`capture done: ${FRAMES} frames\n`);
chrome.kill('SIGKILL');

const mp4 = `${DIR}/out/otocx-os.mp4`, gif = `${DIR}/out/otocx-os.gif`, pal = `${FDIR}/pal.png`;
spawnSync('ffmpeg',['-y','-framerate',String(FPS),'-i',`${FDIR}/frame_%04d.png`,'-c:v','libx264','-pix_fmt','yuv420p','-crf','18','-movflags','+faststart',mp4],{stdio:'ignore'});
const gifArgs = 'fps=18,scale=720:-1:flags=lanczos';
spawnSync('ffmpeg',['-y','-i',mp4,'-vf',`${gifArgs},palettegen=stats_mode=diff`,pal],{stdio:'ignore'});
spawnSync('ffmpeg',['-y','-i',mp4,'-i',pal,'-lavfi',`${gifArgs} [x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3`,gif],{stdio:'ignore'});
process.stderr.write(`mp4 ${existsSync(mp4)?'ok':'FAIL'} · gif ${existsSync(gif)?'ok':'FAIL'}\n`);
process.exit(0);
