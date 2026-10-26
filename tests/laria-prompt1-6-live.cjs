'use strict';
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const QA_URL=process.env.QA_URL||'https://almenning.github.io/Flyt-app/laer-litt-mer/?app=laria';
const KEY='laerlittmer-v2';
const seed={version:7,progressSchemaVersion:3,profile:{grade:3,onboarded:true,name:'Runtimebarn',avatar:'boy',setupVersion:2},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};

// This checks core Læria behaviour rather than World Bank availability.
// Simulate a third-party HTTP 503 with CORS permission. The application must
// continue normally with its built-in country population fallback.
async function optionalPopulationUnavailable(context){
 await context.route('https://api.worldbank.org/**',route=>route.fulfill({
  status:503,contentType:'application/json',
  headers:{'access-control-allow-origin':'*'},
  body:'{"error":"World Bank intentionally unavailable in smoke QA"}'
 }));
}
async function answer(page){
 const q=await page.evaluate(()=>{const x=sessionQuestions[qIndex];return x?{type:x.type,answer:x.answer}:null});assert.ok(q);
 if(q.type==='learning-choice')await page.locator('.answer').evaluateAll((els,a)=>els.find(x=>x.dataset.answer===String(a)).click(),q.answer);
 else if(q.type==='build-word')await page.evaluate(()=>{const q=sessionQuestions[qIndex],u=new Set();q.answer.split('').forEach((ch,s)=>{const i=q.letters.findIndex((x,j)=>x.l===ch&&!u.has(j));u.add(i);document.querySelector('.letter-slot[data-slot="'+s+'"]').click();document.querySelector('.letter-tile[data-idx="'+i+'"]').click()});document.querySelector('#check-build').click()});
 else if(q.type==='sentence-order')await page.evaluate(()=>{const q=sessionQuestions[qIndex],u=new Set();for(const w of q.answer.split(' ')){const i=q.words.findIndex((x,j)=>x===w&&!u.has(j));u.add(i);document.querySelector('.word-tile[data-idx="'+i+'"]').click()}document.querySelector('#check-sentence').click()});
 else if(q.type==='number-input'){await page.locator('#math-input').fill(String(q.answer));await page.locator('#check-number').click()}
 else if(q.type==='sequence-order')await page.evaluate(()=>{const q=sessionQuestions[qIndex],u=new Set();for(const v of String(q.answer).split('|')){const i=q.items.findIndex((x,j)=>String(x)===String(v)&&!u.has(j));u.add(i);document.querySelector('.sequence-tile[data-idx="'+i+'"]').click()}document.querySelector('#check-sequence').click()});
 else if(q.type==='map')await page.evaluate(()=>answerMap(sessionQuestions[qIndex].answer));
 else await page.evaluate(()=>answerText(sessionQuestions[qIndex].answer));
 await page.locator('#next-question').waitFor({state:'visible'});
}
async function finish(page){const n=await page.evaluate(()=>sessionQuestions.length);for(let i=0;i<n;i++){await answer(page);await page.locator('#next-question').click()}await page.locator('#complete-screen.active').waitFor()}
async function openHomeSubject(page,subject){
 // If Home v15 is present, wait until its locked artwork owns the interaction
 // layer. Clicking during the v14 -> v15 handoff can hit the outgoing Explore card.
 const hasV15=await page.locator('script[src*="home-kjosnes-v15.js"]').count();
 const youngBand=await page.locator('.grade-band-young').count()>0;
 if(hasV15&&youngBand){
   await page.waitForFunction(()=>{
     const h=document.querySelector('#home-screen .bc12');
     const asset=h?.dataset.bc15Asset||'';
     const free=h?.querySelector('.bc14-free');
     const freeSafe=!free||getComputedStyle(free).display==='none'||getComputedStyle(free).pointerEvents==='none';
     return !!h && (((/ready$/.test(asset)&&h.classList.contains('bc15-locked-home'))&&freeSafe) || asset==='missing');
   },null,{timeout:12000});
 }
 const newEntry=page.locator('.bc14-subject[data-camp="subject-'+subject+'"]:visible');
 if(await newEntry.count())await newEntry.click();
 else await page.locator('#open-'+subject).click();
}
async function returnFromSubjectOrJourney(page,screen,back,subject){
 if(subject==='norwegian' && await page.locator('#eggenipa-world:visible').count()){
   await page.locator('#eggenipa-world [data-eg="home"]').click();
   await page.locator('#home-screen.active').waitFor();
   return;
 }
 if(subject==='english' && await page.locator('#kinnaklova-world:visible').count()){
   // The direct Kinnaklova hub owns English navigation; #subject-back is hidden.
   const world=page.locator('#subject-screen.active #kinnaklova-world');
   const nav=world.locator('.ki-utility [data-ki="home"]');
   if(await nav.isVisible())await nav.click();
   else await world.locator('.ki-painted-home:visible').click();
   await page.locator('#home-screen.active').waitFor();
   return;
 }
 if(subject==='math' && await page.locator('#tallvika-world:visible').count()){
   await page.locator('#tallvika-world [data-tv="back"]:visible').click();
   await page.locator('#home-screen.active').waitFor();
   return;
 }
 const locked=page.locator(screen+'.active .locked-journey-map[data-journey-subject="'+subject+'"] .locked-journey-back');
 if(await locked.count()){
   await locked.waitFor({state:'visible',timeout:16000});
   await locked.scrollIntoViewIfNeeded();
   await locked.click();
 }else{
   await page.locator(back).click();
 }
 await page.locator('#home-screen.active').waitFor();
}
async function openBack(page,open,screen,back){
 const subject=String(open).replace(/^#open-/,'');
 await openHomeSubject(page,subject);
 await page.locator(screen+'.active').waitFor();
 await returnFromSubjectOrJourney(page,screen,back,subject);
}
async function checkPublishedFractionWorkshop(p,name){
 await openHomeSubject(p,'math');
 await p.locator('#subject-screen.active').waitFor();
 await p.locator('#tallvika-world [data-tv="fraction"]:visible').first().click();
 await p.locator('#fraction-lab-screen.active').waitFor();
 await p.locator('.fr6-workshop').waitFor();
 assert.equal(await p.evaluate(()=>window.LARIA_FRACTION_PREMIUM?.version),'workshop-v1',name+' still has old Brøklab code');
 assert.equal(await p.locator('.fr2-home-card').count(),0,name+' the first action should be touching a cake, not choosing a lesson');
 assert.equal(await p.locator('.fr6-result .fr2-fraction').getAttribute('aria-label'),'1 av 4',name+' expected the numerical fraction beside the cake');
 assert.equal(await p.locator('.fr6-nav .fr2-nav-item').count(),3,name+' child-first navigation has changed');
 const homeWidth=await p.evaluate(()=>[document.documentElement.scrollWidth,innerWidth]);
 assert.ok(homeWidth[0]<=homeWidth[1]+2,name+' Brøklaben home overflows phone: '+homeWidth);
 const fox=await p.locator('.fr2-guide .fr2-fox').first().evaluate(img=>({complete:img.complete,width:img.naturalWidth}));
 assert.ok(fox.complete&&fox.width>0,name+' Brøklaben fox image failed to load');

 await p.locator('.fr6-nav [data-page="home"]').click();
 assert.equal(await p.locator('.fr2-home-card').count(),5,name+' supplementary games must remain available');
 await p.locator('.fr2-card-explore').click();
 assert.equal(await p.locator('.fr2-view').count(),4,name+' missing fraction representations');
 await p.locator('[data-fr-action="preset"][data-n="1"][data-d="2"]').click();
 const half=await p.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot().explore);
 assert.deepEqual([half.n,half.d],[1,2]);
 await p.locator('[data-fr-action="view"][data-view="glass"]').click();
 assert.equal(await p.locator('.fr2-glass').count(),1);

 await p.locator('.fr2-nav-item[data-page="build"]').click();
 await p.locator('[data-fr-action="reset"]').click();
 await p.locator('[data-fr-action="add"]').first().click();
 assert.equal((await p.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot())).build.n,1,name+' cannot place fraction piece');

 await p.locator('.fr2-nav-item[data-page="home"]').click();
 await p.locator('.fr2-card-equal').click();
 await p.locator('[data-fr-action="guess"][data-guess="equal"]').click();
 assert.match(await p.locator('.fr2-feedback').innerText(),/Du fant det/);
 await p.locator('.fr2-nav-item[data-page="home"]').click();
 await p.locator('.fr2-card-sort').click();
 assert.equal(await p.locator('.fr2-sort-card').count(),3);
 await p.locator('[data-fr-action="sort-shift"][data-position="0"][data-direction="1"]').click();
 assert.deepEqual((await p.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot())).sortOrder,[1,0,2]);
 await p.locator('.fr2-nav-item[data-page="home"]').click();

 await p.locator('.fr2-card-convert').click();
 assert.match(await p.locator('.fr2-conversion-row').innerText(),/50 %/);
 assert.match(await p.locator('.fr2-conversion-row').innerText(),/0,5/);
 await p.locator('.fr2-nav-item[data-page="mastery"]').click();
 assert.equal(await p.locator('.fr2-master-tile').count(),5);
 assert.ok(Object.keys((await p.evaluate(()=>LARIA_FRACTION_PREMIUM.progress())).built).length>0,name+' mastery did not save a built fraction');
 await p.locator('.fr2-nav-item[data-page="build"]').click();
 await p.locator('#fraction-lab-back').click();
 await p.locator('#subject-screen.active').waitFor();
 await returnFromSubjectOrJourney(p,'#subject-screen','#subject-back','math');
 console.log('PASS child-first Brøklaben in '+name+': instant cake, supplementary experiments, 1/2, conversions, progress, back navigation');
}
async function existing(engine,name){
 const b=await engine.launch({headless:true}),c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await optionalPopulationUnavailable(c);
 await c.addInitScript(({k,s})=>localStorage.setItem(k,JSON.stringify(s)),{k:KEY,s:seed});
 const p=await c.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(QA_URL+'&runtime='+Date.now(),{waitUntil:'networkidle'});await p.locator('#home-screen.active').waitFor();
 assert.equal(await p.locator('#onboarding').evaluate(x=>x.classList.contains('show')),false);
 await openBack(p,'#open-norwegian','#subject-screen','#subject-back');
 await openBack(p,'#open-english','#subject-screen','#subject-back');
 await openBack(p,'#open-math','#subject-screen','#subject-back');
 await checkPublishedFractionWorkshop(p,name);
 // Return to the immediate Math screen when arriving from a Math module.
 await openHomeSubject(p,'math');
 await p.locator('#subject-screen.active').waitFor();
 await p.locator('#tallvika-world [data-tv="multiply"]:visible').first().click();
 await p.locator('#multiplication-lab-screen.active').waitFor();
 await p.locator('#multiplication-lab-screen.active [data-gm-action="classic"]').click();
 await p.locator('#multiplication-lab-screen.active .mp-home-screen').waitFor();
 await p.locator('.gm-classic-return').click();
 await p.locator('#multiplication-lab-screen.active .gm-shell').waitFor();
 const gameOrigin=await p.locator('#multiplication-lab-screen').getAttribute('data-gm-return-origin');
 assert.equal(gameOrigin,'subject',name+' returning from classic should preserve the Maths origin');
 await p.locator('#multiplication-lab-screen.active .gm-back').click();
 await p.locator('#subject-screen.active').waitFor();
 await returnFromSubjectOrJourney(p,'#subject-screen','#subject-back','math');
 await openBack(p,'#open-geography','#geography-screen','#geography-back');
 await openHomeSubject(p,'norwegian');await p.locator('#eggenipa-world:visible').waitFor();
 await p.locator('#eggenipa-world [data-eg="next"]:not([disabled])').click();
 await p.locator('#session-screen.active').waitFor();await finish(p);
 await p.locator('#complete-home').click();await p.locator('#eggenipa-world:visible').waitFor();
 await returnFromSubjectOrJourney(p,'#subject-screen','#subject-back','norwegian');
 await openHomeSubject(p,'geography');await p.locator('#geography-screen.active').waitFor();await p.locator('#open-world').click();await p.locator('#world-screen.active').waitFor();
 await p.locator('#globe-mode [data-globe-mode="classic"]').waitFor();
 for(const m of ['explore','mine','classic']){await p.locator('#globe-mode [data-globe-mode="'+m+'"]').click();await p.waitForFunction(x=>document.getElementById('world-screen')?.dataset.premiumGlobeMode===x,m)}
 await p.locator('#random-country').click();await p.locator('.premium-country-learn').waitFor({state:'visible'});const country=(await p.locator('#globe-status strong').first().textContent()).trim();
 await p.locator('.premium-country-learn').click();await p.locator('#detail-screen.active').waitFor();await p.locator('#detail-back').click();await p.locator('#world-screen.active').waitFor();
 assert.equal(await p.locator('#world-screen').getAttribute('data-premium-globe-mode'),'classic');assert.equal((await p.locator('#globe-status strong').first().textContent()).trim(),country);
 assert.deepEqual(errs,[],name+' existing profile errors');await c.close();await b.close()
}
async function onboarding(engine,name,avatar){
 const b=await engine.launch({headless:true}),c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await optionalPopulationUnavailable(c);
 const p=await c.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto(QA_URL+'&prepare='+avatar+'&runtime='+Date.now(),{waitUntil:'networkidle'});await p.evaluate(()=>localStorage.clear());await p.reload({waitUntil:'networkidle'});await p.locator('#onboarding.show').waitFor();
 await p.locator('.avatar-choice-card[data-avatar="'+avatar+'"]').click();const n=avatar==='boy'?'Oskar QA':'Ida QA';await p.locator('#profile-name').fill(n);await p.locator('.grade-btn[data-grade="2"]').click();await p.locator('#profile-next').click();await p.locator('#home-screen.active').waitFor();
 let profile=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)).profile,KEY);assert.deepEqual([profile.name,profile.avatar,profile.grade,profile.onboarded],[n,avatar,2,true]);
 await p.reload({waitUntil:'networkidle'});await p.locator('#home-screen.active').waitFor();profile=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)).profile,KEY);assert.deepEqual([profile.name,profile.avatar,profile.grade],[n,avatar,2]);
  // Profile is the source of truth for the Læria fox, including Basecamp.
  // The old static explorer-file assertion was stale once the chosen fox
  // gained its own transparent illustrated WebP for boy and girl.
  // Compare in-page so an assertion never dumps megabytes of base64 into logs.
  const sceneFox=await p.locator('.bc12-fox').evaluate(holder=>{
    const img=holder.querySelector('img');
    const selected=window.LARIA_FOX?.choice();
    const expected=window.LARIA_FOX?.source(selected)||'';
    return {
      chosen:holder.dataset.avatar,selected,
      matchesSelected:!!img&&img.getAttribute('src')===expected,
      usesProfileArtwork:expected.startsWith('data:image/webp;base64,'),
      optionsDistinct:window.LARIA_FOX?.source('boy')!==window.LARIA_FOX?.source('girl'),
      complete:!!img?.complete,naturalWidth:img?.naturalWidth||0,naturalHeight:img?.naturalHeight||0
    };
  });
  assert.equal(sceneFox.chosen,avatar,'Basecamp lost the saved fox avatar');
  assert.equal(sceneFox.selected,avatar,'fox identity does not follow current profile');
  assert.ok(sceneFox.matchesSelected&&sceneFox.usesProfileArtwork,
    'Basecamp must display the selected transparent fox art, not the old rectangular onboarding portrait');
  assert.ok(sceneFox.optionsDistinct,'boy and girl must have distinct selectable fox art');
  assert.ok(sceneFox.complete&&sceneFox.naturalWidth>0&&sceneFox.naturalHeight>0,'Basecamp selected fox image must load');
  assert.equal(profile.avatar,avatar,'saved avatar choice must persist independently of scene artwork');
  assert.deepEqual(errs,[],name+' '+avatar+' onboarding errors');await c.close();await b.close()
}
async function viewport(engine,name,w,h,label){
 const b=await engine.launch({headless:true}),c=await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:w<700,serviceWorkers:'block'}),s=JSON.parse(JSON.stringify(seed));s.profile.grade=2;
 await optionalPopulationUnavailable(c);
 await c.addInitScript(({k,s})=>localStorage.setItem(k,JSON.stringify(s)),{k:KEY,s});const p=await c.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto(QA_URL+'&viewport='+label+'&runtime='+Date.now(),{waitUntil:'networkidle'});await p.locator('.bc12').waitFor({state:'visible'});
 const d=await p.locator('.bc12').evaluate(x=>{const r=x.getBoundingClientRect();return {sw:document.documentElement.scrollWidth,iw:innerWidth,l:r.left,r:r.right,t:r.top,b:r.bottom,ih:innerHeight}});assert.ok(d.sw<=d.iw+1,label+' horizontal overflow');assert.ok(d.l>=-1&&d.r<=d.iw+1,label+' horizontal bounds');assert.ok(d.t>=-1&&d.b<=d.ih+2,label+' vertical bounds');assert.deepEqual(errs,[],name+' '+label+' errors');await c.close();await b.close()
}
(async()=>{for(const [e,n] of [[chromium,'Chromium'],[webkit,'WebKit']]){await existing(e,n);await onboarding(e,n,'boy');await onboarding(e,n,'girl');await viewport(e,n,390,844,'iPhone portrait');await viewport(e,n,820,1180,'iPad portrait');await viewport(e,n,1180,820,'iPad landscape')}console.log('Læria Prompt 1-6 published runtime verification passed in Chromium and WebKit')})().catch(e=>{console.error(e);process.exit(1)});
