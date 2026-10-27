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

assert.ok(fs.statSync(path.join(root,'assets/tallvika/storesoster-inworld-approved-20261026.webp')).size>50_000);
const {createHash}=require('node:crypto');
const sha256=file=>createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
assert.equal(sha256('assets/tallvika/storesoster-inworld-approved-20261026.webp'),
 '80ae8a1ea0b43ebc2d8c0b12fb0e5cd588bce1882fd9d52819d3ac7ef4d85e67');
assert.match(js,/sceneSrc:'\.\/assets\/tallvika\/storesoster-inworld-approved-20261026\.webp'/);
assert.ok(js.includes('<img src="${troll.sceneSrc}" alt="${troll.name}">'));
assert.ok(js.includes('<img src="${item.sceneSrc}" alt="">'));
assert.match(css,/\.tv-companion\[data-troll-id="storesoster"\]\{\s*left:58\.1%;bottom:14\.7%;width:9\.3%;height:31\.4%/);
console.log('Tallvika contract passed');
