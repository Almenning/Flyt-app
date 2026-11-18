'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const script=fs.readFileSync(path.join(root,'laer-litt-mer/home-kjosnes-v15.js'),'utf8');
const css=fs.readFileSync(path.join(root,'laer-litt-mer/home-kjosnes-v15.css'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'laer-litt-mer/assets/home-v15/grovanova-ipad-portrait-master.json'),'utf8'));

test('unapproved Grovanova iPad portrait art cannot replace the locked fallback',()=>{
 assert.equal(manifest.status,'awaiting-visual-approval');
 assert.equal(manifest.source,null);
 assert.equal(manifest.sha256,null);
 assert.match(script,/IPAD_PORTRAIT_MANIFEST/);
 assert.match(script,/candidate\.status==='approved'/);
 assert.match(script,/candidate\.width>=2048&&candidate\.height>=2732/);
 assert.match(script,/const originalMaster=portrait\?PHONE_MASTER:TABLET_MASTER/);
 assert.match(script,/image=await decoded\(originalMaster\)/);
 assert.match(script,/portraitMaster=null;\s+image=await decoded\(cleanMaster\)/);
});

test('an approved portrait master must supply separate UI safe areas',()=>{
 assert.match(script,/ui\.signBoards\.length===4/);
 assert.match(script,/\['logo','subjects','journey','nav','adult','liveCopy'\]/);
 assert.match(script,/value\[2\]>0&&value\[3\]>0&&value\[0\]\+value\[2\]<=1&&value\[1\]\+value\[3\]<=1/);
 assert.match(script,/crypto\.subtle\.digest\('SHA-256',bytes\)/);
 assert.match(script,/portrait-art-sha-mismatch/);
 assert.match(script,/approvedPortrait\.ui\.ambient\.sun/);
 assert.match(script,/mapControlsToArtwork\(host,image\.width,image\.height,portrait,portraitMaster\)/);
 assert.match(script,/if\(portraitMaster\)host\.dataset\.bc15CardArt='owner-approved-ui-free'/);
 assert.match(css,/data-bc15-master="ipad-portrait-approved"/);
 assert.match(css,/bc15-approved-logo/);
 assert.match(css,/\.bc12-journey\{\s+opacity:1!important/);
});
