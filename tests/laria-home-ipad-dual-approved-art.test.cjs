'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const script=read('laer-litt-mer/home-kjosnes-v15.js');
const css=read('laer-litt-mer/home-kjosnes-v15.css');
const rail=read('laer-litt-mer/laria-home-ipad-rail-v1.css');
const catalog=JSON.parse(read('docs/LARIA-GROVANOVA-APPROVED-CANDIDATES-2026-11-18.json'));
const landscape=JSON.parse(read('laer-litt-mer/assets/home-v15/grovanova-ipad-landscape-master.json'));
const portrait=JSON.parse(read('laer-litt-mer/assets/home-v15/grovanova-ipad-portrait-master.json'));
const rect=r=>Array.isArray(r)&&r.length===4&&r.every(x=>Number.isFinite(x)&&x>=0&&x<=1)&&r[2]>0&&r[3]>0&&r[0]+r[2]<=1&&r[1]+r[3]<=1;

test('both owner-approved concepts are registered by exact dimensions and SHA, not active in the app',()=>{
 assert.equal(catalog.status,'owner-approved-visual-direction-awaiting-in-app-acceptance');
 assert.notEqual(landscape.status,'approved');
 assert.notEqual(portrait.status,'approved');
 for(const [orientation,expect] of [['landscape',[2048,1536]],['portrait',[2048,2732]]]){
  const entry=catalog[orientation];
  assert.deepEqual([entry.width,entry.height],expect);
  assert.match(entry.sha256,/^[a-f0-9]{64}$/i);
  assert.match(entry.path,/^laer-litt-mer\/assets\/home-v15\/grovanova-ipad-(?:portrait|landscape)-candidate-20261118\.webp$/);
  for(const key of ['logo','subjects','journey','nav','adult','liveCopy'])
   assert(rect(entry.ui[key]),orientation+' invalid '+key);
  for(const key of ['sun','water','journeyGlow'])
   assert(rect(entry.ui.ambient[key]),orientation+' invalid '+key);
  assert.equal(entry.ui.signBoards.length,4);
  assert(entry.ui.signBoards.every(rect));
  const image=path.join(root,entry.path);
  // Binary images are imported separately, never silently fabricated in CI.
  if(fs.existsSync(image)){
   const bytes=fs.readFileSync(image);
   assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.sha256);
  }else assert.notEqual((orientation==='portrait'?portrait:landscape).status,'approved');
 }
});

test('landscape is separately gated, iPhone/locked art are untouched, and art decoding is SHA checked',()=>{
 assert.match(script,/IPAD_LANDSCAPE_MANIFEST/);
 assert.match(script,/function approvedIpadLandscapeMaster\(\)/);
 assert.match(script,/if\(!isIpadHome\(\)\|\|isPortrait\(\)\)return null/);
 assert.match(script,/candidate\.width>=2048&&candidate\.height>=1536/);
 assert.match(script,/candidate\.status==='approved'/);
 assert.match(script,/crypto\.subtle\.digest\('SHA-256',bytes\)/);
 assert.match(script,/let approvedMaster=portraitMaster\|\|landscapeMaster/);
 assert.match(script,/ipad-landscape-approved/);
 assert.match(script,/const originalMaster=portrait\?PHONE_MASTER:TABLET_MASTER/);
 assert.match(script,/owner-approved-ui-free/);
 assert.match(script,/host\.dataset\.bc15CardArt==='owner-approved-ui-free'/);
 assert.match(rail,/data-bc15-presentation="live"/);
 assert.match(css,/data-bc15-master="ipad-landscape-approved"/);
});

test('actual iPad cover must not clip approved live UI in either orientation',()=>{
 const sizes={portrait:[[820,1180],[1024,1366]],landscape:[[1180,820],[1024,768]]};
 for(const [orientation,viewports] of Object.entries(sizes)){
  const art=catalog[orientation];
  for(const [vw,vh] of viewports){
   const scale=Math.max(vw/art.width,vh/art.height);
   const imageWidth=art.width*scale,imageHeight=art.height*scale;
   const ox=(vw-imageWidth)/2,oy=(vh-imageHeight)/2;
   const elements={...Object.fromEntries(
     ['logo','subjects','journey','nav','adult','liveCopy'].map(k=>[k,art.ui[k]])),
     ...Object.fromEntries(art.ui.signBoards.map((r,i)=>['sign'+i,r]))};
   for(const [name,rect] of Object.entries(elements)){
    const [x,y,w,h]=rect;
    const left=ox+x*imageWidth,top=oy+y*imageHeight;
    const right=left+w*imageWidth,bottom=top+h*imageHeight;
    assert(left>=10&&top>=10&&right<=vw-10&&bottom<=vh-10,
      orientation+' '+vw+'x'+vh+' '+name+' clipped: '+JSON.stringify({left,top,right,bottom}));
    if(name.startsWith('sign')){
     assert(w*imageWidth>=44&&h*imageHeight>=44,orientation+' '+name+' has a small touch target');
    }
   }
  }
 }
});
