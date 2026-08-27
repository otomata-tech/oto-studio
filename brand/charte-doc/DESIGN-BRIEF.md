> **Rapatrié ici le 2026-08-27** depuis `oto-dashboard/design-system/DESIGN-BRIEF.md`, archivé
> le même jour : le futur design system du produit sera celui du nouveau front, mais la
> **direction artistique** décrite ici — palette « Manuscrit chaud », rayons, iconographie,
> tokens — est de la **marque Otomata** et reste valide. Elle est appliquée par le dashboard
> actuel tant qu'il vit.
>
> Lire en deux temps : les **§0 à §3** portent l'identité (intention, direction « 2a »,
> iconographie, fondations) — c'est ce qui fait autorité ici. Les **§4 à §8** (inventaire de
> composants, UI kit, plan d'exécution) décrivent le design system du dashboard de 2026 et sont
> **de l'histoire** : les composants et le kit qu'ils inventorient ont été supprimés avec
> `design-system/`, l'historique git d'`oto-dashboard` les conserve.

---

# Oto Design System — Brief de refonte (« le prompt parfait »)

> Ce document est la référence unique de la refonte. Il encode la direction
> artistique validée, les règles non-négociables, l'inventaire complet et le
> standard de qualité. Toute décision d'implémentation s'y réfère.

---

## 0. Intention

Faire du design system d'**Oto** — plateforme open-source d'automatisation B2B
pilotée par des agents (console `dashboard.oto.ninja`, backend MCP) — un système
**chaleureux, très lisible, moderne et artisanal**. On doit sentir la réflexion et
le soin : chaque token, chaque composant, chaque écran est pensé et s'assemble
parfaitement. **Zéro fioriture** : rien de décoratif qui ne serve la lecture ou
l'action. La cohérence prime sur l'effet.

Mantra : *chaud, net, contrasté, sans bavure.*

---

## 1. Direction artistique validée (« 2a »)

**Contraste chaud — sidebar encre, cartes douces, rayons disciplinés.**

- **Fort contraste structurel.** La barre latérale est **encre foncée** (`#2c2112`)
  avec texte crème ; le contenu est clair (crème `#fefcf5` + cartes blanches). Ce
  duo sombre/clair est le geste d'identité et règle le manque de contraste de la V1.
- **Cartes chaudes, jamais de bord noir.** Une carte se détache par un **filet crème
  doux** (`#ede1bd`) + une **ombre chaude discrète**, posée sur le fond crème — pas
  par une bordure sombre. Blanc sur crème = séparation nette et douce à la fois.
- **Palette « Manuscrit chaud » conservée** : crème + encre brune + 4 confettis
  sémantiques (saffron / terra / olive / cobalt). Un sens = une couleur, jamais déco.
- **Signature** : l'italique Familjen Grotesk (médaillon « o », squiggle saffron sur
  un mot d'un état vide) — avec parcimonie.

### Règle des rayons (STRICTE — la V1 avait des valeurs « entre-deux » bâtardes)

Trois valeurs, **jamais rien entre les deux** :

| Rayon | Valeur | Usage |
|---|---|---|
| `--radius-xs` | **6px** | kbd, mini-chips, boutons internes d'un segmented, petits jetons |
| `--radius-md` | **8px** | inputs, **cartes**, stats, wells, menus, dialogs, piste de segmented, dropzone |
| `--radius-pill` | **999px** | **TOUS les boutons** (primaire, ghost, mini, oauth), tags, dots, avatars, org-pill |

**Point de vigilance explicite du client** : *tous* les boutons sont en pill, y
compris les secondaires/mini et « continuer avec Google ». Aucun bouton en 8px.
Un `<Button>` quelle que soit sa taille = pill. Les seuls éléments « bouton-like »
non-pill sont les onglets d'un segmented (jetons 6px dans une piste 8px).

---

## 2. Iconographie — Lucide

- **Lucide** est la librairie officielle (déjà dans `package.json` / `components.json`).
  On remplace le set dessiné à la main par Lucide : moderne, cohérent, trait rond.
- Le composant `Icon` **inline le path data Lucide** d'un set curé (~36 glyphes
  réellement utilisés par Oto) → auto-porté, exact, sans dépendance CDN.
- Trait **1.75**, grille 24, `currentColor`, bouts ronds. Taille par défaut 16.
- Jamais d'emoji, jamais d'SVG dessiné à la main. Flèche mono `→` = affordance texte.

---

## 3. Fondations (tokens)

**Couleurs** — neutres crème/encre + 4 accents (chaque accent : base / `-soft` fill /
`-ink` texte). Ajouts sémantiques clés :
- Surfaces sidebar foncée : `--sidebar-bg`, `--sidebar-fg`, `--sidebar-fg-strong`,
  `--sidebar-fg-mute`, `--sidebar-hair`, `--sidebar-active-bg`, `--sidebar-active-fg`.
- Surfaces contenu : `--surface-app` (crème), `--surface-card` (blanc),
  `--surface-sunken` (`paper-2`, pour wells/champs copiables), `--border-card` (filet
  carte doux `#ede1bd`), `--border-hair`, `--focus-ring` (saffron).

**Type** — Familjen Grotesk (lecture + UI), Spline Sans Mono (voix technique : eyebrows,
labels de groupe, en-têtes de table, codes, compteurs — UPPERCASE tracké 0.14–0.18em).
Titres serrés (−0.01 à −0.03em, 700). Corps 13.5px dense. Italique = signature.

**Élévation** — le système repose sur les filets + une ombre chaude, presque pas de
profondeur :
- `--shadow-card` : ombre chaude douce au repos qui détache la carte du crème.
- `--shadow-pop` : menus / dialogs / dropdowns.
- `--shadow-drawer` : tiroir mobile.
Pas d'ombre interne, pas de glow.

**Motion** — rapide, eased-out : `--t-fast: 180ms` + `cubic-bezier(.22,1,.36,1)`.
Entrée de vue `fadein` 220ms. Respecte `prefers-reduced-motion`. Pas de rebond, pas
de boucle décorative infinie sur du contenu.

**Espacement / densité** — `--pad-card` 18px (dense 13), `--row-py` 9px (dense 6),
`--gap-stack` 16px, `--sb-w` 232px, contenu ancré à gauche max 1440 (680 « narrow »).

---

## 4. Inventaire des composants (complet, basé sur `components/console/` du repo)

Objectif : couvrir **tout** ce qu'il faut pour poser n'importe quel écran d'Oto sans
réinventer. Groupes :

**brand/** — `OtoMark` (marque vivante), `Medallion` (« o » saffron), `Avatar`.

**core/** — `Button` (primary · ghost · mini · danger · link, **tous pill**), `Icon`
(Lucide), `Kbd`, `IconButton` (bouton carré icône seule, pill).

**layout/** — `Shell` (grille sidebar+main), `Sidebar` (+ `SidebarItem`,
`SidebarGroup`), `Topbar`, `Identity` (bloc org/équipe), `OrgPill`, `UserMenu`,
`PageHeader` (eyebrow + titre + actions), `Content` (`content-inner` / narrow).

**forms/** — `Input` (text/mono), `Textarea` / `DoctrineEditor`, `Select`, `Checkbox`,
`Radio`, `Switch`, `Field` (label + aide + erreur), `Seg` (segmented), `CopyField`,
`Dropzone` (upload).

**overlays/** — `Dialog` (modal + `NameDialog`/prompt), `Menu` (dropdown),
`Tooltip`, `Toast` (+ host).

**data/** — `Card`, `Stat` (+ sparkline), `Quota`, `Tag`, `Dot`, `Table` (`tbl` +
tri + `ColumnFilter`), `Tabs`, `DayBars` (histogramme d'activité), `Skeleton`
(`sk` / `sk-card`), `StateEmpty`, `StateError`, `CheckStep`, `Squiggle`.

Toute addition hors-repo est listée dans le README sous « Intentional additions »
avec sa justification (ex. `IconButton`, `Field` — wrappers ergonomiques).

---

## 5. UI kit (recréations d'écrans réels)

Console `dashboard.oto.ninja`, direction 2a, Lucide, en composants du DS :
- **Auth** : `login` + `signup` (split : panneau encre + formulaire clair, bouton pill).
- **Overview** : status/activity, KPIs, connector health, MCP endpoint, next-step.
- **Connectors** : catalogue filtrable, états clé/session, drawer d'ajout.
- **Organization** : membres & secrets partagés, rôles.
- **Data** : datastore tabulaire (Table + filtres colonnes).

Chaque écran rend explicitement **empty / error / loading** (convention repo, pas de
fallback silencieux).

---

## 6. Cartes du Design System (onglet)

Fondations en petites cartes (~700×≤400) : neutres, accents, tags-en-usage, **surface
sidebar foncée**, Familjen, Spline Sans Mono, **rayons (8/pill)**, **élévation**,
densité, marque/favicon, **iconographie Lucide**. Une carte par groupe de composants,
dense et scannable (états + variantes, pas un rendu par défaut).

---

## 7. Standard de qualité (la barre)

1. **Cohérence absolue** : mêmes tokens partout, aucun rayon/ombre/espacement hors
   système. Un composant ne réinvente jamais un autre (le kit compose les primitives).
2. **Contraste & lisibilité** vérifiés : texte encre sur crème/blanc ; sidebar encre
   avec crème ; états actifs francs.
3. **Rien de décoratif** : chaque élément sert la lecture ou l'action.
4. **Tout fonctionne ensemble** : un écran assemblé de A à Z avec les composants doit
   être indiscernable d'un rendu produit soigné.
5. **Direct-editable & propre** : HTML canonique, styles inline cohérents avec les
   tokens, pas de valeurs magiques.
6. **`check_design_system` sans issue** ; vérif visuelle de chaque surface.

---

## 8. Plan d'exécution (petit à petit)

1. **Fondations** — tokens (couleurs + sidebar/surfaces, rayons 6/8/pill, élévation,
   motion). `styles.css` à jour.
2. **Iconographie** — `Icon` (Lucide inline) + `IconButton` + carte icônes.
3. **Refonte core** — `Button` (tout pill), `Kbd`, radii de `Card`/`Stat`/`Input`/
   `Seg`/`CopyField` alignés + `--shadow-card`.
4. **Layout** — `Shell`/`Sidebar`/`Topbar`/`Identity`/`OrgPill`/`UserMenu`/`PageHeader`.
5. **Forms** — `Field`/`Select`/`Checkbox`/`Radio`/`Switch`/`Textarea`/`Dropzone`.
6. **Overlays** — `Dialog`/`Menu`/`Tooltip`/`Toast`.
7. **Data** — `Table`(+filtres)/`Tabs`/`DayBars`/`Skeleton`/`StateError`.
8. **UI kit** — refonte 2a + `login`/`signup` + `connectors`/`organization`/`data`.
9. **Cartes fondations** mises à jour + nouvelles (sidebar, élévation, rayons, Lucide).
10. **Passe finale d'orfèvrerie** — cohérence, détails, micro-états, README + SKILL.
11. **Validation** — `check_design_system` + vérif visuelle.
