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
async function assertCompactHint(page,textSelector,backSelector,viewport,label){
 if(viewport.width>360)return;
 const width=await page.locator(textSelector).evaluate(el=>el.getBoundingClientRect().width);
 assert.ok(width>=190,label+' hint squeezed to '+width+'px, expected full-width reading room');
 const button=await page.locator(backSelector).evaluate(el=>({
   whiteSpace:getComputedStyle(el).whiteSpace,
   height:el.getBoundingClientRect().height
 }));
 assert.equal(button.whiteSpace,'nowrap',label+' Back wraps into two lines');
 assert.ok(button.height<=55,label+' Back button got too tall');
}
async function go(page,subject){await page.goto(base+flags,{waitUntil:'domcontentloaded'});
 const button=page.locator('.bc14-subject[data-camp="subject-'+subject+'"]');
 await button.waitFor({timeout:22000});await button.click();
 const root=subject==='geography'?'#geography-screen.active':'#subject-screen.active';
 await page.locator(root).waitFor({timeout:18000});
}
async function verifyDefaultChildNavigation(page,label){
 // This is the deployed URL without any chapter-two developer flags.
 // Each subject must keep its original approved journey and hide the draft pilots.
 const entries=[
  ['norwegian','[data-laria-chapter2-preview]'],
  ['math','[data-laria-math-chapter2-preview]'],
  ['english','[data-laria-english-chapter2-preview]'],
  ['geography','[data-laria-geography-chapter2-preview]']
 ];
 for(const [subject,selector] of entries){
  await page.goto(base,{waitUntil:'domcontentloaded'});
  const home=page.locator('.bc14-subject[data-camp="subject-'+subject+'"]');
  await home.waitFor({timeout:22000});
  await home.click();
  await page.locator(subject==='geography'?'#geography-screen.active':'#subject-screen.active')
   .waitFor({timeout:18000});
  assert.equal(await page.locator(selector).count(),0,
   label+' unapproved '+subject+' chapter was exposed without developer flags');
  assert.equal(await page.locator('[id$="-chapter2-preview"]').count(),0,
   label+' an unapproved chapter-two dialog opened in the standard journey');
 }
}
async function assertWideLandscape(page,selector,companion,paper,label,viewport){
 if(viewport.width<900||viewport.width<=viewport.height)return;
 const geometry=await page.locator(selector).evaluate((root,args)=>{
   const bounds=sel=>{const el=root.querySelector(sel);if(!el)return null;const r=el.getBoundingClientRect();return {x:r.x,right:r.right,width:r.width,top:r.top};};
   const shell=root.querySelector('[class$="-shell"]');
   return {shell:shell?.getBoundingClientRect().width||0,fox:bounds(args.companion),paper:bounds(args.paper),
     viewport:root.ownerDocument.documentElement.clientWidth};
 },{companion,paper});
 assert.ok(geometry.fox&&geometry.paper,label+' missing two-column companion or task paper');
 assert.ok(geometry.shell>=viewport.width*0.78,label+' iPad workspace remains a narrow centered phone sheet');
 assert.ok(geometry.paper.x>=geometry.fox.right+8,label+' paper does not sit beside fox companion');
 assert.ok(geometry.paper.width>=370,label+' activity paper too narrow on landscape iPad');
 assert.ok(geometry.paper.right<=viewport.width+2,label+' activity paper clipped to the right');
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
  if(label==='chromium-desktop'||label==='webkit-iphone')await verifyDefaultChildNavigation(page,label);
  await go(page,'norwegian');
  // The Norsk chapter-2 pilot remains an internal regression fixture.
  // The child's Eggenipa world intentionally hides the old adventure menu.
  const devPilot=page.locator('[data-laria-chapter2-preview="1"]');
  assert.equal(await devPilot.isVisible(),false,label+' old Norsk adventure leaked into Eggenipa');
  await devPilot.evaluate(el=>el.click());
  await page.locator('[data-fd-pick="fortellingsdalen-2"]').click();
  await page.locator('[data-fd-action="stage"][data-fd-stage="brevhytta"]').click();
  await page.locator('.fd-option').first().click();
  assert.ok(await page.locator('.fd-feedback').count());
  await shot(page,label+'-norwegian');
  await go(page,'math');
  // Tallvika deliberately hides the chapter-two development launcher from
  // children. Retain coverage of that *internal* pilot without promoting
  // a hidden testing affordance to public navigation.
  const mathPilot=page.locator('[data-laria-math-chapter2-preview="1"]');
  assert.equal(await mathPilot.isVisible(),false,
    label+' internal Math chapter-two preview is visible to children');
  await mathPilot.evaluate(el=>el.click());
  await page.locator('[data-mh-act="stage"][data-mh-stage="speildammen"]').click();
  const mhHint=page.locator('[data-mh-act="hint"]');
  assert.equal(await mhHint.getAttribute('aria-expanded'),'false');
  await mhHint.click();
  assert.equal(await page.locator('.mh-fox-hint').count(),1);
  assert.match(await page.locator('#mh-fox-message').innerText(),/samme rad/);
  await assertCompactHint(page,'#mh-fox-message','.mh-back',viewport,label+' math');
  await shot(page,label+'-math-fox-hint');
  const expectedFox=await page.evaluate(()=>avatarSrc('girl'));
  const mathFox=await page.locator('.mh-companion .mh-fox').getAttribute('src');
  assert.equal(mathFox,expectedFox,label+' Math lost the selected personal fox');
  await page.locator('[data-mh-act="hint"]').click();
  assert.equal(await page.locator('[data-mh-act="hint"]').getAttribute('aria-expanded'),'false');
  const beforeMathScroll=await page.locator('#laria-math-pattern-haven-preview').evaluate(el=>{
    el.scrollTop=Math.min(50,Math.max(0,el.scrollHeight-el.clientHeight));return el.scrollTop;
  });
  const cell=page.locator('[data-mh-act="mirror"][data-mh-r="0"][data-mh-c="2"]');
  await cell.click();
  assert.equal(await cell.getAttribute('aria-pressed'),'true');
  const afterMathScroll=await page.locator('#laria-math-pattern-haven-preview').evaluate(el=>el.scrollTop);
  if(beforeMathScroll>24)assert.ok(afterMathScroll>=beforeMathScroll-15,label+' mirror touch reset chapter scroll');
  await shot(page,label+'-math');
  await assertWideLandscape(page,'#laria-math-pattern-haven-preview','.mh-companion','.mh-paper',label+' math',viewport);
  await go(page,'english');
  await page.locator('[data-laria-english-chapter2-preview="1"]').click();
  await page.locator('[data-sh-act="stage"][data-sh-stage="setningsverkstedet"]').click();
  assert.equal(await page.locator('[data-sh-act="hint"]').getAttribute('aria-expanded'),'false');
  await page.locator('[data-sh-act="hint"]').click();
  assert.match(await page.locator('#sh-fox-message').innerText(),/først/);
  await assertCompactHint(page,'#sh-fox-message','.sh-top .sh-quiet',viewport,label+' english');
  assert.equal(await page.locator('.sh-fox-hint').count(),1);
  await shot(page,label+'-english-fox-hint');
  const englishFox=await page.locator('.sh-companion .sh-fox').getAttribute('src');
  assert.equal(englishFox,expectedFox,label+' English changed the selected fox');
  const beforeEnglishScroll=await page.locator('#laria-english-sentence-harbor-preview').evaluate(el=>{
    el.scrollTop=Math.min(50,Math.max(0,el.scrollHeight-el.clientHeight));return el.scrollTop;
  });
  const tile=await page.evaluate(()=>{const x=window.LARIA_ENGLISH_SENTENCE_HARBOR.resume(state);return x.task.tiles.indexOf(x.task.goal[0])});
  await page.locator('[data-sh-act="tile"][data-sh-index="'+tile+'"]').click();
  assert.equal(await page.locator('.sh-built-word').count(),1);
  const afterEnglishScroll=await page.locator('#laria-english-sentence-harbor-preview').evaluate(el=>el.scrollTop);
  if(beforeEnglishScroll>24)assert.ok(afterEnglishScroll>=beforeEnglishScroll-15,label+' word tile reset chapter scroll');
  await shot(page,label+'-english');
  await assertWideLandscape(page,'#laria-english-sentence-harbor-preview','.sh-companion','.sh-paper',label+' english',viewport);
  await go(page,'geography');
  await page.locator('[data-laria-geography-chapter2-preview="1"]').click();
  await page.locator('[data-cv-act="stage"][data-cv-stage="kompassholmen"]').click();
  await page.locator('[data-cv-act="hint"]').click();
  assert.equal(await page.locator('.cv-fox-hint').count(),1);
  assert.match(await page.locator('#cv-fox-message').innerText(),/nord/);
  await assertCompactHint(page,'#cv-fox-message','.cv-top .cv-quiet',viewport,label+' geography');
  await shot(page,label+'-geography-fox-hint');
  const geographyFox=await page.locator('.cv-companion .cv-fox').getAttribute('src');
  assert.equal(geographyFox,expectedFox,label+' Geography changed the selected fox');
  const answer=await page.evaluate(()=>window.LARIA_GEO_CONTINENT_VOYAGE.resume(state).task.answer);
  await page.locator('[data-cv-act="answer"][data-cv-answer="'+answer+'"]').click();
  assert.equal(await page.locator('.cv-fox-celebrate').count(),1,'correct compass answer should make the fox cheer');
  assert.equal(await page.locator('[data-cv-act="hint"]').count(),0,'the fox should not offer more hints after success');
  await page.locator('[data-cv-act="next"]').click();
  await shot(page,label+'-geography');
  await assertWideLandscape(page,'#laria-geo-continent-voyage-preview','.cv-companion','.cv-paper',label+' geography',viewport);
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
 await run(webkit,'webkit-compact-iphone',{width:320,height:640});
 await run(webkit,'webkit-ipad-landscape',{width:1180,height:820});
 console.log('PASS cross-chapter persistence, interactive stages and legacy progress');
})().catch(e=>{console.error(e);process.exitCode=1});
