'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),test=require('node:test');
const root=__dirname+'/../';
test('locked sign master is present and unchanged',()=>{
 const file=root+'laer-litt-mer/assets/ui/locked-reference/laria-sign-master-v1.png';
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),'1b3cdb93f04b95b7b0850653827cb5e6235a69afc5c94e39ab5eba78640678db');
});
test('one sign component owns the locked surface contract',()=>{
 const js=fs.readFileSync(root+'laer-litt-mer/laria-wooden-sign-v1.js','utf8'),css=fs.readFileSync(root+'laer-litt-mer/laria-wooden-sign-v1.css','utf8'),html=fs.readFileSync(root+'laer-litt-mer/index.html','utf8');
 assert.match(js,/LariaWoodenSign/);assert.match(css,/laria-wooden-sign-medallion/);assert.match(css,/--laria-sign-serif/);assert.match(html,/laria-wooden-sign-v1/);
});
test('painted scene masters are never covered by a replacement sign',()=>{
 const scene=fs.readFileSync(root+'laer-litt-mer/laria-scene-ui-v1.js','utf8');
 const status=fs.readFileSync(root+'docs/laria-premium-3/LOCKED-SIGN-IMPLEMENTATION-STATUS-V1.md','utf8');
 assert.match(scene,/scene\.dataset\.lariaArtworkUi==='separate'/);
 assert.match(status,/Grovanova \/ Hjem v16/);assert.match(status,/Kinnaklova \/ Engelsk/);
});
