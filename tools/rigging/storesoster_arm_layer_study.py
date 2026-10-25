#!/usr/bin/env python3
"""Art-only mask feasibility study of Læria's *locked* Storesøster illustration.

Uses original visible source pixels. Never fabricates hidden shoulders, hair,
clothing or anatomy. Outputs are NOT suitable for live character animation.
Dependencies for manual/local illustration review: Pillow and numpy.
Usage:
  python tools/rigging/storesoster_arm_layer_study.py \
    --source laer-litt-mer/assets/gangemagi-troll/storesoster.webp \
    --output /tmp/laria-storesoster-arm-study
"""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

LOCKED_SHA256 = "b98a5ee7f264d448da557636406080b5d8ee8aae23f32f0e41b66bf811beda89"
SIZE = (512, 1024)
SHOULDER_PIVOT = (177, 397)
# EXPERIMENTAL, hand-reviewed separation of the *visible* bent front arm.
# Deliberately not approved production matte/artwork. Actual hidden anatomy
# must be restored by an illustrator before any production-grade rotation.
ARM_OUTLINE = [
    (153, 381), (140, 388), (124, 394), (111, 402), (100, 417),
    (91, 430), (87, 443), (89, 452), (98, 466), (112, 475),
    (136, 481), (147, 481), (152, 490), (159, 506), (175, 515),
    (188, 524), (199, 529), (211, 532), (225, 529), (240, 523),
    (257, 521), (264, 516), (264, 508), (257, 494), (242, 490),
    (221, 480), (207, 474), (192, 465), (178, 452), (162, 441),
    (163, 428), (175, 417), (180, 405), (175, 396),
]

def split_original(original):
    matte = Image.new("L", SIZE, 0)
    ImageDraw.Draw(matte).polygon(ARM_OUTLINE, fill=255)
    alpha = np.asarray(original.getchannel("A"), dtype=np.uint16)
    channel = np.asarray(matte, dtype=np.uint16)
    arm = original.copy()
    arm.putalpha(Image.fromarray(((alpha * channel) // 255).astype("uint8")))
    under = original.copy()
    under.putalpha(Image.fromarray(((alpha * (255 - channel)) // 255).astype("uint8")))
    return matte, arm, under

def exposed_pixels(original, movable_arm, under, degrees):
    moved = movable_arm.rotate(
        degrees, resample=Image.Resampling.BICUBIC,
        center=SHOULDER_PIVOT, expand=False)
    composite = Image.alpha_composite(under, moved)
    opaque_before = np.asarray(original.getchannel("A"), dtype=np.int16) > 150
    absent_after = np.asarray(composite.getchannel("A"), dtype=np.int16) < 60
    missing = opaque_before & absent_after
    rgba_error = np.abs(
        np.asarray(composite, dtype=np.int16) -
        np.asarray(original, dtype=np.int16)).mean()
    return composite, missing, int(missing.sum()), float(rgba_error)

def bg():
    surface = Image.new("RGBA", SIZE, (246, 239, 230, 255))
    draw = ImageDraw.Draw(surface)
    for y in range(0, SIZE[1], 28):
        for x in range(0, SIZE[0], 28):
            if (x // 28 + y // 28) % 2:
                draw.rectangle((x, y, x + 27, y + 27),
                               fill=(237, 224, 211, 255))
    return surface

def main():
    arg = argparse.ArgumentParser()
    arg.add_argument("--source", default="laer-litt-mer/assets/gangemagi-troll/storesoster.webp")
    arg.add_argument("--output", default="/tmp/laria-storesoster-arm-study")
    opts = arg.parse_args()
    source = Path(opts.source)
    sha = hashlib.sha256(source.read_bytes()).hexdigest()
    if sha != LOCKED_SHA256:
        raise SystemExit("STOP: locked Storesøster illustration hash changed: " + sha)
    img = Image.open(source).convert("RGBA")
    if img.size != SIZE:
        raise SystemExit("STOP: locked source dimensions changed")
    output = Path(opts.output)
    output.mkdir(parents=True, exist_ok=True)
    matte, arm, under = split_original(img)
    matte.save(output / "arm-mask-EXPERIMENTAL.png")
    arm.save(output / "arm-visible-original-pixels.png")
    under.save(output / "body-UNDERARM-MISSING.png")
    metrics = {
        "original_sha256": sha,
        "size": list(SIZE),
        "pivot": list(SHOULDER_PIVOT),
        "polygon": ARM_OUTLINE,
        "contains_new_art": False,
        "hidden_anatomy_reconstructed": False,
        "premium_art_ready": False,
        "poses": {},
    }
    panels = []
    for rotation in (0, -12, 12, -25, 25):
        pose, gaps, gap_count, error = exposed_pixels(img, arm, under, rotation)
        if rotation == 0 and (gap_count or error):
            raise AssertionError("Neutral composite must reproduce original EXACTLY")
        audit = bg()
        audit.alpha_composite(pose)
        highlight = Image.new("RGBA", SIZE, (0, 0, 0, 0))
        highlight.putdata([(255, 22, 110, 220 if hole else 0)
                           for hole in gaps.flat])
        audit.alpha_composite(highlight)
        audit.convert("RGB").save(
            output / ("pose-%+d-deg-UNPAINTED.png" % rotation))
        metrics["poses"][str(rotation)] = {
            "missing_source_silhouette_pixels": gap_count,
            "rgba_mean_absolute_error_vs_original": round(error, 4),
        }
        frame = Image.new("RGB", (512, 1080), "#fff8eb")
        frame.paste(audit.convert("RGB"), (0, 0))
        ImageDraw.Draw(frame).text((12, 1034),
                                  f"{rotation:+d} degrees | missing: {gap_count} px",
                                  fill="#503724")
        panels.append(frame)
    summary = Image.new("RGB", (512 * len(panels), 1080), "#fff8eb")
    for index, panel in enumerate(panels):
        summary.paste(panel, (index * 512, 0))
    summary.save(output / "arm-motion-occlusion-contact-sheet.png")
    (output / "rig-readiness.json").write_text(
        json.dumps(metrics, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"premium_art_ready": False,
                      "poses": metrics["poses"]}, indent=2))

if __name__ == "__main__":
    main()
