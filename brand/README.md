# brand — logos & charte Otomata / Oto

## 📍 Ce dossier est la source de vérité du design Otomata

**Pour toute question de charte — palette, typo, logos, tokens — c'est ici qu'on regarde, et ici qu'on met à jour.** Les autres emplacements (le monorepo `oto-websites`, le design-system du dashboard, le Drive `identite/`) en sont des **consommateurs** : ils appliquent la charte, ils ne la définissent pas.

Concrètement :
- une évolution de charte se fait **d'abord ici**, puis se propage aux consommateurs ;
- en cas de divergence entre ce dossier et un autre emplacement, **c'est ce dossier qui a raison** ;
- avant de recopier une charte trouvée ailleurs sur le disque ou sur le Drive, vérifier ici — plusieurs copies périmées circulent (voir l'avertissement sur le README du Drive, plus bas).

*(Historiquement l'inverse : ce dossier était un cache des repos d'origine. Inversé le 2026-08-12 — trop de copies divergentes, aucune ne faisant autorité.)*

## Deux marques distinctes

| | **Otomata** (société) | **Oto** (produit / assistant) |
|---|---|---|
| Sites | otomata.tech | oto.ninja, oto.zone, dashboard |
| Couleur d'identité | **violet `#863bff`** | **saffran `#f0b41e`** |
| Mark | glyphe violet (flèche/zigzag) ; ancien = disque orange dégradé | **« open O »** — anneau ouvert, ouverture en haut-droite, caps arrondis (`OtoMark`, états breathe/think/talk) ; déclinaison 4-couleurs (oto.ninja) ; disque olive (oto.zone) |

⚠️ Ne pas confondre : la **charte produit `@otomata/ui`** (fond crème + saffran, ci-dessous) est le socle commun ; le **violet** est propre à l'identité corporate otomata.tech.

## Arborescence

### `charte/` — la charte formelle (document présentable)
- `charte-graphique.pdf` / `.html` — **charte graphique Otomata**, le document à envoyer à un tiers (presta, imprimeur, client). Aligné sur la palette `@otomata/ui`. Source : Drive `identite/`.
- `palette.svg` — planche de la palette

⚠️ **Le `README.md` qui accompagne la charte sur le Drive est périmé** : il décrit l'ancienne palette (orange `#E67E22`, bleu `#3498DB`, vert `#27AE60`, anthracite `#2C3E50`), abandonnée depuis. C'est `charte-graphique.html` (mai 2026) qui fait foi, et il utilise bien saffran/crème/encre. Ne pas appliquer le README du Drive.

### `slider/` — charte de slides Otomata
Charte maison pour le moteur [`otomata-tech/slider`](https://github.com/otomata-tech/slider) : `tokens.json` (palette reprise de `theme/theme.css`) + logos. Le moteur ignore `chartes/*` sauf son placeholder `blank`, donc la charte vit ici et s'y monte par lien symbolique — voir `slider/README.md`. Avant, aucune charte Otomata n'existait : tout deck sortant sous notre nom était re-charté à la main.

### `theme/` — charte canonique
- `THEME.md` / `theme.css` — **tokens de référence `@otomata/ui`** (palette + typo). Source : `oto-websites/packages/ui/`.
- `dashboard-tokens/` — tokens du design-system dashboard (colors/fonts/typography/spacing). Source : `oto-dashboard/design-system/tokens/`.

### `logos/otomata/` — marque société
- `otomata-logo-violet.svg` — logo actuel otomata.tech (violet `#863bff`)
- `otomata-mark-orange.svg` — mark disque saffran/orange (favicon secondaire)
- `otomata-deck-disc.svg` — disque dégradé jaune→orange (deck)
- `otomata-og.jpg` — image Open Graph
- `icon.svg` / `favicon.svg` — icône et favicon de l'identité documentaire (Drive)

### `logos/oto/` — marque produit
- `oto-mark-4colors.svg` — mark 4 couleurs (oto.ninja) : safran/terracotta/olive/cobalt
- `oto-dashboard-mark.svg` — **« open O » saffran** (mark canonique, dashboard)
- `oto-mark-512.png` — mark rasterisé 512px
- `oto-zone-mark.svg` — disque olive (oto.zone)
- `oto-cli-flower-legacy.svg` — ancienne fleur or (oto CLI) — *legacy*
- `oto-icons-sprite.svg` — sprite d'icônes des sites oto

### `charte-doc/` — documentation
- `guidelines/` — cartes HTML du design-system (brand-logo, brand-iconography, color-*, type-*, spacing-*)
- `brand-components/` — composants React de marque (`OtoMark`, `Medallion`, `Avatar`) + prompts
- `marques-exploration/` — explorations d'identité (`marques-proposition/v2/v3/v4`)
- `screenshots/` — aperçus (polices, icônes, directions)

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
| `oto-dashboard/design-system/` | tokens dashboard, guidelines, composants de marque | `theme/dashboard-tokens/`, `charte-doc/` |
| Drive `otomata-shared/identite/` | la charte formelle diffusée aux tiers | `charte/` |
| `oto-websites/sites/*/public/`, `oto-cli/logo.svg` | logos en production | `logos/` |
| `otomata-tech/slider/chartes/` | chartes de slides — **ne contient que `blank`, aucune charte Otomata à ce jour** | — |

Vérifier la dérive — **sur les valeurs**, au 2026-08-12 : aucune.

```bash
diff -q  brand/theme/theme.css  /data/oto/oto-websites/packages/ui/src/theme.css
diff -rq brand/theme/dashboard-tokens/ /data/oto/oto-dashboard/design-system/tokens/
```

⚠️ **Ne pas comparer les `THEME.md`** : la copie d'`oto-websites` porte en tête un encart « source de vérité = oto-studio/brand » que l'original n'a pas — ils divergent donc d'un bloc, volontairement. Ce sont `theme.css` et les tokens qui portent les valeurs, et eux doivent rester strictement identiques.
