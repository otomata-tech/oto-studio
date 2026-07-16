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
