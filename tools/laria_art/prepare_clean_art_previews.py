#!/usr/bin/env python3
"""Deterministic, NON-APPROVED Grovanova/Kinnaklova clean-art previews.

Only pixels inside explicit UI-removal masks can change. Never writes app
assets, manifest approvals, original paintings, child progress or deployment.
"""
from pathlib import Path
import argparse
import hashlib
import json
from PIL import Image, ImageChops, ImageDraw

ROOT=Path(__file__).resolve().parents[2]
LOCKED={
 "grovanova":{
  "file":"laer-litt-mer/assets/home-v15/kjosnes-home-tablet.webp",
  "blob":"e7869dae62639d12d87cbdb43d79850998fb3d7d",
  "size":(1127,681),
  "ui":{
   "logo-and-greeting":(4,15,333,217),
   "top-buttons":(790,7,1126,147),
   "left-painted-signs":(0,188,248,430),
   "next-journey":(0,505,398,661),
   "bottom-cards":(375,457,1126,680),
   "decorative-trolls":(230,235,635,495),
  },
  "landmarks":{"Grovanova-fjord":(690,160,960,455)},
 },
 "kinnaklova":{
  "file":"laer-litt-mer/assets/kinnaklova/kinnaklova-scene-clean-approved-20261026.webp",
  "sha256":"d2e2d37b4c54191383457f423c1d568cd538391046e79e6f66e7a8b1928c0e57",
  "size":(1672,941),
  "ui":{
   "painted-top-breadcrumb":(0,15,420,130),
   "painted-logo-and-title":(525,0,1190,315),
   "words":(377,693,692,817),
   "sentences":(1037,458,1320,571),
   "reading":(1341,655,1645,759),
  },
  "landmarks":{
   "twin-peaks":(725,241,1037,451),
   "kinn-church":(26,447,346,837),
  },
 },
}

def source(world):
 spec=LOCKED[world]
 raw=(ROOT/spec["file"]).read_bytes()
 if "sha256" in spec and hashlib.sha256(raw).hexdigest()!=spec["sha256"]:
  raise ValueError(world+": locked SHA-256 changed")
 if "blob" in spec:
  val=hashlib.sha1(("blob "+str(len(raw))+"\0").encode()+raw).hexdigest()
  if val!=spec["blob"]: raise ValueError(world+": locked Git blob changed")
 with Image.open(ROOT/spec["file"]) as im:
  if im.size!=spec["size"]: raise ValueError(world+": locked dimensions changed")
  image=im.convert("RGB").copy()
 return image,raw

def make_mask(world):
 spec=LOCKED[world]
 mask=Image.new("L",spec["size"],0)
 pen=ImageDraw.Draw(mask)
 for box in spec["ui"].values(): pen.rectangle(box,fill=255)
 for box in spec["landmarks"].values(): pen.rectangle(box,fill=0)
 return mask

def checked(original,proposal,mask):
 if original.size!=proposal.size or original.size!=mask.size:
  raise AssertionError("Mismatched source/proposal/mask geometry")
 diff=ImageChops.difference(original,proposal)
 c=diff.split()
 d=ImageChops.lighter(ImageChops.lighter(c[0],c[1]),c[2])
 if ImageChops.multiply(d,ImageChops.invert(mask)).getbbox():
  raise AssertionError("Pixels changed outside UI-only whitelist")
 if not d.getbbox(): raise AssertionError("Preview did not change any pixel")
 return sum(bool(v) for v in d.getdata())

def inpaint(original,mask,kind):
 import cv2
 import numpy as np
 rgb=np.asarray(original)
 bgr=cv2.cvtColor(rgb,cv2.COLOR_RGB2BGR)
 flag=cv2.INPAINT_TELEA if kind=="telea" else cv2.INPAINT_NS
 result=cv2.inpaint(bgr,np.asarray(mask),6,flag)
 candidate=Image.fromarray(cv2.cvtColor(result,cv2.COLOR_BGR2RGB))
 candidate=Image.composite(candidate,original,mask)
 return candidate

def guide(original,mask,world):
 canvas=original.convert("RGBA")
 red=Image.new("RGBA",canvas.size,(225,45,40,0))
 red.putalpha(mask.point(lambda v:105 if v else 0))
 canvas=Image.alpha_composite(canvas,red)
 painter=ImageDraw.Draw(canvas)
 for name,box in LOCKED[world]["ui"].items():
  painter.rectangle(box,outline=(255,220,75),width=3)
  painter.text((box[0]+2,box[1]+3),name,fill=(255,255,255),
               stroke_width=1,stroke_fill=(50,30,30))
 for box in LOCKED[world]["landmarks"].values():
  painter.rectangle(box,outline=(70,250,135),width=4)
 return canvas.convert("RGB")

def comparison(original,changed,world,kind):
 scale=min(1.,900./original.width)
 w,h=round(original.width*scale),round(original.height*scale)
 a=original.resize((w,h),Image.Resampling.LANCZOS)
 b=changed.resize((w,h),Image.Resampling.LANCZOS)
 c=Image.new("RGB",(2*w+20,h+40),(241,238,229))
 c.paste(a,(0,38));c.paste(b,(w+20,38))
 pen=ImageDraw.Draw(c)
 pen.text((5,8),world+" LOCKED SOURCE",fill=(44,36,30))
 pen.text((w+25,8),kind+" PROPOSAL - NOT APPROVED",fill=(155,33,22))
 return c

def run(dest):
 dest.mkdir(parents=True,exist_ok=True)
 report={"status":"PREVIEW_ONLY_NOT_APPROVED","merge_or_release_approval":False,"requires_human_art_review":True,
         "no_live_app_asset_changed":True,"scenes":{}}
 for world,spec in LOCKED.items():
  image,raw=source(world)
  mask=make_mask(world)
  mask.save(dest/(world+"-whitelist.png"))
  guide(image,mask,world).save(dest/(world+"-mask-guide.png"))
  scene={"original_sha256":hashlib.sha256(raw).hexdigest(),
         "original_file":spec["file"],"size":list(spec["size"]),
         "protected_landmarks":spec["landmarks"],"ui_masks":spec["ui"],
         "visual_approval":False,"requires_artist_retouch":True,"candidates":{}}
  for kind in ("telea","ns"):
   proposal=inpaint(image,mask,kind)
   changed=checked(image,proposal,mask)
   name=world+"-"+kind+"-NOT-APPROVED.png"
   proposal.save(dest/name)
   comparison(image,proposal,world,kind).save(dest/(world+"-"+kind+"-comparison.png"))
   scene["candidates"][kind]={"file":name,"changed_pixels":changed,
      "sha256":hashlib.sha256((dest/name).read_bytes()).hexdigest(),
      "outside_mask_changed":0,"approved":False}
  report["scenes"][world]=scene
 (dest/"REPORT-NOT-APPROVED.json").write_text(
  json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print("PASS: previews generated from exact locked art, no live art replaced")
 print("STOP: candidate files are NOT PREMIUM APPROVED")

def check_self():
 a=Image.new("RGB",(70,50),(20,50,120))
 ImageDraw.Draw(a).rectangle((25,14,48,35),fill=(240,15,40))
 m=Image.new("L",a.size,0)
 ImageDraw.Draw(m).rectangle((24,13,49,36),fill=255)
 for kind in ("telea","ns"):
  candidate=inpaint(a,m,kind)
  assert checked(a,candidate,m)>100
 print("PASS: source-preserving mask test")

if __name__=="__main__":
 ap=argparse.ArgumentParser()
 ap.add_argument("--output-dir",type=Path)
 ap.add_argument("--self-test",action="store_true")
 args=ap.parse_args()
 if args.self_test:check_self()
 elif args.output_dir:run(args.output_dir)
 else:ap.error("Supply --output-dir or --self-test")
