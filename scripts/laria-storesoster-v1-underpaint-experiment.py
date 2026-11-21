#!/usr/bin/env python3
"""Non-production Storesoster V1 under-arm texture proxy experiment.

Preserves source bytes and neutral RGBA exactly; does NOT invent correct
hidden anatomy. Two CV inpainting methods generate artist-review patches,
not runtime artwork. Pillow + numpy + opencv-python-headless required.
"""
from __future__ import annotations
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

SOURCE_SHA = 'b98a5ee7f264d448da557636406080b5d8ee8aae23f32f0e41b66bf811beda89'
STUDY = Path(__file__).resolve().with_name('laria-storesoster-v1-arm-source-study.py')


def source_study():
    spec = importlib.util.spec_from_file_location('laria_storesoster_source_study', STUDY)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def underpaint(src, left_mask, method):
    rgb = np.array(src.convert('RGB'))
    alpha = np.array(src.getchannel('A'))
    mask = np.array(left_mask)
    edit = cv2.dilate((mask > 127).astype('uint8'),
                      np.ones((7, 7), np.uint8), iterations=1)
    edit = np.where((alpha > 4) | (mask > 0), edit, 0).astype('uint8')
    for _ in range(4):
        fringe = cv2.dilate(edit, np.ones((3, 3), np.uint8))
        edit = np.where((alpha < 10) & (fringe > 0), 1, edit).astype('uint8')
    edit *= 255
    flag = cv2.INPAINT_TELEA if method == 'telea' else cv2.INPAINT_NS
    generated_rgb = cv2.inpaint(rgb, edit, 8, flag)
    # Only regions covered by original art: no background or source edits.
    generated_alpha = np.where(mask > 0, alpha, 0).astype('uint8')
    patch = Image.fromarray(np.dstack((generated_rgb, generated_alpha)), 'RGBA')
    return patch, Image.fromarray(edit, 'L')


def compose(parts, patch, angle):
    scene = parts['source-remainder-with-unpainted-gaps'].copy()
    scene.alpha_composite(patch)
    scene.alpha_composite(parts['image-right-visible-hand-only'])
    moved = parts['image-left-arm'].rotate(
        angle, center=(165, 400), resample=Image.Resampling.BICUBIC,
        expand=False)
    scene.alpha_composite(moved)
    return scene


def holes(src, pose):
    original = np.array(src.getchannel('A')) > 127
    rendered = np.array(pose.getchannel('A')) > 127
    return int(np.count_nonzero(original & ~rendered))


def paper(src):
    bg = Image.new('RGBA', src.size, (250, 247, 239, 255))
    bg.alpha_composite(src)
    return bg.convert('RGB')


def make_comparison(original, moved, target):
    left, right = paper(original), paper(moved)
    out = Image.new('RGB', (1120, 1140), (232, 232, 227))
    out.paste(left, (22, 68))
    out.paste(right, (584, 68))
    draw = ImageDraw.Draw(out)
    draw.text((22, 22), 'LEFT: LOCKED STORESOSTER V1', fill=(31, 31, 31))
    draw.text((584, 22), 'RIGHT: +12 DEG UNDERPAINT EXPERIMENT', fill=(31, 31, 31))
    draw.text((584, 42), 'NOT OWNER APPROVED / NOT ANIMATED V2 ART', fill=(148, 35, 35))
    out.save(target, quality=92)


def build(source: Path, output: Path):
    data = source.read_bytes()
    if hashlib.sha256(data).hexdigest() != SOURCE_SHA:
        raise ValueError('Locked Storesoster V1 changed: refused')
    study = source_study()
    original = study.pinned_source(source)
    masks, layers, reconstructed = study.separate_exact(original)
    if reconstructed.tobytes() != original.tobytes():
        raise AssertionError('Source-neutral RGBA is not pixel-exact')

    output.mkdir(parents=True, exist_ok=True)
    previews = output / 'previews'
    previews.mkdir(exist_ok=True)
    blank = Image.new('RGBA', original.size, (0, 0, 0, 0))
    angles = (-12, -6, 0, 6, 12)
    baseline = {str(angle): holes(original, compose(layers, blank, angle))
                for angle in angles}
    patched = {}
    for method in ('telea', 'navier-stokes'):
        layer, edit_mask = underpaint(original, masks['image-left-arm'], method)
        layer.save(output / ('underpaint-' + method + '-512.png'))
        study.to_master(layer).save(output / ('underpaint-' + method + '-2048.png'))
        edit_mask.save(output / ('edit-mask-' + method + '-512.png'))

        results = {angle: compose(layers, layer, angle) for angle in angles}
        # This is an actual composed neutral pose, not a screenshot bypass.
        if results[0].tobytes() != original.tobytes():
            raise AssertionError('Neutral pose with underpaint changed V1 RGBA')
        patched[method] = {str(angle): holes(original, image)
                           for angle, image in results.items()}
        for angle in (-12, 12):
            results[angle].save(previews / (method + '-pose-' + str(angle) + '.png'))
        if method == 'telea':
            make_comparison(original, results[12],
                            previews / 'source-vs-telea-plus12.jpg')
            frames = []
            for angle in (0, 6, 12, 6, 0, -6, -12, -6):
                image = paper(compose(layers, layer, angle))
                d = ImageDraw.Draw(image)
                d.rectangle((0, 0, 512, 56), fill=(255, 254, 250))
                d.text((12, 10), 'STORESOSTER SOURCE ART EXPERIMENT', fill=(44, 39, 32))
                d.text((12, 30), str(angle) + ' degrees / NOT approved animation',
                       fill=(155, 41, 40))
                frames.append(image)
            frames[0].save(previews / 'animated-underpaint-diagnostic.gif',
                           save_all=True, append_images=frames[1:],
                           duration=300, loop=0, optimize=False)

    # A filled contour is not proof that texture, anatomical joints or
    # detached hands look credible. The approval gate deliberately fails.
    result = {
        'sourceSHA256': SOURCE_SHA, 'sourceCanvas': [512, 1024],
        'layerCanvas': [2048, 2048], 'sourceRGBAExact': True,
        'compositedNeutralRGBAExact': True,
        'holesBefore': baseline, 'holesAfter': patched,
        'underpaintMethods': ['telea', 'navier-stokes'],
        'completeSecondArm': False, 'headFaceSeparated': False,
        'underlyingAnatomyArtistApproved': False,
        'ownerApproved': False, 'readyForRuntime': False,
        'artGate': 'BLOCKED',
        'limitations': [
            'Source masks include fragments of hair and costume',
            'Inpainting is a texture proxy, not painted hidden anatomy',
            'Visible shoulder and wrist seams remain at rotation',
            'Only a small fragment of the other arm exists'
        ]
    }
    (output / 'manifest.json').write_text(json.dumps(
        result, indent=2, ensure_ascii=False), encoding='utf-8')
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', default='laer-litt-mer/assets/gangemagi-troll/storesoster.webp')
    parser.add_argument('--out', default='out/laria/storesoster-v1-underpaint-study')
    args = parser.parse_args()
    print(json.dumps(build(Path(args.source), Path(args.out)),
                     ensure_ascii=False, indent=2))
