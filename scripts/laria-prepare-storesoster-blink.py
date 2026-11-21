#!/usr/bin/env python3
"""Reproduce the review-only blink from existing whole frames, without new art.

Run from the repository root, choosing a separate export directory:
  python scripts/laria-prepare-storesoster-blink.py --output-dir /tmp/laria-blink
Requires Pillow, numpy and FFmpeg. The encoding algorithm matches the delivered
5500 ms lossless resource; output bytes depend on the recorded library versions.
"""
from pathlib import Path
import argparse, hashlib, io, json, struct, subprocess
import numpy as np
from PIL import Image, ImageDraw

SOURCE_SHA='ee17da9e1e6d2ba9679084bf53ea620de9375996e7272063c887f18ac50c013b'
ROOT=Path(__file__).resolve().parents[1]
DEFAULT_SOURCE=ROOT/'laer-litt-mer/assets/trollactor-motion/storesoster/wave-groundcut-20261121.webp'
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--source',type=Path,default=DEFAULT_SOURCE);p.add_argument('--output-dir',type=Path,required=True,help='Separate export directory for the reproduced animation, preview and metadata');a=p.parse_args();out=a.output_dir;out.mkdir(parents=True,exist_ok=True)
 if sha(a.source)!=SOURCE_SHA:raise SystemExit('Source SHA mismatch: the reviewed pre-wave frames are pinned.')
 source=Image.open(a.source);frames=[];source_map=[];source_time=0
 for i in range(source.n_frames):
  source.seek(i);frame=source.convert('RGBA');duration=source.info['duration'];frames.append(frame.copy());source_map.append({'frame':i,'start_ms':source_time,'duration_ms':duration});source_time+=duration
 # Frame 8 starts at 750 ms: the first fully closed-eye frame before arm movement.
 indices=list(range(9))+list(range(7,-1,-1));durations=[source_map[i]['duration_ms'] for i in indices]
 # Blink starts immediately; all extra neutral hold follows it. Moving frames retain original 83/84 ms cadence.
 durations[-1]+=5500-sum(durations)
 mapping=[];cursor=0
 for n,(i,duration) in enumerate(zip(indices,durations)):
  mapping.append({'output_segment':n,'output_start_ms':cursor,'output_duration_ms':duration,'source_frame':i,'source_start_ms':source_map[i]['start_ms'],'source_duration_ms':source_map[i]['duration_ms'],'direction':'forward' if n<9 else 'reverse','added_neutral_pause_ms':duration-source_map[i]['duration_ms']});cursor+=duration
 assert cursor==5500 and max(source_map[i]['start_ms'] for i in indices)==750
 webp=out/'idle-blink-reuse-20261121.webp';selected=[frames[i] for i in indices]
 # Pillow's animation optimizer zeros invisible RGB even with exact=True.
 # Encode complete lossless frames independently, then mux full-canvas no-blend ANMF chunks.
 # This preserves every RGBA byte, including colors behind zero alpha.
 def chunk(tag,payload): return tag+struct.pack('<I',len(payload))+payload+(b'\0' if len(payload)%2 else b'')
 def u24(n): return n.to_bytes(3,'little')
 encoded_sources={}
 for i in set(indices):
  memory=io.BytesIO();frames[i].save(memory,format='WEBP',lossless=True,quality=70,method=3,exact=True)
  data=memory.getvalue();off=12;parts=[]
  while off<len(data):
   tag=data[off:off+4];size=struct.unpack('<I',data[off+4:off+8])[0];end=off+8+size+(size%2)
   if tag in [b'VP8L',b'ALPH',b'VP8 ']:parts.append(data[off:end])
   off=end
  assert np.array_equal(np.asarray(Image.open(io.BytesIO(data)).convert('RGBA')),np.asarray(frames[i]))
  encoded_sources[i]=b''.join(parts)
 width,height=selected[0].size
 parts=[chunk(b'VP8X',b'\x12\0\0\0'+u24(width-1)+u24(height-1)),chunk(b'ANIM',b'\0'*6)]
 for i,duration in zip(indices,durations):
  header=u24(0)+u24(0)+u24(width-1)+u24(height-1)+u24(duration)+b'\x02'
  parts.append(chunk(b'ANMF',header+encoded_sources[i]))
 body=b'WEBP'+b''.join(parts);webp.write_bytes(b'RIFF'+struct.pack('<I',len(body))+body)
 # Verify actual encoded pixels and timing, including fully transparent RGBA pixels.
 def segment_at(t):
  return next(m for m in mapping if m['output_start_ms']<=t<m['output_start_ms']+m['output_duration_ms'])
 decoded=Image.open(webp);dt=0;verified=[]
 for j in range(decoded.n_frames):
  decoded.seek(j);pixels=np.asarray(decoded.convert('RGBA'));duration=decoded.info['duration'];covered=[m for m in mapping if m['output_start_ms']<dt+duration and m['output_start_ms']+m['output_duration_ms']>dt]
  if not all(np.array_equal(pixels,np.asarray(frames[m['source_frame']])) for m in covered):raise SystemExit(f'Lossless RGBA verification failed at encoded frame {j}.')
  verified.append({'encoded_frame':j,'start_ms':dt,'duration_ms':duration,'source_frames':[m['source_frame'] for m in covered]});dt+=duration
 assert dt==5500
 decoded.seek(0);first=np.asarray(decoded.convert('RGBA'));decoded.seek(decoded.n_frames-1);last=np.asarray(decoded.convert('RGBA'));assert np.array_equal(first,last)
 print(json.dumps({'webp_ready':str(webp),'sha256':sha(webp),'bytes':webp.stat().st_size,'duration_ms':dt,'rgba_pixel_exact':True}),flush=True)
 # MP4 review: three 5.5-second cycles at the source nominal 12 fps; only frame repetition.
 mp4=out/'storesoster-blink-three-cycles.mp4';width,height=selected[0].size;bg=Image.new('RGBA',(width,height),(232,238,234,255));rgb=[Image.alpha_composite(bg,f).convert('RGB').tobytes() for f in frames[:9]]
 cmd=['ffmpeg','-nostdin','-v','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{width}x{height}','-framerate','12','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','16','-pix_fmt','yuv420p','-movflags','+faststart',str(mp4)]
 process=subprocess.Popen(cmd,stdin=subprocess.PIPE)
 for cycle in range(3):
  for n in range(66):process.stdin.write(rgb[segment_at((n+.5)*1000/12)['source_frame']])
 process.stdin.close()
 if process.wait()!=0:raise SystemExit('MP4 preview encode failed.')
 print(json.dumps({'mp4_ready':str(mp4),'bytes':mp4.stat().st_size,'duration_s':16.5}),flush=True)
 # Small contact series made only from retained whole frames; no alteration of the figure.
 contacts=[(0,'Open / neutral'),(6,'Closing'),(8,'Closed'),(10,'Opening (reverse)'),(16,'Open / neutral')];cw,ch=180,400;sheet=Image.new('RGB',(cw*len(contacts),ch),(245,247,245));draw=ImageDraw.Draw(sheet)
 for col,(n,label) in enumerate(contacts):
  im=Image.alpha_composite(bg,frames[indices[n]]).convert('RGB');im.thumbnail((176,360));sheet.paste(im,(col*cw,ch-360));draw.text((col*cw+4,5),label,fill=(20,35,30));draw.text((col*cw+4,20),f"{mapping[n]['output_start_ms']/1000:.3f}s / source {indices[n]}",fill=(20,35,30))
 sheet.save(out/'blink-contact-series.png')
 probe=json.loads(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration:stream=width,height,avg_frame_rate,nb_frames','-of','json',str(mp4)],check=True,capture_output=True,text=True).stdout)
 metadata={'title':'Storesøster – blink fra eksisterende animasjon','status':'review-only; not integrated','method':'Retain complete source frames 0–8, then play frames 7–0 in reverse; neutral frame holds make one 5500 ms cycle. No warping, interpolation, body-part layers or new pixels in the transparent asset.','new_ai_idle':False,'external_generations':0,'source':{'path':str(DEFAULT_SOURCE.relative_to(ROOT)),'sha256':SOURCE_SHA,'duration_ms':source_time,'frames':source.n_frames,'selected_last_frame':8,'selected_last_frame_start_ms':750,'selected_last_frame_end_ms':833,'selected_frames_visually_checked_before_arm_departure':True},'animation':{'file':webp.name,'sha256':sha(webp),'bytes':webp.stat().st_size,'width':width,'height':height,'duration_ms':dt,'loop_count':0,'loop_meaning':'infinite','lossless':True,'all_decoded_rgba_pixels_exact':True,'first_last_decoded_rgba_identical':True,'frames':decoded.n_frames},'preview':{'file':mp4.name,'sha256':sha(mp4),'bytes':mp4.stat().st_size,'cycles':3,'background_rgb':[232,238,234],'encoding':'H.264 preview only; transparent source remains lossless','timing':'12 fps nominal source cadence; whole frame selection only, never interpolation','ffprobe':probe},'frame_mapping':mapping,'encoded_verification':verified,'limitations':['Reopening the eyes reverses an existing closing motion; it is not a separately generated performance.','This provides one blink and a neutral pause, not a new breathing or six-state animation.','Not app-integrated or visually approved by the owner.'],'versions':{'pillow':Image.__version__,'numpy':np.__version__}}
 (out/'metadata.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n');print('Metadata and contact series ready.',flush=True)
if __name__=='__main__':main()
