#!/usr/bin/env bash
# Rend les visuels « cas d'usage » d'oto.cx, en français puis en anglais, → out/site/cas-usage/[en/] (PNG 2×),
# puis les formats du site :
#   visuels.html : images de partage (JPEG 1200×630) et héros historiques (index, btp) ;
#   moments.html : les scènes de scenes.js (moments, héros de secteur, en-tête de l'explorateur) et de cas.js
#                  (une illustration par cas d'usage, 480×300) — WebP 2×, fond transparent ;
#   pictos/      : sans texte, dessinés à la main, copiés tels quels (une seule langue).
# La langue passe par ?l=en ; verifier-i18n.mjs refuse le rendu anglais s'il manque une traduction.
# Usage : site/cas-usage/build.sh [dossier-de-dépôt]   (chemin ABSOLU : le script change de dossier)
#         ex. site/cas-usage/build.sh /data/oto/oto-website/web/public/cas-usage
set -euo pipefail
cd "$(dirname "$0")/../.."
SECTEURS="btp saas edition conseil"
declare -A NB_MOMENTS=( [btp]=5 [saas]=5 [edition]=3 [conseil]=5 )
CAS=$(grep -oE "^  '[a-z0-9-]+': \(\)" site/cas-usage/cas.js | cut -d"'" -f2)

shot() { # <nom> <largeur,hauteur> <requête> [source, défaut visuels]  — dans $OUT, langue $L
  google-chrome-stable --headless=new --disable-gpu --hide-scrollbars --no-first-run \
    --user-data-dir="$(mktemp -d)" --allow-file-access-from-files --virtual-time-budget=8000 --default-background-color=00000000 \
    --force-device-scale-factor=2 --window-size="$2" \
    --screenshot="$OUT/$1.png" "file://$PWD/site/cas-usage/${4:-visuels}.html?$3&l=$L" 2>/dev/null
}
webp() { ffmpeg -loglevel error -y -i "$OUT/$1.png" -c:v libwebp -q:v 88 "$OUT/$1.webp"; }
# Pose un fichier dans le site sans jamais écraser en silence ce qui est publié : absent → copié ;
# identique → rien ; différent → laissé tel quel et signalé (le supprimer du site pour le redéposer).
poser() { # <source> <destination>
  mkdir -p "$(dirname "$2")"
  if [ ! -e "$2" ]; then cp "$1" "$2"
  elif ! cmp -s "$1" "$2"; then echo "${2#$DEPOT/} diffère du publié, laissé tel quel"; fi
}

rendre() { # rend tout dans $OUT pour la langue $L
  mkdir -p "$OUT"
  for v in og-index $(printf 'og-%s ' $SECTEURS); do
    shot "$v" 1200,630 "v=$v"
    ffmpeg -loglevel error -y -i "$OUT/$v.png" -vf scale=1200:630:flags=lanczos -q:v 2 "$OUT/$v.jpg"
  done
  shot hero-btp-encre 560,580 "v=hero-btp&t=encre"; webp hero-btp-encre
  for s in $SECTEURS; do
    for n in $(seq 1 "${NB_MOMENTS[$s]}"); do f="$s-$(printf %02d "$n")"; shot "$f" 560,320 "v=$f" moments; webp "$f"; done
  done
  for s in saas edition conseil; do shot "hero-$s-encre" 560,580 "v=hero-$s&t=encre" moments; webp "hero-$s-encre"; done
  shot hero-explorateur 520,420 v=hero-explorateur moments; webp hero-explorateur
  for c in $CAS; do shot "cas-$c" 480,300 "v=cas-$c" moments; webp "cas-$c"; done
}

deposer() { # dépose $OUT dans $DEPOT : seuls les visuels que le site sert
  poser "$OUT/og-index.jpg" "$DEPOT/og-cas-usage-v2.jpg"   # v2 : sans maturité (retirée du site le 24/09/2026)
  for s in $SECTEURS; do
    poser "$OUT/og-$s.jpg" "$DEPOT/og-$s.jpg"; poser "$OUT/hero-$s-encre.webp" "$DEPOT/hero-$s-encre.webp"
    for n in $(seq 1 "${NB_MOMENTS[$s]}"); do f="$s-$(printf %02d "$n").webp"; poser "$OUT/$f" "$DEPOT/moments/$f"; done
  done
  poser "$OUT/hero-explorateur.webp" "$DEPOT/hero-explorateur.webp"
  for c in $CAS; do poser "$OUT/cas-$c.webp" "$DEPOT/cas/$c.webp"; done
}

L=fr; OUT=out/site/cas-usage; rendre
node site/cas-usage/verifier-i18n.mjs en
L=en; OUT=out/site/cas-usage/en; rendre

if [ -n "${1:-}" ]; then
  L=fr; OUT=out/site/cas-usage; DEPOT=$1; deposer
  L=en; OUT=out/site/cas-usage/en; DEPOT=$1/en; deposer
  # pictos : sans texte, communs aux deux langues ; SVG en currentColor, à inliner
  for f in site/cas-usage/pictos/*.svg; do poser "$f" "$1/pictos/$(basename "$f")"; done
  for f in site/cas-usage/pictos/fonctions/*.svg; do poser "$f" "$1/fonctions/$(basename "$f")"; done
fi
