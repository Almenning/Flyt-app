const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
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
assert.match(css,/\.tv-sign-nav\{position:absolute/);
assert.match(css,/Pixel-locked Home sign asset/,'Tallvika must use the locked transparent Home sign asset');
assert.match(css,/tallvika-sign-home-locked\.webp/,'Tallvika sign must render from the derived locked Home cutout');
assert.match(css,/aspect-ratio:200\/220/,'Locked Home sign asset ratio changed');
assert.match(css,/\.tv-sign-nav:before,\.tv-sign-nav:after\{content:none!important\}/,'No CSS-drawn alternate post system may return');
assert.match(css,/\.tv-sign\{position:absolute;z-index:2/,'Tallvika activity hit areas must align over the locked sign asset');
assert.match(css,/\.tv-sign:before,\.tv-sign:after\{content:none!important\}/,'No CSS repaint layer may cover the locked wood');
assert.match(css,/tallvika-figure-free-20261028\.webp/);
assert.match(css,/:focus-visible/);
for(const name of ['assets/tallvika/laria-tallvika-premium-locked-20261027.png','assets/tallvika/tallvika-figure-free-20261028.webp','assets/gangemagi-troll/storesoster.webp','assets/gangemagi-troll/lillesoster.webp','assets/gangemagi-troll/lillebror.webp'])assert.ok(fs.statSync(path.join(root,name)).size>50_000,name+' must remain an original-quality local asset');
const signAsset=path.join(root,'assets/tallvika/tallvika-sign-home-locked.webp');
assert.ok(fs.statSync(signAsset).size>7_000,'locked Home sign cutout must remain the committed source asset');
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(signAsset)).digest('hex'),'408178582017e0da88037f21e9a44b58cc2f4671baa24c5a44bed0d97a67479e','locked Home sign cutout changed');
assert.match(js,/sceneSrc:'\.\/assets\/tallvika\/storesoster-inworld-approved-20261026\.webp'/);
console.log('Tallvika integrated-world contract passed');

assert.match(js,/class="tv-next-sign" data-tv="next"/,'Next adventure must be inside the world');
assert.match(js,/class="tv-actor" data-troll-id=/,'Selected actor must be a separate figure');
assert.match(js,/tv-actor-speech/,'Actor must speak to the child');
assert.match(js,/item\.src/,'Picker and stage must use original locked character');
assert.doesNotMatch(js,/class="tv-next"/,'No outside-world next card');
assert.match(css,/One continuous asset is used in portrait/,'Portrait must keep a seam-free mountain composition');
