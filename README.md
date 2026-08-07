# oto-studio — visuels de communication oto (LinkedIn)

Studio local de création de visuels dans la charte oto.cx : cartes « cas d'usage » animées, affiches « posts produit », plaquettes. Export MP4/GIF via Chrome headless + ffmpeg.

## Structure

```
cards/        # générateur de cartes cas d'usage (studio + batch)
posts/        # affiches riso animées, une par post produit
plaquettes/   # one-pagers imprimables (plaquette commerciale)
assets/       # fonts.css, icons.json, logos/ (marques tierces)
tools/        # publication (publer_schedule.py)
brand/        # logos & charte Otomata/Oto (cache local ; voir brand/README.md)
out/          # exports (ignoré), en miroir des sources :
              #   cards/ · posts/ · plaquettes/ · articles/<slug>/
.gen/         # HTML générés + frames intermédiaires (ignoré)
```

## Cartes cas d'usage (`cards/`)

```bash
./run.sh                          # studio : formulaire + preview + export → http://localhost:7842
node cards/build-all.mjs [start count]   # batch : régénère les MP4+GIF des cas d'usage
```

- `cards/studio.html` — l'UI (formulaire + preview + export)
- `cards/server.mjs` — serveur (studio + endpoint /render)
- `cards/template-body.html` — le gabarit animé de la carte (le design, figé)
- `cards/usecases.json` — les cas d'usage (presets, chiffres = placeholders à remplacer par un vrai run oto)

## Posts produit (`posts/`) — affiches riso animées

Affiches 1200×1500 (4:5 LinkedIn) dans la charte « riso » : tokens `@otomata/ui` THEME.md + grain papier (SVG feTurbulence), halo solaire saffran, ombres portées dures sans radius, décalage d'encrage saffran (titres, câbles), tampons/étiquettes désaxés.

```bash
node posts/build-post.mjs <slug>   # rend posts/<slug>.html → out/<slug>.mp4 + .gif
```

- `posts/otocx.html` — post lancement oto.cx (« L'OS pour vous et votre agent »)
- `posts/connectors.html` — post nouveaux connecteurs, en 2 actes : tuiles logos (grille→bandeau par morph) puis carte conversation façon cas d'usage ; les concepts oto (chips PROCÉDURE/TABLEAU, projet en ligne finale) encadrent les connecteurs — montrer l'apport d'oto, pas des connecteurs MCP « natifs »
- Même pattern que les cartes : `window.__seek(t)` déterministe (styles calculés depuis t, pas de transitions CSS) + capture CDP + ffmpeg
- Affiche statique one-shot : `google-chrome-stable --headless=new --screenshot --window-size=1200,1500 --force-device-scale-factor=2`
- Direction éditoriale (validée) : une seule idée et une phrase clé par visuel ; pas de « slide de deck » ; les illustrations d'usage mobilisent procédures/tableaux/projets

### Logos de marques (`assets/logos/`)
- `cdn.simpleicons.org/<slug>` : reddit (`#FF4500`), zoho (`#E42527`) — **salesforce absent** → SVG Wikimedia Commons ; LightOn → SVG du CDN de lighton.ai, livré `fill="white"` → recolorer en encre `#2c2112`
- Le backend oto passe par logo.dev (token env `LOGODEV_TOKEN`) — non disponible localement, ne pas compter dessus ici

## Pré-requis
`google-chrome` + `ffmpeg` (déjà présents sur ce poste).

## Exports
Les exports sortent dans `out/<famille>/` — `out/cards/`, `out/posts/`, `out/plaquettes/`, `out/articles/<slug>/` (illustrations statiques d'articles, sources dans `article-<slug>/`). Les scripts créent leur sous-dossier eux-mêmes. LinkedIn : préférer le **MP4** (le GIF natif y est souvent rendu statique).

## Gotchas (rendu Chrome headless, cet environnement)
- **Toujours** lancer Chrome avec un `--user-data-dir` **isolé** (ex. `/tmp/oto-build-chrome`). Sans ça, il partage le profil par défaut du navigateur GUI → ferme les fenêtres de l'utilisateur **et** fait échouer le rendu.
- `Target.createTarget` : **ne pas** passer `width`/`height` (erreur « Target position can only be set for new windows » avec un profil isolé). Fixer la taille via `Emulation.setDeviceMetricsOverride`.
- Le sandbox de l'agent **tue les serveurs/process de fond longs** (exit 144). Lancer `server.mjs` soi-même dans un terminal ; les batchs finis (`build-all.mjs`, `build-post.mjs`) passent en tâche de fond OK.

## Publication
Publer (SaaS) — voir `tools/publer_schedule.py`. Connecteur oto à venir : `otomata-tech/otomata-private#60`.
Gotcha : le plan Publer **trial refuse la publication** (job `complete` mais `payload.failures`) → plan payant requis.

## Licence & marques
Code sous [MIT](LICENSE). Les logos tiers (`assets/logos/` : Salesforce, LightOn, Reddit, Zoho, Anthropic/Claude, OpenAI, Mistral, Google Gemini…) sont des marques de leurs propriétaires respectifs, utilisées ici à titre nominatif dans des visuels de communication — ils ne sont pas couverts par la licence MIT.
