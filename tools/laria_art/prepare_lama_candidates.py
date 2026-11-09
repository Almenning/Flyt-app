#!/usr/bin/env python3
"""Source-preserving Big-LaMa art candidates. NEVER activate; review only."""
import argparse,hashlib,json,os,urllib.request
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
from prepare_clean_art_previews import source,make_mask,checked,comparison,LOCKED
URL='https://github.com/Sanster/models/releases/download/add_big_lama/big-lama.pt'
MD5='e3aa4aaa15225a33ec84f9f4bc47e500'
def model(path):
 if not path.exists():
  with urllib.request.urlopen(URL,timeout=90) as src,path.open('wb') as dst:
   while chunk:=src.read(1024*1024):dst.write(chunk)
 if hashlib.md5(path.read_bytes()).hexdigest()!=MD5:raise ValueError('Pinned LaMa checksum mismatch')
 import torch
 torch.set_num_threads(min(4,os.cpu_count() or 1))
 return torch.jit.load(str(path),map_location='cpu').eval()
def canvas(world):
 original,raw=source(world)
 mask=make_mask(world)
 if world=='kinnaklova':
  # Narrow only the former title/breadcrumb masks: they conceal plain sky,
  # not the protected Kinnaklova peaks or the intact church.
  mask=Image.new('L',original.size,0)
  draw=ImageDraw.Draw(mask)
  for box in ((8,10,420,125),(535,0,1180,250),(377,693,692,817),
              (1037,458,1320,571),(1341,655,1645,759)):
   draw.rectangle(box,fill=255)
  return original,mask,(0,0),raw
 w,h=1366,1024
 x,y=(w-original.width)//2,(h-original.height)//2
 img=Image.new('RGB',(w,h),(89,151,199));img.paste(original,(x,y))
 big=Image.new('L',(w,h),255)
 ImageDraw.Draw(big).rectangle((x,y,x+original.width-1,y+original.height-1),fill=0)
 big.paste(mask,(x,y))
 return img,big,(x,y),raw
def inpaint(m,img,mask,max_side=1152):
 import torch
 w,h=img.size
 s=min(1.,max_side/max(w,h))
 nw=max(8,round(w*s/8)*8);nh=max(8,round(h*s/8)*8)
 rgb=np.asarray(img.resize((nw,nh),Image.Resampling.LANCZOS)).astype('float32')/255
 msk=np.asarray(mask.resize((nw,nh),Image.Resampling.NEAREST)).astype('float32')/255
 x=torch.from_numpy(rgb.transpose(2,0,1).copy())[None]
 y=torch.from_numpy(msk.copy())[None,None]
 with torch.inference_mode():
  prediction=m(x,y)
  if isinstance(prediction,(tuple,list)):prediction=prediction[0]
  result=prediction.clamp(0,1)[0].permute(1,2,0).cpu().numpy()
 generated=Image.fromarray(np.uint8(result*255)).resize((w,h),Image.Resampling.LANCZOS)
 return Image.composite(generated,img,mask)
def run(out,checkpoint,max_side,worlds):
 out.mkdir(parents=True,exist_ok=True);m=model(checkpoint)
 report={'status':'REVIEW_ONLY_NOT_APPROVED','activated':False,'approved':False,'scenes':{}}
 for world in worlds:
  src,mask,offset,raw=canvas(world)
  result=inpaint(m,src,mask,max_side)
  changed=checked(src,result,mask)
  name=world+'-lama-NOT-APPROVED.png'
  result.save(out/name,optimize=True);mask.save(out/(world+'-lama-mask.png'))
  comparison(src,result,world,'LaMa').save(out/(world+'-lama-comparison.png'))
  report['scenes'][world]={'file':name,'size':list(result.size),'source_sha256':hashlib.sha256(raw).hexdigest(),
   'original_placement':offset,'protected_pixel_changes':0,'changed_inside_mask':changed,
   'candidate_sha256':hashlib.sha256((out/name).read_bytes()).hexdigest(),'approved':False}
 (out/'REPORT-NOT-APPROVED.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print('CANDIDATES ONLY: all original files and active app remain unchanged')
def self_test():
 root=Path(__file__).resolve().parents[2]
 for world in ('grovanova','kinnaklova'):
  im,mask,offset,raw=canvas(world)
  assert hashlib.sha256(raw).hexdigest()==hashlib.sha256((root/LOCKED[world]['file']).read_bytes()).hexdigest()
  assert im.size==mask.size and mask.getbbox()
  if world=='grovanova':assert im.size==(1366,1024)
 print('PASS locked original source and real 4:3 iPad canvas')
if __name__=='__main__':
 p=argparse.ArgumentParser()
 p.add_argument('--self-test',action='store_true')
 p.add_argument('--out',type=Path,default=Path('/tmp/laria-lama-review'))
 p.add_argument('--model',type=Path,default=Path('/tmp/big-lama.pt'))
 p.add_argument('--max-side',type=int,default=1152)
 p.add_argument('--world',choices=['grovanova','kinnaklova'],action='append')
 a=p.parse_args()
 if a.self_test:self_test()
 else:run(a.out,a.model,a.max_side,a.world or ['grovanova','kinnaklova'])
