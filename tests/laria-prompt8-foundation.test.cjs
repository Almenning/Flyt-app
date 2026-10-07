const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'../laer-litt-mer');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const cleanRef=ref=>ref.replace(/^\.\//,'').split('?')[0].split('#')[0];

function externalRefs(html,kind){
  const re=kind==='css'
    ? /<link[^>]+href=["']([^"']+\.css(?:\?[^"']*)?)["'][^>]*>/gi
    : /<script[^>]+src=["']([^"']+\.js(?:\?[^"']*)?)["'][^>]*><\/script>/gi;
  return [...html.matchAll(re)].map(m=>m[1]).filter(x=>x.startsWith('./'));
}
function versionOf(ref){
  const m=ref.match(/[?&]v=([^&#]+)/);
  return m?m[1]:null;
}
function swVersion(sw,file){
  const needle=file+'?v=';
  const at=sw.indexOf(needle);
  if(at<0)return null;
  return sw.slice(at+needle.length).split(/[\"'\s,]/,1)[0]||null;
}

test('Prompt 8 active Læria layers are explicit, unique and cache-aligned',()=>{
  const html=read('index.html'),sw=read('sw.js');
  const css=externalRefs(html,'css'),js=externalRefs(html,'js');

  assert.equal(new Set(css).size,css.length,'duplicate active CSS reference');
  assert.equal(new Set(js).size,js.length,'duplicate active JS reference');

  for(const ref of [...css,...js]){
    const file=cleanRef(ref);
    assert.ok(fs.existsSync(path.join(root,file)),'missing active file '+file);
    const v=versionOf(ref);
    assert.ok(v,'active asset is not cache-busted: '+ref);
  }

  assert.match(sw,/const CACHE='laria-(?:runtime|stable)-[^']+'/,'runtime cache must use an explicit Læria release');
  assert.match(sw,/caches\.match\(req\)/,'static runtime assets must consult cache before network');
  assert.match(sw,/if\(cached\)return cached/,'warm static assets must return from cache immediately');
  assert.doesNotMatch(sw,/\.css\?v=|\.js\?v=/,'service worker install must not precache the active CSS\/JS graph');

  const order=name=>css.findIndex(x=>cleanRef(x)===name);
  assert.equal(order('laria-foundation-v1.css'),0,'visual foundation must load before component CSS');
  assert.ok(order('home-premium.css')<order('home-basecamp-v12.css'),'Basecamp must own young Home after legacy Home styles');
  assert.ok(order('laria-unified-v13.css')<order('laria-task-scene-v15.css'),'task scene must load after unified fallback');
  assert.ok(order('laria-task-scene-v15.css')<order('laria-task-young-v18.css'),'young task layer must load after shared task scene');

  assert.match(sw,/const SHELL=\[[^]*'\.\/manifest\.webmanifest'[^]*'\.\/icon\.svg'[^]*\]/,'lightweight install shell must contain only essential metadata assets');
});

test('active external styles do not reference missing local assets',()=>{
  const html=read('index.html');
  for(const ref of externalRefs(html,'css')){
    const file=cleanRef(ref),css=read(file);
    for(const m of css.matchAll(/url\((?:["']?)([^)"']+)(?:["']?)\)/g)){
      const raw=m[1].trim();
      if(!raw||/^(?:data:|https?:|blob:|#)/i.test(raw))continue;
      const asset=cleanRef(raw);
      const full=path.resolve(root,path.dirname(file),asset);
      assert.ok(full.startsWith(root),'asset escapes app root: '+raw+' in '+file);
      assert.ok(fs.existsSync(full),'missing local asset '+raw+' referenced by '+file);
    }
  }
});

test('legacy young Home override no longer competes with Basecamp v12',()=>{
  const legacy=read('home-premium.css');
  const basecamp=read('home-basecamp-v12.css');
  assert.doesNotMatch(legacy,/LARIA_YOUNG_HOME_HARD_FIX_V8/);
  assert.doesNotMatch(legacy,/\.grade-band-young\.app:has\(#home-screen\.active\)/);
  assert.match(basecamp,/\.grade-band-young #home-screen>:not\(\.bc12\)\{display:none!important\}/);
  assert.match(basecamp,/--ink:var\(--laria-ink-soft/);
});

test('selected profile fox is wired through every active premium scene',()=>{
  const html=read('index.html');
  assert.match(html,/<script src="\.\/profile-avatars\.js\?v=[^"]+" data-boot-sync><\/script>/);

  const checks={
    'home-basecamp-v12.js':/function selectedFoxSource\(which\)/,
    'bokskogen-world.js':/function selectedProfileFox\(\)/,
    'journey-world-premium.js':/function selectedJourneyFox\(\)/,
    'globe-v25-renderer.js':/function selectedProfileFox\(\)/,
    'laria-task-scene-v15.js':/function foxSource\(\)/
  };
  for(const [file,re] of Object.entries(checks))assert.match(read(file),re,file+' does not use profile fox chain');
  const bok=read('bokskogen-world.js');
  const premiumMarker=bok.indexOf('/* Bokskogen v10 — premium world-native renderer. */');
  const premiumWorld=bok.indexOf('function worldMarkup',premiumMarker);
  const scopedFox=bok.indexOf('function selectedProfileFox()',premiumMarker);
  assert.ok(premiumMarker>=0&&scopedFox>premiumMarker&&scopedFox<premiumWorld,'premium Bokskogen renderer must define its profile fox helper in the same scope');
  assert.doesNotMatch(read('journey-world-premium.js'),/premium-traveler-character[^]*journeyFoxSvg\(\)/);
});

test('visual foundation declares locked commercial design primitives without owning screen composition',()=>{
  const css=read('laria-foundation-v1.css');
  for(const token of [
    '--laria-cream','--laria-ink','--laria-wood','--laria-gold','--laria-green',
    '--laria-radius-lg','--laria-shadow-paper','--laria-touch',
    '--laria-motion-normal','--laria-font-rounded','--laria-breakpoint-phone'
  ]) assert.ok(css.includes(token),'missing foundation token '+token);
  assert.doesNotMatch(css,/position:\s*(?:absolute|fixed)/,'foundation must not redesign screen composition');
});
