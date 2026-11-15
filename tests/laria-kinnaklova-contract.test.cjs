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
test('The exact original Kinn image is preserved and its UI-free copy is SHA-locked',()=>{
 assert.equal(locked.state,'composition-approved-except-characters');
 assert.equal(locked.reference.sha256,'3b1d6b6e6c9908dd31c519593504ac22dd2c7473ef05fa51ecd57885cdc6e035');
 // Approval must be explicit in BOTH manifest and browser code. A correctly
 // sized, renamed copy of the rejected reference is not a clean art asset.
 // Original source hash is preserved, but a new, UI-free derivative must be separately approved.
 assert.match(js,/const LOCKED_ART='\.\/assets\/kinnaklova\/kinnaklova-scene-clean-approved-20261026\.webp'/,
   'The previously locked source must not be replaced by a new landscape');
 assert.match(js,/const APPROVED_ART_SHA256=PREMIUM_CLEAN_ART_APPROVED\?UI_FREE_ART_SHA256:/,
   'Browser must verify the exact checksum of a separately approved clean image');
 assert.match(js,/const UI_FREE_ART_TECHNICALLY_VERIFIED=true/,
   'The pixel-preserving edited Kinn image must be activated');
 assert.match(js,/const UI_FREE_ART_SHA256='7878237645c369fde210830ded37704bc0dfeb1f6d78b86782a47f41e80b7f8d'/,
   'The app must verify the exact edited image checksum');
 const clean=app('assets/kinnaklova/kinnaklova-ui-free-approved.webp');
 assert.ok(fs.existsSync(clean),'The UI-free scene asset must be installed');
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(clean)).digest('hex'),
   '7878237645c369fde210830ded37704bc0dfeb1f6d78b86782a47f41e80b7f8d','The restored scene must pass an exact integrity check');
 assert.match(js,/globalThis\.crypto\.subtle\.digest\('SHA-256'/);
 assert.match(js,/fetch\(ART,\{cache:'no-store'\}\)/);
 assert.match(css,/#kinnaklova-world:not\(\[data-ki-art="ready"\]\) \.ki-master\{visibility:hidden\}/);
 assert.match(js,/naturalWidth!==1672\|\|image\.naturalHeight!==941/);
 assert.doesNotMatch(js,/assets\/fox\/|lia-fox|chapter-fox|Math\.random/i);
});
test('Registry preserves three approved identities while Kinnaklova renders one selected TrollActor',()=>{
 const sources={
  storesoster:'a8fba47e272e2856bd78b92fb262146506e828ed',
  lillesoster:'37fd94b3d0fd5319db05e4d1aea609e96d69351f',
  lillebror:'fcf59aad90e0c9dacca025d76cd352a924ef7120'
 };
 for(const [id,sha] of Object.entries(sources)){
  assert.match(js,new RegExp("id:'"+id+"'"));
  const source=app('assets/gangemagi-troll/'+id+'.webp');
  const buf=fs.readFileSync(source);
  const blob=crypto.createHash('sha1').update('blob '+buf.length+'\0').update(buf).digest('hex');
  assert.equal(blob,sha,id+' original asset was changed');
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
 assert.match(js,/const selectedId=CHARACTERS\.some/);
 assert.match(js,/window\.LARIA_TROLL_ACTOR\?\.source/);
 assert.match(js,/ki-companion-actor laria-troll-host laria-troll-actor/);
 assert.doesNotMatch(js,/assets\/fox\/|lia-fox|chapter-fox|avatarSrc|Math\.random/i);
 assert.match(css,/\.ki-companion-actor/);
 assert.match(css,/#kinnaklova-world:not\(\[data-ki-art="ready"\]\) \.ki-companions/);
});
test('Selected TrollActor is grounded away from the painted activity signs',()=>{
 const match=css.match(/\.ki-companion-actor\{\s*position:absolute;left:([\d.]+)%;bottom:([\d.]+)%;width:([\d.]+)%;height:([\d.]+)%/);
 assert.ok(match,'Selected Kinnaklova actor placement missing');
 const [left,bottom,width,height]=match.slice(1).map(Number);
 const top=100-bottom-height;
 const box=[left,top,left+width,top+height];
 const zones={
   words:[23.1,74.2,40.5,82.0],
   sentences:[63.2,50.0,79.1,57.5],
   reading:[82.1,67.7,99.1,79.0]
 };
 for(const [name,sign] of Object.entries(zones)){
   const overlap=box[0]<sign[2]&&box[2]>sign[0]&&box[1]<sign[3]&&box[3]>sign[1];
   assert.equal(overlap,false,'Selected TrollActor would cover the locked '+name+' sign: '+box.join(','));
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
     'Final Kinnaklova scene with the selected TrollActor and device screenshots needs explicit owner sign-off');
 }

});
test('Live Kinnaklova task scene keeps English story first with correct screen-reader language',()=>{
 const live=fs.readFileSync(app('laria-task-scene-v15.js'),'utf8');
 assert.match(live,/directKinnaklova&&q\.skill==='reading'/);
 // The live task renderer now mounts the same selected TrollActor for English.
 assert.match(live,/const trollActor=window\.LARIA_TROLL_ACTOR/);
 assert.match(live,/task-troll-companion/);
 assert.match(live,/data-troll=/);
 assert.doesNotMatch(live,/const fox=directKinnaklova\?'':/);
 assert.match(live,/<section class="learning-passage ki-reading-story" lang="en"/);
 assert.match(live,/<div class="question ki-reading-question" lang="en"/);
 assert.match(live,/\?passage\+'<div class="question ki-reading-question"/);
 // The v15 task CSS uses #session-screen.task-scene .learning-passage.
 // Reading must match that specificity to win the cascade, not just add a class.
 assert.match(css,/#session-screen\.task-scene \.ki-reading-story\{/);
 assert.match(css,/#session-screen\.task-scene \.ki-reading-question\{/);
 assert.match(html,/laria-task-scene-v15\.js\?v=[^"]*kinnaklova-reading2/);
});

test('Only SHA-verified Kinn art is eligible for visible presentation',()=>{
 assert.match(js,/const HAS_CLEAN_MASTER=/);
 assert.match(js,/APPROVED_ART_SHA256===REJECTED_REFERENCE_SHA256/);
 assert.match(js,/const UI_FREE_ART_TECHNICALLY_VERIFIED=true/);
});
