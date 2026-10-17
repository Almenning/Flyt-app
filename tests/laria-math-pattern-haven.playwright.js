'use strict';
/* Real-app Chrome/WebKit QA of the five-station Math chapter 2 preview. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'MonsterQA',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},
 preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{'math:2:plassverdi':{best:4}},gradeWins:{'math:2':{at:135}},viewGrades:{}},
 answerLog:[],sessionLog:[],activeSession:null};
const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const shots=process.env.LARIA_MATH_CHAPTER2_SCREENSHOTS;
async function photo(page,file){if(!shots)return;fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:path.join(shots,file+'.png'),animations:'disabled'})}
async function math(page){await page.locator('.bc14-subject[data-camp="subject-math"]').waitFor({timeout:18000});await page.evaluate(()=>openSubject('math'))}
async function enter(page){
 await math(page);
 await page.locator('[data-laria-math-chapter2-preview="1"]').click();
 await page.locator('#laria-math-pattern-haven-preview[role="dialog"]').waitFor();
 assert.equal(await page.locator('[data-mh-act="stage"]').count(),5);
}
async function complete(page,place){
 await page.locator('[data-mh-act="stage"][data-mh-stage="'+place+'"]').click();
 for(let i=0;i<4;i++){
   const s=await page.evaluate(()=>window.LARIA_MATH_PATTERN_HAVEN.resume(state));
   assert.equal(s.index,i);
   if(s.task.kind==='choice'){
     await page.locator('[data-mh-act="answer"][data-mh-index="'+s.task.options.indexOf(s.task.answer)+'"]').click();
   }else{
     const cells=await page.evaluate(()=>window.LARIA_MATH_PATTERN_HAVEN.targetMirror(window.LARIA_MATH_PATTERN_HAVEN.resume(state).task));
     for(const cell of cells){
       const [r,c]=cell.split('-');await page.locator('[data-mh-act="mirror"][data-mh-r="'+r+'"][data-mh-c="'+c+'"]').click();
     }
     await page.locator('[data-mh-act="check-mirror"]').click();
   }
   assert.ok(await page.locator('.mh-feedback').count(),place+' no feedback for task '+i);
   await page.locator('[data-mh-act="next"]').click();
 }
 await page.locator('.mh-result').waitFor();
 await page.locator('[data-mh-act="intro"]').click();
}
async function run(type,label,viewport){
 const browser=await type.launch({headless:true,args:type===chromium?['--no-sandbox']:[]});
 try{
   const ctx=await browser.newContext({viewport,isMobile:viewport.width<=400,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
   await ctx.addInitScript(value=>{
     if(!localStorage.getItem('laerlittmer-v2'))localStorage.setItem('laerlittmer-v2',JSON.stringify(value));
   },seed);
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://raw.githubusercontent.com/**',route=>route.abort());
   await page.route('https://api.worldbank.org/**',route=>route.abort());
   await page.goto(url,{waitUntil:'domcontentloaded'});
   await math(page);
   assert.equal(await page.locator('[data-laria-math-chapter2-preview]').count(),0,'private chapter leaked without flag');
   await page.goto(url+'&math-chapter2-preview=1',{waitUntil:'domcontentloaded'});
   await enter(page);
   const g=await page.locator('#laria-math-pattern-haven-preview').evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth}));
   assert.ok(g.scroll<=g.width+3,label+' map overflow');
   await photo(page,label+'-map');
   await complete(page,'formstien');
   assert.equal(await page.evaluate(()=>window.LARIA_MATH_PATTERN_HAVEN.progress(state).done),1);
   await page.locator('[data-mh-act="stage"][data-mh-stage="speildammen"]').click();
   assert.equal(await page.locator('.mh-cell').count(),16);
   assert.equal(await page.locator('[data-mh-act="mirror"]').count(),8);
   await page.locator('[data-mh-act="mirror"][data-mh-r="0"][data-mh-c="2"]').click();
   assert.equal(await page.locator('[data-mh-act="mirror"][data-mh-r="0"][data-mh-c="2"]').getAttribute('aria-pressed'),'true');
   await photo(page,label+'-paint');
   await page.locator('[data-mh-act="intro"]').click();
   await page.locator('[data-mh-act="close"]').click();
   await page.reload({waitUntil:'domcontentloaded'});
   await enter(page);
   const restored=await page.evaluate(()=>window.LARIA_MATH_PATTERN_HAVEN.resume(state));
   assert.equal(restored.stage.id,'speildammen');
   assert.ok(restored.mirror.includes('0-2'),label+' painted cell vanished on reload');
   await page.locator('[data-mh-act="resume"]').click();
   assert.equal(await page.locator('[data-mh-act="mirror"][data-mh-r="0"][data-mh-c="2"]').getAttribute('aria-pressed'),'true');
   const legacy=await page.evaluate(()=>({wins:state.journey.gradeWins['math:2'],node:state.journey.nodes['math:2:plassverdi']}));
   assert.deepEqual(legacy,{wins:{at:135},node:{best:4}},'old Tallenga progress changed');
   await page.locator('[data-mh-act="intro"]').click();
   await complete(page,'tallbroen');
   assert.equal(await page.evaluate(()=>window.LARIA_MATH_PATTERN_HAVEN.progress(state).done),2);
   await photo(page,label+'-progress');
   assert.deepEqual(errors,[],label+' runtime exceptions');
   await ctx.close();
   console.log('PASS Math Mønsterhagen '+label);
 }finally{await browser.close()}
}
(async()=>{
 await run(chromium,'chromium-desktop',{width:1280,height:840});
 await run(webkit,'webkit-iphone',{width:390,height:844});
 await run(webkit,'webkit-compact-iphone',{width:320,height:640});
 await run(webkit,'webkit-ipad-landscape',{width:1180,height:820});
 console.log('PASS Mønsterhagen preview, gate, persistence, tactile mirror');
})().catch(e=>{console.error(e);process.exitCode=1});
