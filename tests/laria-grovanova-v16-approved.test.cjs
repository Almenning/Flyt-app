'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const manifest=JSON.parse(read('laer-litt-mer/assets/home-v16/laria-grovanova-v16-approved.json'));
const render=read('laer-litt-mer/laria-grovanova-v16.js');
const old=read('laer-litt-mer/home-kjosnes-v15.js');
const css=read('laer-litt-mer/laria-grovanova-v16.css');
const entry=read('laer-litt-mer/index.html');
function digest(p){return crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex')}
test('owner-approved original art and high-res exports are pinned and immutable',()=>{
 assert.equal(manifest.status,'approved');
 assert.equal(manifest.presentation,'painted-visual-dom-actions');
 for(const [orientation,expected] of [['portrait',[2048,2732]],['landscape',[2048,1536]]]){
  const a=manifest.variants[orientation];
  assert.deepEqual([a.width,a.height],expected);
  assert.equal(digest('laer-litt-mer/'+a.source.replace('./','')),a.sha256,orientation+' WebP changed');
  assert.equal(digest('laer-litt-mer/assets/home-v16/'+a.original),a.originalSha256,orientation+' source PNG changed');
  assert.match(a.source,/home-v16\/laria-grovanova-v16-(portrait|landscape)\.webp/);
  assert.equal(a.ui.signBoards.length,4);
  for(const r of [...a.ui.signBoards,...['reisen','journey','nav','greeting','adult'].map(k=>a.ui[k])]){
   assert(Array.isArray(r)&&r.length===4);
   assert(r.every(Number.isFinite));
   assert(r[0]>=0&&r[1]>=0&&r[2]>0&&r[3]>0);
   assert(r[0]+r[2]<=1&&r[1]+r[3]<=1);
  }
 }
});
test('iPad-only SHA checked Home v16 is wired, with untouched legacy fallback',()=>{
 assert.match(render,/crypto\.subtle\.digest\('SHA-256',bytes\)/);
 assert.match(render,/if\(digest!==v\.sha256\)throw Error/);
 assert.match(render,/image\.naturalWidth!==v\.width\|\|image\.naturalHeight!==v\.height/);
 assert.match(render,/window\.LARIA_HOME_OPEN_SUBJECT/);
 assert.match(render,/bc15-v16-reisen/);
 assert.match(render,/bc12-journey/);
 assert.match(render,/data-bc15-v16-orientation|bc15V16Orientation/);
 assert.match(render,/if\(window\.__LARIA_QA_SKIP_V16===true\)return false/);
 assert.match(old,/if\(await v16\.activate\(host,\{portrait,isCurrent:current\}\)\)return true/);
 assert.match(old,/v16\?\.deactivate\(host\)/);
 assert.match(css,/data-camp="travel"/);
 assert.match(css,/data-camp="home"/);
 assert.match(css,/bc15-v16-greeting/);
 assert.match(css,/bc15-v16-signs/);
 assert.match(css,/bc15-v16-locked::after/);
 assert(entry.indexOf('laria-grovanova-v16.js')<entry.indexOf('home-kjosnes-v15.js'));
 assert(entry.indexOf('laria-grovanova-v16.css')>entry.indexOf('laria-viewport-premium-v1.css'));
});
test('approved v16 image does not bake living troll character, and never changes stored progress',()=>{
 assert.doesNotMatch(render,/\blocalStorage\.setItem\b|\bstate\.(?:progress|completed|profile)\s*=/);
 assert.doesNotMatch(render,/store(?:Session|Progress)\s*\(/);
 assert.match(render,/LARIA_TROLL_ACTOR|LARIA_HOME_OPEN_SUBJECT/);
 assert.match(render,/querySelector\('\.bc15-boats'\)\?\.remove\(\)/);
 assert.match(css,/\.bc12\.bc15-v16-locked/);
});
