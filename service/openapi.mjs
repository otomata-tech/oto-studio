// Description OpenAPI servie sur /openapi.json — c'est par elle qu'un agent découvre
// l'API (le connecteur `http` d'oto ne génère pas d'outils par route : il lit ce
// document avec `http_doc()` puis appelle `http_get`/`http_post`).
// Elle est DÉRIVÉE du registre de gabarits : un gabarit ajouté s'y décrit tout seul.
import * as templates from './templates.mjs';

// Les valeurs autorisées sont données EN ENTIER, y compris pour les sous-champs d'une
// liste : une énumération tronquée fait inventer une valeur plausible, refusée ensuite
// (constaté en appelant l'API depuis un agent — « check » n'est pas une icône).
const enumValues = f => f.type === 'enum' ? ` — valeurs autorisées : ${f.options.join(', ')}` : '';

const champs = (fields, indent = '  ') => fields.map(f => {
  const head = `${indent}- \`${f.key}\` (${f.type === 'list' ? 'liste' : f.type}` +
    `${f.required ? ', requis' : ', optionnel'}` +
    `${f.min ? `, ${f.min} minimum` : ''}${f.max ? `, ${f.max} maximum` : ''})` +
    `${enumValues(f)}${f.hint ? ` — ${f.hint}` : ''}`;
  return f.type === 'list'
    ? `${head}\n${indent}  chaque entrée :\n${champs(f.item, indent + '    ')}`
    : head;
}).join('\n');

export function openapi() {
  const list = templates.list();
  const detail = list.map(t => {
    const full = templates.get(t.id);
    return `### \`${t.id}\` — ${t.label}\n${t.description}\nFormats : ${t.formats.join(', ')}. ` +
      `Taille : ${t.size.width}×${t.size.height}.\nChamps de \`data\` :\n${champs(full.fields)}`;
  }).join('\n\n');

  return {
    openapi: '3.0.3',
    info: {
      title: 'oto studio',
      version: '1',
      description:
        'Produit des visuels dans la charte Otomata à partir de gabarits fermés.\n\n' +
        'Marche à suivre : `POST /api/renders` avec un `template` et son `data`. La réponse ' +
        'porte **`page`** — une URL à donner telle quelle à la personne : elle affiche ' +
        'l\'attente, puis le visuel dès qu\'il est prêt. **C\'est ce qu\'il faut rendre**, ' +
        'plutôt que de faire patienter quelqu\'un pendant le rendu.\n\n' +
        'Le rendu se fait en tâche de fond : le travail sort en `status` **`en_cours`** ' +
        '(compter ~1 min pour une carte, 2 à 3 min pour une affiche animée). Pour suivre soi-même, ' +
        'relire `GET /api/renders/{id}` jusqu\'à `fini` (ou `échoué`, qui porte alors son ' +
        '`error`) ; les fichiers sont alors dans `files_url`, en URL absolues.\n\n' +
        'Un champ inconnu, un champ requis manquant ou un format que le gabarit ne sert pas ' +
        'sont REFUSÉS avec un message explicite — il n\'y a pas de valeur de repli.\n\n' +
        '## Gabarits disponibles\n\n' + detail
    },
    paths: {
      '/api/templates': {
        get: { summary: 'Les gabarits et leurs formats', responses: { 200: { description: 'liste' } } }
      },
      '/api/templates/{id}': {
        get: {
          summary: 'Le manifeste d\'un gabarit : ses champs, ses contraintes, un exemple complet',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'manifeste' }, 404: { description: 'gabarit inconnu' } }
        }
      },
      '/api/renders': {
        get: { summary: 'Les rendus récents, du plus récent au plus ancien', responses: { 200: { description: 'liste' } } },
        post: {
          summary: 'Lancer un rendu (rend la main tout de suite, le travail part en fond)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['template', 'data'],
                  properties: {
                    template: { type: 'string', description: 'id du gabarit', enum: list.map(t => t.id) },
                    data: { type: 'object', description: 'les champs du gabarit — cf. son manifeste' },
                    formats: {
                      type: 'array', items: { type: 'string', enum: ['mp4', 'gif', 'png'] },
                      description: 'défaut : ["mp4"]. Doit être servi par le gabarit.'
                    },
                    author: { type: 'string', description: 'qui demande — repris tel quel dans la galerie' }
                  }
                }
              }
            }
          },
          responses: { 200: { description: 'le travail créé, `status` = en_cours' }, 400: { description: 'données refusées' } }
        }
      },
      '/api/renders/{id}': {
        get: {
          summary: 'L\'état d\'un rendu : en_cours | fini | échoué',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'le travail' }, 404: { description: 'inconnu' } }
        }
      },
      '/files/{id}/{nom}': {
        get: {
          summary: 'Un fichier produit (mp4, gif, png)',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'nom', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: { 200: { description: 'le fichier' }, 404: { description: 'absent' } }
        }
      },
      '/healthz': { get: { summary: 'Liveness', responses: { 200: { description: 'ok' } } } }
    }
  };
}
