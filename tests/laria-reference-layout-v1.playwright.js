'use strict';
/* Visual acceptance evidence from ACTUAL iPad app, not concept pictures.
 * Preview remains opt-in; Grovanova and Kinnaklova art are blocked. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const base=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const url=base+(base.includes('?')?'&':'?')+'lariaReferenceLayout=1';
const out=process.env.LARIA_REFERENCE_SCREENSHOTS||'/tmp/laria-reference-layout';
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Referanse QA',avatar:'girl',setupVersion:2,tallvikaTroll:'lillesoster'},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},preferences:{sound:false,autoRead:false},journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
const worlds=[
 {id:'norwegian',root:'#eggenipa-world .eg-hero.laria-reference-layout-v1',actor:'.eg-companion-actor'},
 {id:'math',root:'#tallvika-world .tv-scene.laria-reference-layout-v1',actor:'.tv-actor-touch'},
 {id:'geography',root:'#laria-geography-world .gv-scene.laria-reference-layout-v1',actor:'.gv-troll'}
];
async function testEngine(engine,name,device,viewport){
 const browser=await engine.launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport,hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce',deviceScaleFactor:1});
  await context.addInitScript(v=>localStorage.setItem('laerlittmer-v2',JSON.stringify(v)),seed);
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
  const home=page.locator('#home-screen.active .bc12.bc15-locked-home');
  await home.waitFor({state:'visible',timeout:22000});
  await fs.promises.mkdir(out,{recursive:true});
  await page.screenshot({path:path.join(out,name+'-'+device+'-home-art-blocked.png'),animations:'disabled'});
  for(const world of worlds){
   await page.locator('#home-screen .bc14-subject[data-camp="subject-'+world.id+'"]').click();
   const scene=page.locator(world.root);
   await scene.waitFor({state:'visible',timeout:20000});
   const nav=scene.locator('nav.laria-reference-subject-nav');
   assert.equal(await nav.locator('button').count(),5,world.id+' five destination signs');
   assert.equal(await nav.locator('button[aria-current="page"]').count(),1,world.id+' active menu');
   assert.equal(await nav.locator('button[aria-current="page"]').getAttribute('data-laria-ref-subject'),world.id);
   const boxes=await scene.evaluate(el=>{
    const rect=e=>{const r=e.getBoundingClientRect();return {l:r.left,t:r.top,r:r.right,b:r.bottom,w:r.width,h:r.height}};
    return {menu:[...el.querySelectorAll('.laria-reference-subject-sign')].map(rect),
      activity:[...el.querySelectorAll('nav.laria-scene-navigation > .laria-wayfinder')].map(rect),
      plaque:rect(el.querySelector('.laria-reference-place'))};
   });
   assert.equal(boxes.activity.length,3,world.id+' real three learning buttons');
   for(const box of boxes.menu){
    assert.ok(box.l>=0&&box.t>=0&&box.r<=viewport.width+3&&box.b<=viewport.height+3,
      world.id+' left sign clipped: '+JSON.stringify(box));
    assert.ok(box.w>=44&&box.h>=44&&box.r<viewport.width*.4,world.id+' left menu touch area');
   }
   for(const box of boxes.activity){
    assert.ok(box.l>viewport.width*.52&&box.b<=viewport.height+3&&box.r<=viewport.width+3,
      world.id+' right activity clipped: '+JSON.stringify(box));
    assert.ok(box.w>=44&&box.h>=44,world.id+' activity touch area');
   }
   const actor=scene.locator(world.actor).first();
   assert.equal(await actor.getAttribute('data-troll'),'lillesoster',world.id+' selected original troll');
   const art=await actor.locator('img').evaluate(img=>({src:img.getAttribute('src'),ok:img.complete&&img.naturalWidth>0}));
   assert.match(art.src||'',/gangemagi-troll\/lillesoster\.webp/);
   assert.ok(art.ok,world.id+' original troll image missing');
   const oldHome=scene.locator('[data-laria-reference-hidden="true"]');
   assert.equal(await oldHome.count(),1,'one original legacy Home anchor');
   assert.equal(await oldHome.isVisible(),false,'no double Home control');
   await page.screenshot({path:path.join(out,name+'-'+device+'-'+world.id+'.png'),animations:'disabled'});
   await nav.locator('[data-laria-ref-subject="home"]').click();
   await home.waitFor({state:'visible',timeout:15000});
  }
  // Test the new five-sign navigation itself, not only a return to Home.
  // Clicking an inactive subject must reuse the original child routes.
  await page.locator('#home-screen .bc14-subject[data-camp="subject-norwegian"]').click();
  await page.locator('#eggenipa-world .laria-reference-subject-nav [data-laria-ref-subject="math"]').click();
  await page.locator('#tallvika-world .tv-scene.laria-reference-layout-v1').waitFor({state:'visible',timeout:17000});
  await page.locator('#tallvika-world .laria-reference-subject-nav [data-laria-ref-subject="geography"]').click();
  await page.locator('#laria-geography-world .gv-scene.laria-reference-layout-v1').waitFor({state:'visible',timeout:17000});
  await page.locator('#laria-geography-world .laria-reference-subject-nav [data-laria-ref-subject="norwegian"]').click();
  await page.locator('#eggenipa-world .eg-hero.laria-reference-layout-v1').waitFor({state:'visible',timeout:17000});
  await page.locator('#eggenipa-world .laria-reference-subject-nav [data-laria-ref-subject="home"]').click();
  await home.waitFor({state:'visible',timeout:17000});
  await page.locator('#home-screen .bc14-subject[data-camp="subject-english"]').click();
  const english=page.locator('#kinnaklova-world:visible');
  await english.waitFor({state:'visible',timeout:18000});
  assert.equal(await english.locator('.laria-reference-subject-nav').count(),0);
  await page.locator('#kinnaklova-world[data-ki-art="ready"]').waitFor({timeout:22000});
  await page.screenshot({path:path.join(out,name+'-'+device+'-english-art-blocked.png'),animations:'disabled'});
  assert.deepEqual(errors,[],name+'/'+device+' browser exceptions');
  const st=await page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2')));
  assert.equal(st.profile.tallvikaTroll,'lillesoster');
  await fs.promises.writeFile(path.join(out,name+'-'+device+'-review.json'),JSON.stringify({
    head:process.env.LARIA_GIT_SHA||null,mode:'NOT APPROVED - real app screenshot',
    engine:name,device,viewport,scenesReviewed:worlds.map(w=>w.id),
    blockedOriginals:['Grovanova/Hjem','Kinnaklova/Engelsk'],
    childProgressPreserved:true
  },null,2));
  console.log('PASS real '+name+' '+device+' Læria preview');
  await context.close();
 }finally{await browser.close()}
}
(async()=>{
 for(const [device,viewport] of [
  ['ipad-landscape',{width:1366,height:1024}],
  ['ipad-portrait',{width:1024,height:1366}]
 ])for(const [name,engine] of [['chromium',chromium],['webkit',webkit]])
   await testEngine(engine,name,device,viewport);
})().catch(err=>{console.error(err);process.exitCode=1});
