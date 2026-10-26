#!/usr/bin/env python3
"""Build Tallvika's source-derived storesoster companion art.

This is intentionally a deterministic colour/material treatment, not a
character generator.  It preserves the locked source's geometry and alpha
silhouette byte-for-byte while softening only its rendered surface so it sits
more naturally beside Tallvika's painted world.
"""
from __future__ import annotations

import argparse
import hashlib
from pathlib import Path

from PIL import Image, ImageChops, ImageEnhance, ImageFilter


LOCKED_SHA256 = "b98a5ee7f264d448da557636406080b5d8ee8aae23f32f0e41b66bf811beda89"
SIZE = (512, 1024)


def _paper_texture(size: tuple[int, int]) -> Image.Image:
    """Make a very low-contrast, deterministic fibre texture."""
    width, height = size
    texture = Image.new("L", size, 128)
    px = texture.load()
    for y in range(height):
        for x in range(width):
            # Two low-frequency waves plus a fixed fine grain.  Avoid random
            # pixels: the output stays reproducible and quiet at Retina scale.
            broad = ((x * 17 + y * 11) % 71) - 35
            fine = ((x * 7 + y * 19) % 13) - 6
            px[x, y] = max(0, min(255, 128 + broad // 9 + fine // 3))
    return texture.filter(ImageFilter.GaussianBlur(0.42))


def build(source: Path, output: Path) -> dict[str, str | bool | list[int]]:
    source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
    if source_hash != LOCKED_SHA256:
        raise RuntimeError(f"STOP: unapproved Storesoster source: {source_hash}")
    original = Image.open(source).convert("RGBA")
    if original.size != SIZE:
        raise RuntimeError(f"STOP: expected {SIZE}, got {original.size}")

    alpha = original.getchannel("A")
    rgb = original.convert("RGB")

    # Edge-preserving smoothing via a median pass, then blend most of it back
    # with the original. It reduces photographic pores/specular noise without
    # changing facial placement, expression, costume, or silhouette.
    softened = rgb.filter(ImageFilter.MedianFilter(3)).filter(ImageFilter.GaussianBlur(0.34))
    painted = Image.blend(rgb, softened, 0.72)
    painted = ImageEnhance.Contrast(painted).enhance(0.91)
    painted = ImageEnhance.Color(painted).enhance(0.88)

    # A restrained warm daylight wash aligns the source render with Tallvika's
    # sunlit ochre/leaf palette. It applies only inside the source alpha.
    warm = Image.new("RGB", SIZE, (250, 229, 190))
    painted = Image.blend(painted, warm, 0.075)

    # The painted world has a soft material grain. Blend a nearly invisible
    # paper value layer, masked strictly to existing opaque/translucent pixels.
    texture = _paper_texture(SIZE).convert("RGB")
    painted = ImageChops.multiply(painted, texture)
    painted = Image.blend(Image.blend(rgb, softened, 0.72), painted, 0.15)
    result = painted.convert("RGBA")
    result.putalpha(alpha)

    output.parent.mkdir(parents=True, exist_ok=True)
    result.save(output, "WEBP", lossless=True, method=6)
    output_hash = hashlib.sha256(output.read_bytes()).hexdigest()
    # Verify no silhouette surgery slipped into this deterministic treatment.
    rendered_alpha = Image.open(output).convert("RGBA").getchannel("A")
    if rendered_alpha.tobytes() != alpha.tobytes():
        raise RuntimeError("STOP: output alpha differs from locked source")
    return {
        "source_sha256": source_hash,
        "output_sha256": output_hash,
        "size": list(SIZE),
        "alpha_silhouette_preserved": True,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=Path("laer-litt-mer/assets/gangemagi-troll/storesoster.webp"))
    parser.add_argument("--output", type=Path, default=Path("laer-litt-mer/assets/tallvika/storesoster-inworld-v1.webp"))
    args = parser.parse_args()
    print(build(args.source, args.output))
