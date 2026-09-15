// Les opérations d'image de l'atelier photo, en arithmétique pure sur des pixels RGBA.
//
// Pourquoi pas ImageMagick : le service n'a AUCUNE dépendance (ni npm, ni binaire au-delà
// de Chrome et ffmpeg, déjà là pour les rendus). Ce fichier tourne dans le Chrome du
// service — et, tel quel, dans Node pour être comparé à la référence.
//
// Les formules ont été MESURÉES contre ImageMagick 7.1.2 le 15/09/2026, pas devinées :
//   -auto-level          étirement LIÉ, min/max pris sur les trois canaux ensemble
//                        (par canal, il vire les couleurs — vérifié : IM ne le fait pas)
//   -sigmoidal-contrast  sigmoïde classique, appliquée en sRGB, SANS linéarisation
//   -modulate            en HSL : L × brillance, S × saturation
//   -unsharp             flou gaussien séparable, puis src + gain × (src − flou),
//                        seulement là où |2 × écart| ≥ seuil (le facteur 2 est celui d'IM)

/** Les niveaux et la sigmoïde sont des opérations POINT par canal : une table de 256
 *  entrées les fait en une seule fois, au lieu de deux passes sur des millions de pixels. */
export function tableNiveaux(min, max, contraste = 3, milieu = .5) {
  const table = new Uint8Array(256);
  const etendue = max - min;
  const f = x => 1 / (1 + Math.exp(contraste * (milieu - x)));
  const bas = f(0), haut = f(1);
  for (let v = 0; v < 256; v++) {
    const nivele = etendue > 0 ? Math.min(1, Math.max(0, (v - min) / etendue)) : v / 255;
    table[v] = Math.max(0, Math.min(255, Math.round(((f(nivele) - bas) / (haut - bas)) * 255)));
  }
  return table;
}

export function extremes(d) {
  let min = 255, max = 0;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    if (r < min) min = r; if (r > max) max = r;
    if (g < min) min = g; if (g > max) max = g;
    if (b < min) min = b; if (b > max) max = b;
  }
  return { min, max };
}

/** HSL, dans les deux sens, sur place — la seule opération qui ne soit pas par canal. */
function modulePixel(d, i, lum, sat) {
  const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let l = (max + min) / 2;
  if (max === min) {                      // gris : la saturation ne peut rien changer
    const v = Math.round(Math.min(1, l * lum) * 255);
    d[i] = d[i + 1] = d[i + 2] = v;
    return;
  }
  const delta = max - min;
  let s = l > .5 ? delta / (2 - max - min) : delta / (max + min);
  let h = max === r ? (g - b) / delta + (g < b ? 6 : 0)
        : max === g ? (b - r) / delta + 2
        : (r - g) / delta + 4;
  h /= 6;
  l = Math.min(1, l * lum);
  s = Math.min(1, s * sat);
  const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const canal = t => {
    t = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  d[i] = Math.round(canal(h + 1 / 3) * 255);
  d[i + 1] = Math.round(canal(h) * 255);
  d[i + 2] = Math.round(canal(h - 1 / 3) * 255);
}

/** Masque flou : `src + gain × (src − flou)`, mais seulement là où l'écart est franc —
 *  sinon on accentuerait le bruit des aplats autant que les contours.
 *
 *  Le flou gaussien est séparable (deux passes 1D au lieu d'une 2D : pour un rayon de 4,
 *  18 multiplications par pixel au lieu de 81) et tourne en FENÊTRE GLISSANTE : seules
 *  2·rayon+1 lignes floutées en X vivent à la fois. Matérialiser l'image floue entière
 *  coûterait 172 Mo en Float32 pour une photo de 7 Mpx — la box n'en dispose pas.
 *
 *  Écrire dans `d` au fil de l'eau est sûr : la ligne y+rayon est floutée en X AVANT que
 *  la ligne y ne soit écrasée, donc la fenêtre ne lit jamais un pixel déjà modifié. */
export function unsharp(d, w, h, sigma = 1.2, gain = .6, seuil = .02) {
  const rayon = Math.max(1, Math.ceil(sigma * 3));
  const noyau = new Float32Array(rayon * 2 + 1);
  let somme = 0;
  for (let k = -rayon; k <= rayon; k++) {
    const v = Math.exp(-(k * k) / (2 * sigma * sigma));
    noyau[k + rayon] = v; somme += v;
  }
  for (let k = 0; k < noyau.length; k++) noyau[k] /= somme;

  const lignes = rayon * 2 + 1;
  const anneau = new Float32Array(lignes * w * 3);
  const flouX = y => {
    const sy = Math.min(h - 1, Math.max(0, y)), base = ((y % lignes + lignes) % lignes) * w * 3;
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0;
      for (let k = -rayon; k <= rayon; k++) {
        const sx = Math.min(w - 1, Math.max(0, x + k)), p = (sy * w + sx) * 4, c = noyau[k + rayon];
        r += d[p] * c; g += d[p + 1] * c; b += d[p + 2] * c;
      }
      const q = base + x * 3;
      anneau[q] = r; anneau[q + 1] = g; anneau[q + 2] = b;
    }
  };

  for (let y = -rayon; y <= rayon; y++) flouX(y);
  const limite = seuil * 255, bases = new Int32Array(lignes);
  for (let y = 0; y < h; y++) {
    if (y > 0) flouX(y + rayon);
    // Les tours de l'anneau une seule fois par ligne : les recalculer par pixel et par
    // canal coûtait deux fois le temps de la passe.
    for (let k = -rayon; k <= rayon; k++)
      bases[k + rayon] = (((y + k) % lignes + lignes) % lignes) * w * 3;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, dx = x * 3;
      let vr = 0, vg = 0, vb = 0;
      for (let k = 0; k < lignes; k++) {
        const q = bases[k] + dx, c = noyau[k];
        vr += anneau[q] * c; vg += anneau[q + 1] * c; vb += anneau[q + 2] * c;
      }
      const er = d[i] - vr, eg = d[i + 1] - vg, eb = d[i + 2] - vb;
      if (Math.abs(2 * er) >= limite) d[i] = Math.max(0, Math.min(255, Math.round(d[i] + gain * er)));
      if (Math.abs(2 * eg) >= limite) d[i + 1] = Math.max(0, Math.min(255, Math.round(d[i + 1] + gain * eg)));
      if (Math.abs(2 * eb) >= limite) d[i + 2] = Math.max(0, Math.min(255, Math.round(d[i + 2] + gain * eb)));
    }
  }
}

/** La passe déterministe complète, dans l'ordre validé. `d` est modifié sur place. */
export function egalise(d, w, h, { contraste = 3, milieu = .5, lum = 1.02, sat = 1.05,
  sigma = 1.2, gain = .6, seuil = .02 } = {}) {
  const { min, max } = extremes(d);
  const table = tableNiveaux(min, max, contraste, milieu);
  for (let i = 0; i < d.length; i += 4) {
    d[i] = table[d[i]]; d[i + 1] = table[d[i + 1]]; d[i + 2] = table[d[i + 2]];
    modulePixel(d, i, lum, sat);
  }
  unsharp(d, w, h, sigma, gain, seuil);
}
