// La planche qu'on montre AVANT de commander : les mêmes fichiers d'impression que
// `print/`, posés sur des silhouettes de pièces. Ce sont des dessins, pas des photos
// truquées — une fausse photo produit donne une idée fausse du rendu textile.
const ENCRE = '#2c2112', CREME = '#fefcf5', SAFFRAN = '#f0b41e', PAPIER = '#f4ecd2';

// Silhouettes. Chacune est un fragment SVG paramétré par la couleur du support, avec
// une zone d'impression (`x y w h` en unités du viewBox) où vient se poser le visuel.
export const SUPPORTS = {
  tshirtDevant: {
    vb: '0 0 200 232',
    forme: c => `<path d="M38,24 L4,58 L32,86 L48,72 L48,224 L152,224 L152,72 L168,86 L196,58 L162,24
      L138,14 C138,32 122,42 100,42 C78,42 62,32 62,14 Z" fill="${c}" stroke="${ENCRE}" stroke-width="2.5"
      stroke-linejoin="round"/>`,
    // poitrine gauche DU PORTEUR : vu de face, elle est dans la moitié droite de l'image
    zone: { x: 101, y: 60, w: 50, h: 26 },
  },
  tshirtDos: {
    vb: '0 0 200 232',
    forme: c => `<path d="M38,24 L4,58 L32,86 L48,72 L48,224 L152,224 L152,72 L168,86 L196,58 L162,24
      L138,14 C138,26 122,32 100,32 C78,32 62,26 62,14 Z" fill="${c}" stroke="${ENCRE}" stroke-width="2.5"
      stroke-linejoin="round"/>`,
    zone: { x: 60, y: 62, w: 80, h: 100 },
  },
  tote: {
    vb: '0 0 200 232',
    forme: c => `<path d="M62,66 C62,16 138,16 138,66" fill="none" stroke="${ENCRE}" stroke-width="7"/>
      <rect x="26" y="62" width="148" height="158" rx="3" fill="${c}" stroke="${ENCRE}" stroke-width="2.5"/>`,
    zone: { x: 46, y: 92, w: 108, h: 108 },
  },
  mug: {
    vb: '0 0 200 150',
    forme: c => `<path d="M150,48 C186,48 186,102 150,102" fill="none" stroke="${ENCRE}" stroke-width="9"/>
      <rect x="22" y="22" width="128" height="106" rx="8" fill="${c}" stroke="${ENCRE}" stroke-width="2.5"/>`,
    zone: { x: 34, y: 58, w: 104, h: 34 },
  },
  sticker: {
    vb: '0 0 200 150',
    forme: () => `<circle cx="62" cy="75" r="46" fill="${CREME}" stroke="${ENCRE}" stroke-width="2.5"/>
      <rect x="118" y="52" width="68" height="46" rx="6" fill="${CREME}" stroke="${ENCRE}" stroke-width="2.5"/>`,
    zone: null, // deux visuels, posés à la main
  },
};

const piece = (support, textile, img, extra = '') => {
  const s = SUPPORTS[support];
  const z = s.zone;
  return `<svg viewBox="${s.vb}" class="sil">${s.forme(textile)}
    ${z && img ? `<image href="${img}" x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}"
      preserveAspectRatio="xMidYMid meet"/>` : ''}${extra}</svg>`;
};

/** `img` : les fichiers d'impression déjà encodés en data-URI, par identifiant de pièce. */
export const planche = img => {
  const grain = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><filter id="g">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3"/>
      <feColorMatrix type="saturate" values="0"/></filter>
     <rect width="220" height="220" filter="url(#g)" opacity="0.5"/></svg>`)}`;

  const vetement = (titre, textile, tirage, note, avant, arriere) => `
    <section class="rang">
      <div class="pieces">
        ${piece('tshirtDevant', textile, img[avant])}
        ${piece('tshirtDos', textile, img[arriere])}
      </div>
      <div class="dit">
        <h2>${titre}</h2>
        <p class="tirage">${tirage}</p>
        <p>${note}</p>
      </div>
    </section>`;

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..800&family=Hanken+Grotesk:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap">
<style>
  *{box-sizing:border-box;margin:0}
  body{width:1500px;height:2400px;background:${PAPIER};color:${ENCRE};
       font-family:"Hanken Grotesk",system-ui,sans-serif;padding:0 60px;position:relative;overflow:hidden}
  body::after{content:"";position:fixed;inset:0;background-image:url("${grain}");
       background-size:220px;mix-blend-mode:multiply;opacity:.13;pointer-events:none}
  .display{font-family:"Bricolage Grotesque",sans-serif;font-variation-settings:"wdth" 90;
       font-weight:600;letter-spacing:-.035em}
  .mono{font-family:"JetBrains Mono",monospace;font-weight:500;text-transform:uppercase;letter-spacing:.16em}

  header{padding:56px 0 34px;display:flex;align-items:flex-end;gap:26px;border-bottom:3px solid ${ENCRE}}
  header .m{width:76px;height:76px;flex:none;margin-bottom:4px}
  header h1{font-size:70px;line-height:.9;text-shadow:5px 5px 0 ${SAFFRAN}}
  header .quand{margin-left:auto;font-size:19px;color:#6c5e44;padding-bottom:10px}

  .rang{display:grid;grid-template-columns:380px 380px 1fr;gap:38px;align-items:center;
       padding:30px 0;border-bottom:1.5px solid #dccfa8}
  .rang .pieces{display:contents}
  .sil{width:100%;height:auto;display:block}
  .dit h2{font-family:"Bricolage Grotesque",sans-serif;font-variation-settings:"wdth" 90;font-weight:600;
       letter-spacing:-.03em;font-size:40px;line-height:1}
  .dit .tirage{font-family:"JetBrains Mono",monospace;font-weight:500;text-transform:uppercase;
       letter-spacing:.14em;font-size:14px;color:#6c5e44;margin:12px 0 14px}
  .dit p{font-size:21px;line-height:1.42;color:#4a3a23}

  .objets{padding:12px 0 0;display:grid;grid-template-columns:repeat(3,1fr);gap:40px}
  .objets h2{grid-column:1/-1;font-family:"Bricolage Grotesque",sans-serif;font-variation-settings:"wdth" 90;
       font-weight:600;font-size:40px;letter-spacing:-.03em;margin-bottom:8px}
  .objet .sil{height:236px;width:auto;max-width:100%;margin:0 auto 16px}
  .objet h3{font-family:"Bricolage Grotesque",sans-serif;font-variation-settings:"wdth" 90;font-weight:600;
       font-size:28px;letter-spacing:-.02em}
  .objet p{font-size:18px;line-height:1.4;color:#4a3a23;margin-top:6px}

  footer{position:absolute;left:60px;right:60px;bottom:44px;border-top:3px solid ${ENCRE};
       padding-top:20px;display:flex;gap:30px;align-items:baseline}
  footer .f{font-size:18px;color:#4a3a23;line-height:1.4}
  footer .url{margin-left:auto;font-size:15px;color:#6c5e44}
</style></head><body>

<header>
  <div class="m"><img src="${img['mark-couleur']}" style="width:100%;display:block"></div>
  <h1 class="display">MERCH</h1>
  <span class="quand mono">Propositions · septembre 2026</span>
</header>

${vetement('T-shirt crème', CREME, 'Impression une passe · fichier couleur',
  'Le mark et le nom, rien d\'autre. Sur du clair, le mark garde son cerne d\'encre et son ombre : c\'est la version complète.',
  'ligne-couleur', 'otomata-couleur')}

${vetement('T-shirt encre', ENCRE, 'Impression une passe · fichier blanc',
  'Sur du foncé, le mark passe en blanc plein. Il perd son cerne, et c\'est le vide entre le disque et l\'anneau qui porte le décalage.',
  'ligne-blanc', 'otomata-blanc')}

${vetement('T-shirt saffran', SAFFRAN, 'Impression une passe · fichier encre',
  'Sur du jaune, le mark en couleur se noierait — disque et textile se confondent. D\'où la version encre. C\'est aussi le fichier du sweat à capuche jaune citron.',
  'ligne-encre', 'otomata-encre')}

<div class="objets">
  <h2>Et à côté</h2>
  <div class="objet">
    ${piece('tote', '#efe6cd', img['otomata-couleur'])}
    <h3>Tote bag</h3>
    <p>Une seule face, une seule encre : la pièce la moins chère et celle où le visuel du dos rend le mieux.</p>
  </div>
  <div class="objet">
    ${piece('mug', CREME, img['ligne-couleur'])}
    <h3>Mug</h3>
    <p>La surface s'enroule : c'est le lockup en ligne qui tient, pas l'empilé.</p>
  </div>
  <div class="objet">
    ${piece('sticker', CREME, null, `
      <image href="${img['mark-couleur']}" x="30" y="45" width="64" height="60" preserveAspectRatio="xMidYMid meet"/>
      <image href="${img['ligne-couleur']}" x="126" y="66" width="52" height="18" preserveAspectRatio="xMidYMid meet"/>`)}
    <h3>Stickers</h3>
    <p>Deux découpes : le mark seul en rond, le nom en ligne. Blanc mat, comme ceux d'avril.</p>
  </div>
</div>

<footer>
  <p class="f"><strong>Un seul dessin, trois encrages.</strong> Le fichier à téléverser dépend de la couleur
     du textile, jamais du produit — les cotes de la zone d'impression s'affichent dans leur outil au moment
     du téléversement.</p>
  <span class="url mono">otomata.tech</span>
</footer>
</body></html>`;
};
