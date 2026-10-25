#!/usr/bin/env python3
"""Artist handoff V2, original pixels ONLY. NOT a finished puppet or premium artwork."""
import argparse
import hashlib
import io
import json
from pathlib import Path
import xml.etree.ElementTree as ET
import zipfile

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from storesoster_arm_layer_study import LOCKED_SHA256, SIZE, SHOULDER_PIVOT, split_original

ANGLES = (-25, -12, 0, 12, 25)
# Material guides describe the task; they are NOT newly illustrated anatomy.
MATERIALS = [
    ('hair', (112, 71, 48, 160)),
    ('sleeve', (235, 147, 134, 160)),
    ('dress', (146, 80, 153, 160)),
    ('waist', (196, 140, 69, 160)),
]

def png(img):
    out = io.BytesIO()
    img.save(out, format='PNG')
    return out.getvalue()

def zadd(z, name, value, store=False):
    info = zipfile.ZipInfo(name, (1980, 1, 1, 0, 0, 0))
    info.compress_type = zipfile.ZIP_STORED if store else zipfile.ZIP_DEFLATED
    info.external_attr = 0o644 << 16
    z.writestr(info, value)

def build(source, output):
    source, output = Path(source), Path(output)
    raw = source.read_bytes()
    if hashlib.sha256(raw).hexdigest() != LOCKED_SHA256:
        raise ValueError('STOP: locked Storesoster source checksum mismatch')
    original = Image.open(source).convert('RGBA')
    if original.size != SIZE:
        raise ValueError('STOP: locked Storesoster source dimension mismatch')
    _, original_arm, _ = split_original(original)
    pixels = np.asarray(original)
    a = pixels[:, :, 3]
    mask0 = np.asarray(original_arm.getchannel('A')) > 0
    y, x = np.indices(mask0.shape)
    rgb = pixels[:, :, :3].astype(float)
    red, green, blue = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    # Source-color only, constrained to missing fingertip area in the original.
    skin = ((red > 150) & (green > 80) & (blue > 55)
            & (red > green * 1.22) & (green > blue * 1.02)
            & (red - green > 30) & (a > 220))
    near_arm = np.asarray(
        Image.fromarray(np.uint8(mask0 * 255), 'L').filter(ImageFilter.MaxFilter(11))
    ) > 0
    candidate = (skin & (x >= 205) & (x <= 275)
                 & (y >= 470) & (y <= 543) & near_arm & ~mask0)
    widened = np.asarray(
        Image.fromarray(np.uint8(candidate * 255), 'L').filter(ImageFilter.MaxFilter(3))
    ) > 0
    final_mask = (mask0 | widened) & (a > 0)
    arm = original.copy()
    arm.putalpha(Image.fromarray(np.where(final_mask, a, 0).astype('uint8'), 'L'))
    body = original.copy()
    body.putalpha(Image.fromarray(np.where(final_mask, 0, a).astype('uint8'), 'L'))
    neutral = Image.alpha_composite(body, arm)
    npic = np.asarray(neutral)
    assert np.array_equal(npic[:, :, 3], a)
    assert np.array_equal(npic[:, :, :3][a > 0], pixels[:, :, :3][a > 0])
    output.mkdir(parents=True, exist_ok=True)

    poses = {}
    all_holes = np.zeros(mask0.shape, dtype=bool)
    panels = []
    for angle in ANGLES:
        moved = arm.rotate(angle, resample=Image.Resampling.BICUBIC,
                           center=SHOULDER_PIVOT, expand=False)
        result = Image.alpha_composite(body, moved)
        holes = (a > 150) & (np.asarray(result.getchannel('A')) < 60)
        poses[str(angle)] = int(holes.sum())
        all_holes |= holes
        if angle == 0:
            assert poses['0'] == 0, 'STOP: neutral pose has missing pixels'
        canvas = Image.new('RGBA', SIZE, '#f3e8dc')
        canvas.alpha_composite(result)
        red_holes = np.zeros((SIZE[1], SIZE[0], 4), dtype=np.uint8)
        red_holes[holes] = (255, 35, 110, 235)
        canvas.alpha_composite(Image.fromarray(red_holes, 'RGBA'))
        panels.append(canvas.crop((52, 315, 353, 650)).resize((480, 535)).convert('RGB'))

    sheet = Image.new('RGB', (480 * len(panels), 570), '#fff8ef')
    d = ImageDraw.Draw(sheet)
    for i, panel in enumerate(panels):
        sheet.paste(panel, (i * 480, 35))
        d.text((i * 480 + 12, 12),
               '%+d degrees / MISSING %d px' % (ANGLES[i], poses[str(ANGLES[i])]),
               fill='#643f2f')
    sheet.save(output / '01-5-poses-with-HOLES-NOT-APPROVED.png')

    red_holes = np.zeros((SIZE[1], SIZE[0], 4), dtype=np.uint8)
    red_holes[all_holes] = (255, 35, 110, 155)
    gap = Image.fromarray(red_holes, 'RGBA')
    blue_new_mask = np.zeros_like(red_holes)
    blue_new_mask[final_mask & ~mask0] = (0, 217, 240, 190)
    diagnostic = Image.new('RGBA', SIZE, '#f3e8dc')
    diagnostic.alpha_composite(original)
    diagnostic.alpha_composite(gap)
    diagnostic.alpha_composite(Image.fromarray(blue_new_mask, 'RGBA'))
    diagnostic.crop((55, 345, 315, 587)).resize((1040, 968)).convert('RGB').save(
        output / '02-hand-mask-V2-and-hidden-art-map.png')

    zones = {
        'hair': all_holes & (x < 162),
        'sleeve': all_holes & (x >= 162) & (y < 445),
        'dress': all_holes & (x >= 162) & (y >= 445) & (y < 491),
        'waist': all_holes & (x >= 162) & (y >= 491),
    }
    painter_guide = Image.new('RGBA', SIZE, '#f3e8dc')
    painter_guide.alpha_composite(body)
    colors = Image.new('RGBA', SIZE, (0, 0, 0, 0))
    for name, rgba in MATERIALS:
        plane = np.zeros_like(red_holes)
        plane[zones[name]] = rgba
        colors.alpha_composite(Image.fromarray(plane, 'RGBA'))
    painter_guide.alpha_composite(colors)
    # Intentionally OMIT the arm so the hidden painting zones remain visible.
    painter_guide.crop((50, 315, 350, 652)).resize((900, 1011)).convert('RGB').save(
        output / '03-under-arm-material-zones-NOT-PAINT.png')

    pivot = Image.new('RGBA', SIZE, (0, 0, 0, 0))
    pd = ImageDraw.Draw(pivot)
    px, py = SHOULDER_PIVOT
    pd.ellipse((px-14, py-14, px+14, py+14), outline='#0090bd', width=3)
    pd.line((px-23, py, px+23, py), fill='#0090bd', width=2)
    pd.line((px, py-23, px, py+23), fill='#0090bd', width=2)
    blank = Image.new('RGBA', SIZE, (0, 0, 0, 0))
    layers = [
        ('09 Exact neutral ORIGINAL (hidden)', 'data/09-original.png', original, False),
        ('08 Shoulder pivot GUIDE (hidden)', 'data/08-pivot.png', pivot, False),
        ('07 Exposed pixels GUIDE (hidden)', 'data/07-holes.png', gap, False),
        ('06 Moving arm + fingertips REVIEW (visible)', 'data/06-arm.png', arm, True),
        ('05 PAINT hair under arm - EMPTY', 'data/05-hair.png', blank, True),
        ('04 PAINT sleeve under arm - EMPTY', 'data/04-sleeve.png', blank, True),
        ('03 PAINT dress under arm - EMPTY', 'data/03-dress.png', blank, True),
        ('02 PAINT waist under arm - EMPTY', 'data/02-waist.png', blank, True),
        ('01 Original body behind arm (visible)', 'data/01-body.png', body, True),
        ('00 Material color-guide only (hidden)', 'data/00-colors.png', colors, False),
    ]
    root = ET.Element('image', {'w': str(SIZE[0]), 'h': str(SIZE[1]),
                                'name': 'Laria Storesoster V2 - PAINT REQUIRED',
                                'version': '0.0.3'})
    stack = ET.SubElement(root, 'stack')
    for label, fname, _, visibility in layers:
        ET.SubElement(stack, 'layer', {'name': label, 'src': fname,
            'visibility': 'visible' if visibility else 'hidden',
            'opacity': '1.0', 'composite-op': 'svg:src-over', 'x': '0', 'y': '0'})
    ora = output / 'Laria_Storesoster_V2_Artist_Handoff_NOT_APPROVED.ora'
    with zipfile.ZipFile(ora, 'w') as z:
        zadd(z, 'mimetype', b'image/openraster', store=True)
        zadd(z, 'stack.xml',
             b'<?xml version="1.0" encoding="UTF-8"?>\n'
             + ET.tostring(root, encoding='utf-8'))
        for _, fname, art, _ in layers:
            zadd(z, fname, png(art))
        zadd(z, 'mergedimage.png', png(neutral))
        thumb = neutral.copy()
        thumb.thumbnail((256, 256))
        zadd(z, 'Thumbnails/thumbnail.png', png(thumb))
        zadd(z, 'source/approved-storesoster.webp', raw)
    output.joinpath('04-original-neutral.png').write_bytes(png(original))
    output.joinpath('05-original-arm-V2-mask.png').write_bytes(png(arm))
    output.joinpath('06-original-body-with-gap.png').write_bytes(png(body))

    metrics = {
        'source_sha256': LOCKED_SHA256,
        'canvas': list(SIZE),
        'neutral_rgba_visible_pixel_changes': 0,
        'added_original_fingertip_mask_pixels': int((final_mask & ~mask0).sum()),
        'missing_pixels_per_angle': poses,
        'paint_layers_intentionally_empty': True,
        'source_pixels_regenerated': False,
        'premium_ready': False, 'anatomy_approved': False,
        'integrated_in_app': False,
        'needs': 'Manual artist painting of hidden original-faithful hair, sleeve, dress and waist, then joint/pose QA.'
    }
    output.joinpath('source-mask-readiness.json').write_text(
        json.dumps(metrics, indent=2, ensure_ascii=False) + '\n')
    output.joinpath('READ-ME-FIRST.txt').write_text(
        'STORESOSTER V2: EDITABLE 10-LAYER ART HANDOFF, NOT AN APPROVED RIG.\n'
        'Open ORA in Krita/GIMP. The four paint layers are deliberately EMPTY.\n'
        'Keep visible character identity and 0-degree pose pixel-identical to locked source.\n'
        'Pink regions show missing hidden anatomy. Cyan shows hand mask extension.\n'
        'Color zoning is diagnostic, not painted artwork. Fix anatomy and hand edge by hand.\n'
        'Reject holes, ghost fingers, unnatural shoulder or visible seams at -25/-12/12/25.\n'
        'Never integrate into app or advertise as finished character before sign-off.\n')
    # Test the actual deliverable, not merely a source-code assertion.
    with zipfile.ZipFile(ora) as z:
        assert z.testzip() is None
        assert z.read('source/approved-storesoster.webp') == raw
        assert len(list(ET.fromstring(z.read('stack.xml')).find('stack'))) == 10
        for tag in ('05-hair', '04-sleeve', '03-dress', '02-waist'):
            layer = Image.open(io.BytesIO(z.read('data/' + tag + '.png'))).convert('RGBA')
            assert layer.getchannel('A').getbbox() is None
    assert metrics['added_original_fingertip_mask_pixels'] > 100
    assert all(poses[str(x)] > 1000 for x in ANGLES if x)
    print(json.dumps(metrics, indent=2, ensure_ascii=False))
    return metrics

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    build(args.source, args.output)
