'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const script=fs.readFileSync(path.join(root,'laer-litt-mer/home-kjosnes-v15.js'),'utf8');

test('unapproved Grovanova iPad portrait art cannot replace the locked fallback',()=>{
 assert.match(script,/status:'awaiting-visual-approval'/);
 assert.match(script,/source:null/);
 assert.match(script,/sha256:null/);
 assert.match(script,/candidate\.status==='approved'/);
 assert.match(script,/candidate\.width>=2048&&candidate\.height>=2732/);
 assert.match(script,/APPROVED_IPAD_PORTRAIT_MASTER/);
 assert.match(script,/const originalMaster=portrait\?PHONE_MASTER:TABLET_MASTER/);
 assert.match(script,/image=await decoded\(originalMaster\)/);
 assert.match(script,/portraitMaster=null;\s+image=await decoded\(cleanMaster\)/);
});

test('an approved portrait master must supply separate UI safe areas',()=>{
 assert.match(script,/ui\.signBoards\.length===4/);
 assert.match(script,/\['subjects','journey','nav','adult','liveCopy'\]/);
 assert.match(script,/approvedPortrait\.ui\.ambient\.sun/);
 assert.match(script,/mapControlsToArtwork\(host,image\.width,image\.height,portrait,portraitMaster\)/);
 assert.match(script,/if\(portraitMaster\)host\.dataset\.bc15CardArt='owner-approved-ui-free'/);
});
