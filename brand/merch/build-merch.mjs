// Rend les fichiers d'impression du merch : PNG transparents, côté long 4000 px.
// Usage : node brand/merch/build-merch.mjs
//
// Contraintes Spreadshirt tenues ici (cf. README.md de ce dossier) : PNG — seul
// format à porter la transparence —, 4000 px sur le côté long, 10 Mo maximum.
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PIECES, page } from './pieces.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(DIR, '../..');
// versionné : ce sont des livrables stables, pas des rendus jetables
const OUT = join(DIR, 'print');
const GEN = join(ROOT, '.gen');

mkdirSync(OUT, { recursive: true });
mkdirSync(GEN, { recursive: true });
for (const p of PIECES) {
  const html = join(GEN, `merch-${p.id}.html`);
  writeFileSync(html, page(p));
  const png = join(OUT, `otomata-${p.id}.png`);
  const r = spawnSync('google-chrome-stable', [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=/tmp/oto-merch-chrome`,
    // fond RGBA transparent : un fichier d'impression posé sur un textile de couleur
    // ne doit pas traîner un rectangle blanc
    '--default-background-color=00000000',
    '--virtual-time-budget=9000', `--window-size=${p.w},${p.h}`,
    `--screenshot=${png}`, `file://${html}`,
  ], { stdio: 'ignore' });
  const ok = r.status === 0 && existsSync(png);
  const ko = ok ? (statSync(png).size / 1024 / 1024).toFixed(2) : '—';
  console.log(`${ok ? '✓' : '✗'} ${p.id.padEnd(17)} ${String(p.w).padStart(4)}×${String(p.h).padEnd(4)} ${ko.padStart(5)} Mo — ${p.sur}`);
  if (!ok) process.exit(1);
}
