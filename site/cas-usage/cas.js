// Une illustration par cas d'usage (480×300) : ce que le client a en entrée (trait plein, à gauche) devient ce que
// l'agent produit (saffran pointillé, à droite). Un cas valable pour plusieurs secteurs reste neutre ; seuls les cas
// propres au BTP parlent chantier. Ni maturité, ni chiffre, ni client. Clés : cas-<slug>, rendues par moments.html.
const CX = 236, CW = 236, CY = 150;   // la carte de sortie et le point où convergent les flèches

// Les entrées, empilées à gauche, chacune reliée à la carte.
function entrees(liste) {
  const ys = { 1: [150], 2: [104, 196], 3: [70, 150, 230] }[liste.length];
  return liste.map(([k, l], i) => `${ICO[k](14, ys[i])}${txt(56, ys[i] + 5, l)}${fleche(176, ys[i], CX - 4, CY)}`).join('');
}
// La sortie la plus courante : un tableau, centré verticalement.
function sortie(entete, lignes, o = {}) {
  const h = 46 + lignes.length * 32;
  return tableau(CX, (300 - h) / 2, CW, lignes, { entete, valeurs: false, pas: 32, ...o });
}
// Une carte-document de l'agent, avec un titre et des sections (étiquette + lignes fantômes).
function doc(x, y, w, h, t, sections, pas = 44) {
  return `${cadre(x, y, w, h, { agent: true })}${titre(x + 16, y + 30, t, { fs: 16 })}
    ${sections.map(([tg, ls], i) => `${tag(x + 16, y + 58 + i * pas, tg)}${fantomes(x + 16, y + 72 + i * pas, ls)}`).join('')}`;
}
const legende = (t, y = 284) => m(14, y, t);
const pile = (x, y, n, w = 70, h = 90) => Array.from({ length: n }, (_, i) =>
  `<rect x="${x + i * 10}" y="${y - i * 10}" width="${w}" height="${h}" rx="4" fill="${paper}" stroke="${ink}" stroke-width="2"/>${fantomes(x + i * 10 + 10, y - i * 10 + 20, [w - 30, w - 40, w - 34], 12)}`).join('');

const C = {
  // ======== propres au BTP ========
  'devis-depuis-releve': () => `
    ${toitReduit(-6, 96, .31)}${legende('le relevé du toit', 236)}
    ${fleche(206, 150, CX - 4, CY)}
    ${sortie('devis · à importer', [['couverture', 'déduit'], ['faîtage', 'mesuré'], ['rives', 'déduit'], ['échafaudage', 'déduit']])}`,
  'releve-minimal-deductions': () => `
    ${toitReduit(-6, 96, .31, { deduits: false })}${legende('quelques cotes', 236)}
    ${fleche(206, 150, CX - 4, CY)}
    ${sortie('quantités', [['faîtage', 'mesuré'], ['égout', 'mesuré'], ['rives', 'déduit'], ['surface', 'déduit'], ['noues', 'manque']])}`,
  'fiche-visite-depuis-audio': () => {
    const barres = [8, 18, 12, 26, 16, 30, 12, 22, 10, 16].map((h, i) => `<line x1="${46 + i * 5}" y1="${150 - h / 2}" x2="${46 + i * 5}" y2="${150 + h / 2}" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>`).join('');
    return `<rect x="32" y="84" width="76" height="140" rx="12" fill="${paper}" stroke="${ink}" stroke-width="2"/>
      <line x1="58" y1="95" x2="82" y2="95" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>${barres}
      <circle cx="70" cy="200" r="7" fill="${P.terra}"/>${legende('la visite, enregistrée', 262)}
      ${fleche(150, 150, CX - 4, CY)}
      ${sortie('fiche · visite', [['toiture', 'notée'], ["accès", 'noté'], ['matériaux', 'retenus'], ['pente nord', 'manque']])}`;
  },
  'controle-devis': () => `
    ${cadre(14, 50, 130, 86, { fill: paper })}${m(28, 76, 'devis généré')}${fantomes(28, 96, [96, 70, 84], 13)}
    ${cadre(34, 160, 130, 86, { fill: paper })}${m(48, 186, 'devis manuel')}${fantomes(48, 206, [96, 70, 84], 13)}
    ${fleche(150, 93, CX - 4, CY)}${fleche(170, 203, CX - 4, CY)}
    ${sortie('écarts · et leur cause', [['surface', 'arrondi'], ['crochets', 'règle'], ['main d\'œuvre', 'identique']], { connus: ['identique'] })}`,
  'commandes-fournisseurs': () => `
    ${tableau(10, 60, 180, [['tuiles'], ['liteaux'], ['zinc'], ['écran']], { agent: false, entete: 'devis signé', pas: 30 })}
    ${[['négoce a', 20], ['négoce b', 112], ['zinguerie', 204]].map(([f, y]) => `
      ${fleche(196, 150, CX + 26, y + 38)}
      ${cadre(CX + 30, y, CW - 30, 76, { agent: true })}
      ${m(CX + 46, y + 28, 'bon de commande')}
      ${txt(CX + 46, y + 54, f, { w: 600, fs: 15 })}`).join('')}`,
  'mise-a-jour-prix': () => `
    ${entrees([['pdf', 'tarifs reçus'], ['tableur', 'catalogue']])}
    ${sortie('tarifs · écarts', [['tuile terre cuite', 'hausse'], ['liteau', 'stable'], ['écran', 'hausse'], ['fichier', 'à importer']], { connus: ['stable'] })}`,
  'planning-chantiers': () => {
    const j = ['l', 'm', 'm', 'j', 'v'], x0 = CX + 60, cw = 32;
    const bloc = (r, j0, n, agent) => `<rect x="${x0 + j0 * cw + 3}" y="${118 + r * 58}" width="${n * cw - 6}" height="40" rx="6" fill="${agent ? saf : paper2}" fill-opacity="${agent ? .18 : 1}" stroke="${agent ? saf : ink}" stroke-width="2" ${agent ? DASH : ''}/>`;
    return `
      ${entrees([['agenda', "l'agenda"], ['meteo', 'la météo'], ['mail', 'une livraison']])}
      ${cadre(CX, 40, CW, 220, { agent: true })}
      ${m(CX + 16, 68, 'planning · semaine')}
      ${j.map((d, i) => m(x0 + i * cw + cw / 2, 100, d, { anchor: 'middle' })).join('')}
      ${m(CX + 16, 144, 'éq. 1')}${m(CX + 16, 202, 'éq. 2')}
      <rect x="${x0 + 3 * cw}" y="112" width="${cw}" height="126" fill="none" stroke="${hair}" stroke-width="1" ${DASH}/>
      ${bloc(0, 0, 2, false)}${bloc(0, 2, 1, true)}${bloc(0, 4, 1, true)}${bloc(1, 0, 3, true)}`;
  },
  'reponse-appel-offres-dpgf': () => `
    ${pile(14, 110, 3, 90, 110)}${legende('le dossier', 262)}
    ${fleche(150, 150, CX - 4, CY)}
    ${sortie('dpgf · pré-rempli', [['lot couverture', 'chiffré'], ['lot zinguerie', 'chiffré'], ['pénalités', 'à lire'], ['variante', 'à trancher']])}`,

  // ======== valables pour plusieurs secteurs : neutres ========
  'qualif-prospects-open-data': () => {
    const t = [];
    for (let r = 0; r < 5; r++) t.push(`<line x1="20" y1="${60 + r * 36}" x2="${150 - (r % 3) * 22}" y2="${60 + r * 36}" stroke="${hair}" stroke-width="6" stroke-linecap="round"/>`);
    return `${t.join('')}${legende('une liste de noms', 262)}
      ${fleche(170, 150, CX - 4, CY)}
      ${sortie('à appeler · en premier', [['nouveau site', 'signal'], ['nouveau dirigeant', 'signal'], ['projet déclaré', 'signal']])}`;
  },
  'veille-appels-offres': () => `
    ${entrees([['public', 'marchés publics']])}
    ${sortie('consultations', [['consultation a', 'pertinente'], ['consultation b', 'pertinente'], ['consultation c', 'écartée']], { connus: ['écartée'] })}`,
  'reponse-demande-client': () => `
    ${entrees([['mail', 'un mail'], ['appli', 'un formulaire'], ['telephone', 'un appel']])}
    ${doc(CX, 34, CW, 232, 'réponse · brouillon', [['réponse', [180, 130]], ['questions posées', [150]], ['rendez-vous', [110]]], 58)}`,
  'preparation-rdv': () => `
    ${entrees([['agenda', 'le rendez-vous'], ['mail', 'les échanges']])}
    ${doc(CX, 34, CW, 232, 'page · rendez-vous', [['historique', [180, 120]], ['points ouverts', [150]], ['à obtenir', [120]]], 58)}`,
  'suivi-client-page': () => `
    ${entrees([['mail', 'des mails'], ['pdf', 'des pièces'], ['photo', 'des photos']])}
    ${cadre(CX, 30, CW, 240, { agent: true })}
    ${titre(CX + 16, 60, 'dossier · client', { fs: 16 })}
    <line x1="${CX + 22}" y1="84" x2="${CX + 22}" y2="236" stroke="${hair}" stroke-width="1.5"/>
    ${[92, 140, 188, 236].map((y, i) => `<circle cx="${CX + 22}" cy="${y}" r="4.5" fill="${ink}"/>${tag(CX + 38, y - 4, ['visite', 'devis', 'échange', 'acompte'][i])}${fantomes(CX + 38, y + 12, [150 - i * 20])}`).join('')}`,
  'cr-reunion': () => `
    ${entrees([['reunion', 'la réunion'], ['vocal', "l'enregistrement"]])}
    ${cadre(CX, 22, CW, 256, { agent: true })}
    ${titre(CX + 16, 52, 'compte rendu', { fs: 16 })}
    ${tag(CX + 16, 80, 'décisions')}${fantomes(CX + 16, 96, [190, 140], 15)}
    ${tag(CX + 16, 144, 'actions')}
    ${[170, 204, 238].map((y, i) => `<rect x="${CX + 16}" y="${y - 8}" width="14" height="14" rx="2" fill="none" stroke="${ink}" stroke-width="1.6"/>${fantomes(CX + 40, y - 1, [110 - i * 20])}${lab(CX + CW - 16, y + 3, ['vous', 'équipe', 'client'][i], { fs: 10, anchor: 'end', c: safInk, ls: 1.2 })}`).join('')}`,
  'enrichissement-base': () => {
    const cells = [];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) {
      const x = 14 + c * 50, y = 60 + r * 32, plein = (r + c) % 3 === 0;
      cells.push(`<rect x="${x}" y="${y}" width="50" height="32" fill="none" stroke="${ink}" stroke-width="1.4"/>${plein ? `<line x1="${x + 10}" y1="${y + 16}" x2="${x + 36}" y2="${y + 16}" stroke="${hair}" stroke-width="4" stroke-linecap="round"/>` : ''}`);
    }
    return `${cells.join('')}${legende('une base à moitié vide', 262)}
      ${fleche(170, 150, CX - 4, CY)}
      ${sortie('base · enrichie', [['effectif', 'sourcé'], ['dirigeant', 'sourcé'], ['activité', 'sourcée'], ['site web', 'laissé vide']], { connus: ['laissé vide'] })}`;
  },
  'evolutions-produit': () => `
    ${entrees([['bulle', 'une demande'], ['bulle', 'un ticket'], ['mail', 'un mail']])}
    ${sortie('backlog · qualifié', [['export', 'plusieurs clients'], ['connexion', 'doublon'], ['rapport', 'à qualifier']])}`,
  'faq-interne': () => `
    ${entrees([['bulle', 'une question'], ['pdf', 'les documents']])}
    ${cadre(CX, 50, CW, 200, { agent: true })}
    ${titre(CX + 16, 80, 'réponse · sourcée', { fs: 16 })}
    ${fantomes(CX + 16, 106, [200, 180, 120], 16)}
    ${sep(CX + 16, CX + CW - 16, 168)}
    ${tag(CX + 16, 192, 'source')}${txt(CX + 16, 214, 'guide interne', { fs: 13 })}
    ${tag(CX + 16, 238, 'manque signalé')}`,
  'fiche-google-avis': () => `
    ${entrees([['etoiles', 'des avis'], ['bulle', 'sans réponse']])}
    ${[36, 158].map((y, i) => `${cadre(CX, y, CW, 106, { agent: true })}${m(CX + 16, y + 28, 'réponse · brouillon')}
      ${SORTIES.avis(CX + 16, y + 48)}`).join('')}`,
  'onboarding-salarie': () => `
    ${entrees([['personne', 'une arrivée']])}
    ${sortie('dossier · arrivée', [['contrat', 'prêt'], ['accès', 'créés'], ["livret d'accueil", 'prêt'], ['pièces', 'manque']])}`,
  'prelevements-echoues': () => `
    ${entrees([['banque', 'les rejets'], ['tableur', 'la facturation']])}
    ${sortie('rejets · rapprochés', [['rejet a', 'relancé'], ['rejet b', 'à appeler'], ['écritures', 'prêtes'], ['journal', 'à jour']])}`,
  'publication-reseaux': () => `
    ${entrees([['photo', 'une photo'], ['photo', 'une photo'], ['pdf', 'une note']])}
    ${[30, 156].map(y => `${cadre(CX, y, CW, 112, { agent: true })}${m(CX + 16, y + 26, 'publication · prête')}
      <rect x="${CX + 16}" y="${y + 42}" width="56" height="50" rx="3" fill="${paper2}" stroke="${hair}" stroke-width="1"/>${fantomes(CX + 86, y + 54, [120, 96, 70], 14)}`).join('')}`,
  'recouvrement-impayes': () => `
    ${entrees([['tableur', 'les factures'], ['mail', 'les contacts']])}
    ${sortie('relances', [['facture a', '2e relance'], ['facture b', '1re relance'], ['facture c', 'payée'], ['suivi', 'à jour']], { connus: ['payée', 'à jour'] })}`,
  'site-modifiable-langage-naturel': () => `
    ${cadre(14, 116, 150, 68, { fill: paper })}${txt(28, 146, '« ajoute la page', { fs: 13 })}${txt(28, 166, 'de l\'équipe »', { fs: 13 })}
    ${legende('une phrase', 214)}
    ${fleche(170, 150, CX - 4, CY)}
    ${cadre(CX, 40, CW, 220, { fill: paper })}
    <path d="M${CX} 64 h${CW}" stroke="${ink}" stroke-width="2"/>
    ${[0, 1, 2].map(i => `<circle cx="${CX + 14 + i * 12}" cy="52" r="3" fill="${ink}"/>`).join('')}
    ${fantomes(CX + 16, 86, [180, 140], 14)}
    ${zone(CX + 14, 118, CW - 28, 86, 'rx="6"')}${m(CX + 26, 142, 'page ajoutée', { c: safInk })}${fantomes(CX + 26, 162, [150, 110], 14)}
    ${fantomes(CX + 16, 228, [170], 14)}`,
  'triage-mail': () => `
    ${pile(20, 150, 3, 90, 60).replace(/rx="4"/g, 'rx="3"')}
    ${legende('la boîte mail', 262)}
    ${fleche(150, 150, CX - 4, CY)}
    ${sortie('boîte · triée', [['confirmation', 'classée'], ['pièces', 'au dossier'], ['rappel', 'à traiter'], ['réponse', 'prête']])}`,
  'assistant-compta-tresorerie': () => `
    ${entrees([['banque', 'la banque'], ['tableur', 'la compta']])}
    ${sortie('point · semaine', [['encaissé', 'à jour'], ['retards', 'à suivre'], ['charges', 'à jour'], ['pièces', 'manque']])}`,
  'audit-site-seo': () => `
    ${entrees([['loupe', 'les recherches'], ['appli', 'le site']])}
    ${sortie('pages · à reprendre', [['titres', 'corrigés'], ['page métier', 'à écrire'], ['liens cassés', 'réparés'], ['positions', 'suivies']])}`,
};
const CAS = Object.fromEntries(Object.entries(C).map(([k, f]) => [`cas-${k}`, [480, 300, f]]));
