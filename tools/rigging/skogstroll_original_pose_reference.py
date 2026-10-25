#!/usr/bin/env python3
"""Lossless source-of-truth contact sheet for locked Læria trolls.

This handoff collects two DIFFERENT pose families. It never creates
anatomical layers, redraws faces, or authorizes app integration.
"""
import argparse
import hashlib
import json
import shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

POSES = (
    ("neutral-512", Path("laer-litt-mer/assets/gangemagi-troll"), {
        "storesoster": ("a8fba47e272e2856bd78b92fb262146506e828ed", (512, 1024)),
        "lillesoster": ("37fd94b3d0fd5319db05e4d1aea609e96d69351f", (512, 1024)),
        "lillebror": ("fcf59aad90e0c9dacca025d76cd352a924ef7120", (512, 1024)),
    }),
    ("small-action-420", Path("laer-litt-mer/assets/skogstroll"), {
        "storesoster": ("5d5f80c15e367bbd4600013057c7820a7b2e2adb", (271, 420)),
        "lillesoster": ("661107cd231a72b14aeca4f7bc3c826130734576", (281, 420)),
        "lillebror": ("5f92c89319ec372b980c75eb3d538a4f4f851a7c", (304, 420)),
    }),
)
LABELS = {"storesoster": "Storesoster", "lillesoster": "Lillesoster", "lillebror": "Lillebror"}
ROOT = Path(__file__).resolve().parents[2]
WHITE = (254, 248, 238, 255)
TEXT = (69, 49, 42, 255)
PAPER = (242, 230, 210, 255)

def font(sz, bold=False):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold
            else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, sz)
    return ImageFont.load_default()

def pixel_checker(sheet, bounds):
    draw = ImageDraw.Draw(sheet)
    x0, y0, x1, y1 = bounds
    draw.rectangle(bounds, fill=(238, 233, 224, 255))
    for y in range(y0, y1, 24):
        for x in range(x0, x1, 24):
            if ((x-x0)//24+(y-y0)//24)%2==0:
                draw.rectangle((x,y,min(x+23,x1),min(y+23,y1)), fill=(249,244,234,255))

def git_hash(data):
    return hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()

def build(output):
    output=Path(output)
    output.mkdir(parents=True, exist_ok=True)
    originals=output/"originals-byte-identical"
    records=[]
    imgs={}
    for family, folder, characters in POSES:
        dest=originals/family
        dest.mkdir(parents=True,exist_ok=True)
        for name,(expected,size) in characters.items():
            src=ROOT/folder/(name+".webp")
            data=src.read_bytes()
            if git_hash(data)!=expected:
                raise RuntimeError("STOP: locked Git blob changed: "+str(src))
            with Image.open(src) as im:
                if im.size!=size:
                    raise RuntimeError("STOP: locked image dimensions changed: "+str(src))
                im.load()
                art=im.convert("RGBA")
            target=dest/src.name
            shutil.copyfile(src,target)
            if target.read_bytes()!=data:
                raise RuntimeError("STOP: copy changed source bits")
            records.append({"family":family,"name":name,"source":str(folder/(name+".webp")),
               "copied_to":str(target.relative_to(output)),"dimensions":list(size),
               "git_sha1":expected,"sha256":hashlib.sha256(data).hexdigest(),
               "alpha_bbox":list(art.getchannel("A").getbbox() or (0,0,0,0)),
               "source_bytes_identical":True})
            imgs[(family,name)]=art

    w=1340
    header=150
    row=1125
    h=header+3*row+78
    sheet=Image.new("RGBA",(w,h),WHITE)
    draw=ImageDraw.Draw(sheet)
    f28=font(28,True);f20=font(20,False);f15=font(15,False)
    draw.text((48,32),"LAERIA: TWO LOCKED POSE FAMILIES",font=f28,fill=TEXT)
    draw.text((48,78),"SOURCE AUDIT / ARTIST REFERENCE ONLY - NOT A RIG OR APPROVED ANIMATION",font=f20,fill=(135,59,54,255))
    draw.text((48,112),"Left: 512x1024 neutral pose   |   Right: native 420px action pose (NOT upscaled)",font=f20,fill=TEXT)
    for idx,name in enumerate(LABELS):
        y0=header+idx*row
        draw.rectangle((28,y0+4,w-28,y0+row-17),fill=PAPER,outline=(206,184,153,255),width=2)
        draw.text((55,y0+12),LABELS[name],font=f28,fill=TEXT)
        draw.text((80,y0+57),"NEUTRAL: 512 x 1024, production still-image reference",font=f20,fill=TEXT)
        draw.text((775,y0+57),"ACTION: original native 420px, different pose",font=f20,fill=TEXT)
        left_box=(80,y0+92,80+512,y0+92+1024)
        right_box=(747,y0+92,747+420,y0+92+1024)
        pixel_checker(sheet,left_box)
        pixel_checker(sheet,right_box)
        left=imgs[("neutral-512",name)]
        action=imgs[("small-action-420",name)]
        # Display each source at EXACT original pixel scale. NO image interpolation.
        sheet.alpha_composite(left, (80,y0+92))
        sheet.alpha_composite(action, (747+(420-action.width)//2,y0+92+(1024-action.height)//2))
        draw.rectangle(left_box,outline=(135,103,76,255),width=2)
        draw.rectangle(right_box,outline=(135,103,76,255),width=2)
        draw.text((80,y0+1091), "Do not swap images during character animation.",font=f15,fill=(142,66,61,255))
    sheet.convert("RGB").save(output/"locked-troll-source-pose-comparison.png",optimize=True)

    manifest={"purpose":"Strictly source/pose comparison; NO new characters, animation, or art approval",
              "png_vs_webp_original_pixel_parity_verified":False,
              "sources_have_anatomical_layers":False,
              "neutral_and_action_poses_interchangeable":False,
              "app_integration_permitted":False,
              "phase1_art_approved":False,
              "records":records}
    (output/"locked-pose-family-manifest.json").write_text(json.dumps(manifest,indent=2)+"\n")
    (output/"READ-ME-FIRST.txt").write_text(
        "LAERIA - SOURCE AUDIT: NOT AN APPROVED CHARACTER RIG\n\n"
        "The originals-byte-identical folders contain all SIX untouched approved\n"
        "WebP reference files copied from their specific original locations.\n"
        "The contact sheet displays original image pixels at native 1:1 scale.\n"
        "Neutral 512x1024 and action 420px have DIFFERENT POSES. Do not turn\n"
        "these flat files into a swap animation or assume they are parts of one rig.\n"
        "Actual library PNG pixels have NOT been byte-verified against WebP.\n"
        "Stage A requires hand-painted missing hair, shoulder, sleeve and dress\n"
        "under original moving parts, with identical visible neutral pixels.\n"
        "Missing anatomy and smooth natural waving are still NOT APPROVED.\n"
        "See GitHub issue #221 and docs/LARIA-TALLENGA-MESTERPLAN-2026-10-25.md.\n"
    )
    assert len(records)==6
    print(json.dumps({"source_count":6,"sha1_verified":True,
        "contact_sheet_created":True,"sources_untouched":True,
        "art_approved":False,"output":str(output)},indent=2))

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--output",required=True)
    build(p.parse_args().output)
