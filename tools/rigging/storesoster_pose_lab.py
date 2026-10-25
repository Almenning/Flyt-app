#!/usr/bin/env python3
"""Source-faithful movement review ONLY. Never use as in-app character art.
Visible pixels are preserved. Hidden shoulder/cloth is an unapproved candidate.
"""
import argparse, hashlib, json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from storesoster_arm_layer_study import LOCKED_SHA256, SHOULDER_PIVOT, SIZE, split_original
from storesoster_art_integrity import verify as verify_hidden_layer

HTML='''<!doctype html><html lang="no"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Læria · Storesøster bevegelser (ikke godkjent)</title>
<style>body{margin:0;padding:20px;background:#f5ece2;color:#503b32;font:16px system-ui}main{max-width:1100px;margin:auto}section{display:grid;grid-template-columns:minmax(260px,520px) 1fr;gap:24px}@media(max-width:800px){section{grid-template-columns:1fr}}canvas{width:100%;max-width:470px;border-radius:16px;border:1px solid #bda495}aside{padding:20px;border-radius:14px;background:#fff8ef}button{padding:10px;margin:3px;cursor:pointer}input[type=range]{width:100%}.warning{background:#f8dfd3;padding:12px;border-left:4px solid #ae5940}</style>
<main><h1>Storesøster · bevegelseslaboratorium</h1><p class="warning"><strong>IKKE PRODUKSJONSKLAR.</strong> Den skjulte skulderen/overkroppen er bare en originalbasert teksturprøve. Hun har riktig originalansikt, men armens anatomi er ennå ikke premiumgodkjent. Ikke publiser.</p>
<section><canvas width="512" height="1024" id="view"></canvas><aside><h2>Arm og skulder</h2>
<label for="angle">Vinkel: <output id="degree">0°</output></label><input id="angle" type="range" min="-25" max="25" value="0">
<div><button data-angle="0">0°</button><button data-angle="-12">−12°</button><button data-angle="12">+12°</button><button data-angle="-25">−25°</button><button data-angle="25">+25°</button></div>
<p><label><input id="underpaint" type="checkbox" checked> Vis foreløpig underlagsforsøk</label></p><p><label><input id="original" type="checkbox"> Overlegg med låst original</label></p>
<p id="info">Ved 0° vises originalbildet uten noen endringer.</p><p>Skulderpunkt: 177 × 397. Samme kildepiksler og karakter. Skjulte deler må illustreres ferdig manuelt.</p>
</aside></section></main><script>
const resources={original:'01-locked-original.png',arm:'02-original-arm.png',body:'03-body.png',patch:'04-hidden-fabric-DRAFT.png'};
const im={},v=document.getElementById('view'),ctx=v.getContext('2d'),slider=document.getElementById('angle');
for(const [k,p] of Object.entries(resources)){im[k]=new Image();im[k].src=p}
function draw(){const a=Number(slider.value);document.getElementById('degree').textContent=a+'°';ctx.clearRect(0,0,512,1024);
if(!a){ctx.drawImage(im.original,0,0)}else{ctx.drawImage(im.body,0,0);if(document.getElementById('underpaint').checked)ctx.drawImage(im.patch,0,0);
ctx.save();ctx.translate(177,397);ctx.rotate(-a*Math.PI/180);ctx.translate(-177,-397);ctx.drawImage(im.arm,0,0);ctx.restore();
if(document.getElementById('original').checked){ctx.globalAlpha=.30;ctx.drawImage(im.original,0,0);ctx.globalAlpha=1}}
document.getElementById('info').textContent=a?'IKKE godkjent: kontroller hår, erme, armledd, belte, fingre og sømmer.':'Eksakt låst original – null endring i hvilestilling';}
slider.addEventListener('input',draw);document.querySelectorAll('input[type=checkbox]').forEach(x=>x.addEventListener('change',draw));
document.querySelectorAll('button[data-angle]').forEach(x=>x.addEventListener('click',()=>{slider.value=x.dataset.angle;draw()}));
Promise.all(Object.values(im).map(x=>x.decode())).then(draw);
</script></html>'''

def build(source, output, underpaint=None):
    source,output=Path(source),Path(output)
    digest=hashlib.sha256(source.read_bytes()).hexdigest()
    if digest!=LOCKED_SHA256: raise ValueError('STOP: original character hash changed')
    original=Image.open(source).convert('RGBA')
    if original.size!=SIZE: raise ValueError('STOP: source geometry changed')
    _,arm,body=split_original(original)
    if not np.array_equal(np.asarray(original),np.asarray(Image.alpha_composite(body,arm))):
        raise AssertionError('Neutral character is not pixel-identical to original')
    if underpaint is not None:
        # Use the exact same identity gate that rejects whole new trolls.
        # This only allows a review, NEVER automatic promotion to production.
        verified=verify_hidden_layer(source, underpaint)
        if not verified['geometry_integrity_pass']:
            raise AssertionError('New hidden artwork changes the locked character')
        patch=Image.open(underpaint).convert('RGBA')
        candidate_origin='imported-layer-only'
    else:
        src=np.asarray(original);height,width=src.shape[:2]
        y,x=np.mgrid[:height,:width]
        hx=np.clip(x-35,45,116);dx=np.clip(x+98,240,345)
        dy=np.where(y<470,np.clip(y-22,350,465),np.clip(y+68,510,665))
        hair=src[y,hx,:3].astype('float32');fabric=src[dy,dx,:3].astype('float32')
        mix=np.clip((x-152)/36,0,1)[...,None]
        patch_array=np.zeros_like(src)
        patch_array[:,:,:3]=(hair*(1-mix)+fabric*mix).astype('uint8')
        patch_array[:,:,3]=np.asarray(arm.getchannel('A'))
        patch=Image.fromarray(patch_array,'RGBA')
        candidate_origin='experimental-source-texture-DRAFT'
    output.mkdir(parents=True,exist_ok=True)
    for filename,image in [('01-locked-original.png',original),('02-original-arm.png',arm),
                           ('03-body.png',body),('04-hidden-fabric-DRAFT.png',patch)]:
        image.save(output/filename)
    sheet=Image.new('RGB',(5*350,520),'#f8efe4')
    for i,angle in enumerate((-25,-12,0,12,25)):
        if angle==0:pose=original
        else:
            bg=Image.alpha_composite(body,patch)
            move=arm.rotate(angle,resample=Image.Resampling.BICUBIC,center=SHOULDER_PIVOT)
            pose=Image.alpha_composite(bg,move)
        canvas=Image.new('RGBA',SIZE,'#f5eadf');canvas.alpha_composite(pose)
        crop=canvas.crop((43,250,365,730)).resize((350,520))
        sheet.paste(crop.convert('RGB'),(350*i,0))
        ImageDraw.Draw(sheet).rectangle((350*i+3,3,350*i+245,30),fill='#fffbf6')
        ImageDraw.Draw(sheet).text((350*i+10,11),('%+d° DRAFT'%angle if angle else '0° LOCKED ORIGINAL'),fill='#5b4336')
    sheet.save(output/'05-arm-motion-proof-NOT-APPROVED.png')
    (output/'review.html').write_text(HTML,encoding='utf8')
    report={'locked_source_sha256':digest,'neutral_exact':True,'independent_shoulder_pivot':list(SHOULDER_PIVOT),
            'candidate_hidden_art':True,'candidate_origin':candidate_origin,
            'art_import_passed_identity_gate':underpaint is not None,
            'anatomically_approved':False,'premium_ready':False,
            'integrated_in_app':False,'required_next':'artist-authored hidden shoulder, cloth, hair and anatomically correct hand'}
    (output/'premium-readiness.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
    return report

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--source',required=True);parser.add_argument('--output',required=True)
    parser.add_argument('--underpaint',help='Optional 512x1024 PNG painted ONLY under the original arm')
    args=parser.parse_args()
    print(json.dumps(build(args.source,args.output,args.underpaint),indent=2))
