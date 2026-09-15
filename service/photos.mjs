// Travailler une photo déposée : la recadrer, l'égaliser, et — en option — retoucher une
// zone au modèle d'image. Chaque passe est indépendante et laisse l'originale intacte :
// le résultat est un NOUVEAU dépôt, réutilisable dans n'importe quel gabarit.
//
// ⚠️ Le piège, mesuré le 15/09/2026 sur la photo du Grand Bain : le modèle d'image
// RÉGÉNÈRE toute l'image et RÉÉCRIT les textes, malgré la consigne de tout conserver — un
// badge « STARTUP » devenu « STUNTLID », un t-shirt « otomata.tech » devenu « ctamalatach »,
// les logos du fond déformés. Sa sortie entière est donc inutilisable. On n'en garde que la
// ZONE visée, fondue par un masque adouci sur la photo déterministe : le reste de l'image
// n'est jamais touché par le modèle. D'où la règle : pas de passe IA sans zone.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as uploads from './uploads.mjs';

// Ce qui a été validé à la main ce jour-là, repris au réglage près.
const DETERMINISTE = ['-auto-orient', '-auto-level', '-sigmoidal-contrast', '3x50%',
  '-modulate', '102,105,100', '-unsharp', '0x1.2+0.6+0.02'];

const PROMPT_BASE = 'Retouche photo réaliste et discrète de ce portrait d\'événement : balance des blancs '
  + 'neutre, exposition et contraste équilibrés, couleurs naturelles, légère netteté. Conserve à l\'identique '
  + 'le cadrage, la personne, son visage, ses vêtements, le badge, et tous les logos et textes du fond. '
  + 'Aucun élément ajouté ni retiré.';

// Le premier qui répond gagne ; le travail rendu dit lequel a servi.
const MODELES = ['gemini-3-pro-image-preview', 'gemini-3-pro-image', 'gemini-2.5-flash-image'];
const ENDPOINT = m => `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`;

const erreur = (msg, status) => Object.assign(new Error(msg), { status });

function magick(args, quoi) {
  const r = spawnSync('magick', args, { encoding: 'buffer' });
  if (r.error?.code === 'ENOENT')
    throw erreur('ImageMagick absent de ce service : recadrer, égaliser et retoucher ont besoin de `magick`', 503);
  if (r.status !== 0) throw erreur(`${quoi} : ${String(r.stderr).slice(0, 300)}`, 500);
  return r.stdout;
}

/** Ce que le service sait faire ici et maintenant — l'IHM n'offre pas ce qui échouerait. */
export const capacites = () => ({
  magick: spawnSync('magick', ['-version']).status === 0,
  ia: !!process.env.GEMINI_API_KEY,
});

const dimensions = f => {
  const out = String(magick([f, '-format', '%w %h', 'info:'], 'lecture des dimensions'));
  const [w, h] = out.trim().split(/\s+/).map(Number);
  if (!w || !h) throw erreur('image illisible', 400);
  return { w, h };
};

/** Une zone en FRACTIONS de l'image (0→1), donc indépendante de la taille : ce que
 *  l'aperçu désigne vaut sur le fichier pleine résolution. */
function pixels(zone, w, h, quoi) {
  const n = c => { const v = Number(zone?.[c]); if (!Number.isFinite(v)) throw erreur(`${quoi} : ${c} manquant`, 400); return v; };
  const [x, y, lw, lh] = ['x', 'y', 'w', 'h'].map(n);
  if (lw <= 0 || lh <= 0) throw erreur(`${quoi} : largeur et hauteur doivent être positives`, 400);
  const x1 = Math.max(0, Math.round(x * w)), y1 = Math.max(0, Math.round(y * h));
  const x2 = Math.min(w, Math.round((x + lw) * w)), y2 = Math.min(h, Math.round((y + lh) * h));
  if (x2 - x1 < 16 || y2 - y1 < 16) throw erreur(`${quoi} : zone trop petite`, 400);
  return { x1, y1, x2, y2, w: x2 - x1, h: y2 - y1 };
}

/** Le rapport d'aspect demandé au modèle, dans les valeurs qu'il accepte. */
const ratio = (w, h) => {
  const connus = { '1:1': 1, '3:4': .75, '4:3': 4 / 3, '9:16': .5625, '16:9': 16 / 9, '4:5': .8, '5:4': 1.25, '2:3': 2 / 3, '3:2': 1.5 };
  const r = w / h;
  return Object.entries(connus).sort((a, b) => Math.abs(a[1] - r) - Math.abs(b[1] - r))[0][0];
};

async function passeIA(fichier, prompt, w, h) {
  const cle = process.env.GEMINI_API_KEY;
  if (!cle) throw erreur(
    'GEMINI_API_KEY absente de ce service : la passe IA n\'y est pas configurée (recadrage et égalisation, si)', 503);
  const corps = {
    contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: 'image/jpeg',
      data: readFileSync(fichier).toString('base64') } }] }],
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
    return { buf: Buffer.from(data, 'base64'), modele };
  }
  throw erreur(`aucun modèle d'image n'a répondu (${refus.join(' · ')})`, 502);
}

/**
 * @param recadre {x,y,w,h} en fractions de l'ORIGINALE, appliqué en premier.
 * @param egalise passe déterministe (défaut : oui).
 * @param zone    {x,y,w,h} en fractions de l'image APRÈS recadrage — celle que l'aperçu montre.
 */
export async function travaille(id, { recadre = null, egalise = true, ia = false, prompt = '', zone = null } = {}) {
  if (!uploads.existe(id)) throw erreur(`image inconnue : ${id}`, 400);
  if (ia && !zone) throw erreur(
    'la passe IA exige une zone : hors de cette zone, le modèle réécrit les textes et les logos', 400);
  if (!recadre && !egalise && !ia) throw erreur('rien à faire : ni recadrage, ni égalisation, ni retouche', 400);

  const dir = mkdtempSync(join(tmpdir(), 'oto-photo-'));
  try {
    const base = join(dir, 'base.jpg');
    const src = uploads.chemin(id);
    const decoupe = [];
    if (recadre) {
      const { w, h } = dimensions(src);
      const z = pixels(recadre, w, h, 'recadrage');
      decoupe.push('-crop', `${z.w}x${z.h}+${z.x1}+${z.y1}`, '+repage');
    }
    // -auto-orient AVANT la découpe : sinon le cadre désigné à l'écran, déjà redressé par le
    // navigateur, ne tombe pas au même endroit qu'en mémoire.
    magick([src, '-auto-orient', ...decoupe, ...(egalise ? DETERMINISTE : []), '-quality', '95', base],
      'recadrage et égalisation');

    let modele = null;
    if (ia) {
      const { w, h } = dimensions(base);
      const z = pixels(zone, w, h, 'zone de retouche');
      const p = [PROMPT_BASE, String(prompt || '').trim()].filter(Boolean).join(' ');
      const rendu = await passeIA(base, p, w, h);
      modele = rendu.modele;
      const brut = join(dir, 'ia.png'), cale = join(dir, 'ia-cale.png'), masque = join(dir, 'masque.png');
      writeFileSync(brut, rendu.buf);
      // À la taille EXACTE de la base, sinon le composite décale la zone.
      magick([brut, '-resize', `${w}x${h}!`, cale], 'mise à l\'échelle');
      const r = Math.round(Math.min(z.w, z.h) * .15);
      // Masque adouci : la retouche se fond, au lieu de laisser un rectangle net.
      magick(['-size', `${w}x${h}`, 'xc:black', '-fill', 'white',
        '-draw', `roundrectangle ${z.x1},${z.y1} ${z.x2},${z.y2} ${r},${r}`, '-blur', '0x18', masque], 'masque');
      magick([base, cale, masque, '-composite', '-quality', '95', base], 'composite');
    }

    const recu = uploads.depose(readFileSync(base), 'image/jpeg');
    uploads.purge();
    const { w, h } = dimensions(uploads.chemin(recu.id));
    return { ...recu, largeur: w, hauteur: h, source: id,
      passes: { recadre: !!recadre, egalise: !!egalise, ia: !!ia }, modele };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
