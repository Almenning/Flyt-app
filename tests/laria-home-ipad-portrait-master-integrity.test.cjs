'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {verify}=require('../tools/laria_portrait_master_integrity.cjs');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'laria-portrait-gate-'));
const artDir=path.join(root,'laer-litt-mer/assets/home-v15');fs.mkdirSync(artDir,{recursive:true});
const fixture='TEST FIXTURE ONLY — NOT APPROVED GROVANOVA ART';
fs.writeFileSync(path.join(artDir,'__test-only-portrait-master.webp'),fixture);
const sha=crypto.createHash('sha256').update(fixture).digest('hex');
const ui={logo:[.1,.05,.25,.1],subjects:[.04,.28,.25,.3],journey:[.35,.7,.3,.1],nav:[.04,.86,.92,.1],adult:[.9,.04,.06,.06],liveCopy:[.32,.12,.4,.1],ambient:{sun:[.6,.2,.1,.1],water:[.4,.4,.2,.1],journeyGlow:[.5,.7,.1,.1]},signBoards:[[.04,.28,.24,.05],[.04,.34,.24,.05],[.04,.4,.24,.05],[.04,.46,.24,.05]]};
const approved={status:'approved',source:'./assets/home-v15/__test-only-portrait-master.webp',sha256:sha,width:2048,height:2732,ui};
test('isolated fixture proves byte-level SHA activation and rejects mutation',()=>{
 assert.deepEqual(verify(approved,root),{eligible:true,reason:'verified'});
 fs.writeFileSync(path.join(artDir,'__test-only-portrait-master.webp'),fixture+' tampered');
 assert.deepEqual(verify(approved,root),{eligible:false,reason:'sha-mismatch'});
});
test('invalid safe areas cannot activate even with matching fixture bytes',()=>{
 fs.writeFileSync(path.join(artDir,'__test-only-portrait-master.webp'),fixture);
 const bad=structuredClone(approved);bad.ui.logo=[.9,.1,.2,.1];
 assert.deepEqual(verify(bad,root),{eligible:false,reason:'invalid-ui-safe-areas'});
});
