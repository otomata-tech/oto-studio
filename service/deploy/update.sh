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
avant=$(git rev-parse HEAD)
cible=$(git rev-parse origin/main)
[ "$avant" = "$cible" ] && exit 0

# Attend que le service réponde. 40 s : un démarrage à froid prend ~2 s, on laisse
# large sans immobiliser le minuteur suivant.
sante() {
  for _ in $(seq 1 40); do
    curl -fsS -o /dev/null "http://127.0.0.1:${PORT}/healthz" && return 0
    sleep 1
  done
  return 1
}

echo "studio : ${avant:0:7} → ${cible:0:7}"
# --ff-only : si le checkout a divergé (édition à la main sur la box), on s'arrête
# plutôt que d'écraser. Le journal le dira, et c'est une anomalie à regarder.
git merge --ff-only origin/main
systemctl restart oto-studio

if sante; then
  echo "studio : déployé sur ${cible:0:7}"
  exit 0
fi

# Sans ce retour arrière, un commit qui casse le démarrage laisse le studio par terre
# et le minuteur retente le MÊME commit toutes les deux minutes, sans que personne
# soit prévenu. On repose la version qui marchait, et c'est le dépôt qu'on corrige.
echo "studio : ÉCHEC — /healthz muet 40 s après ${cible:0:7}, retour sur ${avant:0:7}" >&2
git reset --hard --quiet "$avant"
systemctl restart oto-studio
if sante; then
  echo "studio : revenu sur ${avant:0:7} — le dépôt reste en avance, le prochain passage retentera" >&2
  exit 1
fi
echo "studio : CRITIQUE — ni ${cible:0:7} ni ${avant:0:7} ne répondent, intervention nécessaire" >&2
exit 2
