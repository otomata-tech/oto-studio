# brand — logos & charte Otomata / Oto

## 📍 Ce dossier est la source de vérité du design Otomata

**Pour toute question de charte — palette, typo, logos, tokens — c'est ici qu'on regarde, et ici qu'on met à jour.** Les autres emplacements (le monorepo `oto-websites`, le design-system du dashboard, le Drive `identite/`) en sont des **consommateurs** : ils appliquent la charte, ils ne la définissent pas.

Concrètement :
- une évolution de charte se fait **d'abord ici**, puis se propage aux consommateurs ;
- en cas de divergence entre ce dossier et un autre emplacement, **c'est ce dossier qui a raison** ;
- avant de recopier une charte trouvée ailleurs sur le disque ou sur le Drive, vérifier ici — plusieurs copies périmées circulent (voir l'avertissement sur le README du Drive, plus bas).

*(Historiquement l'inverse : ce dossier était un cache des repos d'origine. Inversé le 2026-08-12 — trop de copies divergentes, aucune ne faisant autorité.)*

**2026-08-27 — `oto-dashboard/design-system/` a été archivé, sa part de MARQUE est ici.** Décision :
le futur design system du produit sera celui du nouveau front, donc les 180 fichiers du design
system dashboard (maquettes d'écrans en JSX/HTML, UI kit, readme d'outillage) n'avaient plus de
raison d'être maintenus. Ce qui relève de la marque Otomata a été consolidé ici — tokens,
guidelines, composants de marque et explorations d'identité y étaient déjà à l'identique depuis le
12/08 ; s'y ajoutent ce jour le brief de direction artistique, les quatre maquettes d'exploration
et le point d'entrée des tokens. Le reste est supprimé d'`oto-dashboard` et vit dans son historique
git.

## Deux marques distinctes

| | **Otomata** (société) | **Oto** (produit / assistant) |
|---|---|---|
| Sites | otomata.tech | oto.ninja, oto.zone, dashboard |
| Couleur d'identité | **saffran `#f0b41e`** (le violet a été retiré le 2026-09-03) | **saffran `#f0b41e`** |
| Mark | **`otomata-mark.svg`** — disque saffran cerné d'encre, **ombre dure** en bas-droite et **anneau saffran décalé** en haut-gauche. Arrêté le **2026-09-03** ; avant : glyphe violet (éclair/zigzag), et plus tôt disque orange dégradé | **« open O »** — anneau ouvert, ouverture en haut-droite, caps arrondis (`OtoMark`, états breathe/think/talk) ; déclinaison 4-couleurs (oto.ninja) ; disque olive (oto.zone). **Inchangé** : l'open O reste le mark d'oto |

⚠️ Ne pas confondre : la **charte produit `@otomata/ui`** (fond crème + saffran, ci-dessous) est le socle commun.

**2026-09-03 — le mark Otomata est le disque saffran décalé, l'open O reste à oto.** Les deux
marques partagent le saffran et se distinguent par la forme : **disque plein** pour la société,
**anneau ouvert** pour le produit.

⚠️ **Les trois couches font partie du mark** — l'ombre dure (sans flou ni radius), le disque
cerné d'encre, l'anneau saffran décalé. Ce ne sont pas des effets d'affiche à ajouter au goût du
support : c'est le mark, et c'est cette version-là qui a été retenue contre le disque nu. Ordre
de dessin imposé : ombre, anneau, disque. *(Une version antérieure de ce README, le même jour,
affirmait le contraire — corrigé.)*

**Le mark complet tient jusqu'à 16 px** — vérifié en planche : l'ombre porte le relief, l'anneau
reste perceptible. C'est donc lui le favicon. `otomata-mark-compact.svg` (le disque cerné seul) ne
sert que là où le support **rogne en cercle** — un avatar LinkedIn, une pastille ronde : l'ombre et
l'anneau y tomberaient hors du visible. Ce n'est pas un second logo, c'est la version rognable.

**Le violet `#863bff` a disparu de la plateforme.** Il n'était déjà affiché nulle part —
`otomata-logo-violet.svg` n'était référencé par aucun site, et le `favicon.svg` violet qui traînait
dans `otomata.tech/public/` **comme** dans `mento.cc/public/` n'était déclaré par aucune des deux
pages. Les fichiers ont été supprimés le 2026-09-03, ici comme dans `oto-websites` et `slider/`.

`otomata.tech` sert désormais **un seul fichier**, `public/logo-otomata.svg` (le mark complet),
déclaré à la fois comme `rel="icon"` et comme `logo` du JSON-LD.

## Publiée en ligne

La charte est servie par le studio sur **`studio.oto.zone/brand`** — mark et déclinaisons,
palette lue dans `theme/theme.css`, typographie, fichiers d'impression du merch, tout
téléchargeable. C'est cette page qu'on donne à un tiers, plutôt qu'un PDF en pièce jointe.
Le code : `oto-studio/service/brand.mjs` + `service/web/brand.html`.

## Arborescence

### `charte/` — la charte formelle (document présentable)
- `charte-graphique.pdf` / `.html` — **charte graphique Otomata**, le document à envoyer à un tiers (presta, imprimeur, client). Aligné sur la palette `@otomata/ui`. Source : Drive `identite/`.
- `palette.svg` — planche de la palette

⚠️ **Le `README.md` qui accompagne la charte sur le Drive est périmé** : il décrit l'ancienne palette (orange `#E67E22`, bleu `#3498DB`, vert `#27AE60`, anthracite `#2C3E50`), abandonnée depuis. C'est `charte-graphique.html` (mai 2026) qui fait foi, et il utilise bien saffran/crème/encre. Ne pas appliquer le README du Drive.

### `slider/` — charte de slides Otomata
Charte maison pour le moteur [`otomata-tech/slider`](https://github.com/otomata-tech/slider) : `tokens.json` (palette reprise de `theme/theme.css`) + logos (**le mark Otomata et l'open O d'oto** ; le glyphe violet en est parti le 2026-09-03). Le moteur ignore `chartes/*` sauf son placeholder `blank`, donc la charte vit ici et s'y monte par lien symbolique — voir `slider/README.md`. Avant, aucune charte Otomata n'existait : tout deck sortant sous notre nom était re-charté à la main.

### `theme/` — charte canonique
- `THEME.md` / `theme.css` — **tokens de référence `@otomata/ui`** (palette + typo). Source : `oto-websites/packages/ui/`.
- `dashboard-tokens/` — tokens du design-system dashboard (colors/fonts/typography/spacing) + `styles.css`, le point d'entrée qui les `@import`. Source : `oto-dashboard/design-system/tokens/` + `styles.css`. ⚠️ **Depuis le 2026-08-27 ce n'est plus une copie mais l'ORIGINAL** : `oto-dashboard/design-system/` a été archivé (voir plus bas), et les tokens *vivants* du dashboard sont désormais son `frontend/src/assets/console.css`.

### `logos/otomata/` — marque société
**Quatre fichiers, pas un de plus** (nettoyé le 2026-09-03 : tout ce qui portait une identité
abandonnée est parti, l'historique git le garde) :
- `otomata-mark.svg` — **LE mark** : ombre dure + anneau saffran décalé + disque `#f0b41e` cerné d'encre `#2c2112`
- `otomata-mark-compact.svg` — le disque cerné seul, pour les surfaces **rognées en cercle** (avatar, pastille)
- `otomata-mark-mono-encre.svg` / `otomata-mark-mono-blanc.svg` — monochromes (fond clair / fond sombre) : l'ombre y disparaît, c'est le **vide** entre disque et anneau qui porte le décalage

Supprimés : `otomata-logo-violet.svg`, `otomata-mark-orange.svg`, `otomata-deck-disc.svg`,
`otomata-og.jpg`, `icon.svg`, `favicon.svg`. Aucun n'était référencé ailleurs que par ce README.

### `logos/oto/` — marque produit
- `oto-mark-4colors.svg` — mark 4 couleurs (oto.ninja) : safran/terracotta/olive/cobalt
- `oto-dashboard-mark.svg` — **« open O » saffran** (mark canonique, dashboard)
- `oto-mark-512.png` — mark rasterisé 512px
- `oto-zone-mark.svg` — disque olive (oto.zone)
- `oto-icons-sprite.svg` — sprite d'icônes des sites oto

### `photos/` — portraits de l'équipe
Les portraits publiés au nom d'Otomata (`alexis-laporte.jpg`, `sarah-soumahoro.jpg`, 1024×1024, fond bleu nuit commun) + leurs sources d'origine, et surtout **la procédure pour harmoniser un nouveau portrait** avec la série : `harmonise-portrait.py` (retouche du décor par modèle d'image — remplacement de fond, élargissement du cadre) et son mode d'emploi dans `photos/README.md`, dont les contrôles à faire avant publication. Servis en ligne depuis `oto-websites/sites/otomata.tech/public/equipe/`.

### `merch/` — les fichiers d'impression
`build-merch.mjs` produit onze PNG transparents dont le côté long fait 4000 px, **recadrés au
contenu** — une marge transparente se paierait en centimètres de visuel perdus à l'impression.
Trois poses (le mark et le nom en ligne pour la poitrine et le mug, empilés pour le dos et le
tote, l'un des deux seul), chacune en version claire, encre ou blanche. **Quel fichier prendre
dépend de la couleur du textile**, et c'est ce que dit `merch/README.md` : sur un vêtement jaune
le mark en couleur se noie, sur un vêtement foncé il perd son cerne. La table des pièces vit dans
`merch/pieces.mjs`, partagée avec le studio ; `build-planche.mjs` monte les mêmes fichiers sur des
silhouettes pour la planche qu'on montre avant de commander.

### `charte-doc/` — documentation
- `DESIGN-BRIEF.md` — **le *pourquoi* de la direction artistique** (« Manuscrit chaud », direction « 2a » : sidebar encre, cartes chaudes, rayons 8px/pill, Lucide, Familjen Grotesk + Spline Sans Mono). Ses §0-3 font autorité ; ses §4-8 inventorient le design system du dashboard de 2026 et sont de l'histoire.
- `guidelines/` — cartes HTML du design-system (brand-logo, brand-iconography, color-*, type-*, spacing-*)
- `brand-components/` — composants React de marque (`OtoMark`, `Medallion`, `Avatar`) + prompts
- `direction-exploration/direction-retenue.html` — la direction appliquée (« 2a »). Les pistes écartées, les comparatifs d'icônes et de polices et leurs captures ont été supprimés le 2026-09-03 : la direction est arrêtée, et le `DESIGN-BRIEF` en porte le pourquoi.

⚠️ **Ce dépôt est public : aucun nom de personne ne doit y entrer.** (Les maquettes d'exploration
qui portaient un utilisateur d'exemple nommé ont été supprimées le 2026-09-03.)

## Palette `@otomata/ui` (résumé)

**Neutres** — bg `#fefcf5` · surface `#ffffff` · encre `#2c2112` · mute `#6c5e44` · hairline `#dccfa8`
**Primary** (saffran) — `#f0b41e` · soft `#fbe7a8` · ink `#5a3b03`
**Sémantique** — vert chartreuse `#a8c926` (success) · rouge vermillon `#e84b16` (alerte) · bleu cobalt `#2a87d8` (info)

**Typo** — Bricolage Grotesque (display) · Hanken Grotesk (sans) · JetBrains Mono (mono). *(Fonts embarquées : `../fonts.css`.)*

Esthétique : moderne analytique, chaud, solaire. Voile jaune léger sur le fond = signature de l'écosystème.

## Consommateurs (où la charte est appliquée)

Ces emplacements **implémentent** la charte définie ici. Une évolution part d'ici et se propage vers eux ; l'inverse — recopier depuis un consommateur — est ce qui a produit les divergences constatées.

| Consommateur | Ce qu'il applique | Correspond ici à |
|---|---|---|
| `oto-websites/packages/ui/` | tokens `@otomata/ui` (`THEME.md`, `src/theme.css`), consommés en `"*"` local par `web/`, `extension/` et les `sites/*` | `theme/` |
| `oto-dashboard/frontend/src/assets/console.css` | les tokens dashboard *vivants* (`:root`), consommés en `var(--…)` par les vues console | `theme/dashboard-tokens/` |
| Drive `otomata-shared/identite/` | la charte formelle diffusée aux tiers | `charte/` |
| `oto-websites/sites/*/public/`, `oto-cli/logo.svg` | logos en production | `logos/` |
| `otomata-tech/slider/chartes/` | chartes de slides — **ne contient que `blank`, aucune charte Otomata à ce jour** | — |

Vérifier la dérive — **sur les valeurs**, au 2026-08-27 : aucune.

```bash
diff -q brand/theme/theme.css /data/oto/oto-websites/packages/ui/src/theme.css
```

⚠️ **Le second `diff` d'avant le 2026-08-27 n'a plus de cible** : il comparait
`theme/dashboard-tokens/` à `oto-dashboard/design-system/tokens/`, dossier supprimé. Les tokens
dashboard n'ont plus de miroir mécanique — leur vie est dans `console.css`, et une évolution de
charte s'y porte à la main depuis ici.

⚠️ **Ne pas comparer les `THEME.md`** : la copie d'`oto-websites` porte en tête un encart « source de vérité = oto-studio/brand » que l'original n'a pas — ils divergent donc d'un bloc, volontairement. Ce sont `theme.css` et les tokens qui portent les valeurs, et eux doivent rester strictement identiques.
