#!/usr/bin/env python3
"""Create clean iPad Grovanova derivatives with no baked 'Neste stopp' subtitle.

Never edit source-locked original images or the existing approved four-card-clean
derivatives. Limit restoration to one small strip of WOOD inside the journey
plank; preserve heading, compass, right arrow and every outside pixel exactly.
"""
from pathlib import Path
import argparse, hashlib, json
import cv2
import numpy as np
from PIL import Image

INPUTS = {
    "tablet": {
        "source": "kjosnes-home-tablet-no-bottom-cards.webp",
        "sha256": "9ea3cfdcc4a703964106a5aa7a83b0a033bfa90712db92687e1759b3af12ade8",
        "dimensions": (1127, 681),
        "subtitle_only": (142, 571, 309, 592),
        "output": "kjosnes-home-tablet-no-bottom-cards-no-next-stop.webp"
    },
    "phone": {
        "source": "kjosnes-home-phone-no-bottom-cards.webp",
        "sha256": "de12abd69d5977dcc01162b5855267bdc4141f2a6ab98d8b8d4e5ceab2933d1d",
        "dimensions": (340, 641),
        "subtitle_only": (105, 423, 243, 443),
        "output": "kjosnes-home-phone-no-bottom-cards-no-next-stop.webp"
    }
}

def digest(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--root",type=Path,default=Path(__file__).resolve().parents[2])
    parser.add_argument("--out",type=Path,required=True)
    args=parser.parse_args()
    directory=args.root/"laer-litt-mer/assets/home-v15"
    args.out.mkdir(parents=True,exist_ok=True)
    report={"edit":"Remove ONLY the baked Next Stop subtitle on the painted wood plank",
        "originalsUntouched":True,"ownerArtApproved":False,"mergeToMainAllowed":False,"variants":{}}
    for name,details in INPUTS.items():
        source=directory/details["source"]
        if digest(source)!=details["sha256"]:
            raise AssertionError(name+" clean four-card source unexpectedly modified")
        with Image.open(source) as im:
            original=np.asarray(im.convert("RGB"),dtype=np.uint8)
        height,width=original.shape[:2]
        if (width,height)!=details["dimensions"]:
            raise AssertionError(name+" image dimensions changed")
        x1,y1,x2,y2=details["subtitle_only"]
        assert 0<=x1<x2<width and 0<=y1<y2<height
        mask=np.zeros((height,width),dtype=np.uint8)
        mask[y1:y2,x1:x2]=255
        restored=cv2.cvtColor(
            cv2.inpaint(cv2.cvtColor(original,cv2.COLOR_RGB2BGR),mask,8,cv2.INPAINT_TELEA),
            cv2.COLOR_BGR2RGB)
        if not np.array_equal(restored[mask==0],original[mask==0]):
            raise AssertionError(name+" inpaint changed non-subtitle pixels")
        destination=args.out/details["output"]
        Image.fromarray(restored,"RGB").save(destination,format="WEBP",lossless=True,method=6)
        with Image.open(destination) as im:
            exported=np.asarray(im.convert("RGB"),dtype=np.uint8)
        if not np.array_equal(exported[mask==0],original[mask==0]):
            raise AssertionError(name+" WebP encoder changed the protected illustration")
        if not np.any(exported[mask!=0]!=original[mask!=0]):
            raise AssertionError(name+" subtitle was not removed")
        # Before-and-after art evidence for independent quality review.
        bounds=(105,515,391,623) if name=="tablet" else (80,382,338,463)
        before=Image.fromarray(original).crop(bounds)
        after=Image.fromarray(exported).crop(bounds)
        pair=Image.new("RGB",(before.width*2,before.height))
        pair.paste(before,(0,0));pair.paste(after,(before.width,0))
        pair.resize((pair.width*3,pair.height*3)).save(args.out/(name+"-journey-sign-before-after.png"))
        report["variants"][name]={
            "source":details["source"],"sourceSha256":details["sha256"],
            "asset":details["output"],"assetSha256":digest(destination),
            "textOnlyRect":list(details["subtitle_only"]),
            "outsideRectPixelsIdentical":True,
            "pixelsChanged":int(np.count_nonzero(np.any(exported!=original,axis=2)))}
    (args.out/"JOURNEY-SIGN-REVIEW.json").write_text(
        json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(report,ensure_ascii=False,indent=2))

if __name__=="__main__":
    main()
