'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto'),zlib=require('node:zlib');
const file='laer-litt-mer/assets/tallvika/laria-tallvika-premium-locked-20261027.png';
const data=fs.readFileSync(file);
const sha=crypto.createHash('sha256').update(data).digest('hex');
assert.equal(sha,'632c9a2a1476e220e493b6e802e044bdfb025e9afc02e7f62fcc39c81cc4a3a5','The approved Tallvika scene must be pixel-identical to verified source');
assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
let i=8,idat=[],width=0,height=0,depth=0,color=0,ended=false;
while(i<data.length){
  assert.ok(i+12<=data.length,'Truncated PNG chunk header');
  const n=data.readUInt32BE(i),type=data.toString('ascii',i+4,i+8);
  assert.ok(i+n+12<=data.length,'PNG image data is truncated');
  if(type==='IHDR'){width=data.readUInt32BE(i+8);height=data.readUInt32BE(i+12);depth=data[i+16];color=data[i+17];}
  if(type==='IDAT')idat.push(data.subarray(i+8,i+8+n));
  i+=12+n;
  if(type==='IEND'){ended=true;break;}
}
assert.equal(ended,true,'PNG is missing IEND');
assert.equal(i,data.length,'Trailing PNG bytes found');
assert.deepEqual([width,height,depth,color],[1602,981,8,2]);
const raw=zlib.inflateSync(Buffer.concat(idat));
assert.equal(raw.length,981*(1602*3+1),'Image has incomplete decoded scanlines');
console.log('PASS: Tallvika locked 2026-10-27 illustration fully decodes, exact approved SHA256');
