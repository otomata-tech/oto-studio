# Déployer le studio

Cible retenue : **otomata-0** (`51.15.225.121`). Chrome 149 (`/usr/bin/google-chrome`) et
ffmpeg **y sont déjà installés** — rien à poser côté dépendances système. Le service n'a
**aucune dépendance npm** (Node natif seul) : pas de `npm install`, pas de build, pas de
`node_modules`. Déployer = mettre le dépôt à jour et redémarrer.

## Port

**8100** — libre sur otomata-0 au 02/09/2026 (vérifié : `ss -tlnp`). L'inscrire dans
`/opt/ports.conf` **avant** de démarrer, et répercuter dans `/data/infra/PORTS.md`
(le fichier du serveur est la source de vérité, le repo en est le miroir).

## Étapes

```bash
# 1. le code
git clone git@github.com:otomata-tech/oto-studio.git /opt/oto-studio

# 2. l'unité
scp service/deploy/oto-studio.service otomata-0:/tmp/
ssh otomata-0 'sudo cp /tmp/oto-studio.service /etc/systemd/system/ && sudo systemctl daemon-reload'

# 3. démarrage + vérification des plafonds mémoire (ils ne sont PAS optionnels)
ssh otomata-0 'sudo systemctl enable --now oto-studio && \
  systemctl show oto-studio -p MemoryMax -p MemoryHigh -p MemorySwapMax && \
  curl -s localhost:8100/healthz'

# 4. Cloudflare Access AVANT le DNS (l'ordre compte : voir plus bas)
# 5. le vhost : recopier service/deploy/caddy-studio.snippet dans /data/infra/Caddyfile,
#    puis scp + caddy validate + systemctl reload caddy (procédure en tête de ce fichier)
# 6. le record DNS studio.oto.zone (proxied) — EN DERNIER
```

## L'ordre n'est pas négociable

Le service **n'a aucune authentification**. Tant que la politique Cloudflare Access n'est
pas posée, le nom `studio.oto.zone` ne doit pas résoudre : créer le DNS d'abord, c'est
publier un pilote de rendu ouvert. C'est la règle déjà écrite pour `mucho.oto.zone`, pour
exactement la même raison.

## Ce que le service coûte à la box

| | |
|---|---|
| au repos | un Node (~40 Mo). Chrome est **rendu après 10 min** sans rendu (`STUDIO_CHROME_IDLE_MS`) |
| en rendu | pointe mesurée **~900 Mo**, **un seul rendu à la fois** (file interne, pas une convention) |
| plafond | `MemoryMax=1400M` — au-delà le rendu est tué, la box ne bouge pas |
| disque | les travaux sont purgés au-delà des **60** plus récents (`STUDIO_KEEP`) |

⚠️ **Ce que les plafonds ne couvrent pas** : ils bornent ce service, pas la somme. Les deux
gels de cette box (30/06, 06/08) sont des accidents de **concurrence** — un build de
déploiement peut prendre 2 Go dans `user.slice` pendant qu'un rendu tourne. Si les rendus
deviennent fréquents, poser un verrou partagé avec `/opt/deploy/*.sh`, ou déplacer le
service sur oto-platform.

## Journal

`journalctl -u oto-studio -f`. Les échecs de rendu sont aussi **visibles dans l'IHM**
(galerie, état `échoué` avec son message) : c'est le premier endroit où regarder.
