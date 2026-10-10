'use strict';
/* The four *approved* 10 Oct 2026 source PNGs cannot be substituted by legacy
 * artwork, thumbnails, regenerated images, or the four-up comparison sheet.
 * The size gate protects the original reference while the final visual check
 * still requires human screenshot comparison to the library originals.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const imageDir=path.resolve(__dirname,'..','laer-litt-mer','locked-journeys');
const renderer=fs.readFileSync(path.join(__dirname,'..','laer-litt-mer','locked-journey-renderer.js'),'utf8');
const verified=/const ORIGINAL_SOURCE_IMAGES_VERIFIED=true;/.test(renderer);
const expected=[
 ['bokskogen-locked-20261010.png',3308204,'5fc16c5e4d7dfc397ac8d6e7883ad111443ce33df6acfd2dacab776936ef5506'],
 ['tallenga-locked-20261010.png',3220364,'68f595b2bfb2a37206b23200ec3854feb9b6134a112bab3957e5df21098d8879'],
 ['ordlandsbyen-locked-20261010.png',3284439,'c03e1f9abbdb582aa55d6473167e86ced8dce0b07196d810a2fb88bd77dd6da9'],
 ['nordlysleiren-locked-20261010.png',3224987,'7f6ddd6649d813601e9c1bef8e2373e779ee97469ca5392be0e6dd146f38f32f']
];
const available=expected.filter(([name])=>fs.existsSync(path.join(imageDir,name)));
test('all four original image files are required before activating locked worlds',()=>{
 assert.equal(expected.length,4);
 if(verified){
  assert.equal(available.length,4,'Production art gate was enabled before every original PNG existed');
 }
});
test('approved PNGs have their ORIGINAL file sizes, dimensions and signature',t=>{
 if(!available.length){
  assert.equal(verified,false,'Never activate the locked art renderer with no source files');
  t.diagnostic('ORIGINAL ASSETS BLOCKED: four approved PNG bytes must be imported from the 10 Oct 2026 library');
  return;
 }
 for(const [filename,byteSize,sha256] of available){
  const image=fs.readFileSync(path.join(imageDir,filename));
  assert.equal(image.length,byteSize,filename+' bytes differ from the approved Library original');
  assert.equal(crypto.createHash('sha256').update(image).digest('hex'),sha256,filename+' is not byte-identical to the approved Library original');
  assert.equal(image.subarray(0,8).toString('hex'),'89504e470d0a1a0a',filename+' is not an original PNG stream');
  assert.equal(image.subarray(12,16).toString('ascii'),'IHDR',filename+' lacks PNG dimensions');
  assert.equal(image.readUInt32BE(16),941,filename+' width changed');
  assert.equal(image.readUInt32BE(20),1672,filename+' height changed');
  assert.equal(image[24],8,filename+' unexpected image bit depth');
  // PNG identity is still subject to side-by-side visual proof;
  // exact dimensions and bytes alone are NOT sufficient to certify parity.
 }
});
test('four-up overview is retained as an exact QA-only reference',()=>{
 const filename='image-gen-1(20261010-113502).png';
 const image=fs.readFileSync(path.join(imageDir,filename));
 assert.equal(image.length,3381817);
 assert.equal(crypto.createHash('sha256').update(image).digest('hex'),'a02e331f7df5fcd0df3e4ed9238c4ef04dcac1bfd26bb7f56190f20594a400f8');
 assert.equal(image.readUInt32BE(16),1122);
 assert.equal(image.readUInt32BE(20),1402);
 const runtime=fs.readFileSync(path.join(__dirname,'..','laer-litt-mer','locked-journey-contract.js'),'utf8')+renderer;
 assert.equal(runtime.includes(filename),false,'four-up QA sheet must never be loaded as a journey map');
});
