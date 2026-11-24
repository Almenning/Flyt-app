'use strict';
/* Exact-head evidence for the review-gated Premium sign candidate. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const openHomeSubject=require('./helpers/laria-home-open-subject.cjs');
const base=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const url=base+(base.includes('?')?'&':'?')+'lariaPremiumSignArt=1&lariaReferenceLayout=1';
const out=process.env.LARIA_PREMIUM_INTEGRATION_SCREENSHOTS||'/tmp/laria-premium-integration';
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Premium QA',avatar:'girl',setupVersion:2,tallvikaTroll:'lillesoster'},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},preferences:{sound:false,autoRead:false},journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
const views=[['820x1180',{width:820,height:1180}],['1024x1366',{width:1024,height:1366}],['1180x820',{width:1180,height:820}],['1024x768',{width:1024,height:768}],['1366x1024',{width:1366,height:1024}]];
const subjects=[['norwegian','#eggenipa-world .eg-hero'],['math','#tallvika-world .tv-scene'],['english','#kinnaklova-world .ki-stage'],['geography','#laria-geography-world .gv-scene']];
async function visit(engine,engineName,viewName,viewport){
 const browser=await engine.launch({headless:true,args:engineName==='chromium'?['--no-sandbox']:[]});
 try{const context=await browser.newContext({viewport,hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
  await context.addInitScript(v=>localStorage.setItem('laerlittmer-v2',JSON.stringify(v)),seed);
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
  await page.locator('#home-screen.active .bc12.bc15-locked-home').waitFor({state:'visible',timeout:25000});
  await fs.promises.mkdir(out,{recursive:true});
  await page.screenshot({path:path.join(out,`${engineName}-${viewName}-home.png`),animations:'disabled'});
  for(const [id,selector] of subjects){
   await openHomeSubject(page,id); const scene=page.locator(selector); await scene.waitFor({state:'visible',timeout:25000});
   const nav=scene.locator('nav.laria-scene-navigation');await nav.waitFor({state:'visible',timeout:15000});
   await page.waitForFunction(n=>document.querySelector(n)?.dataset.lariaPremiumSignArt==='ready',selector+' nav.laria-scene-navigation',{timeout:25000});
   const data=await nav.evaluate(el=>({state:el.dataset.lariaPremiumSignArt,rail:el.classList.contains('laria-premium-sign-rail'),posts:getComputedStyle(el,'::before').backgroundImage,signs:[...el.querySelectorAll('button.laria-premium-sign')].map(b=>{const r=b.getBoundingClientRect();const face=b.querySelector('.laria-premium-sign-face');return {w:r.width,h:r.height,l:r.left,r:r.right,t:r.top,b:r.bottom,board:getComputedStyle(face).backgroundImage}})}));
   assert.equal(data.state,'ready',id+' source-art rail did not complete');assert.equal(data.rail,true,id+' source-art rail class missing');
   assert.match(data.posts,/data:image\/png/,id+' posts are not source-derived PNG');assert.equal(data.signs.length,3,id+' must retain three real activity actions');
   for(const sign of data.signs){assert.ok(sign.w>=44&&sign.h>=44,id+' touch target smaller than 44px');assert.ok(sign.l>=-2&&sign.r<=viewport.width+2&&sign.t>=-2&&sign.b<=viewport.height+2,id+' sign clipped');assert.match(sign.board,/data:image\/png/,id+' plank lacks source art')}
   await page.screenshot({path:path.join(out,`${engineName}-${viewName}-${id}.png`),animations:'disabled'});
   await page.locator('[data-laria-component="home"]').first().click();await page.locator('#home-screen.active .bc12.bc15-locked-home').waitFor({state:'visible',timeout:15000});
  }
  assert.deepEqual(errors,[],engineName+'/'+viewName+' page errors');await context.close();console.log('PASS',engineName,viewName);
 }finally{await browser.close()}
}
(async()=>{for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]])for(const [name,viewport] of views)await visit(engine,engineName,name,viewport)})().catch(e=>{console.error(e);process.exitCode=1});
