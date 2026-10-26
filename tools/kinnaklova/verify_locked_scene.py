#!/usr/bin/env python3
"""Strict pixel-integrity check for the approved Kinnaklova composition.

Usage:
 python3 tools/kinnaklova/verify_locked_scene.py \
   --reference /path/to/laria_kinnaklova_visual_reference_locked_except_trolls_20261026.png \
   --candidate laer-litt-mer/assets/kinnaklova/kinnaklova-scene-clean-approved-20261026.webp

Requires Pillow; export candidate as LOSSLESS WebP (no rescaling or colour grading).
Only the limited pixels occupied by the three *rejected* generated trolls may differ.
This does NOT certify that the new character art looks good. Human review remains mandatory.
"""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw

PROJECT = Path(__file__).resolve().parents[2]
LOCK = PROJECT / "docs" / "LARIA-KINNAKLOVA-VISUAL-LOCK-2026-10-26.json"
# Restrictive engineering masks. These are not permissions to change neighbouring
# approved signs, landscape or buildings. Adjust narrower after an art handoff.
MASKS = {
    "rejected_words_troll": [
        (133, 567), (232, 558), (322, 587), (380, 653),
        (380, 751), (330, 806), (151, 803), (110, 729)
    ],
    "rejected_words_hand": [
        # The original left polygon missed the pointing hand near x=410.
        # Keep this narrow so the approved church wall remains untouched.
        (324, 628), (337, 623), (352, 632), (370, 637),
        (383, 637), (398, 635), (417, 637), (425, 645),
        (422, 653), (413, 658), (397, 664), (382, 668),
        (365, 671), (348, 672), (332, 665), (321, 658)
    ],
    "rejected_sentences_troll": [
        (941, 411), (1015, 409), (1074, 448), (1071, 507),
        (1040, 541), (928, 535), (911, 479)
    ],
    "rejected_reading_troll": [
        (1438, 533), (1516, 532), (1595, 592), (1585, 656),
        (1535, 673), (1404, 667), (1381, 597)
    ],
    "rejected_reading_foot": [
        # Original right mask left a leg/foot visible above Reading.
        (1552, 609), (1573, 609), (1585, 614), (1604, 624),
        (1610, 638), (1610, 651), (1594, 661),
        (1575, 663), (1557, 654)
    ]
}


# The three painted activity signs must remain pixel-identical even if a broad
# troll polygon overlaps their borders. Cropping or repainting a sign is NEVER
# part of an approved troll-removal operation.
PROTECTED_SIGNS = {
    "words": (383, 703, 683, 805),
    "sentences": (1049, 469, 1304, 555),
    # Preserve the actual painted Reading sign; the rejected troll foot
    # and book sit just above the wooden plaque. Protecting all of y>=639
    # previously made it impossible to remove the foot.
    "reading": (1352, 665, 1633, 743),
}


def allowed_change_mask(size):
    """Return a byte-exact edit whitelist, excluding the approved sign pixels."""
    allowed = Image.new("L", size, 0)
    painter = ImageDraw.Draw(allowed)
    for polygon in MASKS.values():
        painter.polygon(polygon, fill=255)
    for box in PROTECTED_SIGNS.values():
        painter.rectangle(box, fill=0)
    return allowed


def channel_exact_difference(a, b):
    """Maximum RGB-channel difference; converting to grey can hide 1-LSB edits."""
    diff = ImageChops.difference(a.convert("RGB"), b.convert("RGB"))
    return ImageChops.lighter(
        ImageChops.lighter(diff.getchannel("R"), diff.getchannel("G")),
        diff.getchannel("B"),
    )


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reference", required=True, type=Path)
    parser.add_argument("--candidate", required=True, type=Path)
    args = parser.parse_args()
    lock = json.loads(LOCK.read_text(encoding="utf-8"))
    expected = lock["reference"]
    source_bytes = args.reference.read_bytes()
    if sha256(source_bytes) != expected["sha256"]:
        raise SystemExit("FAILED: reference pixels are not the locked 26 October artwork")
    with Image.open(args.reference) as original, Image.open(args.candidate) as cleaned:
        size = (expected["pixel_width"], expected["pixel_height"])
        if original.size != size or cleaned.size != size:
            raise SystemExit(f"FAILED: canvas size must stay {size}, got {original.size} and {cleaned.size}")
        # Match all three RGB channels EXACTLY outside the approved edit mask.
        diff = channel_exact_difference(original, cleaned)
        allowed = allowed_change_mask(size)
        outside = ImageChops.invert(allowed)
        unauthorized = ImageChops.multiply(diff, outside)
        bbox = unauthorized.getbbox()
        if bbox:
            count = sum(bool(value) for value in unauthorized.getdata())
            raise SystemExit(f"FAILED: {count} pixels OUTSIDE allowed masks OR ON LOCKED SIGNS changed; bounding box {bbox}")
        for name,poly in MASKS.items():
            region = Image.new("L", size, 0)
            ImageDraw.Draw(region).polygon(poly, fill=255)
            region = ImageChops.multiply(region, allowed)
            count = sum(bool(value) for value in ImageChops.multiply(diff, region).getdata())
            if count < 900:
                raise SystemExit(f"FAILED: {name} is virtually unchanged ({count} pixels); rejected baked troll may remain")
            print(f"{name}: {count} changed pixels within the permitted mask")
    print("PASS: approved composition preserved outside rejected trolls.")
    print("IMPORTANT: this is a geometric check, not approval of paint quality or character identity.")
    print("Candidate SHA-256:", sha256(args.candidate.read_bytes()))


if __name__ == "__main__":
    main()
