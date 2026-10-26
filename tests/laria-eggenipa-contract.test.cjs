'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');

const ROOT=path.resolve(__dirname,'..');
const app=name=>path.join(ROOT,'laer-litt-mer',name);
const html=fs.readFileSync(app('index.html'),'utf8');
const js=fs.readFileSync(app('eggenipa.js'),'utf8');
const css=fs.readFileSync(app('eggenipa.css'),'utf8');
const locked=app('assets/norsk/eggenipa-master-laast-20261025.png');
const EXPECTED_SHA='37cbb6b2baf62c16f974ee59a63b8c9f6e80a30f6add2801a8bec363a321fff3';

test('Norsk Eggenipa is registered only as an isolated presentation layer',()=>{
  assert.match(html,/eggenipa\.js\?v=/);
  assert.match(html,/eggenipa\.css\?v=/);
  assert.ok(html.indexOf('eggenipa.js')>html.indexOf('LARIA_TALLVIKA_BRIDGE'));
  assert.match(js,/dataset\.subject==='norwegian'/);
  assert.match(js,/LARIA_TALLVIKA_BRIDGE/);
  // Norsk now enters the real learning engine directly; the removed
  // journey map must not appear as a child-facing activity.
  assert.match(js,/startLearningSession/);
  assert.match(html,/startLearningSession:\(subject,module,label\)=>startLearningSession/);
  assert.doesNotMatch(js,/startJourneyNode|journeyRecommendedNode|setJourneyViewGrade/);
  assert.match(css,/#subject-screen\.eggenipa-active/);
  assert.doesNotMatch(js,/localStorage\.setItem|\.journey\.nodes\s*=|\.progressSchemaVersion\s*=/);
  execFileSync(process.execPath,['--check',app('eggenipa.js')]);
});

test('Three independent Norsk activities, no journey map in the child UI',()=>{
  for(const [key,pattern] of Object.entries({
    find:/window\.openFindTheWords\?\.\(\)/,
    words:/window\.openWordHunt\?\.\(\)/,
    reading:/startLearningSession\?\.\('norwegian','reading','Lesekroken'\)/
  }))assert.match(js,pattern,key+' must use an established engine');
  for(const id of ['words','find','reading'])
    assert.match(js,new RegExp("id:'"+id+"'"));
  assert.doesNotMatch(js,/data-eg="map"|id:'map'|openMap\(|"eg-next"|data-eg="next"|data-eg-grade/);
  assert.doesNotMatch(js,/bokskogen-atlas32\.webp|locked-journey-back/);
  assert.match(css,/\.eg-scene-reading/);
  assert.match(html,/resumeSession:\(\)=>/);
});

test('Artwork stays an external unchanged source, not generated on screen',()=>{
  assert.match(js,/assets\/norsk\/eggenipa-master-laast-20261025\.png/);
  assert.match(js,/<img class="eg-master"/);
  assert.doesNotMatch(css,/filter:\s*(?:blur|sepia|hue-rotate)/);
  assert.doesNotMatch(js,/canvas\.toDataURL|toBlob\(/);
});

test('Release gate: exact 1672x941 Eggenipa original is present and SHA-256 verified',t=>{
  if(!fs.existsSync(locked)){
    if(process.env.LARIA_EGGENIPA_RELEASE_GATE==='1')assert.fail(
      'Original approved PNG missing: upload it without regenerating. Production merge blocked.');
    t.skip('Approved original has not yet been uploaded to this draft PR.');
    return;
  }
  const file=fs.readFileSync(locked);
  assert.equal(file.toString('hex',0,8),'89504e470d0a1a0a','Must be a valid PNG');
  assert.equal(file.readUInt32BE(16),1672);
  assert.equal(file.readUInt32BE(20),941);
  const actual=crypto.createHash('sha256').update(file).digest('hex');
  assert.equal(actual,EXPECTED_SHA,'Not the approved exact original; do not regenerate or retouch');
});

test('Eggenipa observer cannot schedule a class mutation loop',()=>{
 const guarded=/if\(!screen\.classList\.contains\('eggenipa-active'\)\)screen\.classList\.add\('eggenipa-active'\)/g;
 assert.equal([...js.matchAll(guarded)].length,2,
  'Every build path must check the class before changing it');
 assert.match(js,/if\(screen\.classList\.contains\(flag\)\)screen\.classList\.remove\(flag\)/,
  'Do not emit an absent-class mutation inside MutationObserver callbacks');
});
