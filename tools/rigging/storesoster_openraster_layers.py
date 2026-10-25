#!/usr/bin/env python3
"""Editable ORIGINAL Storesoster arm-layers. Not a production rig.
Visible pixels are only from the locked WebP; concealed anatomy stays EMPTY.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path
import xml.etree.ElementTree as ET
import zipfile

import numpy as np
from PIL import Image, ImageDraw
from storesoster_arm_layer_study import (
    LOCKED_SHA256, SHOULDER_PIVOT, SIZE, split_original, exposed_pixels
)

def png(image):
    buf = io.BytesIO()
    image.save(buf, format='PNG')
    return buf.getvalue()

def entry(z, name, data, compressed=True):
    i = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
    i.compress_type = zipfile.ZIP_DEFLATED if compressed else zipfile.ZIP_STORED
    i.external_attr = 0o644 << 16
    z.writestr(i, data)

def stack_xml(layers):
    root = ET.Element('image', {
        'w': str(SIZE[0]), 'h': str(SIZE[1]),
        'name': 'Laria Storesoster - EDITABLE STUDY, NOT APPROVED',
        'version': '0.0.3'
    })
    stack = ET.SubElement(root, 'stack')
    for item in layers:
        ET.SubElement(stack, 'layer', {
            'name': item['name'], 'src': item['file'],
            'visibility': 'visible' if item['visible'] else 'hidden',
            'opacity': '1.0', 'composite-op': 'svg:src-over',
            'x': '0', 'y': '0',
        })
    return b'<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(root, encoding='utf-8')

def create(source, output):
    source = Path(source)
    output = Path(output)
    sha = hashlib.sha256(source.read_bytes()).hexdigest()
    if sha != LOCKED_SHA256:
        raise RuntimeError('STOP: unapproved Storesoster source: ' + sha)
    original = Image.open(source).convert('RGBA')
    if original.size != SIZE:
        raise RuntimeError('STOP: source dimensions are incorrect')
    _, arm, body = split_original(original)
    composed = Image.alpha_composite(body, arm)
    before, after = np.asarray(original), np.asarray(composed)
    ink = before[:, :, 3] > 0
    if (not np.array_equal(before[:, :, 3], after[:, :, 3])
        or not np.array_equal(before[:, :, :3][ink], after[:, :, :3][ink])):
        raise RuntimeError('STOP: neutral source pixels were changed')
    underpaint = Image.new('RGBA', SIZE, (0, 0, 0, 0))
    pivot = Image.new('RGBA', SIZE, (0, 0, 0, 0))
    x, y = SHOULDER_PIVOT
    draw = ImageDraw.Draw(pivot)
    draw.ellipse((x-13, y-13, x+13, y+13), outline=(10, 164, 204, 220), width=3)
    draw.line((x-22, y, x+22, y), fill=(10, 164, 204, 220), width=2)
    draw.line((x, y-22, x, y+22), fill=(10, 164, 204, 220), width=2)
    union = np.zeros((SIZE[1], SIZE[0]), dtype=bool)
    rotations = {}
    for angle in (-25, -12, 0, 12, 25):
        _, holes, count, err = exposed_pixels(original, arm, body, angle)
        if angle == 0 and (count or err):
            raise RuntimeError('STOP: neutral reconstruction is not exact')
        union |= holes
        rotations[str(angle)] = {'unpainted_pixels': count, 'mean_rgba_delta': round(err, 5)}
    pink = Image.new('RGBA', SIZE, (255, 44, 110, 0))
    pink.putalpha(Image.fromarray(np.where(union, 150, 0).astype(np.uint8)))
    layers = [
        {'name': '05 Pivot - editing guide (HIDDEN)', 'file': 'data/05-pivot.png', 'visible': False, 'img': pivot},
        {'name': '04 Missing cloth/shoulder (PINK GUIDE - HIDDEN)', 'file': 'data/04-gap-guide.png', 'visible': False, 'img': pink},
        {'name': '03 Moving arm - LOCKED visible source pixels', 'file': 'data/03-arm.png', 'visible': True, 'img': arm},
        {'name': '02 PAINT HERE - hidden anatomy and fabric (EMPTY)', 'file': 'data/02-underpaint.png', 'visible': True, 'img': underpaint},
        {'name': '01 Body behind arm - original pixels', 'file': 'data/01-body.png', 'visible': True, 'img': body},
        {'name': '00 Full original reference (HIDDEN)', 'file': 'data/00-original.png', 'visible': False, 'img': original}
    ]
    meta = {
        'source_sha256': sha, 'size': list(SIZE),
        'pivot_xy': list(SHOULDER_PIVOT),
        'original_visible_pixels_preserved': True,
        'hidden_anatomy_reconstructed': False,
        'art_approved': False,
        'integrated_in_app': False,
        'experimental_rotations': rotations,
        'layers_top_to_bottom': [
            {'name': l['name'], 'visible': l['visible']} for l in layers
        ]
    }
    output.mkdir(parents=True, exist_ok=True)
    ora = output / 'Laria_Storesoster_Originaltro_Armlag_IKKE_GODKJENT.ora'
    with zipfile.ZipFile(ora, 'w') as z:
        entry(z, 'mimetype', b'image/openraster', compressed=False)
        entry(z, 'stack.xml', stack_xml(layers))
        for layer in layers:
            entry(z, layer['file'], png(layer['img']))
        entry(z, 'mergedimage.png', png(composed))
        thumb = composed.copy()
        thumb.thumbnail((256, 256), resample=Image.Resampling.LANCZOS)
        entry(z, 'Thumbnails/thumbnail.png', png(thumb))
        entry(z, 'source/approved-storesoster.webp', source.read_bytes())
        entry(z, 'source/rig-readiness.json', (json.dumps(meta, indent=2) + '\n').encode())
    for filename, image in [
        ('01-locked-original.png', original),
        ('02-body-with-gap.png', body),
        ('03-visible-arm.png', arm),
        ('04-missing-areas-guide.png', pink),
        ('05-shoulder-pivot.png', pivot),
        ('06-neutral-recomposition.png', composed)
    ]:
        (output / filename).write_bytes(png(image))
    (output / 'rig-readiness.json').write_text(json.dumps(meta, indent=2) + '\n', encoding='utf8')
    (output / 'READ-ME-FIRST.txt').write_text(
        'EDITABLE STUDY ONLY - NOT A PRODUCTION CHARACTER RIG.\n'
        'Open ORA in Krita or GIMP. Paint ONLY the deliberately EMPTY hidden\n'
        'underpaint layer behind the moving arm, matching the locked original.\n'
        'The source image and other visible pixels must remain unchanged.\n'
        'Use hidden guides for exposed areas and shoulder pivot.\n'
        'Do not integrate, merge or publish until visually approved.\n',
        encoding='utf8')
    return ora, meta

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--source', default='laer-litt-mer/assets/gangemagi-troll/storesoster.webp')
    p.add_argument('--output', default='/tmp/laria-storesoster-layer-kit')
    args = p.parse_args()
    ora, meta = create(args.source, args.output)
    print(json.dumps({'file': str(ora), 'source_sha256': meta['source_sha256'],
        'approved': meta['art_approved'], 'poses': meta['experimental_rotations']}, indent=2))
