'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
test('Læria locks the three approved B art bytes, keeping archive and current sources separate',()=>{
 const dir=path.join(__dirname,'../laer-litt-mer/assets/troll-b');
 const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
 assert.equal(manifest.revision,'B-2026-11-26');
 assert.equal(manifest.status,'approved');
 assert.deepEqual(Object.keys(manifest.characters),['storesoster','lillesoster','lillebror']);
 const runtime=fs.readFileSync(path.join(dir,'../../laria-troll-runtime-v1.js'),'utf8');
 for(const [id,{source,sha256}] of Object.entries(manifest.characters)){
  assert.equal(source,'gangemagi-troll/'+id+'.webp');
  assert.ok(runtime.includes('./assets/troll-b/'+source));
  const asset=fs.readFileSync(path.join(dir,source));
  assert.equal(createHash('sha256').update(asset).digest('hex'),sha256,id+' approved B art');
  assert.ok(fs.existsSync(path.join(dir,'..',source)),id+' original archive');
 }
});
