// Génère les 10 cartes animées : template + data -> HTML -> capture CDP -> mp4 + gif.
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const DIR = process.cwd();
const FPS = 18, W = 1080, H = 1080;
const fonts   = readFileSync(`${DIR}/fonts.css`,'utf8');
const icons   = readFileSync(`${DIR}/icons.json`,'utf8');            // already JSON text
const tpl     = readFileSync(`${DIR}/template-body.html`,'utf8');
const cases   = JSON.parse(readFileSync(`${DIR}/usecases.json`,'utf8'));
const START = Number(process.argv[2] ?? 0);
const COUNT = Number(process.argv[3] ?? cases.length);
const slice = cases.slice(START, START + COUNT);
const rePath  = f => (readFileSync(`${DIR}/${f}`,'utf8').match(/<path[^>]*\sd="([^"]+)"/)||[])[1];
const LOGO = { claude:rePath('logo_claude.svg'), mistral:rePath('logo_mistralai.svg'), openai:rePath('logo_openai.svg') };

mkdirSync(`${DIR}/out`, { recursive:true });

// build the 10 HTML files
for(const uc of slice){
  let body = tpl
    .replace('<!--__DATA__-->', `<script>window.__ICONS=${icons};window.__UC=${JSON.stringify(uc)};</script>`)
    .replace('/* __FONTS__ */', fonts)
    .replace('__CLAUDE__', LOGO.claude).replace('__MISTRAL__', LOGO.mistral).replace('__OPENAI__', LOGO.openai);
  const html = `<!doctype html>\n<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>oto — ${uc.slug} (nº${uc.num})</title></head><body>\n${body}\n</body></html>`;
  writeFileSync(`${DIR}/anim-${uc.slug}.html`, html);
}
console.error(`HTML générés: ${cases.length}`);

// one Chrome, CDP over native WebSocket
const PORT = 9344;
const chrome = spawn('google-chrome', ['--headless=new','--disable-gpu','--hide-scrollbars','--no-first-run',
  '--no-default-browser-check','--user-data-dir=/tmp/oto-build-chrome',
  `--remote-debugging-port=${PORT}`,`--window-size=${W},${H}`,'--force-device-scale-factor=1','about:blank'],
  { stdio:'ignore' });

let msgId = 0; const pending = new Map();
async function wsUrl(){ for(let i=0;i<60;i++){ try{ const r=await fetch(`http://127.0.0.1:${PORT}/json/version`); const j=await r.json(); if(j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl; }catch{} await sleep(100);} throw new Error('no CDP'); }
const ws = new WebSocket(await wsUrl());
await new Promise(r=>ws.addEventListener('open', r, { once:true }));
ws.addEventListener('message', ev=>{ const m=JSON.parse(ev.data); if(m.id&&pending.has(m.id)){ const p=pending.get(m.id); pending.delete(m.id); m.error?p.rej(new Error(m.error.message)):p.res(m.result);} });

const { targetId } = await send('Target.createTarget',{ url:'about:blank' });
const { sessionId } = await send('Target.attachToTarget',{ targetId, flatten:true });
function send(method, params={}){ const id=++msgId; ws.send(JSON.stringify({ id, method, params })); return new Promise((res,rej)=>pending.set(id,{res,rej})); }
function ss(method, params={}){ const id=++msgId; ws.send(JSON.stringify({ id, sessionId, method, params })); return new Promise((res,rej)=>pending.set(id,{res,rej})); }

async function evalJs(expr, awaitPromise=false){ const r=await ss('Runtime.evaluate',{ expression:expr, awaitPromise, returnByValue:true }); return r.result?.value; }

await ss('Page.enable'); await ss('Runtime.enable');
await ss('Emulation.setDeviceMetricsOverride',{ width:W, height:H, deviceScaleFactor:1, mobile:false });

const summary = [];
for(const uc of slice){
  const fdir = `${DIR}/frames/${uc.slug}`; rmSync(fdir,{recursive:true,force:true}); mkdirSync(fdir,{recursive:true});
  await ss('Page.navigate',{ url:`file://${DIR}/anim-${uc.slug}.html?capture=1` });
  await sleep(900);
  await evalJs('document.fonts.ready.then(()=>1)', true);
  const duration = await evalJs('window.__DURATION') || 6800;
  const frames = Math.round(duration/1000*FPS);
  for(let f=0; f<frames; f++){
    const t = Math.round(f/FPS*1000);
    await ss('Runtime.evaluate',{ expression:`window.__seek(${t})` });
    const { data } = await ss('Page.captureScreenshot',{ format:'png', clip:{ x:0,y:0,width:W,height:H,scale:1 }, captureBeyondViewport:true });
    writeFileSync(`${fdir}/frame_${String(f).padStart(4,'0')}.png`, Buffer.from(data,'base64'));
  }
  // encode
  const gif = `${DIR}/out/${uc.num}-${uc.slug}.gif`, pal = `${fdir}/pal.png`;
  const gifArgs = 'fps=18,scale=720:-1:flags=lanczos';
  spawnSync('ffmpeg',['-y','-framerate',String(FPS),'-i',`${fdir}/frame_%04d.png`,'-vf',`${gifArgs},palettegen=stats_mode=diff`,pal],{stdio:'ignore'});
  spawnSync('ffmpeg',['-y','-framerate',String(FPS),'-i',`${fdir}/frame_%04d.png`,'-i',pal,'-lavfi',`${gifArgs} [x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3`,gif],{stdio:'ignore'});
  const ok = existsSync(gif);
  summary.push({ num:uc.num, slug:uc.slug, frames, ok });
  console.error(`[${uc.num}] ${uc.slug}: ${frames} frames, mp4 ${ok?'ok':'FAIL'}`);
}
chrome.kill('SIGKILL');
writeFileSync(`${DIR}/build-summary.json`, JSON.stringify(summary,null,2));
console.error('DONE');
process.exit(0);
