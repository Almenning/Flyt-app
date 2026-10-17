'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const base=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const flags='&chapter2-preview=1&math-chapter2-preview=1&english-chapter2-preview=1&geography-chapter2-preview=1';
const shots=process.env.LARIA_CHAPTER2_INTEGRATION_SCREENSHOTS;
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'AlleFagQA',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},
 preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{'norwegian:2:lyder':{best:4},'math:2:plassverdi':{best:4},'english:2:words':{best:4},'geography:2:one':{best:4}},
 gradeWins:{'norwegian:2':{at:11},'math:2':{at:12},'english:2':{at:13},'geography:2':{at:14}},viewGrades:{}},
 answerLog:[],sessionLog:[],activeSession:null};
async function shot(page,name){if(!shots)return;fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:path.join(shots,name+'.png'),animations:'disabled'})}
async function go(page,subject){await page.goto(base+flags,{waitUntil:'domcontentloaded'});
 const button=page.locator('.bc14-subject[data-camp="subject-'+subject+'"]');
 await button.waitFor({timeout:22000});await button.click();
 const root=subject==='geography'?'#geography-screen.active':'#subject-screen.active';
 await page.locator(root).waitFor({timeout:18000});
}
async function run(type,label,viewport){
 const browser=await type.launch({headless:true,args:type===chromium?['--no-sandbox']:[]});
 try{
  const ctx=await browser.newContext({viewport,hasTouch:true,isMobile:viewport.width<=400,reducedMotion:'reduce',serviceWorkers:'block'});
  await ctx.addInitScript(value=>{if(!localStorage.getItem('laerlittmer-v2'))localStorage.setItem('laerlittmer-v2',JSON.stringify(value))},seed);
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  await go(page,'norwegian');
  await page.locator('[data-laria-chapter2-preview="1"]').click();
  await page.locator('[data-fd-pick="fortellingsdalen-2"]').click();
  await page.locator('[data-fd-action="stage"][data-fd-stage="brevhytta"]').click();
  await page.locator('.fd-option').first().click();
  assert.ok(await page.locator('.fd-feedback').count());
  await shot(page,label+'-norwegian');
  await go(page,'math');
  await page.locator('[data-laria-math-chapter2-preview="1"]').click();
  await page.locator('[data-mh-act="stage"][data-mh-stage="speildammen"]').click();
  const cell=page.locator('[data-mh-act="mirror"][data-mh-r="0"][data-mh-c="2"]');
  await cell.click();
  assert.equal(await cell.getAttribute('aria-pressed'),'true');
  await shot(page,label+'-math');
  await go(page,'english');
  await page.locator('[data-laria-english-chapter2-preview="1"]').click();
  await page.locator('[data-sh-act="stage"][data-sh-stage="setningsverkstedet"]').click();
  const tile=await page.evaluate(()=>{const x=window.LARIA_ENGLISH_SENTENCE_HARBOR.resume(state);return x.task.tiles.indexOf(x.task.goal[0])});
  await page.locator('[data-sh-act="tile"][data-sh-index="'+tile+'"]').click();
  assert.equal(await page.locator('.sh-built-word').count(),1);
  await shot(page,label+'-english');
  await go(page,'geography');
  await page.locator('[data-laria-geography-chapter2-preview="1"]').click();
  await page.locator('[data-cv-act="stage"][data-cv-stage="kompassholmen"]').click();
  const answer=await page.evaluate(()=>window.LARIA_GEO_CONTINENT_VOYAGE.resume(state).task.answer);
  await page.locator('[data-cv-act="answer"][data-cv-answer="'+answer+'"]').click();
  await page.locator('[data-cv-act="next"]').click();
  await shot(page,label+'-geography');
  await page.reload({waitUntil:'domcontentloaded'});
  const data=await page.evaluate(()=>{
   const all=state.journey.chapterProgress||{};
   const names=[
     window.LARIA_CHAPTER_EXPANSION.STORAGE_KEY,window.LARIA_MATH_PATTERN_HAVEN.KEY,
     window.LARIA_ENGLISH_SENTENCE_HARBOR.KEY,window.LARIA_GEO_CONTINENT_VOYAGE.KEY
   ];
   return {
     keys:names.map(k=>({key:k,present:!!all[k]})),
     norwegian:window.LARIA_CHAPTER_EXPANSION.resume(state)?.index,
     mirror:window.LARIA_MATH_PATTERN_HAVEN.resume(state)?.mirror||[],
     tiles:window.LARIA_ENGLISH_SENTENCE_HARBOR.resume(state)?.selected||[],
     geo:window.LARIA_GEO_CONTINENT_VOYAGE.resume(state)?.step,
     wins:state.journey.gradeWins,
     nodes:state.journey.nodes
   };
  });
  assert.ok(data.keys.every(x=>x.present),label+' some chapters lost saved progress');
  assert.equal(data.norwegian,1);
  assert.deepEqual(data.mirror,['0-2']);
  assert.deepEqual(data.tiles,[tile]);
  assert.equal(data.geo,1);
  for(const subject of ['norwegian','math','english','geography']){
   assert.ok(data.wins[subject+':2'],label+' lost existing journey completion '+subject);
   assert.ok(Object.keys(data.nodes).some(k=>k.startsWith(subject+':2:')),label+' lost old node '+subject);
  }
  assert.deepEqual(errors,[],label+' page errors');
  await ctx.close();
  console.log('PASS four chapters share state on '+label);
 }finally{await browser.close()}
}
(async()=>{
 await run(chromium,'chromium-desktop',{width:1280,height:840});
 await run(webkit,'webkit-iphone',{width:390,height:844});
 await run(webkit,'webkit-ipad-landscape',{width:1180,height:820});
 console.log('PASS cross-chapter persistence, interactive stages and legacy progress');
})().catch(e=>{console.error(e);process.exitCode=1});
