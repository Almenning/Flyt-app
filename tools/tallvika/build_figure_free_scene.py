#!/usr/bin/env python3
"""Rebuild Tallvika's figure-free presentation asset from approved repository sources.
Only the lower painted-in characters are retouched. The 27 Oct locked original
is untouched; its entire upper mountain/sky region remains pixel-identical.
This deterministic derivative requires independent visual approval.
"""
from pathlib import Path
import hashlib
from PIL import Image, ImageDraw, ImageFilter

repo=Path(__file__).resolve().parents[2]
src=repo/'laer-litt-mer/assets/tallvika/laria-tallvika-premium-locked-20261027.png'
donor=repo/'laer-litt-mer/assets/tallvika/tallvika-master-laast-20261025.png'
out=repo/'laer-litt-mer/assets/tallvika/tallvika-figure-free-20261028.webp'
assert hashlib.sha256(src.read_bytes()).hexdigest()=='632c9a2a1476e220e493b6e802e044bdfb025e9afc02e7f62fcc39c81cc4a3a5'
assert hashlib.sha256(donor.read_bytes()).hexdigest()=='eff445ccbc59b143fc587081e50b0f0fadc58e3668e2a15c52b7e41a036865dd'
original=Image.open(src).convert('RGB')
background=Image.open(donor).convert('RGB').resize(original.size,Image.Resampling.LANCZOS)
W,H=original.size
assert (W,H)==(1602,981)
mask=Image.new('L',(W,H),0)
draw=ImageDraw.Draw(mask)
figures=[
 [(0,595),(12,555),(32,525),(53,503),(82,490),(126,495),(164,511),(199,515),(237,546),(245,573),(218,605),(207,655),(204,710),(189,758),(149,782),(90,776),(62,765),(29,750),(0,715)],
 [(546,759),(564,731),(564,701),(581,680),(609,673),(639,671),(675,689),(704,724),(709,772),(709,799),(680,840),(635,854),(570,842),(547,814)],
 [(1198,750),(1216,729),(1240,705),(1285,693),(1337,702),(1385,716),(1427,741),(1435,798),(1421,847),(1396,879),(1362,897),(1292,894),(1233,871),(1204,833)]
]
for poly in figures:draw.polygon(poly,fill=255)
mask=mask.filter(ImageFilter.MaxFilter(33)).filter(ImageFilter.GaussianBlur(13))
clean=Image.composite(background,original,mask)
# Historic donor has an old wooden label on the lower left. Replace its
# residual letters with vegetation and stones from the same clean donor.
px,py,pw,ph=0,696,220,140
patch=background.crop((408,736,408+pw,736+ph))
patch_mask=Image.new('L',(pw,ph),0)
d=ImageDraw.Draw(patch_mask)
d.rectangle((-30,16,170,118),fill=255)
patch_mask=patch_mask.filter(ImageFilter.GaussianBlur(16))
ImageDraw.Draw(patch_mask).rectangle((0,36,58,100),fill=255)
clean.paste(patch,(px,py),patch_mask)
# Protect the exact authorized peak, ridge and upper valley against drift.
clean.paste(original.crop((0,0,W,465)),(0,0))
assert clean.crop((0,0,W,465)).tobytes()==original.crop((0,0,W,465)).tobytes()
out.parent.mkdir(parents=True,exist_ok=True)
clean.save(out,format='WEBP',quality=86,method=6)
assert out.stat().st_size>250000
print('TALLVIKA ART',str(out.relative_to(repo)),'bytes',out.stat().st_size,
      'sha256',hashlib.sha256(out.read_bytes()).hexdigest())
