'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const output=process.env.LARIA_KINNAKLOVA_SCREENSHOTS;
const seed={
 version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'Kinnaklova QA',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
 masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
 lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},
 answerLog:[],sessionLog:[],activeSession:null
};
async function shot(page,label){
 if(!output)return;
 fs.mkdirSync(output,{recursive:true});
 await page.screenshot({path:path.join(output,label+'.png'),fullPage:true,animations:'disabled'});
}
async function visitEnglish(page){
 const tile=page.locator('.bc14-subject[data-camp="subject-english"]');
 await tile.waitFor({state:'visible',timeout:25000});
 await tile.click();
 await page.locator('#subject-screen.active #kinnaklova-world').waitFor({state:'visible',timeout:16000});
}
async function takeActivity(page,action,label){
 await page.locator('#kinnaklova-world .ki-card[data-ki="'+action+'"]').click();
 await page.locator('#session-screen.active .laria-task-card').waitFor({timeout:16000});
 const result=await page.evaluate(()=>({
   subject:sessionScope?.subject,module:sessionScope?.module,
   count:sessionQuestions?.length,question:sessionQuestions?.[qIndex]?.prompt,skills:sessionQuestions?.map(q=>q.skill)
 }));
 assert.equal(result.subject,'english',label+' wrong subject after '+action);
 assert.equal(result.module,action,label+' wrong module after '+action);
 const speechLanguage=await page.evaluate(()=>{
   const scene=document.querySelector('#session-screen.active .laria-task-card');
   const question=scene?.querySelector('.question');
   const choices=scene?.querySelector('.task-interaction');
   const q=sessionQuestions?.[qIndex];
   return {
     prompt:question?.getAttribute('lang'),answers:choices?.getAttribute('lang'),
     question:question?.textContent?.trim()||'',answerLanguage:q?.answerLanguage||null
   };
 });
 const norwegianPrompt=/^(?:Hva|Hvilket|Hvilken|Velg|Finn|Hvor)\b/i.test(speechLanguage.question);
 const expectedAnswers=speechLanguage.answerLanguage==='nb'||/på norsk\??\s*$/i.test(speechLanguage.question)
   ?'nb':'en';
 assert.equal(speechLanguage.prompt,norwegianPrompt?'nb':'en',
   label+' '+action+' VoiceOver question language is incorrect');
 assert.equal(speechLanguage.answers,expectedAnswers,
   label+' '+action+' VoiceOver answer language is incorrect');
 // Direct Kinnaklova has no retired fox actor; the real troll rig arrives
 // as a separately approved art layer, not a static mascot substitution.
 assert.equal(await page.locator('#session-screen.active .task-fox-companion').count(),0,
   label+' '+action+' still renders the retired fox');
 assert.equal(await page.evaluate(()=>state.profile.avatar),'girl',
   label+' '+action+' changed the saved profile identity');
 assert.ok(result.count>=5,label+' missing real learning questions in '+action);
 assert.ok(result.question,label+' empty question in '+action);
 const permitted={words:['words','numbers','spelling','vocabulary'],sentences:['sentence','phrases'],reading:['reading']};
 assert.ok(result.skills.every(skill=>permitted[action].includes(skill)),
   label+' '+action+' unexpectedly contains unrelated English skill: '+result.skills.join(','));
 if(action!=='reading')
   assert.equal(await page.locator('#session-screen.active .ki-reading-story').count(),0,
     label+' '+action+' must not show the Reading book UI');
 return result;
}
async function run(browserType,name,viewport){
 const browser=await browserType.launch({headless:true,args:browserType===chromium?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({
    viewport,isMobile:viewport.width<=480,hasTouch:true,
    reducedMotion:'reduce',serviceWorkers:'block'
  });
  await context.addInitScript(initial=>{
    if(!localStorage.getItem('laerlittmer-v2'))
      localStorage.setItem('laerlittmer-v2',JSON.stringify(initial));
  },seed);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
  await visitEnglish(page);
  const world=page.locator('#kinnaklova-world');
  assert.equal(await world.locator('.ki-card').count(),3,name+' missing three direct English places');
  assert.equal(await world.locator('.ki-painted-hit').count(),4,name+' missing painted sign and home hitboxes');
  assert.equal(await world.locator('.ki-master').getAttribute('width'),'1672',name+' wrong art width');
  assert.equal(await world.locator('.ki-master').getAttribute('height'),'941',name+' wrong art height');
  assert.equal(await page.locator('#subject-screen.locked-journey-active').count(),0,name+' old map still active');
  const before=await page.evaluate(()=>JSON.stringify({
    nodes:window.LARIA_TALLVIKA_BRIDGE.state().journey?.nodes||{},
    sessionLog:window.LARIA_TALLVIKA_BRIDGE.state().sessionLog||[],
    answerLog:window.LARIA_TALLVIKA_BRIDGE.state().answerLog||[]
  }));
  const configuredArt=await world.locator('.ki-master').getAttribute('src');
  if(configuredArt){
    // A release candidate must complete its SHA verification before the
    // capture. The former draft assertion accepted the temporary placeholder
    // and could report green device QA while the child still saw no scene.
    try{
      await page.waitForFunction(()=>document.querySelector('#kinnaklova-world')?.dataset.kiArt==='ready',
        null,{timeout:20000});
    }catch(error){
      const state=await page.evaluate(()=>{
        const world=document.querySelector('#kinnaklova-world'),image=world?.querySelector('.ki-master');
        return {status:world?.dataset.kiArt,reason:world?.dataset.kiArtReason,
          src:image?.getAttribute('src'),natural:[image?.naturalWidth,image?.naturalHeight]};
      });
      throw Error(name+' configured clean art did not become ready: '+JSON.stringify(state)+'; '+error.message);
    }
  }
  const art=await world.locator('.ki-master').evaluate(async img=>{
    try{await img.decode()}catch(_){}
    const rect=img.getBoundingClientRect();
    return {ready:img.naturalWidth===1672&&img.naturalHeight===941,
      width:rect.width,height:rect.height,naturalWidth:img.naturalWidth};
  });
  assert.ok(art.width>250,name+' no stage visible');
  assert.ok(Math.abs(art.height-art.width*941/1672)<3,name+' must not crop approved art');
  const documents=await world.locator('.ki-troll').evaluateAll(els=>els.map(el=>({
    id:el.dataset.kiCharacter,src:el.getAttribute('src')
  })));
  assert.deepEqual(documents.map(el=>el.id),['storesoster','lillebror','lillesoster']);
  assert.deepEqual(documents.map(el=>el.src),[
    './assets/kinnaklova/storesoster-inworld-approved-20261026.webp',
    './assets/gangemagi-troll/lillebror.webp',
    './assets/gangemagi-troll/lillesoster.webp'
  ],name+' must use the already painted approved Storesøster and unchanged other originals');
  if(art.ready){
    assert.equal(await page.evaluate(()=>window.LARIA_KINNAKLOVA.ready()),true);
    assert.equal(await world.locator('.ki-companions').isVisible(),true);
    if(viewport.width>700){
      const targets=await world.locator('.ki-painted-hit').evaluateAll(els=>els.map(el=>{
        const box=el.getBoundingClientRect();
        return {name:el.dataset.ki,width:box.width,height:box.height};
      }));
      assert.ok(targets.every(t=>t.width>=44&&t.height>=44),
        name+' interactive painted signs too small '+JSON.stringify(targets));
    }
  }else{
    assert.equal(await page.evaluate(()=>window.LARIA_KINNAKLOVA.ready()),false);
    assert.equal(await world.locator('.ki-companions').isVisible(),false,
      name+' must not reveal trolls over a missing/unclean background');
    assert.equal(await world.locator('.ki-master').isVisible(),false,
      name+' must never flash an unapproved painted background');
    await world.locator('.ki-art-unavailable:visible').waitFor();
  }
  const overflow=await page.evaluate(()=>({
    scroll:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth
  }));
  assert.ok(overflow.scroll<=overflow.viewport+2,
    name+' horizontal overflow '+JSON.stringify(overflow));
  if(viewport.width<=700){
    assert.equal(await world.locator('.ki-utility').isVisible(),true,name+' missing mobile Home');
  }
  await shot(page,name+'-firstfold');
  assert.equal(await page.evaluate(()=>JSON.stringify({
    nodes:window.LARIA_TALLVIKA_BRIDGE.state().journey?.nodes||{},
    sessionLog:window.LARIA_TALLVIKA_BRIDGE.state().sessionLog||[],
    answerLog:window.LARIA_TALLVIKA_BRIDGE.state().answerLog||[]
  })),before,name+' landing must not modify child learning data');
  const first=await takeActivity(page,'words',name);
  await shot(page,name+'-words');
  await page.locator('#close-session').click();
  await world.waitFor({state:'visible',timeout:16000});
  await world.locator('.ki-resume [data-ki="resume"]').waitFor({state:'visible',timeout:10000});
  await world.locator('.ki-resume [data-ki="resume"]').click();
  await page.locator('#session-screen.active .laria-task-card').waitFor({timeout:16000});
  const resumed=await page.evaluate(()=>({subject:sessionScope?.subject,module:sessionScope?.module,question:sessionQuestions?.[qIndex]?.prompt}));
  assert.deepEqual(resumed,{subject:'english',module:'words',question:first.question},
    name+' resume changed the saved English session');
  await page.locator('#close-session').click();
  await world.waitFor({state:'visible',timeout:16000});
  await takeActivity(page,'sentences',name);
  await page.locator('#close-session').click();
  await world.waitFor({state:'visible',timeout:16000});
  await takeActivity(page,'reading',name);
  const passage=page.locator('#session-screen.active .learning-passage');
  await passage.waitFor({state:'visible',timeout:10000});
  const displayed=(await passage.textContent()||'').trim();
  const selected=await page.evaluate(()=>sessionQuestions?.[qIndex]?.passage||'');
  assert.equal(displayed,selected,name+' Reading text was not actually rendered for the child');
  const order=await page.evaluate(()=>{
    const story=document.querySelector('#session-screen.active .ki-reading-story');
    const question=document.querySelector('#session-screen.active .ki-reading-question');
    return {
      story:!!story,question:!!question,
      before:!!(story&&question&&(story.compareDocumentPosition(question)&Node.DOCUMENT_POSITION_FOLLOWING)),
      label:story?.getAttribute('aria-label'),
      storyLang:story?.getAttribute('lang'),
      questionLang:question?.getAttribute('lang'),
      pageWidth:story?.getBoundingClientRect().width,
      viewportWidth:document.documentElement.clientWidth
    };
  });
  assert.ok(order.story&&order.question&&order.before,
    name+' must show the Reading story before asking the question');
  assert.equal(order.label,'Engelsk historie');
  assert.equal(order.storyLang,'en',name+' story must be announced in English by screen readers');
  assert.equal(order.questionLang,'en',name+' question must be announced in English by screen readers');
  const speechOrder=await page.evaluate(()=>speechSegmentsForQuestion(sessionQuestions[qIndex]).slice(0,2));
  assert.deepEqual(speechOrder[0],{text:selected,lang:'en-GB'},
    name+' reading audio must start with the actual English story');
  assert.equal(speechOrder[1]?.lang,'en-GB',
    name+' English question must use an English voice');
  assert.ok(order.pageWidth<=order.viewportWidth+2,
    name+' storybook must fit the narrow viewport');
  const readButton=page.locator('#session-screen.active #read-aloud');
  if(await readButton.count())
    assert.equal(await readButton.getAttribute('aria-label'),'Les opp historien og spørsmålet');
  const readingOverflow=await page.evaluate(()=>({
    scroll:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth
  }));
  assert.ok(readingOverflow.scroll<=readingOverflow.viewport+2,
    name+' Reading spills off screen '+JSON.stringify(readingOverflow));
  await shot(page,name+'-reading');
  await page.locator('#close-session').click();
  await world.waitFor({state:'visible',timeout:16000});
  await shot(page,name+'-return');
  // The clean painted background switches navigation controls when image integrity
  // settles. Wait before deciding, otherwise the temporary utility link can vanish
  // during a Playwright click on iPad.
  await page.waitForFunction(()=>{
    const host=document.querySelector('#subject-screen.active #kinnaklova-world');
    return ['ready','missing','unapproved'].includes(host?.dataset.kiArt);
  },null,{timeout:20000});
  const utility=world.locator('.ki-utility [data-ki="home"]');
  if(await utility.isVisible())await utility.click();
  else await world.locator('.ki-painted-home').click();
  await page.locator('#home-screen.active .bc14-subject').first().waitFor({timeout:16000});
  assert.deepEqual(errors,[],name+' runtime JS errors');
  console.log('[KINNAKLOVA]',name,'direct English, resume, return',art.ready?'ART READY':'ART MISSING (draft release gate)');
  await context.close();
 }finally{await browser.close();}
}
async function rejectPoisonedSameSizeArt(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:1194,height:834},serviceWorkers:'block'});
  await context.addInitScript(initial=>{
   localStorage.setItem('laerlittmer-v2',JSON.stringify(initial));
  },seed);
  const page=await context.newPage(),artRequests=[];
  page.on('request',request=>{
   if(request.url().includes('kinnaklova-scene-clean-approved-20261026.webp'))
    artRequests.push(request.url());
  });
  const unrelatedImage=path.join(__dirname,'..','laer-litt-mer','assets','norsk','eggenipa-master-laast-20261025.png');
  // A valid image with the exact right dimensions, but not the approved
  // clean Kinnaklova master, must not activate painted signs or troll layers.
  await page.route('**/assets/kinnaklova/kinnaklova-scene-clean-approved-20261026.webp',
    route=>route.fulfill({path:unrelatedImage,contentType:'image/png'}));
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
  await visitEnglish(page);
  const painted=page.locator('#kinnaklova-world .ki-master');
  const source=await painted.getAttribute('src');
  if(source===null){
   // Before human approval: no missing-asset fetches, no rejected characters,
   // and the normal Words/Sentences/Reading cards remain fully available.
   assert.deepEqual(artRequests,[],'Draft must not request an unapproved clean background');
   assert.equal(await page.locator('#kinnaklova-world').getAttribute('data-ki-art'),'missing');
   await page.locator('#kinnaklova-world .ki-art-unavailable:visible').waitFor();
  }else{
   // Once a clean master SHA is approved, same-size art with incorrect bytes
   // must still be rejected by the browser's exact SHA-256 protection.
   await page.waitForFunction(()=>{
    const el=document.querySelector('#kinnaklova-world .ki-master');
    return el?.complete&&el.naturalWidth===1672&&el.naturalHeight===941;
   },null,{timeout:15000});
   assert.ok(artRequests.length>=1,'Release asset should be requested only with a locked SHA');
   assert.equal(await page.locator('#kinnaklova-world').getAttribute('data-ki-art'),'unapproved');
  }
  assert.equal(await painted.isVisible(),false,'Wrong 1672x941 art must be invisible');
  assert.equal(await page.locator('#kinnaklova-world .ki-companions').isVisible(),false);
  assert.equal(await page.locator('#kinnaklova-world .ki-painted-words').isVisible(),false);
  assert.equal(await page.locator('#kinnaklova-world .ki-card').count(),3,
   'Even with incorrect art, real English activities must remain reachable');
  console.log('[KINNAKLOVA] missing or poisoned art correctly blocked in Chromium');
  await context.close();
 }finally{await browser.close()}
}

// A one-grade-lower profile must get actual Reading tasks, never random
// Words/Sentences content falsely presented as "Reading" on Kinnaklova.
async function firstGradeReading(engine,label){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 try{
  const grade1=JSON.parse(JSON.stringify(seed));
  grade1.profile.grade=1;
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),grade1);
  const page=await context.newPage();
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
  await visitEnglish(page);
  await takeActivity(page,'reading',label+' first grade');
  const stories=await page.evaluate(()=>sessionQuestions.map(q=>({
   skill:q.skill,type:q.type,passage:q.passage,options:q.options
  })));
  assert.equal(stories.length,5,label+' first-grade Reading must have five real stories');
  assert.ok(stories.every(q=>q.skill==='reading'&&q.type==='learning-choice'&&
   typeof q.passage==='string'&&q.passage.split(' ').length<=17),
   label+' first-grade Reading content is missing or too complex');
  assert.ok(new Set(stories.map(q=>q.passage)).size===5,
   label+' same Reading story repeated in one session');
  const firstText=await page.locator('#session-screen.active .learning-passage').textContent();
  assert.equal(firstText.trim(),stories[0].passage,
    label+' first-grade Reading story is not actually visible on the task card');
  const storyFirst=await page.evaluate(()=>{
    const story=document.querySelector('#session-screen.active .ki-reading-story');
    const question=document.querySelector('#session-screen.active .ki-reading-question');
    return !!(story&&question&&(story.compareDocumentPosition(question)&Node.DOCUMENT_POSITION_FOLLOWING));
  });
  if(!storyFirst){
    const debug=await page.evaluate(()=>({
      scope:typeof sessionScope==='object'?sessionScope:null,
      skill:sessionQuestions?.[qIndex]?.skill,
      type:sessionQuestions?.[qIndex]?.type,
      story:document.querySelector('#session-screen.active .ki-reading-story')?.outerHTML?.slice(0,300)||null,
      question:document.querySelector('#session-screen.active .ki-reading-question')?.outerHTML?.slice(0,300)||null,
      activeScreen:document.querySelector('#session-screen')?.className,
      markup:document.querySelector('#question-wrap')?.innerHTML?.slice(0,650)
    }));
    console.error('[KINNAKLOVA] grade 1 story-order details',JSON.stringify(debug));
  }
  assert.equal(storyFirst,true,label+' first-grade story must also come before the question');
  assert.equal(await page.locator('#session-screen.active .ki-reading-story').getAttribute('lang'),'en');
  assert.equal(await page.locator('#session-screen.active .ki-reading-question').getAttribute('lang'),'en');
  const spoken=await page.evaluate(()=>speechSegmentsForQuestion(sessionQuestions[qIndex]));
  assert.deepEqual(spoken[0],{text:stories[0].passage,lang:'en-GB'},
    label+' first-grade read-aloud must begin with the English story');
  console.log('[KINNAKLOVA] '+label+' grade 1: five short Reading stories verified');
  await context.close();
 }finally{await browser.close()}
}

(async()=>{
 await rejectPoisonedSameSizeArt();
 await firstGradeReading(chromium,'chromium');
 await firstGradeReading(webkit,'webkit');
 for(const [label,viewport] of [
   ['iphone-portrait',{width:390,height:844}],
   ['iphone-landscape',{width:844,height:390}],
   ['ipad-portrait',{width:834,height:1112}],
   ['ipad-landscape',{width:1194,height:834}]
 ]){
   await run(chromium,'chromium-'+label,viewport);
   await run(webkit,'webkit-'+label,viewport);
 }
})().catch(error=>{console.error(error);process.exitCode=1});
