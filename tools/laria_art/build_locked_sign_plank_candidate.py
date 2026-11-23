#!/usr/bin/env python3
"""Generate REVIEW-ONLY wooden sign artwork from the locked 2026-11-22 PNG.

Unlike the retired repeating-linear-gradient CSS, this pilot preserves
the outer silhouette, genuine painted timber/nails and shadow from the
approved source. Lettering and medallions remain *independent layers*.

A large source-text/icon region is reconstructed, not artist-approved.
Outputs are deliberately outside application runtime and MUST NOT be
activated or merged as finished artwork without visual owner sign-off.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "laer-litt-mer/assets/ui/locked-reference/laria-sign-master-v1.png"
LOCKED_SHA256 = "1b3cdb93f04b95b7b0850653827cb5e6235a69afc5c94e39ab5eba78640678db"
REGION = (60, 215, 525, 337)
SILHOUETTE = [
 (16,64),(23,46),(38,31),(54,14),(74,8),(95,6),(379,12),
 (416,15),(443,29),(455,48),(462,62),(454,76),(438,94),
 (416,107),(107,115),(78,114),(53,107),(38,97),(24,80)
]

def text_font(size):
    paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSerif-Bold.ttf",
    ]
    for path in paths:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()

def locked_master():
    digest = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    if digest != LOCKED_SHA256:
        raise ValueError("Approved artwork SHA-256 mismatch; stop source extraction")
    image = Image.open(SOURCE).convert("RGB")
    if image.size != (1122,1402):
        raise ValueError("Approved sign master dimensions changed")
    return image

def blank_board(master):
    board = master.crop(REGION).convert("RGB")
    w, h = board.size
    alpha = Image.new("L", (w,h),0)
    draw = ImageDraw.Draw(alpha)
    draw.polygon(SILHOUETTE, fill=255)
    # Erode alpha 2px: excludes a thin blue/green matte from the photograph.
    alpha = alpha.filter(ImageFilter.MinFilter(5))
    hole = Image.new("L", (w,h),0)
    brush = ImageDraw.Draw(hole)
    brush.ellipse((81,8,211,114),fill=255)
    brush.rectangle((198,21,414,106),fill=255)
    hole = hole.filter(ImageFilter.MaxFilter(7))
    safe = alpha.filter(ImageFilter.MinFilter(9))
    pix = np.array(board, dtype=np.float32)
    allowed = (np.array(hole,dtype=np.uint16)*np.array(safe,dtype=np.uint16)/255).astype(np.uint8)
    synthetic = pix.copy()
    rng = np.random.default_rng(20261122)
    xcoords = np.arange(w,dtype=np.float32)
    for y in range(14,h-14):
        xs = np.flatnonzero(allowed[y]>0)
        if not len(xs):
            continue
        left = np.median(pix[y,76:91,:],axis=0)
        right = np.median(pix[y,406:426,:],axis=0)
        t = np.clip((xs-91)/(406-91),0,1)
        mix = t*t*(3-2*t)
        synthetic[y,xs] = (1-mix[:,None])*left + mix[:,None]*right
    grain = (
        (2.2*np.sin(np.arange(h)*.68)
        +1.8*np.sin(np.arange(h)*1.4+.4)
        +1.1*np.sin(np.arange(h)*2.3+1.7)
        +1.2*np.sin(np.arange(h)*.13))[:,None]
        +2.4*np.sin(.53*np.arange(h)[:,None]+.025*xcoords[None,:]+1.2)
        +1.6*np.sin(1.13*np.arange(h)[:,None]+.034*xcoords[None,:]+1.2)
        +rng.normal(0,1.8,(h,w))
    )
    synthetic = np.clip(synthetic + grain[:,:,None],0,255)
    blend = np.array(hole.filter(ImageFilter.GaussianBlur(2.3)),dtype=np.float32)/255
    blend *= np.array(safe,dtype=np.float32)/255
    composited = np.clip((1-blend[:,:,None])*pix + blend[:,:,None]*synthetic,0,255).astype("uint8")
    rgba = Image.fromarray(np.dstack([composited,np.array(alpha,dtype="uint8")]),"RGBA")
    return rgba.resize((1395,366),Image.Resampling.LANCZOS)

def sign(plank, name, kind):
    picture=plank.copy()
    over=Image.new("RGBA",picture.size,(0,0,0,0))
    pen=ImageDraw.Draw(over)
    cx,cy=435,179
    # Dark wooden, inset relief medal. Graphic subject symbols may vary.
    pen.ellipse((cx-111,cy-104,cx+113,cy+116),fill=(33,18,9,110))
    pen.ellipse((cx-108,cy-110,cx+108,cy+106),fill=(82,41,19),outline=(41,21,7),width=6)
    pen.ellipse((cx-101,cy-107,cx+103,cy+96),outline=(232,168,69),width=10)
    pen.ellipse((cx-88,cy-94,cx+89,cy+86),fill=(66,34,17),outline=(29,15,7),width=9)
    pen.arc((cx-99,cy-104,cx+100,cy+102),185,325,fill=(255,219,131),width=7)
    if kind=="bubble":
        pen.rounded_rectangle((cx-49,cy-30,cx+50,cy+34),radius=21,fill=(252,221,152),outline=(35,15,7),width=6)
        pen.polygon([(cx-24,cy+28),(cx-36,cy+57),(cx+2,cy+28)],fill=(252,221,152))
        for dx in (-25,0,25):
            pen.ellipse((cx+dx-6,cy-4,cx+dx+6,cy+8),fill=(76,39,15))
    elif kind=="book":
        pen.polygon([
            (cx-67,cy-29),(cx-41,cy-37),(cx-5,cy-35),(cx,cy-27),
            (cx+5,cy-35),(cx+44,cy-37),(cx+65,cy-29),(cx+65,cy+39),
            (cx+17,cy+32),(cx,cy+43),(cx-17,cy+32),(cx-66,cy+39)
        ],fill=(252,221,152))
        pen.line([(cx,cy-27),(cx,cy+43)],fill=(58,33,15),width=5)
        pen.line([(cx-66,cy-27),(cx-66,cy+40),(cx-16,cy+31),(cx,cy+44),
                  (cx+16,cy+31),(cx+65,cy+40),(cx+65,cy-27)],fill=(58,33,15),width=6)
    else:
        icon=text_font(62)
        bbox=pen.textbbox((0,0),"ABC",font=icon)
        pen.text((cx-(bbox[2]-bbox[0])/2,cy-(bbox[3]-bbox[1])/2-11),
                 "ABC",font=icon,fill=(252,219,148),stroke_width=2,stroke_fill=(30,12,7))
    # This is a RENDER PREVIEW ONLY. Real app must keep live DOM text.
    for size in range(128,53,-2):
        font=text_font(size)
        width=pen.textbbox((0,0),name,font=font)[2]
        if width<=590:
            break
    bbox=pen.textbbox((0,0),name,font=font)
    width,height=bbox[2]-bbox[0],bbox[3]-bbox[1]
    x=668+max(0,(590-width)/2)
    y=169-height/2-20
    pen.text((x+3,y+3),name,font=font,fill=(101,50,23,180))
    pen.text((x,y),name,font=font,fill=(42,21,12),stroke_width=1,stroke_fill=(28,13,8))
    return Image.alpha_composite(picture,over)

def words_medallion_layer():
    """One transparent, illustrated Words medal for the live DOM component.

    It is deliberately exported apart from the plank: words stay DOM text and
    the button remains interactive. This is review-only source-derived art.
    """
    picture=Image.new("RGBA",(224,224),(0,0,0,0))
    pen=ImageDraw.Draw(picture)
    cx,cy=112,112
    pen.ellipse((cx-109,cy-105,cx+111,cy+115),fill=(33,18,9,110))
    pen.ellipse((cx-106,cy-111,cx+106,cy+105),fill=(82,41,19),outline=(41,21,7),width=6)
    pen.ellipse((cx-99,cy-108,cx+101,cy+95),outline=(232,168,69),width=10)
    pen.ellipse((cx-86,cy-95,cx+87,cy+85),fill=(66,34,17),outline=(29,15,7),width=9)
    pen.arc((cx-97,cy-105,cx+98,cy+101),185,325,fill=(255,219,131),width=7)
    icon=text_font(58)
    bbox=pen.textbbox((0,0),"ABC",font=icon)
    pen.text((cx-(bbox[2]-bbox[0])/2,cy-(bbox[3]-bbox[1])/2-10),"ABC",font=icon,
             fill=(252,219,148),stroke_width=2,stroke_fill=(30,12,7))
    return picture

def main():
    a=argparse.ArgumentParser()
    a.add_argument("--output-dir",required=True,type=Path)
    args=a.parse_args()
    args.output_dir.mkdir(parents=True,exist_ok=True)
    master=locked_master()
    blank=blank_board(master)
    blank.save(args.output_dir/"blank-wooden-plank-CANDIDATE.png")
    # These two files are the only layers an app review candidate consumes.
    # They contain no baked label or action target.
    blank.save(args.output_dir/"words-plank-source-derived-CANDIDATE-v2.png")
    words_medallion_layer().save(args.output_dir/"words-medallion-CANDIDATE-v2.png")
    paths={}
    for name,icon in (("Words","ABC"),("Sentences","bubble"),("Reading","book")):
        dest=args.output_dir/(name.lower()+"-CANDIDATE.png")
        sign(blank,name,icon).save(dest)
        paths[name]=str(dest.name)
    report={
        "status":"SOURCE-DERIVED-ART-PILOT-NOT-APPROVED",
        "locked_master_sha256":LOCKED_SHA256,
        "source_crop":REGION,
        "retouch":"large center region has synthetic wood grain; not pixel-faithful",
        "protected":"source PNG is read-only and never modified",
        "app_runtime_changed":False,
        "production_ready":False,
        "png_artifacts":paths,
        "requires":"manual texture, shape, icon and legibility sign-off before using as CSS asset"
    }
    (args.output_dir/"NOT-APPROVED.json").write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
    print("SOURCE DERIVED ONLY: locked original preserved; candidate requires visual owner approval")

if __name__=="__main__":
    main()
