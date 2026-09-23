// Les scènes des visuels « cas d'usage » : un moment de récit par secteur (560×320), les héros de secteur
// (560×580, pensés pour le fond encre) et l'en-tête de l'explorateur (520×420). Chaque entrée de SCENES
// est [largeur, hauteur, dessin()]. Les moments communs à plusieurs secteurs (trouver, vendre, encaisser,
// se faire connaître) sont des scènes paramétrées : le motif reste, seul le vocabulaire change.
// Lecture : trait plein encre = mesuré ou connu ; saffran pointillé = déduit ou produit par l'agent.
const { ink, hair, saf, safInk, paper, paper2 } = P;
const zone = (x, y, w, h, o = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${saf}" fill-opacity=".18" stroke="${saf}" stroke-width="2.2" ${DASH} ${o}/>`;
const sep = (x1, x2, y) => `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${P.hairSoft}" stroke-width="1"/>`;
const tag = (x, y, t) => lab(x, y, t, { fs: 10, c: safInk, anchor: 'start', ls: 1.4 });
const icone = (k, x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${ICO[k](0, 0)}</g>`;
// Flèche qui descend puis tourne à droite (du dessin du haut vers le tableau, dans les héros).
const descente = (x, y1, x2, y2) => `<path d="M${x} ${y1} C ${x} ${y2 - 20}, ${x + 20} ${y2}, ${x2 - 4} ${y2}" fill="none" stroke="${saf}" stroke-width="3" stroke-linecap="round"/>
  <path d="M${x2 - 14} ${y2 - 10} L${x2 - 2} ${y2} L${x2 - 14} ${y2 + 10}" fill="none" stroke="${saf}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;

// La liste que l'agent tire d'une source : trois lignes étiquetées.
function liste(x, y, w, h, titreListe, lignes) {
  return `${cadre(x, y, w, h, { agent: true })}
    ${m(x + 16, y + 28, titreListe)}
    ${lignes.map(([t, l], i) => {
      const yy = y + 66 + i * 62;
      return `${tag(x + 16, yy, t)}${txt(x + 16, yy + 21, l)}${i < lignes.length - 1 ? sep(x + 16, x + w - 16, yy + 38) : ''}`;
    }).join('')}`;
}

// ---- scènes paramétrées, communes à plusieurs secteurs ----

// Trouver : une population de structures, quelques-unes repérées, la liste qui en sort.
function trouver({ source, titreListe, lignes }) {
  const tuiles = [], rep = [7, 16, 26];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) {
    const x = 14 + c * 46, y = 24 + r * 40, i = r * 6 + c;
    tuiles.push(rep.includes(i) ? zone(x, y, 36, 28, 'rx="4"')
      : `<rect x="${x}" y="${y}" width="36" height="28" rx="4" fill="none" stroke="${hair}" stroke-width="1.2"/>`);
    tuiles.push(`<line x1="${x + 8}" y1="${y + 14}" x2="${x + 24 - (i % 3) * 4}" y2="${y + 14}" stroke="${rep.includes(i) ? safInk : hair}" stroke-width="2" stroke-linecap="round"/>`);
  }
  return `${tuiles.join('')}
    ${m(14, 246, source)}
    ${fleche(288, 118, 346, 100)}
    ${liste(350, 26, 202, 250, titreListe, lignes)}`;
}

// Vendre : une demande et un rendez-vous ; l'agent rédige la réponse et la note de préparation.
function vendre({ sections }) {
  return `
    ${icone('mail', 30, 88, 2.4)}
    ${txt(30, 150, 'une demande')}
    <rect x="30" y="192" width="78" height="64" rx="6" fill="none" stroke="${ink}" stroke-width="2"/>
    <path d="M30 208 H108 M50 186 V198 M88 186 V198" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>
    <rect x="72" y="224" width="16" height="12" fill="${ink}"/>
    ${txt(30, 286, 'le rendez-vous')}
    ${fleche(132, 94, 296, 62)}
    ${fleche(132, 226, 296, 208)}
    ${cadre(300, 18, 252, 92, { agent: true })}
    ${titre(316, 48, 'réponse · brouillon', { fs: 16 })}
    ${fantomes(316, 72, [210, 160], 16)}
    ${cadre(300, 126, 252, 180, { agent: true })}
    ${titre(316, 156, 'note de rendez-vous', { fs: 16 })}
    ${sections.map((s, i) => `${tag(316, 184 + i * 40, s)}${fantomes(316, 198 + i * 40, [200 - i * 30])}`).join('')}`;
}

// Encaisser : les échéances (connues) ; l'agent relance ce qui n'est pas rentré, au bon interlocuteur.
function encaisser({ entete, lignes, relances }) {
  const alertes = lignes.map(([, s], i) => ['échoué', 'en retard'].includes(s) ? i : -1).filter(i => i >= 0);
  return `
    ${tableau(10, 40, 262, lignes, { agent: false, entete, connus: ['payé', 'attendue'] })}
    ${alertes.map((i, k) => fleche(278, 40 + 64 + i * 30 - 5, 326, 84 + k * 126)).join('')}
    ${relances.map((r, k) => `
      ${cadre(330, 34 + k * 126, 222, 100, { agent: true })}
      ${m(346, 62 + k * 126, 'relance')}
      ${txt(346, 86 + k * 126, r, { w: 600, fs: 15 })}
      ${fantomes(346, 108 + k * 126, [170])}`).join('')}`;
}

// Se faire connaître : une matière (connue) ; l'agent en tire des publications.
const SORTIES = {
  publication: (x, y) => `<rect x="${x}" y="${y}" width="44" height="30" rx="3" fill="${paper2}" stroke="${hair}" stroke-width="1"/>${fantomes(x + 56, y + 8, [130, 96])}`,
  site: (x, y) => `<rect x="${x}" y="${y - 2}" width="200" height="34" rx="4" fill="none" stroke="${hair}" stroke-width="1.2"/><path d="M${x} ${y + 8} h200" stroke="${hair}" stroke-width="1"/>${fantomes(x + 10, y + 20, [120])}`,
  avis: (x, y) => `${[0, 1, 2, 3, 4].map(i => `<path d="M${x + 8 + i * 18} ${y} l2.4 5 5.4 .6 -4 3.7 1.1 5.3 -4.9 -2.7 -4.9 2.7 1.1 -5.3 -4 -3.7 5.4 -.6z" fill="${i < 4 ? saf : 'none'}" stroke="${safInk}" stroke-width="1"/>`).join('')}${fantomes(x, y + 28, [180])}`,
  article: (x, y) => `${fantomes(x, y + 4, [196, 170, 120], 12)}`,
};
function connaitre({ ico, source, sorties }) {
  return `
    ${cadre(20, 92, 150, 126, { fill: 'none' })}
    ${icone(ico, 55, 155, 2.5)}
    ${txt(20, 250, source)}
    ${sorties.map(([l, k], i) => {
      const y = 12 + i * 108;
      return `${fleche(176, 155, 296, y + 44)}
        ${cadre(300, y, 252, 92, { agent: true })}
        ${m(316, y + 26, l)}
        ${SORTIES[k](316, y + 44)}`;
    }).join('')}`;
}

// ---- les héros de secteur : un dessin en haut, le tableau que l'agent en tire en bas ----
function heros(haut, entete, lignes) {
  return `${haut}
    ${descente(40, 266, 146, 380)}
    ${tableau(150, 318, 400, lignes, { entete, pas: 34 })}`;
}
// Les dessins du haut servent aussi aux images de partage : 560×280.
const HAUTS = {
  saas: () => {
    const cols = [['prospects', 3], ['essais', 2], ['clients', 2]];
    return cols.map(([t, n], c) => {
      const x = 20 + c * 180;
      return `${m(x, 40, t, { c: ink })}${sep(x, x + 150, 54)}
        ${Array.from({ length: n }, (_, i) => {
          const y = 70 + i * 50, agent = c === 0 && i === 2;
          return `${agent ? zone(x, y, 150, 36, 'rx="6"') : `<rect x="${x}" y="${y}" width="150" height="36" rx="6" fill="none" stroke="${ink}" stroke-width="2"/>`}
            <line x1="${x + 14}" y1="${y + 18}" x2="${x + 100 - i * 18}" y2="${y + 18}" stroke="${agent ? safInk : hair}" stroke-width="3" stroke-linecap="round"/>`;
        }).join('')}
        ${c < 2 ? `<path d="M${x + 158} 88 l8 0 m-4 -4 l4 4 -4 4" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` : ''}`;
    }).join('') + m(20, 250, 'le pipeline et les abonnements');
  },
  edition: () => {
    const mois = ['sept', 'oct', 'nov', 'déc', 'janv', 'fév'];
    return `
      <path d="M40 40 h110 v170 h-110 z M54 40 v170" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>
      ${fantomes(70, 80, [60, 44], 16)}
      <rect x="70" y="120" width="60" height="60" fill="${paper2}" stroke="${hair}" stroke-width="1"/>
      <line x1="200" y1="140" x2="540" y2="140" stroke="${ink}" stroke-width="2"/>
      ${mois.map((t, i) => {
        const x = 214 + i * 64;
        return `<circle cx="${x}" cy="140" r="${i % 2 ? 6 : 9}" fill="${i % 2 ? paper : ink}" stroke="${ink}" stroke-width="2"/>${m(x, 176, t, { anchor: 'middle' })}`;
      }).join('')}
      ${m(200, 110, 'la saison', { c: ink })}
      ${m(40, 250, 'une parution, une saison')}`;
  },
  conseil: () => {
    const etapes = [['cadrage', 1], ['entretiens', 0], ["point d'étape", 1], ['restitution', 0]];
    return `
      <line x1="40" y1="150" x2="520" y2="150" stroke="${ink}" stroke-width="2"/>
      ${etapes.map(([t, reu], i) => {
        const x = 70 + i * 140, fin = i === 3;
        return `${fin ? `<circle cx="${x}" cy="150" r="10" fill="${paper}" stroke="${saf}" stroke-width="2.4" ${DASH.replace('6 5', '4 3')}/>` : `<circle cx="${x}" cy="150" r="9" fill="${ink}"/>`}
          ${m(x, 190, t, { anchor: 'middle', c: fin ? safInk : P.mute })}
          ${reu ? icone('reunion', x - 16, 100) : icone('vocal', x - 16, 100)}`;
      }).join('')}
      ${m(40, 250, 'la mission, réunion après réunion')}`;
  },
};

const SCENES = {
  // ======== BTP ========
  // 01 — trouver le chantier : un quartier, deux parcelles repérées, la liste que l'agent en tire.
  'btp-01': [560, 320, () => {
    const ilots = [];
    const cols = [[14, 96], [118, 88], [214, 100]], rows = [[20, 78], [110, 84], [206, 90]];
    rows.forEach(([y, h], r) => cols.forEach(([x, w], c) => {
      ilots.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${hair}" stroke-width="1.2"/>`);
      const cut = (r + c) % 2 ? `M${x + w * .45} ${y} V${y + h}` : `M${x} ${y + h * .5} H${x + w}`;
      ilots.push(`<path d="${cut}" stroke="${hair}" stroke-width="1"/>`);
    }));
    const pin = (x, y) => `<path d="M${x} ${y} c -9 -12 -13 -17 -13 -24 a13 13 0 0 1 26 0 c0 7 -4 12 -13 24z" fill="${paper}" stroke="${ink}" stroke-width="2"/><circle cx="${x}" cy="${y - 24}" r="4.5" fill="${ink}"/>`;
    return `
      ${ilots.join('')}
      <path d="M2 196 C 90 186, 170 212, 330 190" fill="none" stroke="${hair}" stroke-width="1.2" stroke-dasharray="2 4"/>
      ${zone(118, 110, 40, 84)} ${zone(214, 20, 100, 39)}
      ${pin(138, 150)} ${pin(264, 44)}
      ${m(20, 312, 'permis et consultations du secteur')}
      ${fleche(318, 90, 346, 100)}
      ${liste(350, 26, 202, 250, 'à voir cette semaine', [['permis', 'réfection de toiture'], ['consultation', "couverture d'une école"], ['prospect', "projet d'extension"]])}`;
  }],
  // 02 — la visite : quelques cotes prises sur le toit, le téléphone qui enregistre, la fiche rédigée.
  'btp-02': [560, 320, () => {
    const barres = [8, 20, 12, 30, 18, 36, 14, 26, 10, 22, 16, 8]
      .map((h, i) => `<line x1="${330 + i * 4.5}" y1="${170 - h / 2}" x2="${330 + i * 4.5}" y2="${170 + h / 2}" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>`).join('');
    return `
      ${toitReduit(0, 50, .43, { deduits: false })}
      ${m(20, 250, 'trois cotes, prises à la main')}
      <rect x="316" y="92" width="70" height="140" rx="12" fill="${paper}" stroke="${ink}" stroke-width="2"/>
      <line x1="340" y1="102" x2="362" y2="102" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>
      ${barres}
      <circle cx="351" cy="210" r="7" fill="${P.terra}"/>
      ${m(351, 256, 'enregistre', { anchor: 'middle' })}
      ${fleche(392, 162, 420, 150)}
      ${cadre(424, 40, 128, 230, { agent: true })}
      ${titre(438, 70, 'fiche de visite', { fs: 15 })}
      ${[['travaux', [92, 70]], ['matériaux', [96, 54]], ['à mesurer', [80]]].map(([t, ls], i) =>
        `${tag(438, 100 + i * 56, t)}${fantomes(438, 114 + i * 56, ls, 13)}`).join('')}`;
  }],
  // 03 — le chiffrage : le relevé (mesuré + déduit) devient des lignes de devis.
  'btp-03': [560, 320, () => `
      ${toitReduit(0, 62, .43)}
      ${m(20, 262, "le relevé, complété par l'agent")}
      ${fleche(300, 150, 312, 150)}
      ${tableau(316, 28, 236, [['couverture', 'déduit'], ['faîtage', 'mesuré'], ['rives', 'déduit'], ['égout', 'déduit'], ['échafaudage', 'déduit'], ['lucarne', 'mesuré']], { entete: 'devis · à importer' })}`],
  // 04 — la commande : le devis signé se répartit en bons de commande, un par fournisseur.
  'btp-04': [560, 320, () => `
      ${tableau(10, 52, 206, [['couverture tuile'], ['faîtage'], ['rives'], ['charpente'], ['gouttières']], { agent: false, entete: 'devis' })}
      <g transform="rotate(-6 160 72)">
        <rect x="120" y="58" width="78" height="30" rx="6" fill="${paper}" stroke="${P.olive}" stroke-width="2.2"/>
        ${lab(159, 78, 'signé', { fs: 12, c: '#3e4c0c', ls: 2 })}
      </g>
      ${[['tuiles et accessoires', 34], ['bois de charpente', 126], ['zinguerie', 218]].map(([f, y]) => `
        ${fleche(222, 150, 318, y + 34)}
        ${cadre(322, y, 230, 68, { agent: true })}
        ${m(338, y + 24, 'bon de commande')}
        ${txt(338, y + 48, f, { w: 600, fs: 15 })}`).join('')}`],
  // 05 — le chantier : la semaine des équipes, la météo connue, les créneaux placés par l'agent.
  'btp-05': [560, 320, () => {
    const jours = ['lun', 'mar', 'mer', 'jeu', 'ven'], x0 = 100, cw = 90;
    const meteo = [
      (x, y) => `<circle cx="${x}" cy="${y}" r="7" fill="none" stroke="${ink}" stroke-width="2"/>${[0, 45, 90, 135, 180, 225, 270, 315].map(a => { const r = Math.PI * a / 180; return `<line x1="${x + Math.cos(r) * 11}" y1="${y + Math.sin(r) * 11}" x2="${x + Math.cos(r) * 14}" y2="${y + Math.sin(r) * 14}" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>`; }).join('')}`,
      (x, y) => `<path d="M${x - 13} ${y + 6} a7 7 0 0 1 3 -13 a9 9 0 0 1 17 -1 a6 6 0 0 1 6 14 z" fill="none" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>`,
      (x, y) => `<path d="M${x - 13} ${y + 2} a7 7 0 0 1 3 -13 a9 9 0 0 1 17 -1 a6 6 0 0 1 6 14 z" fill="none" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>${[-8, 0, 8].map(d => `<line x1="${x + d}" y1="${y + 8}" x2="${x + d - 3}" y2="${y + 15}" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>`).join('')}`,
    ];
    const ciel = [0, 0, 1, 2, 0];
    const bloc = (eq, j0, n, t, agent) => {
      const x = x0 + j0 * cw + 5, y = 120 + eq * 80, w = n * cw - 10;
      return `<rect x="${x}" y="${y}" width="${w}" height="54" rx="8" fill="${agent ? saf : paper2}" fill-opacity="${agent ? .18 : 1}" stroke="${agent ? saf : ink}" stroke-width="2.2" ${agent ? DASH : ''}/>
        ${txt(x + 12, y + 32, t, { w: 600 })}`;
    };
    return `
      ${jours.map((j, i) => `${m(x0 + i * cw + cw / 2, 22, j, { anchor: 'middle' })}${meteo[ciel[i]](x0 + i * cw + cw / 2, 54)}`).join('')}
      <rect x="${x0 + 3 * cw}" y="108" width="${cw}" height="176" fill="none" stroke="${hair}" stroke-width="1" ${DASH}/>
      ${[0, 1, 2, 3, 4, 5].map(i => `<line x1="${x0 + i * cw}" y1="84" x2="${x0 + i * cw}" y2="290" stroke="${P.hairSoft}" stroke-width="1"/>`).join('')}
      <line x1="10" y1="96" x2="${x0 + 5 * cw}" y2="96" stroke="${ink}" stroke-width="1.2"/>
      ${m(10, 152, 'équipe a')} ${m(10, 232, 'équipe b')}
      ${bloc(0, 0, 2, 'chantier en cours', false)}
      ${bloc(0, 2, 1, 'toiture', true)}
      ${bloc(0, 4, 1, 'toiture', true)}
      ${bloc(1, 0, 3, 'dépose et charpente', true)}
      <path d="M${x0 + 2 * cw + 8} 187 l7 -7 l7 7 l-7 7 z" fill="${ink}"/>
      ${m(x0 + 2 * cw + 26, 191, 'livraison', { c: ink, fs: 11 })}
      ${m(x0 + 3 * cw + cw / 2, 206, 'pluie', { anchor: 'middle' })}`;
  }],

  // ======== SaaS ========
  'saas-01': [560, 320, () => trouver({ source: 'les entreprises de votre marché', titreListe: 'à contacter',
    lignes: [['recrute', 'une équipe commerciale'], ['lève des fonds', 'une levée annoncée'], ["change d'outil", 'une consultation logicielle']] })],
  'saas-02': [560, 320, () => vendre({ sections: ['qui décide', 'ce qu\'ils utilisent', 'questions à poser'] })],
  // 03 — suivre le client : ce qui arrive (mails, appels, tickets) nourrit une page par client.
  'saas-03': [560, 320, () => `
      ${[['mail', 'un mail', 70], ['vocal', 'un appel', 160], ['bulle', 'un ticket', 250]].map(([k, l, y], i) => `
        ${ICO[k](20, y)}${txt(64, y + 5, l)}
        ${fleche(150, y, 284, [96, 140, 250][i])}`).join('')}
      ${cadre(290, 14, 262, 292, { agent: true })}
      ${titre(306, 44, 'suivi du client', { fs: 16 })}
      ${tag(306, 72, 'historique')}
      <line x1="312" y1="88" x2="312" y2="172" stroke="${hair}" stroke-width="1.5"/>
      ${[92, 128, 164].map((y, i) => `<circle cx="312" cy="${y}" r="4.5" fill="${ink}"/>${fantomes(328, y, [180 - i * 30])}`).join('')}
      ${sep(306, 536, 196)}
      ${tag(306, 222, 'demandes produit')}
      ${[244, 272].map((y, i) => `<rect x="306" y="${y - 7}" width="12" height="12" rx="2" fill="none" stroke="${safInk}" stroke-width="1.5"/>${fantomes(328, y, [170 - i * 40])}`).join('')}`],
  'saas-04': [560, 320, () => encaisser({ entete: 'échéances du mois',
    lignes: [['abonnement', 'payé'], ['prélèvement', 'échoué'], ['abonnement', 'payé'], ['facture annuelle', 'en retard']],
    relances: ['au bon contact', 'au service comptable'] })],
  'saas-05': [560, 320, () => connaitre({ ico: 'appli', source: 'une nouvelle version',
    sorties: [['page du site', 'site'], ['article', 'article'], ['publication', 'publication']] })],

  // ======== Édition et culture ========
  'edition-01': [560, 320, () => trouver({ source: 'les structures du secteur', titreListe: 'actives cette saison',
    lignes: [['librairie', 'décideur identifié'], ['médiathèque', 'programme culturel'], ['festival', 'édition annoncée']] })],
  'edition-02': [560, 320, () => connaitre({ ico: 'livre', source: 'une parution, une date',
    sorties: [['publication', 'publication'], ['fiche google', 'avis'], ['page du site', 'site']] })],
  'edition-03': [560, 320, () => encaisser({ entete: 'ce qui doit rentrer',
    lignes: [['abonnements', 'payé'], ['facture librairie', 'en retard'], ['subvention', 'attendue'], ['prélèvement', 'échoué']],
    relances: ['à la librairie', 'au bon interlocuteur'] })],

  // ======== Conseil ========
  'conseil-01': [560, 320, () => trouver({ source: 'les entreprises du territoire', titreListe: 'signaux repérés',
    lignes: [['nouveau dirigeant', 'une pme industrielle'], ['consultation', 'un marché de conseil'], ['croissance', "l'ouverture d'un site"]] })],
  'conseil-02': [560, 320, () => vendre({ sections: ['qui décide', 'ce qui a changé', 'questions à poser'] })],
  // 03 — mener la mission : la réunion (enregistrée) devient un compte rendu, décisions et actions.
  'conseil-03': [560, 320, () => `
      ${icone('reunion', 40, 120, 2.6)}
      ${icone('vocal', 150, 124, 1.4)}
      ${txt(40, 196, 'la réunion')}
      ${fleche(206, 124, 262, 124)}
      ${cadre(266, 12, 286, 296, { agent: true })}
      ${titre(282, 42, 'compte rendu', { fs: 16 })}
      ${tag(282, 70, 'décisions')}
      ${fantomes(282, 88, [220, 170], 16)}
      ${sep(282, 536, 124)}
      ${tag(282, 150, 'actions')}
      ${[['client', 176], ['cabinet', 212], ['cabinet', 248], ['client', 284]].map(([qui, y], i) => `
        <rect x="282" y="${y - 8}" width="14" height="14" rx="2" fill="none" stroke="${ink}" stroke-width="1.6"/>
        ${fantomes(306, y - 1, [150 - (i % 2) * 40])}
        ${lab(536, y + 3, qui, { fs: 10, anchor: 'end', c: safInk, ls: 1.2 })}`).join('')}`],
  'conseil-04': [560, 320, () => encaisser({ entete: 'honoraires',
    lignes: [['mission de cadrage', 'payé'], ['acompte', 'en retard'], ['accompagnement', 'payé'], ['solde de mission', 'en retard']],
    relances: ['au dirigeant', 'à la comptabilité'] })],
  'conseil-05': [560, 320, () => connaitre({ ico: 'pdf', source: 'une mission terminée',
    sorties: [['publication', 'publication'], ['réponse à un avis', 'avis'], ['page du site', 'site']] })],

  // ======== héros de secteur (560×580, fond encre) ========
  'hero-saas': [560, 580, () => heros(HAUTS.saas(), 'suivi · comptes',
    [['éditeur logistique', 'à relancer'], ['cabinet comptable', 'essai en cours'], ['réseau de franchises', 'renouvelle'], ['école privée', 'échoué'], ['agence immobilière', 'à jour']])],
  'hero-edition': [560, 580, () => heros(HAUTS.edition(), 'à informer · cette saison',
    [['librairies du réseau', 'actives'], ['médiathèques', 'à vérifier'], ['presse locale', 'à contacter'], ['festivals', 'actifs'], ['salons', 'à vérifier']])],
  'hero-conseil': [560, 580, () => heros(HAUTS.conseil(), 'actions · à suivre',
    [['valider le périmètre', 'client'], ['envoyer la synthèse', 'cabinet'], ['planifier les entretiens', 'cabinet'], ['transmettre les données', 'client'], ['préparer la restitution', 'cabinet']])],

  // ======== en-tête de l'explorateur : des tâches de bureau qui deviennent des documents ========
  'hero-explorateur': [520, 420, () => {
    const docs = [
      { t: 'compte rendu', x: 286, y: 14, r: -3, corps: (x, y) => fantomes(x, y, [150, 118]) },
      { t: 'devis', x: 302, y: 114, r: 2.5, corps: (x, y) => [0, 1].map(i => `${fantomes(x, y + i * 15, [96])}<line x1="${x + 124}" y1="${y + i * 15}" x2="${x + 154}" y2="${y + i * 15}" stroke="${P.hairSoft}" stroke-width="6" stroke-linecap="round"/>`).join('') },
      { t: 'tableau', x: 288, y: 214, r: -2, corps: (x, y) => `<rect x="${x}" y="${y - 8}" width="156" height="30" fill="none" stroke="${P.hairSoft}" stroke-width="1.2"/><path d="M${x} ${y + 7} h156 M${x + 52} ${y - 8} v30 M${x + 104} ${y - 8} v30" stroke="${P.hairSoft}" stroke-width="1.2"/>` },
      { t: 'relance', x: 304, y: 314, r: 2, corps: (x, y) => fantomes(x, y, [140, 104]) },
    ];
    // chaque entrée pointe vers le document qu'elle nourrit
    const entrees = [['une réunion', 'reunion', 0], ['un vocal', 'vocal', 0], ['une photo', 'photo', 1], ['un pdf', 'pdf', 2], ['un mail', 'mail', 3]];
    return `
      ${entrees.map(([l, k, d], i) => {
        const y = 56 + i * 76, cible = docs[d].y + 42 + (k === 'vocal' ? 14 : k === 'reunion' ? -8 : 0);
        return `${ICO[k](16, y)}${txt(62, y + 5, l, { fs: 15 })}${fleche(162, y, 280, cible)}`;
      }).join('')}
      ${docs.map(d => `<g transform="rotate(${d.r} ${d.x + 95} ${d.y + 42})">
          ${cadre(d.x, d.y, 190, 84, { agent: true })}
          ${titre(d.x + 16, d.y + 30, d.t)}
          ${d.corps(d.x + 16, d.y + 54)}
        </g>`).join('')}`;
  }],
};
