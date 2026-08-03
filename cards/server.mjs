// Studio local : formulaire + preview live + export MP4/GIF (moteur Chrome headless + ffmpeg).
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));   // cards/
const ROOT = join(DIR, '..');
const PORT = 7842, W = 1080, H = 1080, FPS = 25;
const fonts = readFileSync(`${ROOT}/assets/fonts.css`,'utf8');
const icons = readFileSync(`${ROOT}/assets/icons.json`,'utf8');           // JSON text
const iconKeys = Object.keys(JSON.parse(icons));
const tpl   = readFileSync(`${DIR}/template-body.html`,'utf8');
const cases = JSON.parse(readFileSync(`${DIR}/usecases.json`,'utf8'));
const rePath = f => (readFileSync(`${ROOT}/assets/logos/${f}`,'utf8').match(/<path[^>]*\sd="([^"]+)"/)||[])[1];
const LOGO = { claude:rePath('logo_claude.svg'), mistral:rePath('logo_mistralai.svg'), openai:rePath('logo_openai.svg') };
mkdirSync(`${ROOT}/out`, { recursive:true });
mkdirSync(`${ROOT}/.gen`, { recursive:true });

function buildHtml(uc){
  const data = `<script>window.__ICONS=${icons};window.__UC=${JSON.stringify(uc)};</script>`;
  const body = tpl.replace('<!--__DATA__-->', data).replace('/* __FONTS__ */', fonts)
    .replace('__CLAUDE__', LOGO.claude).replace('__MISTRAL__', LOGO.mistral).replace('__OPENAI__', LOGO.openai);
  return `<!doctype html>\n<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>oto studio preview</title></head><body>\n${body}\n</body></html>`;
}

/* ---------- Chrome persistant (CDP via WebSocket natif) ---------- */
let ws, sessionId, msgId=0; const pending=new Map();
function send(method,params={}){ const id=++msgId; ws.send(JSON.stringify({id,method,params})); return new Promise((r,j)=>pending.set(id,{r,j})); }
function ss(method,params={}){ const id=++msgId; ws.send(JSON.stringify({id,sessionId,method,params})); return new Promise((r,j)=>pending.set(id,{r,j})); }
async function initChrome(){
  spawn('google-chrome',['--headless=new','--disable-gpu','--hide-scrollbars','--no-first-run','--no-default-browser-check',
    `--remote-debugging-port=9355`,`--window-size=${W},${H}`,'--force-device-scale-factor=1','about:blank'],{stdio:'ignore'});
  let url;
  for(let i=0;i<60;i++){ try{ const r=await fetch('http://127.0.0.1:9355/json/version'); url=(await r.json()).webSocketDebuggerUrl; if(url) break; }catch{} await sleep(100); }
  ws=new WebSocket(url); await new Promise(r=>ws.addEventListener('open',r,{once:true}));
  ws.addEventListener('message',ev=>{ const m=JSON.parse(ev.data); if(m.id&&pending.has(m.id)){ const p=pending.get(m.id); pending.delete(m.id); m.error?p.j(new Error(m.error.message)):p.r(m.result);} });
  const {targetId}=await send('Target.createTarget',{url:'about:blank',width:W,height:H});
  ({sessionId}=await send('Target.attachToTarget',{targetId,flatten:true}));
  await ss('Page.enable'); await ss('Runtime.enable');
  await ss('Emulation.setDeviceMetricsOverride',{width:W,height:H,deviceScaleFactor:1,mobile:false});
}
async function evalJs(expr,awaitPromise=false){ const r=await ss('Runtime.evaluate',{expression:expr,awaitPromise,returnByValue:true}); return r.result?.value; }

let renderChain = Promise.resolve();
function renderUc(uc){ renderChain = renderChain.then(()=>doRender(uc), ()=>doRender(uc)); return renderChain; }
async function doRender(uc){
  const base = 'gen-'+Date.now();
  const htmlPath = `${ROOT}/.gen/${base}.html`;
  const fdir = `${ROOT}/.gen/${base}`;
  writeFileSync(htmlPath, buildHtml(uc));
  rmSync(fdir,{recursive:true,force:true}); mkdirSync(fdir,{recursive:true});
  await ss('Page.navigate',{ url:`file://${htmlPath}?capture=1` });
  await sleep(900);
  await evalJs('document.fonts.ready.then(()=>1)', true);
  const duration = await evalJs('window.__DURATION') || 6800;
  const frames = Math.round(duration/1000*FPS);
  for(let f=0; f<frames; f++){
    const t = Math.round(f/FPS*1000);
    await ss('Runtime.evaluate',{ expression:`window.__seek(${t})` });
    const { data } = await ss('Page.captureScreenshot',{ format:'png', clip:{x:0,y:0,width:W,height:H,scale:1}, captureBeyondViewport:true });
    writeFileSync(`${fdir}/frame_${String(f).padStart(4,'0')}.png`, Buffer.from(data,'base64'));
  }
  const mp4 = `${ROOT}/out/${base}.mp4`, gif = `${ROOT}/out/${base}.gif`;
  spawnSync('ffmpeg',['-y','-framerate',String(FPS),'-i',`${fdir}/frame_%04d.png`,'-c:v','libx264','-pix_fmt','yuv420p','-crf','18','-movflags','+faststart',mp4],{stdio:'ignore'});
  spawnSync('ffmpeg',['-y','-i',mp4,'-vf','fps=18,scale=640:-1:flags=lanczos,palettegen=stats_mode=diff',`${fdir}/pal.png`],{stdio:'ignore'});
  spawnSync('ffmpeg',['-y','-i',mp4,'-i',`${fdir}/pal.png`,'-lavfi','fps=18,scale=640:-1:flags=lanczos,paletteuse=dither=bayer:bayer_scale=3',gif],{stdio:'ignore'});
  rmSync(fdir,{recursive:true,force:true}); rmSync(htmlPath,{force:true});
  return { mp4:`/out/${base}.mp4`, gif:`/out/${base}.gif`, base };
}

/* ---------- HTTP ---------- */
const CT = { '.mp4':'video/mp4', '.gif':'image/gif', '.html':'text/html; charset=utf-8', '.png':'image/png' };
function studioHtml(){
  const opts = iconKeys.map(k=>`<option value="${k}">${k}</option>`).join('');
  return readFileSync(`${DIR}/studio.html`,'utf8')
    .replace('__ICON_OPTIONS__', opts)
    .replace('__DEFAULT_UC__', JSON.stringify(cases[0]))
    .replace('__ALL_UC__', JSON.stringify(cases));
}
const server = http.createServer(async (req,res)=>{
  try{
    const u = new URL(req.url, `http://localhost:${PORT}`);
    if(req.method==='GET' && u.pathname==='/'){ res.writeHead(200,{'Content-Type':CT['.html']}); return res.end(studioHtml()); }
    if(req.method==='GET' && u.pathname==='/preview'){ res.writeHead(200,{'Content-Type':CT['.html']}); return res.end(buildHtml(cases[0])); }
    if(req.method==='POST' && u.pathname==='/render'){
      let b=''; req.on('data',c=>b+=c); req.on('end', async ()=>{
        try{ const uc=JSON.parse(b); const out=await renderUc(uc); res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify(out)); }
        catch(e){ res.writeHead(500,{'Content-Type':'application/json'}); res.end(JSON.stringify({error:String(e)})); }
      }); return;
    }
    if(req.method==='GET' && u.pathname.startsWith('/out/')){
      const p = ROOT + u.pathname; if(!existsSync(p)){ res.writeHead(404); return res.end('nope'); }
      const ext = p.slice(p.lastIndexOf('.')); res.writeHead(200,{'Content-Type':CT[ext]||'application/octet-stream'});
      return res.end(readFileSync(p));
    }
    res.writeHead(404); res.end('not found');
  }catch(e){ res.writeHead(500); res.end(String(e)); }
});

await initChrome();
server.listen(PORT, ()=>console.error(`studio prêt → http://localhost:${PORT}`));
