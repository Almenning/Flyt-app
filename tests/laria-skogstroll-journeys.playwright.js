'use strict';
/* Exact-head first-chapter acceptance: original skogstrolls replace fox artwork,
   while travel, missions, grades and the stored boy/girl profile stay intact. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {chromium,webkit}=require('playwright');

const out=process.env.LARIA_TROLL_SCREENSHOTS||'/tmp/laria-troll-journeys';
fs.mkdirSync(out,{recursive:true});
const assets=Object.freeze({
  storesoster:['5d5f80c15e367bbd4600013057c7820a7b2e2adb',33278],
  lillesoster:['661107cd231a72b14aeca4f7bc3c826130734576',33692],
  lillebror:['5f92c89319ec372b980c75eb3d538a4f4f851a7c',34820]
});
for(const [id,[sha,size]] of Object.entries(assets)){
  const filename='laer-litt-mer/assets/skogstroll/'+id+'.webp';
  const buf=fs.readFileSync(filename);
  assert.equal(buf.length,size,filename+' original asset bytes changed');
  const gitBlob=crypto.createHash('sha1').update('blob '+buf.length+'\0').update(buf).digest('hex');
  assert.equal(gitBlob,sha,filename+' changed from the approved PR #211 original');
}
const subjects=[
  ['norwegian','storesoster','subject'],
  ['math','lillebror','subject'],
  ['english','lillesoster','subject'],
  ['geography','storesoster','geography']
];
const seed=(avatar)=>({
  version:7,progressSchemaVersion:3,
  profile:{grade:2,onboarded:true,name:'TrollQA',avatar,setupVersion:2},
  mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
  masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
  lastMilestone:null,recentCountryWin:null,lastActivity:null,
  journey:{nodes:{},gradeWins:{},viewGrades:{}},
  answerLog:[],sessionLog:[],activeSession:null
});
async function originalImage(locator,file,label){
  await locator.waitFor({state:'attached',timeout:16000});
  await locator.evaluate(async img=>{
    if(!img.complete)await new Promise((resolve,reject)=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',reject,{once:true});});
    await img.decode();
  });
  const m=await locator.evaluate(img=>({
    src:img.getAttribute('src'),natural:img.naturalWidth,display:getComputedStyle(img).display,
    visibility:getComputedStyle(img).visibility,opacity:getComputedStyle(img).opacity
  }));
  assert(m.src.endsWith('/assets/skogstroll/'+file+'.webp'),label+' wrong original: '+JSON.stringify(m));
  assert(m.natural>0,label+' original did not decode');
  assert.notEqual(m.display,'none',label+' original hidden');
  assert.notEqual(m.visibility,'hidden',label+' original invisible');
  assert.equal(m.opacity,'1',label+' original transparent');
}
async function run(engine,label,viewport){
  const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
  try{
    const ctx=await browser.newContext({
      viewport,isMobile:viewport.width<600,hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'
    });
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed('girl'));
    await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
    await page.route('https://api.worldbank.org/**',r=>r.abort());
    const base=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
    await page.goto(base+'&original-trolls='+label,{waitUntil:'domcontentloaded'});
    await page.locator('.bc12.bc15-locked-home').waitFor({timeout:18000});
    assert.equal(await page.evaluate(()=>window.LARIA_SKOGSTROLL?.enabled?.()),true,label+' grade 2 troll gate off');
    for(const [subject,id,screen] of subjects){
      await page.locator('.bc14-subject[data-camp="subject-'+subject+'"]').click();
      const host=page.locator('#'+screen+'-screen.active .locked-journey-map[data-journey-subject="'+subject+'"]');
      const traveler=host.locator('.locked-journey-traveler.laria-troll-host');
      await traveler.waitFor({timeout:20000});
      const profile=host.locator('.locked-journey-profile.laria-troll-host');
      assert.equal(await traveler.count(),1,label+' '+subject+' duplicated character');
      assert.equal(await traveler.getAttribute('data-laria-troll'),id,label+' wrong walking troll');
      assert.equal(await profile.getAttribute('data-laria-troll'),id,label+' wrong portrait troll');
      assert.match(await traveler.getAttribute('aria-label'),/Skogstrollet/,label+' legacy fox spoken on journey');
      await originalImage(traveler.locator(':scope > img'),id,label+' '+subject+' traveler');
      await originalImage(profile.locator(':scope > img'),id,label+' '+subject+' profile');
      assert.equal(await traveler.locator(':scope > .laria-fox-wardrobe-art').count(),0,label+' fox outfit painted on troll');
      assert.equal(await traveler.evaluate(el=>getComputedStyle(el).pointerEvents),'none',label+' troll blocks landmarks');
      const standing=await traveler.boundingBox();
      assert(standing?.width>=42&&standing?.height>=42,label+' troll too small on real map: '+JSON.stringify(standing));
      await page.screenshot({path:path.join(out,label+'-'+subject+'-journey.png'),animations:'disabled'});
      await host.locator('.locked-journey-hotspot.state-current').first().click();
      const mission=page.locator('.locked-journey-overlay:not([hidden]) .locked-journey-sheet.is-mission');
      await mission.waitFor({timeout:10000});
      const moved=mission.locator('.mission-fox-stage .locked-journey-traveler.laria-troll-host');
      assert.equal(await moved.count(),1,label+' troll not moved into existing mission dialog');
      await originalImage(moved.locator(':scope > img'),id,label+' '+subject+' mission');
      const start=mission.locator('button[data-locked-node]:not([disabled])').first();
      await start.waitFor({timeout:8000});
      await start.click();
      await page.locator('#session-screen.active .laria-task-card').waitFor({timeout:15000});
      const task=page.locator('#session-screen.active .task-fox-companion.laria-troll-host');
      assert.equal(await task.count(),1,label+' '+subject+' task duplicated or lost troll');
      assert.equal(await task.getAttribute('data-laria-troll'),id,label+' wrong task troll');
      await originalImage(task.locator(':scope > img'),id,label+' '+subject+' task');
      assert.equal(await task.locator(':scope > svg.laria-fox-wardrobe-art').count(),0,label+' fox costume leaked onto task troll');
      await page.screenshot({path:path.join(out,label+'-'+subject+'-task.png'),animations:'disabled'});
      const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2')));
      assert.equal(state.profile.avatar,'girl',label+' avatar ID migrated unexpectedly');
      assert.equal(state.profile.grade,2,label+' grade changed unexpectedly');
      await page.locator('#close-session').click();
      await host.waitFor({timeout:15000});
      await host.locator('.locked-journey-back').click();
      await page.locator('#home-screen.active .bc14-subject[data-camp="subject-'+subject+'"]').waitFor({timeout:16000});
    }
    assert.deepEqual(errors,[],label+' page errors: '+JSON.stringify(errors));
    console.log('[Troll journeys/task]',label,'four subjects, four tasks, images/semantics/profile preserved');
    await ctx.close();
  }finally{await browser.close();}
}
(async()=>{
  for(const [label,engine,viewport] of [
    ['chromium-iphone',chromium,{width:390,height:844}],
    ['safari-iphone',webkit,{width:390,height:844}],
    ['safari-ipad-landscape',webkit,{width:1180,height:820}]
  ])await run(engine,label,viewport);
})().catch(e=>{console.error(e);process.exitCode=1});
