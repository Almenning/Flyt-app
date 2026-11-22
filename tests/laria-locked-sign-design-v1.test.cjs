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
