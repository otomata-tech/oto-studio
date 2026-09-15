// L'atelier photo : recadrer, égaliser, et — en option — retoucher UNE zone au modèle
// d'image. Chaque passe laisse l'originale intacte ; le résultat est un NOUVEAU dépôt,
// réutilisable dans n'importe quel gabarit.
//
// Tout le travail d'image se fait dans le Chrome du service (`dansChrome`), qui est déjà
// là pour les rendus : pas d'ImageMagick à poser sur la box, pas de binding natif, pas de
// `node_modules` dans un service qui n'en a aucun. Les formules sont dans `photo-ops.js`,
// mesurées contre ImageMagick — écart constaté sur la photo du Grand Bain : 0,265 %.
//
// ⚠️ Le piège, mesuré le 15/09/2026 : le modèle d'image RÉGÉNÈRE toute l'image et RÉÉCRIT
// les textes, malgré la consigne de tout conserver — un badge « STARTUP » devenu
// « STUNTLID », un t-shirt « otomata.tech » devenu « ctamalatach », les logos du fond
// déformés. Sa sortie entière est inutilisable. On n'en garde que la ZONE visée, fondue
// par un masque adouci sur la photo égalisée. D'où la règle : pas de passe IA sans zone.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dansChrome } from './render.mjs';
import * as uploads from './uploads.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const OPS = readFileSync(join(DIR, 'photo-ops.js'), 'utf8');

const PROMPT_BASE = 'Retouche photo réaliste et discrète de ce portrait d\'événement : balance des blancs '
  + 'neutre, exposition et contraste équilibrés, couleurs naturelles, légère netteté. Conserve à l\'identique '
  + 'le cadrage, la personne, son visage, ses vêtements, le badge, et tous les logos et textes du fond. '
  + 'Aucun élément ajouté ni retiré.';

// Le premier qui répond gagne ; le travail rendu dit lequel a servi.
const MODELES = ['gemini-3-pro-image-preview', 'gemini-3-pro-image', 'gemini-2.5-flash-image'];
const ENDPOINT = m => `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`;

const erreur = (msg, status) => Object.assign(new Error(msg), { status });

/** Ce que le service sait faire ici : Chrome est une condition de TOUT le studio, la clé
 *  du modèle n'en est une que pour la retouche. L'IHM n'offre pas ce qui échouerait. */
export const capacites = () => ({ ia: !!process.env.GEMINI_API_KEY });

/** Une zone en FRACTIONS de l'image (0 → 1), donc indépendante de la taille : ce que
 *  l'aperçu désigne vaut sur le fichier pleine résolution. */
function valide(zone, quoi) {
  const n = c => {
    const v = Number(zone?.[c]);
    if (!Number.isFinite(v)) throw erreur(`${quoi} : ${c} manquant ou illisible`, 400);
    return v;
  };
  const z = { x: n('x'), y: n('y'), w: n('w'), h: n('h') };
  if (z.w <= 0 || z.h <= 0) throw erreur(`${quoi} : largeur et hauteur doivent être positives`, 400);
  if (z.x < 0 || z.y < 0 || z.x + z.w > 1.0001 || z.y + z.h > 1.0001)
    throw erreur(`${quoi} : la zone sort de l'image`, 400);
  return z;
}

/** Le rapport d'aspect demandé au modèle, dans les valeurs qu'il accepte. */
const ratio = (w, h) => {
  const connus = { '1:1': 1, '3:4': .75, '4:3': 4 / 3, '9:16': .5625, '16:9': 16 / 9,
    '4:5': .8, '5:4': 1.25, '2:3': 2 / 3, '3:2': 1.5 };
  const r = w / h;
  return Object.entries(connus).sort((a, b) => Math.abs(a[1] - r) - Math.abs(b[1] - r))[0][0];
};

async function passeIA(dataUri, prompt, w, h) {
  const cle = process.env.GEMINI_API_KEY;
  if (!cle) throw erreur(
    'GEMINI_API_KEY absente de ce service : la retouche IA n\'y est pas configurée '
    + '(le recadrage et l\'égalisation, si)', 503);
  const corps = {
    contents: [{ parts: [{ text: prompt },
      { inline_data: { mime_type: 'image/jpeg', data: dataUri.split(',')[1] } }] }],
    generationConfig: { responseModalities: ['IMAGE', 'TEXT'],
      imageConfig: { imageSize: '2K', aspectRatio: ratio(w, h) } },
  };
  const refus = [];
  for (const modele of MODELES) {
    const rep = await fetch(ENDPOINT(modele), { method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cle },
      body: JSON.stringify(corps) });
    if (!rep.ok) { refus.push(`${modele} → ${rep.status} ${(await rep.text()).slice(0, 120)}`); continue; }
    const j = await rep.json();
    const part = j.candidates?.[0]?.content?.parts?.find(p => p.inline_data || p.inlineData);
    const data = (part?.inline_data || part?.inlineData)?.data;
    if (!data) { refus.push(`${modele} → aucune image dans la réponse`); continue; }
    return { uri: `data:image/png;base64,${data}`, modele };
  }
  throw erreur(`aucun modèle d'image n'a répondu (${refus.join(' · ')})`, 502);
}

/** La page de travail : les opérations, le travail à faire, et une promesse à lire. */
function page(travail) {
  return `<!doctype html><meta charset="utf-8"><title>atelier</title>
<script type="module">
${OPS}
const T = ${JSON.stringify(travail)};

const charge = src => new Promise((ok, ko) => {
  const img = new Image();
  img.onload = () => ok(img);
  img.onerror = () => ko(new Error('image illisible'));
  img.src = src;
});

window.__fait = (async () => {
  const img = await charge(T.source);
  // L'orientation EXIF est appliquée par Chrome au décodage (\`image-orientation:
  // from-image\` est le défaut) : \`naturalWidth/Height\` sont DÉJÀ redressés, comme après
  // un \`-auto-orient\`. Rien à faire de plus, mais rien à défaire non plus.
  const sw = img.naturalWidth, sh = img.naturalHeight;
  const c = T.recadre
    ? { x: Math.round(T.recadre.x * sw), y: Math.round(T.recadre.y * sh),
        w: Math.round(T.recadre.w * sw), h: Math.round(T.recadre.h * sh) }
    : { x: 0, y: 0, w: sw, h: sh };
  if (c.w < 16 || c.h < 16) throw new Error('zone de recadrage trop petite');

  const cv = document.createElement('canvas');
  cv.width = c.w; cv.height = c.h;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h);

  if (T.egalise) {
    const id = ctx.getImageData(0, 0, c.w, c.h);
    egalise(id.data, c.w, c.h);
    ctx.putImageData(id, 0, 0);
  }

  if (T.ia) {
    const ia = await charge(T.ia.image);
    const z = { x: Math.round(T.ia.zone.x * c.w), y: Math.round(T.ia.zone.y * c.h),
                w: Math.round(T.ia.zone.w * c.w), h: Math.round(T.ia.zone.h * c.h) };
    const zc = document.createElement('canvas');
    zc.width = c.w; zc.height = c.h;
    const zx = zc.getContext('2d');
    // À la taille EXACTE de la base : le modèle rend ce qu'il veut, et un décalage d'un
    // pixel se verrait sur le bord de la zone.
    zx.drawImage(ia, 0, 0, c.w, c.h);
    // Le masque devient l'ALPHA de la retouche : \`destination-in\` ne garde de ce qui est
    // déjà peint que ce que la nouvelle forme couvre, et la forme est floutée — la
    // retouche se fond au lieu de laisser un rectangle net.
    zx.globalCompositeOperation = 'destination-in';
    zx.filter = 'blur(' + T.ia.flou + 'px)';
    zx.fillStyle = '#fff';
    zx.beginPath();
    zx.roundRect(z.x, z.y, z.w, z.h, Math.round(Math.min(z.w, z.h) * .15));
    zx.fill();
    ctx.drawImage(zc, 0, 0);
  }

  return { image: cv.toDataURL('image/jpeg', .95), largeur: c.w, hauteur: c.h };
})();
<\/script>`;
}

const execute = (dir, travail, nom) => {
  const f = join(dir, nom);
  writeFileSync(f, page(travail));
  return dansChrome(f);
};

const enBuffer = uri => Buffer.from(uri.split(',')[1], 'base64');

/**
 * @param recadre {x,y,w,h} en fractions de l'ORIGINALE, appliqué en premier.
 * @param egalise passe déterministe (défaut : oui).
 * @param zone    {x,y,w,h} en fractions de l'image APRÈS recadrage — celle que l'aperçu montre.
 */
export async function travaille(id, { recadre = null, egalise = true, ia = false, prompt = '', zone = null } = {}) {
  if (!uploads.existe(id)) throw erreur(`image inconnue : ${id}`, 400);
  if (ia && !zone) throw erreur(
    'la retouche IA exige une zone : hors de cette zone, le modèle réécrit les textes et les logos', 400);
  if (!recadre && !egalise && !ia) throw erreur('rien à faire : ni recadrage, ni égalisation, ni retouche', 400);
  const cadre = recadre ? valide(recadre, 'recadrage') : null;
  const cible = ia ? valide(zone, 'zone de retouche') : null;

  const dir = mkdtempSync(join(tmpdir(), 'oto-photo-'));
  try {
    const source = uploads.dataUri(id);
    let base = await execute(dir, { source, recadre: cadre, egalise }, 'base.html');
    let modele = null;

    if (ia) {
      const p = [PROMPT_BASE, String(prompt || '').trim()].filter(Boolean).join(' ');
      const rendu = await passeIA(base.image, p, base.largeur, base.hauteur);
      modele = rendu.modele;
      base = await execute(dir,
        { source: base.image, recadre: null, egalise: false,
          ia: { image: rendu.uri, zone: cible, flou: 18 } }, 'retouche.html');
    }

    const recu = uploads.depose(enBuffer(base.image), 'image/jpeg');
    uploads.purge();
    return { ...recu, largeur: base.largeur, hauteur: base.hauteur, source: id,
      passes: { recadre: !!cadre, egalise: !!egalise, ia: !!ia }, modele };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
