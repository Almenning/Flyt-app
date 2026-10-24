'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.resolve(__dirname,'..');
const locked=[
  {
    file:'laer-litt-mer/assets/home/kjosnes-home-tablet.webp',
    bytes:59628,
    sha256:'b5165fa109db03d947e302f165467b70a63cbaee933d0f9b71ccfce903525844'
  },
  {
    file:'laer-litt-mer/assets/home/kjosnes-home-phone.webp',
    bytes:24608,
    sha256:'005c66df80944bef99f9afba96af5031cc6097f8f951985349d73f7b3aa7d59c'
  }
];

test('Hjem v15 keeps the approved Kjøsnesfjorden masters byte-for-byte locked',()=>{
  for(const entry of locked){
    const file=path.join(root,entry.file);
    assert.equal(fs.existsSync(file),true,entry.file+' is missing');
    const bytes=fs.readFileSync(file);
    assert.equal(bytes.length,entry.bytes,entry.file+' byte length changed');
    assert.equal(bytes.subarray(0,4).toString('ascii'),'RIFF',entry.file+' is not a RIFF WebP');
    assert.equal(bytes.subarray(8,12).toString('ascii'),'WEBP',entry.file+' is not a WebP');
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.sha256,
      entry.file+' changed. Do not regenerate, reshape, recompress or substitute Grovanova without an explicit new visual lock.');
  }
});

test('Hjem v15 keeps fail-safe activation and exact locked asset references',()=>{
  const css=fs.readFileSync(path.join(root,'laer-litt-mer/home-kjosnes-v15.css'),'utf8');
  const js=fs.readFileSync(path.join(root,'laer-litt-mer/home-kjosnes-v15.js'),'utf8');
  assert.match(css,/kjosnes-home-tablet\.webp\?v=20261024-locked1/);
  assert.match(css,/kjosnes-home-phone\.webp\?v=20261024-locked1/);
  assert.match(css,/aspect-ratio:760 \/ 459/,'tablet master geometry must stay proportional');
  assert.match(css,/aspect-ratio:280 \/ 580/,'phone master geometry must stay proportional');
  assert.match(js,/unsupported-portrait/,'unapproved tablet portrait must retain the previous Home');
  assert.match(js,/host\.classList\.remove\('bc15-locked-home'\)/,'asset failure must fall back safely');
});
