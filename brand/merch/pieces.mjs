// Les pièces de merch : leur format, le mark qu'elles prennent, et surtout SUR QUEL
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

// Une entrée = un fichier d'impression. `sur` dit sur QUELLE couleur de textile il va :
// c'est la seule chose qui compte au moment de téléverser.
export const PIECES = [
  { id: 'mark-couleur', w: 4000, h: 4000, mark: 'otomata-mark.svg', mot: null,
    sur: 'textiles clairs (blanc, crème, gris clair)' },
  { id: 'mark-encre', w: 4000, h: 4000, mark: 'otomata-mark-mono-encre.svg', mot: null,
    sur: 'textiles saffran ou jaunes, où le mark en couleur se noierait' },
  { id: 'mark-blanc', w: 4000, h: 4000, mark: 'otomata-mark-mono-blanc.svg', mot: null,
    sur: 'textiles foncés (noir, encre, marine)' },
  { id: 'otomata-couleur', w: 3200, h: 4000, mark: 'otomata-mark.svg', mot: ENCRE, ombre: SAFFRAN,
    sur: 'textiles clairs — mark + nom, la pièce principale' },
  { id: 'otomata-encre', w: 3200, h: 4000, mark: 'otomata-mark-mono-encre.svg', mot: ENCRE, ombre: null,
    sur: 'textiles saffran ou jaunes' },
  { id: 'otomata-blanc', w: 3200, h: 4000, mark: 'otomata-mark-mono-blanc.svg', mot: CREME, ombre: null,
    sur: 'textiles foncés' },
  { id: 'mot-couleur', w: 4000, h: 1500, mark: null, mot: ENCRE, ombre: SAFFRAN,
    sur: 'textiles clairs — le nom seul, en bandeau (dos, ou poitrine large)' },
  { id: 'mot-blanc', w: 4000, h: 1500, mark: null, mot: CREME, ombre: null,
    sur: 'textiles foncés — le nom seul' },
];

export const page = p => {
  const markSvg = p.mark ? svg(p.mark) : '';
  const tailleMark = p.mot ? Math.round(p.w * 0.52) : Math.round(Math.min(p.w, p.h) * 0.86);
  const tailleMot = p.mark ? Math.round(p.w * 0.20) : Math.round(p.h * 0.62);
  const decal = Math.round(tailleMot * 0.09);
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..800&display=swap">
<style>
  html,body{margin:0;padding:0;width:${p.w}px;height:${p.h}px;overflow:hidden;background:transparent}
  body{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${Math.round(p.w * 0.06)}px}
  .m{width:${tailleMark}px;height:${tailleMark}px;display:${p.mark ? 'block' : 'none'}}
  .m svg{width:100%;height:100%;display:block}
  .mot{display:${p.mot ? 'block' : 'none'};
    font-family:"Bricolage Grotesque",sans-serif;font-optical-sizing:auto;
    font-variation-settings:"wdth" 90;font-weight:600;letter-spacing:-.035em;
    font-size:${tailleMot}px;line-height:.9;color:${p.mot || 'transparent'};
    ${p.ombre ? `text-shadow:${decal}px ${decal}px 0 ${p.ombre};` : ''}}
</style></head><body>
  <div class="m">${markSvg}</div>
  <div class="mot">OTOMATA</div>
</body></html>`;
};

