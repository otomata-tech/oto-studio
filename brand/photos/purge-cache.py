"""Purge des URLs du cache Cloudflare via un jeton éphémère, puis le supprime.

Écrit pour les portraits de `otomata.tech/equipe/` ; adapter URLS et ZONE au besoin.

Ne jamais imprimer la valeur du jeton créé.
"""
import json
import time
import urllib.error
import urllib.request

from oto.config import get_secret

ADMIN = get_secret("CLOUDFLARE_ADMIN_TOKEN")
ZONE = "041c8c58db8ae66fde759f0cce3849fc"  # otomata.tech, cf. /data/infra/docs/cloudflare.md
CACHE_PURGE_PG = "e17beae8b8cb423a99b1730f21238bed"
URLS = [
    "https://otomata.tech/equipe/alexis-laporte.jpg",
    "https://otomata.tech/equipe/sarah-soumahoro.jpg",
]
BASE = "https://api.cloudflare.com/client/v4"


def api(path, token, method="GET", body=None):
    req = urllib.request.Request(
        BASE + path,
        method=method,
        data=json.dumps(body).encode() if body else None,
        headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"},
    )
    try:
        return json.load(urllib.request.urlopen(req, timeout=60))
    except urllib.error.HTTPError as exc:
        return {"success": False, "http": exc.code, "body": json.loads(exc.read().decode() or "{}")}


created = api(
    "/user/tokens",
    ADMIN,
    "POST",
    {
        "name": f"purge-equipe-{int(time.time())}",
        "policies": [
            {
                "effect": "allow",
                "resources": {f"com.cloudflare.api.account.zone.{ZONE}": "*"},
                "permission_groups": [{"id": CACHE_PURGE_PG, "name": "Cache Purge"}],
            }
        ],
    },
)
if not created.get("success"):
    raise SystemExit("création du jeton refusée : " + json.dumps(created.get("body", created))[:400])

tid, secret = created["result"]["id"], created["result"]["value"]
print("jeton éphémère créé :", tid[:8] + "…")

try:
    for essai in range(1, 7):
        time.sleep(15)
        res = api(f"/zones/{ZONE}/purge_cache", secret, "POST", {"files": URLS})
        if res.get("success"):
            print(f"purge OK à l'essai {essai} ({essai * 15}s après création)")
            break
        errs = res.get("body", {}).get("errors") or res.get("errors")
        print(f"essai {essai}: {json.dumps(errs)[:200]}")
    else:
        print("purge jamais acceptée")
finally:
    d = api(f"/user/tokens/{tid}", ADMIN, "DELETE")
    print("jeton éphémère supprimé :", d.get("success"))
