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

### La page `/brand` — la charte, en accès PUBLIC

`GET /brand` : le mark et ses déclinaisons, la palette, la typographie, les fichiers d'impression
du merch. Tout y est téléchargeable. C'est la page qu'on donne à un imprimeur, un presta ou un
partenaire — elle remplace l'envoi d'un PDF de charte par pièce jointe.

- `GET /brand/api` — le même en JSON.
- `GET /brand/logo/<variante>.svg` et `-<taille>.png` — le mark, servi depuis `brand/logos/otomata/`.
- `GET /brand/merch/<pièce>.png` — un fichier d'impression, **servi tel quel** depuis `brand/merch/print/`.
- `GET /brand/photo/<slug>.jpg` — un portrait publié de l'équipe (liste fermée ; `photos/sources/` reste privé).

**Un seul préfixe, et c'est le point** : une politique Cloudflare Access en **bypass** sur
`studio.oto.zone/brand` ouvre la charte au public en laissant le reste du studio fermé — le
générateur, les rendus, la galerie, l'API. Poser le bypass sur autre chose que ce préfixe
ouvrirait le pilote de rendu.

⚠️ **Le merch n'est PAS rendu à la demande.** Un PNG de 4000×4000 fait 16 Mpx, contre 1,8 pour
un visuel de post : c'est neuf fois le travail pour lequel le service est dimensionné, et le
résultat ne change jamais. Les fichiers d'impression sont donc **générés sur le poste et
versionnés** dans `brand/merch/print/`. Restent rendus à la demande les seuls PNG de logo,
plafonnés à 1024 px (1 Mpx), sur une liste fermée de tailles — une taille hors liste répond 404
sans rien fabriquer.

*(Le 2026-09-03, une panne de SSH survenue pendant un préchauffage a d'abord été mise sur le dos
de ces rendus. À tort : le jeton Cloudflare Access du tunnel avait expiré — `~/.cloudflared/`
n'avait plus que le `.lock`. Se méfier de « la box souffre » quand le symptôme est un timeout au
banner exchange : c'est le signe d'un ProxyCommand qui attend une authentification, pas d'une
machine chargée.)*

La palette et la typo sont **lues dans `brand/theme/theme.css`**, pas recopiées : la page publique
dit forcément la même chose que les tokens que les sites importent.

### La page `/kit` — les visuels fixes de la marque

L'IHM de la racine est un **générateur** : on remplit, on rend, et le rendu part dans une
galerie purgée au-delà des 60 derniers travaux. Un logo de page LinkedIn n'a rien à y faire —
il ne se remplit pas, il ne change pas, et il doit rester à la même adresse. D'où `/kit` :

- `GET /kit` — la page : un visuel par emplacement LinkedIn, sa cote livrée, son PNG à télécharger.
- `GET /api/kit` — le même en JSON (formats, cotes, URL, ce qui est déjà en cache).
- `GET /kit/<format>.png` — le visuel plein format ; `-apercu.png` sa version réduite (900 px).
- `GET /kit/logo/<variante>.svg` — le mark, servi **depuis `brand/`** (pas de copie) : `mark`, `compact`, `mono-encre`, `mono-blanc`.
- `GET /kit/logo/<variante>-<taille>.png` — le même rastérisé et **transparent**, aux tailles déclarées dans `LOGOS` (une taille hors liste est refusée en 404 plutôt que rendue au hasard).
- `GET /kit/diapo/<1-5>.png` — les cinq images du **diaporama de profil** (option Premium ; `-apercu.png` idem).

Le kit rend **à la demande au premier accès** (quelques secondes par format, sérialisées par
la file du moteur), puis sert depuis `out/kit/`. Les fichiers portent une **empreinte des
sources** (dessin + table des formats + données) : la charte change → l'empreinte change → les
visuels se refont seuls, sans purge à faire à la main. Les données sont l'`example` du gabarit
`kit-identite` : une seule source, sinon la page du kit et le formulaire montreraient deux
identités qui divergent en silence.

⚠️ **`out/` est gitignoré** : sur la box, le cache est vide après un déploiement, et c'est le
premier visiteur qui paie le rendu. C'est voulu — un binaire généré n'a pas à vivre dans le
dépôt — mais ça veut dire qu'il ne faut pas s'étonner du délai au premier chargement après
chaque `git pull`.

Le favicon (`service/web/favicon.svg`) est **le mark complet** : vérifié à 16 px, l'ombre porte le
relief et l'anneau reste perceptible. La variante compacte ne sert qu'aux surfaces **rognées en
cercle** (l'avatar du kit), où l'ombre et l'anneau tomberaient hors du visible.

⚠️ **Un PNG de logo doit être transparent**, sinon il n'est posable que sur du blanc. D'où l'option
`transparent` du moteur (`Emulation.setDefaultBackgroundColorOverride`) — et **elle vit sur la
session Chrome, pas sur le rendu** : `render.mjs` la remet à zéro à la fin, faute de quoi les
visuels suivants sortiraient troués. Vérifié par un test qui rend un visuel juste après un logo.

⚠️ **Le diaporama est une option Premium du PROFIL personnel** (5 images, 1584×396, PNG, 8 Mo
chacune), pas de la page entreprise — qui garde sa couverture unique en 4200×700. Les cinq
défilent en boucle : chacune tient seule et répète l'adresse, personne n'attend l'image suivante.

### Les gabarits

Un gabarit = une entrée dans `service/templates.mjs` (manifeste de champs + construction
de l'HTML) et un fichier de dessin. **Rien n'est découvert dynamiquement** : un gabarit
qu'on ne sait pas décrire en champs n'entre pas dans le studio. En contrepartie, l'ajouter
suffit — il apparaît seul dans le formulaire, dans `/openapi.json`, et donc chez les agents,
sans une ligne de front ni de documentation à écrire à côté.

| gabarit | format | ce qu'il porte |
|---|---|---|
| `carte-cas-usage` | 1080×1080 | une demande en langage courant, les outils qu'oto enchaîne, le résultat |
| `affiche-recul` | 1200×1500 | le pattern validé : la scène occupe tout, puis **recule** pour laisser monter la chute |
| `kit-identite` | 6 formats | la carte de visite de la marque : post 4:5, carré, aperçu de lien, couvertures de profil et de page, avatar |
| `banniere` | 1584×396 | une couverture, ou l'une des cinq images du diaporama Premium : un mark, une phrase, une adresse |

**Un gabarit peut porter plusieurs tailles.** `kit-identite` déclare `sizes` (valeur du
champ → `{width, height, scale}`) et `size_field` (le champ enum qui choisit) ; le serveur rend
`sizes[data[size_field]]` plutôt que `size`, `/openapi.json` annonce la table entière, et l'IHM
met son cadre d'aperçu au bon ratio. `size` reste la taille de référence, celle qu'on montre
quand aucun format n'est encore choisi. Sans ce mécanisme, demander une couverture de page
rendait un 4:5 — silencieusement.

⚠️ **La table des formats du kit vit dans `posts/identite-formats.mjs`**, importée à la fois
par le gabarit et par le build local (`posts/build-kit.mjs`). Une seconde copie ici et les deux
dériveraient : le studio livrerait des cotes fausses sans que rien n'échoue.

⚠️ **Les titres dépendent de Google Fonts au moment du rendu.** `assets/fonts.css` n'embarque
que Familjen Grotesk et JetBrains Mono ; Bricolage Grotesque et Hanken Grotesk arrivent par le
`<link>` en tête du fragment. Un rendu sans réseau sortant sort donc avec une fonte de
substitution — vrai pour `affiche-recul` comme pour `kit-identite`.

Trois pièges rencontrés en écrivant le second, à connaître avant d'en écrire un troisième :

- **L'image fixe n'est pas la dernière image.** Une animation qui finit par un fondu ne
  rend que le fond si on capture la fin. Le gabarit désigne son instant : `window.__STILL`.
- **`let top` au niveau global casse tout le script** — collision avec `window.top`, et la
  page sort vide sans erreur au rendu. Vaut pour `name`, `length`, `status`, `self`.
- **La durée dépend du texte** quand il est frappé. Elle se borne en accélérant la frappe,
  jamais en coupant du texte (12 s pour trois cartes, 16,5 s pour quatre cartes pleines).
