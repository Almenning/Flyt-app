'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {injectPreviewHash,sha,checkSources}=require('./laria-kinnaklova-art-preview.playwright.js');

test('Kinnaklova art preview has a safe, single-use local-only SHA injector',()=>{
  const marker="const APPROVED_ART_SHA256='';";
  const digest='a'.repeat(64);
  assert.equal(injectPreviewHash(marker,digest),"const APPROVED_ART_SHA256='"+digest+"';");
  assert.throws(()=>injectPreviewHash(marker+'\\n'+marker,digest),/ONE unapproved SHA literal/);
  assert.throws(()=>injectPreviewHash("const APPROVED_ART_SHA256='f';",digest),/ONE unapproved SHA literal/);
  assert.throws(()=>injectPreviewHash(marker,'invalid'),/SHA-256/);
  assert.equal(sha(Buffer.from('abc')),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('Art preview is source isolated and cannot set release approval',()=>{
  const source=fs.readFileSync(path.join(__dirname,'laria-kinnaklova-art-preview.playwright.js'),'utf8');
  assert.match(source,/ARTIST_QA_ONLY_NOT_APPROVED/);
  assert.match(source,/clean_master_visual_approved,false/);
  assert.match(source,/release_approval,false/);
  assert.match(source,/verify_locked_scene\\.py/);
  assert.match(source,/source_sha256:asset\\.sourceDigest/);
  assert.match(source,/serviceWorkers:'block'/);
  assert.doesNotMatch(source,/writeFileSync\\(LOCK_PATH|writeFileSync\\(.*kinnaklova\\.js/);
});
