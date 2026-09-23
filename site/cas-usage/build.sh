#!/usr/bin/env bash
# Rend les visuels « cas d'usage » d'oto.cx → out/site/cas-usage/ (PNG 2×), puis les formats du site :
#   visuels.html : images de partage (JPEG 1200×630) et héros historiques (index, btp) ;
#   moments.html : les scènes de scenes.js — moments du récit, héros de secteur, en-tête de l'explorateur
#                  (WebP 2×, fond transparent) ;
#   (cas.js, via moments.html : une illustration par cas d'usage, 480×300)
#   pictos/      : dessinés à la main, copiés tels quels.
# Usage : site/cas-usage/build.sh [dossier-de-dépôt]   (chemin ABSOLU : le script change de dossier)
#         ex. site/cas-usage/build.sh /data/oto/oto-website/web/public/cas-usage
set -euo pipefail
cd "$(dirname "$0")/../.."
OUT=out/site/cas-usage; mkdir -p "$OUT"
SECTEURS="btp saas edition conseil"
declare -A NB_MOMENTS=( [btp]=5 [saas]=5 [edition]=3 [conseil]=5 )

shot() { # <nom> <largeur,hauteur> <requête> [source, défaut visuels]
  google-chrome-stable --headless=new --disable-gpu --hide-scrollbars --no-first-run \
    --user-data-dir="$(mktemp -d)" --allow-file-access-from-files --virtual-time-budget=8000 --default-background-color=00000000 \
    --force-device-scale-factor=2 --window-size="$2" \
    --screenshot="$OUT/$1.png" "file://$PWD/site/cas-usage/${4:-visuels}.html?$3" 2>/dev/null
}
webp() { ffmpeg -loglevel error -y -i "$OUT/$1.png" -c:v libwebp -q:v 88 "$OUT/$1.webp"; }

# images de partage
for v in og-index $(printf 'og-%s ' $SECTEURS); do
  shot "$v" 1200,630 "v=$v"
  ffmpeg -loglevel error -y -i "$OUT/$v.png" -vf scale=1200:630:flags=lanczos -q:v 2 "$OUT/$v.jpg"
done
# héros historiques (visuels.html) : index et btp, clair et encre
declare -A HERO=( [hero-index]=560,520 [hero-btp]=560,580 )
for v in "${!HERO[@]}"; do
  shot "$v" "${HERO[$v]}" "v=$v"; shot "$v-encre" "${HERO[$v]}" "v=$v&t=encre"; webp "$v"; webp "$v-encre"
done
# scènes : moments, héros de secteur (fond encre), en-tête de l'explorateur
for s in $SECTEURS; do
  for n in $(seq -w 1 "${NB_MOMENTS[$s]}"); do n=$(printf %02d "$n"); shot "$s-$n" 560,320 "v=$s-$n" moments; webp "$s-$n"; done
done
for s in saas edition conseil; do shot "hero-$s-encre" 560,580 "v=hero-$s&t=encre" moments; webp "hero-$s-encre"; done
shot hero-explorateur 520,420 v=hero-explorateur moments; webp hero-explorateur
# une illustration par cas d'usage : les clés de cas.js
CAS=$(grep -oE "^  '[a-z0-9-]+': \(\)" site/cas-usage/cas.js | cut -d"'" -f2)
for c in $CAS; do shot "cas-$c" 480,300 "v=cas-$c" moments; webp "cas-$c"; done

if [ -n "${1:-}" ]; then
  # seuls les visuels que le site sert ; les autres restent dans out/
  mkdir -p "$1/moments" "$1/pictos" "$1/fonctions"
  cp "$OUT/og-index.jpg" "$1/og-cas-usage-v2.jpg"   # v2 : sans maturité (retirée du site le 24/09/2026)
  for s in $SECTEURS; do
    cp "$OUT/og-$s.jpg" "$OUT/hero-$s-encre.webp" "$1/"
    # un moment déjà publié ne se remplace pas en silence : le supprimer d'abord pour le redéposer
    for n in $(seq 1 "${NB_MOMENTS[$s]}"); do
      f="$s-$(printf %02d "$n").webp"
      if [ -e "$1/moments/$f" ]; then echo "moments/$f déjà publié, laissé tel quel"; else cp "$OUT/$f" "$1/moments/"; fi
    done
  done
  cp "$OUT/hero-explorateur.webp" "$1/"
  mkdir -p "$1/cas"
  for c in $CAS; do
    if [ -e "$1/cas/$c.webp" ]; then echo "cas/$c.webp déjà publié, laissé tel quel"; else cp "$OUT/cas-$c.webp" "$1/cas/$c.webp"; fi
  done
  # pictos : SVG en currentColor, à inliner (la couleur vient du texte qui les porte)
  cp site/cas-usage/pictos/*.svg "$1/pictos/"
  cp site/cas-usage/pictos/fonctions/*.svg "$1/fonctions/"
fi
