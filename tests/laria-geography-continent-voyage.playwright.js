'use strict';
/* Real iPhone/iPad/desktop Geography chapter-2 exploration. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const base=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const shots=process.env.LARIA_GEO_CHAPTER2_SCREENSHOTS;
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'SjøfarerQA',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},
 preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{'geography:2:one':{best:4}},gradeWins:{'geography:2':{at:111}},viewGrades:{}},
 answerLog:[],sessionLog:[],activeSession:null};
async function photo(page,label){if(!shots)return;fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:path.join(shots,label+'.png'),animations:'disabled'})}
async function geography(page){
 const button=page.locator('.bc14-subject[data-camp="subject-geography"]');
 await button.waitFor({timeout:20000});await button.click();
 await page.locator('#geography-screen.active').waitFor({timeout:16000});
}
async function enter(page){
 await geography(page);
 const button=page.locator('[data-laria-geography-chapter2-preview="1"]');
 await button.waitFor({state:'attached'});
 assert.equal(await button.isVisible(),true,'gated Geography launcher hidden on real map page');
 await button.click();
 await page.locator('#laria-geo-continent-voyage-preview[role="dialog"]').waitFor();
 assert.equal(await page.locator('[data-cv-act="stage"]').count(),5);
}
async function assertAnswerInView(page){
 const feedback=await page.locator('.cv-feedback').boundingBox();
 const next=await page.locator('[data-cv-act="next"]').boundingBox();
 const viewportHeight=await page.evaluate(()=>window.innerHeight);
 assert.ok(feedback&&feedback.y>=-2&&feedback.y+feedback.height<=viewportHeight+2,
   'Geography feedback must be visible immediately on every test device');
 assert.ok(next&&next.y<viewportHeight-12&&next.y+next.height>12,
   'The next discovery must be reachable after a compass or stamp answer');
}
async function answer(page){
 const s=await page.evaluate(()=>window.LARIA_GEO_CONTINENT_VOYAGE.resume(state));
 assert.ok(s,'stage did not start');
 const b=page.locator('[data-cv-act="answer"][data-cv-answer="'+s.task.answer+'"]');
 await b.click();
 assert.equal(await page.locator('.cv-feedback').count(),1);
 assert.match(await page.locator('.cv-feedback').innerText(),/riktig vei/);
 await assertAnswerInView(page);
 await page.locator('[data-cv-act="next"]').click();
}
async function verify(type,label,viewport){
 const browser=await type.launch({headless:true,args:type===chromium?['--no-sandbox']:[]});
 try{
   const appleTouch=type===webkit;
   const ctx=await browser.newContext({viewport,isMobile:appleTouch,hasTouch:true,
     deviceScaleFactor:appleTouch?(viewport.width<=400?3:2):1,
     serviceWorkers:'block',reducedMotion:'reduce'});
   await ctx.addInitScript(value=>{
     if(!localStorage.getItem('laerlittmer-v2'))localStorage.setItem('laerlittmer-v2',JSON.stringify(value));
   },seed);
   const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
   await page.route('https://api.worldbank.org/**',r=>r.abort());
   await page.goto(base,{waitUntil:'domcontentloaded'});
   await geography(page);
   assert.equal(await page.locator('[data-laria-geography-chapter2-preview]').count(),0,
     label+' unflagged chapter visible');
   await page.goto(base+'&geography-chapter2-preview=1',{waitUntil:'domcontentloaded'});
   await enter(page);
   const returnButton=await page.locator('.cv-top [data-cv-act="close"]').evaluate(el=>{
     const box=el.getBoundingClientRect();
     return {height:box.height,width:box.width,whiteSpace:getComputedStyle(el).whiteSpace};
   });
   assert.equal(returnButton.whiteSpace,'nowrap',label+' back action must never wrap');
   assert.ok(returnButton.height>=44&&returnButton.height<=55,
     label+' back button must be a single 44px touch target: '+JSON.stringify(returnButton));
   assert.equal(await page.locator('.cv-map-art').getAttribute('data-cv-art-variant'),'default-v1',label+' normal preview must not switch artwork');
   const map=page.locator('.cv-story-map');
   await map.waitFor({state:'visible'});
   const geometry=await map.evaluate(el=>{
     const img=el.querySelector('.cv-map-art'),region=el.getBoundingClientRect();
     const stops=[...el.querySelectorAll('.cv-map-stop')].map(b=>{
       const r=b.getBoundingClientRect();
       return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};
     });
     return {loaded:img.complete&&img.naturalWidth===800&&img.naturalHeight===1000,
       region:{x:region.x,y:region.y,right:region.right,bottom:region.bottom},stops};
   });
   assert.equal(geometry.loaded,true,label+' illustrated fantasy voyage asset failed to load');
   assert.equal(geometry.stops.length,5,label+' must have five tactile illustrated stops');
   for(const [i,r] of geometry.stops.entries()){
     assert.ok(r.height>=44,label+' stop '+i+' too short for a child');
     assert.ok(r.x>=geometry.region.x-2&&r.right<=geometry.region.right+2&&
       r.y>=geometry.region.y-2&&r.bottom<=geometry.region.bottom+2,
       label+' stop '+i+' clipped outside voyage art');
     for(let j=0;j<i;j++){
       const other=geometry.stops[j];
       const overlap=Math.min(r.right,other.right)-Math.max(r.x,other.x)>5&&
         Math.min(r.bottom,other.bottom)-Math.max(r.y,other.y)>5;
       assert.equal(overlap,false,label+' voyage stops '+j+' and '+i+' overlap');
     }
   }
   const layout=await page.locator('#laria-geo-continent-voyage-preview').evaluate(el=>({width:el.clientWidth,scrollWidth:el.scrollWidth}));
   assert.ok(layout.scrollWidth<=layout.width+2,label+' horizon overflow');
   await photo(page,label+'-five-stops');
   assert.equal(await page.locator('.cv-story-aside').count(),1,label+' needs a single companion rail');
   assert.equal(await page.locator('.cv-story-map .cv-map-stop-recommended').count(),1,label+' needs exactly one optional next stop');
   if(viewport.width<=400){
     const display=await page.locator('.cv-story-aside').evaluate(el=>getComputedStyle(el).display);
     assert.equal(display,'contents',label+' phone layout must keep the map between the fox and progress');
   }
   if(viewport.width>=900&&viewport.width>viewport.height){
     const progress=await page.locator('.cv-story-rail .cv-progress').boundingBox();
     assert.ok(progress&&progress.y>=0&&progress.y+progress.height<=viewport.height-12,
       label+' iPad should show progress near fox, not at bottom of an empty rail');
   }
   const quickStart=page.locator('[data-cv-act="quick-start"]');
   assert.equal(await quickStart.count(),1,label+' needs a voluntary recommended voyage start');
   // The fox and action must precede the tall illustrated map on a real phone.
   if(viewport.width<=400){
     const hero=await page.locator('.cv-story-hero').boundingBox();
     const mapBox=await page.locator('.cv-story-map').boundingBox();
     const action=await quickStart.boundingBox();
     assert.ok(hero&&mapBox&&action&&hero.y<mapBox.y&&action.y+action.height<mapBox.y+4,
       label+' child-first entry should appear above the map');
     assert.ok(action.y+action.height<=viewport.height-16,
       label+' begin action should be visible without scrolling on iPhone');
   }
   assert.match(await quickStart.innerText(),/Seil til Kompassholmen/i);
   if(viewport.width>viewport.height){
     const b=await quickStart.boundingBox();
     assert.ok(b&&b.height>=44&&b.y+b.height<=viewport.height,
       label+' Geography start should be visible on every landscape screen');
   }
   assert.equal(await page.locator('.cv-story-map [data-cv-act="stage"]').count(),5);
   await quickStart.click();
   assert.equal((await page.evaluate(()=>window.LARIA_GEO_CONTINENT_VOYAGE.resume(state)))?.place.id,
     'kompassholmen',label+' voyage quick start opened the wrong place');
   await page.locator('[data-cv-act="intro"]').click();
   assert.equal(await page.locator('[data-cv-act="quick-start"]').count(),0,
     label+' paused voyage must offer Resume instead of an overwriting new start');
   assert.equal(await page.locator('[data-cv-act="resume"]').count(),1);
   if(viewport.width>viewport.height){
     const resumed=await page.locator('[data-cv-act="resume"]').boundingBox();
     assert.ok(resumed&&resumed.height>=44&&resumed.y>=0&&resumed.y+resumed.height<=viewport.height-8,
       label+' Resume should remain above the fold in landscape');
   }
   if(viewport.width<=400){
     const resume=await page.locator('[data-cv-act="resume"]').boundingBox();
     const mapBox=await page.locator('.cv-story-map').boundingBox();
     assert.ok(resume&&mapBox&&resume.y+resume.height<mapBox.y+4&&resume.y+resume.height<=viewport.height-16,
       label+' ongoing activity must resume from the first screen');
   }
   await page.locator('[data-cv-act="stage"][data-cv-stage="kompassholmen"]').click();
   assert.equal(await page.locator('.cv-direction').count(),4,'compass must be tactile, not a quiz card');
   await answer(page);
   await page.locator('[data-cv-act="intro"]').click();
   // Tapping the same island again must keep the unfinished compass step.
   await page.locator('[data-cv-act="stage"][data-cv-stage="kompassholmen"]').click();
   assert.equal((await page.evaluate(()=>window.LARIA_GEO_CONTINENT_VOYAGE.resume(state)))?.step,1,
     label+' reopening the compass stop erased the saved progress');
   await page.locator('[data-cv-act="intro"]').click();
   await page.locator('[data-cv-act="close"]').click();
   await page.reload({waitUntil:'domcontentloaded'});
   await enter(page);
   const firstCompassIds=await page.evaluate(()=>window.LARIA_GEO_CONTINENT_VOYAGE.ensure(state).draft.order.slice());
   const saved=await page.evaluate(()=>window.LARIA_GEO_CONTINENT_VOYAGE.resume(state));
   assert.ok(saved&&saved.place.id==='kompassholmen'&&saved.step===1,
     label+' partial compass voyage lost after refresh');
   await page.locator('[data-cv-act="resume"]').click();
   for(let n=1;n<4;n++)await answer(page);
   await page.locator('.cv-summary').waitFor();
   await page.locator('[data-cv-act="intro"]').click();
   assert.equal(await page.evaluate(()=>window.LARIA_GEO_CONTINENT_VOYAGE.progress(state).done),1);
   assert.match(await page.locator('.cv-progress').innerText(),/Flere nye oppdagelser venter/i);
   await page.locator('[data-cv-act="stage"][data-cv-stage="kompassholmen"]').click();
   const secondCompassIds=await page.evaluate(()=>window.LARIA_GEO_CONTINENT_VOYAGE.ensure(state).draft.order.slice());
   assert.equal(new Set(firstCompassIds.concat(secondCompassIds)).size,8,label+' replay did not change compass challenges');
   assert.equal(await page.locator('.cv-direction').count(),4,label+' alternate compass must stay tactile');
   await photo(page,label+'-compass-second-visit');
   await page.locator('[data-cv-act="intro"]').click();
   await page.locator('[data-cv-act="stage"][data-cv-stage="passbrygga"]').click();
   assert.equal(await page.locator('.cv-stamp').count(),6,'six continent stamps should be available');
   if(viewport.width===320){
     const firstStamp=await page.locator('.cv-stamp').first().boundingBox();
     assert.ok(firstStamp&&firstStamp.y<viewport.height-75,
       label+' a compact phone must reveal the first passport choice without aimless scrolling');
   }
   await photo(page,label+'-passport');
   await answer(page);
   const legacy=await page.evaluate(()=>({wins:state.journey.gradeWins['geography:2'],node:state.journey.nodes['geography:2:one']}));
   assert.deepEqual(legacy,{wins:{at:111},node:{best:4}},label+' Nordlysleiren progress altered');
   // Art v2 is an opt-in review, still inside the hidden developer-only preview.
   if(type===webkit&&(label==='webkit-iphone'||label==='webkit-ipad-landscape')){
     await page.goto(base+'&geography-chapter2-preview=1&geography-chapter2-art-v2=1',{waitUntil:'domcontentloaded'});
     await enter(page);
     await page.waitForFunction(()=>{
       const img=document.querySelector('.cv-map-art');
       return !!img&&img.complete&&img.naturalWidth===800&&img.naturalHeight===1000;
     },null,{timeout:20000});
     const art=page.locator('.cv-map-art');
     assert.equal(await art.getAttribute('data-cv-art-variant'),'candidate-v2');
     const stops=page.locator('.cv-story-map [data-cv-act="stage"]');
     assert.equal(await stops.count(),5,label+' candidate artwork must retain five independently playable places');
     const rect=await page.locator('.cv-story-map').boundingBox();
     for(let n=0;n<5;n++){
       const stop=await stops.nth(n).boundingBox();
       assert.ok(stop&&rect&&stop.height>=44&&stop.x>=rect.x-2&&stop.x+stop.width<=rect.x+rect.width+2&&stop.y>=rect.y-2&&stop.y+stop.height<=rect.y+rect.height+2,
         label+' painterly candidate clipped a child-sized interactive landmark '+n);
     }
     await photo(page,label+'-art-v2-candidate');
     await stops.first().click();
     assert.ok(await page.locator('.cv-task').count(),label+' candidate map failed to launch playable chapter task');
     // Force a missing art resource. The five playable map stops must survive.
     await page.route('**/geography-continent-voyage-art-candidate-v2.svg',route=>route.abort('failed'));
     await page.goto(base+'&geography-chapter2-preview=1&geography-chapter2-art-v2=1',{waitUntil:'domcontentloaded'});
     await enter(page);
     await page.waitForFunction(()=>{
       const img=document.querySelector('.cv-map-art');
       return !!img&&img.getAttribute('data-cv-art-variant')==='fallback-v1'&&img.complete&&img.naturalWidth===800;
     },null,{timeout:20000});
     assert.equal(await page.locator('.cv-story-map [data-cv-act="stage"]').count(),5,
       label+' fallback must retain all five independently playable places');
     await photo(page,label+'-art-v2-fallback');
     await page.locator('.cv-story-map [data-cv-act="stage"]').first().click();
     assert.ok(await page.locator('.cv-task').count(),
       label+' broken optional art must never prevent opening the adventure');
   }
   assert.deepEqual(errors,[],label+' unexpected browser exception');
   await ctx.close();
   console.log('PASS Kontinentseilasen '+label);
 }finally{await browser.close()}
}
(async()=>{
 await verify(chromium,'chromium-desktop',{width:1280,height:840});
 await verify(webkit,'webkit-iphone',{width:390,height:844});
 await verify(webkit,'webkit-iphone-landscape',{width:844,height:390});
 await verify(webkit,'webkit-ipad-portrait',{width:820,height:1180});
 await verify(webkit,'webkit-compact-iphone',{width:320,height:640});
 await verify(webkit,'webkit-ipad-landscape',{width:1180,height:820});
 console.log('PASS Geography chapter two private gate, compass, passport and reload');
})().catch(err=>{console.error(err);process.exitCode=1});
