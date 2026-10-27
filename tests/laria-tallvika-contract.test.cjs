const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..','laer-litt-mer');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('index.html'),js=read('tallvika.js'),css=read('tallvika.css');

for(const asset of ['tallvika.css','tallvika.js']){
  const version=html.match(new RegExp(asset.replace('.', '\\.')+'\\?v=(\\d{8})-[\\w-]+'));
  assert.ok(version,asset+' must have a versioned production resource');
}
assert.match(html,/math:Object\.freeze\(\{title:'Tallvika'\}\)/);
assert.match(js,/openMultiplicationLab/);assert.match(js,/openFractionLab/);assert.match(js,/returnFromActivity/);
assert.match(js,/class="tv-hotspot tv-hotspot-multiply"/);assert.match(js,/class="tv-hotspot tv-hotspot-fraction"/);assert.match(js,/class="tv-hotspot tv-hotspot-table"/);
assert.doesNotMatch(js,/tv-mobile-actions|tv-portal-card|tv-dock|tv-navigation-note/,'Tallvika must not render a second activity menu');
assert.doesNotMatch(css,/tv-mobile-actions|tv-portal-card|tv-dock|tv-portal-art/,'Tallvika must not style a second activity menu');
assert.match(css,/\.tv-hotspot-multiply\{left:/);assert.match(css,/\.tv-hotspot-fraction\{left:/);assert.match(css,/\.tv-hotspot-table\{right:/);
assert.match(css,/laria-tallvika-premium-locked-20261027\.png/);
assert.match(css,/min-width:44px;min-height:44px/);assert.match(css,/:focus-visible/);
for(const name of ['assets/tallvika/laria-tallvika-premium-locked-20261027.png','assets/gangemagi-troll/storesoster.webp','assets/gangemagi-troll/lillesoster.webp','assets/gangemagi-troll/lillebror.webp'])assert.ok(fs.statSync(path.join(root,name)).size>50_000,name+' must remain an original-quality local asset');
assert.match(js,/sceneSrc:'\.\/assets\/tallvika\/storesoster-inworld-approved-20261026\.webp'/);
console.log('Tallvika integrated-world contract passed');
