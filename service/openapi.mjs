// Description OpenAPI servie sur /openapi.json — c'est par elle qu'un agent découvre
// l'API (le connecteur `http` d'oto ne génère pas d'outils par route : il lit ce
// document avec `http_doc()` puis appelle `http_get`/`http_post`).
// Elle est DÉRIVÉE du registre de gabarits : un gabarit ajouté s'y décrit tout seul.
import * as templates from './templates.mjs';

const champs = fields => fields.map(f => {
  const t = f.type === 'list'
    ? `liste de { ${f.item.map(i => i.key).join(', ')} }`
    : f.type;
  const opts = f.type === 'enum' ? ` — valeurs : ${f.options.slice(0, 8).join(', ')}${f.options.length > 8 ? '…' : ''}` : '';
  return `  - \`${f.key}\` (${t}${f.required ? ', requis' : ', optionnel'})${opts}${f.hint ? ` — ${f.hint}` : ''}`;
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
        'Marche à suivre : `POST /api/renders` avec un `template` et son `data` → la réponse ' +
        'donne un `id` et un `status` **`en_cours`** ; le rendu se fait en tâche de fond ' +
        '(compter ~45 s pour une vidéo). Relire `GET /api/renders/{id}` jusqu\'à `fini` ' +
        '(ou `échoué`, qui porte alors son `error`), puis servir les fichiers listés dans ' +
        '`files` via `/files/{id}/{nom}`.\n\n' +
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
