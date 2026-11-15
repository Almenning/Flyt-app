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
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(master)).digest('hex'),'d2e2d37b4c54191383457f423c1d568cd538391046e79e6f66e7a8b1928c0e57');
 const edited=app('assets/kinnaklova/kinnaklova-ui-free-approved.webp');
 assert.ok(fs.existsSync(edited),'UI-free edit of EXACT locked Kinnaklova art must exist');
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(edited)).digest('hex'),'7878237645c369fde210830ded37704bc0dfeb1f6d78b86782a47f41e80b7f8d');
 assert.match(js,/const UI_FREE_ART_TECHNICALLY_VERIFIED=true/);
 assert.match(js,/const APPROVED_ART_SHA256=PREMIUM_CLEAN_ART_APPROVED\?UI_FREE_ART_SHA256:/);
 assert.match(js,/globalThis\.crypto\.subtle\.digest\('SHA-256'/);
 assert.match(js,/fetch\(ART,\{cache:'no-store'\}\)/);
 assert.match(css,/#kinnaklova-world:not\(\[data-ki-art="ready"\]\) \.ki-master\{visibility:hidden\}/);
 assert.match(js,/naturalWidth!==1672\|\|image\.naturalHeight!==941/);
 assert.doesNotMatch(js,/assets\/fox\/|lia-fox|chapter-fox|Math\.random/i);
});
test('All three locked troll sources survive, but only the selected original actor renders',()=>{
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
 assert.match(js,/state\?\.profile\?\.tallvikaTroll/);
 assert.match(js,/ki-companion-actor laria-troll-host laria-troll-actor/);
 assert.match(js,/data-troll=/);
 assert.doesNotMatch(js,/CHARACTERS\.map\(c=>'<img/,'Only one original troll should be shown');
 const adapter=fs.readFileSync(app('kinnaklova-standalone-v1.js'),'utf8');
 assert.match(adapter,/state\.profile=\{\.\.\.state\.profile,tallvikaTroll:selected\}/);
 assert.match(adapter,/app\.save\?\.\(\)/);
 assert.match(adapter,/window\.LARIA_KINN_PREMIUM=Object\.freeze/);
});
test('The locked left-hand activity rail has exactly two shared posts and real handlers',()=>{
 const adapter=fs.readFileSync(app('kinnaklova-standalone-v1.js'),'utf8');
 const styles=fs.readFileSync(app('laria-kinnaklova-unified-v1.css'),'utf8');
 assert.match(adapter,/order=\['words','sentences','reading'\]/);
 assert.match(adapter,/nav\.className='laria-scene-navigation'/);
 assert.match(adapter,/nav\.appendChild\(button\)/);
 assert.match(styles,/laria-grovanova-signposts\.svg/);
 assert.match(styles,/ki-painted-hit\.laria-wayfinder/);
 assert.doesNotMatch(adapter,/img\.src=trustedURL|chapter-fox/);
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
test('Kinn standalone release gate verifies both original and derived art SHA',()=>{
 const src=fs.readFileSync(master);
 const clean=fs.readFileSync(app('assets/kinnaklova/kinnaklova-ui-free-approved.webp'));
 assert.equal(crypto.createHash('sha256').update(src).digest('hex'),'d2e2d37b4c54191383457f423c1d568cd538391046e79e6f66e7a8b1928c0e57');
 assert.equal(crypto.createHash('sha256').update(clean).digest('hex'),'7878237645c369fde210830ded37704bc0dfeb1f6d78b86782a47f41e80b7f8d');
 assert.match(js,/const UI_FREE_ART_SHA256='7878237645c369fde210830ded37704bc0dfeb1f6d78b86782a47f41e80b7f8d'/);
 assert.match(js,/const UI_FREE_ART_TECHNICALLY_VERIFIED=true/);
});
test('Live Kinnaklova task scene keeps English story first with correct screen-reader language',()=>{
 const live=fs.readFileSync(app('laria-task-scene-v15.js'),'utf8');
 assert.match(live,/directKinnaklova&&q\.skill==='reading'/);
 // The live task renderer must never insert the old fox for Kinnaklova.
 assert.match(live,/const fox=directKinnaklova\?'':/);
 assert.match(live,/const inlineFox=!directKinnaklova&&/);
 assert.match(live,/const visualWithFox=visual\?\(directKinnaklova\?visual:/);
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
