const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const read=(path)=>fs.readFileSync(path,'utf8');

test('Laria Final RC keeps one canonical runtime composition',()=>{
  const index=read('laer-litt-mer/index.html');
  const active=read('laer-litt-mer/ACTIVE_LAYERS.md');

  for(const file of [
    'commercial-content-v18.js',
    'commerce-v18.js',
    'home-basecamp-v12.js',
    'laria-task-scene-v15.js',
    'globe-v24.css',
    'globe-v25-renderer.js'
  ]){
    assert.ok(index.includes(file),file+' must stay wired into the active runtime');
    assert.ok(active.includes(file),file+' must stay documented as an active owner');
  }

  assert.equal(index.includes('p18-preview/'),false,'runtime must not reference Prompt 18 preview assets');
  assert.equal((index.match(/commercial-content-v18\.js/g)||[]).length,1,'commercial content must have one active script owner');
  assert.equal((index.match(/commerce-v18\.js/g)||[]).length,1,'commerce must have one active script owner');
  assert.equal((index.match(/globe-v25-renderer\.js/g)||[]).length,2,'globe renderer must have exactly one preload and one script tag');
});

test('Laria Final RC preserves Prompt 18 locked contracts',()=>{
  const index=read('laer-litt-mer/index.html');
  const sw=read('laer-litt-mer/sw.js');
  const p18=read('docs/LARIA-PROMPT18-LAUNCH-READINESS.md');
  const nativeConfig=JSON.parse(read('laria-native/capacitor.config.json'));
  const store=read('laria-native/LariaStorePlugin.swift.template');

  assert.match(index,/globe-v24\.css\?v=globe35-depth1/,'approved globe CSS motion-release cache key changed');
  assert.match(index,/globe-v25-renderer\.js\?v=globe35-depth1/,'approved globe renderer motion-release cache key changed');
  assert.match(sw,/globe35-depth1/,'service-worker cache must match the approved globe motion release');
  assert.match(p18,/Status: \*\*FERDIG/,'Prompt 18 must remain formally closed');
  assert.equal(nativeConfig.appId,'no.adspire.laria','native app id changed');
  assert.equal(nativeConfig.appName,'Læria','native app name changed');
  assert.match(store,/no\.adspire\.laria\.monthly/,'monthly StoreKit product id changed');
  assert.match(store,/no\.adspire\.laria\.yearly/,'yearly StoreKit product id changed');
});

test('Prompt 19 stays a frozen release-candidate gate',()=>{
  const rc=read('docs/LARIA-PROMPT19-FINAL-RC.md');
  assert.match(rc,/Ingen nye fag, spillmoduser eller kommersielle funksjoner/);
  assert.match(rc,/Ingen kjente interne P0\/P1-blockers/);
  assert.match(rc,/Exact-head RC må være grønn/);
});


test('active premium globe scripts remain parseable',()=>{
 const vm=require('node:vm');
 for(const name of ['globe-v24-art.js','globe-v25-renderer.js']){
  const p='laer-litt-mer/'+name;
  assert.doesNotThrow(()=>new vm.Script(read(p),{filename:p}));
 }
});
