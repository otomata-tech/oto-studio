// Rend la planche de propositions : node brand/merch/build-planche.mjs [sortie.png]
// Elle n'est PAS versionnée — c'est un document de discussion, pas un livrable stable.
// Les fichiers d'impression, eux, le sont (cf. build-merch.mjs).
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { planche } from './planche.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const GEN = join(DIR, '../../.gen');
const SORTIE = process.argv[2] ?? join(GEN, 'merch-planche.png');
const W = 1500, H = 2400, ECHELLE = 2;

mkdirSync(GEN, { recursive: true });

// Les visuels sont inlinés en data-URI : une page file:// n'a pas le droit de charger
// d'autres fichiers locaux, et les réduire d'abord évite un HTML de plusieurs Mo.
const img = {};
for (const id of ['mark-couleur', 'ligne-couleur', 'ligne-encre', 'ligne-blanc',
                  'dos-couleur', 'dos-encre', 'dos-blanc']) {
  const r = spawnSync('magick', [join(DIR, 'print', `otomata-${id}.png`), '-resize', '900x900', 'png:-'],
    { maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) { console.error(`✗ ${id}`); process.exit(1); }
  img[id] = `data:image/png;base64,${r.stdout.toString('base64')}`;
}

const html = join(GEN, 'merch-planche.html');
writeFileSync(html, planche(img));
const r = spawnSync('google-chrome-stable', [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
  '--user-data-dir=/tmp/oto-merch-chrome', `--force-device-scale-factor=${ECHELLE}`,
  '--virtual-time-budget=12000', `--window-size=${W},${H}`,
  `--screenshot=${SORTIE}`, `file://${html}`,
], { stdio: 'ignore' });
if (r.status !== 0) { console.error('✗ rendu de la planche'); process.exit(1); }
const dim = spawnSync('identify', ['-format', '%wx%h', SORTIE], { encoding: 'utf8' }).stdout;
console.log(`✓ ${SORTIE} — ${dim} (${(readFileSync(SORTIE).length / 1024 / 1024).toFixed(2)} Mo)`);
