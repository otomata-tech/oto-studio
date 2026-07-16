# Otomata — Design tokens & theme reference

Palette canonique partagée par les frontends Otomata (team-viewer, oto-web, oto-app, etc.). À importer depuis `@otomata/ui` via `src/theme.css` ou recopier dans le `style.css` du projet.

## Principe

**1 clair · 1 sombre · 1 primary · 3 couleurs sémantiques.** Tout le reste est dilution.

Esthétique : moderne analytique, chaud, solaire. Pas de cream/papier éditorial (trop newsprint). Pas de cool slate (trop tech-bro). Le voile jaune léger sur le fond identifie l'écosystème Otomata.

## Palette

### Neutres

| Token | Hex | Rôle |
|---|---|---|
| `--color-bg` | `#fefcf5` | Fond global — blanc lumineux, soupçon de jaune |
| `--color-surface` | `#ffffff` | Surface — zones de lecture, plus pur |
| `--color-paper-2` | `#f4ecd2` | Hover, alt rows, soft accent |
| `--color-paper-3` | `#ebe1ba` | Hover plus marqué |
| `--color-ink` | `#2c2112` | Encre — brun chaud profond, pas pur noir |
| `--color-ink-soft` | `#4a3a23` | Corps de texte secondaire |
| `--color-mute` | `#6c5e44` | Mute — métadonnées, eyebrows |
| `--color-faint` | `#a89a78` | Faint — désactivé, placeholder |
| `--color-hair` | `#dccfa8` | Hairlines / bordures |
| `--color-hair-soft` | `#ece1bd` | Hairlines secondaires |

### Couleur principale Otomata

| Token | Hex | Rôle |
|---|---|---|
| `--color-primary` | `#f0b41e` | Jaune-orangé saffran — accents, branding, CTA |
| `--color-primary-soft` | `#fbe7a8` | Fond doux primary (badges, surlignages) |
| `--color-primary-ink` | `#5a3b03` | Texte sur fond primary-soft |

### Sémantique — 3 couleurs vives

| Token | Hex | Rôle |
|---|---|---|
| `--color-strong-mid` | `#a8c926` | Vert chartreuse · success, ADKAR Acquis |
| `--color-strong-bg` | `#e6eec0` | Fond doux vert |
| `--color-strong-ink` | `#3e4c0c` | Texte sur fond vert doux |
| `--color-weak-mid` | `#e84b16` | Rouge vermillon · alerte, suppression, ADKAR Faible |
| `--color-weak-bg` | `#f7cdbb` | Fond doux rouge |
| `--color-weak-ink` | `#621b04` | Texte sur fond rouge doux |
| `--color-accent` | `#2a87d8` | Bleu cobalt · info, signal, lien |
| `--color-accent-soft` | `#c4dcf0` | Fond doux bleu |

À noter : `--color-primary` couvre aussi la sémantique "warning / partial" (jaune = caution). On garde une seule couleur pour ce rôle.

## Typographie

| Token | Police | Source |
|---|---|---|
| `--font-display` | Bricolage Grotesque (variable, axes opsz/wdth/wght) | Google Fonts |
| `--font-sans` | Hanken Grotesk (variable) | Google Fonts |
| `--font-mono` | JetBrains Mono | Google Fonts |

Lien Google Fonts unique :
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..800&family=Hanken+Grotesk:ital,wght@0,300..900;1,300..900&family=JetBrains+Mono:wght@400;500;700&display=swap">
```

### Échelle typographique

- **Display XL** (héro) : Bricolage Grotesque, 56–80px, wdth 90, opsz 96, weight 600, letter-spacing -0.025em, line-height 0.95
- **Display L** (titres section) : Bricolage Grotesque, 28–36px, weight 600
- **Body** : Hanken Grotesk, 14–15px, line-height 1.5–1.7
- **Eyebrow / kicker / mono** : JetBrains Mono, 10–11px, uppercase, letter-spacing 0.16em

## Texture & fond

Quadrillage très subtil, opacité ~2,5 % de l'encre :

```css
body {
  background-image:
    linear-gradient(to right, rgba(44, 33, 18, 0.025) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(44, 33, 18, 0.025) 1px, transparent 1px);
  background-size: 64px 64px;
  background-attachment: fixed;
}
```

## Layout & affordances

- **Pas de border-radius** par défaut (sauf cas spécifiques : badges arrondis seulement si justifié)
- **Hairlines partout** au lieu de cards à fond — fond unique, structure par lignes
- **Pas de shadow** sauf drawer / modal
- **Eyebrows mono uppercase** comme entête de section (vs h-tags lourds)
- **Mode édition always-on** : champs invisibles au repos, focus = soulignement (cf team-viewer)

## Utilisation

### En important `@otomata/ui` (recommandé)

```ts
// main.ts
import "@otomata/ui/src/theme.css";
```

Puis dans `style.css` du projet, juste `@import "tailwindcss";` — les tokens sont déjà chargés en `@theme`.

### En copiant les tokens

Copier le bloc `@theme { ... }` de `@otomata/ui/src/theme.css` directement dans le `style.css` du projet.

## Référence d'usage

Projets l'appliquant :
- `team-viewer` (`/data/projects/team-viewer/frontend`) — première implémentation complète, prends-le comme référence visuelle
