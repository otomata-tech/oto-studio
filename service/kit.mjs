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

const gabarit = () => templates.get('kit-identite');

// Les données du kit officiel sont l'exemple du gabarit : une seule source, sinon la page
// du kit et le formulaire montreraient deux identités qui divergent en silence.
export const donnees = () => gabarit().example;

const empreinte = () => createHash('sha1')
  .update(readFileSync(FRAGMENT))
  .update(JSON.stringify(FORMATS))
  .update(JSON.stringify(donnees()))
  .digest('hex').slice(0, 8);

const chemin = (f, v, apercu) => join(CACHE, `${f}-${v}${apercu ? '-apercu' : ''}.png`);

/** Ce que la page affiche : un visuel par format, sa cible, sa cote livrée, ses URL. */
export function etat() {
  const v = empreinte();
  return {
    version: v,
    identite: donnees(),
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

async function produire(format, v) {
  const { width, height, scale } = FORMATS[format];
  const g = gabarit();
  const travail = join(CACHE, `.travail-${format}`);
  mkdirSync(CACHE, { recursive: true });
  await render({ html: g.build({ ...donnees(), format }), dir: travail,
    width, height, scale, fps: g.fps, formats: ['png'] });
  renameSync(join(travail, 'visuel.png'), chemin(format, v));
  rmSync(travail, { recursive: true, force: true });

  // Aperçu léger : la page en montre six d'un coup, et servir douze mégaoctets de PNG
  // pleine résolution pour un écran de 900 px, c'est faire attendre pour rien.
  // `min(900,iw)` — jamais agrandir l'avatar de 800 px en 900.
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', chemin(format, v),
    '-vf', "scale='min(900,iw)':-2:flags=lanczos", chemin(format, v, true)]);
  if (r.status !== 0) throw new Error(`ffmpeg a échoué sur l'aperçu de ${format}`);

  // Les visuels d'une empreinte précédente ne servent plus à personne.
  for (const f of readdirSync(CACHE))
    if (f.endsWith('.png') && !f.includes(`-${v}`)) rmSync(join(CACHE, f), { force: true });
}
