// La charte, en accès PUBLIC : le mark et ses déclinaisons, la palette, la typo, les
// fichiers d'impression du merch. Tout ce qui est ici est fait pour être donné à un
// tiers — un imprimeur, un presta, un partenaire — sans lui ouvrir le générateur.
//
// D'où le préfixe unique `/brand` : une seule politique Cloudflare Access à poser en
// bypass, et le reste du studio (le générateur, les rendus, la galerie) reste fermé.
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOGOS, logoSvg, logoPng } from './kit.mjs';
import { PIECES } from '../brand/merch/pieces.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const THEME = join(ROOT, 'brand/theme/theme.css');
const PHOTOS_DIR = join(ROOT, 'brand/photos');

// Les portraits publiés au nom d'Otomata — déjà servis par otomata.tech/equipe/.
// `sources/` (les photos d'origine, avant harmonisation) n'est PAS exposé : ce sont
// des originaux de travail, pas des livrables.
const PHOTOS = [
  { slug: 'alexis-laporte', nom: 'Alexis Laporte', role: 'Président' },
  { slug: 'sarah-soumahoro', nom: 'Sarah Soumahoro', role: 'RAF' },
];

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
  for (const ph of PHOTOS) h.update(readFileSync(join(PHOTOS_DIR, `${ph.slug}.jpg`)));
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
    photos: PHOTOS.map(ph => ({ ...ph, url: `/brand/photo/${ph.slug}.jpg?v=${v}` })),
    merch: PIECES.map(p => ({
      id: p.id, sur: p.sur, taille: `${p.w}×${p.h}`,
      url: `/brand/merch/${p.id}.png?v=${v}`,
      fond: /blanc/.test(p.id) ? 'sombre' : /encre/.test(p.id) ? 'saffran' : 'clair',
    })),
  };
}

export { logoSvg, logoPng };

/** Un fichier d'impression, servi tel quel depuis brand/merch/print/.
 *  Il n'est PAS rendu à la demande : 4000×4000 fait 16 Mpx, et faire fabriquer ça à
 *  une box d'un vCPU pour un fichier qui ne change jamais, c'est la faire suffoquer
 *  (constaté le 2026-09-03 : plus de SSH pendant le préchauffage). Le poste les
 *  génère avec `node brand/merch/build-merch.mjs`, git les transporte. */
/** Un portrait publié, servi depuis brand/photos/. Liste fermée : un slug inconnu
 *  répond 404 plutôt que d'ouvrir le dossier — `sources/` reste privé. */
export function photo(slug) {
  if (!PHOTOS.some(p => p.slug === slug))
    throw Object.assign(new Error(`portrait inconnu : ${slug}`), { status: 404 });
  return join(PHOTOS_DIR, `${slug}.jpg`);
}

export function merch(id) {
  const p = PIECES.find(x => x.id === id);
  if (!p) throw Object.assign(new Error(`pièce inconnue : ${id}`), { status: 404 });
  const png = join(ROOT, 'brand/merch/print', `otomata-${id}.png`);
  if (!existsSync(png))
    throw Object.assign(new Error(
      `fichier d'impression absent : ${id} — le régénérer avec « node brand/merch/build-merch.mjs » et le commiter`),
      { status: 404 });
  return Promise.resolve(png);
}
