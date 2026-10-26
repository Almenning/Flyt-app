'use strict';
/* Journey mission menu: before/after completion, correct continuation and
   the SAME selected fox. Four approved subjects, real app and real assets. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'..');
const seed={
  version:7,progressSchemaVersion:3,
  profile:{grade:2,onboarded:true,name:'ReiseQA',avatar:'girl',setupVersion:2},
  mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
  masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
  lastMilestone:null,recentCountryWin:null,lastActivity:null,
  journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null
};
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8',
  '.js':'application/javascript; charset=utf-8','.png':'image/png','.webp':'image/webp',
  '.svg':'image/svg+xml','.json':'application/json'};
function server(){
 return new Promise((resolve,reject)=>{
  const app=http.createServer((req,res)=>{
   let uri=new URL(req.url,'http://localhost').pathname;
   if(uri.endsWith('/'))uri+='index.html';
   const filename=path.resolve(root,'.'+decodeURIComponent(uri));
   if(!filename.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
   fs.readFile(filename,(err,bytes)=>{
    if(err){res.writeHead(404);res.end('Missing');return}
    res.setHeader('Content-Type',mime[path.extname(filename)]||'application/octet-stream');
    res.setHeader('Cache-Control','no-store');res.end(bytes);
   });
  });
  app.once('error',reject);
  app.listen(0,'127.0.0.1',()=>resolve({app,url:'http://127.0.0.1:'+app.address().port+'/laer-litt-mer/?app=laria'}));
 });
}
async function run(engine,label,viewport,url){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 try{
  // A wide viewport can still be an iPhone rotated to landscape.
  // Use device identity, not width, for WebKit mobile viewport emulation.
  const context=await browser.newContext({viewport,hasTouch:true,
   isMobile:label.includes('iphone'),reducedMotion:'reduce',serviceWorkers:'block'});
  // Seed only a new profile. A reload must read progress saved by the app.
  await context.addInitScript(s=>{
   if(!localStorage.getItem('laerlittmer-v2'))
     localStorage.setItem('laerlittmer-v2',JSON.stringify(s));
  },seed);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  await page.goto(url+'&premium-mission='+label,{waitUntil:'domcontentloaded'});
  await page.locator('.bc14-subject[data-camp="subject-norwegian"]').waitFor({timeout:20000});
  for(const subject of ['norwegian','math','english','geography']){
   await page.locator('.bc14-subject[data-camp="subject-'+subject+'"]').click();
   if(subject==='norwegian'){
     // The retired map is not part of the child's Norsk route. The reading
     // engine must run while the historical node IDs stay untouched.
     const eg=page.locator('#eggenipa-world:visible');
     await eg.waitFor({timeout:16000});
     assert.deepEqual(await eg.locator('.eg-portal').evaluateAll(a=>a.map(n=>n.dataset.eg)),
       ['words','find','reading'],label+' Norwegian free-choice activities are missing');
     assert.equal(await page.locator('#subject-screen.active .locked-journey-map:visible').count(),0,
       label+' retired Bokskogen map unexpectedly visible');
     const original=await page.evaluate(()=>({
       journey:JSON.stringify(state.journey),avatar:state.profile.avatar,grade:state.profile.grade
     }));
     await eg.locator('.eg-portal[data-eg="reading"]').click();
     await page.locator('#session-screen.active .laria-task-card').waitFor({timeout:14000});
     assert.equal(await page.evaluate(()=>sessionScope?.subject),'norwegian');
     assert.equal(await page.evaluate(()=>sessionScope?.module),'reading');
     assert.ok(await page.evaluate(()=>sessionQuestions[qIndex]?.prompt),label+' reading task missing');
     assert.equal(await page.locator('#session-screen.active .task-fox-companion').count(),0,
       label+' legacy Norwegian fox appears in reading activity');
     assert.equal(await page.locator('#session-screen.active .task-norsk-guide').count(),1,
       label+' Norwegian hint guide missing');
     if(process.env.MISSION_QA_SCREENSHOTS&&['webkit-iphone','webkit-ipad-landscape'].includes(label)){
       fs.mkdirSync(process.env.MISSION_QA_SCREENSHOTS,{recursive:true});
       await page.screenshot({path:path.join(process.env.MISSION_QA_SCREENSHOTS,label+'-norwegian-reading.png'),animations:'disabled'});
     }
     await page.locator('#close-session').click();
     await eg.waitFor({timeout:14000});
     assert.equal(await page.evaluate(()=>JSON.stringify(state.journey)),original.journey,
       label+' reading incorrectly changed old journey data');
     await eg.locator('[data-eg="home"]').click();
     await page.reload({waitUntil:'domcontentloaded'});
     assert.equal(await page.evaluate(()=>state.profile.avatar),original.avatar,
       label+' saved avatar changed with Norsk redesign');
     assert.equal(await page.evaluate(()=>state.profile.grade),original.grade,
       label+' grade changed with Norsk redesign');
     assert.equal(await page.evaluate(()=>JSON.stringify(state.journey)),original.journey,
       label+' historical node progress was lost after reload');
     continue;
   }
   if(subject==='math'){
     const tv=page.locator('#subject-screen.active #tallvika-world');
     await tv.waitFor({state:'visible',timeout:16000});
     const before=await page.evaluate(()=>JSON.stringify(state.journey));
     const next=await page.evaluate(()=>journeyRecommendedNode('math',2)?.id);
     assert.ok(next,label+' original Math node missing');
     await tv.locator('[data-tv="next"]').click();
     await page.locator('#session-screen.active').waitFor({timeout:14000});
     assert.equal(await page.evaluate(()=>sessionScope.journeyNode),next,label+' Math route changed original node');
     await page.locator('#close-session').click();
     await tv.waitFor({state:'visible',timeout:12000});
     assert.equal(await page.evaluate(()=>JSON.stringify(state.journey)),before,label+' opening mission changed progress');
     await tv.locator('[data-tv="back"]').click();
     await page.locator('#home-screen.active .bc14-subject').first().waitFor({timeout:12000});
     continue;
   }
   const map=page.locator('#'+(subject==='geography'?'geography':'subject')+'-screen.active .locked-journey-map[data-journey-subject="'+subject+'"]');
   await map.waitFor({timeout:14000});
   const firstStop=map.locator('.locked-journey-hotspot').first();
   await firstStop.click();
   const sheet=page.locator('.locked-journey-overlay:not([hidden]) .locked-journey-sheet.is-mission');
   await sheet.waitFor({timeout:8000});
   assert.equal(await sheet.locator('.mission-fox-stage .locked-journey-traveler').count(),1,label+' '+subject+' menu lost personal fox');
   // Primary action stays reachable without hunting through secondary activities.
   const metrics=await sheet.evaluate((el)=>{
     const root=el.getBoundingClientRect();
     const btn=el.querySelector('.mission-primary')?.getBoundingClientRect();
     const close=el.querySelector('.locked-sheet-close')?.getBoundingClientRect();
     return {width:root.width,viewport:innerWidth,left:root.left,right:root.right,
       primary:btn&&{width:btn.width,height:btn.height,left:btn.left,right:btn.right},
       close:close&&{width:close.width,height:close.height}};
   });
   assert(metrics.left>=-1&&metrics.right<=metrics.viewport+1,label+' '+subject+' sheet overflows phone width');
   assert(metrics.primary?.height>=44&&metrics.primary?.left>=-1&&metrics.primary?.right<=metrics.viewport+1,
     label+' '+subject+' primary action clipped or too small');
   // The main action must be within the first visible panel, not hidden below a scroll.
   const firstFold=await sheet.evaluate(el=>{
     const panel=el.getBoundingClientRect(),action=el.querySelector('.mission-primary')?.getBoundingClientRect();
     return Boolean(action&&action.top>=panel.top-1&&action.bottom<=panel.bottom+1);
   });
   assert(firstFold,label+' '+subject+' main mission is hidden below the first panel');
   assert(metrics.close?.height>=44&&metrics.close?.width>=44,label+' '+subject+' close target is too small');
   assert.equal(await map.locator('.locked-journey-traveler').count(),1,label+' '+subject+' cloned the personal fox');
   assert.equal(await sheet.locator('.mission-fox-stage .locked-journey-traveler').getAttribute('data-avatar'),'girl',
     label+' '+subject+' selected avatar changed');
   // The same DOM fox must also have visible, actual illustrated art.
   const liveArt=sheet.locator('.mission-fox-stage .laria-fox-wardrobe-placed');
   await liveArt.waitFor({state:'visible',timeout:5000});
   const visibleFox=await liveArt.evaluate(el=>{
     const box=el.getBoundingClientRect(),style=getComputedStyle(el);
     return box.width>20&&box.height>20&&style.visibility!=='hidden'&&style.display!=='none'&&Number(style.opacity)>0;
   });
   assert(visibleFox,label+' '+subject+' personalized fox artwork did not render');
   if(process.env.MISSION_QA_SCREENSHOTS&&['webkit-iphone','webkit-ipad-landscape'].includes(label)){
     fs.mkdirSync(process.env.MISSION_QA_SCREENSHOTS,{recursive:true});
     await page.screenshot({path:path.join(process.env.MISSION_QA_SCREENSHOTS,label+'-'+subject+'-before.png'),animations:'disabled'});
   }
   const overlayBefore=await page.evaluate(()=>JSON.stringify(state.journey));
   assert.equal(await sheet.locator('.mission-complete').count(),0,label+' '+subject+' falsely rewarded unfinished step');
   const main=sheet.locator('.mission-primary[data-locked-node]');
   assert.equal(await main.count(),1,label+' '+subject+' must have one clear primary mission');
   const mainId=await main.getAttribute('data-locked-node');
   const expected=await page.evaluate(({subject,mainId})=>{
    const model=subject==='geography'?geoJourneyModel(2):journeyModel(subject,2);
    return model.nodes.some(n=>n.id===mainId&&['skill','geo-skill','checkpoint'].includes(n.type));
   },{subject,mainId});
   assert(expected,label+' '+subject+' primary button is not a real core mission');
   assert.equal(await page.evaluate(()=>JSON.stringify(state.journey)),overlayBefore,
      label+' '+subject+' opening menu wrote journey progress');
   // Preserve original exercise route, with an explicit stub to prevent
   // affecting learning during this navigation-only test.
   await page.evaluate(()=>{
    window.__premiumMissionLaunch=null;
    window.startJourneyNode=(...args)=>{window.__premiumMissionLaunch={kind:'subject',args}};
    window.startGeoJourneyNode=(...args)=>{window.__premiumMissionLaunch={kind:'geo',args}};
   });
   await main.click();
   const launch=await page.evaluate(()=>window.__premiumMissionLaunch);
   assert.deepEqual(launch?.args,subject==='geography'?[mainId,2]:[subject,mainId,2],
     label+' '+subject+' broke original mission routing');
   assert.equal(await map.locator('.locked-journey-board > .locked-journey-traveler').count(),1,
     label+' '+subject+' failed to restore fox after launching lesson');
   assert.equal(await page.locator('.locked-journey-overlay:not([hidden])').count(),0,
     label+' '+subject+' mission sheet stayed open after launch');

   // Simulate actual persisted completion via the existing journey node store.
   // No new progress system, rewards or synthetic node IDs are introduced.
   const completion=await page.evaluate(subject=>{
    const geo=subject==='geography';
    const model=geo?geoJourneyModel(2):journeyModel(subject,2);
    const progress=geo?geoJourneyProgress(2):journeyProgress(subject,2);
    const rec=geo?geoJourneyRecommendedNode(2):journeyRecommendedNode(subject,2);
    const places=LARIA_LOCKED_JOURNEYS.build(subject,model,
      n=>geo?geoJourneyNodeState(n):journeyNodeState(n),rec?.id).places;
    const core=places[0].nodes.filter(n=>['skill','geo-skill','checkpoint'].includes(n.type));
    if(core.length===0)throw Error('first landmark must contain original core mission');
    for(const item of core){
      state.journey.nodes[journeyNodeKey(subject,2,item.id)]={
        passed:true,attempts:2,best:5,lastAt:Date.now(),passedAt:Date.now()};
    }
    saveState();
    if(geo)renderGeoJourney();else renderSubjectJourney();
    return {doneIds:core.map(n=>n.id),stage:progress.done};
   },subject);
   assert(completion.doneIds.length>0,label+' '+subject+' no mission to complete');
   // The original persisted progress must survive a real reload, not just a rerender.
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('.bc14-subject[data-camp="subject-'+subject+'"]').waitFor({timeout:20000});
   await page.locator('.bc14-subject[data-camp="subject-'+subject+'"]').click();
   const afterReload=page.locator('#'+(subject==='geography'?'geography':'subject')+'-screen.active .locked-journey-map[data-journey-subject="'+subject+'"]');
   await afterReload.waitFor({timeout:14000});
   await afterReload.locator('.locked-journey-hotspot').first().click();
   const completed=page.locator('.locked-journey-overlay:not([hidden]) .locked-journey-sheet.is-mission');
   await completed.waitFor({timeout:8000});
   assert.equal(await completed.locator('.mission-complete').count(),1,label+' '+subject+' no completion celebration');
   if(process.env.MISSION_QA_SCREENSHOTS&&['webkit-iphone','webkit-ipad-landscape'].includes(label)){
     await page.screenshot({path:path.join(process.env.MISSION_QA_SCREENSHOTS,label+'-'+subject+'-after.png'),animations:'disabled'});
   }
   assert.match(await completed.locator('.mission-complete').innerText(),/Du klarte oppdraget|Hele reisen er fullført/);
   assert.equal(await completed.locator('.mission-fox-stage .locked-journey-traveler').count(),1,
    label+' '+subject+' lost selected fox after completion');
   const replayedIds=await completed.locator('button.mission-activity.is-replay[data-locked-node]').evaluateAll(
      buttons=>buttons.map(button=>button.dataset.lockedNode));
   assert.deepEqual([...new Set(replayedIds)].sort(),[...completion.doneIds].sort(),
      label+' '+subject+' completed missions are missing or duplicated');
   const next=completed.locator('[data-locked-continue]');
   if(await next.count()){
     const nextIndex=Number(await next.getAttribute('data-locked-continue'));
     assert(nextIndex>0&&nextIndex<5,label+' '+subject+' invalid next painted place');
     await next.click();
     assert.equal((await page.locator('.locked-journey-overlay:not([hidden]) .locked-journey-sheet h2').innerText()).trim(),
       LARIA_NAMES[subject][nextIndex],label+' '+subject+' continue opened wrong place');
     assert.equal(await afterReload.locator('.locked-journey-traveler').count(),1,
       label+' '+subject+' continue duplicated selected fox');
   }else{
     assert.equal(await completed.locator('[data-locked-map]').count(),1,
       label+' '+subject+' missing graceful fallback when no next place is open');
   }
   await page.locator('.locked-sheet-close').click();
   assert.equal(await afterReload.locator('.locked-journey-board > .locked-journey-traveler').count(),1,
      label+' '+subject+' fox was not returned to the illustrated map');
   await afterReload.locator('.locked-journey-back').click();
   await page.locator('#home-screen.active .bc14-subject').first().waitFor({timeout:12000});
  }
  assert.deepEqual(errors,[],label+' javascript exceptions');
  console.log('PASS journey premium mission menus',label,viewport);
  await context.close();
 }finally{await browser.close()}
}
const LARIA_NAMES={
 norwegian:['Leselyset','Ordverkstedet','Historiehytta','Setningsbroen','Fortellingstårnet'],
 math:['Tallverkstedet','Formfabrikken','Brøklaben','Målebroen','Problemtårnet'],
 english:['Startplassen','Ordhandelen','Grammatikkhuset','Snakkekaféen','Fortellingsslottet'],
 geography:['Basecamp','Kartkroken','Utforskertårnet','Naturstien','Observatoriet']
};
(async()=>{
 const {app,url}=await server();
 try{
  for(const [engine,label,viewport] of [
   [webkit,'webkit-iphone', {width:390,height:844}],
   [webkit,'webkit-iphone-small', {width:320,height:640}],
   [webkit,'webkit-iphone-landscape', {width:844,height:390}],
   [webkit,'webkit-ipad-portrait', {width:820,height:1180}],
   [webkit,'webkit-ipad-landscape', {width:1180,height:820}],
   [chromium,'chromium-iphone', {width:390,height:844}]
  ])await run(engine,label,viewport,url);
 }finally{await new Promise(resolve=>app.close(resolve))}
})().catch(error=>{console.error(error);process.exitCode=1});
