// Vocabulaire graphique commun des visuels « cas d'usage » d'oto.cx : palette, étiquettes, cotes, toit, fiches.
// Règle de lecture, la même sur tous les visuels : ce qui est mesuré ou déjà connu est en trait plein encre,
// ce que l'agent déduit ou produit est en saffran pointillé.
const Q = new URLSearchParams(location.search);
const ENCRE = Q.get('t') === 'encre';
// Sur fond encre, le trait passe en crème et le saffran reste l'accent du « déduit ».
const P = ENCRE
  ? { ink: '#fefcf5', hair: 'rgba(254,252,245,.28)', saf: '#f0b41e', safInk: '#f0b41e', paper: '#2c2112', paper2: 'rgba(254,252,245,.10)', mute: '#a89a78' }
  : { ink: '#2c2112', hair: '#a89a78', saf: '#f0b41e', safInk: '#b07d04', paper: '#fefcf5', paper2: '#f4ecd2', mute: '#6c5e44' };
P.terra = '#d63d0a'; P.olive = '#8aa620'; P.cobalt = '#1f6dba'; P.hairSoft = '#dccfa8';
const DASH = 'stroke-dasharray="6 5"';

// Étiquette en mono (défaut) ou en display.
function lab(x, y, t, { c = P.ink, fs = 13, anchor = 'middle', rot = 0, w = 700, font = 'JetBrains Mono', ls = 1.2 } = {}) {
  const r = rot ? `transform="rotate(${rot} ${x} ${y})"` : '';
  return `<text x="${x}" y="${y}" fill="${c}" font-family="${font}" font-size="${fs}" font-weight="${w}" letter-spacing="${ls}" text-anchor="${anchor}" ${r}>${T(t)}</text>`;
}
// Titre de document, en display.
const titre = (x, y, t, o = {}) => lab(x, y, t, { font: 'Bricolage Grotesque', w: 700, ls: -0.2, fs: 17, anchor: 'start', ...o });

// Cote d'architecte : un trait et deux talons ; pleine = mesurée, pointillée = déduite.
function cote(x1, y1, x2, y2, c = P.ink, dash = false, sw = 2.2) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), nx = -dy / L * 7, ny = dx / L * 7;
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${sw}" ${dash ? DASH : ''}/>
    <line x1="${x1 - nx}" y1="${y1 - ny}" x2="${x1 + nx}" y2="${y1 + ny}" stroke="${c}" stroke-width="${sw}"/>
    <line x1="${x2 - nx}" y1="${y2 - ny}" x2="${x2 + nx}" y2="${y2 + ny}" stroke="${c}" stroke-width="${sw}"/>`;
}

// Cadre de document : plein (connu) ou pointillé saffran (produit par l'agent).
function cadre(x, y, w, h, { agent = false, fill = P.paper, r = 10 } = {}) {
  const s = agent ? `stroke="${P.saf}" stroke-width="2.2" ${DASH}` : `stroke="${P.ink}" stroke-width="2"`;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${s}/>`;
}
// Lignes de texte fantômes (le contenu sans le texte).
function fantomes(x, y, largeurs, gap = 14) {
  return largeurs.map((w, i) => `<line x1="${x}" y1="${y + i * gap}" x2="${x + w}" y2="${y + i * gap}" stroke="${P.hairSoft}" stroke-width="6" stroke-linecap="round"/>`).join('');
}
// Flèche courbe saffran, de (x1,y1) à (x2,y2), arrivée horizontale vers la droite.
function fleche(x1, y1, x2, y2, { dash = true } = {}) {
  const mx = (x1 + x2) / 2;
  return `<path d="M${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2 - 3} ${y2}" fill="none" stroke="${P.saf}" stroke-width="2.6" stroke-linecap="round" ${dash ? DASH : ''}/>
    <path d="M${x2 - 11} ${y2 - 7} L${x2} ${y2} L${x2 - 11} ${y2 + 7}" fill="none" stroke="${P.saf}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;
}

// Le toit : pan avant, pignon, lucarne, dans son repère propre (x -92→620, y 50→375).
// labels=false : les cotes sans leurs étiquettes, pour les petits formats.
function toit({ fs = 13, labels = true, mesures = true, deduits = true } = {}) {
  const { ink, hair, saf, safInk, paper, paper2 } = P;
  const L = (x, y, t, c, anchor, rot) => labels ? lab(x, y, t, { c, fs, anchor, rot, ls: 1.4 }) : '';
  const A = [70, 250], B = [370, 250], C = [420, 110], D = [120, 110], E = [480, 250];
  const pt = p => p.join(',');
  let rangs = '';
  for (let i = 1; i < 7; i++) {
    const t = i / 7, y = 250 - 140 * t;
    rangs += `<line x1="${70 + 50 * t}" y1="${y}" x2="${370 + 50 * t}" y2="${y}" stroke="${hair}" stroke-width="1"/>`;
  }
  return `
    <polygon points="${pt(A)} ${pt(B)} ${pt(C)} ${pt(D)}" fill="${saf}" fill-opacity="${deduits ? 0.16 : 0}"/>
    ${rangs}
    <polygon points="${pt(A)} ${pt(B)} ${pt(C)} ${pt(D)}" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>
    <polygon points="${pt(B)} ${pt(C)} ${pt(E)}" fill="${paper2}" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M70 250 L70 320 M370 250 L370 320 M480 250 L480 320" stroke="${ink}" stroke-width="2.4"/>
    <line x1="40" y1="320" x2="520" y2="320" stroke="${ink}" stroke-width="1.2"/>
    <path d="M205 230 L205 180 L233 158 L261 180 L261 230" fill="${paper}" stroke="${ink}" stroke-width="2"/>
    <rect x="218" y="192" width="30" height="30" fill="none" stroke="${ink}" stroke-width="1.5"/>
    ${mesures ? `
    ${cote(120, 84, 420, 84, ink)}   ${L(270, 72, 'faîtage · mesuré', ink)}
    ${cote(443, 100, 503, 240, ink)} ${L(486 - Math.max(0, T('rive · mesurée').length - 14) * 9.2, 150, 'rive · mesurée', ink, 'start')}
    ${cote(44, 250, 44, 320, ink)}   ${L(28, 305, 'égout h. · mesuré', ink, 'middle', -90)}` : ''}
    ${deduits ? `
    ${cote(70, 338, 370, 338, saf, true)} ${L(220, 360, 'égout · déduit', safInk)}
    ${cote(96, 110, 46, 250, saf, true)}  ${L(58, 170, 'rive · déduite', safInk, 'end')}
    ${L(310, 150, 'surface · déduite', safInk)}` : ''}`;
}

// Légende discrète, en mono.
const m = (x, y, t, o = {}) => lab(x, y, t, { fs: 12, c: P.mute, anchor: 'start', w: 500, ls: 1.4, ...o });
// Texte courant (libellés de lignes), en Hanken.
const txt = (x, y, t, o = {}) => lab(x, y, t, { font: 'Hanken Grotesk', w: 500, fs: 14, anchor: 'start', ls: 0, ...o });
// Le toit réduit, sans étiquettes, placé par translate/scale.
const toitReduit = (x, y, k, o) => `<g transform="translate(${x + 92 * k} ${y - 50 * k}) scale(${k})">${toit({ labels: false, ...o })}</g>`;

// Statuts d'alerte, en terra : ce qui bloque ou manque.
const ALERTES = ['échoué', 'en retard', 'manque', 'à lire', 'à appeler'];
// Un tableau de lignes : en-tête, libellé + valeur fantôme + statut. Un statut listé dans `connus` s'écrit
// en encre (mesuré, payé…) ; les autres sont des notes de l'agent, en saffran.
function tableau(x, y, w, lignes, { agent = true, entete = '', connus = ['mesuré', 'payé', 'à jour'], pas = 30, valeurs = true } = {}) {
  const h = 46 + lignes.length * pas;
  return `${cadre(x, y, w, h, { agent })}
    ${m(x + 16, y + 27, entete)}
    <line x1="${x + 16}" y1="${y + 40}" x2="${x + w - 16}" y2="${y + 40}" stroke="${P.hairSoft}" stroke-width="1"/>
    ${lignes.map(([l, st], i) => {
      const yy = y + 64 + i * pas, alerte = ALERTES.includes(st);
      // la valeur fantôme se range juste avant le statut, quelle que soit sa longueur (mono 10 px ≈ 7,2 px/car.)
      const fin = st ? x + w - 16 - T(st).length * 7.2 - 14 : x + w - 18;
      return `${txt(x + 16, yy, l)}
        ${valeurs ? `<line x1="${fin - 28}" y1="${yy - 5}" x2="${fin}" y2="${yy - 5}" stroke="${P.hairSoft}" stroke-width="6" stroke-linecap="round"/>` : ''}
        ${st ? lab(x + w - 16, yy, st, { fs: 10, anchor: 'end', c: alerte ? P.terra : connus.includes(st) ? P.ink : P.safInk, ls: 1.2 }) : ''}`;
    }).join('')}`;
}

// Icônes au trait (x = bord gauche, y = milieu), ~32 px.
const ICO = {
  reunion: (x, y) => `<circle cx="${x + 9}" cy="${y - 5}" r="5" fill="none" stroke="${P.ink}" stroke-width="2"/><circle cx="${x + 23}" cy="${y - 5}" r="5" fill="none" stroke="${P.ink}" stroke-width="2"/><path d="M${x} ${y + 12} a9 8 0 0 1 18 0 M${x + 14} ${y + 12} a9 8 0 0 1 18 0" fill="none" stroke="${P.ink}" stroke-width="2"/>`,
  vocal: (x, y) => [4, 12, 20, 10, 16, 6].map((h, i) => `<line x1="${x + 3 + i * 5.5}" y1="${y - h / 2}" x2="${x + 3 + i * 5.5}" y2="${y + h / 2}" stroke="${P.ink}" stroke-width="2.2" stroke-linecap="round"/>`).join(''),
  photo: (x, y) => `<rect x="${x}" y="${y - 12}" width="32" height="24" rx="3" fill="none" stroke="${P.ink}" stroke-width="2"/><path d="M${x + 3} ${y + 9} l9 -9 l7 7 l4 -4 l6 6" fill="none" stroke="${P.ink}" stroke-width="2" stroke-linejoin="round"/>`,
  pdf: (x, y) => `<path d="M${x + 4} ${y - 15} h17 l8 8 v22 h-25 z" fill="none" stroke="${P.ink}" stroke-width="2" stroke-linejoin="round"/><path d="M${x + 21} ${y - 15} v8 h8" fill="none" stroke="${P.ink}" stroke-width="2"/>`,
  mail: (x, y) => `<rect x="${x}" y="${y - 12}" width="32" height="24" rx="3" fill="none" stroke="${P.ink}" stroke-width="2"/><path d="M${x} ${y - 10} l16 12 l16 -12" fill="none" stroke="${P.ink}" stroke-width="2" stroke-linejoin="round"/>`,
  bulle: (x, y) => `<path d="M${x} ${y - 12} h32 v19 h-20 l-7 6 v-6 h-5 z" fill="none" stroke="${P.ink}" stroke-width="2" stroke-linejoin="round"/>`,
  livre: (x, y) => `<path d="M${x + 4} ${y - 15} h22 v30 h-22 z M${x + 9} ${y - 15} v30" fill="none" stroke="${P.ink}" stroke-width="2" stroke-linejoin="round"/>`,
  appli: (x, y) => `<rect x="${x}" y="${y - 13}" width="32" height="26" rx="3" fill="none" stroke="${P.ink}" stroke-width="2"/><path d="M${x} ${y - 6} h32" stroke="${P.ink}" stroke-width="2"/>`,
  tableur: (x, y) => `<rect x="${x}" y="${y - 13}" width="32" height="26" rx="2" fill="none" stroke="${P.ink}" stroke-width="2"/><path d="M${x} ${y - 4} h32 M${x} ${y + 5} h32 M${x + 11} ${y - 13} v26" stroke="${P.ink}" stroke-width="1.6"/>`,
  agenda: (x, y) => `<rect x="${x}" y="${y - 11}" width="32" height="26" rx="3" fill="none" stroke="${P.ink}" stroke-width="2"/><path d="M${x} ${y - 3} h32 M${x + 9} ${y - 16} v8 M${x + 23} ${y - 16} v8" stroke="${P.ink}" stroke-width="2" stroke-linecap="round"/><rect x="${x + 19}" y="${y + 3}" width="7" height="6" fill="${P.ink}"/>`,
  public: (x, y) => `<path d="M${x} ${y - 6} L${x + 16} ${y - 16} L${x + 32} ${y - 6} Z M${x + 5} ${y - 2} v12 M${x + 12} ${y - 2} v12 M${x + 20} ${y - 2} v12 M${x + 27} ${y - 2} v12 M${x} ${y + 14} h32" fill="none" stroke="${P.ink}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`,
  banque: (x, y) => `<rect x="${x}" y="${y - 11}" width="32" height="22" rx="3" fill="none" stroke="${P.ink}" stroke-width="2"/><path d="M${x} ${y - 4} h32" stroke="${P.ink}" stroke-width="3"/><path d="M${x + 5} ${y + 5} h8" stroke="${P.ink}" stroke-width="2" stroke-linecap="round"/>`,
  loupe: (x, y) => `<circle cx="${x + 13}" cy="${y - 3}" r="9" fill="none" stroke="${P.ink}" stroke-width="2.2"/><path d="M${x + 20} ${y + 4} l9 9" stroke="${P.ink}" stroke-width="2.6" stroke-linecap="round"/>`,
  personne: (x, y) => `<circle cx="${x + 16}" cy="${y - 7}" r="6" fill="none" stroke="${P.ink}" stroke-width="2"/><path d="M${x + 5} ${y + 14} a11 10 0 0 1 22 0" fill="none" stroke="${P.ink}" stroke-width="2"/>`,
  meteo: (x, y) => `<path d="M${x + 3} ${y + 4} a7 7 0 0 1 3 -13 a9 9 0 0 1 17 -1 a6 6 0 0 1 6 14 z" fill="none" stroke="${P.ink}" stroke-width="2" stroke-linejoin="round"/>${[8, 16, 24].map(d => `<line x1="${x + d}" y1="${y + 9}" x2="${x + d - 3}" y2="${y + 15}" stroke="${P.ink}" stroke-width="2" stroke-linecap="round"/>`).join('')}`,
  etoiles: (x, y) => [0, 1, 2].map(i => `<path d="M${x + 5 + i * 11} ${y - 6} l2 4 4.4 .5 -3.3 3 .9 4.3 -4 -2.2 -4 2.2 .9 -4.3 -3.3 -3 4.4 -.5z" fill="none" stroke="${P.ink}" stroke-width="1.4" stroke-linejoin="round"/>`).join(''),
  telephone: (x, y) => `<rect x="${x + 8}" y="${y - 16}" width="17" height="32" rx="4" fill="none" stroke="${P.ink}" stroke-width="2"/><path d="M${x + 13} ${y - 11} h7" stroke="${P.ink}" stroke-width="2" stroke-linecap="round"/>`,
};
