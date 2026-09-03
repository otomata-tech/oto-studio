// API du studio + service de l'IHM. Écoute en LOOPBACK : l'exposition passe par
// Caddy, et l'authentification par Cloudflare Access devant le vhost — il n'y a
// volontairement aucune auth applicative ici (même patron que mucho.oto.zone).
import http from 'node:http';
import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import * as templates from './templates.mjs';
import { openapi } from './openapi.mjs';
import { render } from './render.mjs';
import * as kit from './kit.mjs';
import * as brand from './brand.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(DIR, '..');
const WORK = join(ROOT, 'out', 'service');
const PORT = Number(process.env.STUDIO_PORT || 8100);
const HOST = process.env.STUDIO_HOST || '127.0.0.1';
const KEEP = Number(process.env.STUDIO_KEEP || 60);   // travaux gardés dans la galerie
// L'adresse par laquelle un HUMAIN atteint ce service. Elle n'a rien à voir avec celle
// par laquelle un agent l'appelle (réseau privé) : un agent qui rend un lien doit rendre
// celui qu'on peut ouvrir dans un navigateur, pas son propre chemin d'accès.
const PUBLIC_URL = (process.env.STUDIO_PUBLIC_URL || 'https://studio.oto.zone').replace(/\/+$/, '');

mkdirSync(WORK, { recursive: true });

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mp4': 'video/mp4', '.gif': 'image/gif',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8' };

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

/** Un travail tel qu'on le rend au dehors : avec les liens qu'un humain peut ouvrir.
 *  `page` existe dès la création — elle affiche l'attente, puis le visuel. */
const withLinks = j => ({
  ...j,
  page: `${PUBLIC_URL}/r/${j.id}`,
  files_url: Object.fromEntries(
    Object.entries(j.files || {}).map(([k, name]) => [k, `${PUBLIC_URL}/files/${j.id}/${name}`]))
});

const previews = new Map();   // aperçus éphémères : id -> { html, at }

/* ---------- routes ---------- */

const routes = [
  ['GET', /^\/healthz$/, () => ({ ok: true })],

  // Lu par `http_doc()` du connecteur http d'oto : c'est ce document, et lui seul,
  // qui dit à un agent quoi appeler et avec quels champs.
  ['GET', /^\/openapi\.json$/, () => openapi()],

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

  ['GET', /^\/api\/renders$/, () => ({ renders: listJobs().map(withLinks) })],

  ['GET', /^\/api\/renders\/([\w-]+)$/, ([id]) => {
    if (!existsSync(jobPath(id))) throw Object.assign(new Error('rendu inconnu'), { status: 404 });
    return withLinks(readJob(id));
  }],

  // La page de suivi : une seule adresse à donner, dès le lancement. Elle montre
  // l'attente puis le visuel — c'est ce qu'un agent rend à un humain.
  ['GET', /^\/r\/([\w-]+)$/, (_a, _b, res) => serveWeb('r.html', res)],

  ['POST', /^\/api\/renders$/, async (_, body) => {
    const tpl = templates.get(body.template);

    // Les formats sont contrôlés AVEC les champs, pas après : le contrat promet que
    // tous les refus arrivent d'un coup, et une vérification en aval le démentait
    // (les fautes de champs masquaient le format non servi).
    const formats = body.formats?.length ? body.formats : ['mp4'];
    const refus = formats.filter(f => !tpl.formats.includes(f))
      .map(f => `format non servi par ce gabarit : ${f} (servis : ${tpl.formats.join(', ')})`);
    try { templates.validate(tpl, body.data); }
    catch (e) { refus.push(...(e.refus || [e.message])); }
    if (refus.length) throw Object.assign(new Error(refus.join(' · ')), { status: 400, refus });

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
    // Un gabarit multi-formats (`sizes` + `size_field`) rend la taille que ses données
    // désignent : sans ça, le studio produirait un 4:5 pour une couverture de page.
    const dim = tpl.sizes?.[body.data?.[tpl.size_field]] ?? tpl.size;
    render({
      html: tpl.build(body.data), dir: join(WORK, id),
      width: dim.width, height: dim.height, scale: dim.scale ?? 1, fps: tpl.fps, formats
    }).then(({ files, ms }) => {
      saveJob({ ...readJob(id), status: 'fini', files, ms, finished_at: new Date().toISOString() });
    }).catch(err => {
      saveJob({ ...readJob(id), status: 'échoué', error: String(err.message || err),
        finished_at: new Date().toISOString() });
    });

    return withLinks(job);
  }],

  // Retirer un rendu : la galerie est partagée, un essai raté ne doit pas y rester
  // faute de moyen de le nettoyer. Signalé en faisant appeler l'API par un agent.
  ['DELETE', /^\/api\/renders\/([\w-]+)$/, ([id]) => {
    if (!existsSync(jobPath(id))) throw Object.assign(new Error('rendu inconnu'), { status: 404 });
    rmSync(join(WORK, id), { recursive: true, force: true });
    return { ok: true, id, deleted: true };
  }],

  ['GET', /^\/files\/([\w-]+)\/([\w.-]+)$/, ([id, name], _b, res) => {
    const p = join(WORK, id, basename(name));
    if (!existsSync(p)) throw Object.assign(new Error('fichier absent'), { status: 404 });
    const buf = readFileSync(p);
    res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream',
      'Content-Length': buf.length });
    res.end(buf);
  }],

  /* ---------- la charte, en accès PUBLIC ----------
     Un seul préfixe `/brand` : une politique Cloudflare Access en bypass suffit à
     l'ouvrir, et le reste du studio — générateur, rendus, galerie — reste fermé. */
  ['GET', /^\/brand$/, (_a, _b, res) => serveWeb('brand.html', res)],
  ['GET', /^\/brand\/api$/, () => brand.etat()],
  ['GET', /^\/brand\/logo\/([a-z-]+)\.svg$/, ([clef], _b, res) => {
    const buf = readFileSync(brand.logoSvg(clef));
    res.writeHead(200, { 'Content-Type': MIME['.svg'], 'Content-Length': buf.length,
      'Cache-Control': 'public, max-age=86400' });
    res.end(buf);
  }],
  ['GET', /^\/brand\/logo\/([a-z-]+?)-(\d{1,4})\.png$/, async ([clef, taille], _b, res) => {
    const buf = readFileSync(await brand.logoPng(clef, Number(taille)));
    res.writeHead(200, { 'Content-Type': MIME['.png'], 'Content-Length': buf.length,
      'Cache-Control': 'public, max-age=86400' });
    res.end(buf);
  }],
  ['GET', /^\/brand\/photo\/([a-z-]+)\.jpg$/, ([slug], _b, res) => {
    const buf = readFileSync(brand.photo(slug));
    res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Content-Length': buf.length,
      'Cache-Control': 'public, max-age=86400' });
    res.end(buf);
  }],
  ['GET', /^\/brand\/merch\/([a-z0-9-]+)\.png$/, async ([id], _b, res) => {
    const buf = readFileSync(await brand.merch(id));
    res.writeHead(200, { 'Content-Type': MIME['.png'], 'Content-Length': buf.length,
      'Cache-Control': 'public, max-age=86400' });
    res.end(buf);
  }],

  /* ---------- le kit de marque ----------
     Des visuels FIXES, à une adresse stable, hors de la galerie qui se purge : le
     générateur sert à fabriquer, le kit à retrouver. Rendus à la demande au premier
     accès, puis servis depuis le cache (cf. kit.mjs). */
  ['GET', /^\/kit$/, (_a, _b, res) => serveWeb('kit.html', res)],
  ['GET', /^\/api\/kit$/, () => kit.etat()],
  // Le logo : SVG servi depuis brand/ (source de vérité, pas de copie), PNG rastérisés
  // à la demande et transparents.
  ['GET', /^\/kit\/diapo\/(\d)(-apercu)?\.png$/, async ([n, apercu], _b, res) => {
    const buf = readFileSync(await kit.diapo(Number(n), { apercu: !!apercu }));
    res.writeHead(200, { 'Content-Type': MIME['.png'], 'Content-Length': buf.length,
      'Cache-Control': 'public, max-age=86400' });
    res.end(buf);
  }],

  ['GET', /^\/kit\/logo\/([a-z-]+)\.svg$/, ([clef], _b, res) => {
    const buf = readFileSync(kit.logoSvg(clef));
    res.writeHead(200, { 'Content-Type': MIME['.svg'], 'Content-Length': buf.length,
      'Cache-Control': 'public, max-age=86400' });
    res.end(buf);
  }],
  ['GET', /^\/kit\/logo\/([a-z-]+?)-(\d{1,4})\.png$/, async ([clef, taille], _b, res) => {
    const buf = readFileSync(await kit.logoPng(clef, Number(taille)));
    res.writeHead(200, { 'Content-Type': MIME['.png'], 'Content-Length': buf.length,
      'Cache-Control': 'public, max-age=86400' });
    res.end(buf);
  }],

  ['GET', /^\/kit\/([a-z0-9]+?)(-apercu)?\.png$/, async ([format, apercu], _b, res) => {
    const p = await kit.visuel(format, { apercu: !!apercu });
    const buf = readFileSync(p);
    // L'URL porte l'empreinte des sources (`?v=`) : ce que ce chemin renvoie ne
    // changera pas, on peut donc le laisser en cache côté navigateur.
    res.writeHead(200, { 'Content-Type': MIME['.png'], 'Content-Length': buf.length,
      'Cache-Control': 'public, max-age=86400' });
    res.end(buf);
  }],

  ['GET', /^\/$/, (_a, _b, res) => serveWeb('index.html', res)],
  ['GET', /^\/([\w.-]+\.(?:css|js|html|svg))$/, ([f], _b, res) => serveWeb(f, res)]
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
