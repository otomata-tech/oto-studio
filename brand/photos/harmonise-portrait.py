#!/usr/bin/env python3
"""Harmonise un portrait sur le fond et la lumière d'un portrait de référence.

Deux opérations, une par mode :

  backdrop  — remplace le décor de `--photo` par celui de `--reference`
              (couleur de fond, lumière, étalonnage). Le sujet ne bouge pas.
  outpaint  — élargit le cadre de `--photo` en prolongeant le décor et les
              épaules, pour rejoindre le cadrage tête-épaules de `--reference`.

Le sujet n'est jamais censé changer : le prompt l'interdit explicitement, et
c'est ce qu'il faut VÉRIFIER à l'œil avant de publier (cf. README.md).

    python3 harmonise-portrait.py backdrop \
        --photo sources/sarah-soumahoro-source.png \
        --reference sources/alexis-laporte-source.jpg \
        --out sarah-soumahoro.jpg

La clé Gemini vient du coffre (`GEMINI_API_KEY`) ; ce script ne l'affiche
jamais. Il exige l'interpréteur qui porte `oto.config` — celui de la CLI oto.
"""

import argparse
import base64
import json
import sys
import urllib.error
import urllib.request

MODEL = "gemini-3-pro-image"
ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

# Le noyau commun : ce qui doit rester intact. Cette liste est longue à dessein —
# chaque item retiré est une porte ouverte à une dérive du visage.
INTACT = (
    "Keep the person EXACTLY as they are: identical face, identical features, "
    "identical expression, identical pose, identical hair, identical jewellery "
    "and clothing, identical skin tone. Do not beautify, do not slim, do not "
    "change age, do not re-draw the face. "
)

PROMPTS = {
    "backdrop": (
        "Professional corporate headshot retouching. The SECOND image is the photo to edit; "
        "the FIRST image is the style reference (background colour, lighting, tonality). "
        + INTACT +
        "Change ONLY the environment: replace the background with the same smooth, even, "
        "seamless studio backdrop as the reference image, and match the reference's studio "
        "lighting (soft frontal key light, gentle falloff, no harsh shadow cast on the "
        "backdrop) and its overall colour grading and contrast. Keep the existing "
        "head-and-shoulders framing, square 1:1. Photorealistic, sharp, high detail. "
        "No text, no logo, no border."
    ),
    "outpaint": (
        "Professional corporate headshot retouching, outpainting task. The SECOND image is the "
        "photo to edit; the FIRST image shows the target framing and lighting of the matching "
        "portrait in the same series. "
        + INTACT +
        "Only EXTEND the frame outwards (outpaint) so that the crop becomes head-and-shoulders "
        "with the same generous margin as the first image: reveal more of the studio backdrop "
        "above the head and on both sides, and continue the shoulders and clothing naturally. "
        "Keep the same seamless backdrop, the same soft studio lighting and colour grading. "
        "Square 1:1. Photorealistic, sharp, high detail. No text, no logo, no border."
    ),
    "recolor": (
        "Change ONLY the studio backdrop colour of this corporate headshot. Replace the "
        "background with a smooth, even, seamless studio backdrop in {backdrop}, with the same "
        "soft gradient and vignetting as the original backdrop. Everything else must stay "
        "pixel-identical: same person, same face, same expression, same pose, same hair, same "
        "clothing, same jewellery, same skin tone, same framing, same lighting on the subject, "
        "same sharpness. Do not beautify, do not re-draw the face, do not change the crop. "
        "Photorealistic. No text, no logo, no border."
    ),
}


def _part(path):
    mime = "image/png" if path.lower().endswith(".png") else "image/jpeg"
    with open(path, "rb") as fh:
        return {"inline_data": {"mime_type": mime, "data": base64.b64encode(fh.read()).decode()}}


def _jpeg(raw, out):
    """Écrit `raw` en JPEG si Pillow est là. Renvoie False sinon (pas d'échec dur)."""
    try:
        import io

        from PIL import Image
    except ModuleNotFoundError:
        return False
    Image.open(io.BytesIO(raw)).convert("RGB").save(out, quality=90, optimize=True, progressive=True)
    return True


def generate(prompt, images, out, key, model=MODEL, aspect="1:1"):
    body = {
        "contents": [{"parts": [{"text": prompt}] + [_part(p) for p in images]}],
        "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": aspect}},
    }
    req = urllib.request.Request(
        ENDPOINT.format(model=model) + "?key=" + key,
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
    )
    try:
        payload = json.load(urllib.request.urlopen(req, timeout=300))
    except urllib.error.HTTPError as exc:
        raise SystemExit(f"Gemini HTTP {exc.code}: {exc.read().decode()[:500]}")

    for part in payload.get("candidates", [{}])[0].get("content", {}).get("parts", []):
        data = part.get("inlineData") or part.get("inline_data")
        if data:
            raw = base64.b64decode(data["data"])
            if out.lower().endswith((".jpg", ".jpeg")) and _jpeg(raw, out):
                return out
            # PIL absente de l'interpréteur oto-cli : on écrit le PNG brut du
            # modèle et on laisse l'appelant convertir.
            png = out if out.lower().endswith(".png") else out.rsplit(".", 1)[0] + ".png"
            with open(png, "wb") as fh:
                fh.write(raw)
            return png
    raise SystemExit(f"pas d'image dans la réponse : {json.dumps(payload)[:400]}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("mode", choices=sorted(PROMPTS))
    ap.add_argument("--photo", required=True, help="la photo à retoucher")
    ap.add_argument("--reference", help="le portrait de référence (modes backdrop et outpaint)")
    ap.add_argument("--backdrop", default="warm saffron yellow, hex #f0b41e",
                    help="mode recolor : la couleur de fond visée, en anglais")
    ap.add_argument("--out", required=True, help="fichier de sortie (.jpg → qualité 90, .png → brut)")
    ap.add_argument("--model", default=MODEL)
    args = ap.parse_args()

    if args.mode in ("backdrop", "outpaint") and not args.reference:
        ap.error(f"--reference est requis en mode {args.mode}")

    try:
        from oto.config import get_secret
    except ModuleNotFoundError:
        raise SystemExit(
            "module oto introuvable — lancer avec l'interpréteur de la CLI oto :\n"
            "  ~/.local/share/pipx/venvs/oto-cli/bin/python harmonise-portrait.py ..."
        )
    key = get_secret("GEMINI_API_KEY")
    if not key:
        raise SystemExit("GEMINI_API_KEY absente du coffre")

    prompt = PROMPTS[args.mode].format(backdrop=args.backdrop)
    images = [args.reference, args.photo] if args.reference else [args.photo]
    print("écrit", generate(prompt, images, args.out, key, model=args.model), file=sys.stderr)


if __name__ == "__main__":
    main()
