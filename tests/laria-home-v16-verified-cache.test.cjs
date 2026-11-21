'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'../laer-litt-mer/laria-grovanova-v16.js'),'utf8');
const start=src.indexOf('const verifiedBytes=new Map();');
const end=src.indexOf('\nfunction artBox(',start);
assert.ok(start>0&&end>start,'exercise exact Home v16 verified image loader');
function harness({failFirst=false}={}){
 let requests=0,digests=0,created=0,revoked=0;
 let fail=failFirst;
 const bytes=new Uint8Array([1,2,3,4]);
 const key='aa'.repeat(32);
 const context={
  Map,Blob,Uint8Array,Array,
  crypto:{subtle:{digest:async()=>{digests++;return new Uint8Array(32).fill(170).buffer;}}},
  fetch:async()=>{requests++;if(fail){fail=false;throw Error('temporary failure');}
   return {ok:true,arrayBuffer:async()=>bytes.buffer};},
  URL:{createObjectURL:()=>String(++created),revokeObjectURL:()=>{revoked++;}},
  Image:class{set src(_) {this.naturalWidth=2048;this.naturalHeight=2732;this.onload();}}
 };
 vm.runInNewContext(src.slice(start,end)+'\nthis.verify=verifiedImage',context);
 return {verify:v=>context.verify(v),stats:()=>({requests,digests,created,revoked}),variant:{source:'./assets/home-v16/laria-grovanova-v16-portrait.webp',sha256:key,width:2048,height:2732}};
}
test('repeated activations reuse only SHA-verified source bytes, but own separate URLs',async()=>{
 const h=harness();
 const [first,second]=await Promise.all([h.verify(h.variant),h.verify(h.variant)]);
 assert.notEqual(first.url,second.url);
 assert.deepEqual(h.stats(),{requests:1,digests:1,created:2,revoked:0});
 await h.verify(h.variant);
 assert.deepEqual(h.stats(),{requests:1,digests:1,created:3,revoked:0});
});
test('a transient fetch failure is not cached as approved artwork',async()=>{
 const h=harness({failFirst:true});
 await assert.rejects(h.verify(h.variant),/temporary failure/);
 const image=await h.verify(h.variant);
 assert.equal(image.width,2048);
 assert.deepEqual(h.stats(),{requests:2,digests:1,created:1,revoked:0});
});