'use strict';
// Validates the exact eight approved premium card images, separately from the
// 941x1672 original journey maps (which are covered by their own release gate).
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'../laer-litt-mer/assets/cards');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
const subjects=['norwegian','math','english','geography'];
const activities=['globe','words','fraction','multiply'];
const expected=[...subjects.map(s=>'reisen/'+s),...activities.map(s=>'utforsk/'+s)];
assert.deepEqual(Object.keys(manifest).sort(),expected.sort(),'exactly eight individual paintings');
const seen=new Set();
let total=0;
for(const key of expected){
 const [group,name]=key.split('/'),meta=manifest[key];
 const relative=`assets/cards/${group}/${name}-premium.webp`;
 assert.equal(meta.path,relative,`${key}: wrong filename`);
 assert.deepEqual(meta.size,[1024,704],`${key}: unexpected size`);
 const contents=fs.readFileSync(path.join(root,group,`${name}-premium.webp`));
 const hash=crypto.createHash('sha256').update(contents).digest('hex');
 assert.equal(hash,meta.sha256,`${key}: illustration bytes differ from approved artwork`);
 assert.equal(contents.length,meta.bytes,`${key}: corrupted or missing file`);
 assert.ok(contents.length>30000&&contents.length<250000,`${key}: unexpected image compression`);
 assert.equal(contents.toString('ascii',0,4),'RIFF',`${key}: not a RIFF container`);
 assert.equal(contents.toString('ascii',8,12),'WEBP',`${key}: not a WebP`);
 assert.equal(contents.toString('ascii',12,16),'VP8 ',`${key}: unexpected WebP codec`);
 const width=contents.readUInt16LE(26)&0x3fff,height=contents.readUInt16LE(28)&0x3fff;
 assert.deepEqual([width,height],meta.size,`${key}: image dimensions do not match manifest`);
 assert.ok(!seen.has(hash),`${key}: duplicate artwork`);
 seen.add(hash);total+=contents.length;
}
assert.ok(total<1000000,'excessive card payload for eight images');
console.log(`[Læria premium cards] Verified ${expected.length} distinct original paintings, ${total} bytes, SHA-256, WebP 1024x704.`);