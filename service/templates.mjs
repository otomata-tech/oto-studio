// Registre des gabarits : ce que l'IHM affiche en formulaire, et ce que l'API accepte.
// Un gabarit = un manifeste de champs + une fonction qui rend l'HTML complet.
// Ajouter un gabarit = ajouter une entrée ici. Rien n'est découvert dynamiquement :
// un gabarit qu'on ne peut pas décrire en champs n'a rien à faire dans le studio.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const read = p => readFileSync(join(ROOT, p), 'utf8');
const iconPath = f => {
  const m = read(`assets/logos/${f}`).match(/<path[^>]*\sd="([^"]+)"/);
  if (!m) throw new Error(`logo illisible : ${f}`);
  return m[1];
};

const ICONS = read('assets/icons.json');
const ICON_KEYS = Object.keys(JSON.parse(ICONS));
const TINTS = ['terra', 'saffron', 'olive', 'cobalt'];

// Du JSON posé DANS un <script> n'est pas du JSON : le parseur HTML ferme la balise
// au premier `</script>` rencontré, même à l'intérieur d'une chaîne. Une valeur de
// formulaire contenant `</script>` reprendrait donc la main sur la page — qui est
// rendue depuis `file://`, avec ce que ça implique. Neutraliser `<` suffit et couvre
// aussi `<!--`. À faire à CHAQUE injection, pas seulement sur les champs suspects.
const inScript = value =>
  (typeof value === 'string' ? value : JSON.stringify(value)).replace(/</g, '\\u003c');

// Même piège que `inScript`, autre contexte : une valeur de formulaire posée dans le
// <title> peut le refermer et ouvrir un <script>. Le titre vient toujours des données,
// il s'échappe donc toujours.
const inText = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function page(title, body) {
  return `<!doctype html>\n<html lang="fr"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>${inText(title)}</title></head><body>\n${body}\n</body></html>`;
}

/* ---------- carte « cas d'usage » ---------- */

const carte = {
  id: 'carte-cas-usage',
  label: 'Carte cas d\'usage',
  description: 'Une demande en langage courant, les outils qu\'oto enchaîne, le résultat. Animée, carrée.',
  size: { width: 1080, height: 1080 },
  fps: 18,
  formats: ['mp4', 'gif', 'png'],
  fields: [
    { key: 'num', label: 'Numéro', type: 'text', required: true, hint: 'deux chiffres, ex. 07' },
    { key: 'kicker', label: 'Catégorie', type: 'text', required: true, hint: 'un mot, en capitales sur la carte' },
    { key: 'msg', label: 'La demande', type: 'textarea', required: true,
      hint: 'la phrase telle qu\'on la dirait à un agent — pas un titre marketing' },
    {
      // `required` ET `min` : sans `required`, une liste absente échappe au contrôle
      // (la validation saute les champs vides non requis) et `min` ne serait jamais lu.
      key: 'tools', label: 'Outils enchaînés', type: 'list', required: true, min: 1, max: 4,
      hint: 'l\'ordre est celui de l\'animation',
      item: [
        { key: 'icon', label: 'Icône', type: 'enum', options: ICON_KEYS, required: true },
        { key: 'tint', label: 'Teinte', type: 'enum', options: TINTS, required: true },
        { key: 'ns', label: 'Espace', type: 'text', required: true, hint: 'ex. oto' },
        { key: 'name', label: 'Nom de l\'outil', type: 'text', required: true,
          hint: '⚠️ vérifier qu\'il existe encore côté backend avant publication' },
        { key: 'label', label: 'Ce qu\'il fait', type: 'text', required: true },
        { key: 'res', label: 'Résultat', type: 'text', required: true, hint: 'court, chiffré' }
      ]
    },
    { key: 'final', label: 'La chute', type: 'textarea', required: true,
      hint: 'une phrase ; <b>…</b> autorisé pour le chiffre' }
  ],
  // Le formulaire s'ouvre pré-rempli : un champ vide ne dit pas ce qu'on attend
  // (ton de la demande, granularité d'un résultat). Premier cas d'usage publié.
  // ⚠️ FILTRÉ sur les champs déclarés : le fichier source porte aussi un `slug`, que
  // le gabarit n'expose pas. Servir l'exemple brut donnait un exemple que la
  // validation refuse — un service qui se contredit lui-même.
  get example() {
    const clefs = new Set(['num', 'kicker', 'msg', 'tools', 'final']);
    const src = JSON.parse(read('cards/usecases.json'))[0];
    return Object.fromEntries(Object.entries(src).filter(([k]) => clefs.has(k)));
  },
  build(data) {
    const tpl = read('cards/template-body.html');
    const inject = `<script>window.__ICONS=${inScript(ICONS)};window.__UC=${inScript(data)};</script>`;
    const body = tpl
      .replace('<!--__DATA__-->', inject)
      .replace('/* __FONTS__ */', read('assets/fonts.css'))
      .replace('__CLAUDE__', iconPath('logo_claude.svg'))
      .replace('__MISTRAL__', iconPath('logo_mistralai.svg'))
      .replace('__OPENAI__', iconPath('logo_openai.svg'));
    return page(`oto — ${data.kicker}`, body);
  }
};

/* ---------- affiche animée « la scène recule » ---------- */

const affiche = {
  id: 'affiche-recul',
  label: 'Affiche animée — la scène recule',
  description: 'Format LinkedIn 4:5. La scène occupe toute la hauteur pendant l\'animation, ' +
    'puis recule pour laisser monter la phrase de chute. Pas de zone morte, contenus plus gros.',
  size: { width: 1200, height: 1500 },
  fps: 25,
  formats: ['mp4', 'gif', 'png'],
  fields: [
    { key: 'mention', label: 'Mention', type: 'text', required: false,
      hint: 'en haut à droite, ex. « Claude Code · 7 août 2026 »' },
    { key: 'kicker', label: 'Ligne de contexte', type: 'text', required: true,
      hint: 'une ligne, sous l\'en-tête ; <b>…</b> autorisé pour le chiffre' },
    {
      key: 'cards', label: 'Cartes de la scène', type: 'list', required: true, min: 2, max: 4,
      hint: 'elles apparaissent dans l\'ordre, la première est mise en avant',
      item: [
        { key: 'title', label: 'Titre', type: 'text', required: true, hint: 'court, en capitales sur la carte' },
        { key: 'tag', label: 'Étiquette', type: 'text', required: false, hint: 'à droite du titre, ex. « session 2 »' },
        { key: 'body', label: 'Contenu', type: 'textarea', required: true,
          hint: 'une ligne par ligne affichée (8 maximum) — frappées l\'une après l\'autre' }
      ]
    },
    { key: 'phrase', label: 'La chute', type: 'text', required: true,
      hint: 'la première ligne de la phrase clé' },
    { key: 'kick', label: 'La chute, second temps', type: 'text', required: false,
      hint: 'la ligne qui tombe après — c\'est elle qu\'on retient' }
  ],
  example: {
    mention: 'Claude Code · 2 septembre 2026',
    kicker: '<b>11 sessions ouvertes</b> — trois avancent en parallèle.',
    cards: [
      { title: 'refonte', tag: 'chef', body: '> où en est la prospection ?\nsession 2 → 42 contacts\nsession 3 → audit terminé' },
      { title: 'prospection', tag: 'session 2', body: 'fr_search → 42 ETI\nhunter → 38 emails\nfolk → +42' },
      { title: 'mission', tag: 'session 3', body: 'relecture du contrat\nconflit détecté art. 7\nremonté au chef' }
    ],
    phrase: 'Ce n\'est plus une session.',
    kick: 'C\'est une équipe.'
  },
  build(data) {
    const tpl = read('posts/template-affiche.html');
    const inject = `<script>window.__AFF=${inScript(data)};</script>`;
    const body = tpl
      .replace('<!--__DATA__-->', inject)
      .replace('/* __FONTS__ */', read('assets/fonts.css'));
    return page(`oto — ${data.kicker}`, body);
  }
};

const TEMPLATES = new Map([[carte.id, carte], [affiche.id, affiche]]);

// L'index reste léger : ni le constructeur ni l'exemple (le manifeste unitaire les porte).
export const list = () => [...TEMPLATES.values()].map(
  ({ build, example, fields, ...rest }) => rest);

export function get(id) {
  const t = TEMPLATES.get(id);
  if (!t) throw Object.assign(new Error(`gabarit inconnu : ${id}`), { status: 404 });
  return t;
}

/** Valide les données contre le manifeste.
 *
 *  Deux règles que le contrat promet et qu'il faut donc tenir :
 *  - un champ INCONNU est refusé. Sans ça, une faute de frappe sur un nom de champ
 *    produit un visuel silencieusement amputé — l'échec le plus coûteux, parce qu'il
 *    ressemble à un succès. (Trouvé en faisant appeler l'API par un agent, 02/09.)
 *  - TOUS les refus sont rendus d'un coup. Un agent qui cumule trois fautes doit les
 *    voir ensemble, pas faire trois allers-retours.
 */
export function validate(template, data) {
  const refus = [];

  const check = (fields, values, path) => {
    const où = k => (path ? `${path}.${k}` : k);
    if (values === null || typeof values !== 'object' || Array.isArray(values)) {
      refus.push(`${path || 'data'} doit être un objet`);
      return;
    }

    const connus = new Set(fields.map(f => f.key));
    for (const k of Object.keys(values))
      if (!connus.has(k))
        refus.push(`champ inconnu : ${où(k)} (attendus : ${[...connus].join(', ')})`);

    for (const f of fields) {
      const v = values[f.key];
      if (v === undefined || v === null || v === '') {
        if (f.required) refus.push(`champ manquant : ${où(f.key)}`);
        continue;
      }
      if (f.type === 'enum' && !f.options.includes(v))
        refus.push(`valeur refusée pour ${où(f.key)} : ${v} (attendues : ${f.options.join(', ')})`);
      if (f.type === 'list') {
        if (!Array.isArray(v)) { refus.push(`${où(f.key)} doit être une liste`); continue; }
        if (f.min && v.length < f.min) refus.push(`${où(f.key)} : au moins ${f.min} entrée(s)`);
        if (f.max && v.length > f.max) refus.push(`${où(f.key)} : au plus ${f.max} entrées`);
        v.forEach((item, i) => check(f.item, item, `${où(f.key)}[${i}]`));
      }
    }
  };

  check(template.fields, data, '');
  if (refus.length)
    throw Object.assign(new Error(refus.join(' · ')), { status: 400, refus });
  return data;
}
