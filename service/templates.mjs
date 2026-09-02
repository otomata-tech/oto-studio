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
      key: 'tools', label: 'Outils enchaînés', type: 'list', min: 1, max: 4,
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
  example: JSON.parse(read('cards/usecases.json'))[0],
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

const TEMPLATES = new Map([[carte.id, carte]]);

// L'index reste léger : ni le constructeur ni l'exemple (le manifeste unitaire les porte).
export const list = () => [...TEMPLATES.values()].map(
  ({ build, example, fields, ...rest }) => rest);

export function get(id) {
  const t = TEMPLATES.get(id);
  if (!t) throw Object.assign(new Error(`gabarit inconnu : ${id}`), { status: 404 });
  return t;
}

/** Valide les données contre le manifeste. Lève au premier champ fautif. */
export function validate(template, data) {
  const check = (fields, values, path) => {
    for (const f of fields) {
      const v = values?.[f.key];
      const where = path ? `${path}.${f.key}` : f.key;
      if (v === undefined || v === null || v === '') {
        if (f.required) throw Object.assign(new Error(`champ manquant : ${where}`), { status: 400 });
        continue;
      }
      if (f.type === 'enum' && !f.options.includes(v))
        throw Object.assign(new Error(`valeur refusée pour ${where} : ${v}`), { status: 400 });
      if (f.type === 'list') {
        if (!Array.isArray(v)) throw Object.assign(new Error(`${where} doit être une liste`), { status: 400 });
        if (f.min && v.length < f.min)
          throw Object.assign(new Error(`${where} : au moins ${f.min} entrée(s)`), { status: 400 });
        if (f.max && v.length > f.max)
          throw Object.assign(new Error(`${where} : au plus ${f.max} entrées`), { status: 400 });
        v.forEach((item, i) => check(f.item, item, `${where}[${i}]`));
      }
    }
  };
  check(template.fields, data, '');
  return data;
}
