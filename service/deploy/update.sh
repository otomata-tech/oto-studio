#!/usr/bin/env bash
# Déploiement continu du studio : si origin/main a bougé, mettre à jour et redémarrer.
#
# C'est la BOX qui va chercher, et non un pipeline qui pousse : le port 22 est fermé
# et le tunnel Cloudflare exige une authentification navigateur, donc un runner
# GitHub devrait détenir un service token Access. Un `git fetch` sortant ne demande
# aucun secret entrant et n'ouvre rien.
set -euo pipefail

DIR=${STUDIO_DIR:-/opt/oto-studio}
PORT=${STUDIO_PORT:-8100}

cd "$DIR"
git fetch --quiet origin main
local_sha=$(git rev-parse HEAD)
remote_sha=$(git rev-parse origin/main)
[ "$local_sha" = "$remote_sha" ] && exit 0

echo "studio : $(git log --oneline -1 --format=%h) → ${remote_sha:0:7}"
# --ff-only : si le checkout a divergé (édition à la main sur la box), on s'arrête
# plutôt que d'écraser. Le journal le dira, et c'est une anomalie à regarder.
git merge --ff-only origin/main
systemctl restart oto-studio

for _ in $(seq 1 40); do
  if curl -fsS -o /dev/null "http://127.0.0.1:${PORT}/healthz"; then
    echo "studio : déployé sur ${remote_sha:0:7}"
    exit 0
  fi
  sleep 1
done
echo "studio : ÉCHEC — /healthz muet 40 s après le redémarrage (${remote_sha:0:7})" >&2
exit 1
