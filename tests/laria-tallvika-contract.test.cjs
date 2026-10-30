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
assert.match(js,/class="tv-sign" data-tv="multiply"/);assert.match(js,/class="tv-sign" data-tv="fraction"/);assert.match(js,/class="tv-sign" data-tv="table"/);
assert.doesNotMatch(js,/tv-mobile-actions|tv-portal-card|tv-dock|tv-navigation-note/,'Tallvika must not render a second activity menu');
assert.doesNotMatch(css,/tv-mobile-actions|tv-portal-card|tv-dock|tv-portal-art/,'Tallvika must not style a second activity menu');
assert.match(css,/\.tv-sign-nav\{position:absolute/);assert.match(css,/\.tv-sign:before,\.tv-sign:after/);
assert.match(css,/tallvika-figure-free-20261028\.webp/);
assert.match(css,/min-height:clamp\(52px/);assert.match(css,/:focus-visible/);
for(const name of ['assets/tallvika/laria-tallvika-premium-locked-20261027.png','assets/tallvika/tallvika-figure-free-20261028.webp','assets/gangemagi-troll/storesoster.webp','assets/gangemagi-troll/lillesoster.webp','assets/gangemagi-troll/lillebror.webp'])assert.ok(fs.statSync(path.join(root,name)).size>50_000,name+' must remain an original-quality local asset');
assert.match(js,/sceneSrc:'\.\/assets\/tallvika\/storesoster-inworld-approved-20261026\.webp'/);
console.log('Tallvika integrated-world contract passed');

assert.match(js,/class="tv-next-sign" data-tv="next"/,'Next adventure must be inside the world');
assert.match(js,/class="tv-actor" data-troll-id=/,'Selected actor must be a separate figure');
assert.match(js,/tv-actor-speech/,'Actor must speak to the child');
assert.match(js,/item\.src/,'Picker and stage must use original locked character');
assert.doesNotMatch(js,/class="tv-next"/,'No outside-world next card');
assert.match(css,/One continuous asset is used in portrait/,'Portrait must keep a seam-free mountain composition');
