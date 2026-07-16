#!/usr/bin/env bash
# Studio de cartes oto — lance le serveur local (preview + export MP4/GIF).
cd "$(dirname "$0")"
echo "→ http://localhost:7842"
exec node server.mjs
