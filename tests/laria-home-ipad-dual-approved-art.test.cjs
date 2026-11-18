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
