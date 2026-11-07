'use strict';
/* Tallvika Premium v2: two clean nature scenes, three independent interactive
 * signs, selected approved TrollActor and an unmodified historical master. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..','laer-litt-mer');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const hash=name=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex');
const js=read('tallvika.js'),css=read('tallvika-fjord-v2.css'),html=read('index.html');
assert.match(html,/tallvika-fjord-v2\.css/,'Tallvika v2 stylesheet must load');
assert.match(js,/data-tv-art="fjord-no-buildings-v2"/,'new scene version must render');
for(const action of ['multiply','fraction','table'])
  assert.match(js,new RegExp('class="tv-sign laria-wayfinder" data-tv="'+action+'"'),'missing interactive wooden sign '+action);
assert.doesNotMatch(js,/Velg et hus|Se på husene/,'retired house navigation text returned');
assert.match(js,/class="tv-next-sign" data-tv="next"/,'Next adventure must stay in the landscape');
assert.match(js,/tv-actor-touch laria-troll-host laria-troll-actor/,'troll must be a separate animated button');
assert.match(js,/LARIA_TROLL_ACTOR\?\.mood/,'living troll reactions missing');
assert.match(css,/background-size:cover!important/,'never stretch the fjord');
assert.match(css,/pointer-events:auto!important/,'wooden signs must be touchable');
assert.doesNotMatch(css,/tv-mobile-actions|tv-portal-card|tv-dock/,'retired parallel menu returned');
for(const [name,expected] of [
 ['assets/tallvika/tallvika-fjord-no-buildings-wide-20261107.webp','422f6489c3c3328db65b84d9850adf61a33ff9b664d1855325ffd4658af73203'],
 ['assets/tallvika/tallvika-fjord-no-buildings-portrait-20261107.webp','193720ecf606509676b47c2e8d52f3bdc2f5bbbad07ab12b0b1f563ec0dd7f14']
]){
  assert.match(css,new RegExp(name.replaceAll('.','\\.')),'clean scene missing from stylesheet '+name);
  assert.ok(fs.statSync(path.join(root,name)).size>100000,'scene file suspiciously small '+name);
  assert.equal(hash(name),expected,'scene bytes modified '+name);
}
assert.equal(hash('assets/tallvika/laria-tallvika-premium-locked-20261027.png'),
 '632c9a2a1476e220e493b6e802e044bdfb025e9afc02e7f62fcc39c81cc4a3a5',
 'historical 27 October master must be immutable');
for(const id of ['storesoster','lillesoster','lillebror']){
  const asset='assets/gangemagi-troll/'+id+'.webp';
  assert.ok(fs.statSync(path.join(root,asset)).size>10000,'locked troll missing '+id);
  assert.match(js,new RegExp('gangemagi-troll/'+id+'\\.webp'),'locked troll art not used '+id);
}
console.log('PASS Tallvika premium v2: clean fjord, three live signs, original troll and intact historical master');