'use strict';
/**
 * Kinnaklova artist QA, NOT a release route.
 *
 * Expects `python3 -m http.server 8765` at repository root and a verified
 * candidate WebP and exact locked source PNG on local disk. No source code,
 * manifest, approval flag or site file is modified.
 *
 * LARIA_KINNAKLOVA_PREVIEW_REFERENCE=/absolute/locked.png \
 * LARIA_KINNAKLOVA_PREVIEW_CANDIDATE=/absolute/clean.webp \
 * LARIA_KINNAKLOVA_PREVIEW_OUTPUT=/tmp/kinnaklova-art-qa \
 * node tests/laria-kinnaklova-art-preview.playwright.js
 */
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
let chromium,webkit; // Browser engines load only during real QA, not contract import.

const ROOT=path.resolve(__dirname,'..');
const LOCK_PATH=path.join(ROOT,'docs/LARIA-KINNAKLOVA-VISUAL-LOCK-2026-10-26.json');
const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const reference=process.env.LARIA_KINNAKLOVA_PREVIEW_REFERENCE;
const candidate=process.env.LARIA_KINNAKLOVA_PREVIEW_CANDIDATE;
const output=process.env.LARIA_KINNAKLOVA_PREVIEW_OUTPUT||'/tmp/kinnaklova-art-qa';
const IMG_PATH='/laer-litt-mer/assets/kinnaklova/kinnaklova-scene-clean-approved-20261026.webp';
const baseSeed={
 version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'Kinnaklova kontroll',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
 masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
 lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},
 answerLog:[],sessionLog:[],activeSession:null
};
function sha(data){return crypto.createHash('sha256').update(data).digest('hex')}
function injectPreviewHash(js, digest){
 assert.match(digest,/^[0-9a-f]{64}$/,'Expected SHA-256 hex digest');
 const target="const APPROVED_ART_SHA256='';";
 assert.equal(js.split(target).length-1,1,
  'Kinnaklova JS must have ONE unapproved SHA literal, never a production approval');
 return js.replace(target,`const APPROVED_ART_SHA256='${digest}';`);
}
function checkSources(){
 if(!reference||!candidate)throw Error('Both exact PNG reference and cleaned WebP candidate must be supplied. No preview was run.');
 if(path.resolve(reference)===path.resolve(candidate))throw Error('Reference and candidate cannot be the same file');
 const lock=JSON.parse(fs.readFileSync(LOCK_PATH,'utf8'));
 // Preview bypasses the release approval flags ONLY inside the isolated
 // Playwright page, never in the source tree or on GitHub Pages.
 assert.equal(lock.implementation.clean_master_visual_approved,false,
  'This preview harness must not masquerade as approval');
 assert.equal(lock.implementation.release_approval,false,
  'Preview cannot grant permission to publish');
 const original=fs.readFileSync(reference),clean=fs.readFileSync(candidate);
 assert.equal(sha(original),lock.reference.sha256,'Not the locked original PNG');
 assert.equal(original.subarray(1,4).toString('ascii'),'PNG','Reference must be PNG');
 assert.equal(clean.subarray(0,4).toString('ascii'),'RIFF','Candidate must be a WebP image');
 assert.equal(clean.subarray(8,12).toString('ascii'),'WEBP','Candidate must be WebP');
 const digest=sha(clean);
 assert.notEqual(digest,lock.reference.sha256,'Rejected original artwork is not a clean scene');
 const verify=spawnSync(process.env.PYTHON||'python3',[
  path.join(ROOT,'tools/kinnaklova/verify_locked_scene.py'),
  '--reference',path.resolve(reference),'--candidate',path.resolve(candidate)
 ],{encoding:'utf8',timeout:180000});
 if(verify.status!==0)throw Error('Pixel-integrity verification FAILED:\n'+verify.stdout+'\n'+verify.stderr);
 return {digest,clean,sourceDigest:sha(original),verifyLog:verify.stdout};
}
async function run(engine,label,viewport,asset){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({
   viewport,isMobile:viewport.width<=480,hasTouch:true,
   reducedMotion:'reduce',serviceWorkers:'block'
  });
  await context.addInitScript(s=>{localStorage.setItem('laerlittmer-v2',JSON.stringify(s))},baseSeed);
  const page=await context.newPage();
  const browserErrors=[];
  page.on('pageerror',e=>browserErrors.push(e.message));
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  await page.route('**/kinnaklova.js?*',async route=>{
   const response=await route.fetch();
   assert.ok(response.ok(),'Could not load original Kinnaklova script');
   const patched=injectPreviewHash(await response.text(),asset.digest);
   await route.fulfill({status:200,contentType:'application/javascript; charset=utf-8',
    headers:{'cache-control':'no-store'},body:patched});
  });
  await page.route('**'+IMG_PATH,async route=>{
   await route.fulfill({status:200,contentType:'image/webp',headers:{'cache-control':'no-store'},
    body:asset.clean});
  });
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
  await page.locator('#home-screen.active .bc14-subject[data-camp="subject-english"]').click();
  const world=page.locator('#subject-screen.active #kinnaklova-world');
  await world.waitFor({state:'visible',timeout:16000});
  await page.waitForFunction(()=>document.querySelector('#kinnaklova-world')?.dataset.kiArt==='ready',
    null,{timeout:20000});
  const evidence=await world.evaluate(async w=>{
   const img=w.querySelector('.ki-master');
   await img.decode();
   const rect=img.getBoundingClientRect();
   const chars=Array.from(w.querySelectorAll('.ki-troll')).map(c=>({
    name:c.dataset.kiCharacter,src:c.getAttribute('src'),
    loaded:c.complete&&c.naturalWidth>0,
    width:Math.round(c.getBoundingClientRect().width)
   }));
   return {
    ready:w.dataset.kiArt,sceneWidth:img.naturalWidth,sceneHeight:img.naturalHeight,
    masterRenderedWidth:rect.width,masterRenderedHeight:rect.height,
    characters:chars,
    paintedHitTargets: Array.from(w.querySelectorAll('.ki-painted-hit')).map(b=>({
     action:b.dataset.ki,width:Math.round(b.getBoundingClientRect().width)
    })),
    horizontalOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2
   };
  });
  assert.equal(evidence.ready,'ready',label+' clean art was not shown');
  assert.equal(evidence.sceneWidth,1672);
  assert.equal(evidence.sceneHeight,941);
  assert.ok(Math.abs(evidence.masterRenderedHeight/evidence.masterRenderedWidth-941/1672)<.01);
  assert.deepEqual(evidence.characters.map(x=>x.name),['storesoster','lillebror','lillesoster']);
  assert.ok(evidence.characters.every(x=>x.loaded),label+' approved trolls failed to load');
  assert.equal(evidence.horizontalOverflow,false,label+' horizontal overflow');
  assert.deepEqual(browserErrors,[],label+' runtime error');
  fs.mkdirSync(output,{recursive:true});
  const filename=label+'.png';
  await page.screenshot({path:path.join(output,filename),fullPage:true,animations:'disabled'});
  if(viewport.width>700){
    assert.ok(evidence.paintedHitTargets.every(x=>x.width>=44),label+' tiny painted hitbox');
    await world.locator('.ki-painted-words').click();
  }else{
    await world.locator('.ki-card[data-ki="words"]').click();
  }
  await page.locator('#session-screen.active .laria-task-card').waitFor({timeout:16000});
  assert.equal(await page.evaluate(()=>sessionScope?.module),'words');
  assert.equal(await page.locator('#session-screen.active .task-fox-companion').count(),0);
  await page.screenshot({path:path.join(output,label+'-words.png'),fullPage:true,animations:'disabled'});
  await context.close();
  return {label,file:filename,measurements:evidence};
 }finally{await browser.close()}
}
async function main(){
 ({chromium,webkit}=require('playwright'));
 const asset=checkSources();
 const results=[];
 for(const [name,vp] of [
  ['iphone-portrait',{width:390,height:844}],
  ['iphone-landscape',{width:844,height:390}],
  ['ipad-portrait',{width:834,height:1112}],
  ['ipad-landscape',{width:1194,height:834}]
 ])for(const [engine,label] of [[webkit,'webkit'],[chromium,'chromium']]){
  results.push(await run(engine,label+'-'+name,vp,asset));
 }
 const report={status:'ARTIST_QA_ONLY_NOT_APPROVED',
  visual_approval:false,release_approval:false,source_sha256:asset.sourceDigest,
  candidate_sha256:asset.digest,source_verified:true,
  run_results:results};
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log('PREVIEW ONLY: '+results.length+' device/browser views rendered. NEVER publish without visual approval.');
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});
module.exports={injectPreviewHash,sha,checkSources};