'use strict';
/* Exact-HEAD browser evidence for the locked sign candidate. The test uses
 * real scenes and handlers, not a component-only fixture. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const openHomeSubject=require('./helpers/laria-home-open-subject.cjs');
const BASE=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const BASELINE=process.env.LARIA_BASELINE_URL||'';
const OUT=process.env.LARIA_LOCKED_SIGN_SHOTS||'/tmp/laria-locked-signs';
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Skilt QA',avatar:'girl',setupVersion:2,tallvikaTroll:'lillesoster'},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
const devices=[['ipad-820x1180',820,1180],['ipad-1024x1366',1024,1366],['ipad-1180x820',1180,820],['ipad-1024x768',1024,768],['ipad-1366x1024',1366,1024]];
const scenes=[
 ['norwegian','#eggenipa-world .eg-hero.laria-scene-shell'],
 ['math','#tallvika-world .tv-scene.laria-scene-shell'],
 ['geography','#laria-geography-world .gv-scene.laria-scene-shell']
];
async function home(page,url,file,locked=true){
 await page.goto(url,{waitUntil:'domcontentloaded'});
 const root=page.locator('#home-screen.active');
 await root.waitFor({state:'visible',timeout:30000});
 if(locked)assert.ok(await root.locator('[data-camp^="subject-"]').count()>=4,'Home must retain four real subject routes');
 const size=await root.evaluate(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,
  scroll:document.documentElement.scrollWidth,viewport:window.innerWidth}));
 assert.ok(size.width>=44&&size.height>=44&&size.scroll<=size.viewport+2,'Home overflows the iPad viewport');
 await page.screenshot({path:path.join(OUT,file),animations:'disabled'});
}
async function baseline(page,url,file){
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(1200);
 await page.screenshot({path:path.join(OUT,file),animations:'disabled'});
}
async function candidateScene(page,subject,selector,file,w,h){
 await openHomeSubject(page,subject);
 const scene=page.locator(selector);await scene.waitFor({state:'visible',timeout:30000});
 const rail=scene.locator('nav.laria-scene-navigation:visible');await rail.waitFor({state:'visible',timeout:15000});
 // The new visual treatment applies only where art is a separate UI layer.
 // Preserve visual evidence even when a subsequent assertion fails.
 await page.screenshot({path:path.join(OUT,file),animations:'disabled'});
 const signs=rail.locator('button.laria-wooden-sign:visible');
 assert.equal(await signs.count(),3,subject+' must retain its three real activity routes');
 if(subject==='math'){
  const secondary=rail.locator('button.tv-next-sign.laria-reference-next');
  assert.equal(await secondary.count(),1,'Tallvika lost its Next adventure route');
  assert.equal(await secondary.locator('.laria-wooden-sign-medallion').count(),0,
   'Next adventure was incorrectly promoted to a fourth primary sign');
  assert.equal(await rail.locator('button.tv-next-sign.laria-wooden-sign').count(),0,
   'Next adventure must remain a distinct secondary sign');
  const rect=await secondary.boundingBox();
  assert.ok(rect&&rect.width>=44&&rect.height>=44,
   'Secondary Next adventure needs a real 44px touch target');
 }
 const measured=await signs.evaluateAll(nodes=>nodes.map(node=>{
  const r=node.getBoundingClientRect();
  const surface=node.querySelector(':scope > .laria-wooden-sign-surface')||node;
  const font=getComputedStyle(surface).fontFamily;
  const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
  return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,canTap:hit===node||node.contains(hit),font};
 }));
 assert.ok(measured.every(item=>item.width>=44&&item.height>=44&&item.canTap&&item.x>=-1&&item.right<=w+1&&item.y>=0&&item.bottom<=h+1),subject+' has clipped or unreachable sign: '+JSON.stringify(measured));
 assert.ok(measured.every(item=>/Georgia|Times New Roman/.test(item.font)),subject+' did not use the locked sign type family: '+JSON.stringify(measured));
 // Exercise the REAL subject Back button before opening the next subject.
 // Reusing openHomeSubject without a return left the previous scene active,
 // which falsely looked like a broken Home renderer on the second subject.
 const back={
  norwegian:'#eggenipa-world [data-eg="home"]:visible',
  math:'#tallvika-world [data-tv="back"]:visible',
  geography:'#laria-geography-world .gv-home:visible'
 }[subject];
 assert.ok(back,'Missing subject return route: '+subject);
 await page.locator(back).first().click({timeout:20000});
 await page.locator('#home-screen.active .bc12.bc15-locked-home')
   .waitFor({state:'visible',timeout:30000});
}
async function englishGuard(page,file){
 await openHomeSubject(page,'english');
 const scene=page.locator('#kinnaklova-world .ki-stage.laria-scene-shell');await scene.waitFor({state:'visible',timeout:30000});
 const art=await page.locator('#kinnaklova-world').getAttribute('data-ki-premium-art');
 const mode=await scene.getAttribute('data-laria-artwork-ui');
 assert.equal(await scene.locator('.ki-painted-hit.laria-wayfinder').count(),3,
  'English lost its three original Words/Sentences/Reading action targets');
 if(art==='approved'){
  // The checked-in SHA-verified UI-free Kinnaklova is a separate art layer.
  // This tests functional readiness, not product-owner visual approval.
  assert.equal(mode,'separate','Approved clean Kinnaklova must expose separate UI');
  const boards=scene.locator('.ki-painted-hit.laria-wayfinder.laria-wooden-sign');
  assert.equal(await boards.count(),3,'UI-free English did not receive the new sign component');
  const labels=await boards.locator('.ki-plank-name').allTextContents();
  assert.deepEqual(labels.map(x=>x.trim()),['Words','Sentences','Reading'],
    'English activity labels changed during sign re-skin');
  assert.equal(await boards.locator('.laria-wooden-sign-medallion svg').count(),3,
    'English needs one real symbol per approved wooden sign');
 } else {
  assert.equal(mode,'painted-pending-clean','Unapproved English art guard was removed');
  assert.equal(await scene.locator('.laria-wooden-sign').count(),0,
    'New sign may not cover painted Kinnaklova art');
 }
 await page.screenshot({path:path.join(OUT,file),animations:'disabled'});
}
async function run(engine,name,device,w,h){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 try {
  const context=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
  await context.addInitScript(value=>localStorage.setItem('laerlittmer-v2',JSON.stringify(value)),seed);
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  if(BASELINE&&(['ipad-1024x1366','ipad-1366x1024'].includes(device)))await baseline(page,BASELINE,name+'-'+device+'-home-before.png');
  await home(page,BASE,name+'-'+device+'-home-after.png');
  for(const [subject,selector] of scenes)await candidateScene(page,subject,selector,name+'-'+device+'-'+subject+'-after.png',w,h);
  await englishGuard(page,name+'-'+device+'-english-art-guard.png');
  assert.deepEqual(errors,[],name+' '+device+' emitted runtime errors');
  await context.close();
 } finally { await browser.close(); }
}
(async()=>{fs.mkdirSync(OUT,{recursive:true});for(const [device,w,h] of devices)for(const [name,engine] of [['chromium',chromium],['webkit',webkit]])await run(engine,name,device,w,h);})().catch(error=>{console.error(error);process.exitCode=1;});
