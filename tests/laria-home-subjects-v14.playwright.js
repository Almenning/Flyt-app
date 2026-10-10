'use strict';
/* Exact-head iPhone/iPad Safari and Chromium proof for Læria's subject-first Home. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const folder=process.env.HOME_V14_SCREENSHOTS||'/tmp/laria-home-v14';
fs.mkdirSync(folder,{recursive:true});
const seed={
 version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Testbarn',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},
 preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null
};
async function run(engine,label,viewport){
 const browser=await engine.launch({headless:true,args:label==='chromium-iphone'?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport,isMobile:viewport.width<600,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
  const page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',req=>requests.push(req.url()));
  await page.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed);
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  await page.goto((process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria')+'&home-v14='+label,{waitUntil:'domcontentloaded'});
  await page.locator('.bc14-subject:visible').first().waitFor({timeout:16000});
  assert.equal(await page.locator('.bc14-subject:visible').count(),4,label+' must show four subjects on Home');
  assert.equal((await page.locator('.bc12-heading h1').innerText()).trim(),'Hei, Testbarn!');
  assert.equal(await page.locator('.bc14-free').isVisible(),true,label+' free play entry is missing');
  assert.equal(await page.locator('.bc12-journey').isVisible(),true,label+' continue journey is missing');
  const names=await page.locator('.bc14-subject-copy strong').allTextContents();
  assert.deepEqual(names,['Norsk','Matte','Engelsk','Geografi'],label+' subject order');
  assert.equal(await page.locator('.bc14-subject-scene>svg').count(),4,label+' cards must be illustrated not text-only');
  assert.equal(await page.locator('.bc12-place:visible').count(),0,label+' old activity signs must not compete with Home');
  await page.waitForTimeout(100);
  assert.equal(requests.some(u=>/(?:matte|engelsk|geografi|bokskogen)-verden\.png/.test(u)),false,label+' loaded huge chapter artwork on Home');
  const positions=await page.evaluate(()=>{
   const rect=s=>{const {x,y,width,height,bottom,right}=document.querySelector(s).getBoundingClientRect();return {x,y,width,height,bottom,right}};
   return {cards:[...document.querySelectorAll('.bc14-subject')].map(e=>{const {x,y,width,height,bottom,right}=e.getBoundingClientRect();return {x,y,width,height,bottom,right}}),
    header:rect('.bc12-heading'),nav:rect('.bc12-nav'),journey:rect('.bc12-journey'),free:rect('.bc14-free'),
    scroll:document.documentElement.scrollWidth,viewport:innerWidth};
  });
  assert(positions.scroll<=positions.viewport+1,label+' horizontal overflow '+JSON.stringify(positions));
  assert(positions.cards.every(r=>r.width>=80&&r.height>=80&&r.x>=0&&r.right<=viewport.width+1),label+' clipped subject card '+JSON.stringify(positions));
  assert(positions.cards.every(r=>r.y>=positions.header.bottom-7),label+' subject cards overlap the welcome heading '+JSON.stringify(positions));
  assert(positions.cards.every(r=>r.bottom<=positions.journey.y+6),label+' journey obscures subject cards '+JSON.stringify(positions));
  assert(positions.journey.bottom<=positions.nav.y+5,label+' primary journey blocked by bottom navigation '+JSON.stringify(positions));
  assert(positions.free.bottom<=positions.nav.y+5,label+' Explore blocked by bottom navigation '+JSON.stringify(positions));
  assert(positions.cards.every(r=>r.height>=44&&r.width>=44),label+' subject touch target too small');
  await page.screenshot({path:folder+'/'+label+'-home.png',fullPage:true});
  for(const [subject,screen] of [['norwegian','subject'],['math','subject'],['english','subject'],['geography','geography']]){
   await page.locator('.bc14-subject[data-camp="subject-'+subject+'"]').click();
   await page.locator('#'+screen+'-screen.active').waitFor({timeout:13000});
   const back=page.locator('#'+screen+'-screen .bok-v10-home:visible, #'+screen+'-screen .premium-world-back:visible, #'+screen+'-screen .locked-journey-back:visible, #'+screen+'-back:visible').first();
   await back.waitFor({state:'visible',timeout:12000});
   await back.click();
   await page.locator('#home-screen.active').waitFor({timeout:12000});
   await page.locator('.bc14-subject[data-camp="subject-'+subject+'"]:visible').waitFor({timeout:12000});
  }
  await page.locator('.bc14-free').click();
  await page.locator('.bc13-panel:not([hidden]) [data-bc13-action="globe"]').waitFor({timeout:12000});
  assert.equal(await page.locator('.bc13-card:visible').count(),4,label+' free play must keep four destinations');
  assert.equal(await page.locator('.bc14-subject:visible').count(),0,label+' subject cards should disappear behind Explore');
  await page.locator('.bc13-close').click();
  assert.equal(await page.locator('.bc14-subject:visible').count(),4,label+' Home should restore subject gateways');
  assert.deepEqual(errors,[],label+' page errors '+JSON.stringify(errors));
  console.log('[home v14]',label,JSON.stringify(viewport),'all four subjects, returns, Explore and layout OK');
  await context.close();
 }finally{await browser.close()}
}
(async()=>{
 for(const [label,engine,viewport] of [
  ['chromium-iphone',chromium,{width:390,height:844}],
  ['safari-iphone',webkit,{width:390,height:844}],
  ['safari-small',webkit,{width:320,height:568}],
  ['safari-ipad',webkit,{width:820,height:1180}],
  ['safari-ipad-landscape',webkit,{width:1180,height:820}]
 ])await run(engine,label,viewport);
})().catch(e=>{console.error(e);process.exitCode=1});
