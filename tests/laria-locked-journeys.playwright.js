'use strict';
/* Geometry and interaction proof for the ORIGINAL Oct 10 image contract.
 * The SVG is a TEST-ONLY decoder stub, never shipped as app artwork.
 * Passing this test does NOT certify pixel parity with the approved PNGs.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const output=process.env.LOCKED_JOURNEY_QA||'/tmp/laria-locked-journey-geometry';
fs.mkdirSync(output,{recursive:true});
const seed={
 version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'KartQA',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},
 preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null
};
const expected={
 norwegian:['Leselyset','Ordverkstedet','Historiehytta','Setningsbroen','Fortellingstårnet'],
 math:['Tallverkstedet','Formfabrikken','Brøklaben','Målebroen','Problemtårnet'],
 english:['Startplassen','Ordhandelen','Grammatikkhuset','Snakkekaféen','Fortellingsslottet'],
 geography:['Basecamp','Kartkroken','Utforskertårnet','Naturstien','Observatoriet']
};
const mockImage='<svg xmlns="http://www.w3.org/2000/svg" width="941" height="1672" viewBox="0 0 941 1672"><rect width="941" height="1672" fill="#e0d5b9"/><rect x="30" y="30" width="881" height="1612" rx="15" fill="#badbd1"/><path d="M20 1620L900 250" stroke="#99754a" stroke-width="45"/></svg>';
async function run(engine,label,viewport){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 try{
  const ctx=await browser.newContext({viewport,isMobile:viewport.width<600,hasTouch:true,
    reducedMotion:'reduce',serviceWorkers:'block'});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(value=>{
    localStorage.setItem('laerlittmer-v2',JSON.stringify(value));
    window.LARIA_LOCKED_JOURNEY_QA_ART=true;
  },seed);
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  await page.route('**/locked-journeys/*-locked-20261010.png',r=>r.fulfill({
    status:200,contentType:'image/svg+xml',body:mockImage,headers:{'cache-control':'no-store'}}));
  const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
  await page.goto(url+'&locked-geometry='+label,{waitUntil:'domcontentloaded'});
  await page.locator('.bc14-subject[data-camp="subject-norwegian"]').waitFor({timeout:16000});
  for(const subject of Object.keys(expected)){
   const screen=subject==='geography'?'geography':'subject';
   await page.locator('.bc14-subject[data-camp="subject-'+subject+'"]').click();
   await page.locator('#'+screen+'-screen.active').waitFor({timeout:16000});
   await page.waitForFunction(s=>document.querySelector('.screen.active .locked-journey-map')?.dataset.journeySubject===s,subject,{timeout:16000});
   const base='#'+screen+'-screen.active .locked-journey-map';
   assert.equal(await page.locator(base+' .locked-journey-hotspot').count(),5,label+' '+subject+' landmark count');
   const bar=page.locator(base+' .locked-journey-milestones[role="progressbar"]');
   assert.equal(await bar.count(),1,label+' required lesson progression missing');
   const counts=await bar.evaluate(el=>({now:Number(el.getAttribute('aria-valuenow')),max:Number(el.getAttribute('aria-valuemax')),
     done:el.querySelectorAll('.is-done').length,current:el.querySelectorAll('.is-current').length}));
   assert.ok(counts.now>=0&&counts.max>0&&counts.now<=counts.max,label+' impossible progress numbers');
   assert.equal(counts.done,Math.floor(counts.now/counts.max*4+1e-9),label+' misleading milestone count');
   assert.equal(counts.current,counts.now===counts.max?0:1,label+' should mark active progress quartile');
   await page.waitForTimeout(240);
   const focused=await page.locator(base+' .locked-journey-hotspot.state-current').first().evaluate(el=>{
     const r=el.getBoundingClientRect();
     const board=el.closest('.locked-journey-board');
     return {centerY:r.y+r.height/2,viewport:innerHeight,boardHeight:board.getBoundingClientRect().height,
       touchAction:getComputedStyle(board).touchAction};
   });
   assert(focused.centerY>=0&&focused.centerY<=focused.viewport,
     label+' '+subject+' next place should be visible on entry '+JSON.stringify(focused));
   assert.notEqual(focused.touchAction,'none',label+' native page navigation/zoom was disabled');
   const names=await page.locator(base+' .locked-journey-hotspot').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('aria-label')));
   assert(names.every((s,i)=>s.includes(expected[subject][i])),label+' '+subject+' wrong painted places '+JSON.stringify(names));
   const geometry=await page.evaluate(()=>{
    const board=document.querySelector('.screen.active .locked-journey-board').getBoundingClientRect();
    const img=document.querySelector('.screen.active .locked-journey-image');
    const imageBox=img.getBoundingClientRect();
    return {ratio:board.width/board.height,imageRatio:imageBox.width/imageBox.height,
      w:board.width,h:board.height,natural:[img.naturalWidth,img.naturalHeight],
      hits:[...document.querySelectorAll('.screen.active .locked-journey-hotspot')].map(node=>{
        const r=node.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,boardX:r.x-board.x,boardY:r.y-board.y}
      }),overflow:document.documentElement.scrollWidth-innerWidth};
   });
   assert(Math.abs(geometry.ratio-941/1672)<.003,label+' '+subject+' artwork stretched '+JSON.stringify(geometry));
   assert(Math.abs(geometry.imageRatio-941/1672)<.003,label+' '+subject+' artwork cropped '+JSON.stringify(geometry));
   assert.deepEqual(geometry.natural,[941,1672],label+' art decoder');
   assert(geometry.overflow<=1,label+' '+subject+' horizontal overflow '+JSON.stringify(geometry));
   assert(geometry.hits.every(h=>h.w>=44&&h.h>=44&&h.boardX>=0&&h.boardY>=0&&h.boardX+h.w<=geometry.w+1&&h.boardY+h.h<=geometry.h+1),label+' '+subject+' touch targets invalid '+JSON.stringify(geometry));
   const before=await page.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('laerlittmer-v2')).journey));
   for(let i=0;i<5;i++){
    await page.locator(base+' .locked-journey-hotspot').nth(i).click();
    await page.locator('.locked-journey-overlay:not([hidden])').waitFor();
    assert.equal((await page.locator('.locked-journey-sheet h2').innerText()).trim(),expected[subject][i],label+' '+subject+' place '+i);
    await page.locator('.locked-sheet-close').click();
   }
   // Original engine already provides optional "Sniktitt" for future areas.
   // The locked illustration must retain that preview without fabricating
   // mastery, changing node IDs or activating ordinary lesson mode.
   await page.evaluate(()=>{
     window.__lockedPreview=null;
     window.startJourneyWorldPreview=(...args)=>{window.__lockedPreview={kind:'subject',args}};
     window.startGeoWorldPreview=(...args)=>{window.__lockedPreview={kind:'geo',args}};
   });
   const futureSpots=page.locator(base+' .locked-journey-hotspot.state-future');
   let checkedPreview=false;
   for(let k=0;k<await futureSpots.count();k++){
     await futureSpots.nth(k).click();
     const preview=page.locator('.locked-journey-overlay:not([hidden]) [data-locked-preview]');
     if(await preview.count()){
       await preview.click();
       const called=await page.evaluate(()=>window.__lockedPreview);
       assert(called?.args?.length===2+(subject!=='geography'?1:0),label+' original preview signature');
       assert.equal(called?.args?.at(-1),2,label+' sneak peek grade changed');
       assert.equal(called?.kind,subject==='geography'?'geo':'subject');
       checkedPreview=true;break;
     }
     await page.locator('.locked-sheet-close').click();
   }
   if(!checkedPreview)console.log('[locked preview] no future skill eligible at '+label+' '+subject);
   const after=await page.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('laerlittmer-v2')).journey));
   assert.equal(after,before,label+' map interactions and preview must not modify progress');
   await page.locator(base+' .locked-journey-options').click();
   assert.equal(await page.locator('.locked-journey-grade-grid button').count(),10,label+' grade selector still available');
   // Older children still get their EXISTING map, not art meant for grades 1–2.
   await page.locator('.locked-journey-grade-grid [data-locked-grade="3"]').click();
   await page.waitForFunction(s=>journeyViewGrade(s)===3&&!document.querySelector('.screen.active .locked-journey-map'),subject);
   assert.equal(await page.locator('#'+screen+'-screen.active').evaluate(el=>el.classList.contains('locked-journey-active')),false,label+' art class leaked into grade 3');
   await page.evaluate(s=>setJourneyViewGrade(s,2),subject);
   await page.waitForFunction(s=>journeyViewGrade(s)===2&&document.querySelector('.screen.active .locked-journey-map')?.dataset.journeySubject===s,subject);
   assert.equal(await page.locator(base+' .locked-journey-hotspot').count(),5,label+' reference map did not return after grade switch');
   if(subject==='math'){
     const savedBefore=await page.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('laerlittmer-v2')).journey));
     await page.locator(base+' .locked-journey-hotspot').nth(2).click();
     const existing=page.locator('.locked-journey-overlay:not([hidden]) [data-locked-existing="fraction-lab"]');
     await existing.waitFor({timeout:10000});
     await existing.click();
     await page.locator('#fraction-lab-screen.active').waitFor({timeout:12000});
     assert.equal(await page.locator('#fraction-lab-root .fr2-home-card[data-page]').count(),6,label+' the existing six-card premium Brøklaben must be preserved');
     await page.locator('#fraction-lab-root .fr2-home-grid .fr2-home-card[data-page="explore"]').click();
     await page.locator('#fraction-lab-root .fr2-explore').waitFor({timeout:12000});
     await page.locator('#fraction-lab-back').click();
     await page.locator('#fraction-lab-root .fr2-home').waitFor({timeout:12000});
     await page.locator('#fraction-lab-back').click();
     await page.locator('#subject-screen.active .locked-journey-map').waitFor({timeout:12000});
     const savedAfter=await page.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('laerlittmer-v2')).journey));
     assert.equal(savedAfter,savedBefore,label+' Brøklaben must not fabricate journey progress');
   }
   await page.evaluate(()=>{
    window.__lockedLaunch=null;
    window.startJourneyNode=(...args)=>{window.__lockedLaunch={kind:'subject',args}};
    window.startGeoJourneyNode=(...args)=>{window.__lockedLaunch={kind:'geo',args}};
   });
   await page.locator(base+' .locked-journey-hotspot').first().click();
   const firstAvailable=page.locator('.locked-journey-missions button[data-locked-node]:not([disabled])').first();
   await firstAvailable.waitFor({timeout:10000});
   const selectedId=await firstAvailable.getAttribute('data-locked-node');
   await firstAvailable.click();
   const launched=await page.evaluate(()=>window.__lockedLaunch);
   assert.deepEqual(launched?.args,subject==='geography'?[selectedId,2]:[subject,selectedId,2],label+' existing mission ID and grade must survive');
   await page.screenshot({path:output+'/'+label+'-'+subject+'-test-geometry.png',fullPage:true});
   await page.locator(base+' .locked-journey-back').click();
   await page.locator('#home-screen.active').waitFor({timeout:16000});
  }
  assert.deepEqual(errors,[],label+' page errors '+JSON.stringify(errors));
  console.log('[locked geometry]',label,JSON.stringify(viewport),'4 subjects, 20 spots, mission routing, progress persistence OK');
  await ctx.close();
 }finally{await browser.close()}
}
async function verifyProductionFallback(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await ctx.newPage(),originalRequests=[],errors=[];
  page.on('request',req=>{if(req.url().includes('/locked-journeys/')&&req.url().endsWith('.png'))originalRequests.push(req.url())});
  page.on('pageerror',err=>errors.push(err.message));
  await page.addInitScript(value=>localStorage.setItem('laerlittmer-v2',JSON.stringify(value)),seed);
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
  await page.goto(url+'&locked-fallback=1',{waitUntil:'domcontentloaded'});
  await page.locator('.bc14-subject[data-camp="subject-norwegian"]').waitFor({timeout:16000});
  for(const subject of Object.keys(expected)){
   const screen=subject==='geography'?'geography':'subject';
   await page.locator('.bc14-subject[data-camp="subject-'+subject+'"]').click();
   await page.locator('#'+screen+'-screen.active').waitFor({timeout:10000});
   assert.equal(await page.locator('#'+screen+'-screen.active .locked-journey-map').count(),0,'Unverified original art activated on '+subject);
   await page.locator('#'+screen+'-screen .bok-v10-home:visible, #'+screen+'-screen .premium-world-back:visible, #'+screen+'-back:visible').first().click();
   await page.locator('#home-screen.active').waitFor();
  }
  assert.deepEqual(originalRequests,[],'Unverified image requests produced 404 errors');
  assert.deepEqual(errors,[],'Production fallback raised JS runtime errors');
  await ctx.close();
  console.log('[locked fallback] 4 legacy worlds remain reachable with zero original-image requests');
 }finally{await browser.close()}
}
(async()=>{
 await verifyProductionFallback();
 for(const [label,engine,viewport] of [
  ['chromium-iphone-portrait',chromium,{width:390,height:844}],
  ['webkit-iphone-portrait',webkit,{width:390,height:844}],
  ['webkit-iphone-landscape',webkit,{width:667,height:375}],
  ['webkit-small-iphone',webkit,{width:320,height:568}],
  ['webkit-ipad-portrait',webkit,{width:820,height:1180}],
  ['webkit-ipad-landscape',webkit,{width:1180,height:820}]
 ])await run(engine,label,viewport);
})().catch(e=>{console.error(e);process.exitCode=1});
