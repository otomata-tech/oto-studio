#!/usr/bin/env bash
# Rend les visuels « cas d'usage » d'oto.cx → out/site/cas-usage/ (PNG 2×), puis les formats du site :
# OG en JPEG 1200×630 (l'aperçu de lien n'a que faire du 2×), héros en WebP 2× à fond transparent,
# chacun en deux variantes : fond clair (sans suffixe) et fond encre (-encre).
# Pictos de secteur (pictos/*.svg) : dessinés à la main, copiés tels quels.
# Usage : site/cas-usage/build.sh [dossier-de-dépôt]   (ex. ../oto-website/web/public/cas-usage)
set -euo pipefail
cd "$(dirname "$0")/../.."
OUT=out/site/cas-usage; mkdir -p "$OUT"
shot() { # <nom> <largeur,hauteur> <requête>
  google-chrome-stable --headless=new --disable-gpu --hide-scrollbars --no-first-run \
    --user-data-dir="$(mktemp -d)" --virtual-time-budget=8000 --default-background-color=00000000 \
    --force-device-scale-factor=2 --window-size="$2" \
    --screenshot="$OUT/$1.png" "file://$PWD/site/cas-usage/visuels.html?$3" 2>/dev/null
}
for v in og-index og-btp; do
  shot "$v" 1200,630 "v=$v"
  ffmpeg -loglevel error -y -i "$OUT/$v.png" -vf scale=1200:630:flags=lanczos -q:v 2 "$OUT/$v.jpg"
done
declare -A HERO=( [hero-index]=560,520 [hero-btp]=560,580 )
for v in "${!HERO[@]}"; do
  shot "$v" "${HERO[$v]}" "v=$v"; shot "$v-encre" "${HERO[$v]}" "v=$v&t=encre"
  for f in "$v" "$v-encre"; do ffmpeg -loglevel error -y -i "$OUT/$f.png" -c:v libwebp -q:v 88 "$OUT/$f.webp"; done
done
if [ -n "${1:-}" ]; then
  mkdir -p "$1"
  cp "$OUT/og-index.jpg" "$1/og-cas-usage.jpg"; cp "$OUT/og-btp.jpg" "$1/og-btp.jpg"
  for t in "" -encre; do
    cp "$OUT/hero-index$t.webp" "$1/hero-cas-usage$t.webp"; cp "$OUT/hero-btp$t.webp" "$1/hero-btp$t.webp"
  done
  # pictos de secteur : SVG en currentColor, à inliner (la couleur vient du texte qui les porte)
  mkdir -p "$1/pictos"; cp site/cas-usage/pictos/*.svg "$1/pictos/"
fi
