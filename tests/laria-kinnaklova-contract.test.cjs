'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const app=p=>path.join(root,'laer-litt-mer',p);
const html=fs.readFileSync(app('index.html'),'utf8');
const js=fs.readFileSync(app('kinnaklova.js'),'utf8');
const css=fs.readFileSync(app('kinnaklova.css'),'utf8');
const locked=JSON.parse(fs.readFileSync(path.join(root,'docs/LARIA-KINNAKLOVA-VISUAL-LOCK-2026-10-26.json'),'utf8'));
const master=app('assets/kinnaklova/kinnaklova-scene-clean-approved-20261026.webp');
test('English Kinnaklova is a subject-only presentation over unchanged learning engine',()=>{
 assert.match(html,/kinnaklova\.js\?v=/);
 assert.match(html,/kinnaklova\.css\?v=/);
 assert.ok(html.indexOf('kinnaklova.js')>html.indexOf('LARIA_TALLVIKA_BRIDGE'));
 assert.match(js,/dataset\.subject==='english'/);
 assert.match(js,/LARIA_TALLVIKA_BRIDGE/);
 assert.doesNotMatch(js,/localStorage\.setItem|journey\.nodes\s*=|progressSchemaVersion\s*=/);
 assert.match(css,/#subject-screen\.kinnaklova-active/);
 execFileSync(process.execPath,['--check',app('kinnaklova.js')]);
});
test('Approved scene is one painted 1672x941 image with mapped transparent targets',()=>{
 assert.equal(locked.state,'composition-approved-except-characters');
 assert.equal(locked.reference.sha256,'3b1d6b6e6c9908dd31c519593504ac22dd2c7473ef05fa51ecd57885cdc6e035');
 // Approval must be explicit in BOTH manifest and browser code. A correctly
 // sized, renamed copy of the rejected reference is not a clean art asset.
 const browserHash=js.match(/const APPROVED_ART_SHA256='([^']*)'/)?.[1];
 assert.ok(browserHash!==undefined,'Browser must gate by SHA-256');
 if(locked.implementation?.clean_master_visual_approved){
   assert.equal(browserHash,locked.implementation.clean_master_sha256);
 }else{
   assert.equal(browserHash,'','Draft must never render a scene by size alone');
 }
 assert.match(js,/globalThis\.crypto\.subtle\.digest\('SHA-256'/);
 assert.match(js,/APPROVED_ART_SHA256===REJECTED_REFERENCE_SHA256/);
 assert.match(css,/#kinnaklova-world:not\(\[data-ki-art="ready"\]\) \.ki-master\{visibility:hidden\}/);
 assert.match(js,/kinnaklova-scene-clean-approved-20261026\.webp/);
 assert.match(js,/naturalWidth===1672&&image\.naturalHeight===941/);
 assert.match(js,/ki-master/);
 assert.match(js,/ki-painted-hit/);
 assert.match(css,/aspect-ratio:1672 \/ 941/);
 assert.match(css,/ki-painted-words/);
 assert.match(css,/ki-painted-sentences/);
 assert.match(css,/ki-painted-reading/);
 assert.match(css,/min-height:44px;min-width:44px/);
 assert.doesNotMatch(js,/ki-peak|ki-sky|ki-lighthouse|ki-house|ki-island/);
 assert.doesNotMatch(css,/\.ki-peak|\.ki-sky|\.ki-lighthouse|\.ki-island/);
});
test('Only three original forest trolls, with byte-identical repository assets',()=>{
 const sources={
   storesoster:'a8fba47e272e2856bd78b92fb262146506e828ed',
   lillesoster:'37fd94b3d0fd5319db05e4d1aea609e96d69351f',
   lillebror:'fcf59aad90e0c9dacca025d76cd352a924ef7120'
 };
 for(const [id,sha] of Object.entries(sources)){
   assert.match(js,new RegExp("id:'"+id+"'"));
   assert.match(js,new RegExp("gangemagi-troll/"+id+"\\.webp"));
   const buffer=fs.readFileSync(app('assets/gangemagi-troll/'+id+'.webp'));
   const blob=crypto.createHash('sha1').update('blob '+buffer.length+'\0').update(buffer).digest('hex');
   assert.equal(blob,sha,id+' approved original changed unexpectedly');
 }
 assert.doesNotMatch(js,/assets\/fox\/|lia-fox|chapter-fox|avatarSrc|Math\.random/i);
 assert.doesNotMatch(css,/@keyframes.*ki-troll|\.ki-troll.*animation:/s);
 assert.match(css,/#kinnaklova-world:not\(\[data-ki-art="ready"\]\) \.ki-companions/);
});
test('Words, Sentences and Reading use existing real English learning modules',()=>{
 for(const [id,module] of [['words','words'],['sentences','sentences'],['reading','reading']]){
   assert.match(js,new RegExp("id:'"+id+"'"));
   assert.match(js,new RegExp("module:'"+module+"'"));
 }
 assert.match(js,/startLearningSession\?\.\('english',activity\.module,activity\.name\)/);
 assert.match(js,/resumeSession\?\.\('english'\)/);
 assert.match(js,/locked-journey-subject-english/);
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css,/ki-painted-hit\{display:none\}/);
});
test('Artwork release gate blocks missing, mismatched, or uncertified clean master',t=>{
 if(!fs.existsSync(master)){
   if(process.env.LARIA_KINNAKLOVA_RELEASE_GATE==='1')
     assert.fail('Clean approved Kinnaklova image is not imported. Do not merge or publish.');
   t.skip('Visual master import not completed; draft function tests can proceed.');
   return;
 }
 const file=fs.readFileSync(master);
 assert.equal(file.toString('ascii',0,4),'RIFF');
 assert.equal(file.toString('ascii',8,12),'WEBP');
 const sha=crypto.createHash('sha256').update(file).digest('hex');
 const allowed=locked.implementation?.clean_master_sha256;
 if(!allowed){
   if(process.env.LARIA_KINNAKLOVA_RELEASE_GATE==='1')
     assert.fail('Missing human-approved clean master SHA-256 in visual-lock manifest.');
   t.skip('Clean master needs documented visual review and SHA lock before release.');
   return;
 }
 assert.equal(sha,allowed,'Clean Kinnaklova painting differs from user-approved master');
 assert.equal(locked.implementation?.clean_master_visual_approved,true,'Art must be reviewed');
});
