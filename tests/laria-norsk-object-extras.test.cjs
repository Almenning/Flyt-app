'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const home=path.resolve(__dirname,'../laer-litt-mer');
const source=fs.readFileSync(path.join(home,'norsk-object-extras-v1.js'),'utf8');
const scene=fs.readFileSync(path.join(home,'laria-task-scene-v15.js'),'utf8');
const html=fs.readFileSync(path.join(home,'index.html'),'utf8');
const ctx={window:{}};
vm.runInNewContext(source,ctx,{timeout:2000});
test('All six missing early-Norsk word images use real, local SVG paths',()=>{
 const art=ctx.window.LARIA_NORSK_OBJECT_EXTRAS;
 const expected=['🍦','🧢','🐑','☕','🛏️','🦊'];
 assert.deepEqual(Array.from(art.keys).sort(),expected.sort());
 for(const symbol of expected){
  const svg=art.svgFor(symbol);
  assert.match(svg,/<svg[^>]+task-illustration-norsk-object/);
  assert.match(svg,/viewBox="0 0 260 180"/);
  assert.ok(svg.length>550,symbol+' illustration is empty');
  assert(!svg.includes('<image')&&!svg.includes('<script')&&!svg.includes('http://'));
 }
 assert.equal(art.svgFor('🐶'),'','Existing dog illustration must stay untouched');
});
test('Illustrations load before shared scene, remain Norwegian only and never affect progress',()=>{
 const extra=html.indexOf('norsk-object-extras-v1.js?v=');
 const scenePos=html.indexOf('laria-task-scene-v15.js?v=');
 assert.ok(extra>=0&&scenePos>extra,'SVG library must load before scene');
 assert.match(scene,/const norsk=taskSubject\(q\)==='norwegian'/);
 assert.match(scene,/const extra=norsk\?window\.LARIA_NORSK_OBJECT_EXTRAS\?\.svgFor\(key\)/);
 assert.match(scene,/NORSK_ONLY_EXISTING_OBJECTS\.has\(key\)/);
 assert(!source.includes('localStorage')&&!source.includes('sessionQuestions'));
});
