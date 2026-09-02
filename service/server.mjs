// API du studio + service de l'IHM. Écoute en LOOPBACK : l'exposition passe par
// Caddy, et l'authentification par Cloudflare Access devant le vhost — il n'y a
// volontairement aucune auth applicative ici (même patron que mucho.oto.zone).
import http from 'node:http';
import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import * as templates from './templates.mjs';
import { render } from './render.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(DIR, '..');
const WORK = join(ROOT, 'out', 'service');
const PORT = Number(process.env.STUDIO_PORT || 8100);
const HOST = process.env.STUDIO_HOST || '127.0.0.1';
const KEEP = Number(process.env.STUDIO_KEEP || 60);   // travaux gardés dans la galerie

mkdirSync(WORK, { recursive: true });

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mp4': 'video/mp4', '.gif': 'image/gif',
  '.png': 'image/png', '.json': 'application/json; charset=utf-8' };

/* ---------- état des travaux : sur disque, pour survivre au redémarrage ---------- */

const jobPath = id => join(WORK, id, 'job.json');
const saveJob = j => writeFileSync(jobPath(j.id), JSON.stringify(j, null, 2));
const readJob = id => JSON.parse(readFileSync(jobPath(id), 'utf8'));

function listJobs(limit = KEEP) {
  return readdirSync(WORK)
    .filter(d => existsSync(jobPath(d)))
    .map(readJob)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
}

/** Purge les travaux au-delà des KEEP plus récents : sur une box, une galerie qui
 *  ne se vide jamais finit par remplir le disque (une carte ≈ 100 Ko à 2 Mo). */
function purge() {
  const all = readdirSync(WORK)
    .filter(d => existsSync(jobPath(d)))
    .map(id => ({ id, at: readJob(id).created_at }))
    .sort((a, b) => a.at.localeCompare(b.at));
  for (const { id } of all.slice(0, Math.max(0, all.length - KEEP)))
    rmSync(join(WORK, id), { recursive: true, force: true });
}

const previews = new Map();   // aperçus éphémères : id -> { html, at }

/* ---------- routes ---------- */

const routes = [
  ['GET', /^\/healthz$/, () => ({ ok: true })],

  ['GET', /^\/api\/templates$/, () => ({ templates: templates.list() })],

  ['GET', /^\/api\/templates\/([\w-]+)$/, ([id]) => {
    const { build, ...manifest } = templates.get(id);
    return manifest;
  }],

  ['POST', /^\/api\/previews$/, async (_, body) => {
    const tpl = templates.get(body.template);
    templates.validate(tpl, body.data);
    const id = randomBytes(8).toString('hex');
    previews.set(id, { html: tpl.build(body.data), at: Date.now() });
    for (const [k, v] of previews) if (Date.now() - v.at > 6e5) previews.delete(k);
    return { id, url: `/previews/${id}` };
  }],

  ['GET', /^\/previews\/([0-9a-f]+)$/, ([id], _b, res) => {
    const p = previews.get(id);
    if (!p) throw Object.assign(new Error('aperçu expiré'), { status: 404 });
    res.writeHead(200, { 'Content-Type': MIME['.html'] });
    res.end(p.html);
  }],

  ['GET', /^\/api\/renders$/, () => ({ renders: listJobs() })],

  ['GET', /^\/api\/renders\/([\w-]+)$/, ([id]) => {
    if (!existsSync(jobPath(id))) throw Object.assign(new Error('rendu inconnu'), { status: 404 });
    return readJob(id);
  }],

  ['POST', /^\/api\/renders$/, async (_, body) => {
    const tpl = templates.get(body.template);
    templates.validate(tpl, body.data);

    const formats = body.formats?.length ? body.formats : ['mp4'];
    const refuses = formats.filter(f => !tpl.formats.includes(f));
    if (refuses.length)
      throw Object.assign(new Error(`format non servi par ce gabarit : ${refuses.join(', ')}`), { status: 400 });

    const id = `${new Date().toISOString().slice(0, 10)}-${tpl.id}-${randomBytes(3).toString('hex')}`;
    const job = {
      id, template: tpl.id, template_label: tpl.label, formats, data: body.data,
      author: body.author || null, status: 'en_cours', created_at: new Date().toISOString(),
      files: {}, error: null, ms: null
    };
    mkdirSync(join(WORK, id), { recursive: true });
    saveJob(job);
    purge();

    // On rend en tâche de fond : la file du moteur sérialise, la réponse ne l'attend pas.
    render({
      html: tpl.build(body.data), dir: join(WORK, id),
      width: tpl.size.width, height: tpl.size.height, fps: tpl.fps, formats
    }).then(({ files, ms }) => {
      saveJob({ ...readJob(id), status: 'fini', files, ms, finished_at: new Date().toISOString() });
    }).catch(err => {
      saveJob({ ...readJob(id), status: 'échoué', error: String(err.message || err),
        finished_at: new Date().toISOString() });
    });

    return { ...job, url: `/api/renders/${id}` };
  }],

  ['GET', /^\/files\/([\w-]+)\/([\w.-]+)$/, ([id, name], _b, res) => {
    const p = join(WORK, id, basename(name));
    if (!existsSync(p)) throw Object.assign(new Error('fichier absent'), { status: 404 });
    const buf = readFileSync(p);
    res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream',
      'Content-Length': buf.length });
    res.end(buf);
  }],

  ['GET', /^\/$/, (_a, _b, res) => serveWeb('index.html', res)],
  ['GET', /^\/([\w.-]+\.(?:css|js|html))$/, ([f], _b, res) => serveWeb(f, res)]
];

function serveWeb(name, res) {
  const p = join(DIR, 'web', basename(name));
  if (!existsSync(p)) throw Object.assign(new Error('introuvable'), { status: 404 });
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'text/plain' });
  res.end(readFileSync(p));
}

/* ---------- serveur ---------- */

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    for (const [method, re, handler] of routes) {
      if (req.method !== method) continue;
      const m = url.pathname.match(re);
      if (!m) continue;

      let body = null;
      if (method === 'POST') {
        const raw = await readBody(req);
        try { body = raw ? JSON.parse(raw) : {}; }
        catch { throw Object.assign(new Error('corps JSON illisible'), { status: 400 }); }
      }
      const out = await handler(m.slice(1), body, res);
      if (res.headersSent) return;   // le handler a servi lui-même (fichier, HTML)
      // Toujours 200 : le code HTTP ne se dérive JAMAIS du corps (un job porte son
      // propre `status` métier, qui n'est pas un code de réponse). Les échecs passent
      // par une exception portant `.status`.
      res.writeHead(200, { 'Content-Type': MIME['.json'] });
      return res.end(JSON.stringify(out));
    }
    res.writeHead(404, { 'Content-Type': MIME['.json'] });
    res.end(JSON.stringify({ error: 'route inconnue' }));
  } catch (err) {
    const status = err.status || 500;
    if (!res.headersSent) {
      res.writeHead(status, { 'Content-Type': MIME['.json'] });
      res.end(JSON.stringify({ error: String(err.message || err) }));
    }
    if (status >= 500) console.error(`[studio] ${req.method} ${url.pathname} →`, err);
  }
});

function readBody(req) {
  return new Promise((resolve, reject) => {
    let b = '', size = 0;
    req.on('data', c => {
      size += c.length;
      if (size > 1e6) { reject(Object.assign(new Error('corps trop gros'), { status: 413 })); req.destroy(); return; }
      b += c;
    });
    req.on('end', () => resolve(b));
    req.on('error', reject);
  });
}

server.listen(PORT, HOST, () => console.error(`[studio] prêt → http://${HOST}:${PORT}`));
