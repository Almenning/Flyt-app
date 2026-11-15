#!/usr/bin/env python3
"""A texture-only TOP-edge extension for landscape iPad Home.

Makes no changes to the SHA-locked Grovanova source, no new art, no buttons.
Uses ONLY original pixels 4..23, before any logo/subject/nav graphics.
The user-approved fjord and mountain stay untouched in the app bitmap.
"""
from pathlib import Path
from PIL import Image
import argparse,hashlib,sys
ROOT=Path(__file__).resolve().parents[2]
SRC=ROOT/'laer-litt-mer/assets/home-v15/kjosnes-home-tablet.webp'
LOCK='246edc1572d652af5c3ebf452be60db0b2f842b6afd9fd27529c04145bdf38e5'
def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--out',type=Path,required=True)
    a=parser.parse_args()
    if hashlib.sha256(SRC.read_bytes()).hexdigest()!=LOCK:
        raise AssertionError('The locked Grovanova tablet art has changed: refuse scenic extension')
    with Image.open(SRC) as im:
        rgb=im.convert('RGB')
    if rgb.size!=(1127,681):
        raise AssertionError('Unexpected locked Grovanova dimensions')
    strip=rgb.crop((0,4,1127,24))
    a.out.parent.mkdir(parents=True,exist_ok=True)
    strip.save(a.out,format='WEBP',lossless=True,method=6)
    with Image.open(a.out) as out:
        if out.size!=(1127,20) or list(out.convert('RGB').getdata())!=list(strip.getdata()):
            raise AssertionError('The scenic continuation cannot change the source pixels')
    report=(f'Verified source: {SRC.relative_to(ROOT)}\n'
      f'SHA-256: {LOCK}\n'
      f'Source-only crop: x=0..1126; y=4..23; no logo or navigation pixels\n'
      f'Result: {a.out.name}\n'
      'Review-only safe-area backdrop, original artwork not modified\n')
    (a.out.parent/'SCENIC-TOP-EDGE-SOURCE.txt').write_text(report)
    print(report,end='')
if __name__=='__main__':
    main()
