#!/usr/bin/env python3
"""Prepare the approved Kinnaklova scene for the app WITHOUT approving new art.

Input A: original 1672x941 PNG approved EXCEPT for three generated trolls.
Input B: artist-cleaned PNG in which only those three rejected trolls are
removed, with all other pixels identical to input A.
Output: lossless WebP for the existing app scene plus SHA in the visual lock.

Do not run on the original image alone: it still contains rejected trolls.
Requires Pillow; run the visual review gate separately after import.
"""
import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "docs/LARIA-KINNAKLOVA-VISUAL-LOCK-2026-10-26.json"
OUTPUT = ROOT / "laer-litt-mer/assets/kinnaklova/kinnaklova-scene-clean-approved-20261026.webp"
VERIFY = ROOT / "tools/kinnaklova/verify_locked_scene.py"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--locked-reference", required=True, type=Path)
    parser.add_argument("--cleaned-png", required=True, type=Path)
    args = parser.parse_args()
    lock = json.loads(MANIFEST.read_text(encoding="utf-8"))
    reference_sha = hashlib.sha256(args.locked_reference.read_bytes()).hexdigest()
    if reference_sha != lock["reference"]["sha256"]:
        raise SystemExit("Wrong reference; expected the locked exact original")
    # The cleaned source must pass the narrow modification-mask check.
    command = [sys.executable, str(VERIFY), "--reference",
               str(args.locked_reference), "--candidate", str(args.cleaned_png)]
    subprocess.run(command, check=True)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(args.cleaned_png) as image:
        if image.size != (1672,941):
            raise SystemExit("Clean artwork must preserve the original pixel geometry")
        image.convert("RGB").save(OUTPUT, "WEBP", lossless=True, quality=100, method=6)
    # Check the actual exported file, not just the artist's source PNG.
    subprocess.run([sys.executable, str(VERIFY), "--reference",
                    str(args.locked_reference), "--candidate", str(OUTPUT)], check=True)
    sha = hashlib.sha256(OUTPUT.read_bytes()).hexdigest()
    impl = lock.setdefault("implementation",{})
    impl["clean_master_sha256"] = sha
    impl["clean_master_visual_approved"] = False
    impl["status"] = "clean-source-imported-awaiting-visual-approval"
    MANIFEST.write_text(json.dumps(lock,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("Prepared:",OUTPUT)
    print("WebP SHA-256:",sha)
    print("Visual approval remains FALSE. Do not merge until owner reviews exact scene.")


if __name__ == "__main__":
    main()
