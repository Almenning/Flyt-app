#!/usr/bin/env python3
"""Pixel-fidelity proof for separately retouched Laria premium scene artwork.

Does NOT judge artistic quality, approve images, change locked originals, or
activate any art. It only verifies original mountains/church/fjord pixels outside
whitelisted painted UI have not been replaced by a generic illustration.
"""
import argparse
import hashlib
import json
from pathlib import Path
import sys

from PIL import Image, ImageDraw

TOOLS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(TOOLS / "laria_art"))
from prepare_clean_art_previews import LOCKED, source, make_mask, checked  # noqa: E402

ROOT = TOOLS.parent


def verify(world, candidate_path, offset_x=0, offset_y=0):
    original, original_bytes = source(world)  # SHA / Git blob locked
    ui_mask = make_mask(world)
    original_width, original_height = original.size
    with Image.open(candidate_path) as uploaded:
        if uploaded.mode == "RGBA" and uploaded.getchannel("A").getextrema()[0] != 255:
            raise ValueError("Transparency is not a valid opaque landscape")
        candidate = uploaded.convert("RGB")
    width, height = candidate.size
    if world == "grovanova":
        if width < 1366 or height < 1024 or abs(width / height - 4 / 3) > 0.035:
            raise ValueError("Grovanova needs a real 4:3 iPad landscape master (at least 1366 x 1024)")
    elif width < original_width or height < original_height:
        raise ValueError("Kinnaklova candidate must not reduce the approved 1672x941 master")
    if min(offset_x, offset_y) < 0 or offset_x + original_width > width or offset_y + original_height > height:
        raise ValueError("Locked original raster does not fit in declared candidate placement")
    cropped = candidate.crop((offset_x, offset_y, offset_x + original_width, offset_y + original_height))
    altered = checked(original, cropped, ui_mask)  # exact zero differences outside masks
    masked = sum(1 for p in ui_mask.getdata() if p)
    if altered < int(masked * 0.10):
        raise ValueError("Too few pixels changed inside the UI removal masks for substantive retouching")
    result = {
        "world": world,
        "candidate": str(candidate_path),
        "candidate_sha256": hashlib.sha256(Path(candidate_path).read_bytes()).hexdigest(),
        "locked_source_sha256": hashlib.sha256(original_bytes).hexdigest(),
        "canvas_size": [width, height],
        "source_placement": [offset_x, offset_y],
        "protected_pixel_changes": 0,
        "retouched_mask_pixels": altered,
        "pixel_integrity": "PASS",
        "visual_approval": False,
        "release_approved": False,
        "note": "Artist + actual WebKit/Chromium iPad screenshot approval is still mandatory."
    }
    return result


def self_test():
    original = Image.new("RGB", (120, 75), (12, 80, 150))
    mask = Image.new("L", original.size, 0)
    ImageDraw.Draw(mask).rectangle((12, 12, 90, 50), fill=255)
    proposal = original.copy()
    ImageDraw.Draw(proposal).rectangle((12, 12, 90, 50), fill=(75, 120, 50))
    assert checked(original, proposal, mask) > 100
    bad = proposal.copy()
    bad.putpixel((100, 60), (255, 255, 255))
    try:
        checked(original, bad, mask)
    except AssertionError:
        pass
    else:
        raise AssertionError("Protected landscape alteration was not rejected")
    print("PASS: pixel preservation enforces untouched mountains outside UI-only masks")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--world", choices=sorted(LOCKED))
    parser.add_argument("--candidate", type=Path)
    parser.add_argument("--offset-x", type=int, default=0)
    parser.add_argument("--offset-y", type=int, default=0)
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return
    if not args.world or not args.candidate:
        parser.error("--world and --candidate are required except in --self-test")
    result = verify(args.world, args.candidate, args.offset_x, args.offset_y)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
