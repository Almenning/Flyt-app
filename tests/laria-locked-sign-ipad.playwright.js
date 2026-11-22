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
 const root=page.locator(locked?'#home-screen.active .bc12.bc15-v16-locked':'#home-screen.active');
 await root.waitFor({state:'visible',timeout:30000});
 if(locked)assert.equal(await root.locator('.bc15-v16-sign').count(),4,'Home must retain four real subject routes');
 const size=await root.evaluate(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,scroll:document.documentElement.scrollWidth}));
 assert.ok(size.width>=44&&size.height>=44&&size.scroll<=innerWidth+2,'Home overflows the iPad viewport');
 await page.screenshot({path:path.join(OUT,file),animations:'disabled'});
}
async function candidateScene(page,subject,selector,file,w,h){
 await openHomeSubject(page,subject);
 const scene=page.locator(selector);await scene.waitFor({state:'visible',timeout:30000});
 const rail=scene.locator('nav.laria-scene-navigation:visible');await rail.waitFor({state:'visible',timeout:15000});
 // The new visual treatment applies only where art is a separate UI layer.
 const signs=rail.locator('button.laria-wooden-sign:visible');
 assert.equal(await signs.count(),3,subject+' must retain its three real activity routes');
 const measured=await signs.evaluateAll(nodes=>nodes.map(node=>{
  const r=node.getBoundingClientRect(),s=getComputedStyle(node);
  const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
  return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,canTap:hit===node||node.contains(hit),font:s.fontFamily};
 }));
 assert.ok(measured.every(item=>item.width>=44&&item.height>=44&&item.canTap&&item.x>=-1&&item.right<=w+1&&item.y>=0&&item.bottom<=h+1),subject+' has clipped or unreachable sign: '+JSON.stringify(measured));
 assert.ok(measured.every(item=>/Georgia|Times New Roman/.test(item.font)),subject+' did not use the locked sign type family');
 await page.screenshot({path:path.join(OUT,file),animations:'disabled'});
}
async function englishGuard(page,file){
 await openHomeSubject(page,'english');
 const scene=page.locator('#kinnaklova-world .ki-stage.laria-scene-shell');await scene.waitFor({state:'visible',timeout:30000});
 assert.equal(await scene.getAttribute('data-laria-artwork-ui'),'painted-pending-clean','Kinnaklova art guard was removed');
 assert.equal(await scene.locator('.laria-wooden-sign').count(),0,'New sign may not cover painted Kinnaklova art');
 assert.equal(await scene.locator('.ki-painted-hit.laria-wayfinder').count(),3,'English lost its real action targets');
 await page.screenshot({path:path.join(OUT,file),animations:'disabled'});
}
async function run(engine,name,device,w,h){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 try {
  const context=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
  await context.addInitScript(value=>localStorage.setItem('laerlittmer-v2',JSON.stringify(value)),seed);
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  if(BASELINE&&(['ipad-1024x1366','ipad-1366x1024'].includes(device)))await home(page,BASELINE,name+'-'+device+'-home-before.png',false);
  await home(page,BASE,name+'-'+device+'-home-after.png');
  for(const [subject,selector] of scenes)await candidateScene(page,subject,selector,name+'-'+device+'-'+subject+'-after.png',w,h);
  await englishGuard(page,name+'-'+device+'-english-art-guard.png');
  assert.deepEqual(errors,[],name+' '+device+' emitted runtime errors');
  await context.close();
 } finally { await browser.close(); }
}
(async()=>{fs.mkdirSync(OUT,{recursive:true});for(const [device,w,h] of devices)for(const [name,engine] of [['chromium',chromium],['webkit',webkit]])await run(engine,name,device,w,h);})().catch(error=>{console.error(error);process.exitCode=1;});
