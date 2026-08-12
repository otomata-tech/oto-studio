# brand — logos & charte Otomata / Oto

Assets de marque rapatriés ici pour le studio de com (cartes cas d'usage LinkedIn).
**Source de vérité = les repos d'origine** (listés ci-dessous) ; cette copie est un cache pratique, à re-synchroniser si la charte évolue.

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

## Provenance (pour re-sync)

| Ici | Origine |
|---|---|
| `charte/` | Drive `otomata-shared/identite/` (`charte-graphique.*`, `colors/palette.svg`) |
| `theme/THEME.md`, `theme.css` | `oto-websites/packages/ui/` |
| `theme/dashboard-tokens/` | `oto-dashboard/design-system/tokens/` |
| `charte-doc/` | `oto-dashboard/design-system/{guidelines,components/brand,marques-*.html,screenshots}` |
| `logos/otomata/` | `oto-websites/sites/otomata.tech/public/`, `otomata-deck/assets/` |
| `logos/oto/` | `oto-websites/{web,sites/oto.zone}/public/`, `oto-dashboard/design-system/assets/`, `oto-cli/logo.svg` |
