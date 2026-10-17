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
   const ctx=await browser.newContext({viewport,hasTouch:true,isMobile:viewport.width<=400,reducedMotion:'reduce',serviceWorkers:'block'});
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
   const viewportResult=await page.locator('#laria-english-sentence-harbor-preview').evaluate(el=>({scrollWidth:el.scrollWidth,width:el.clientWidth}));
   assert.ok(viewportResult.scrollWidth<=viewportResult.width+2,label+' overflow in port');
   await photo(page,label+'-harbor');
   await page.locator('[data-sh-act="stage"][data-sh-stage="setningsverkstedet"]').click();
   let s=await page.evaluate(()=>window.LARIA_ENGLISH_SENTENCE_HARBOR.resume(state));
   const chosen=s.task.tiles.indexOf(s.task.goal[0]);
   await page.locator('[data-sh-act="tile"][data-sh-index="'+chosen+'"]').click();
   assert.equal(await page.locator('[data-sh-act="tile"][data-sh-index="'+chosen+'"]').getAttribute('aria-pressed'),'true');
   await photo(page,label+'-sentence-start');
   await page.locator('[data-sh-act="intro"]').click();
   await page.locator('[data-sh-act="close"]').click();
   await page.reload({waitUntil:'domcontentloaded'});
   await enter(page);
   const d=await page.evaluate(()=>window.LARIA_ENGLISH_SENTENCE_HARBOR.resume(state));
   assert.ok(d&&d.stage.id==='setningsverkstedet'&&d.selected.includes(chosen),
     label+' unfinished child-built phrase not restored');
   await page.locator('[data-sh-act="resume"]').click();
   assert.equal(await page.locator('.sh-built-word').count(),1);
   const nextWords=d.task.goal.slice(1);
   for(const word of nextWords){
     const at=d.task.tiles.indexOf(word);
     await page.locator('[data-sh-act="tile"][data-sh-index="'+at+'"]').click();
   }
   await page.locator('[data-sh-act="check-sentence"]').click();
   assert.match(await page.locator('.sh-feedback').innerText(),/fant løsningen/i);
   await page.locator('[data-sh-act="next"]').click();
   for(let i=1;i<4;i++)await completeSentence(page);
   await page.locator('.sh-result').waitFor();
   await page.locator('[data-sh-act="intro"]').click();
   assert.equal(await page.evaluate(()=>window.LARIA_ENGLISH_SENTENCE_HARBOR.progress(state).done),1);
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
 await verify(webkit,'webkit-compact-iphone',{width:320,height:640});
 await verify(webkit,'webkit-ipad-landscape',{width:1180,height:820});
 console.log('PASS English chapter two hidden gate, sentence tiles, stories and reload');
})().catch(err=>{console.error(err);process.exitCode=1});
