'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto'),zlib=require('node:zlib');
const file='laer-litt-mer/assets/tallvika/tallvika-master-laast-20261025.png';
const data=fs.readFileSync(file);
const sha=crypto.createHash('sha256').update(data).digest('hex');
assert.equal(sha,'eff445ccbc59b143fc587081e50b0f0fadc58e3668e2a15c52b7e41a036865dd','The approved Tallvika scene must be pixel-identical to verified source');
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
assert.deepEqual([width,height,depth,color],[1672,941,8,2]);
const raw=zlib.inflateSync(Buffer.concat(idat));
assert.equal(raw.length,941*(1672*3+1),'Image has incomplete decoded scanlines');
console.log('PASS: Tallvika locked illustration fully decodes to 941 rows, exact approved SHA256');
