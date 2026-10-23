'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const dir=path.resolve(__dirname,'../laer-litt-mer');
for(const name of ['gangemagi-strawberry-painted.svg','gangemagi-picking-hand.svg']){
 test(name+' is a self-contained decorative illustration',()=>{
  const source=fs.readFileSync(path.join(dir,name),'utf8');
  assert.match(source,/<svg[^>]+viewBox=/);
  assert.doesNotMatch(source,/<(?:script|foreignObject|text)\b|\son[a-z]+=/i);
  assert.doesNotMatch(source,/(?:href|src)=["'](?:https?:|data:|\/\/)/i);
  const ids=[...source.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(new Set(ids).size,ids.length,'unique internal paint IDs');
  for(const ref of source.matchAll(/(?:url\(#|href="#)([\w-]+)/g))
   assert.ok(ids.includes(ref[1]),'paint reference exists: '+ref[1]);
 });
}
test('play-prop integration preserves the real interaction and uses cache-versioned local art',()=>{
 const source=fs.readFileSync(path.join(dir,'multiplication-gangemagi-v1.js'),'utf8');
 assert.match(source,/data-gm-prop="berry"/);assert.match(source,/data-gm-prop="hand"/);
 assert.match(source,/gangemagi-strawberry-painted\.svg\?v=20261022-props1/);
 assert.match(source,/gangemagi-picking-hand\.svg\?v=20261022-props1/);
 assert.doesNotMatch(source,/id="gmB"/);
 assert.match(source,/if\(!holdingBerry&&event\.target\.closest/,
   'placing a held berry must still take priority over removal');
});
