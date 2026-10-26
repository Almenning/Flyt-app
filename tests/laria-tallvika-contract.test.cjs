const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..','laer-litt-mer');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('index.html'),js=read('tallvika.js'),css=read('tallvika.css');
for(const asset of ['tallvika.css','tallvika.js']){
  const escaped=asset.replace('.', '\\.');
  const version=html.match(new RegExp(escaped+'\\?v=(\\d{8})-(?:production|premium)-[\\w-]+'));
  assert.ok(version,asset+' must use an explicitly versioned production/premium resource');
  assert.ok(version[1]>='20261025',asset+' must not use a pre-Tallvika resource version');
}
assert.match(html,/math:Object\.freeze\(\{title:'Tallvika'\}\)/);
assert.match(js,/storesoster/);assert.match(js,/lillesoster/);assert.match(js,/lillebror/);
assert.match(js,/tallvikaTroll/);
assert.match(js,/openMultiplicationLab/);assert.match(js,/openFractionLab/);
assert.match(css,/tallvika-master-laast-20261025\.png/);
assert.match(js,/class="tv-portal-card\$\{lastVisited===/);
assert.match(js,/returnFromActivity/);
assert.match(css,/\.tv-portal-card\.tv-visited/);
assert.match(js,/class="tv-main"/);
assert.match(css,/\.tv-portal-art-(?:multiply|fraction|table)/);
assert.match(css,/prefers-reduced-motion/);
for(const name of ['assets/tallvika/tallvika-master-laast-20261025.png','assets/gangemagi-troll/storesoster.webp','assets/gangemagi-troll/lillesoster.webp','assets/gangemagi-troll/lillebror.webp']){
  assert.ok(fs.statSync(path.join(root,name)).size>50_000,`${name} must be an original-quality local asset`);
}
console.log('Tallvika contract passed');
