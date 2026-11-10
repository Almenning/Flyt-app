'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'laer-litt-mer/index.html'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'laer-litt-mer/sw.js'), 'utf8');
// The Gangemagi stylesheets retain their approved visual release, while the
// JavaScript has a newer Tallvika branding release. Test each real asset URL
// instead of incorrectly requiring all assets to share the same cache key.
const version = '20261107-gangemagi-release38';
const approvedVisualVersion = '20261023-gangemagi-release37';
const suffix = '-gangemagi-premium-20261023-release37';
const releases = Object.freeze({
  'multiplication-gangemagi-v1.css': version,
  'gangemagi-dagens-oppdrag-v1.css': approvedVisualVersion,
  'multiplication-gangemagi-v1.js': '20261025-tallvika-one-tap-return1'
});
const assets = Object.keys(releases);
function workerHarness(caches, fetch) {
  const events = new Map();
  const self = {location:{origin:'https://example.test'}, clients:{claim:async()=>{}}, skipWaiting:async()=>{},
    addEventListener:(name, handler)=>events.set(name, handler)};
  vm.runInNewContext(worker, {self,caches,fetch,URL}, {filename:'sw.js',timeout:1000});
  return events;
}
test('all changed Gangemagi entry assets have distinct release URLs', () => {
  for (const asset of assets) {
    const escaped = asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const occurrences = [...html.matchAll(new RegExp('(?:href|src)="\\./'+escaped+'\\?v=([^"]+)"','g'))];
    assert.equal(occurrences.length,1,asset+' must be loaded once');
    assert.equal(occurrences[0][1],releases[asset],asset+' must use the explicitly approved release key');
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
