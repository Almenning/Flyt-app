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
async function answer(page){
 const s=await page.evaluate(()=>window.LARIA_GEO_CONTINENT_VOYAGE.resume(state));
 assert.ok(s,'stage did not start');
 const b=page.locator('[data-cv-act="answer"][data-cv-answer="'+s.task.answer+'"]');
 await b.click();
 assert.equal(await page.locator('.cv-feedback').count(),1);
 assert.match(await page.locator('.cv-feedback').innerText(),/riktig vei/);
 await page.locator('[data-cv-act="next"]').click();
}
async function verify(type,label,viewport){
 const browser=await type.launch({headless:true,args:type===chromium?['--no-sandbox']:[]});
 try{
   const ctx=await browser.newContext({viewport,isMobile:viewport.width<=400,hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'});
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
   const layout=await page.locator('#laria-geo-continent-voyage-preview').evaluate(el=>({width:el.clientWidth,scrollWidth:el.scrollWidth}));
   assert.ok(layout.scrollWidth<=layout.width+2,label+' horizon overflow');
   await photo(page,label+'-five-stops');
   await page.locator('[data-cv-act="stage"][data-cv-stage="kompassholmen"]').click();
   assert.equal(await page.locator('.cv-direction').count(),4,'compass must be tactile, not a quiz card');
   await answer(page);
   await page.locator('[data-cv-act="intro"]').click();
   await page.locator('[data-cv-act="close"]').click();
   await page.reload({waitUntil:'domcontentloaded'});
   await enter(page);
   const saved=await page.evaluate(()=>window.LARIA_GEO_CONTINENT_VOYAGE.resume(state));
   assert.ok(saved&&saved.place.id==='kompassholmen'&&saved.step===1,
     label+' partial compass voyage lost after refresh');
   await page.locator('[data-cv-act="resume"]').click();
   for(let n=1;n<4;n++)await answer(page);
   await page.locator('.cv-summary').waitFor();
   await page.locator('[data-cv-act="intro"]').click();
   assert.equal(await page.evaluate(()=>window.LARIA_GEO_CONTINENT_VOYAGE.progress(state).done),1);
   await page.locator('[data-cv-act="stage"][data-cv-stage="passbrygga"]').click();
   assert.equal(await page.locator('.cv-stamp').count(),6,'six continent stamps should be available');
   await photo(page,label+'-passport');
   await answer(page);
   const legacy=await page.evaluate(()=>({wins:state.journey.gradeWins['geography:2'],node:state.journey.nodes['geography:2:one']}));
   assert.deepEqual(legacy,{wins:{at:111},node:{best:4}},label+' Nordlysleiren progress altered');
   assert.deepEqual(errors,[],label+' unexpected browser exception');
   await ctx.close();
   console.log('PASS Kontinentseilasen '+label);
 }finally{await browser.close()}
}
(async()=>{
 await verify(chromium,'chromium-desktop',{width:1280,height:840});
 await verify(webkit,'webkit-iphone',{width:390,height:844});
 await verify(webkit,'webkit-compact-iphone',{width:320,height:640});
 await verify(webkit,'webkit-ipad-landscape',{width:1180,height:820});
 console.log('PASS Geography chapter two private gate, compass, passport and reload');
})().catch(err=>{console.error(err);process.exitCode=1});
