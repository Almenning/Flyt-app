'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {injectPreviewHash,sha}=require('./laria-kinnaklova-art-preview.playwright.js');

test('Kinnaklova art preview injects exactly one SHA locally',()=>{
 const marker="const APPROVED_ART_SHA256='';";
 const digest='a'.repeat(64);
 assert.equal(injectPreviewHash(marker,digest),"const APPROVED_ART_SHA256='"+digest+"';");
 assert.throws(()=>injectPreviewHash(marker+marker,digest),/ONE unapproved SHA literal/);
 assert.throws(()=>injectPreviewHash("const APPROVED_ART_SHA256='f';",digest),/ONE unapproved SHA literal/);
 assert.throws(()=>injectPreviewHash(marker,'invalid'),/SHA-256/);
 assert.equal(sha(Buffer.from('abc')),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('Art preview verifies locked inputs and never changes release approval',()=>{
 const source=fs.readFileSync(path.join(__dirname,'laria-kinnaklova-art-preview.playwright.js'),'utf8');
 for(const required of [
  'ARTIST_QA_ONLY_NOT_APPROVED',
  'clean_master_visual_approved,false',
  'release_approval,false',
  'verify_locked_scene.py',
  'source_sha256:asset.sourceDigest',
  "serviceWorkers:'block'",
  'route.fulfill',
  "page.screenshot"
 ])assert.ok(source.includes(required),'Missing safety check: '+required);
 assert.equal(source.includes('writeFileSync(LOCK_PATH'),false);
 assert.equal(source.includes("APPROVED_ART_SHA256='a'"),false);
});
