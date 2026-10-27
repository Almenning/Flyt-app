'use strict';
// Integrated young journey smoke: the approved scene identity and task -> map return.
// Runs against the real app engine and the real approved PNGs.
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'ReiseQA',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},
 preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
const worlds={norwegian:'Eggenipa',math:'Tallvika',english:'Ordlandsbyen',geography:'Nordlysleiren'};
async function run(engine,label,viewport){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport,isMobile:viewport.width<600,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed);
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  await page.goto((process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria')+'&journey-ux='+label,{waitUntil:'domcontentloaded'});
  await page.locator('.bc14-subject[data-camp="subject-norwegian"]').waitFor({timeout:16000});
  for(const [subject,world] of Object.entries(worlds)){
   const screen=subject==='geography'?'geography':'subject';
   await page.locator('.bc14-subject[data-camp="subject-'+subject+'"]').click();
   if(subject==='norwegian'){
     await page.locator('#eggenipa-world:visible').waitFor({timeout:16000});
     assert.deepEqual(await page.locator('#eggenipa-world .eg-portal').evaluateAll(a=>a.map(x=>x.dataset.eg)),
       ['words','find','reading'],label+' Norsk did not open three direct activities');
     assert.equal(await page.locator('#subject-screen.active .locked-journey-map:visible').count(),0,
       label+' obsolete Bokskogen map is visible');
     const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2')).journey.nodes);
     await page.locator('#eggenipa-world .eg-portal[data-eg="reading"]').click();
     await page.locator('#session-screen.active .laria-task-card').waitFor({timeout:16000});
     const learning=await page.evaluate(()=>({subject:sessionScope?.subject,module:sessionScope?.module,
       question:sessionQuestions[qIndex]?.prompt}));
     assert.equal(learning.subject,'norwegian');
     assert.equal(learning.module,'reading');
     assert.ok(learning.question,label+' reading tasks are missing');
     assert.equal((await page.locator('.task-world-chip').textContent()).trim(),'Eggenipa');
     await page.locator('#close-session').click();
     await page.locator('#eggenipa-world:visible').waitFor({timeout:16000});
     assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2')).journey.nodes),before,
       label+' historical progress was reset');
     await page.locator('#eggenipa-world [data-eg="home"]').click();
     await page.locator('#home-screen.active .bc14-subject').first().waitFor({timeout:12000});
     continue;
   }
   if(subject==='math'){
     // The math journey data is still present, but children now enter Tallvika
     // directly and the old map remains intentionally hidden.
     const tv=page.locator('#subject-screen.active #tallvika-world');
     await tv.waitFor({state:'visible',timeout:16000});
     assert.equal(await tv.locator('.tv-hotspot').count(),3,label+' missing math houses');
     const next=tv.locator('[data-tv="next"]');
     assert.equal(await next.isEnabled(),true,label+' next math mission must remain reachable');
     await next.click();
     await page.locator('#session-screen.active .laria-task-card').waitFor({timeout:16000});
     const state=await page.evaluate(()=>({subject:sessionScope?.subject,question:sessionQuestions[qIndex]?.prompt}));
     assert.equal(state.subject,'math',label+' math learning engine lost');
     assert.ok(state.question,label+' missing math question');
     await page.locator('#close-session').click();
     await tv.waitFor({state:'visible',timeout:16000});
     await tv.locator('[data-tv="back"]').click();
     await page.locator('#home-screen.active .bc14-subject').first().waitFor({timeout:12000});
     continue;
   }
   if(subject==='english'){
     // Kinnaklova replaces the old Ordlandsbyen map as the child-facing
     // English entrance. The previous journey data and mission IDs remain
     // intact, but the map must no longer be a required screen in this QA.
     const ki=page.locator('#subject-screen.active #kinnaklova-world');
     await ki.waitFor({state:'visible',timeout:16000});
     assert.equal(await ki.locator('.ki-card').count(),3,label+' English direct activities missing');
     assert.equal(await page.locator('#subject-screen.locked-journey-active').count(),0,
       label+' English retained the retired map layout class');
     const before=await page.evaluate(()=>JSON.stringify(window.LARIA_TALLVIKA_BRIDGE.state().journey?.nodes||{}));
     assert.equal(await page.evaluate(()=>JSON.stringify(window.LARIA_TALLVIKA_BRIDGE.state().journey?.nodes||{})),before,
       label+' English landing must not mutate journey progress');
     await ki.locator('[data-ki="words"].ki-card').click();
     await page.locator('#session-screen.active .laria-task-card').waitFor({timeout:16000});
     const state=await page.evaluate(()=>({subject:sessionScope?.subject,module:sessionScope?.module,question:sessionQuestions[qIndex]?.prompt}));
     assert.equal(state.subject,'english',label+' English engine not reached');
     assert.equal(state.module,'words',label+' Wrong English module');
     assert.ok(state.question,label+' English question missing');
     await page.locator('#close-session').click();
     await ki.waitFor({state:'visible',timeout:16000});
     const back=ki.locator('.ki-utility [data-ki="home"]');
     if(await back.isVisible())await back.click();
     else await ki.locator('.ki-painted-home').click();
     await page.locator('#home-screen.active .bc14-subject').first().waitFor({timeout:12000});
     continue;
   }
   const root=page.locator('#'+screen+'-screen.active .locked-journey-map[data-journey-subject="'+subject+'"]');
   try{
     await root.waitFor({state:'visible',timeout:16000});
   }catch(error){
     const after=await page.evaluate(()=>{
       const screen=document.getElementById('subject-screen'),map=document.getElementById('journey-map');
       const section=document.getElementById('subject-journey-section'),eg=document.getElementById('eggenipa-world');
       const s=el=>el?{className:el.className,display:getComputedStyle(el).display,
         visibility:getComputedStyle(el).visibility,hidden:el.hidden,
         subject:el.dataset.journeySubject,waiting:el.dataset.journeyWaiting,
         box:[Math.round(el.getBoundingClientRect().width),Math.round(el.getBoundingClientRect().height)]}:null;
       return {screen:s(screen),map:s(map),section:s(section),eggenipa:s(eg),
         mapVisible:window.LARIA_EGGENIPA?.isMapOpen?.(),paintedBack:map?.querySelector('.locked-journey-back')?.getAttribute('aria-label')};
     });
     console.error('[NORSK_BOKSKOGEN_TIMEOUT]',label,JSON.stringify(after));
     throw error;
   }
   const currentStop=root.locator('.locked-journey-hotspot.state-current').first();
   // The painted board is revealed asynchronously.  A visible hotspot alone
   // is not enough: wait until its real tap handler has been installed, then
   // use Playwright's normal touch-capable click.  This keeps the test from
   // racing the iPad landscape artwork decode without bypassing user input.
   await currentStop.evaluate(node=>{
     if(typeof node.onclick!=='function')throw new Error('current journey stop is visible before it is interactive');
   });
   await currentStop.click();
   const mission=page.locator('.locked-journey-overlay:not([hidden]) button[data-locked-node]:not([disabled])').first();
   await mission.waitFor({timeout:10000});
   await mission.click();
   await page.locator('#session-screen.active .laria-task-card').waitFor({timeout:16000});
   assert.equal((await page.locator('.task-world-chip').innerText()).trim(),world,label+' wrong scene for '+subject);
   assert.equal((await page.locator('#close-session').getAttribute('aria-label')),'Tilbake til '+({norwegian:'Norsk',math:'Matte',english:'Engelsk',geography:'Geografi'}[subject]),label+' accessible back name must describe the real return destination');
   const sessionState=await page.evaluate(()=>({subject:sessionScope?.subject,scope:sessionScope?.type,question:sessionQuestions[qIndex]?.prompt}));
   assert.equal(sessionState.subject,subject,label+' journey engine lost '+subject);
   assert.ok(sessionState.question,label+' missing question for '+subject);
   await page.locator('#close-session').click();
   await root.waitFor({timeout:16000});
   assert.equal(await page.locator('#session-screen.active').count(),0,label+' task did not close');
   await root.locator('.locked-journey-back').click();
   await page.locator('#home-screen.active .bc14-subject').first().waitFor({timeout:12000});
  }
  assert.deepEqual(errors,[],label+' javascript exceptions');
  console.log('[journey integrated UX]',label,'Norsk and Geography maps, Tallvika and Kinnaklova direct worlds OK');
  await context.close();
 }finally{await browser.close()}
}
(async()=>{for(const [label,engine,viewport] of [
 ['chromium-iphone',chromium,{width:390,height:844}],
 ['webkit-iphone',webkit,{width:390,height:844}],
 ['webkit-ipad-landscape',webkit,{width:1180,height:820}]
])await run(engine,label,viewport)})().catch(e=>{console.error(e);process.exitCode=1});
