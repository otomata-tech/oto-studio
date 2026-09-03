// Rend le kit d'identité en local : posts/template-identite.html -> out/posts/identite/<format>.png
// Usage : node posts/build-kit.mjs [format …]   (sans argument : tout le kit)
//
// Le service web rend le MÊME fragment par son gabarit `kit-identite` — ici on ne
// compose que la page (fonts embarquées + format injecté), comme cards/build-all.mjs.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FORMATS, CLES, livre } from './identite-formats.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(DIR, '..');
const OUT = join(ROOT, 'out/posts/identite');
const GEN = join(ROOT, '.gen');

const todo = process.argv.slice(2).length ? process.argv.slice(2) : CLES;
for (const f of todo) {
  if (!FORMATS[f]) { console.error(`format inconnu : ${f} (${CLES.join(', ')})`); process.exit(1); }
}

const fragment = readFileSync(join(DIR, 'template-identite.html'), 'utf8');
const fonts = readFileSync(join(ROOT, 'assets/fonts.css'), 'utf8');
mkdirSync(OUT, { recursive: true });
mkdirSync(GEN, { recursive: true });

for (const f of todo) {
  const { width, height, scale, cible } = FORMATS[f];
  const body = fragment
    .replace('<!--__DATA__-->', `<script>window.__ID=${JSON.stringify({ format: f })};</script>`)
    .replace('/* __FONTS__ */', fonts);
  const html = `<!doctype html>\n<html lang="fr"><head><meta charset="utf-8">` +
    `<title>Otomata — ${f}</title></head><body>\n${body}\n</body></html>`;
  const page = join(GEN, `identite-${f}.html`);
  writeFileSync(page, html);

  const png = join(OUT, `${f}.png`);
  const r = spawnSync('google-chrome-stable', [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    // profil isolé, sinon Chrome ferme les fenêtres de l'utilisateur et le rendu échoue
    `--user-data-dir=/tmp/oto-build-chrome-kit-${f}`,
    // sans budget de temps virtuel, la capture part avant le chargement des fonts
    '--virtual-time-budget=8000',
    `--force-device-scale-factor=${scale}`,
    `--window-size=${width},${height}`,
    `--screenshot=${png}`,
    `file://${page}`,
  ], { stdio: 'ignore' });
  const ok = r.status === 0 && existsSync(png) && statSync(png).size > 0;
  console.log(`${ok ? '✓' : '✗'} ${f.padEnd(7)} ${livre(f).padEnd(10)} — ${cible}`);
  if (!ok) process.exit(1);
}
