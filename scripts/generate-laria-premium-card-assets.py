#!/usr/bin/env python3
"""Generate dedicated premium card WebPs from EXISTING home scene paintings.

The approved 10 October journey maps are never read or modified.
No small overview/screenshot crops are used; only individual 2026-10-10
high-resolution home illustrations are the foundation for eight new scenes.
Artwork is decorative, the application owns all labels, progress and actions.
"""
from __future__ import annotations
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageFont, ImageOps
from pathlib import Path
from math import cos, sin, pi, sqrt
import random, sys, json, hashlib

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'laer-litt-mer'
DEST = SOURCE / 'assets' / 'cards'
SIZE = (1024, 704)

JOURNEY = {'norwegian': 'home-norwegian-v14.webp', 'math': 'home-math-v14.webp',
           'english': 'home-english-v14.webp', 'geography': 'home-geography-v14.webp'}
EXPLORE = {'globe': 'geography', 'words': 'norwegian', 'fraction': 'math', 'multiply': 'math'}
PALETTES = {
 'norwegian':(244,201,130),'math':(244,213,143),'english':(237,189,159),
 'geography':(111,214,221),'globe':(135,213,225),'words':(249,204,116),
 'fraction':(241,187,111),'multiply':(250,210,145)
}

def font(sz, bold=False):
 names=(['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf','/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf']
        if bold else ['/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf','/usr/share/fonts/truetype/liberation2/LiberationSerif-Regular.ttf'])
 for p in names:
  if Path(p).exists():return ImageFont.truetype(p,sz)
 return ImageFont.load_default()

def cover(image, size, focus=(.5,.5)):
 w,h=image.size; tw,th=size; fac=max(tw/w,th/h); sw,sh=round(w*fac),round(h*fac)
 image=image.resize((sw,sh),Image.Resampling.LANCZOS)
 x=int((sw-tw)*focus[0]);y=int((sh-th)*focus[1]);return image.crop((x,y,x+tw,y+th))

def cloudlight(img, tint, shift=0):
 img=ImageEnhance.Color(img).enhance(1.11)
 img=ImageEnhance.Contrast(img).enhance(1.1)
 grade=Image.new('RGBA', SIZE, (0,0,0,0));p=grade.load();w,h=SIZE
 # Light comes from the upper right; a subtle dark foreground anchors the objects.
 for y in range(h):
  for x in range(w):
   highlight=max(0,1-sqrt(((x-w*.78)/(w*.95))**2+((y-h*.12)/(h*.95))**2))
   dark=(max(0,(y/h-.50))*0.46)+(abs(x-w/2)/(w/2))**2*.14
   r,g,b=tint
   if shift: r,g,b=(r*.66,g*1.08,b*1.20)
   p[x,y]=(int(r),int(g),int(b),int(41*highlight))
 img=Image.alpha_composite(img.convert('RGBA'),grade)
 veil=Image.new('RGBA', SIZE, (0,0,0,0));pv=veil.load()
 for y in range(h):
  for x in range(w):
   v=(max(0,y/h-.40)*.34+(abs(x-w/2)/(w/2))**2*.09)
   pv[x,y]=(18,19,15,min(135,int(v*155)))
 return Image.alpha_composite(img,veil)

def shadow(canvas,rect,blur=16,opacity=130,radius=18,dy=9):
 mask=Image.new('L',SIZE,0);d=ImageDraw.Draw(mask);x0,y0,x1,y1=rect
 d.rounded_rectangle((x0,y0+dy,x1,y1+dy),radius=radius,fill=opacity)
 lay=Image.new('RGBA',SIZE,(18,18,15,0));lay.putalpha(mask.filter(ImageFilter.GaussianBlur(blur)))
 return Image.alpha_composite(canvas,lay)

def leaf_flares(im,name):
 rng=random.Random('laria-v1:'+name)
 lay=Image.new('RGBA',SIZE,(0,0,0,0));d=ImageDraw.Draw(lay)
 for _ in range(55):
  x=rng.randrange(20,SIZE[0]-20);y=rng.randrange(30,SIZE[1]-35)
  rad=rng.randint(1,3)
  rgba=rng.choice([(255,247,192,130),(255,207,104,100),(255,250,214,90),(197,233,214,120)])
  d.ellipse((x-rad,y-rad,x+rad,y+rad),fill=rgba)
 lay=lay.filter(ImageFilter.GaussianBlur(.7))
 return Image.alpha_composite(im,lay)

def add_book(img,origin=(125,495),scale=1.0):
 x,y=origin; s=scale
 def xy(a,b):return(int(x+a*s),int(y+b*s))
 img=shadow(img,(*xy(-85,-20),*xy(165,90)),blur=18,opacity=150,dy=15)
 lay=Image.new('RGBA',SIZE);d=ImageDraw.Draw(lay)
 d.polygon([xy(-85,-13),xy(0,-6),xy(12,67),xy(-75,53)],fill='#ead9ac',outline='#7d5435',width=max(2,int(4*s)))
 d.polygon([xy(0,-6),xy(140,-27),xy(166,36),xy(12,67)],fill='#ffeac1',outline='#7e5836',width=max(2,int(4*s)))
 d.line([xy(0,-6),xy(12,67)],fill='#ac7850',width=max(2,int(4*s)))
 for i in range(5):
  d.line([xy(-70,-2+i*9),xy(-6,12+i*9)],fill='#bb9269',width=max(1,int(2*s)))
  d.line([xy(28,9+i*9),xy(126,-9+i*9)],fill='#cfa579',width=max(1,int(2*s)))
 return Image.alpha_composite(img,lay)

def add_lantern(img,x,y,scale=1):
 x=int(x);y=int(y);s=scale
 lay=Image.new('RGBA',SIZE);d=ImageDraw.Draw(lay)
 for rad,alpha in ((80,13),(55,25),(35,40)):
  d.ellipse((x-rad*s,y-rad*s,x+rad*s,y+rad*s),fill=(255,192,68,alpha))
 d.line([(x,y-int(49*s)),(x,y-int(35*s))],fill=(42,32,19,220),width=max(2,int(6*s)))
 d.polygon([(x-int(24*s),y-int(24*s)),(x,y-int(43*s)),(x+int(24*s),y-int(24*s))],fill=(81,56,35,255))
 d.rounded_rectangle((x-int(26*s),y-int(25*s),x+int(26*s),y+int(34*s)),radius=int(7*s),fill=(82,53,29,255),outline=(245,209,123,255),width=max(2,int(3*s)))
 d.rounded_rectangle((x-int(18*s),y-int(19*s),x+int(18*s),y+int(26*s)),radius=int(3*s),fill=(255,208,101,255))
 d.line([(x,y-int(22*s)),(x,y+int(30*s))],fill=(123,73,33,180),width=max(1,int(3*s)))
 return Image.alpha_composite(img,lay)

def stone_cube(img,x,y,sz,label,color='#dec18a'):
 lay=Image.new('RGBA',SIZE);d=ImageDraw.Draw(lay)
 x=int(x);y=int(y);sz=int(sz)
 d.polygon([(x,y),(x+sz,y),(x+sz+11,y+19),(x+12,y+19)],fill='#f3deaa',outline='#705f49')
 d.rounded_rectangle((x,y+10,x+sz,y+sz+12),radius=9,fill=color,outline='#76604a',width=4)
 d.polygon([(x+sz,y+12),(x+sz+11,y+18),(x+sz+11,y+sz+4),(x+sz,y+sz+12)],fill='#99815d')
 bbox=d.textbbox((0,0),label,font=font(round(sz*.53),True));tw=bbox[2]-bbox[0];th=bbox[3]-bbox[1]
 d.text((x+(sz-tw)/2,y+sz*.50-th/2),label,font=font(round(sz*.53),True),fill='#72543b',stroke_width=1,stroke_fill='#ffdb9c')
 return Image.alpha_composite(img,lay)

def wood_sign(img,x,y,msg,angle=0):
 sign=Image.new('RGBA',(340,92));d=ImageDraw.Draw(sign)
 d.rounded_rectangle((8,8,327,82),radius=13,fill='#aa713f',outline='#594024',width=6)
 d.rounded_rectangle((15,13,320,74),radius=10,fill='#deac6d',outline='#f3d6a0',width=2)
 f=font(35,True);bb=d.textbbox((0,0),msg,font=f)
 d.text(((335-(bb[2]-bb[0]))/2,25),msg,fill='#67462a',font=f)
 sign=sign.rotate(angle,Image.Resampling.BICUBIC,expand=True)
 lay=Image.new('RGBA',SIZE)
 lay.alpha_composite(sign,(int(x),int(y)))
 return Image.alpha_composite(img,lay)

def compass(img,x,y,r=115):
 r=int(r);lay=Image.new('RGBA',SIZE);d=ImageDraw.Draw(lay)
 d.ellipse((x-r-10,y-r-10,x+r+10,y+r+10),fill='#624528',outline='#e5b86d',width=10)
 d.ellipse((x-r+12,y-r+12,x+r-12,y+r-12),fill='#f8e6bf',outline='#8c6840',width=6)
 d.line((x-r+30,y,x+r-30,y),fill='#ab8755',width=3)
 d.line((x,y-r+30,x,y+r-30),fill='#ab8755',width=3)
 d.polygon([(x,y-r+22),(x-19,y),(x,y+r-22),(x+19,y)],fill='#c46b47',outline='#71462b')
 d.polygon([(x-r+22,y),(x,y-19),(x+r-22,y),(x,y+19)],fill='#5f8b88',outline='#71462b')
 d.ellipse((x-9,y-9,x+9,y+9),fill='#edd08a',outline='#754e2f',width=3)
 return Image.alpha_composite(img,lay)

def aurora(im):
 glow=Image.new('RGBA',SIZE);d=ImageDraw.Draw(glow)
 for k in range(9):
  curve=[(int(x),int(50+140*sin(x/180.+k*.17)+k*13+(x/1024)*35)) for x in range(0,1025,8)]
  d.line(curve,fill=(65+k*7,225,182, max(17,100-k*8)),width=10+int(k*4))
 glow=glow.filter(ImageFilter.GaussianBlur(19))
 return Image.alpha_composite(im,glow)

def globe(im):
 x,y,r=600,360,202
 im=shadow(im,(x-r,y-r,x+r,y+r+52),blur=29,opacity=150,dy=23)
 lay=Image.new('RGBA',SIZE);d=ImageDraw.Draw(lay)
 # Brass meridians, modeled land, glazed rim, base and globe stand.
 d.line((x,y+r,x,y+r+145),fill='#9c6834',width=23)
 d.ellipse((x-134,y+r+123,x+134,y+r+156),fill='#68432a',outline='#e1bd70',width=11)
 d.ellipse((x-r-15,y-r-15,x+r+15,y+r+15),fill='#80562c',outline='#e3c177',width=15)
 d.ellipse((x-r,y-r,x+r,y+r),fill='#1c8db9',outline='#81ccdb',width=6)
 rng=random.Random('laria-globe-2026')
 for i in range(5):
  px=x-r+30+i*77
  d.arc((px,y-r,px+135,y+r),75,300,fill=(200,238,215,72),width=4)
 d.arc((x-r,y-r*.37,x+r,y+r*.37),5,176,fill=(220,247,221,130),width=4)
 continent=[(-106,-105),(-45,-134),(-7,-114),(32,-68),(19,-17),(-28,-9),(-40,58),(-3,89),(-51,149),(-89,124),(-84,42),(-131,-11)]
 d.polygon([(x+int(dx*.99),y+int(dy*.98)) for dx,dy in continent],fill='#83bd76',outline='#e5dd9d',width=4)
 d.polygon([(x+52,y-38),(x+124,y-53),(x+149,y+2),(x+111,y+68),(x+53,y+50)],fill='#83ad64',outline='#e1d48b',width=3)
 d.arc((x-r+20,y-r+4,x+r-20,y+r-3),25,310,fill=(235,251,244,65),width=5)
 d.ellipse((x-117,y-143,x-47,y-65),fill=(238,247,238,40))
 d.arc((x-r-12,y-r-12,x+r+12,y+r+12),190,335,fill='#ffdfa2',width=13)
 return Image.alpha_composite(im,lay)

def fraction(im):
 im=shadow(im,(75,405,925,750),blur=23,opacity=140,dy=10)
 lay=Image.new('RGBA',SIZE);d=ImageDraw.Draw(lay)
 d.rounded_rectangle((35,490,1012,740),radius=24,fill='#8a542c',outline='#f0c47b',width=10)
 d.rounded_rectangle((38,480,1005,700),radius=21,fill='#b68148',outline='#f7d395',width=7)
 x,y,r=506,443,210
 d.ellipse((x-r-13,y-r+18,x+r+13,y+r+33),fill='#704829',outline='#e6c88f',width=9)
 colors=['#86b8ab','#edac7b','#b3c879','#d79880']
 for i,c in enumerate(colors):
  d.pieslice((x-r,y-r,x+r,y+r),i*90,i*90+90,fill=c)
  d.arc((x-r,y-r,x+r,y+r),i*90,i*90+90,fill='#fff2d0',width=12)
 d.line((x-r,y,x+r,y),fill='#fff2d0',width=12)
 d.line((x,y-r,x,y+r),fill='#fff2d0',width=12)
 d.ellipse((x-21,y-21,x+21,y+21),fill='#ffe9c3',outline='#8f643e',width=4)
 for px,py,c in ((153,577,'#d69775'),(855,574,'#86bca7')):
  d.ellipse((px-45,py-30,px+50,py+45),fill=c,outline='#fff0d0',width=6)
 return Image.alpha_composite(im,lay)

def multiply(im):
 im=shadow(im,(275,95,795,694),blur=25,opacity=190,dy=12)
 lay=Image.new('RGBA',SIZE);d=ImageDraw.Draw(lay)
 d.rounded_rectangle((236,65,810,684),radius=32,fill='#5a3923',outline='#d0a365',width=15)
 d.rounded_rectangle((257,81,795,663),radius=26,fill='#8f623c',outline='#ecc487',width=7)
 numbers=[['2','4','6'],['3','6','9'],['4','8','12']]
 for ri,row in enumerate(numbers):
  for ci,v in enumerate(row):
   x=285+ci*168;y=112+ri*176
   d.rounded_rectangle((x+4,y+7,x+142,y+149),radius=15,fill='#65472c')
   d.rounded_rectangle((x,y,x+138,y+143),radius=15,fill='#edce92',outline='#f5dfb0',width=7)
   d.rounded_rectangle((x+5,y+5,x+132,y+137),radius=12,outline='#ad8658',width=4)
   f=font(66,True);bb=d.textbbox((0,0),v,font=f)
   d.text((x+(139-(bb[2]-bb[0]))/2,y+26),v,font=f,fill='#507971',stroke_width=1,stroke_fill='#d3e2bd')
 return Image.alpha_composite(im,lay)

def wordhunt(im):
 im=add_book(im,(99,547),1.15)
 im=shadow(im,(363,255,871,647),blur=15,opacity=150)
 for x,y,k,shade in [(396,283,'A','#ffe0a8'),(572,329,'B','#efca91'),(711,410,'C','#f6deb4')]:
  im=stone_cube(im,x,y,152,k,shade)
 im=add_lantern(im,906,140,.85)
 return im

def render(name,base):
 cool=name in ('geography','globe')
 focuses={'norwegian':(.48,.43),'math':(.52,.5),'english':(.50,.45),'geography':(.53,.43),
   'globe':(.40,.48),'words':(.52,.46),'fraction':(.54,.49),'multiply':(.50,.47)}
 art=cover(base, SIZE, focuses.get(name,(.5,.5)))
 art=cloudlight(art,PALETTES[name],int(cool))
 if name=='norwegian':
  art=add_book(art,(149,542),1.12);art=add_lantern(art,849,328,.79)
 elif name=='math':
  art=stone_cube(art,147,442,160,'2');art=stone_cube(art,358,383,188,'×','#c2daa5');art=stone_cube(art,634,421,159,'3')
 elif name=='english':
  art=wood_sign(art,483,463,'Hello!',-7);art=add_lantern(art,201,248,.90)
 elif name=='geography':
  art=aurora(art);art=compass(art,815,505,97);art=add_lantern(art,159,523,.9)
 elif name=='globe':
  art=globe(art);art=add_book(art,(130,584),.76)
 elif name=='words':art=wordhunt(art)
 elif name=='fraction':art=fraction(art)
 elif name=='multiply':art=multiply(art)
 art=leaf_flares(art,name)
 # Retain painted textures from the source. All text/progression remains real HTML.
 art=ImageEnhance.Sharpness(art.convert('RGB')).enhance(1.09)
 return art

def main():
 DEST.mkdir(parents=True,exist_ok=True)
 images={key:Image.open(SOURCE / src).convert('RGB') for key,src in JOURNEY.items()}
 specs=[('reisen',n,n) for n in JOURNEY]+[('utforsk',n,EXPLORE[n]) for n in EXPLORE]
 manifest={}
 for group,name,source in specs:
  directory=DEST/group;directory.mkdir(parents=True,exist_ok=True)
  target=directory/(name+'-premium.webp')
  im=render(name,images[source]);im.save(target,'WEBP',quality=84,method=6)
  data=target.read_bytes()
  manifest[f'{group}/{name}']={'path':str(target.relative_to(SOURCE)),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'size':[im.width,im.height]}
  print(f'{group}/{name}: {len(data)} bytes, {im.width}x{im.height}, {manifest[f"{group}/{name}"]["sha256"][:12]}')
  assert 12_000<len(data)<500_000, f'invalid WebP file size for {name}'
 (DEST/'manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n')
 assert len(manifest)==8
 print('Premium card artwork ready: 8 distinct images; original maps untouched')
if __name__=='__main__':main()