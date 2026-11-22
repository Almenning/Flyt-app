#!/usr/bin/env python3
"""Review-only masks + source-locked verifier for Grovanova Home v16.

The approved November 19 paintings contain baked UI. This tool NEVER
regenerates, retouches, activates or approves any artwork. It marks areas
where a human/AI-assisted art editor may work and verifies that a submitted
candidate preserves all pixels outside those bounded areas exactly.

No candidate should be put into app runtime before explicit visual approval.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / "laer-litt-mer/assets/home-v16"
MANIFEST = ART / "laria-grovanova-v16-approved.json"
# The approved WebPs are 2048px-wide Lanczos EXPORTS. The SHA-locked original
# PNGs have their own native geometry. Compare exact pixels at native size.
NATIVE_SOURCE_SIZES = {"landscape": (1448, 1086), "portrait": (1086, 1448)}
APP_EXPORT_SIZES = {"landscape": (2048, 1536), "portrait": (2048, 2732)}

# Each rectangle is [left, top, width, height] in ORIGINAL image fractions.
# These were traced from the approved v16 app screenshots and compared with
# the original manifest's signBoards/reisen/journey/nav/greeting coordinates.
# They are CONSERVATIVE editing envelopes, not production placement values.
# The right-hand live TrollActor and the DOM adult entry are NOT painted into
# these originals and intentionally have NO retouch region.
UI_REGIONS = {
    "landscape": {
        "painted_logo": (.016, .012, .265, .144),
        "painted_greeting": (.032, .133, .398, .157),
        "painted_four_signs_and_posts": (.012, .245, .277, .518),
        "painted_reisen": (.325, .510, .348, .199),
        "painted_continue": (.282, .655, .437, .182),
        "painted_bottom_nav": (0., .801, 1., .199),
    },
    "portrait": {
        "painted_logo": (.023, .024, .368, .123),
        "painted_greeting": (.032, .130, .526, .165),
        "painted_four_signs_and_posts": (.011, .290, .344, .403),
        "painted_reisen": (.266, .550, .441, .165),
        "painted_continue": (.193, .675, .601, .146),
        "painted_bottom_nav": (0., .850, 1., .150),
    }
}

# Explicit visual landmarks protected *in addition* to the pixel-perfect
# protection of every unmasked source pixel.
LANDMARKS = {
    "landscape": {
        "sun": (.50, .20, .06, .10),
        "right_mountain": (.72, .13, .26, .24),
        "fjord": (.74, .46, .14, .19),
        "church": (.91, .39, .08, .15),
    },
    "portrait": {
        "sun": (.57, .24, .09, .08),
        "right_mountain": (.74, .23, .24, .20),
        "valley_pass": (.44, .32, .24, .20),
        "church": (.89, .40, .10, .13),
    }
}

def box_px(rect, size):
    """Normalized [x,y,w,h] -> inclusive PIL rectangle."""
    x, y, w, h = rect
    assert 0 <= x <= 1 and 0 <= y <= 1 and w > 0 and h > 0
    assert x + w <= 1.000001 and y + h <= 1.000001
    W, H = size
    return (
        max(0, math.floor(x * W)),
        max(0, math.floor(y * H)),
        min(W - 1, math.ceil((x + w) * W) - 1),
        min(H - 1, math.ceil((y + h) * H) - 1),
    )

def is_inside(inner, outer):
    ix, iy, iw, ih = inner
    ox, oy, ow, oh = outer
    eps = .001
    return (ix + eps >= ox and iy + eps >= oy
            and ix + iw <= ox + ow + eps and iy + ih <= oy + oh + eps)

def source(orientation):
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    assert manifest["status"] == "approved"
    assert manifest["presentation"] == "painted-visual-dom-actions", (
        "This verifier is for the painted v16 originals, not clean art"
    )
    variant = manifest["variants"][orientation]
    orig = ART / variant["original"]
    raw = orig.read_bytes()
    expected = variant["originalSha256"]
    digest = hashlib.sha256(raw).hexdigest()
    if digest != expected:
        raise ValueError(f"{orientation}: immutable painted original SHA mismatch")
    with Image.open(orig) as loaded:
        if (variant["width"], variant["height"]) != APP_EXPORT_SIZES[orientation]:
            raise ValueError(f"{orientation}: approved app export geometry changed")
        if loaded.size != NATIVE_SOURCE_SIZES[orientation]:
            raise ValueError(
                f"{orientation}: locked PNG geometry changed; "
                f"expected {NATIVE_SOURCE_SIZES[orientation]}, got {loaded.size}"
            )
        image = loaded.convert("RGB").copy()
    for i, item in enumerate(variant["ui"]["signBoards"]):
        if not is_inside(item, UI_REGIONS[orientation]["painted_four_signs_and_posts"]):
            raise ValueError(f"{orientation}: sign board {i} outside retouch envelope")
    for field, region in (("reisen", "painted_reisen"),
                          ("journey", "painted_continue"),
                          ("nav", "painted_bottom_nav"),
                          ("greeting", "painted_greeting")):
        if not is_inside(variant["ui"][field], UI_REGIONS[orientation][region]):
            raise ValueError(f"{orientation}: {field} outside retouch envelope")
    return image, digest

def mask(orientation, size):
    result = Image.new("L", size, 0)
    draw = ImageDraw.Draw(result)
    for box in UI_REGIONS[orientation].values():
        draw.rectangle(box_px(box, size), fill=255)
    protected = Image.new("L", size, 0)
    pen = ImageDraw.Draw(protected)
    for box in LANDMARKS[orientation].values():
        pen.rectangle(box_px(box, size), fill=255)
    if ImageChops.multiply(result, protected).getbbox():
        raise ValueError(f"{orientation}: protected mountain/fjord/church overlaps UI edit mask")
    return result

def unchanged_outside(original, proposal, allowed):
    if original.size != proposal.size or proposal.size != allowed.size:
        raise ValueError("Candidate MUST retain exact approved image dimensions")
    diff = ImageChops.difference(original.convert("RGB"), proposal.convert("RGB"))
    ch = diff.split()
    delta = ImageChops.lighter(ImageChops.lighter(ch[0], ch[1]), ch[2])
    if ImageChops.multiply(delta, ImageChops.invert(allowed)).getbbox():
        raise ValueError("LOCK VIOLATION: non-UI scenery pixels were changed")
    changed = ImageChops.multiply(delta, allowed)
    if not changed.getbbox():
        raise ValueError("No UI retouch was supplied")
    return sum(1 for v in changed.getdata() if v != 0)

def verify_candidate(orientation, candidate, original, original_sha, allowed):
    with Image.open(candidate) as asset:
        if asset.mode in ("RGBA", "LA") and asset.getchannel("A").getextrema()[0] != 255:
            raise ValueError("Transparent pixels are not a clean landscape master")
        art = asset.convert("RGB")
    changed = unchanged_outside(original, art, allowed)
    return {
        "candidate": str(candidate),
        "candidate_sha256": hashlib.sha256(candidate.read_bytes()).hexdigest(),
        "original_sha256": original_sha,
        "changed_masked_pixels": changed,
        "outside_mask_changes": 0,
        "manual_art_approval": False,
        "publishable": False,
        "note": "Mechanical pixel check only. Remaining baked text, seams, blur and mountain fidelity REQUIRE human visual inspection."
    }

def guide(original, allowed, orientation):
    painting = original.convert("RGBA")
    tint = Image.new("RGBA", painting.size, (246, 47, 39, 0))
    tint.putalpha(allowed.point(lambda p: 88 if p else 0))
    result = Image.alpha_composite(painting, tint)
    pen = ImageDraw.Draw(result)
    for name, rect in UI_REGIONS[orientation].items():
        x0, y0, x1, y1 = box_px(rect, original.size)
        pen.rectangle((x0, y0, x1, y1), outline=(255, 230, 90, 255), width=5)
        pen.text((x0 + 6, y0 + 6), name, fill="white", stroke_width=2,
                 stroke_fill=(48, 20, 19))
    for name, rect in LANDMARKS[orientation].items():
        x0, y0, x1, y1 = box_px(rect, original.size)
        pen.rectangle((x0, y0, x1, y1), outline=(66, 255, 140, 255), width=5)
        pen.text((x0 + 5, y0 + 5), "PROTECTED: " + name, fill="white",
                 stroke_width=2, stroke_fill=(20, 65, 35))
    return result

def self_test():
    a = Image.new("RGB", (140, 80), (41, 82, 122))
    m = Image.new("L", (140, 80), 0)
    ImageDraw.Draw(m).rectangle((10, 10, 50, 45), fill=255)
    valid = a.copy()
    valid.putpixel((20, 20), (255, 0, 0))
    assert unchanged_outside(a, valid, m) == 1
    altered = valid.copy()
    altered.putpixel((120, 60), (255, 255, 255))
    try:
        unchanged_outside(a, altered, m)
    except ValueError as error:
        assert "LOCK VIOLATION" in str(error)
    else:
        raise AssertionError("Source lock failed to reject mountain pixel change")
    print("PASS: source-lock verifier rejects changes outside explicit UI masks")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--output-dir", type=Path)
    parser.add_argument("--candidate-portrait", type=Path)
    parser.add_argument("--candidate-landscape", type=Path)
    args = parser.parse_args()
    if args.self_test:
        self_test()
        if not args.output_dir and not args.candidate_portrait and not args.candidate_landscape:
            return
    if not args.output_dir:
        parser.error("--output-dir is required when verifying source or candidates")
    args.output_dir.mkdir(parents=True, exist_ok=True)
    report = {"status": "SOURCE_LOCKED_MASKS_ONLY", "art_approval": False,
              "runtime_changed": False, "merge_allowed": False, "orientations": {}}
    for orientation in ("portrait", "landscape"):
        original, digest = source(orientation)
        allowed = mask(orientation, original.size)
        allowed.save(args.output_dir / f"v16-{orientation}-UI-EDIT-MASK.png")
        guide(original, allowed, orientation).save(
            args.output_dir / f"v16-{orientation}-MASK-GUIDE-NOT-APPROVED.png")
        info = {"source_sha256": digest, "size": list(original.size),
                "masks": UI_REGIONS[orientation],
                "protected_landmarks": LANDMARKS[orientation],
                "candidate": None}
        candidate = getattr(args, "candidate_" + orientation)
        if candidate:
            info["candidate"] = verify_candidate(orientation, candidate,
                                                  original, digest, allowed)
        report["orientations"][orientation] = info
    (args.output_dir / "REPORT-NOT-APPROVED.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8")
    print("PASS: exact v16 painted sources and unapproved UI-retouch masks")
    print("STOP: no clean art accepted or installed into app")

if __name__ == "__main__":
    main()
