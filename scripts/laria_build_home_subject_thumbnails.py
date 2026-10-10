#!/usr/bin/env python3
"""Build lightweight Home card previews from the already-approved Læria chapter art.

The full illustrations are deliberately not requested on Home. The original files,
mastery logic, and educational engines remain unchanged.
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageEnhance

ROOT = Path(__file__).resolve().parents[1] / "laer-litt-mer"
OUTPUT_SIZE = (520, 310)
WORLDS = {
    "norwegian": ("bokskogen-atlas32.webp", (0.50, 0.51)),
    "math": ("matte-verden.png", (0.52, 0.59)),
    "english": ("engelsk-verden.png", (0.54, 0.52)),
    "geography": ("geografi-verden.png", (0.52, 0.47)),
}
for subject, (name, focus) in WORLDS.items():
    original = ROOT / name
    target = ROOT / f"home-{subject}-v14.webp"
    with Image.open(original) as full:
        image = ImageOps.fit(full.convert("RGB"), OUTPUT_SIZE,
                             method=Image.Resampling.LANCZOS, centering=focus)
    image = ImageEnhance.Color(image).enhance(1.02)
    image.save(target, "WEBP", quality=81, method=6)
    assert target.stat().st_size < 125_000, f"{subject} preview exceeds 125 KB"
    print(f"{subject}: {target.stat().st_size // 1024} KB -> {target.relative_to(ROOT)}")
