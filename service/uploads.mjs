// Les images déposées depuis l'IHM (ou par un agent), stockées HORS des travaux.
//
// Pourquoi pas dans les données du travail : `job.json` garde `data` tel quel, et
// `GET /api/renders` relit tous les travaux — la galerie le fait toutes les 15 s. Une
// image en data-URI dans `data` gonflerait le fichier ET chaque réponse de la galerie.
// L'image vit donc à côté, le travail n'en garde que l'identifiant.
//
// L'identifiant est l'empreinte du contenu : redéposer la même image ne la duplique pas.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'out', 'uploads');
mkdirSync(DIR, { recursive: true });

export const TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const MIME = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const FORME = /^[0-9a-f]{16}\.(?:jpg|png|webp)$/;

export const chemin = id => join(DIR, basename(id));
export const existe = id => typeof id === 'string' && FORME.test(id) && existsSync(chemin(id));

export function depose(buf, contentType) {
  const ext = TYPES[String(contentType || '').split(';')[0].trim()];
  if (!ext) throw Object.assign(
    new Error(`type d'image non servi : ${contentType || 'aucun'} (servis : ${Object.keys(TYPES).join(', ')})`),
    { status: 415 });
  if (!buf?.length) throw Object.assign(new Error('image vide'), { status: 400 });
  const id = createHash('sha1').update(buf).digest('hex').slice(0, 16) + ext;
  writeFileSync(chemin(id), buf);
  return { id, url: `/uploads/${id}`, bytes: buf.length };
}

/** L'image, prête à être posée dans un gabarit. Lève si l'identifiant ne désigne rien :
 *  une image absente doit se voir au rendu, pas donner un cadre vide. */
export function dataUri(id) {
  if (!existe(id)) throw Object.assign(new Error(`image inconnue : ${id}`), { status: 400 });
  return `data:${MIME[extname(id)]};base64,${readFileSync(chemin(id)).toString('base64')}`;
}

/** Garde les `garde` plus récentes. Une image purgée n'efface aucun visuel déjà rendu —
 *  elle est dans le PNG produit ; seule la reprise d'un ancien travail la redemanderait. */
export function purge(garde = 200) {
  const tous = readdirSync(DIR).filter(f => FORME.test(f))
    .map(f => ({ f, t: statSync(join(DIR, f)).mtimeMs }))
    .sort((a, b) => a.t - b.t);
  for (const { f } of tous.slice(0, Math.max(0, tous.length - garde))) rmSync(join(DIR, f), { force: true });
}
