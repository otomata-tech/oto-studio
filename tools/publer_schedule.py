#!/usr/bin/env python3
import subprocess, os, time, json, requests, yaml

sec = yaml.safe_load(subprocess.check_output(["sops","-d",os.path.expanduser("~/.otomata/secrets/secrets.yaml")]))
KEY = sec["PUBLER_API_KEY"]; WS = "6a48458a07c8e53058570764"
ACCOUNT = "6a4845f3bd0b150260cddfe6"   # profil LinkedIn Alexis
B = "https://app.publer.com/api/v1"
H = {"Authorization": f"Bearer-API {KEY}", "Publer-Workspace-Id": WS}
VIDEO = os.path.join(os.path.dirname(__file__), "..", "out", "01-prospection.mp4")
SCHED = "2026-07-05T09:00:00+02:00"
TEXT = """L'IA agentique cowork-style à la portée de n'importe quel abonnement IA avec le MCP oto. Et tous les avantages que le harnais-as-a-service apporte en terme de sécurité, de collaboration, et de performance.



👉 https://oto.cx ou contactez-moi pour l'installer chez vous"""

def total():
    return requests.get(f"{B}/posts", headers=H, timeout=30).json().get("total")

print("posts avant:", total())

# upload
with open(VIDEO,"rb") as f:
    up = requests.post(f"{B}/media", headers=H, files={"file":("01-prospection.mp4",f,"video/mp4")}, timeout=120).json()
media = up[0] if isinstance(up,list) else up
mid = media["id"]
print("media_id:", mid)
print("attente traitement vidéo (25s)…"); time.sleep(25)

# schedule
body = {"bulk": {"state":"scheduled", "posts":[{
    "networks": {"linkedin": {"type":"video", "text":TEXT, "media":[{"id":mid,"type":"video"}]}},
    "accounts": [{"id":ACCOUNT, "scheduled_at":SCHED}]
}]}}
r = requests.post(f"{B}/posts/schedule", headers={**H,"Content-Type":"application/json"}, json=body, timeout=60)
print("schedule http:", r.status_code, r.text[:200])
job = r.json().get("job_id")

for i in range(12):
    time.sleep(3)
    st = requests.get(f"{B}/job_status/{job}", headers=H, timeout=30).json()
    if st.get("status") in ("complete","completed","failed"):
        print("job:", json.dumps(st)); break

print("posts après:", total())
# retrouver le post scheduled
d = requests.get(f"{B}/posts", headers=H, params={"state":"scheduled"}, timeout=30).json()
posts = d.get("posts", [])
print("scheduled trouvés:", len(posts))
for p in posts:
    print("  ->", p.get("id"), "|", p.get("scheduled_at"), "|", list((p.get("networks") or {}).keys()), "|", (p.get("text") or "")[:40].replace("\n"," "))
