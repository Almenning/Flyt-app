'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const meta=JSON.parse(read('laer-litt-mer/assets/home-v15/laria-grovanova-v16-manifest.json'));
const source=read('laer-litt-mer/home-kjosnes-v15.js');
const css=read('laer-litt-mer/laria-grovanova-v16-home.css');
test('locked v16 source images are byte-for-byte approved WebP exports',()=>{
 assert.equal(meta.status,'approved-preview');
 const values={portrait:{sha:'c842e8e901300d1506594ef6e39929611743fc64ff1eb02254b8643059963421',width:2048,height:2732},
 landscape:{sha:'c39d374c8d9972a389d120ab15a1c81352158dc78a716fc7259fc31f95ce035e',width:2048,height:1536}};
 for(const [orientation,expected] of Object.entries(values)){
  const item=meta[orientation];
  assert.deepEqual([item.width,item.height],[expected.width,expected.height]);
  assert.equal(item.sha256,expected.sha);
  assert.match(item.source,/^\.\/assets\/home-v15\/laria-grovanova-v16-(portrait|landscape)\.webp$/);
  const bytes=fs.readFileSync(path.join(root,'laer-litt-mer',item.source));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),item.sha256);
  assert.equal(bytes.toString('ascii',0,4),'RIFF');
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
  for(const [name,r] of Object.entries(item.ui)){
   if(name==='signBoards')continue;
   assert.equal(r.length,4,orientation+' '+name);
   assert(r.every(v=>Number.isFinite(v)&&v>=0&&v<=1));
   assert(r[2]>0&&r[3]>0&&r[0]+r[2]<=1&&r[1]+r[3]<=1);
  }
  assert.equal(item.ui.signBoards.length,4);
 }
});
test('new iPad painted scene has semantic hitboxes and separate Reise chooser',()=>{
 assert.match(source,/function approvedV16\(/);
 assert.match(source,/crypto\.subtle\.digest\('SHA-256',bytes\)/);
 assert.match(source,/if\(!isIpadHome\(\)\)return null/);
 assert.match(source,/function mapV16Home\(/);
 assert.match(source,/window\.LARIA_HOME_OPEN_SUBJECT\?\.\(id\)/);
 assert.match(source,/data-camp="travel"/);
 assert.match(source,/\.bc12-journey/);
 assert.match(source,/data-bc16-subject/);
 assert.match(css,/\[data-bc15-design="locked-v16"\]/);
 assert.match(css,/button\[data-camp="travel"\]/);
 assert.match(css,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
 assert.match(css,/background-image:var\(--bc15-home-art\)/);
});
test('historical originals remain exact and v16 never touches HverdagsOss',()=>{
 assert(!source.includes('Dagsform')&&!source.includes('Dagens mål'));
 assert.match(source,/const TABLET_MASTER='\.\/assets\/home-v15\/kjosnes-home-tablet\.webp/);
 assert.match(source,/const PHONE_MASTER='\.\/assets\/home-v15\/kjosnes-home-phone\.webp/);
 assert.doesNotMatch(css,/\.bc12\b(?!\.bc15-locked-home)/);
});
