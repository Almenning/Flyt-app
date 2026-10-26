'use strict';
/* Regression: the approved October 10 art must never erase an existing
 * checkpoint, alter its original node ID, or remove the ability to replay.
 * Exercises and user progress remain owned by the existing journey engine.
 */
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const seed={
 version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'ProgresjonQA',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
 masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
 lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null
};
const titles={norwegian:'Bokskogen',math:'Tallvika',english:'Ordlandsbyen',geography:'Nordlysleiren'};
async function verify(engine,label,viewport){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport,isMobile:viewport.width<600,hasTouch:true,serviceWorkers:'block'});
  await context.addInitScript(value=>{
   if(!localStorage.getItem('laerlittmer-v2'))
    localStorage.setItem('laerlittmer-v2',JSON.stringify(value));
  },seed);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.route('https://raw.githubusercontent.com/**',route=>route.abort());
  await page.route('https://api.worldbank.org/**',route=>route.abort());
  const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
  await page.goto(url+'&locked-persistence='+label,{waitUntil:'domcontentloaded'});
  await page.locator('.bc14-subject[data-camp="subject-norwegian"]').waitFor({timeout:16000});
  // Use REAL, original checkpoint IDs. Never introduce invented records.
  const marked=await page.evaluate(()=>{
   const result={};
   for(const subject of ['norwegian','math','english','geography']){
    const model=subject==='geography'?geoJourneyModel(2):journeyModel(subject,2);
    const checkpoint=model.nodes.find(n=>n.type==='checkpoint');
    if(!checkpoint)throw Error('No original checkpoint in '+subject);
    const key=journeyNodeKey(subject,2,checkpoint.id);
    state.journey.nodes[key]={attempts:1,passed:true,best:5};
    result[subject]={key,id:checkpoint.id};
   }
   saveState();return result;
  });
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2')).journey.nodes);
  assert.equal(Object.keys(before).length,4,label+' must have four original checkpoints');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.bc14-subject[data-camp="subject-norwegian"]').waitFor({timeout:16000});
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2')).journey.nodes),before,
   label+' original progress changed on reload');
  for(const [subject,title] of Object.entries(titles)){
   const screen=subject==='geography'?'geography':'subject';
   await page.locator('.bc14-subject[data-camp="subject-'+subject+'"]').click();
    if(subject==='norwegian'){
      await page.locator('#eggenipa-world:visible').waitFor({timeout:16000});
      await page.locator('#eggenipa-world .eg-portal[data-eg="map"]').click();
    }
   if(subject==='math'){
     const tv=page.locator('#subject-screen.active #tallvika-world');
     await tv.waitFor({state:'visible',timeout:16000});
     assert.equal(await tv.locator('.tv-hotspot').count(),3,label+' Tallvika activity entries');
     const old=await page.evaluate(id=>({
       checkpoint:state.journey.nodes[journeyNodeKey('math',2,id)],
       progress:journeyProgress('math',2),
       next:journeyRecommendedNode('math',2)?.id
     }),marked.math.id);
     assert.equal(old.checkpoint?.passed,true,label+' saved Math checkpoint missing');
     assert.ok(old.progress.total>0&&old.next,label+' original Math progress unavailable');
     assert.equal(await tv.locator('[data-tv="next"]').isEnabled(),true);
     await tv.locator('[data-tv="back"]').click();
     await page.locator('#home-screen.active').waitFor({timeout:16000});
     continue;
   }
   const root=page.locator('#'+screen+'-screen.active .locked-journey-map');
   await root.waitFor({timeout:16000});
   await page.waitForFunction(s=>{
    const image=document.querySelector('.screen.active .locked-journey-image');
    return image?.complete&&image.naturalWidth===941&&
      document.querySelector('.screen.active .locked-journey-map')?.dataset.journeySubject===s;
   },subject,{timeout:16000});
   assert.match(await root.locator('.locked-journey-live-progress').innerText(),/1\s*\/\s*\d+/,
    label+' '+title+' has lost previously completed progress');
   const counts=await root.locator('.locked-journey-milestones[role="progressbar"]').evaluate(el=>({
    done:Number(el.getAttribute('aria-valuenow')),total:Number(el.getAttribute('aria-valuemax'))
   }));
   assert.equal(counts.done,1,label+' '+title+' old checkpoint not counted');
   assert.ok(counts.total>0,label+' '+title+' invalid total');
   assert.equal(await root.locator('.locked-journey-hotspot').count(),5);
   let replayable=false;
   for(let i=0;i<5;i++){
    const hotspot=root.locator('.locked-journey-hotspot').nth(i);
    // The persisted-checkpoint assertion is about the existing mission
    // sheet, not Playwright's synthetic auto-scroll through a tall portrait
    // map.  WebKit can otherwise finish a scroll after the pointer sequence
    // and leave this test waiting for a close button that was never opened.
    await hotspot.scrollIntoViewIfNeeded();
    await hotspot.click({force:true});
    const overlay=page.locator('.locked-journey-overlay:not([hidden])');
    await overlay.waitFor({state:'visible',timeout:5000});
    const item=page.locator('.locked-journey-overlay:not([hidden]) [data-locked-node="'+marked[subject].id+'"]');
    if(await item.count()){
     assert.equal(await item.isEnabled(),true,label+' '+title+' completed checkpoint was locked');
     assert.match(await item.innerText(),/Spill igjen/,
       label+' '+title+' old checkpoint no longer offered voluntary replay');
     const beforeReplay=await page.evaluate(()=>JSON.stringify(state.journey.nodes));
     // Validate that the enabled replay button REALLY launches the exact
     // persisted checkpoint and grade, not merely a changed text label.
     await page.evaluate(()=>{
      window.__replayedCheckpoint=null;
      window.startJourneyNode=(...args)=>{window.__replayedCheckpoint={kind:'subject',args}};
      window.startGeoJourneyNode=(...args)=>{window.__replayedCheckpoint={kind:'geo',args}};
     });
     await item.click();
     const launch=await page.evaluate(()=>window.__replayedCheckpoint);
     assert.deepEqual(launch?.args,subject==='geography'?[marked[subject].id,2]:
       [subject,marked[subject].id,2],
       label+' '+title+' completed checkpoint replay routed to wrong lesson');
     assert.equal(await overlay.isVisible(),false,
       label+' '+title+' overlay stayed open after replay launch');
     assert.equal(await page.evaluate(()=>JSON.stringify(state.journey.nodes)),beforeReplay,
       label+' '+title+' opening repeat mutated learning evidence');
     replayable=true;
     break;
    }
    await overlay.locator('.locked-sheet-close').click();
   }
   assert(replayable,label+' '+title+' lost checkpoint ID '+marked[subject].id);
   await root.locator('.locked-journey-back').click();
   if(subject==='norwegian'){
     // Preserve saved checkpoint data through Bokskogen -> Eggenipa -> Home.
     await page.locator('#eggenipa-world:visible').waitFor({timeout:16000});
     await page.locator('#eggenipa-world [data-eg="home"]').click();
   }
   await page.locator('#home-screen.active').waitFor({timeout:16000});
  }
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2')).journey.nodes),before,
   label+' journey navigation altered saved child progress');
  assert.deepEqual(errors,[],label+' runtime errors');
  console.log('[locked real-PNG persistence]',label,'four checkpoints, three original maps plus Tallvika, replay and reload OK');
  await context.close();
 }finally{await browser.close();}
}
(async()=>{
 await verify(chromium,'chromium-iphone',{width:390,height:844});
 await verify(webkit,'webkit-ipad-landscape',{width:1180,height:820});
})().catch(err=>{console.error(err);process.exitCode=1});
