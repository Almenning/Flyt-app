'use strict';
/* Exact-head iPhone/iPad Safari and Chromium proof for Læria Home.
   v15 owns approved phone portrait + landscape. Tablet portrait deliberately
   stays on the proven v14 composition until a dedicated portrait master exists. */
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
const rect=async locator=>{
 const b=await locator.boundingBox();
 assert(b,'missing bounding box for '+await locator.getAttribute('class'));
 return {x:b.x,y:b.y,width:b.width,height:b.height,right:b.x+b.width,bottom:b.y+b.height};
};
function expectsV15(viewport){
 return (viewport.width<=700&&viewport.height>viewport.width)||(viewport.width>viewport.height);
}
async function waitHome(page,v15,label){
 await page.locator('#home-screen.active .bc12').waitFor({timeout:16000});
 if(v15){
  await page.locator('#home-screen.active .bc12.bc15-locked-home').waitFor({timeout:16000});
  assert.equal(await page.locator('.bc12').getAttribute('data-bc15-asset'),'ready',label+' locked master did not activate');
 }else{
  await page.waitForFunction(()=>document.querySelector('#home-screen.active .bc12')?.dataset.bc15Asset==='unsupported-portrait',{timeout:16000});
 }
}
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
  await page.goto((process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria')+'&home-v15='+label,{waitUntil:'domcontentloaded'});

  const v15=expectsV15(viewport);
  await waitHome(page,v15,label);

  assert.equal(await page.locator('.bc14-subject').count(),4,label+' must retain four real subject gateways');
  const names=await page.locator('.bc14-subject-copy strong').allTextContents();
  assert.deepEqual(names,['Norsk','Matte','Engelsk','Geografi'],label+' subject order');
  assert.equal(await page.locator('.bc12-place:visible').count(),0,label+' old activity signs must not compete with Home');
  assert.equal(await page.locator('.bc14-subject-scene>svg').count(),4,label+' subject gateways must retain their semantic illustrated content');
  await page.waitForTimeout(100);
  assert.equal(requests.some(u=>/(?:matte|engelsk|geografi|bokskogen)-verden\.png/.test(u)),false,label+' loaded huge chapter artwork on Home');

  if(v15){
   const expectedMaster=viewport.width<=700?'phone':'tablet';
   assert.equal(await page.locator('.bc12').getAttribute('data-bc15-master'),expectedMaster,label+' wrong locked master');
   const bg=await page.locator('.bc12').evaluate(el=>getComputedStyle(el).backgroundImage);
   assert.match(bg,new RegExp('kjosnes-home-'+expectedMaster+'\\.webp'),label+' wrong background master '+bg);
   assert.equal(await page.locator('.bc12-heading').isVisible(),false,label+' live v14 heading must not compete with locked master');
   assert.equal(await page.locator('.bc14-free').isVisible(),false,label+' duplicate free-play CTA must stay hidden in locked v15');
   assert.equal(await page.locator('.bc12-journey').isVisible(),true,label+' journey hit target missing');
   assert.equal(await page.locator('.bc12-nav [data-camp="explore"]').isVisible(),true,label+' Explore navigation hit target missing');
   assert.equal(await page.locator('.bc12-nav [data-camp="collection"]').isVisible(),true,label+' collection navigation hit target missing');
   assert.equal(await page.locator('.bc12-nav [data-camp="wardrobe"]').getAttribute('aria-label'),'Mine troll',label+' troll navigation accessible label');

   const cards=[];
   for(const el of await page.locator('.bc14-subject').all())cards.push(await rect(el));
   const host=await rect(page.locator('#home-screen.active .bc12'));
   const journey=await rect(page.locator('.bc12-journey'));
   const nav=await rect(page.locator('.bc12-nav'));
   const scroll=await page.evaluate(()=>document.documentElement.scrollWidth);
   const master=expectedMaster==='phone'
     ? {ratio:280/580,subjects:{left:.044,top:.728},journey:{left:.052,top:.620}}
     : {ratio:760/459,subjects:{left:.353,top:.692},journey:{left:.028,top:.747}};
   const near=(actual,expected,tolerance=4)=>Math.abs(actual-expected)<=tolerance;
   assert(Math.abs(host.width/host.height-master.ratio)<.006,
     label+' locked master aspect ratio changed '+JSON.stringify(host));
   assert(near(cards[0].x,host.x+host.width*master.subjects.left),
     label+' first subject hit area drifted from locked artwork '+JSON.stringify({host,first:cards[0]}));
   assert(near(cards[0].y,host.y+host.height*master.subjects.top),
     label+' subject row drifted vertically from locked artwork '+JSON.stringify({host,first:cards[0]}));
   assert(near(journey.x,host.x+host.width*master.journey.left),
     label+' journey hit area drifted from visible button '+JSON.stringify({host,journey}));
   assert(near(journey.y,host.y+host.height*master.journey.top),
     label+' journey hit area drifted vertically from visible button '+JSON.stringify({host,journey}));
   assert(scroll<=viewport.width+1,label+' horizontal overflow');
   assert(cards.every(r=>r.width>=44&&r.height>=44&&r.x>=-1&&r.right<=viewport.width+1),label+' clipped/tiny v15 subject target '+JSON.stringify(cards));
   assert(journey.width>=44&&journey.height>=44,label+' v15 journey target too small '+JSON.stringify(journey));
   assert(nav.width>=180&&nav.height>=44,label+' v15 nav target area too small '+JSON.stringify(nav));
  }else{
   assert.equal((await page.locator('.bc12-heading h1').innerText()).trim(),'Hei, Testbarn!');
   assert.equal(await page.locator('.bc14-free').isVisible(),true,label+' v14 fallback free play entry is missing');
   assert.equal(await page.locator('.bc12-journey').isVisible(),true,label+' v14 fallback continue journey is missing');
   assert.equal((await page.locator('.bc12-journey [data-camp-next]').innerText()).trim(),'Leselyset',label+' fallback Home must point to first Bokskogen landmark');
   const positions=await page.evaluate(()=>{
    const r=s=>{const {x,y,width,height,bottom,right}=document.querySelector(s).getBoundingClientRect();return {x,y,width,height,bottom,right}};
    return {cards:[...document.querySelectorAll('.bc14-subject')].map(e=>{const {x,y,width,height,bottom,right}=e.getBoundingClientRect();return {x,y,width,height,bottom,right}}),
     header:r('.bc12-heading'),nav:r('.bc12-nav'),journey:r('.bc12-journey'),free:r('.bc14-free'),
     quest:document.querySelector('.bc12-quest')&&getComputedStyle(document.querySelector('.bc12-quest')).display!=='none'?r('.bc12-quest'):null,
     scroll:document.documentElement.scrollWidth,viewport:innerWidth};
   });
   assert(positions.scroll<=positions.viewport+1,label+' horizontal overflow '+JSON.stringify(positions));
   assert(positions.cards.every(r=>r.width>=80&&r.height>=80&&r.x>=0&&r.right<=viewport.width+1),label+' clipped subject card '+JSON.stringify(positions));
   assert(positions.cards.every(r=>r.y>=positions.header.bottom-7),label+' subject cards overlap the welcome heading '+JSON.stringify(positions));
   assert(positions.cards.every(r=>r.bottom<=positions.journey.y+6),label+' journey obscures subject cards '+JSON.stringify(positions));
   assert(positions.journey.bottom<=positions.nav.y+5,label+' primary journey blocked by bottom navigation '+JSON.stringify(positions));
   assert(positions.free.bottom<=positions.nav.y+5,label+' Explore blocked by bottom navigation '+JSON.stringify(positions));
   if(positions.quest)assert(positions.quest.bottom<=positions.nav.y+3,label+' fox letter hidden behind bottom navigation '+JSON.stringify(positions));
  }

  await page.screenshot({path:folder+'/'+label+'-home.png',fullPage:true});

  for(const [subject,screen] of [['norwegian','subject'],['math','subject'],['english','subject'],['geography','geography']]){
   await page.locator('.bc14-subject[data-camp="subject-'+subject+'"]').click();
   await page.locator('#'+screen+'-screen.active').waitFor({timeout:13000});
   const back=page.locator('#'+screen+'-screen.active .locked-journey-map[data-journey-subject="'+subject+'"] .locked-journey-back');
   await back.waitFor({state:'visible',timeout:16000});
   await back.click();
   await page.locator('#home-screen.active').waitFor({timeout:12000});
   await waitHome(page,v15,label+' return '+subject);
  }

  assert.equal((await page.locator('.bc12-place[data-camp="multiply"] .bc12-sign').textContent()).trim(),'Gangemagi',label+' stale Home activity name');
  assert.match(await page.locator('.bc12-place[data-camp="multiply"]').getAttribute('aria-label'),/^Gangemagi/,label+' stale Home aria-label');

  const exploreEntry=v15?page.locator('.bc12-nav [data-camp="explore"]'):page.locator('.bc14-free');
  await exploreEntry.click();
  await page.locator('.bc13-panel:not([hidden]) [data-bc13-action="globe"]').waitFor({timeout:12000});
  assert.equal(await page.locator('.bc13-card:visible').count(),5,label+' free play must include all five equal-status destinations');
  const gangemagiEntry=page.locator('.bc13-card[data-bc13-action="multiply"]');
  assert.equal((await gangemagiEntry.locator('.bc13-card-copy strong').textContent()).trim(),'Gangemagi',label+' Explore card still says Gangetabell');
  assert.match(await gangemagiEntry.getAttribute('aria-label'),/^Gangemagi/,label+' stale Explore accessible name');
  await page.locator('.bc13-close').click();
  await waitHome(page,v15,label+' after Explore');

  assert.deepEqual(errors,[],label+' page errors '+JSON.stringify(errors));
  console.log('[home acceptance]',label,JSON.stringify(viewport),v15?'locked v15':'v14 portrait fallback','subjects, travel, Explore and returns OK');
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
