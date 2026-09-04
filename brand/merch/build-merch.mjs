// Rend les fichiers d'impression du merch : PNG transparents, côté long 4000 px.
// Usage : node brand/merch/build-merch.mjs
//
// Contraintes Spreadshirt tenues ici (cf. README.md de ce dossier) : PNG — seul
// format à porter la transparence —, 4000 px sur le côté long, 10 Mo maximum.
//
// Le rendu se fait sur un canevas trop grand, puis l'image est RECADRÉE AU CONTENU.
// C'est ce qui fait la différence à l'impression : leur outil cadre le fichier dans la
// zone du vêtement, donc une marge transparente se paie en centimètres de visuel perdus.
// Les anciens fichiers en portaient 37 %.
//
// La part du canevas qu'occupe le contenu dépend de la pose ET du mark (le SVG a lui-même
// de l'air autour de l'ombre et de l'anneau). Plutôt que de la calculer à la main — un
// calage qui casse au premier retouche du mark —, le build fait une PASSE DE MESURE :
// il rend, mesure ce que le recadrage laisse, et refait le rendu à l'échelle voulue.
// La réduction finale ne fait donc que réduire, jamais agrandir un raster.
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PIECES, page, canevas } from './pieces.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(DIR, '../..');
// versionné : ce sont des livrables stables, pas des rendus jetables
const OUT = join(DIR, 'print');
const GEN = join(ROOT, '.gen');
const COTE = 4000;

mkdirSync(OUT, { recursive: true });
mkdirSync(GEN, { recursive: true });

/** Rend la pièce sur un canevas mis à l'échelle et renvoie ce que le recadrage laisse. */
function rendre(p, echelle, sortie) {
  const c = canevas(p);
  const w = Math.round(c.w * echelle), h = Math.round(c.h * echelle);
  writeFileSync(join(GEN, `merch-${p.id}.html`), page(p, echelle));
  const r = spawnSync('google-chrome-stable', [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    '--user-data-dir=/tmp/oto-merch-chrome',
    // fond RGBA transparent : un fichier d'impression posé sur un textile de couleur
    // ne doit pas traîner un rectangle blanc
    '--default-background-color=00000000',
    '--virtual-time-budget=9000', `--window-size=${w},${h}`,
    `--screenshot=${sortie}`, `file://${join(GEN, `merch-${p.id}.html`)}`,
  ], { stdio: 'ignore' });
  if (r.status !== 0 || !existsSync(sortie)) throw new Error(`${p.id} — rendu`);
  // `-trim` s'appuie sur le canal alpha : l'ombre à 85 % d'opacité en fait partie.
  const m = spawnSync('magick', [sortie, '-trim', '+repage', sortie], { stdio: 'inherit' });
  if (m.status !== 0) throw new Error(`${p.id} — recadrage`);
  const dim = spawnSync('identify', ['-format', '%w %h', sortie], { encoding: 'utf8' }).stdout;
  const [w2, h2] = dim.split(' ').map(Number);
  return { w: w2, h: h2, long: Math.max(w2, h2) };
}

for (const p of PIECES) {
  const png = join(OUT, `otomata-${p.id}.png`);
  // Passe de mesure, sur un canevas réduit : elle ne sert qu'à connaître la proportion.
  const mesure = rendre(p, 0.4, join(GEN, `merch-${p.id}-mesure.png`));
  // 1 % de marge : le recadrage de la passe finale ne tombe jamais au pixel près, et il
  // faut qu'il reste au-dessus de 4000 px pour que la réduction ait quelque chose à mordre.
  const d = rendre(p, 0.4 * (COTE / mesure.long) * 1.01, png);
  const m = spawnSync('magick', [png, '-resize', `${COTE}x${COTE}>`,
    '-define', 'png:color-type=6', png], { stdio: 'inherit' });
  if (m.status !== 0) { console.log(`✗ ${p.id} — mise à l'échelle`); process.exit(1); }

  const dim = spawnSync('identify', ['-format', '%w %h', png], { encoding: 'utf8' }).stdout;
  const [w, h] = dim.split(' ').map(Number);
  if (Math.max(w, h) !== COTE) {
    console.log(`✗ ${p.id} — côté long ${Math.max(w, h)} px au lieu de ${COTE} (mesuré ${d.long})`);
    process.exit(1);
  }
  const mo = (statSync(png).size / 1024 / 1024).toFixed(2);
  console.log(`✓ ${p.id.padEnd(17)} ${`${w}×${h}`.padEnd(10)} ${mo.padStart(5)} Mo — ${p.sur}`);
}
