# Le studio, côté service

### S'en servir depuis oto (agents)

Le studio est un **connecteur `http`** de l'org Otomata, instance **`org:2:http:studio`**
(`inst:169`, posée le 02/09/2026, visible de toute l'org). N'importe quel Claude branché sur
oto peut donc produire un visuel — pas seulement le studio dans un navigateur.

```
http_doc(_instance="org:2:http:studio")                    # le contrat : gabarits, champs,
                                                           # valeurs autorisées, marche à suivre
http_get(path="/api/templates/carte-cas-usage", …)         # le manifeste + un exemple complet
http_post(path="/api/renders", body={template, data, formats}, …)
http_get(path="/api/renders/<id>", …)                      # jusqu'à status = fini
                                                           # puis /files/<id>/<nom>
```

**Épingler l'instance à chaque appel** (`_instance=`) : le connecteur `http` est multi-compte
et la pose d'une clé d'org **exige** de nommer le compte (`409 account_required`). Un appel
sans épinglage devient ambigu dès qu'un second pont existe. Dans un projet oto, le lien vers
le connecteur porte l'`instance_ref` une fois pour toutes — comme le projet « Administration
& finances » le fait déjà pour désigner le bon Pennylane.

**Pourquoi le réseau privé et pas l'URL publique.** `studio.oto.zone` est fermé par Cloudflare
Access, qui exige **deux** en-têtes ; le connecteur `http` d'oto n'en pose **qu'un** (vérifié
dans `providers/http.py`). Un agent ne peut donc pas franchir Access, quoi qu'on configure. Il
passe par `http://172.16.16.3:8100`, l'adresse privée d'otomata-0 — sans Cloudflare, sans
secret à faire tourner, comme le pont Movinmotion. Les humains gardent Access, les machines le
réseau privé.

**Le contrat est servi, pas écrit à la main** : `/openapi.json` est dérivé du registre de
gabarits, valeurs d'énumération comprises. Un gabarit ajouté s'y décrit tout seul — il n'y a
pas de documentation à tenir à jour en parallèle.
