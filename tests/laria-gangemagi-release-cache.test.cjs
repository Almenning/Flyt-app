'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {createHash} = require('node:crypto');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'laer-litt-mer/index.html'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'laer-litt-mer/sw.js'), 'utf8');
// The original Gangemagi CSS and JS are byte-for-byte intact under TWO
// narrowly scoped, audited Tallvika integration patches (free-play scenery and
// direct entry return). Keep different cache keys for different actual bytes.
// These fingerprints establish historical art identity, NOT owner approval for
// the new free-play landscape. Release-readiness remains a separate gate.
const version = '20261122-free-tallvika3';
const approvedVisualVersion = '20261023-gangemagi-release37';
const suffix = '-gangemagi-premium-20261023-release37';
const releases = Object.freeze({
  'multiplication-gangemagi-v1.css': version,
  'gangemagi-dagens-oppdrag-v1.css': approvedVisualVersion,
  'gangemagi-compact-v1.css': '20261126-fold1',
  'multiplication-gangemagi-v1.js': '20261122-tallvika-direct-back1'
});
const assets = Object.keys(releases);

function gitBlobSha(content){
  const bytes=Buffer.from(content,'utf8');
  return createHash('sha1')
    .update('blob '+bytes.length+'\0','utf8')
    .update(bytes)
    .digest('hex');
}

test('Gangemagi approved CSS is unchanged; Tallvika scenery only extends free play',()=>{
  const css=fs.readFileSync(path.join(root,'laer-litt-mer/multiplication-gangemagi-v1.css'),'utf8');
  const marker='\n\n/* Premium 3.0: Free play is part of Tallvika.';
  assert.equal(css.split(marker).length,2,
    'One and only one isolated free-play scenery extension must exist');
  const oldCSS=css.slice(0,css.indexOf(marker));
  const extension=css.slice(css.indexOf(marker));
  assert.equal(gitBlobSha(oldCSS),'78b78c405ab30285223f45f4a8700fc18fb84885',
    'Approved original game CSS was modified: preserve the 7 Nov visual baseline');
  assert.equal(gitBlobSha(css),'c79eea14d47c11ee58e226fcd3486d828f38b2f2',
    'Tallvika free-play scenery changes require a fresh review and release URL');
  const selectors=extension.match(/#multiplication-lab-screen\.active \.gm-shell\[data-gm-mode="free"\] \.gm-world/g)||[];
  assert.equal(selectors.length,2,'Both portrait and landscape must target free play only');
  assert.ok(!extension.includes('[data-gm-mode="mission"]'),
    'The approved strawberry-market mission must remain untouched');
  for(const name of ['tallvika-fjord-no-buildings-wide-20261107.webp',
                     'tallvika-fjord-no-buildings-portrait-20261107.webp']){
    assert.ok(extension.includes("url('./assets/tallvika/"+name+"')"),
      'Expected original Tallvika art missing from free-play extension: '+name);
    assert.ok(fs.existsSync(path.join(root,'laer-litt-mer/assets/tallvika',name)),
      'Tallvika free-play art is missing: '+name);
  }
});

test('Gangemagi core JS remains unchanged except the direct Tallvika return guard',()=>{
  const js=fs.readFileSync(path.join(root,'laer-litt-mer/multiplication-gangemagi-v1.js'),'utf8');
  const patch=[
    "   // Direct Tallvika -> 10x10 has its own real return route. The legacy",
    "   // 'Til Gangemagi' chip would be misleading and duplicate navigation.",
    "   const screen=document.getElementById('multiplication-lab-screen');",
    "   if(screen?.dataset.mpDirectTallvika==='true'){",
    "     root.querySelector('.gm-classic-return')?.remove();",
    "     return;",
    "   }",
    ""
  ].join('\n');
  assert.equal(js.split(patch).length,2,'Return guard must exist exactly once');
  assert.equal(gitBlobSha(js.replace(patch,'')),
    '04ba1bd0d3e03fa3c635bbcb7fc2391b2ea22942',
    'Original Gangemagi JS was modified outside the direct-Tallvika return guard');
  assert.equal(gitBlobSha(js),'85d22265c0398708e94b322a74a2e70bbd044ba6',
    'A new JS patch requires separate review and cache-busting');
});

function workerHarness(caches, fetch) {
  const events = new Map();
  const self = {location:{origin:'https://example.test'}, clients:{claim:async()=>{}}, skipWaiting:async()=>{},
    addEventListener:(name, handler)=>events.set(name, handler)};
  vm.runInNewContext(worker, {self,caches,fetch,URL,Response}, {filename:'sw.js',timeout:1000});
  return events;
}
test('all changed Gangemagi entry assets have distinct release URLs', () => {
  for (const asset of assets) {
    const escaped = asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const occurrences = [...html.matchAll(new RegExp('(?:href|src)="\\./'+escaped+'\\?v=([^"]+)"','g'))];
    assert.equal(occurrences.length,1,asset+' must be loaded once');
    assert.equal(occurrences[0][1],releases[asset],asset+' must use the audited release key for its actual bytes');
  }
  const activeCache=worker.match(/^const CACHE='([^']+)';/)[1];
  assert.ok(activeCache.includes('pwa-network-first-20261108'),
    'The upgraded service worker must evict every old cache-first release');
});
test('activation removes old Laria caches but preserves unrelated application caches', async () => {
  const active = worker.match(/^const CACHE='([^']+)';/)[1];
  const removed = [];
  const events = workerHarness({keys:async()=>[active,'laria-old','laer-litt-mer-old','hverdagsoss-current'],
    delete:async key=>{removed.push(key);return true;}},async()=>{throw Error('Unexpected fetch');});
  let completion;
  events.get('activate')({waitUntil:promise=>{completion=promise;}});
  await completion;
  assert.deepEqual(removed.sort(),['laer-litt-mer-old','laria-old']);
});
test('installed Læria fetches fresh CSS even when the cache URL has NOT changed',async()=>{
  const url='https://example.test/laer-litt-mer/tallvika-fjord-v2.css?v=20261107-fjord-clean-signs1';
  const old={ok:true,text:'old CSS',clone(){return this;}};
  const fresh={ok:true,text:'corrected CSS',clone(){return this;}};
  const stored=new Map([[url,old]]);
  let offline=false,networkCalls=0;
  const events=workerHarness({
    match:async req=>stored.get(req.url||req),
    open:async()=>({put:async(req,response)=>stored.set(req.url||req,response)})
  },async(req,opts)=>{
    networkCalls++;
    assert.equal(opts?.cache,'no-store','Stylesheets must bypass stale HTTP caches');
    if(offline)throw Error('offline');
    return fresh;
  });
  const request={method:'GET',mode:'cors',url};
  let response;
  events.get('fetch')({request,respondWith:p=>{response=p;}});
  assert.equal(await response,fresh,'The network CSS must win over a stale cached copy');
  assert.equal(stored.get(url),fresh,'Online CSS must refresh the offline cache');
  offline=true;
  events.get('fetch')({request,respondWith:p=>{response=p;}});
  assert.equal(await response,fresh,'Offline must retain the last verified good CSS');
  assert.equal(networkCalls,2,'An installed Læria must check for updates on each use');
});
test('scripts are network-first while immutable art remains cache-first',async()=>{
  const script='https://example.test/laer-litt-mer/tallvika.js?v=unchanged';
  const image='https://example.test/laer-litt-mer/assets/tallvika/locked-scene.webp';
  const staleScript={ok:true,id:'old-script',clone(){return this;}};
  const freshScript={ok:true,id:'new-script',clone(){return this;}};
  const art={ok:true,id:'locked-art',clone(){return this;}};
  const stored=new Map([[script,staleScript],[image,art]]),calls=[];
  const events=workerHarness({
    match:async req=>stored.get(req.url||req),
    open:async()=>({put:async(req,res)=>stored.set(req.url||req,res)})
  },async req=>{calls.push(req.url);return freshScript;});
  const request=url=>({url,method:'GET',mode:'cors'});
  let res;
  events.get('fetch')({request:request(script),respondWith:p=>{res=p;}});
  assert.equal(await res,freshScript);
  events.get('fetch')({request:request(image),respondWith:p=>{res=p;}});
  assert.equal(await res,art);
  assert.deepEqual(calls,[script],'Locked versioned imagery must not refetch on every view');
});
test('navigation refreshes online and restores the last good page offline',async()=>{
  const url='https://example.test/laer-litt-mer/?app=laria';
  const last={ok:true,id:'new-home',clone(){return this;}};
  const stored=new Map();
  let offline=false;
  const events=workerHarness({
    match:async req=>stored.get(req.url||req),
    open:async()=>({put:async(req,res)=>stored.set(req.url||req,res)})
  },async req=>{if(offline)throw Error('no network');return last;});
  let res;
  const request={method:'GET',mode:'navigate',url};
  events.get('fetch')({request,respondWith:p=>{res=p;}});
  assert.equal(await res,last);
  offline=true;
  events.get('fetch')({request,respondWith:p=>{res=p;}});
  assert.equal(await res,last,'Installed Læria should reopen after connection loss');
});

test('missing offline art returns a normal non-cacheable response without swallowing missing code',async()=>{
  const events=workerHarness({match:async()=>undefined,open:async()=>{throw Error('Offline miss must not write');}},
    async()=>{throw Error('offline');});
  const load=(file,destination)=>{
    let received;
    events.get('fetch')({request:{url:'https://example.test/laer-litt-mer/'+file,method:'GET',mode:'cors',destination},
      respondWith:p=>{received=p;}});
    return received;
  };
  const picture=await load('unvisited.webp','image');
  assert.equal(picture.status,503);
  assert.equal(picture.ok,false);
  await assert.rejects(load('required.js','script'),/offline/);
});


test('ES modules revalidate exactly like classic scripts, including unchanged URLs',async()=>{
  const url='https://example.test/laer-litt-mer/learning-engine.mjs?v=unchanged';
  const old={ok:true,id:'stale'};
  const fresh={ok:true,id:'current',clone(){return this}};
  let online=true,stored=old;
  const events=workerHarness({
    match:async()=>stored,
    open:async()=>({put:async(_,response)=>{stored=response}})
  },async(_,opts)=>{
    assert.equal(opts?.cache,'no-store');
    if(!online)throw Error('offline');
    return fresh;
  });
  const request={url,method:'GET',mode:'cors'};
  let result;
  events.get('fetch')({request,respondWith:p=>{result=p}});
  assert.equal(await result,fresh);
  online=false;
  events.get('fetch')({request,respondWith:p=>{result=p}});
  assert.equal(await result,fresh);
});

test('full or unavailable CacheStorage never masks a good network response',async()=>{
  const fresh={ok:true,id:'current',clone(){return this}};
  for(const failing of ['open','put']){
    const events=workerHarness({
      match:async req=>{if(req.url.endsWith('.js'))return {id:'stale'};throw Error('cache locked');},
      open:async()=>{if(failing==='open')throw Error('cache locked');return {put:async()=>{throw Error('quota')}}}
    },async()=>fresh);
    for(const file of ['view.js','locked.webp']){
      const request={url:'https://example.test/laer-litt-mer/'+file,method:'GET',mode:'cors'};
      let result;
      events.get('fetch')({request,respondWith:p=>{result=p}});
      assert.equal(await result,fresh,failing+' failure on '+file);
    }
  }
});
