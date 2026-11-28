#!/usr/bin/env python3
"""Verify the exact Hjem v16 pair already accepted by Læria's product owner."""
import hashlib
import json
from pathlib import Path

from PIL import Image

DIRECTORY = Path(__file__).resolve().parents[2] / "laer-litt-mer/assets/home-v16"
VARIANTS = {
    "landscape": {
        "export": ("c39d374c8d9972a389d120ab15a1c81352158dc78a716fc7259fc31f95ce035e", (2048, 1536)),
        "original": ("9019d2d7be86d0f96d59770c0d141b935b1c4195fecc4e1dcfbf531ce226e028", (1448, 1086)),
    },
    "portrait": {
        "export": ("c842e8e901300d1506594ef6e39929611743fc64ff1eb02254b8643059963421", (2048, 2732)),
        "original": ("ceb6331bb9ae45e3c6141dc74817262fc0f667ea0b0f82fcf85a60d99efbee55", (1086, 1448)),
    },
}


def check_file(path, expected_hash, expected_size, expected_format):
    if hashlib.sha256(path.read_bytes()).hexdigest() != expected_hash:
        raise ValueError(f"{path.name}: not the exact owner-approved bytes")
    with Image.open(path) as image:
        image.load()
        if image.size != expected_size or image.format != expected_format:
            raise ValueError(f"{path.name}: approved format or dimensions changed")
        if "A" in image.getbands() and image.getchannel("A").getextrema() != (255, 255):
            raise ValueError(f"{path.name}: approved artwork must remain opaque")


def verify(directory=DIRECTORY):
    manifest = json.loads((directory / "laria-grovanova-v16-approved.json").read_text())
    actual = tuple(manifest.get(key) for key in ("schemaVersion", "status", "approvedBy", "approvedAt", "presentation"))
    if actual != (1, "approved", "product-owner", "2026-11-19", "painted-visual-dom-actions"):
        raise ValueError("Grovanova v16 manifest no longer matches its design lock")
    for orientation, hashes in VARIANTS.items():
        entry = manifest["variants"][orientation]
        stem = f"laria-grovanova-v16-{orientation}"
        webp, png = f"{stem}.webp", f"{stem}-original.png"
        digest, size = hashes["export"]
        original_digest, original_size = hashes["original"]
        if (entry["source"], entry["sha256"], (entry["width"], entry["height"]),
            entry["original"], entry["originalSha256"]) != (
                f"./assets/home-v16/{webp}", digest, size, png, original_digest):
            raise ValueError(f"{orientation}: manifest references non-approved art")
        check_file(directory / webp, digest, size, "WEBP")
        check_file(directory / png, original_digest, original_size, "PNG")


if __name__ == "__main__":
    verify()
    print("Grovanova v16 artwork matches the locked owner-approved files.")
