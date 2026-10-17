'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const base=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const shots=process.env.LARIA_ENGLISH_CHAPTER2_SCREENSHOTS;
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'HavnQA',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},
 preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{'english:2:words':{best:4}},gradeWins:{'english:2':{at:144}},viewGrades:{}},
 answerLog:[],sessionLog:[],activeSession:null};
async function photo(page,label){if(!shots)return;fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:path.join(shots,label+'.png'),animations:'disabled'})}
async function english(page){
 const tile=page.locator('.bc14-subject[data-camp="subject-english"]');
 await tile.waitFor({timeout:20000});await tile.click();
 await page.locator('#subject-screen.active').waitFor({timeout:16000});
}
async function enter(page){
 await english(page);
 const launch=page.locator('[data-laria-english-chapter2-preview="1"]');
 await launch.waitFor({timeout:16000});
 await launch.click();
 await page.locator('#laria-english-sentence-harbor-preview[role="dialog"]').waitFor();
 assert.equal(await page.locator('[data-sh-act="stage"]').count(),5);
}
async function assertAnswerInView(page,label){
 const feedback=await page.locator('.sh-feedback').boundingBox();
 const next=await page.locator('[data-sh-act="next"]').boundingBox();
 const viewportHeight=await page.evaluate(()=>window.innerHeight);
 assert.ok(feedback&&feedback.y>=-2&&feedback.y+feedback.height<=viewportHeight+2,
   label+' must reveal the full feedback immediately, without scrolling');
 assert.ok(next&&next.y<viewportHeight-12&&next.y+next.height>12,
   label+' should keep the next discovery within reach: '+JSON.stringify({viewportHeight,feedback,next}));
}
async function completeSentence(page){
 const s=await page.evaluate(()=>window.LARIA_ENGLISH_SENTENCE_HARBOR.resume(state));
 assert.equal(s.task.kind,'sentence');
 for(const word of s.task.goal){
   const index=s.task.tiles.indexOf(word);
   await page.locator('[data-sh-act="tile"][data-sh-index="'+index+'"]').click();
 }
 await page.locator('[data-sh-act="check-sentence"]').click();
 assert.equal(await page.locator('.sh-feedback').count(),1);
 assert.match(await page.locator('.sh-feedback').innerText(),/fant løsningen/i);
 await page.locator('[data-sh-act="next"]').click();
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
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
   await page.route('https://api.worldbank.org/**',r=>r.abort());
   await page.goto(base,{waitUntil:'domcontentloaded'});
   await english(page);
   assert.equal(await page.locator('[data-laria-english-chapter2-preview]').count(),0,'unflagged content must be hidden');
   await page.goto(base+'&english-chapter2-preview=1',{waitUntil:'domcontentloaded'});
   await enter(page);
   const map=page.locator('.sh-story-map');
   await map.waitFor({state:'visible'});
   const layout=await map.evaluate(el=>{
     const region=el.getBoundingClientRect(),img=el.querySelector('.sh-map-art');
     const stops=[...el.querySelectorAll('.sh-map-stop')].map(b=>{
       const r=b.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};
     });
     return {artLoaded:img.complete&&img.naturalWidth===800&&img.naturalHeight===1000,
       region:{x:region.x,y:region.y,right:region.right,bottom:region.bottom},
       stops};
   });
   assert.equal(layout.artLoaded,true,label+' original illustrated English harbor not loaded');
   assert.equal(layout.stops.length,5,label+' must show five stops painted onto the harbor');
   for(const [i,s] of layout.stops.entries()){
     assert.ok(s.height>=44,label+' stage '+i+' needs a child-sized touch target');
     assert.ok(s.x>=layout.region.x-2&&s.right<=layout.region.right+2&&s.y>=layout.region.y-2&&s.bottom<=layout.region.bottom+2,
       label+' stage '+i+' is clipped outside harbor art');
     for(let j=0;j<i;j++){
       const b=layout.stops[j],overlap=Math.min(s.right,b.right)-Math.max(s.x,b.x)>5&&
         Math.min(s.bottom,b.bottom)-Math.max(s.y,b.y)>5;
       assert.equal(overlap,false,label+' overlapping harbor stages '+j+' and '+i);
     }
   }
   const viewportResult=await page.locator('#laria-english-sentence-harbor-preview').evaluate(el=>({scrollWidth:el.scrollWidth,width:el.clientWidth}));
   assert.ok(viewportResult.scrollWidth<=viewportResult.width+2,label+' overflow in port');
   await photo(page,label+'-harbor');
   assert.equal(await page.locator('.sh-story-aside').count(),1,label+' needs a single companion rail');
   assert.equal(await page.locator('.sh-story-map .sh-map-stop-recommended').count(),1,label+' needs exactly one optional next stop');
   if(viewport.width<=400){
     const display=await page.locator('.sh-story-aside').evaluate(el=>getComputedStyle(el).display);
     assert.equal(display,'contents',label+' phone layout must keep the map between the fox and progress');
   }
   if(viewport.width>=900&&viewport.width>viewport.height){
     const progress=await page.locator('.sh-story-rail .sh-progress').boundingBox();
     assert.ok(progress&&progress.y>=0&&progress.y+progress.height<=viewport.height-12,
       label+' iPad should show progress near fox, not at bottom of an empty rail');
   }
   const quickStart=page.locator('[data-sh-act="quick-start"]');
   assert.equal(await quickStart.count(),1,label+' needs a voluntary first-fold harbor invitation');
   // The fox and action must precede the tall illustrated map on a real phone.
   if(viewport.width<=400){
     const hero=await page.locator('.sh-story-hero').boundingBox();
     const mapBox=await page.locator('.sh-story-map').boundingBox();
     const action=await quickStart.boundingBox();
     assert.ok(hero&&mapBox&&action&&hero.y<mapBox.y&&action.y+action.height<mapBox.y+4,
       label+' child-first entry should appear above the map');
     assert.ok(action.y+action.height<=viewport.height-16,
       label+' begin action should be visible without scrolling on iPhone');
   }
   assert.match(await quickStart.innerText(),/Begynn ved Hilsenkaia/i);
   if(viewport.width>viewport.height){
     const b=await quickStart.boundingBox();
     assert.ok(b&&b.height>=44&&b.y+b.height<=viewport.height,
       label+' English start should be visible on every landscape screen');
   }
   assert.equal(await page.locator('.sh-story-map [data-sh-act="stage"]').count(),5,
     label+' the quick start must not replace any illustrated stop');
   await quickStart.click();
   assert.equal((await page.evaluate(()=>window.LARIA_ENGLISH_SENTENCE_HARBOR.resume(state)))?.stage.id,
     'hilsenkaia',label+' harbor quick start opened the wrong stage');
   await page.locator('[data-sh-act="intro"]').click();
   assert.equal(await page.locator('[data-sh-act="quick-start"]').count(),0,
     label+' an unfinished visit must offer Resume, not a button that overwrites it');
   assert.equal(await page.locator('[data-sh-act="resume"]').count(),1);
   if(viewport.width>viewport.height){
     const resumed=await page.locator('[data-sh-act="resume"]').boundingBox();
     assert.ok(resumed&&resumed.height>=44&&resumed.y>=0&&resumed.y+resumed.height<=viewport.height-8,
       label+' Resume should remain above the fold in landscape');
   }
   if(viewport.width<=400){
     const resume=await page.locator('[data-sh-act="resume"]').boundingBox();
     const mapBox=await page.locator('.sh-story-map').boundingBox();
     assert.ok(resume&&mapBox&&resume.y+resume.height<mapBox.y+4&&resume.y+resume.height<=viewport.height-16,
       label+' ongoing activity must resume from the first screen');
   }
   await page.locator('[data-sh-act="stage"][data-sh-stage="ordbrygga"]').click();
   const firstTask=await page.evaluate(()=>window.LARIA_ENGLISH_SENTENCE_HARBOR.resume(state).task);
   assert.equal(firstTask.kind,'choice');
   assert.equal(firstTask.english,firstTask.answer,'regression exercise must be an answer-cued choice');
   assert.equal(await page.locator('.sh-english').count(),0,label+' answer leaked as an English prompt');
   assert.match(await page.locator('[data-sh-act="speak"]').innerText(),/alle svarene/i);
   assert.equal(await page.locator('.sh-options[lang="en"] .sh-option').count(),3);
   await page.locator('[data-sh-act="answer"][data-sh-index="'+firstTask.options.indexOf(firstTask.answer)+'"]').click();
   await photo(page,label+'-choice-feedback');
   await assertAnswerInView(page,label+' choice feedback');
   assert.equal(await page.locator('.sh-english').innerText(),firstTask.answer,'answer may be revealed after a try');
   await page.locator('[data-sh-act="intro"]').click();
   await page.locator('[data-sh-act="stage"][data-sh-stage="setningsverkstedet"]').click();
   let s=await page.evaluate(()=>window.LARIA_ENGLISH_SENTENCE_HARBOR.resume(state));
   const chosen=s.task.tiles.indexOf(s.task.goal[0]);
   await page.locator('[data-sh-act="tile"][data-sh-index="'+chosen+'"]').click();
   assert.equal(await page.locator('[data-sh-act="tile"][data-sh-index="'+chosen+'"]').getAttribute('aria-pressed'),'true');
   await photo(page,label+'-sentence-start');
   await page.locator('[data-sh-act="intro"]').click();
   // Reopening the same map stop must retain the partially built sentence.
   await page.locator('[data-sh-act="stage"][data-sh-stage="setningsverkstedet"]').click();
   assert.equal((await page.evaluate(()=>window.LARIA_ENGLISH_SENTENCE_HARBOR.resume(state)))?.selected.includes(chosen),true,
     label+' tapping the same active stage erased the draft');
   await page.locator('[data-sh-act="intro"]').click();
   await page.locator('[data-sh-act="close"]').click();
   await page.reload({waitUntil:'domcontentloaded'});
   await enter(page);
   const d=await page.evaluate(()=>window.LARIA_ENGLISH_SENTENCE_HARBOR.resume(state));
   assert.ok(d&&d.stage.id==='setningsverkstedet'&&d.selected.includes(chosen),
     label+' unfinished child-built phrase not restored');
   const firstSentenceIds=await page.evaluate(()=>window.LARIA_ENGLISH_SENTENCE_HARBOR.ensure(state).draft.order.slice());
   await page.locator('[data-sh-act="resume"]').click();
   assert.equal(await page.locator('.sh-built-word').count(),1);
   const nextWords=d.task.goal.slice(1);
   for(const word of nextWords){
     const at=d.task.tiles.indexOf(word);
     await page.locator('[data-sh-act="tile"][data-sh-index="'+at+'"]').click();
   }
   await page.locator('[data-sh-act="check-sentence"]').click();
   await photo(page,label+'-sentence-feedback');
   assert.equal(await page.locator('.sh-tiles').count(),0,
     label+' a solved sentence must not show disabled word tiles below the completed sentence');
   assert.equal(await page.locator('[data-sh-act="check-sentence"]').count(),0,
     label+' a solved sentence must hide the redundant Check control');
   assert.equal(await page.locator('[data-sh-act="clear"]').count(),0,
     label+' a solved sentence must lead to Next, not Start over');
   await assertAnswerInView(page,label+' sentence feedback');
   assert.match(await page.locator('.sh-feedback').innerText(),/fant løsningen/i);
   await page.locator('[data-sh-act="next"]').click();
   for(let i=1;i<4;i++)await completeSentence(page);
   await page.locator('.sh-result').waitFor();
   await page.locator('[data-sh-act="intro"]').click();
   assert.equal(await page.evaluate(()=>window.LARIA_ENGLISH_SENTENCE_HARBOR.progress(state).done),1);
   assert.match(await page.locator('.sh-progress').innerText(),/Nye oppgaver venter/i);
   await page.locator('[data-sh-act="stage"][data-sh-stage="setningsverkstedet"]').click();
   const nextSentenceIds=await page.evaluate(()=>window.LARIA_ENGLISH_SENTENCE_HARBOR.ensure(state).draft.order.slice());
   assert.equal(new Set(firstSentenceIds.concat(nextSentenceIds)).size,8,label+' second visit must show four genuinely new sentences');
   assert.equal(await page.locator('.sh-tile').count(),4,label+' new sentence must be playable on touch');
   await photo(page,label+'-new-sentence-visit');
   await page.locator('[data-sh-act="intro"]').click();
   await page.locator('[data-sh-act="stage"][data-sh-stage="historiefyret"]').click();
   s=await page.evaluate(()=>window.LARIA_ENGLISH_SENTENCE_HARBOR.resume(state));
   assert.equal(s.task.kind,'story');
   assert.ok(await page.locator('.sh-english').innerText());
   await page.locator('[data-sh-act="answer"][data-sh-index="'+s.task.options.indexOf(s.task.answer)+'"]').click();
   assert.equal(await page.locator('.sh-feedback').count(),1);
   const legacy=await page.evaluate(()=>({wins:state.journey.gradeWins['english:2'],node:state.journey.nodes['english:2:words']}));
   assert.deepEqual(legacy,{wins:{at:144},node:{best:4}},label+' changed Ordlandsbyen progress');
   await photo(page,label+'-story');
   assert.deepEqual(errors,[],label+' runtime exception');
   await ctx.close();
   console.log('PASS Setningshavna '+label);
 }finally{await browser.close()}
}
(async()=>{
 await verify(chromium,'chromium-desktop',{width:1280,height:840});
 await verify(webkit,'webkit-iphone',{width:390,height:844});
 await verify(webkit,'webkit-iphone-landscape',{width:844,height:390});
 await verify(webkit,'webkit-ipad-portrait',{width:820,height:1180});
 await verify(webkit,'webkit-compact-iphone',{width:320,height:640});
 await verify(webkit,'webkit-ipad-landscape',{width:1180,height:820});
 console.log('PASS English chapter two hidden gate, sentence tiles, stories and reload');
})().catch(err=>{console.error(err);process.exitCode=1});
