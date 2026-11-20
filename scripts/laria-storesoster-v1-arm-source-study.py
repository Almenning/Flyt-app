#!/usr/bin/env python3
"""Non-production Storesoster V1 anatomical arm-source study.

Builds three disjoint, source-pixel-exact staging images, mask and motion
checks. Does NOT invent missing hidden anatomy or pass the art gate. This
file is intentionally independent of the live app and approved assets.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw

LOCKED_SHA256 = 'b98a5ee7f264d448da557636406080b5d8ee8aae23f32f0e41b66bf811beda89'
LOCKED_BLOB = 'a8fba47e272e2856bd78b92fb262146506e828ed'
SIZE = (512, 1024)
CANVAS = (2048, 2048)
OFFSET = (512, 0)

# Trace on actual locked 512x1024 art. Names are IMAGE-SIDE, not anatomy-side.
# The image-left limb is visible and bent; the image-right upper arm is hidden
# by hair and satchel. Only a small hand fragment can be separated on right.
# Both boundaries still require human correction in a true animation rig.
IMAGE_LEFT_ARM = [
    (167,383),(151,388),(128,399),(108,412),(93,427),
    (86,439),(87,451),(99,466),(112,476),(131,482),
    (149,479),(164,484),(173,500),(188,515),(203,523),
    (221,520),(233,510),(246,515),(255,507),(261,500),
    (259,492),(252,481),(239,473),(223,469),(208,471),
    (193,477),(183,472),(170,456),(160,438),(168,419),
    (184,411),(183,396)
]
IMAGE_RIGHT_HAND_FRAGMENT = [
    (416,567),(425,569),(437,578),(440,586),(437,595),
    (429,602),(417,604),(411,598),(408,586),(411,574)
]


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def pinned_source(path: Path) -> Image.Image:
    data = path.read_bytes()
    blob = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
    if sha256(data) != LOCKED_SHA256 or blob != LOCKED_BLOB:
        raise ValueError('Locked Storesoster V1 changed; source study fails closed.')
    with Image.open(path) as loaded:
        if loaded.size != SIZE or loaded.mode != 'RGBA':
            raise ValueError('Expected original 512x1024 RGBA Storesoster V1.')
        return loaded.copy()


def polygon(points):
    mask = Image.new('L', SIZE, 0)
    ImageDraw.Draw(mask).polygon(points, fill=255)
    return mask


def separate_exact(src):
    left = polygon(IMAGE_LEFT_ARM)
    right = polygon(IMAGE_RIGHT_HAND_FRAGMENT)
    overlap = ImageChops.multiply(left, right)
    if overlap.getbbox() is not None:
        raise ValueError('Source pixel mask overlap; no layer may own same pixels.')
    body = ImageChops.invert(ImageChops.lighter(left, right))
    masks = {'image-left-arm': left, 'image-right-visible-hand-only': right,
             'source-remainder-with-unpainted-gaps': body}
    layers = {}
    reconstructed = Image.new('RGBA', SIZE, (0,0,0,0))
    for name,mask in masks.items():
        piece = Image.new('RGBA',SIZE,(0,0,0,0))
        piece.paste(src,(0,0),mask)
        layers[name] = piece
        reconstructed.paste(piece,(0,0),mask)
    if reconstructed.tobytes() != src.tobytes():
        raise AssertionError('Neutral source RGBA pixel reconstruction differs.')
    return masks, layers, reconstructed


def to_master(image):
    art = image.resize((1024,2048),Image.Resampling.NEAREST)
    master = Image.new('RGBA',CANVAS,(0,0,0,0))
    master.paste(art,OFFSET)
    return master


def on_paper(image,size=None):
    if size: image=image.resize(size,Image.Resampling.LANCZOS)
    paper=Image.new('RGBA',image.size,(244,243,239,255))
    paper.alpha_composite(image)
    return paper.convert('RGB')


def annotate_mask(src, masks, path):
    paper=on_paper(src).convert('RGBA')
    overlay=Image.new('RGBA',SIZE,(0,0,0,0))
    d=ImageDraw.Draw(overlay)
    d.polygon(IMAGE_LEFT_ARM,fill=(12,127,245,110),outline=(4,82,164,255),width=2)
    d.polygon(IMAGE_RIGHT_HAND_FRAGMENT,fill=(235,110,16,165),outline=(146,68,4,255),width=2)
    paper.alpha_composite(overlay)
    out=paper.convert('RGB')
    d=ImageDraw.Draw(out)
    d.rectangle((2,2,508,37),fill=(249,249,247))
    d.text((8,9),'BLUE: left-side bent arm / ORANGE: right hand fragment',fill=(25,25,25))
    out.save(path)


def diagnostic(src, layers, out):
    left=layers['image-left-arm']
    other=layers['image-right-visible-hand-only']
    base=layers['source-remainder-with-unpainted-gaps']
    angles=(0,6,12,6,0,-6,-12,-6)
    frames=[]
    details=[]
    for angle in angles:
        rotated=left.rotate(angle,center=(165,400),resample=Image.Resampling.BICUBIC,expand=False)
        scene=Image.new('RGBA',SIZE,(0,0,0,0))
        scene.alpha_composite(base)
        scene.alpha_composite(other)
        scene.alpha_composite(rotated)
        # Missing original silhouette after moving source-pixel limbs; this
        # quantifies absence of the hidden paint, not a final rendering error.
        src_a=src.getchannel('A').point(lambda a:255 if a>127 else 0)
        dst_a=scene.getchannel('A').point(lambda a:255 if a>127 else 0)
        missing=ImageChops.subtract(src_a,dst_a)
        pixels=sum(1 for val in missing.tobytes() if val>0)
        p=on_paper(scene).convert('RGBA')
        highlight=Image.new('RGBA',SIZE,(0,0,0,0))
        highlight.putalpha(missing.point(lambda val:165 if val>0 else 0))
        red=Image.new('RGBA',SIZE,(227,40,42,0))
        red.putalpha(highlight.getchannel('A'))
        p.alpha_composite(red)
        panel=p.convert('RGB')
        d=ImageDraw.Draw(panel)
        d.rectangle((0,0,511,65),fill=(250,248,242))
        d.text((11,10),'SOURCE-BASED RIG DIAGNOSTIC - NOT V2 ANIMATION',fill=(50,35,25))
        d.text((11,32),'Arm angle: %+d deg; exposed unpainted pixels: %d'%(angle,pixels),fill=(154,23,23))
        frames.append(panel)
        details.append({'angle_deg':angle,'source_silhouette_uncovered_pixels':pixels})
    # 0 deg image should visually equal original. More precise exact check is
    # performed separately in separate_exact, before any resampling.
    frames[2].save(out/'pose-plus12-missing-underpaint.png')
    frames[6].save(out/'pose-minus12-missing-underpaint.png')
    frames[0].save(out/'pose-neutral-diagnostic.png')
    frames[0].save(out/'pose-motion-study.gif',save_all=True,append_images=frames[1:],duration=240,loop=0,optimize=False)
    return details


def build(source,out):
    src=pinned_source(source)
    masks,layers,reconstructed=separate_exact(src)
    out.mkdir(parents=True,exist_ok=True)
    layer_dir=out/'layers';preview_dir=out/'previews'
    layer_dir.mkdir(exist_ok=True);preview_dir.mkdir(exist_ok=True)
    src_master=to_master(src)
    src_master.save(out/'source-exact-master-2048.png',optimize=True)
    reconstructed.save(preview_dir/'pixel-exact-neutral-512.png')
    annotate_mask(src,masks,preview_dir/'mask-areas-V1.png')
    layer_files={}
    for name,im in layers.items():
        file=layer_dir/(name+'-2048.png')
        to_master(im).save(file,optimize=True)
        layer_files[name]={'file':str(file.relative_to(out)), 'sha256':sha256(file.read_bytes()),
                           'visible_pixel_count':sum(1 for a in im.getchannel('A').tobytes() if a>0)}
    motions=diagnostic(src,layers,preview_dir)
    manifest={'schema':1,'identity':'storesoster','source':str(source.name),
              'source_sha256':LOCKED_SHA256,'source_git_blob':LOCKED_BLOB,
              'canvas':list(CANVAS),'source_canvas':list(SIZE),
              'art_rect':[512,0,1024,2048],
              'neutral_RGBA_bytes_exact':True,'overlapping_mask_pixels':0,
              'layers':layer_files,'motion_diagnostics':motions,
              'underpainted_occluded_anatomy':False,
              'head_and_face_separated':False,
              'complete_second_arm':False,
              'ownerApproved':False,'readyForRuntime':False,
              'artGate':'BLOCKED',
              'note':'Not an actual TrollActor v2 art pack. Source fragments still contain occlusions. Must repaint hidden shoulder, wrist, torso and right arm surfaces before real motion.'}
    (out/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    return manifest


if __name__=='__main__':
    ap=argparse.ArgumentParser()
    ap.add_argument('--source',default='laer-litt-mer/assets/gangemagi-troll/storesoster.webp')
    ap.add_argument('--out',default='out/laria/storesoster-v1-arm-source-study')
    args=ap.parse_args()
    r=build(Path(args.source),Path(args.out))
    print(json.dumps({'status':r['artGate'],'neutral_exact':r['neutral_RGBA_bytes_exact'],
                      'layers':list(r['layers']),'motion':r['motion_diagnostics']},indent=2))
