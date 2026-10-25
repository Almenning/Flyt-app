#!/usr/bin/env python3
"""Validate painter-edited Storesoster V2 OpenRaster. NEVER certify premium art."""
import argparse, hashlib, io, json, sys, xml.etree.ElementTree as ET
from pathlib import Path
from zipfile import ZipFile
import numpy as np
from PIL import Image, ImageDraw

SOURCE_SHA='b98a5ee7f264d448da557636406080b5d8ee8aae23f32f0e41b66bf811beda89'
LAYER_SHA={
 'data/09-original.png':'29bfb098d6774bc2a5265c3395467997635495586950371cefaae675e7b28337',
 'data/06-arm.png':'6bc3f833493b98b63b5b9c9e580133922e1f815c2ffe2a7288884c186f5a43cc',
 'data/01-body.png':'9900a56f079bf2e6758a9543fe44da90c212727767349ea23a0f38fe170c173d',
 'data/08-pivot.png':'ed0e8d9fefcb81e4ed0b1dbaa55a91dde89c92e6ff2c5702660bba6bdfa8f9b4',
 'data/07-holes.png':'20a54cc0133d63b6dd348921a0fac74d0652d661816e37bc217e2ec63e206f01',
 'data/00-colors.png':'07bd9e7c9059ec547158e8211bd66472846666f61dc5034b59bf462a81cd4f24'
}
PAINT=('data/05-hair.png','data/04-sleeve.png','data/03-dress.png','data/02-waist.png')
ORDER=('data/09-original.png','data/08-pivot.png','data/07-holes.png','data/06-arm.png',*PAINT,'data/01-body.png','data/00-colors.png')
ANGLES=(-25,-12,0,12,25)
class Reject(ValueError): pass

def image(z,name):
    im=Image.open(io.BytesIO(z.read(name))).convert('RGBA')
    if im.size!=(512,1024): raise Reject('Original canvas dimensions changed: '+name)
    return im

def verify(source,ora,output):
    source,ora,output=Path(source),Path(ora),Path(output)
    raw=source.read_bytes()
    if hashlib.sha256(raw).hexdigest()!=SOURCE_SHA: raise Reject('Locked source SHA mismatch')
    with ZipFile(ora) as z:
        if z.testzip() or z.read('mimetype')!=b'image/openraster': raise Reject('Invalid ORA')
        if z.read('source/approved-storesoster.webp')!=raw: raise Reject('Embedded source changed')
        root=ET.fromstring(z.read('stack.xml'))
        if (root.get('w'),root.get('h'))!=('512','1024'): raise Reject('Canvas changed')
        stack=root.find('stack')
        if stack is None: raise Reject('Missing layer stack')
        entries=list(stack)
        if tuple(e.get('src') for e in entries)!=ORDER: raise Reject('Wrong V2 layer order')
        for e in entries:
            name=e.get('src')
            expected='visible' if name in (*PAINT,'data/06-arm.png','data/01-body.png') else 'hidden'
            if (e.get('visibility'),e.get('x'),e.get('y'),e.get('opacity'))!=(expected,'0','0','1.0'):
                raise Reject('Locked layer moved or hidden: '+name)
        art={n:image(z,n) for n in ORDER}
    for name,digest in LAYER_SHA.items():
        if hashlib.sha256(art[name].tobytes()).hexdigest()!=digest:
            raise Reject('Original or guide modified: '+name)
    source_image=Image.open(io.BytesIO(raw)).convert('RGBA')
    arm=art['data/06-arm.png']
    core=np.asarray(arm.getchannel('A'))==255
    under=art['data/01-body.png'].copy()
    counts={}
    for name in reversed(PAINT):
        pixels=np.asarray(art[name].getchannel('A'))>0
        if np.any(pixels&~core): raise Reject('Paint outside hidden original arm: '+name)
        counts[name]=int(pixels.sum())
        under=Image.alpha_composite(under,art[name])
    neutral=Image.alpha_composite(under,arm)
    if not np.array_equal(np.asarray(neutral),np.asarray(source_image)):
        raise Reject('Neutral figure differs from locked source')
    output.mkdir(parents=True,exist_ok=True)
    missing={};pics=[]
    for angle in ANGLES:
        moved=arm.rotate(angle,center=(177,397),resample=Image.Resampling.BICUBIC)
        pose=Image.alpha_composite(under,moved)
        hole=(np.asarray(source_image.getchannel('A'))>150)&(np.asarray(pose.getchannel('A'))<60)
        missing[str(angle)]=int(hole.sum())
        bg=Image.new('RGBA',pose.size,(246,236,222,255))
        bg.alpha_composite(pose)
        pink=Image.new('RGBA',pose.size,(255,31,102,0))
        pink.putalpha(Image.fromarray((hole*220).astype('uint8'),'L'))
        bg.alpha_composite(pink)
        pics.append(bg.crop((60,312,355,660)).resize((354,418)).convert('RGB'))
    sheet=Image.new('RGB',(354*5,464),'#fff8ee');d=ImageDraw.Draw(sheet)
    for i,(angle,pic) in enumerate(zip(ANGLES,pics)):
        sheet.paste(pic,(i*354,46))
        d.rectangle((i*354,0,(i+1)*354,46),fill='#493a32')
        d.text((i*354+12,16),f'{angle:+d} grader / {missing[str(angle)]} hull',fill='#fff3dd')
    sheet.save(output/'posisjoner-IKKE-GODKJENT.png')
    neutral.save(output/'neutral-pikselidentisk.png')
    result={
      'source_sha256':SOURCE_SHA,'source_layers_unchanged':True,'neutral_rgba_pixel_identical':True,
      'painted_pixels_by_layer':counts,'missing_silhouette_pixels_by_pose':missing,
      'measured_holes_closed':all(n==0 for n in missing.values()),
      'human_visual_approval':False,'anatomy_approved':False,'phase1_approved':False,
      'app_integration_permitted':False,'caution':'Zero holes does not prove anatomically credible art.'
    }
    (output/'artist-intake-report.json').write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
    return result

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--source',required=True)
    p.add_argument('--ora',required=True)
    p.add_argument('--output',required=True)
    a=p.parse_args()
    try: print(json.dumps(verify(a.source,a.ora,a.output),indent=2,ensure_ascii=False))
    except Reject as exc:
        print('REJECT:',exc,file=sys.stderr)
        sys.exit(2)
