'use strict';
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const QA_URL=process.env.QA_URL||'https://almenning.github.io/Flyt-app/laer-litt-mer/?app=laria';
const KEY='laerlittmer-v2';
const seed={version:7,progressSchemaVersion:3,profile:{grade:3,onboarded:true,name:'Runtimebarn',avatar:'boy',setupVersion:2},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};

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
async function openBack(page,open,screen,back){await page.locator(open).click();await page.locator(screen+'.active').waitFor();await page.locator(back).click();await page.locator('#home-screen.active').waitFor()}
async function existing(engine,name){
 const b=await engine.launch({headless:true}),c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await c.addInitScript(({k,s})=>localStorage.setItem(k,JSON.stringify(s)),{k:KEY,s:seed});
 const p=await c.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(QA_URL+'&runtime='+Date.now(),{waitUntil:'networkidle'});await p.locator('#home-screen.active').waitFor();
 assert.equal(await p.locator('#onboarding').evaluate(x=>x.classList.contains('show')),false);
 await openBack(p,'#open-norwegian','#subject-screen','#subject-back');
 await openBack(p,'#open-english','#subject-screen','#subject-back');
 await openBack(p,'#open-math','#subject-screen','#subject-back');
 await openBack(p,'#open-geography','#geography-screen','#geography-back');
 await p.locator('#open-norwegian').click();await p.locator('#subject-screen.active').waitFor();await p.locator('#start-subject-session').click();await p.locator('#session-screen.active').waitFor();await finish(p);
 await p.locator('#complete-home').click();await p.locator('#subject-screen.active').waitFor();await p.locator('#subject-back').click();await p.locator('#home-screen.active').waitFor();
 await p.locator('#open-geography').click();await p.locator('#geography-screen.active').waitFor();await p.locator('#open-world').click();await p.locator('#world-screen.active').waitFor();
 await p.locator('#globe-mode [data-globe-mode="classic"]').waitFor();
 for(const m of ['explore','mine','classic']){await p.locator('#globe-mode [data-globe-mode="'+m+'"]').click();await p.waitForFunction(x=>document.getElementById('world-screen')?.dataset.premiumGlobeMode===x,m)}
 await p.locator('#random-country').click();await p.locator('.premium-country-learn').waitFor({state:'visible'});const country=(await p.locator('#globe-status strong').first().textContent()).trim();
 await p.locator('.premium-country-learn').click();await p.locator('#detail-screen.active').waitFor();await p.locator('#detail-back').click();await p.locator('#world-screen.active').waitFor();
 assert.equal(await p.locator('#world-screen').getAttribute('data-premium-globe-mode'),'classic');assert.equal((await p.locator('#globe-status strong').first().textContent()).trim(),country);
 assert.deepEqual(errs,[],name+' existing profile errors');await c.close();await b.close()
}
async function onboarding(engine,name,avatar){
 const b=await engine.launch({headless:true}),c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 const p=await c.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto(QA_URL+'&prepare='+avatar+'&runtime='+Date.now(),{waitUntil:'networkidle'});await p.evaluate(()=>localStorage.clear());await p.reload({waitUntil:'networkidle'});await p.locator('#onboarding.show').waitFor();
 await p.locator('.avatar-choice-card[data-avatar="'+avatar+'"]').click();const n=avatar==='boy'?'Oskar QA':'Ida QA';await p.locator('#profile-name').fill(n);await p.locator('.grade-btn[data-grade="2"]').click();await p.locator('#profile-next').click();await p.locator('#home-screen.active').waitFor();
 let profile=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)).profile,KEY);assert.deepEqual([profile.name,profile.avatar,profile.grade,profile.onboarded],[n,avatar,2,true]);
 await p.reload({waitUntil:'networkidle'});await p.locator('#home-screen.active').waitFor();profile=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)).profile,KEY);assert.deepEqual([profile.name,profile.avatar,profile.grade],[n,avatar,2]);
  const sceneFox=await p.locator('.bc12-fox img').evaluate(img=>({src:img.getAttribute('src'),naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight}));
  assert.match(sceneFox.src,/lia-fox-explorer\.webp(?:\?|$)/,'Basecamp must use the dedicated in-world mascot instead of the rectangular onboarding portrait');
  assert.ok(sceneFox.naturalWidth>0&&sceneFox.naturalHeight>0,'Basecamp scene mascot must load');
  assert.equal(profile.avatar,avatar,'saved avatar choice must persist independently of scene artwork');
  assert.deepEqual(errs,[],name+' '+avatar+' onboarding errors');await c.close();await b.close()
}
async function viewport(engine,name,w,h,label){
 const b=await engine.launch({headless:true}),c=await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:w<700,serviceWorkers:'block'}),s=JSON.parse(JSON.stringify(seed));s.profile.grade=2;
 await c.addInitScript(({k,s})=>localStorage.setItem(k,JSON.stringify(s)),{k:KEY,s});const p=await c.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto(QA_URL+'&viewport='+label+'&runtime='+Date.now(),{waitUntil:'networkidle'});await p.locator('.bc12').waitFor({state:'visible'});
 const d=await p.locator('.bc12').evaluate(x=>{const r=x.getBoundingClientRect();return {sw:document.documentElement.scrollWidth,iw:innerWidth,l:r.left,r:r.right,t:r.top,b:r.bottom,ih:innerHeight}});assert.ok(d.sw<=d.iw+1,label+' horizontal overflow');assert.ok(d.l>=-1&&d.r<=d.iw+1,label+' horizontal bounds');assert.ok(d.t>=-1&&d.b<=d.ih+2,label+' vertical bounds');assert.deepEqual(errs,[],name+' '+label+' errors');await c.close();await b.close()
}
(async()=>{for(const [e,n] of [[chromium,'Chromium'],[webkit,'WebKit']]){await existing(e,n);await onboarding(e,n,'boy');await onboarding(e,n,'girl');await viewport(e,n,390,844,'iPhone portrait');await viewport(e,n,820,1180,'iPad portrait');await viewport(e,n,1180,820,'iPad landscape')}console.log('Læria Prompt 1-6 published runtime verification passed in Chromium and WebKit')})().catch(e=>{console.error(e);process.exit(1)});
