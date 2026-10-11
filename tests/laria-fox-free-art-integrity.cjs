'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.join(__dirname,'..','laer-litt-mer','locked-journeys');
const fixtures=Object.freeze({
 bokskogen:{size:[297,280],sha:'5fc16c5e4d7dfc397ac8d6e7883ad111443ce33df6acfd2dacab776936ef5506'},
 tallenga:{size:[311,342],sha:'68f595b2bfb2a37206b23200ec3854feb9b6134a112bab3957e5df21098d8879'},
 ordlandsbyen:{size:[279,317],sha:'c03e1f9abbdb582aa55d6473167e86ced8dce0b07196d810a2fb88bd77dd6da9'},
 nordlysleiren:{size:[287,313],sha:'7f6ddd6649d813601e9c1bef8e2373e779ee97469ca5392be0e6dd146f38f32f'}
});
for(const [subject,expected] of Object.entries(fixtures)){
 test(subject+' keeps the exact original October 10 painting and has a reversible fox cleanup layer',()=>{
  const original=fs.readFileSync(path.join(root,subject+'-locked-20261010.png'));
  assert.equal(crypto.createHash('sha256').update(original).digest('hex'),expected.sha,
    'The approved original journey painting was replaced or modified');
  assert.equal(original.subarray(0,8).toString('hex'),'89504e470d0a1a0a','original is not PNG');
  assert.deepEqual([original.readUInt32BE(16),original.readUInt32BE(20)],[941,1672]);
  const cleanup=fs.readFileSync(path.join(root,'fox-free',subject+'-fox-free-overlay.png'));
  assert.equal(cleanup.subarray(0,8).toString('hex'),'89504e470d0a1a0a','cleanup is not PNG');
  assert.deepEqual([cleanup.readUInt32BE(16),cleanup.readUInt32BE(20)],expected.size);
  assert.equal(cleanup[25],6,'cleanup must be RGBA PNG with alpha channel');
  assert(cleanup.length<500000,'cleanup should stay lightweight on mobile Safari');
 });
}
