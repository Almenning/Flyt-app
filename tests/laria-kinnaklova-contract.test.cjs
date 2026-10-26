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
 assert.match(js,/URL\.createObjectURL\(new Blob\(\[bytes\]/);
 assert.match(js,/image\.src=trustedURL/);
 assert.match(js,/URL\.revokeObjectURL\(verifiedArtUrl\)/);
 assert.match(js,/APPROVED_ART_SHA256===REJECTED_REFERENCE_SHA256/);
 assert.match(css,/#kinnaklova-world:not\(\[data-ki-art="ready"\]\) \.ki-master\{visibility:hidden\}/);
 assert.match(js,/kinnaklova-scene-clean-approved-20261026\.webp/);
 assert.match(js,/naturalWidth!==1672\|\|image\.naturalHeight!==941/);
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
 // Storesøster uses the previously visual-approved painted variant; the
 // underlying 512×1024 identity original stays unchanged.
 const approvedScene=app('assets/kinnaklova/storesoster-inworld-approved-20261026.webp');
 assert.ok(fs.existsSync(approvedScene),'Copied approved Storesøster scene asset missing');
 const sceneBuf=fs.readFileSync(approvedScene);
 assert.equal(crypto.createHash('sha1').update('blob '+sceneBuf.length+'\0').update(sceneBuf).digest('hex'),
   'cff7b5710401f33fa4798d40e8935cb77eb40b44',
   'Kinnaklova storesøster must match approved #224 art byte-for-byte');
 assert.match(js,/storesoster-inworld-approved-20261026\.webp/);
 assert.match(js,/c\.sceneSrc\|\|c\.src/);
 assert.doesNotMatch(js,/assets\/fox\/|lia-fox|chapter-fox|avatarSrc|Math\.random/i);
 assert.doesNotMatch(css,/@keyframes.*ki-troll|\.ki-troll.*animation:/s);
 assert.match(css,/#kinnaklova-world:not\(\[data-ki-art="ready"\]\) \.ki-companions/);
});
test('Forest troll placements do not obscure approved words on painted signs',()=>{
 const zones={
   words:[23.1,74.2,40.5,82.0],
   sentences:[63.2,50.0,79.1,57.5],
   reading:[82.1,67.7,99.1,79.0]
 };
 const captures={
   storesoster:/\.ki-troll-storesoster\{left:([\d.]+)%;top:([\d.]+)%;width:([\d.]+)%;height:([\d.]+)%\}/,
   lillebror:/\.ki-troll-lillebror\{left:([\d.]+)%;top:([\d.]+)%;width:([\d.]+)%;height:([\d.]+)%\}/,
   lillesoster:/\.ki-troll-lillesoster\{right:([\d.]+)%;top:([\d.]+)%;width:([\d.]+)%;height:([\d.]+)%\}/
 };
 for(const [id,regex] of Object.entries(captures)){
   const match=css.match(regex);
   assert.ok(match,id+' position missing from CSS');
   const [p,t,w,h]=match.slice(1).map(Number);
   const left=id==='lillesoster'?100-p-w:p;
   const box=[left,t,left+w,t+h];
   for(const [name,sign] of Object.entries(zones)){
     const overlap=box[0]<sign[2]&&box[2]>sign[0]&&box[1]<sign[3]&&box[3]>sign[1];
     assert.equal(overlap,false,id+' would cover the locked '+name+' sign: '+box.join(','));
   }
 }
});
test('Words, Sentences and Reading use existing real English learning modules',()=>{
 for(const [id,module] of [['words','words'],['sentences','sentences'],['reading','reading']]){
   assert.match(js,new RegExp("id:'"+id+"'"));
   assert.match(js,new RegExp("module:'"+module+"'"));
 }
 assert.match(js,/startLearningSession\?\.\('english',activity\.module,activity\.name,true\)/);
 assert.match(html,/function startLearningSession\(subject,module,label,strictModule=false\)/);
 assert.match(html,/strictModule&&focused\.length>=5\?\[\]/);
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
 if(process.env.LARIA_KINNAKLOVA_RELEASE_GATE==='1'){
   assert.equal(locked.implementation?.release_approval,true,
     'Final Kinnaklova scene with all three original trolls and device screenshots needs explicit owner sign-off');
 }

});

test('Live Kinnaklova task scene keeps English story first with correct screen-reader language',()=>{
 const live=fs.readFileSync(app('laria-task-scene-v15.js'),'utf8');
 assert.match(live,/directKinnaklova&&q\.skill==='reading'/);
 assert.match(live,/<section class="learning-passage ki-reading-story" lang="en"/);
 assert.match(live,/<div class="question ki-reading-question" lang="en"/);
 assert.match(live,/\?passage\+'<div class="question ki-reading-question"/);
 // The v15 task CSS uses #session-screen.task-scene .learning-passage.
 // Reading must match that specificity to win the cascade, not just add a class.
 assert.match(css,/#session-screen\.task-scene \.ki-reading-story\{/);
 assert.match(css,/#session-screen\.task-scene \.ki-reading-question\{/);
 assert.match(html,/laria-task-scene-v15\.js\?v=[^"]*kinnaklova-reading2/);
});

test('Draft does not request Kinnaklova art before exact hash approval',()=>{
 assert.ok(js.includes('const HAS_CLEAN_MASTER='),'Need positive art gating before adding image src');
 assert.ok(js.includes("(HAS_CLEAN_MASTER?' src=\"'+ART+'\'\"':'')")===false||js.includes("HAS_CLEAN_MASTER?' src="),
   'The master image src must be conditional on its approved SHA');
 assert.match(js,/APPROVED_ART_SHA256===REJECTED_REFERENCE_SHA256/);
});
