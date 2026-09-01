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

### Fond

Le fond retenu est le bleu nuit du portrait d'Alexis (`#2a4562` environ), qui
sert de référence à toute la série. Le saffran de la charte (`#f0b41e`) a été
essayé le 2026-09-01 : il fonctionne, mais le camel du pull s'y détache mal et
la retombée de lumière jaune verdit les cheveux foncés. Le mode `recolor` du
script permet de rejouer un fond de couleur si le besoin revient.
