'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),test=require('node:test');
const root=__dirname+'/../';
test('locked sign master is present and unchanged',()=>{
 const file=root+'laer-litt-mer/assets/ui/locked-reference/laria-sign-master-v1.png';
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),'1b3cdb93f04b95b7b0850653827cb5e6235a69afc5c94e39ab5eba78640678db');
});
test('one sign component owns the locked surface contract',()=>{
 const js=fs.readFileSync(root+'laer-litt-mer/laria-wooden-sign-v1.js','utf8'),css=fs.readFileSync(root+'laer-litt-mer/laria-wooden-sign-v1.css','utf8'),html=fs.readFileSync(root+'laer-litt-mer/index.html','utf8');
 assert.match(js,/LariaWoodenSign/);assert.match(css,/laria-wooden-sign-medallion/);assert.match(css,/--laria-wooden-sign-serif/);assert.match(css,/--laria-wooden-sign-plank/);assert.match(html,/laria-wooden-sign-v1/);
});
test('painted scene masters are never covered by a replacement sign',()=>{
 const scene=fs.readFileSync(root+'laer-litt-mer/laria-scene-ui-v1.js','utf8');
 const status=fs.readFileSync(root+'docs/laria-premium-3/LOCKED-SIGN-IMPLEMENTATION-STATUS-V1.md','utf8');
 assert.match(scene,/scene\.dataset\.lariaArtworkUi==='separate'/);
 assert.match(status,/Grovanova \/ Hjem v16/);assert.match(status,/Kinnaklova \/ Engelsk/);
});


test('Wooden sign tokens are isolated from historical subject menu colors',()=>{
 const css=fs.readFileSync(root+'laer-litt-mer/laria-wooden-sign-v1.css','utf8');
 assert.doesNotMatch(css,/:root\s*\{[^}]*--laria-sign-ink:/,
   'Sign component may not overwrite global legacy subject ink');
 assert.match(css,/\.laria-wooden-sign-rail\s*\{[\s\S]*?--laria-wooden-sign-serif:/);
});
test('Active Læria HTML is complete, not a truncated tool response',()=>{
 const html=fs.readFileSync(root+'laer-litt-mer/index.html','utf8');
 for(const required of [
   'id="home-screen"',
   'function startLearningSession(',
   'const GRADE2_FIRST_JOURNEYS=Object.freeze',
   'journey-world-premium.css',
   'laria-wooden-sign-v1.js'
 ])assert.ok(html.includes(required),'Critical Læria HTML missing: '+required);
 assert.doesNotMatch(html,/Warning: truncated output|tokens truncated|Total output lines: [0-9]+/,
   'Truncated agent/tool output must never be committed as app HTML');
});

test('Home v16 is the exact user-provided sign source; do not double-render boards',()=>{
 const home=fs.readFileSync(root+'laer-litt-mer/laria-grovanova-v16.js','utf8');
 const manifest=JSON.parse(fs.readFileSync(root+'laer-litt-mer/assets/home-v16/laria-grovanova-v16-approved.json','utf8'));
 const status=fs.readFileSync(root+'docs/laria-premium-3/LOCKED-SIGN-IMPLEMENTATION-STATUS-V1.md','utf8');
 assert.equal(manifest.presentation,'painted-visual-dom-actions',
  'Existing owner-approved Home sign graphics are painted into the scene');
 for(const orientation of ['portrait','landscape']){
  const art=manifest.variants[orientation];
  assert.equal(art.ui.signBoards.length,4);
  assert.ok(art.originalSha256&&/^[a-f0-9]{64}$/.test(art.originalSha256));
 }
 assert.match(home,/function ensureSigns\(host\)/);
 assert.match(home,/className='bc15-v16-sign'/);
 assert.doesNotMatch(home,/LariaWoodenSign(?:\?|\.)?\.mount/,
  'Never double-render replacement wooden boards over painted Home signs');
 assert.match(status,/FERDIG VISUELL REFERANSE/);
 assert.match(status,/ikke en sperre for/);
});

test('Words candidate is raster artwork with DOM text and an explicit review gate',()=>{
 const js=fs.readFileSync(root+'laer-litt-mer/laria-wooden-sign-v1.js','utf8');
 const scene=fs.readFileSync(root+'laer-litt-mer/laria-scene-ui-v1.js','utf8');
 const css=fs.readFileSync(root+'laer-litt-mer/laria-wooden-sign-v1.css','utf8');
 const doc=fs.readFileSync(root+'docs/laria-premium-3/WORDS-SIGN-CANDIDATE-20261122.md','utf8');
 for(const file of ['words-plank-source-derived-v2.png','words-medallion-v2.png']){
  const image=fs.readFileSync(root+'laer-litt-mer/assets/ui/words-sign-candidate/'+file);
  assert.equal(image.subarray(1,4).toString('ascii'),'PNG',file+' must be a PNG with alpha-capable raster source');
 }
 assert.match(scene,/lariaWordsSignCandidate/);
 assert.match(scene,/only:\['words'\]/);
 assert.match(js,/sourceDerived&&action==='words'/);
 assert.match(css,/words-plank-source-derived-v2\.png/);
 assert.match(css,/words-medallion-v2\.png/);
 assert.match(css,/\.ki-plank-name/);
 assert.match(doc,/data-ki="words"/);
});

test('Words candidate component CSS loads after legacy Kinnaklova facade CSS',()=>{
 const html=fs.readFileSync(root+'laer-litt-mer/index.html','utf8');
 assert.ok(html.indexOf('laria-kinnaklova-unified-v1.css')<html.indexOf('laria-wooden-sign-v1.css'),
  'A gated Words candidate must not be restyled as the legacy arrow sign');
});
