#!/usr/bin/env python3
"""Create clean Grovanova iPad art by removing only baked bottom subject cards.

Original Grovanova WebPs stay immutable. The new foreground is confined to the
four-card area; mountains, fjord, church, painted left signs, journey button,
children and original logos remain byte-for-byte identical outside a narrow
lower-foreground whitelist. Final owner visual acceptance remains separate.
"""
from __future__ import annotations
import argparse, base64, hashlib, io, json, math
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

LOCKS={
 'tablet': {'source':'kjosnes-home-tablet.webp',
            'sha':'246edc1572d652af5c3ebf452be60db0b2f842b6afd9fd27529c04145bdf38e5',
            'size':(1127,681),'out':'kjosnes-home-tablet-no-bottom-cards.webp'},
 'phone': {'source':'kjosnes-home-phone.webp',
           'sha':'0d804d147dc38d259c13757522907f953488f0b40dea298a8efc06055427c8f7',
           'size':(340,641),'out':'kjosnes-home-phone-no-bottom-cards.webp'},
}
DONOR_SHA='57d5979069efb6c19d5569a7f5e2ea93ad6f275eee1ab9c13fcaed6cd0bdaefc'

def sha(raw: bytes)->str:return hashlib.sha256(raw).hexdigest()

def build(root:Path,dest:Path):
    donor_path=root/'tools/laria_art/laria_home_meadow_donor.base64'
    donor_bytes=base64.b64decode(donor_path.read_text().strip(),validate=True)
    assert sha(donor_bytes)==DONOR_SHA,'Donor was unexpectedly altered'
    with Image.open(io.BytesIO(donor_bytes)) as im: donor=im.convert('RGB')
    dest.mkdir(parents=True,exist_ok=True)
    report={'originalArtChanged':False,'visualApproved':False,'publicationAllowed':False,
            'scope':'Only four bottom subject cards removed on iPad',
            'donorSha256':DONOR_SHA,'variants':{}}
    for mode,record in LOCKS.items():
        src=root/'laer-litt-mer/assets/home-v15'/record['source']
        payload=src.read_bytes()
        assert sha(payload)==record['sha'],mode+' source SHA lock mismatch'
        with Image.open(src) as im: original=im.convert('RGB')
        assert original.size==record['size'],mode+' source geometry changed'
        w,h=original.size
        original_rgb=np.array(original,dtype=np.uint8)
        base=original_rgb.copy()
        protected=np.zeros((h,w),dtype=bool)
        if mode=='tablet':
            # Follow the real rocky shoreline with a gradual edge. The old
            # rectangular feather boundary was visible in the real iPad QA.
            # Never overwrite the original locked mountains, fjord or trolls.
            fill=np.array(donor.resize((w,h-440),Image.Resampling.LANCZOS),dtype=np.uint8)
            base[440:h,:,:]=fill
            yy,xx=np.mgrid[0:h,0:w].astype(np.float32)
            top=462-12*np.clip((xx-540)/190,0,1)+5*np.sin(xx/22)+2*np.sin(xx/6)
            left=375+6*np.sin(yy/21)+4*np.sin(yy/8)
            def smoothstep(value):
                v=np.clip(value,0,1)
                return v*v*(3-2*v)
            soft=smoothstep((yy-top)/17)*smoothstep((xx-left)/23)
            protected[438:h,365:w]=True
        else:
            # The portrait button and bottom navigation stay exactly where
            # they are. Replace ONLY its already identified four-card strip.
            fill=np.array(donor.resize((w,120),Image.Resampling.LANCZOS),dtype=np.uint8)
            base[459:579,:,:]=fill
            alpha=np.zeros((h,w),dtype=np.uint8)
            alpha[463:575,:]=255
            protected[455:576,:]=True
            soft=np.asarray(Image.fromarray(alpha,'L').filter(ImageFilter.GaussianBlur(5)),dtype=np.float32)/255.
        soft[~protected]=0
        blend=np.clip(original_rgb.astype('float32')*(1-soft[:,:,None])+base.astype('float32')*soft[:,:,None],0,255).astype('uint8')
        if not np.array_equal(blend[~protected],original_rgb[~protected]):
            raise AssertionError(mode+' landscape pixel altered outside limited card removal')
        candidate=Image.fromarray(blend,'RGB')
        target=dest/record['out']
        candidate.save(target,format='WEBP',lossless=True,method=6)
        with Image.open(target) as im: decoded=np.array(im.convert('RGB'),dtype=np.uint8)
        if not np.array_equal(decoded[~protected],original_rgb[~protected]):
            raise AssertionError(mode+' exported WebP altered protected original pixels')
        num_changed=int(np.count_nonzero(np.any(decoded!=original_rgb,axis=2)))
        report['variants'][mode]={'file':record['out'],'width':w,'height':h,
                                 'originalSha256':record['sha'],
                                 'candidateSha256':sha(target.read_bytes()),
                                 'pixelsChanged':num_changed,'outsideEditPixelsChanged':0,
                                 'approved':False}
        original.resize((w,h)).save(dest/(mode+'-original-reference.png'))
        candidate.save(dest/(mode+'-retouch-review.png'))
    (dest/'ART-REVIEW-REQUIRED.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False,indent=2))

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[2])
    parser.add_argument('--out',type=Path,default=None)
    args=parser.parse_args()
    build(args.root,args.out or args.root/'laer-litt-mer/assets/home-v15')