#!/usr/bin/env python3
"""Review-only removal of the FOUR bottom subject cards from immutable Grovanova originals.

The existing portrait/landscape masters are never modified. This tool only
inpaints bounded painted-card regions. Every byte outside those masks must
decode to the exact same original RGB pixel. Never auto-approve the image.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops
import argparse, hashlib, json
from prepare_lama_candidates import model, inpaint

ROOT=Path(__file__).resolve().parents[2]
SOURCES={
 "landscape":{
  "file":"laer-litt-mer/assets/home-v15/kjosnes-home-tablet.webp",
  "sha":"246edc1572d652af5c3ebf452be60db0b2f842b6afd9fd27529c04145bdf38e5",
  "size":(1127,681),
  "mask":(396,472,1093,666)
 },
 "portrait":{
  "file":"laer-litt-mer/assets/home-v15/kjosnes-home-phone.webp",
  "sha":"0d804d147dc38d259c13757522907f953488f0b40dea298a8efc06055427c8f7",
  "size":(340,641),
  "mask":(6,463,339,571)
 }
}
def check_unmasked(a,b,mask):
 for before,after,m in zip(a.getdata(),b.getdata(),mask.getdata()):
  if not m and before!=after:
   raise AssertionError("Locked Grovanova image changed OUTSIDE the four-card rectangle")
def generate(output,max_side):
 output.mkdir(parents=True,exist_ok=True)
 m=model(Path("/tmp/big-lama.pt"))
 report={"releaseApproved":False,"visualOwnerApproved":False,
         "activeAppChanged":False,"note":"REVIEW ONLY, protect the original paintings",
         "images":{}}
 for mode,info in SOURCES.items():
  path=ROOT/info["file"]
  raw=path.read_bytes()
  original_sha=hashlib.sha256(raw).hexdigest()
  if original_sha!=info["sha"]:raise AssertionError(mode+": SHA-locked Grovanova source changed")
  with Image.open(path) as im: original=im.convert("RGB")
  if original.size!=info["size"]:raise AssertionError(mode+": wrong canvas size")
  mask=Image.new("L",original.size,0)
  ImageDraw.Draw(mask).rectangle(info["mask"],fill=255)
  cleaned=inpaint(m,original,mask,max_side)
  check_unmasked(original,cleaned,mask)
  name=f"grovanova-{mode}-FOUR-CARDS-REMOVED-REVIEW-ONLY.png"
  cleaned.save(output/name,optimize=True)
  mask.save(output/f"grovanova-{mode}-edit-mask.png",optimize=True)
  board=Image.new("RGB",(original.width*2+20,original.height+55),(241,238,229))
  board.paste(original,(0,55));board.paste(cleaned,(original.width+20,55))
  d=ImageDraw.Draw(board)
  d.text((8,10),mode.upper()+" / ORIGINAL LOCKED",fill="#322e27")
  d.text((original.width+28,10),mode.upper()+" / EDIT CANDIDATE - NOT APPROVED",fill="#9c2828")
  board.save(output/f"grovanova-{mode}-before-after-review.png",optimize=True)
  report["images"][mode]={"originalSha256":original_sha,
    "candidate":name,"candidateSha256":hashlib.sha256((output/name).read_bytes()).hexdigest(),
    "dimensions":list(original.size),"mask":[*info["mask"]],"protectedPixelsIdentical":True,
    "visualApproval":False}
 (output/"REPORT-NOT-APPROVED.json").write_text(json.dumps(report,indent=2)+"\n")
 print(json.dumps(report,indent=2))
if __name__=="__main__":
 p=argparse.ArgumentParser()
 p.add_argument("--out",type=Path,default=Path("/tmp/laria-home-four-cards"))
 p.add_argument("--max-side",type=int,default=1152)
 p.add_argument("--self-test",action="store_true")
 a=p.parse_args()
 if a.self_test:
  for name,x in SOURCES.items():
   raw=(ROOT/x["file"]).read_bytes()
   assert hashlib.sha256(raw).hexdigest()==x["sha"],name+" locked source changed"
  print("PASS: two Grovanova source SHA locks")
 else:generate(a.out,a.max_side)
