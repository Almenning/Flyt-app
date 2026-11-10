'use strict';
/* Læria migration regression: the retired "fox" filename is retained ONLY
 * because older GitHub Actions refer to it. The product character is now
 * one of THREE approved living forest trolls, never a visible fox.
 * Existing legacy profile.avatar must survive without driving character art.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const OUT=process.env.LARIA_FOX_SCREENSHOTS||'/tmp/laria-fox-identity';
fs.mkdirSync(OUT,{recursive:true});
const BASE=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const CHOICES=['storesoster','lillesoster','lillebror'];
const SCENES=[
 {subject:'norwegian',root:'#subject-screen.active #eggenipa-world',actor:'.eg-companion-actor',home:'[data-eg="home"]'},
 {subject:'math',root:'#subject-screen.active #tallvika-world',actor:'.tv-actor',home:'[data-tv="back"]'},
 {subject:'english',root:'#subject-screen.active #kinnaklova-world',actor:'.ki-companion-actor',home:'[data-ki="home"]'},
 {subject:'geography',root:'#geography-screen.active #laria-geography-world',actor:'.gv-troll',home:'[data-gv="home"]'}
];
const makeSeed=avatar=>({
 version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'Troll QA',avatar,setupVersion:2,tallvikaTroll:'storesoster'},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},
 preferences:{sound:false,autoRead:false},
 journey:{nodes:{},gradeWins:{},viewGrades:{}},
 answerLog:[],sessionLog:[],activeSession:null
});
async function run(engine,label,viewport,avatar){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({
   viewport,isMobile:viewport.width<600,hasTouch:true,
   serviceWorkers:'block',reducedMotion:'reduce'
  });
  const seed=makeSeed(avatar);
  await context.addInitScript(value=>{
   if(!localStorage.getItem('laerlittmer-v2'))
    localStorage.setItem('laerlittmer-v2',JSON.stringify(value));
  },seed);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  await page.goto(BASE+'&troll-migration='+label,{waitUntil:'domcontentloaded',timeout:60000});
  const home=page.locator('#home-screen.active');
  await home.locator('.bc14-subject:visible').first().waitFor({timeout:20000});
  assert.equal(await page.evaluate(()=>state.profile.avatar),avatar,
   label+' must retain persisted legacy profile information');
  assert.deepEqual(await page.evaluate(()=>window.LARIA_TROLL_ACTOR.ids),
   CHOICES,label+' changed the THREE locked approved troll identities');
  assert.equal(await page.evaluate(()=>window.LARIA_TROLL_ACTOR.choice()),
   'storesoster',label+' wrong default original troll');
  // The original painted home remains temporarily locked; this DOM image is
  // not the authoritative visual acceptance test for clean Grovanova art.
  const homeArt=home.locator('.bc12-fox > img');
  await homeArt.waitFor({state:'attached',timeout:16000});
  assert.match(await homeArt.getAttribute('src'),/\/storesoster\.webp$/,
   label+' selected troll must replace retired Home fox art');
  const initial=await page.evaluate(()=>JSON.stringify({
   mastery:state.mastery,skillMastery:state.skillMastery,
   journey:state.journey,answerLog:state.answerLog
  }));
  // Exercise the actual shared chooser, not only a setter. Preserve progress.
  await page.evaluate(()=>window.LARIA_TROLL_ACTOR.openChooser());
  const dialog=page.locator('#laria-premium-troll-dialog[open]');
  await dialog.waitFor({state:'visible',timeout:12000});
  assert.deepEqual(await dialog.locator('[data-troll-choice]').evaluateAll(a=>a.map(x=>x.dataset.trollChoice)),
   CHOICES,label+' chooser contains an unapproved character');
  await dialog.locator('[data-troll-choice="lillebror"]').click();
  await page.waitForFunction(()=>state.profile.tallvikaTroll==='lillebror',null,{timeout:12000});
  await dialog.waitFor({state:'hidden',timeout:12000});
  assert.equal(await page.evaluate(()=>JSON.stringify({
   mastery:state.mastery,skillMastery:state.skillMastery,
   journey:state.journey,answerLog:state.answerLog
  })),initial,label+' selecting a troll changed learning progress');

  for(const spec of SCENES){
   const go=home.locator('.bc14-subject[data-camp="subject-'+spec.subject+'"]');
   await go.waitFor({state:'visible',timeout:16000});
   await go.click();
   const world=page.locator(spec.root);
   await world.waitFor({state:'visible',timeout:16000});
   const actor=world.locator(spec.actor);
   await actor.waitFor({state:'attached',timeout:16000});
   // Math keeps data-troll-id on its positioned wrapper; others use data-troll.
   const identity=await actor.evaluate(el=>el.dataset.troll||el.dataset.trollId||'');
   assert.equal(identity,'lillebror',label+' '+spec.subject+' wrong chosen troll');
   const img=actor.locator('img.laria-premium-troll-art');
   await img.waitFor({state:'attached',timeout:16000});
   const imgSrc=await img.getAttribute('src');
   assert.match(imgSrc,/\/lillebror\.webp$/,
    label+' '+spec.subject+' rendered an old character, not selected Lillebror');
   assert.equal(await world.locator('.laria-fox-wardrobe-art,.laria-fox-wardrobe-placed').count(),0,
    label+' '+spec.subject+' retired fox rig still exists in active scene');
   const controls=world.locator('.laria-wayfinder');
   assert.equal(await controls.count(),3,
    label+' '+spec.subject+' must offer exactly THREE real activity signs');
   assert.equal(await page.evaluate(()=>state.profile.avatar),avatar,
    label+' '+spec.subject+' changed historical profile state');
   await page.screenshot({path:OUT+'/'+label+'-'+spec.subject+'-troll.png',
    fullPage:true,animations:'disabled'});
   // Use the REAL in-scene back action, without re-creating sessions or
   // editing saved data just to satisfy a test.
   const back=world.locator(spec.home+':visible').first();
   await back.click();
   await home.locator('.bc14-subject:visible').first().waitFor({timeout:16000});
  }
  // Reload must preserve child-selected TrollActor and legacy profile fields.
  await page.reload({waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('#home-screen.active .bc14-subject:visible').first().waitFor({timeout:16000});
  const after=await page.evaluate(()=>({
   profileAvatar:state.profile.avatar,
   selectedTroll:state.profile.tallvikaTroll,
   persisted:JSON.parse(localStorage.getItem('laerlittmer-v2')).profile.tallvikaTroll,
   runtimeChoice:window.LARIA_TROLL_ACTOR.choice()
  }));
  assert.deepEqual(after,{
   profileAvatar:avatar,selectedTroll:'lillebror',
   persisted:'lillebror',runtimeChoice:'lillebror'
  },label+' reload corrupted persisted identity');
  assert.deepEqual(errors,[],label+' uncaught runtime errors');
  await context.close();
  console.log('PASS',label,'four troll worlds, real chooser, progress and reload');
 }finally{await browser.close()}
}
(async()=>{
 for(const [engine,label,viewport,avatar] of [
  [chromium,'chromium-iphone',{width:390,height:844},'boy'],
  [webkit,'webkit-iphone',{width:390,height:844},'girl'],
  [webkit,'webkit-ipad-portrait',{width:820,height:1180},'boy'],
  [webkit,'webkit-ipad-landscape',{width:1180,height:820},'girl']
 ])await run(engine,label,viewport,avatar);
})().catch(err=>{console.error(err);process.exitCode=1;});
