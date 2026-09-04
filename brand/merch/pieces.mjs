// Les pièces de merch : leur composition, le mark qu'elles prennent, et surtout SUR QUEL
// TEXTILE elles vont — c'est la seule chose à savoir au moment de téléverser.
// Partagé par le build local (build-merch.mjs) et par le studio (service/brand.mjs) :
// une seule source, sinon la page publique annoncerait des fichiers que le build ne
// produit pas.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const svg = f => readFileSync(join(ROOT, 'brand/logos/otomata', f), 'utf8');

const ENCRE = '#2c2112', CREME = '#fefcf5', SAFFRAN = '#f0b41e';

// « OTOMATA » en Bricolage Grotesque 600 / wdth 90 / letter-spacing -.035em occupe
// 3,84 × sa font-size en largeur. Mesuré sur le rendu, c'est ce qui permet de caler le
// mot sur le mark sans tâtonner.
const RATIO_MOT = 3.84;
// Le centre optique du mark n'est pas celui de sa boîte : le disque est à cy=60/128,
// l'ombre déborde en bas. Un lockup calé sur la boîte penche visuellement.
const RECENTRE = 0.031;

// Une entrée = un fichier d'impression.
//   `pose`  — vertical (mark au-dessus du nom), ligne (mark puis nom), mark seul, mot seul
//   `sur`   — sur QUELLE couleur de textile le fichier va : la seule chose qui compte
//             au moment de téléverser.
// Les dimensions finales ne sont pas ici : le build recadre au contenu puis ramène le
// côté long à 4000 px (cf. build-merch.mjs).
export const PIECES = [
  { id: 'mark-couleur', pose: 'mark', mark: 'otomata-mark.svg',
    sur: 'textiles clairs (blanc, crème, gris clair)' },
  { id: 'mark-encre', pose: 'mark', mark: 'otomata-mark-mono-encre.svg',
    sur: 'textiles saffran ou jaunes, où le mark en couleur se noierait' },
  { id: 'mark-blanc', pose: 'mark', mark: 'otomata-mark-mono-blanc.svg',
    sur: 'textiles foncés (noir, encre, marine)' },

  { id: 'otomata-couleur', pose: 'vertical', mark: 'otomata-mark.svg', mot: ENCRE, ombre: SAFFRAN,
    sur: 'textiles clairs — la pièce principale : dos de t-shirt, tote bag' },
  { id: 'otomata-encre', pose: 'vertical', mark: 'otomata-mark-mono-encre.svg', mot: ENCRE, ombre: null,
    sur: 'textiles saffran ou jaunes' },
  { id: 'otomata-blanc', pose: 'vertical', mark: 'otomata-mark-mono-blanc.svg', mot: CREME, ombre: null,
    sur: 'textiles foncés' },

  { id: 'ligne-couleur', pose: 'ligne', mark: 'otomata-mark.svg', mot: ENCRE, ombre: SAFFRAN,
    sur: 'textiles clairs — poitrine (cœur), mug, casquette' },
  { id: 'ligne-encre', pose: 'ligne', mark: 'otomata-mark-mono-encre.svg', mot: ENCRE, ombre: null,
    sur: 'textiles saffran ou jaunes — poitrine (cœur)' },
  { id: 'ligne-blanc', pose: 'ligne', mark: 'otomata-mark-mono-blanc.svg', mot: CREME, ombre: null,
    sur: 'textiles foncés — poitrine (cœur)' },

  { id: 'mot-couleur', pose: 'mot', mot: ENCRE, ombre: SAFFRAN,
    sur: 'textiles clairs — le nom seul, en bandeau (dos large, gourde)' },
  { id: 'mot-blanc', pose: 'mot', mot: CREME, ombre: null,
    sur: 'textiles foncés — le nom seul' },
];

// U est une unité de PROPORTION, pas une taille : le build recadre au contenu puis ramène
// le côté long à 4000 px, en rendant à l'échelle qu'il faut pour y arriver. Ce qui se règle
// ici, c'est le rapport entre le mark, le mot et l'air qui les sépare — rien d'autre.
const U = 1000;
const CANEVAS = {
  mark:     { w: 1.2, h: 1.2 },
  vertical: { w: 1.7, h: 1.6 },
  ligne:    { w: 4.0, h: 1.5 },
  mot:      { w: 4.6, h: 1.6 },
};

export const canevas = p => ({
  w: Math.round(U * CANEVAS[p.pose].w), h: Math.round(U * CANEVAS[p.pose].h),
});

export const page = (p, echelle = 1) => {
  const c = canevas(p);
  const w = Math.round(c.w * echelle), h = Math.round(c.h * echelle);
  const u = U * echelle;
  const markSvg = p.mark ? svg(p.mark) : '';
  // Le mot se cale sur le mark : plus large que lui en pose verticale, à sa hauteur
  // optique en ligne.
  const fonte = p.pose === 'mot' ? Math.round(u)
    : p.pose === 'vertical' ? Math.round(u * 1.35 / RATIO_MOT)
    : Math.round(u * 0.54);
  const decal = Math.round(fonte * 0.06);
  const ligne = p.pose === 'ligne';
  // Le gap vertical est petit à dessein : le SVG du mark réserve déjà ~8 % d'air sous
  // l'ombre, et un gap CSS « normal » s'y ajoute — le mot décrochait du mark.
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..800&display=swap">
<style>
  html,body{margin:0;padding:0;width:${w}px;height:${h}px;overflow:hidden;background:transparent}
  body{display:flex;flex-direction:${ligne ? 'row' : 'column'};align-items:center;justify-content:center;
       gap:${Math.round(u * (ligne ? 0.18 : 0.02))}px}
  .m{width:${Math.round(u)}px;height:${Math.round(u)}px;display:${p.mark ? 'block' : 'none'};flex:none}
  .m svg{width:100%;height:100%;display:block}
  .mot{display:${p.mot ? 'block' : 'none'};white-space:nowrap;
    font-family:"Bricolage Grotesque",sans-serif;font-optical-sizing:auto;
    font-variation-settings:"wdth" 90;font-weight:600;letter-spacing:-.035em;
    font-size:${fonte}px;line-height:.9;color:${p.mot || 'transparent'};
    ${p.mark ? `margin-top:${ligne ? Math.round(-u * RECENTRE) : 0}px;` : ''}
    ${p.ombre ? `text-shadow:${decal}px ${decal}px 0 ${p.ombre};` : ''}}
</style></head><body>
  <div class="m">${markSvg}</div>
  <div class="mot">OTOMATA</div>
</body></html>`;
};
