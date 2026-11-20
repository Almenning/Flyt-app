#!/usr/bin/env python3
"""Rebuild pixel-exact Storesoster V1 identity master for Laria TrollActor 2.

This is NOT an animation layer pack and MUST NOT replace production artwork.
Requires Pillow. Reads only the locked V1 asset.
"""
from pathlib import Path
from hashlib import sha256, sha1
import argparse
import json
from PIL import Image, ImageChops

SOURCE_SHA256 = 'b98a5ee7f264d448da557636406080b5d8ee8aae23f32f0e41b66bf811beda89'
SOURCE_GIT_SHA1 = 'a8fba47e272e2856bd78b92fb262146506e828ed'

def build(source: Path, target: Path) -> dict:
    original = source.read_bytes()
    digest = sha256(original).hexdigest()
    git_blob = sha1(b'blob ' + str(len(original)).encode() + b'\0' + original).hexdigest()
    if (digest, git_blob) != (SOURCE_SHA256, SOURCE_GIT_SHA1):
        raise ValueError('Locked Storesoster V1 differs from audited GitHub source')
    with Image.open(source) as image:
        image = image.convert('RGBA')
    if image.size != (512, 1024):
        raise ValueError('Locked Storesoster V1 must be 512x1024 RGBA')

    # Only replicate pixels, never invent higher-resolution painted detail.
    # paste() deliberately preserves RGB underneath zero-alpha pixels.
    art = image.resize((1024, 2048), Image.Resampling.NEAREST)
    master = Image.new('RGBA', (2048, 2048), (0, 0, 0, 0))
    master.paste(art, (512, 0))
    recovered = master.crop((512, 0, 1536, 2048)).resize(
        (512, 1024), Image.Resampling.NEAREST)
    if (ImageChops.difference(recovered, image).getbbox() is not None
            or recovered.tobytes() != image.tobytes()):
        raise AssertionError('RGBA source fidelity verification failed')
    target.parent.mkdir(parents=True, exist_ok=True)
    master.save(target, optimize=True)
    return {
        'source_sha256': digest, 'source_git_blob': git_blob,
        'master_sha256': sha256(target.read_bytes()).hexdigest(),
        'canvas': [2048, 2048], 'art_rect': [512, 0, 1024, 2048],
        'source_RGBA_roundtrip_exact': True,
        'ownerApproved': False, 'readyForRuntime': False,
    }

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', default='laer-litt-mer/assets/gangemagi-troll/storesoster.webp')
    parser.add_argument('--out', default='out/laria/storesoster-v1-source-exact-2048.png')
    args = parser.parse_args()
    print(json.dumps(build(Path(args.source), Path(args.out)), indent=2))
