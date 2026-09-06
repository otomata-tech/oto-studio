# photos — portraits de l'équipe

Les portraits publiés au nom d'Otomata, et **la procédure pour en harmoniser un
nouveau** avec les précédents. Deux photos prises dans deux studios différents ne
forment pas une série : fonds différents, lumières différentes, cadrages
différents. C'est ce que cette procédure répare.

| Fichier | Qui | Publié |
|---|---|---|
| `alexis-laporte.jpg` | Alexis Laporte, président | `https://otomata.tech/equipe/alexis-laporte.jpg` |
| `sarah-soumahoro.jpg` | Sarah Soumahoro, RAF | `https://otomata.tech/equipe/sarah-soumahoro.jpg` |
| `sources/` | les photos d'origine, avant harmonisation | — |

1024 × 1024, JPEG qualité 90, fond bleu nuit commun, cadrage tête-épaules.
Servis à la racine du site depuis `oto-websites/sites/otomata.tech/public/equipe/`,
copie de diffusion sur le Drive `otomata-shared/identite/photos/`.

⚠️ `https://otomata.tech/photo.jpg` sert **l'ancienne** photo d'Alexis (2026-06,
cadrage serré). Adresse publique déjà en circulation dans des signatures : on ne
la casse pas, on ne la met pas à jour non plus.

## Harmoniser un nouveau portrait

Le décor est refait par un modèle d'image (Gemini), pas au découpage : un
détourage par seuillage donne un bord en escalier et une lumière qui ne colle
pas au reste de la série — essayé le 2026-09-01, jeté le jour même.

```bash
PY=~/.local/share/pipx/venvs/oto-cli/bin/python   # l'interpréteur qui porte oto.config

# 0. reculer d'un cran quand le cadrage est trop serré et qu'AUCUN portrait de la série
#    n'est plus large — outpaint a besoin d'une cible, `recul` n'en a pas besoin
$PY harmonise-portrait.py recul \
    --photo /tmp/portrait.png \
    --out /tmp/portrait-recule.png

# 1. le nouveau venu prend le fond et la lumière d'un portrait déjà publié
$PY harmonise-portrait.py backdrop \
    --photo sources/nouveau-source.png \
    --reference alexis-laporte.jpg \
    --out /tmp/nouveau.png

# 2. si son cadrage est plus serré que la série, on ÉLARGIT au lieu de recadrer
$PY harmonise-portrait.py outpaint \
    --photo sources/nouveau-source.png \
    --reference sarah-soumahoro.jpg \
    --out /tmp/nouveau.png

# 3. export web
python3 -c "from PIL import Image; Image.open('/tmp/nouveau.png').convert('RGB').save('nouveau.jpg', quality=90, optimize=True, progressive=True)"
```

Le script lit `GEMINI_API_KEY` dans le coffre et ne l'affiche jamais. Il écrit un
PNG quand Pillow manque à l'interpréteur — d'où l'étape 3 séparée.

### Élargir plutôt que recadrer

Le réflexe est de recadrer la photo la plus large pour rejoindre la plus serrée.
C'est le mauvais sens : on y perd de la définition, et la photo la plus serrée ne
peut de toute façon pas être desserrée. Le mode `outpaint` fait l'inverse — il
prolonge le décor, les épaules et le vêtement de la photo trop serrée. C'est ce
qui a permis de rapprocher les cadrages d'Alexis (visage plein cadre) et de
Sarah (plan buste) sans dégrader ni l'un ni l'autre.

⚠️ **`outpaint` n'étendait pas vers le BAS** — son prompt ne demandait du décor
qu'au-dessus de la tête et sur les côtés. Un portrait coupé sous les épaules ne
pouvait donc pas gagner de buste, quel que soit le nombre de passes. Corrigé le
2026-09-06 : le prompt réclame maintenant explicitement le torse sous les épaules.
Si un cadrage vous paraît « manquer un peu en bas » après un outpaint, c'était ça.

**`recul` est l'outil de dernier recours** : `outpaint` a besoin d'un portrait plus
large comme cible, et il arrive qu'il n'y en ait plus dans la série. `recul` recule
d'environ 25 % sans référence. Deux mises en garde :
- **il ne s'applique pas uniformément à toute une série.** Reculer les deux portraits
  le 2026-09-06 a EMPIRÉ leur accord : celui qui était déjà en plan buste est parti
  bien plus loin que l'autre. Ce qui compte est que les têtes fassent la même taille,
  pas que tout le monde subisse le même traitement.
- **chaque passe régénère l'image entière** : le grain de peau se lisse et le contraste
  monte à chaque fois. Deux passes se voient. Enchaîner sans regarder, non.

### Ce qu'il faut vérifier avant de publier

Le prompt interdit explicitement de toucher au sujet, et la liste de ce qui doit
rester intact est longue à dessein : **chaque item retiré du prompt est une porte
ouverte à une dérive du visage.** Le modèle obéit largement, pas absolument.
Donc, à chaque fois :

1. **Comparer les visages côte à côte, à la même échelle**, original contre
   retouche — pas les images entières, les visages. Traits, sourire, bijoux.
2. Sur les peaux, la retouche lisse le grain et pousse le contraste. Visible sur
   le portrait de Sarah, discret sur celui d'Alexis. C'est le prix du procédé :
   ce n'est plus la photo, c'est une photo régénérée.
3. **Le portrait de quelqu'un d'autre se fait valider par cette personne** avant
   publication. C'est son visage, modifié par une machine.

### Publier, et vérifier sans empoisonner le cache

Les portraits sont servis par `otomata.tech`, un site en application monopage :
une adresse **qui n'existe pas encore** y répond `200` avec la page d'accueil, et
Cloudflare met cette réponse HTML en cache pour 4 h. Vérifier une URL d'image
avant la fin du déploiement suffit donc à la rendre inutilisable pendant quatre
heures — arrivé le 2026-09-01 sur les deux portraits.

Donc : attendre la fin du déploiement, puis tester **avec un paramètre
anti-cache** (`?cb=$RANDOM`) et contrôler le `content-type`, pas seulement le
code de retour. Un `200` en `text/html` sur une image, c'est le fallback, pas le
fichier.

Si le mal est fait, la purge se scripte — `purge-cache.py` à côté de ce fichier :
il crée avec le jeton d'administration un jeton éphémère limité à la zone et à la
seule permission `Cache Purge`, purge, puis supprime le jeton. **Le piège est la
propagation** : un jeton Cloudflare tout juste créé est refusé en authentification
pendant quelques secondes, ce qui fait conclure à tort que la permission n'est pas
délégable — elle l'est (vérifié le 2026-09-01, purge acceptée 15 s après création).
D'où les essais espacés.

### Fond — le saffran, depuis le 2026-09-06

Le fond retenu est le **saffran de la charte `#f0b41e`**, sur toute la série.

⚠️ **La note qui précédait ici était fausse et a coûté un aller-retour.** Elle
affirmait, d'un essai du 2026-09-01, que « le camel du pull se détache mal » sur le
saffran et que « la lumière jaune verdit les cheveux foncés ». Remesuré le 2026-09-06
en montant les trois fonds côte à côte : c'est sur l'**ocre** (`#cc7722`) que le pull
camel se fond — il est à deux doigts de la couleur du fond —, et sur le saffran qu'il
ressort le mieux. Le verdissement des cheveux n'a été constaté sur aucun des deux.

Leçon générale, pas seulement sur les photos : **une comparaison de couleurs se refait
en montant les candidats côte à côte**, pas de mémoire ni sur une note. Le mode
`recolor` du script est là pour ça, il coûte deux minutes.

Le bleu nuit (`#2a4562`) reste dans l'historique git si le besoin revient.
