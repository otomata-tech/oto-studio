# merch — les fichiers d'impression

```bash
node brand/merch/build-merch.mjs      # → brand/merch/print/otomata-<pièce>.png (à commiter)
```

Huit fichiers, tous en **PNG transparent**, côté long **4000 px**, dans `print/`.

⚠️ **Ils sont versionnés, et c'est délibéré.** Un fichier d'impression ne change jamais : le
faire fabriquer à la demande par la box coûte 16 Mpx par image, là où le service est calibré
pour du 1200×1500 (1,8 Mpx) — un travail lourd, répété, pour un résultat identique. Le poste
les génère (deux secondes), git les transporte, le studio les sert tels quels sur **`/brand`**.
1,5 Mo au total pour huit fichiers.

*(Rectification : une version de ce paragraphe attribuait à ces rendus une panne SSH de la box
le 2026-09-03. C'était faux — le jeton Cloudflare Access du tunnel avait expiré, la box n'a
jamais été en cause. La raison de versionner tient sans cet argument.)*

*(Les anciens designs — `tshirt-design`, `tshirt-otomata` et leurs planches — ont été supprimés
le 2026-09-03 : ils étaient sur la palette anthracite `#2c3e50` abandonnée en mai 2026 et
portaient un mark qui n'existe plus. L'historique git les garde.)*

## Choisir le fichier : c'est la couleur du textile qui décide

| Textile | Le mark seul | Mark + nom | Le nom seul |
|---|---|---|---|
| **clair** — blanc, crème, gris clair | `otomata-mark-couleur.png` | `otomata-otomata-couleur.png` | `otomata-mot-couleur.png` |
| **saffran ou jaune** — le hoodie jaune citron | `otomata-mark-encre.png` | `otomata-otomata-encre.png` | — |
| **foncé** — noir, encre, marine | `otomata-mark-blanc.png` | `otomata-otomata-blanc.png` | `otomata-mot-blanc.png` |

⚠️ **Sur un textile jaune, le mark en couleur se noie** : son disque saffran et le fond se
confondent, il ne reste que le cerne. C'est pour ça que la version encre existe — pas par goût.

⚠️ **Sur un textile foncé, la version couleur perd son cerne et son ombre**, qui sont en encre.
La version blanche garde le décalage parce que c'est le **vide** entre le disque et l'anneau qui
le porte, pas une seconde couleur.

## Ce que Spreadshirt attend

- **PNG** — c'est le seul format qu'ils acceptent avec un fond transparent, et un fichier
  d'impression sans transparence pose un rectangle blanc sur le vêtement.
- **200 dpi**, résolution maximale **4000 × 4000 px**, fichier **≤ 10 Mo**. Nos fichiers font
  0,1 à 0,3 Mo : la marge est confortable.
- Viser 4000 px sur le côté long permet d'agrandir le visuel sur n'importe quelle zone
  d'impression sans reperdre en qualité.

⚠️ **Vérifié le 2026-09-03 sur deux sources concordantes, mais PAS à la source** : le centre
d'aide de Spreadshirt refuse l'accès automatisé (403, puis page vide). **Les dimensions de la
zone d'impression en cm ne sont donc pas confirmées ici** — elles varient par produit et par
coupe, et leur outil les affiche au moment du téléversement. S'y fier, pas à une cote recopiée.

## Ce qui a déjà été commandé (avril 2026)

Mug contrasté blanc/jaune · autocollant blanc mat 10 × 10 cm · sweat à capuche unisexe **jaune
citron**. D'où l'importance de la colonne « saffran ou jaune » ci-dessus : le hoodie est
exactement le cas où le mark en couleur ne tient pas.

## Ajouter une pièce

Une entrée dans `PIECES` (`build-merch.mjs`) : son format, quel SVG de `brand/logos/otomata/`
elle prend, si elle porte le nom, et **sur quel textile elle va**. Les marks ne sont jamais
recopiés ici — ils sont lus dans `brand/logos/otomata/`, qui fait autorité.
