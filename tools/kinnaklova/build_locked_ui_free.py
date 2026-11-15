#!/usr/bin/env python3
"""Source-faithful Kinnaklova edit: unchanged pixels everywhere outside old UI."""
import sys,hashlib,json
from pathlib import Path
import numpy as np,cv2
from PIL import Image
src=Path("laer-litt-mer/assets/kinnaklova/kinnaklova-scene-clean-approved-20261026.webp")
dst=Path("laer-litt-mer/assets/kinnaklova/kinnaklova-ui-free-approved.webp")
expected="d2e2d37b4c54191383457f423c1d568cd538391046e79e6f66e7a8b1928c0e57"
def sha(path):
 return hashlib.sha256(path.read_bytes()).hexdigest()
assert sha(src)==expected,"Locked original changed"
orig=cv2.imread(str(src));gen=cv2.imread(sys.argv[1]);h,w=orig.shape[:2]
assert (w,h)==(1672,941) and gen.shape[:2]==(1088,1920)
gen=cv2.resize(gen,(w,h),interpolation=cv2.INTER_AREA)
matrix=np.array([[1.00043937,0.0000618298614,-0.300467838],
                 [-0.0000618298614,1.00043937,-0.111252855]],dtype=np.float64)
gen=cv2.warpAffine(gen,matrix,(w,h),flags=cv2.INTER_LANCZOS4,borderMode=cv2.BORDER_REFLECT101)
mask=np.zeros((h,w),np.uint8)
regions=[
 [(15,15),(368,14),(382,21),(385,75),(372,88),(14,88)],
 [(719,0),(922,0),(948,48),(1017,67),(1099,81),(1156,94),(1162,160),(1133,194),(1077,200),(1072,231),(628,230),(604,206),(593,190),(539,187),(529,130),(547,91),(584,73),(697,45)],
 [(376,694),(642,693),(678,706),(688,753),(676,795),(657,819),(642,832),(607,832),(608,851),(581,851),(582,818),(405,822),(386,811),(368,789)],
 [(1034,462),(1288,464),(1317,483),(1319,526),(1312,548),(1281,563),(1064,562),(1030,540)],
 [(1340,636),(1587,633),(1636,645),(1644,684),(1642,729),(1616,752),(1599,757),(1594,783),(1572,784),(1579,750),(1386,765),(1377,786),(1361,780),(1373,744),(1340,727),(1326,686)]
]
for pts in regions:cv2.fillPoly(mask,[np.array(pts,np.int32)],255)
for x0,y0,x1,y1 in [(910,24,959,61),(995,50,1055,91),(1044,60,1111,93),(1116,127,1179,199),(1286,470,1322,534)]:
 cv2.rectangle(mask,(x0,y0),(x1,y1),255,-1)
paths=[
 [(690,808),(742,805),(794,801),(825,784),(838,754),(829,720),(801,692),(776,662)],
 [(883,530),(851,530),(816,545),(789,568),(780,592),(790,615),(815,626),(851,635),(892,646)],
 [(1152,570),(1190,582),(1220,586),(1247,600),(1271,626),(1288,657),(1295,682),(1324,699)]
]
for pts in paths:cv2.polylines(mask,[np.array(pts,np.int32)],False,255,45,cv2.LINE_AA)
inner=cv2.erode(mask,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(9,9)))
alpha=(cv2.GaussianBlur(mask,(0,0),10)/255.0).astype(np.float32)
alpha[mask==0]=0;alpha[inner>0]=1
out=np.rint(orig.astype(np.float32)*(1-alpha[:,:,None])+gen.astype(np.float32)*alpha[:,:,None]).clip(0,255).astype(np.uint8)
assert np.array_equal(out[mask==0],orig[mask==0]),"A protected pixel changed"
changed=float(np.mean(mask>0))
assert changed<0.2,"Too much of approved scene changed"
dst.parent.mkdir(parents=True,exist_ok=True)
Image.fromarray(cv2.cvtColor(out,cv2.COLOR_BGR2RGB)).save(dst,format="WEBP",lossless=True,method=6)
assert np.array_equal(np.array(Image.open(dst).convert("RGB")),cv2.cvtColor(out,cv2.COLOR_BGR2RGB))
report={"sha256":sha(dst),"locked_source_sha256":expected,"changed_ratio":changed,"unmasked_identical":True,"dimensions":[w,h]}
Path("kinnaklova-restoration-report.json").write_text(json.dumps(report,indent=2)+"\n")
print("CLEAN_ART_SHA256="+sha(dst))
print(json.dumps(report))
