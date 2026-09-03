// La charte, en accès PUBLIC : le mark et ses déclinaisons, la palette, la typo, les
// fichiers d'impression du merch. Tout ce qui est ici est fait pour être donné à un
// tiers — un imprimeur, un presta, un partenaire — sans lui ouvrir le générateur.
//
// D'où le préfixe unique `/brand` : une seule politique Cloudflare Access à poser en
// bypass, et le reste du studio (le générateur, les rendus, la galerie) reste fermé.
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, mkdirSync, renameSync, rmSync, readdirSync } from 'node:fs';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from './render.mjs';
import { LOGOS, logoSvg, logoPng } from './kit.mjs';
import { PIECES, page as pageMerch } from '../brand/merch/pieces.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, 'out', 'brand');
const THEME = join(ROOT, 'brand/theme/theme.css');

/** La palette vient de brand/theme/theme.css, jamais d'une copie : c'est le fichier
 *  que les consommateurs importent, et la page publique doit dire la même chose. */
function palette() {
  const css = readFileSync(THEME, 'utf8');
  const pris = new Map();
  for (const [, nom, val] of css.matchAll(/--color-([\w-]+):\s*(#[0-9a-fA-F]{3,8})/g))
    if (!pris.has(nom)) pris.set(nom, val);
  const groupe = (titre, clefs) => ({
    titre, tons: clefs.filter(k => pris.has(k)).map(k => ({ nom: k, hex: pris.get(k) })),
  });
  return [
    groupe('Neutres', ['bg', 'paper-2', 'paper-3', 'surface', 'ink', 'ink-soft', 'mute', 'faint', 'hair']),
    groupe('Saffran', ['primary', 'primary-soft', 'primary-ink']),
    groupe('Accent', ['accent', 'accent-soft']),
    // Les trois familles d'état de la charte : fort, partiel, faible.
    groupe('États', ['strong-bg', 'strong-mid', 'strong-ink', 'partial-bg', 'partial-mid', 'partial-ink', 'weak-bg', 'weak-mid', 'weak-ink']),
  ].filter(g => g.tons.length);
}

const TYPO = [
  { role: 'Display', famille: 'Bricolage Grotesque', usage: 'titres et chiffres héros — wdth 90, weight 600, letter-spacing négatif' },
  { role: 'Sans', famille: 'Hanken Grotesk', usage: 'corps de texte' },
  { role: 'Mono', famille: 'JetBrains Mono', usage: 'eyebrows, étiquettes, adresses — capitales, letter-spacing 0.16em' },
];

const empreinte = () => {
  const h = createHash('sha1').update(readFileSync(THEME));
  for (const l of Object.values(LOGOS)) h.update(readFileSync(join(ROOT, 'brand/logos/otomata', l.fichier)));
  h.update(JSON.stringify(PIECES.map(p => [p.id, p.w, p.h, p.mark, p.mot, p.ombre, p.sur])));
  return h.digest('hex').slice(0, 8);
};

export function etat() {
  const v = empreinte();
  return {
    version: v,
    logos: Object.entries(LOGOS).map(([clef, l]) => ({
      clef, nom: l.nom, note: l.note, fond: l.fond,
      svg: `/brand/logo/${clef}.svg?v=${v}`,
      png: l.tailles.map(t => ({ taille: t, url: `/brand/logo/${clef}-${t}.png?v=${v}` })),
    })),
    palette: palette(),
    typo: TYPO,
    merch: PIECES.map(p => ({
      id: p.id, sur: p.sur, taille: `${p.w}×${p.h}`,
      url: `/brand/merch/${p.id}.png?v=${v}`,
      fond: /blanc/.test(p.id) ? 'sombre' : /encre/.test(p.id) ? 'saffran' : 'clair',
    })),
  };
}

export { logoSvg, logoPng };

const enCours = new Map();

/** Un fichier d'impression, rastérisé à la demande. Transparent, évidemment : un PNG
 *  de merch avec un fond blanc pose un rectangle sur le vêtement. */
export function merch(id) {
  const p = PIECES.find(x => x.id === id);
  if (!p) throw Object.assign(new Error(`pièce inconnue : ${id}`), { status: 404 });
  const v = empreinte();
  const png = join(CACHE, `merch-${id}-${v}.png`);
  if (existsSync(png)) return Promise.resolve(png);
  if (!enCours.has(png)) enCours.set(png, produire(p, png, v).finally(() => enCours.delete(png)));
  return enCours.get(png).then(() => png);
}

async function produire(p, png, v) {
  const travail = join(CACHE, `.travail-${p.id}`);
  mkdirSync(CACHE, { recursive: true });
  await render({ html: pageMerch(p), dir: travail, width: p.w, height: p.h,
    formats: ['png'], transparent: true });
  renameSync(join(travail, 'visuel.png'), png);
  rmSync(travail, { recursive: true, force: true });
  for (const f of readdirSync(CACHE))
    if (f.endsWith('.png') && !f.includes(`-${v}`)) rmSync(join(CACHE, f), { force: true });
}
