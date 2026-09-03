// Le kit de marque : les visuels FIXES de l'identité Otomata, ceux qu'on télécharge.
// L'IHM voisine est un GÉNÉRATEUR — on y remplit un formulaire et le rendu part dans une
// galerie purgée au-delà de 60 travaux. Un logo de page LinkedIn n'a rien à faire là :
// il ne change pas, il ne se remplit pas, et il doit rester à la même adresse.
//
// D'où ce module : mêmes gabarit et mêmes données que le studio, mais rendus une fois et
// gardés en cache sous une empreinte des sources. Le dessin change → l'empreinte change →
// les visuels se refont d'eux-mêmes au prochain accès.
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from './render.mjs';
import * as templates from './templates.mjs';
import { FORMATS, CLES } from '../posts/identite-formats.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, 'out', 'kit');
const FRAGMENT = join(ROOT, 'posts/template-identite.html');
const BRAND = join(ROOT, 'brand/logos/otomata');

// Le logo, ses déclinaisons et les tailles qu'on livre. Les SVG viennent de brand/,
// source de vérité : ils ne sont PAS recopiés ici, seulement servis et rastérisés.
// Les tailles s'arrêtent là où la variante cesse d'être lisible — le mark complet
// n'est pas proposé en 16 px, son décalage y devient un cheveu.
export const LOGOS = {
  'mark':       { fichier: 'otomata-mark.svg', nom: 'Le mark', fond: 'clair',
                  note: 'ombre dure + anneau saffran décalé + disque cerné', tailles: [1024, 512, 256, 128] },
  'compact':    { fichier: 'otomata-mark-compact.svg', nom: 'Compact', fond: 'clair',
                  note: 'disque cerné seul — sous 32 px et sur les surfaces rognées en cercle', tailles: [512, 256, 128, 64, 32, 16] },
  'mono-encre': { fichier: 'otomata-mark-mono-encre.svg', nom: 'Monochrome encre', fond: 'clair',
                  note: 'une seule couleur, pour fond clair', tailles: [1024, 512, 256] },
  'mono-blanc': { fichier: 'otomata-mark-mono-blanc.svg', nom: 'Monochrome clair', fond: 'sombre',
                  note: 'une seule couleur, pour fond sombre', tailles: [1024, 512, 256] },
};

const gabarit = () => templates.get('kit-identite');
const gabaritBanniere = () => templates.get('banniere');
const BANNIERE = join(ROOT, 'posts/template-banniere.html');

// Les cinq images du DIAPORAMA de profil (option Premium : 5 maximum, 1584×396, PNG,
// 8 Mo par image). Elles défilent en boucle et chacune doit tenir seule — personne ne
// regarde un profil en attendant la suivante. D'où : une idée par image, et l'adresse
// répétée sur chacune.
export const DIAPO = [
  { mark: 'otomata', kicker: 'Otomata', titre: 'Studio IA basé à Marseille.', pied: '<b>otomata.tech</b>' },
  { mark: 'aucun', titre: 'On met vos agents au travail.', pied: '<b>otomata.tech</b>' },
  { mark: 'aucun', titre: 'Vos données, vos procédures, vos comptes — accessibles à vos agents.', pied: '<b>otomata.tech</b>' },
  { mark: 'oto', kicker: 'oto', titre: 'La toolbox pour créer des agents.', pied: '<b>oto.cx</b>' },
  { mark: 'otomata', titre: 'Parlons-en.', pied: 'Marseille · <b>otomata.tech</b>' },
];
const DIAPO_TAILLE = { width: 1584, height: 396, scale: 2 };

// Les données du kit officiel sont l'exemple du gabarit : une seule source, sinon la page
// du kit et le formulaire montreraient deux identités qui divergent en silence.
export const donnees = () => gabarit().example;

const empreinte = () => {
  const h = createHash('sha1')
    .update(readFileSync(FRAGMENT))
    .update(JSON.stringify(FORMATS))
    .update(JSON.stringify(donnees()));
  // les SVG entrent dans l'empreinte : un mark retouché doit refaire ses PNG
  for (const l of Object.values(LOGOS)) h.update(readFileSync(join(BRAND, l.fichier)));
  h.update(readFileSync(BANNIERE)).update(JSON.stringify(DIAPO));
  return h.digest('hex').slice(0, 8);
};

const chemin = (f, v, apercu) => join(CACHE, `${f}-${v}${apercu ? '-apercu' : ''}.png`);

/** Ce que la page affiche : un visuel par format, sa cible, sa cote livrée, ses URL. */
export function etat() {
  const v = empreinte();
  return {
    version: v,
    identite: donnees(),
    logos: Object.entries(LOGOS).map(([clef, l]) => ({
      clef, nom: l.nom, note: l.note, fond: l.fond,
      svg: `/kit/logo/${clef}.svg?v=${v}`,
      png: l.tailles.map(t => ({ taille: t, url: `/kit/logo/${clef}-${t}.png?v=${v}` })),
    })),
    diaporama: DIAPO.map((d, i) => ({
      n: i + 1, titre: d.titre.replace(/<[^>]+>/g, ''),
      livre: `${DIAPO_TAILLE.width * DIAPO_TAILLE.scale}×${DIAPO_TAILLE.height * DIAPO_TAILLE.scale}`,
      fichier: `/kit/diapo/${i + 1}.png?v=${v}`,
      apercu: `/kit/diapo/${i + 1}-apercu.png?v=${v}`,
    })),
    visuels: CLES.map(f => ({
      format: f,
      cible: FORMATS[f].cible,
      page_css: `${FORMATS[f].width}×${FORMATS[f].height}`,
      rendu: `${FORMATS[f].scale}×`,
      livre: `${FORMATS[f].width * FORMATS[f].scale}×${FORMATS[f].height * FORMATS[f].scale}`,
      fichier: `/kit/${f}.png?v=${v}`,
      apercu: `/kit/${f}-apercu.png?v=${v}`,
      en_cache: existsSync(chemin(f, v)),
    })),
  };
}

// Deux onglets ouverts sur la page, c'est douze requêtes d'un coup : sans ce registre,
// chacune lancerait son propre rendu du même visuel et la file du moteur les empilerait.
const enCours = new Map();

/** Chemin d'un visuel du kit, rendu à la demande au premier accès. */
export function visuel(format, { apercu = false } = {}) {
  if (!FORMATS[format]) throw Object.assign(new Error(`format inconnu : ${format}`), { status: 404 });
  const v = empreinte();
  const voulu = chemin(format, v, apercu);
  if (existsSync(voulu)) return Promise.resolve(voulu);
  const clef = `${format}-${v}`;
  if (!enCours.has(clef)) enCours.set(clef, produire(format, v).finally(() => enCours.delete(clef)));
  return enCours.get(clef).then(() => voulu);
}

/** Une image du diaporama, rendue à la demande. */
export function diapo(n, { apercu = false } = {}) {
  if (!Number.isInteger(n) || n < 1 || n > DIAPO.length)
    throw Object.assign(new Error(`image de diaporama inconnue : ${n} (1 à ${DIAPO.length})`), { status: 404 });
  const v = empreinte();
  const voulu = join(CACHE, `diapo-${n}-${v}${apercu ? '-apercu' : ''}.png`);
  if (existsSync(voulu)) return Promise.resolve(voulu);
  const cle = `diapo-${n}-${v}`;
  if (!enCours.has(cle)) enCours.set(cle, produireDiapo(n, v).finally(() => enCours.delete(cle)));
  return enCours.get(cle).then(() => voulu);
}

async function produireDiapo(n, v) {
  const g = gabaritBanniere();
  const plein = join(CACHE, `diapo-${n}-${v}.png`);
  const travail = join(CACHE, `.travail-diapo-${n}`);
  mkdirSync(CACHE, { recursive: true });
  await render({ html: g.build(DIAPO[n - 1]), dir: travail, ...DIAPO_TAILLE, fps: g.fps, formats: ['png'] });
  renameSync(join(travail, 'visuel.png'), plein);
  rmSync(travail, { recursive: true, force: true });
  reduire(plein, join(CACHE, `diapo-${n}-${v}-apercu.png`));
  purge(v);
}

/** Aperçu léger : la page en montre une dizaine, servir les pleins formats pour un
 *  écran de 900 px ferait attendre pour rien. `min(900,iw)` — jamais agrandir. */
function reduire(source, cible) {
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', source,
    '-vf', "scale='min(900,iw)':-2:flags=lanczos", cible]);
  if (r.status !== 0) throw new Error(`ffmpeg a échoué sur l'aperçu de ${source}`);
}

/** Le SVG d'une variante, servi depuis brand/ sans copie. */
export function logoSvg(clef) {
  if (!LOGOS[clef]) throw Object.assign(new Error(`variante inconnue : ${clef}`), { status: 404 });
  return join(BRAND, LOGOS[clef].fichier);
}

/** Le PNG d'une variante à une taille, rastérisé à la demande. Transparent : un logo
 *  qui arrive avec un fond blanc n'est pas posable sur autre chose que du blanc. */
export function logoPng(clef, taille) {
  const l = LOGOS[clef];
  if (!l) throw Object.assign(new Error(`variante inconnue : ${clef}`), { status: 404 });
  if (!l.tailles.includes(taille))
    throw Object.assign(new Error(`taille non servie pour ${clef} : ${taille} (servies : ${l.tailles.join(', ')})`), { status: 404 });
  const v = empreinte();
  const png = join(CACHE, `logo-${clef}-${taille}-${v}.png`);
  if (existsSync(png)) return Promise.resolve(png);
  const cle = `logo-${clef}-${taille}-${v}`;
  if (!enCours.has(cle)) enCours.set(cle, produireLogo(clef, taille, png, v).finally(() => enCours.delete(cle)));
  return enCours.get(cle).then(() => png);
}

async function produireLogo(clef, taille, png, v) {
  const svg = readFileSync(join(BRAND, LOGOS[clef].fichier), 'utf8');
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>` +
    `html,body{margin:0;padding:0;width:${taille}px;height:${taille}px;overflow:hidden;background:transparent}` +
    `svg{display:block;width:${taille}px;height:${taille}px}</style></head><body>${svg}</body></html>`;
  const travail = join(CACHE, `.travail-logo-${clef}-${taille}`);
  mkdirSync(CACHE, { recursive: true });
  await render({ html, dir: travail, width: taille, height: taille, formats: ['png'], transparent: true });
  renameSync(join(travail, 'visuel.png'), png);
  rmSync(travail, { recursive: true, force: true });
  purge(v);
}

/** Les fichiers d'une empreinte précédente ne servent plus à personne. */
function purge(v) {
  for (const f of readdirSync(CACHE))
    if (f.endsWith('.png') && !f.includes(`-${v}`)) rmSync(join(CACHE, f), { force: true });
}

async function produire(format, v) {
  const { width, height, scale } = FORMATS[format];
  const g = gabarit();
  const travail = join(CACHE, `.travail-${format}`);
  mkdirSync(CACHE, { recursive: true });
  await render({ html: g.build({ ...donnees(), format }), dir: travail,
    width, height, scale, fps: g.fps, formats: ['png'] });
  renameSync(join(travail, 'visuel.png'), chemin(format, v));
  rmSync(travail, { recursive: true, force: true });

  reduire(chemin(format, v), chemin(format, v, true));
  purge(v);
}
