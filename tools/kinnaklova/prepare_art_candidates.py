#!/usr/bin/env python3
"""Build NON-APPROVED Kinnaklova restoration previews from the exact locked PNG.

All approved landmarks, text, signs and outside-mask pixels are preserved.
OpenCV inpainting is only a starting point for an illustrator, never art approval.

  python3 tools/kinnaklova/prepare_art_candidates.py \
    --mask-only --output-dir /tmp/kinnaklova-handoff

  python3 tools/kinnaklova/prepare_art_candidates.py \
    --reference /path/to/laria_kinnaklova_visual_reference_locked_except_trolls_20261026.png \
    --output-dir /tmp/kinnaklova-restoration

The output files are NOT named or treated as approved art. Neither this script
nor the generated report touches the release manifest or browser SHA gate.
"""
import argparse
import hashlib
import io
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw
from verify_locked_scene import (
    LOCK, MASKS, PROTECTED_SIGNS, PROJECT, allowed_change_mask,
    channel_exact_difference,
)

SIZE = (1672, 941)
VERIFY = PROJECT / "tools/kinnaklova/verify_locked_scene.py"
STATUS = "PREVIEW_ONLY_NOT_APPROVED"


def source_sha256(payload):
    return hashlib.sha256(payload).hexdigest()


def validate_reference(reference, expected_sha256, expected_size=SIZE):
    """Never try to restore from a recompressed, renamed or regenerated scene."""
    payload = Path(reference).read_bytes()
    actual = source_sha256(payload)
    if actual != expected_sha256:
        raise ValueError(
            "Wrong source bytes: only the exact locked Kinnaklova PNG is valid "
            f"(expected {expected_sha256}, got {actual})."
        )
    with Image.open(io.BytesIO(payload)) as img:
        if img.size != expected_size:
            raise ValueError(f"Locked artwork must be {expected_size}, got {img.size}.")
        if img.format != "PNG":
            raise ValueError("Locked source must be the original PNG, not a preview.")
        return img.convert("RGB").copy()


def combine_only_allowed(source, proposal, allowed):
    """Copy proposal pixels only where the strict engineering mask permits."""
    if source.size != proposal.size or source.size != allowed.size:
        raise ValueError("Source, proposal and pixel mask must have equal dimensions.")
    if allowed.mode != "L":
        raise ValueError("Allowed pixel mask must be 8-bit grayscale.")
    return Image.composite(proposal.convert("RGB"), source.convert("RGB"), allowed)


def inpaint_preview(source, allowed, method="telea", radius=7):
    """Use OpenCV for a candidate, then restore *every* disallowed pixel."""
    try:
        import cv2
        import numpy as np
    except ImportError as exc:
        raise RuntimeError(
            "Inpainting needs opencv-python-headless and numpy. "
            "Install them in the illustrator's working environment."
        ) from exc
    if method not in ("telea", "ns"):
        raise ValueError("Inpaint method must be telea or ns.")
    if not 1 <= radius <= 20:
        raise ValueError("Inpaint radius must be between 1 and 20 pixels.")
    rgb = np.asarray(source.convert("RGB"))
    mask = np.asarray(allowed, dtype=np.uint8)
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    flag = cv2.INPAINT_TELEA if method == "telea" else cv2.INPAINT_NS
    restored = cv2.inpaint(bgr, mask, radius, flag)
    proposed = Image.fromarray(cv2.cvtColor(restored, cv2.COLOR_BGR2RGB))
    result = combine_only_allowed(source, proposed, allowed)
    unauthorized = ImageChops.multiply(
        channel_exact_difference(source, result), ImageChops.invert(allowed)
    )
    if unauthorized.getbbox():
        raise AssertionError("Inpaint preview altered locked pixels outside the edit mask.")
    return result


def save_mask_guide(output_dir, manifest):
    """Make a geometry-only artist handoff; no source PNG required."""
    output_dir.mkdir(parents=True, exist_ok=True)
    mask = allowed_change_mask(SIZE)
    mask.save(output_dir / "allowed-edit-mask.png")
    guide = Image.new("RGB", SIZE, (242, 237, 226))
    overlay = Image.new("RGBA", SIZE, (225, 54, 45, 0))
    overlay.putalpha(mask.point(lambda v: 148 if v else 0))
    guide = Image.alpha_composite(guide.convert("RGBA"), overlay)
    draw = ImageDraw.Draw(guide)
    for name, rect in PROTECTED_SIGNS.items():
        draw.rectangle(rect, outline=(19, 111, 72, 255), width=5)
        draw.text((rect[0] + 8, max(0, rect[1] - 20)),
                  name + " - KEEP PIXEL EXACT", fill=(13, 83, 54, 255))
    draw.text((35, 26), "KINNAKLOVA - ART HANDOFF - NOT APPROVED", fill=(61, 34, 25, 255))
    draw.text((35, 52), "RED: EDITABLE TROLL AREAS / GREEN: IMMUTABLE SIGNS",
              fill=(61, 34, 25, 255))
    guide.convert("RGB").save(output_dir / "mask-guide.png", "PNG")
    report = {
        "status": STATUS,
        "reference_sha256": manifest["reference"]["sha256"],
        "size": list(SIZE),
        "candidate_is_approved": False,
        "release_approval": False,
        "protected_signs": PROTECTED_SIGNS,
        "mask_names": list(MASKS),
        "allowed_pixel_count": sum(v != 0 for v in mask.getdata()),
        "instructions": (
            "Use only the exact reference PNG. Remove rejected trolls locally; "
            "preserve each other pixel, including all painted signs. "
            "Repaint large textures by hand where automated previews are poor. "
            "Do not import or approve a generated candidate without visual review."
        ),
    }
    (output_dir / "handoff.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return mask, report


def write_detail_sheet(source, candidate, output_file, method):
    """Side-by-side evidence of what the artist still needs to refine."""
    panels = []
    for name, poly in MASKS.items():
        xs, ys = zip(*poly)
        crop = (
            max(0, min(xs) - 28), max(0, min(ys) - 28),
            min(SIZE[0], max(xs) + 29), min(SIZE[1], max(ys) + 29),
        )
        before, after = source.crop(crop), candidate.crop(crop)
        w, h = before.size
        panel = Image.new("RGB", (2 * w + 20, h + 36), "white")
        panel.paste(before, (0, 36))
        panel.paste(after, (w + 20, 36))
        ImageDraw.Draw(panel).text((4, 10), name + " / ORIGINAL - " + method.upper(),
                                    fill="black")
        panels.append(panel)
    width = max(im.width for im in panels)
    sheet = Image.new("RGB", (width, sum(im.height for im in panels) + 12 * (len(panels) - 1)),
                      (244, 239, 229))
    y = 0
    for panel in panels:
        sheet.paste(panel, (0, y))
        y += panel.height + 12
    sheet.save(output_file, "PNG")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reference", type=Path, help="Exact, locked 1672x941 PNG")
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--mask-only", action="store_true",
                        help="Generate useful handoff masks without the source file")
    parser.add_argument("--radius", type=int, default=7)
    args = parser.parse_args()
    manifest = json.loads(LOCK.read_text(encoding="utf-8"))
    allowed, report = save_mask_guide(args.output_dir, manifest)
    if args.mask_only:
        print("Created pixel-exact mask guide. No art or release approval was granted.")
        return
    if not args.reference:
        parser.error("--reference is required unless --mask-only is selected")
    source = validate_reference(args.reference, manifest["reference"]["sha256"])
    overlay = Image.new("RGBA", SIZE, (230, 60, 47, 0))
    overlay.putalpha(allowed.point(lambda v: 125 if v else 0))
    Image.alpha_composite(source.convert("RGBA"), overlay).save(
        args.output_dir / "locked-reference-with-edit-mask.png", "PNG"
    )
    report["candidates"] = {}
    for method in ("telea", "ns"):
        candidate = inpaint_preview(source, allowed, method=method, radius=args.radius)
        target = args.output_dir / ("candidate-" + method + "-NOT-APPROVED.png")
        if target.resolve() == args.reference.resolve():
            raise ValueError("Cannot overwrite the locked source.")
        candidate.save(target, "PNG")
        # The exact-source check, immutable signs, edit mask and material
        # changes per rejected character are independently enforced.
        subprocess.run(
            [sys.executable, str(VERIFY), "--reference", str(args.reference),
             "--candidate", str(target)], check=True
        )
        write_detail_sheet(source, candidate,
                           args.output_dir / ("review-" + method + ".png"), method)
        report["candidates"][method] = {
            "file": target.name, "sha256": source_sha256(target.read_bytes()),
            "geometry_verified": True, "visually_approved": False
        }
    (args.output_dir / "handoff.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print("Generated two UNAPPROVED retouch previews; human paintover and review required.")
    print("NO files in the Læria app, manifest or publication gate were modified.")


if __name__ == "__main__":
    main()
