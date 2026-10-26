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
const version = '20261023-gangemagi-release37';
const suffix = '-gangemagi-premium-20261023-release37';
const releases = Object.freeze({
  'multiplication-gangemagi-v1.css': version,
  'gangemagi-dagens-oppdrag-v1.css': version,
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
  assert.ok(worker.match(/^const CACHE='([^']+)';/)[1].endsWith(suffix));
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
test('a stale cached stylesheet cannot satisfy the new release request', async () => {
  const oldURL = 'https://example.test/laer-litt-mer/multiplication-gangemagi-v1.css?v=20261017-livegroups1';
  const newURL = 'https://example.test/laer-litt-mer/multiplication-gangemagi-v1.css?v='+version;
  const stale = {marker:'old-css'};
  const fresh = {ok:true,marker:'new-css',clone(){return this;}};
  const stored = new Map([[oldURL,stale]]), fetched = [];
  const events = workerHarness({match:async req=>stored.get(req.url),
    open:async()=>({put:async(req,response)=>{stored.set(req.url,response);}})},async req=>{fetched.push(req.url);return fresh;});
  const request = {method:'GET',mode:'cors',url:newURL};
  let response;
  events.get('fetch')({request,respondWith:promise=>{response=promise;}});
  assert.equal(await response,fresh);
  assert.deepEqual(fetched,[newURL]);
  assert.equal(stored.get(oldURL),stale);
  events.get('fetch')({request,respondWith:promise=>{response=promise;}});
  assert.equal(await response,fresh,'the new asset remains available from cache');
  assert.equal(fetched.length,1,'repeat/offline reads use the new cached response');
});
