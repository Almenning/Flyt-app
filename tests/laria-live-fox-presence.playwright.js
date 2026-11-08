'use strict';
/* Legacy filename kept for CI compatibility. Læria Premium uses the
 * three LOCKED living forest trolls, NOT old foxes. Validate real Geografi
 * travel, a task reaction, old profile-data preservation and child progress.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const OUT=process.env.LARIA_LIVE_FOX_QA||'/tmp/laria-live-fox';
fs.mkdirSync(OUT,{recursive:true});
const BASE=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const seed=avatar=>({
 version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'Troll QA',avatar,
  setupVersion:2,tallvikaTroll:'storesoster'},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},
 skillLastSeen:{},masteryEvidence:{},skillEvidence:{},
 preferences:{sound:false,autoRead:false},
 journey:{nodes:{},gradeWins:{},viewGrades:{}},
 answerLog:[],sessionLog:[],activeSession:null,
 collectibles:{version:1,ownedIds:['magisk-samlebok','oppdagerhatt'],
   equipped:{head:'oppdagerhatt',neck:null,back:null,cape:null}}
});
async function run(engine,name,viewport,legacyAvatar){
 const browser=await engine.launch({headless:true,
   args:engine===chromium?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport,
   isMobile:viewport.width<600,hasTouch:true,
   serviceWorkers:'block',reducedMotion:'reduce'});
  await context.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed(legacyAvatar));
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  await page.goto(BASE+'&living-troll='+name,{waitUntil:'domcontentloaded',timeout:60000});
  const home=page.locator('#home-screen.active');
  await home.locator('.bc14-subject:visible').first().waitFor({timeout:17000});
  assert.equal(await page.evaluate(()=>state.profile.avatar),legacyAvatar,
    name+' historical user data changed');
  assert.equal(await page.evaluate(()=>window.LARIA_TROLL_ACTOR.choice()),'storesoster');
  assert.match(await home.locator('.bc12-fox img').getAttribute('src'),
    /\/storesoster\.webp$/,name+' retired Home fox is not replaced by selected troll');
  assert.equal(await page.evaluate(()=>window.LARIA_COLLECTION_STORE.snapshot().equipped.head),
    'oppdagerhatt',name+' historical reward changed');
  await page.screenshot({path:path.join(OUT,name+'-home.png'),animations:'disabled'});
  const persistedJourney=()=>page.evaluate(()=>
    JSON.stringify(JSON.parse(localStorage.getItem('laerlittmer-v2')).journey));
  const originalJourney=await persistedJourney();

  // Open the real Nordic landskap, not an obsolete direct geography map.
  await home.locator('.bc14-subject[data-camp="subject-geography"]').click();
  const landing=page.locator('#geography-screen.active #laria-geography-world');
  await landing.waitFor({state:'visible',timeout:17000});
  const sceneActor=landing.locator('.gv-troll[data-troll="storesoster"]');
  await sceneActor.waitFor({state:'visible',timeout:14000});
  assert.match(await sceneActor.locator('img').getAttribute('src'),
    /\/storesoster\.webp$/,name+' wrong chosen forest troll in Nordlysleiren');
  await landing.locator('[data-gv="journey"]').click();
  const map=page.locator('#geography-screen.active .locked-journey-map[data-journey-subject="geography"]');
  await map.waitFor({state:'visible',timeout:15000});
  const traveler=map.locator('.locked-journey-traveler[data-troll="storesoster"]');
  await traveler.waitFor({state:'attached',timeout:15000});
  assert.equal(await traveler.locator('.laria-fox-wardrobe-art,.laria-fox-wardrobe-placed').count(),
    0,name+' old fox wardrobe leaked into Geografireisen');
  const realArt=traveler.locator('.locked-journey-troll-art img');
  assert.match(await realArt.getAttribute('src'),/\/storesoster\.webp$/);
  const first=map.locator('.locked-journey-hotspot.state-current').first();
  await first.click();
  const sheet=page.locator('.locked-journey-overlay:not([hidden])');
  await sheet.waitFor({state:'visible',timeout:12000});
  // The only traveler must move into the active sheet, not be cloned.
  assert.equal(await traveler.count(),1,name+' active journey duplicated the troll');
  assert.equal(await traveler.evaluate(el=>!!el.closest('.mission-fox-stage')),true,
    name+' living troll not in real learning sheet');
  assert.equal(await traveler.evaluate(el=>getComputedStyle(el).pointerEvents),'none',
    name+' troll blocks the child reaching an activity');
  await page.screenshot({path:path.join(OUT,name+'-geography-sheet.png'),
    fullPage:true,animations:'disabled'});
  await page.locator('.locked-sheet-close:visible').click();
  await map.waitFor({state:'visible',timeout:14000});
  assert.equal(await persistedJourney(),originalJourney,
    name+' looking at a destination altered saved journey progress');

  // Reopen a real mission and exercise contextual TrollActor reactions.
  await map.locator('.locked-journey-hotspot.state-current').first().click();
  const mission=page.locator('.locked-journey-overlay:not([hidden]) button[data-locked-node]:not([disabled])').first();
  await mission.waitFor({state:'visible',timeout:12000});
  await mission.click();
  await page.locator('#session-screen.active .laria-task-card').waitFor({state:'visible',timeout:16000});
  const task=page.locator('#session-screen.active .task-fox-companion.laria-troll-host');
  await task.waitFor({state:'attached',timeout:16000});
  await page.waitForFunction(()=>document.querySelector(
    '#session-screen.active .task-fox-companion img.laria-premium-troll-art')?.getAttribute('src')?.
    endsWith('/storesoster.webp'),null,{timeout:16000});
  assert.equal(await task.locator('.laria-fox-wardrobe-art,.laria-fox-wardrobe-placed').count(),
    0,name+' a retired fox was drawn over the living task actor');
  const allowed=['curious','support','celebrate'];
  for(const mood of allowed){
   assert.equal(await task.evaluate((el,m)=>window.LARIA_TROLL_ACTOR.mood(el,m,{say:false,duration:300}),mood),
     true,name+' TrollActor cannot react with '+mood);
   assert.equal(await task.getAttribute('data-laria-troll-mood'),mood);
  }
  assert.equal(await page.evaluate(()=>state.profile.avatar),legacyAvatar,
    name+' entering the task changed historical child profile data');
  await page.screenshot({path:path.join(OUT,name+'-task.png'),animations:'disabled'});
  assert.deepEqual(errors,[],name+' browser errors');
  console.log('PASS living TrollActor in Nordlysleiren journey+task',name);
  await context.close();
 }finally{await browser.close()}
}
(async()=>{
 for(const [engine,name,viewport,avatar] of [
  [chromium,'chromium-iphone',{width:390,height:844},'girl'],
  [webkit,'webkit-iphone',{width:390,height:844},'girl'],
  [webkit,'webkit-ipad',{width:820,height:1180},'boy']
 ])await run(engine,name,viewport,avatar);
})().catch(err=>{console.error(err);process.exitCode=1});
