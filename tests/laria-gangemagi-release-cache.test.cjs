'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'laer-litt-mer/index.html'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'laer-litt-mer/sw.js'), 'utf8');
const version = '20261025-troll-pilot1';
const suffix = '-gangemagi-premium-20261025-trollpilot1';
const assets = ['multiplication-gangemagi-v1.css', 'gangemagi-dagens-oppdrag-v1.css', 'troll-actor-v1.css', 'multiplication-gangemagi-engine-v1.js', 'troll-actor-v1.js', 'multiplication-gangemagi-v1.js'];
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
    assert.equal(occurrences[0][1],version,asset+' must not reuse an older cache key');
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


test('release52 mission CSS points to the locked Grovanova scene, not the old waterfall painting', () => {
  const css = fs.readFileSync(path.join(root, 'laer-litt-mer/gangemagi-dagens-oppdrag-v1.css'), 'utf8');
  assert.match(css, /gangemagi-grovanova-storybook-locked\.webp\?v=release52/);
  assert.doesNotMatch(css, /home-math-v14\.webp\?v=gangemagi-painted-world1/);
});

test('locked original Grovanova silhouette and all three approved forest trolls keep byte-exact identity', () => {
  // These SHA-256 sums are from independently retrieved reference assets in
  // exact-HEAD Chromium QA artifacts. A candidate painterly background can be
  // added separately; it must never silently replace or overwrite the masters.
  const approved = {
    'gangemagi-grovanova-storybook-locked.webp':'5bcd89da249ef6274c1fa01aa86fed92855cff39a5494a4d7f40266f2ca104ff',
    'assets/gangemagi-troll/storesoster.webp':'b98a5ee7f264d448da557636406080b5d8ee8aae23f32f0e41b66bf811beda89',
    'assets/gangemagi-troll/lillesoster.webp':'ee3f14e95407c8f673ee78c8ea3afc1b782e6f2975929ce6f77b867de29db425',
    'assets/gangemagi-troll/lillebror.webp':'7f1d9eeb293361ebb6507d024013d744d106978b72bbe4d71e2096816d9fdd11'
  };
  for (const [name, expected] of Object.entries(approved)) {
    const file = fs.readFileSync(path.join(root,'laer-litt-mer',name));
    assert.match(file.subarray(0,16).toString('ascii'), /^RIFF.{4}WEBP/s, name+' is an actual original WebP file');
    const actual = crypto.createHash('sha256').update(file).digest('hex');
    assert.equal(actual,expected,name+' must preserve the locked, approved pixels');
  }
});
