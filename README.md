# oto-studio — générateur de cartes « cas d'usage » (LinkedIn)

Studio local : formulaire + preview live + export MP4/GIF, dans la charte oto.cx.

## Lancer
```bash
./run.sh          # ou : node server.mjs
```
Puis ouvrir http://localhost:7842

## Fichiers
- `studio.html`      — l'UI (formulaire + preview + export)
- `server.mjs`       — serveur (sert le studio + endpoint /render : Chrome headless + ffmpeg)
- `template-body.html` — le gabarit animé de la carte (le design, figé)
- `usecases.json`    — les 20 cas d'usage (presets, chiffres = placeholders à remplacer par un vrai run oto)
- `icons.json`, `logo_*.svg`, `fonts.css` — assets embarqués
- `brand/`           — logos & charte Otomata/Oto (cache local ; voir `brand/README.md`)
- `build-all.mjs`    — régénère les MP4+GIF en batch (`node build-all.mjs [start count]`)
- `publer_schedule.py` — programme un post LinkedIn via l'API Publer (upload média → post scheduled)

## Posts produit (affiches riso animées)

Deuxième famille de visuels (08/2026), distincte des cartes cas d'usage : affiches 1200×1500 (4:5 LinkedIn) dans la charte « riso » — tokens `@otomata/ui` THEME.md + grain papier (SVG feTurbulence), halo solaire saffran, ombres portées dures sans radius, décalage d'encrage saffran (titres, câbles), tampons/étiquettes désaxés.

- `anim-otocx.html` + `build-otocx.mjs` — post lancement oto.cx (« L'OS pour vous et votre agent »)
- `anim-connectors.html` + `build-connectors.mjs` — post nouveaux connecteurs, structure en 2 actes : tuiles logos (grille→bandeau par morph) puis carte conversation façon cas d'usage ; les concepts oto (chips PROCÉDURE/TABLEAU, projet en ligne finale) encadrent les connecteurs — montrer l'apport d'oto, pas des connecteurs MCP « natifs »
- Même pattern que les cartes : `window.__seek(t)` déterministe (styles calculés depuis t, pas de transitions CSS) + capture CDP + ffmpeg ; un build par post, **port CDP distinct** (9334, 9335…) et `--user-data-dir` distinct
- Affiche statique one-shot : `google-chrome-stable --headless=new --screenshot --window-size=1200,1500 --force-device-scale-factor=2` (cf. `post-otocx-visuel.png`)
- Direction éditoriale (validée) : une seule idée et une phrase clé par visuel ; pas de « slide de deck » ; les illustrations d'usage mobilisent procédures/tableaux/projets

### Logos de marques
- `cdn.simpleicons.org/<slug>` : reddit (`#FF4500`), zoho (`#E42527`) — **salesforce absent** → SVG Wikimedia Commons ; LightOn → SVG du CDN de lighton.ai, livré `fill="white"` → recolorer en encre `#2c2112`
- Le backend oto passe par logo.dev (token env `LOGODEV_TOKEN`) — non disponible localement, ne pas compter dessus ici

## Pré-requis
`google-chrome` + `ffmpeg` (déjà présents sur ce poste).

## Exports
Les MP4+GIF sortent dans `out/`. LinkedIn : préférer le **MP4** (le GIF natif y est souvent rendu statique).

## Gotchas (rendu Chrome headless, cet environnement)
- **Toujours** lancer Chrome avec un `--user-data-dir` **isolé** (ex. `/tmp/oto-build-chrome`). Sans ça, il partage le profil par défaut du navigateur GUI → ferme les fenêtres de l'utilisateur **et** fait échouer le rendu.
- `Target.createTarget` : **ne pas** passer `width`/`height` (erreur « Target position can only be set for new windows » avec un profil isolé). Fixer la taille via `Emulation.setDeviceMetricsOverride`.
- Le sandbox de l'agent **tue les serveurs/process de fond longs** (exit 144). Lancer `server.mjs` soi-même dans un terminal ; les batchs finis (`build-all.mjs`) passent en tâche de fond OK.

## Publication
Publer (SaaS) — voir `publer_schedule.py`. Connecteur oto à venir : `otomata-tech/otomata-private#60`.
Gotcha : le plan Publer **trial refuse la publication** (job `complete` mais `payload.failures`) → plan payant requis.

## Licence & marques
Code sous [MIT](LICENSE). Les logos tiers (`logo_*.svg` : Salesforce, LightOn, Reddit, Zoho, Anthropic/Claude, OpenAI, Mistral, Google Gemini…) sont des marques de leurs propriétaires respectifs, utilisées ici à titre nominatif dans des visuels de communication — ils ne sont pas couverts par la licence MIT.
