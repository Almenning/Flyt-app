'use strict';
// Approved Eggenipa art + direct Norsk play. No Bokskogen journey map.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const out=process.env.LARIA_EGGENIPA_SCREENSHOTS;
const state={
 version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Eggenipa QA',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},
 skillEvidence:{},preferences:{sound:false,autoRead:false},lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{},chapterProgress:{}},answerLog:[],sessionLog:[],activeSession:null
};
async function shot(page,label,fullPage=false){
 if(!out)return;
 fs.mkdirSync(out,{recursive:true});
 // A full-page screenshot can relocate position:fixed overlays below
 // the long Eggenipa page in WebKit. Capture the actual visible fold for
 // activity dialogs, and the full illustration only for the world page.
 await page.screenshot({path:path.join(out,label+'.png'),animations:'disabled',fullPage});
}
async function assertOverlayInViewport(page,selector,backSelector,label){
 const snapshot=await page.locator(selector).evaluate((el,backSelector)=>{
  const r=el.getBoundingClientRect(),b=el.querySelector(backSelector)?.getBoundingClientRect();
  const x=b?(b.left+b.right)/2:null,y=b?(b.top+b.bottom)/2:null;
  const target=x!==null?document.elementFromPoint(x,y):null;
  return {position:getComputedStyle(el).position,top:r.top,left:r.left,right:r.right,
    bottom:r.bottom,width:innerWidth,height:innerHeight,
    back:b?{x,y,width:b.width,height:b.height,
      hit:!!target&&(target===el.querySelector(backSelector)||el.querySelector(backSelector)?.contains(target))}:null};
 },backSelector);
 assert.equal(snapshot.position,'fixed',label+' activity must cover the viewport');
 assert.ok(Math.abs(snapshot.left)<=2&&Math.abs(snapshot.top)<=2&&
   snapshot.right>=snapshot.width-2&&snapshot.bottom>=snapshot.height-2,
   label+' activity overlay is offset or cropped: '+JSON.stringify(snapshot));
 assert.ok(snapshot.back&&snapshot.back.width>=44&&snapshot.back.height>=44&&
   snapshot.back.x>=0&&snapshot.back.x<=snapshot.width&&
   snapshot.back.y>=0&&snapshot.back.y<=snapshot.height&&snapshot.back.hit,
   label+' return control is not accessible in the first visible fold: '+JSON.stringify(snapshot));
}
async function run(engine,browserType,view,viewport){
 const browser=await browserType.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({
   viewport,hasTouch:true,isMobile:view.startsWith('iphone'),serviceWorkers:'block',reducedMotion:'reduce'
  });
  await context.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),state);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:80000});
  await page.locator('.bc14-subject[data-camp="subject-norwegian"]').waitFor({state:'visible',timeout:20000});
  await page.locator('.bc14-subject[data-camp="subject-norwegian"]').tap();
  await page.locator('#eggenipa-world:visible').waitFor({timeout:16000});
  const label=engine+'-'+view;
  const master=await page.locator('#eggenipa-world .eg-master').evaluate(async img=>{
   await img.decode();
   return {w:img.naturalWidth,h:img.naturalHeight};
  });
  assert.deepEqual(master,{w:1672,h:941},label+' wrong locked art');
  const before=await page.evaluate(()=>structuredClone(JSON.parse(localStorage.getItem('laerlittmer-v2')).journey.nodes));
  const portals=await page.locator('#eggenipa-world .eg-portal').evaluateAll(list=>list.map(b=>b.dataset.eg));
  assert.deepEqual(portals,['words','find','reading'],label+' wrong three learning places');
  assert.equal(await page.locator('#eggenipa-world [data-eg="map"],#eggenipa-world .eg-next').count(),0,
    label+' retired journey CTA is still shown');
  assert.equal(await page.locator('#subject-screen.active .locked-journey-map:visible').count(),0,label+' map unexpectedly visible');
  assert.equal(await page.locator('#eggenipa-world .eg-grade').evaluate(el=>el.tagName),'SPAN',label+' grade must not be false selector');
  if(viewport.width>700){
    const hits=await page.locator('#eggenipa-world .eg-scene-hit').evaluateAll(list=>
      list.map(el=>({name:el.dataset.eg,r:el.getBoundingClientRect().toJSON(),display:getComputedStyle(el).display})));
    assert.deepEqual(hits.map(x=>x.name),['words','find','reading']);
    assert.ok(hits.every(x=>x.display!=='none'&&x.r.width>=44&&x.r.height>=44),label+' unusable hotspots');
  }
  await shot(page,label+'-eggenipa',true);

  await page.locator('#eggenipa-world .eg-portal[data-eg="words"]').tap();
  await page.locator('#word-hunt-overlay:not([hidden]) .word-hunt-theme-picker:not([hidden])').waitFor({timeout:12000});
  assert.equal(await page.locator('#word-hunt-overlay .wh-theme-close').getAttribute('aria-label'),'Tilbake til Norsk',
    label+' theme back button names the wrong return world');
  await assertOverlayInViewport(page,'#word-hunt-overlay','.wh-theme-close',label+' Ordjakt');
  assert.equal(await page.locator('#word-hunt-overlay img[src*="/assets/fox/"],#word-hunt-overlay img[src*="lia-fox"]').count(),0,
    label+' old fox image in Ordjakt');
  await shot(page,label+'-ordjakt-theme');
  await page.locator('#word-hunt-overlay .wh-theme-close').tap();
  await page.locator('#eggenipa-world:visible').waitFor({timeout:12000});

  await page.locator('#eggenipa-world .eg-portal[data-eg="find"]').tap();
  await page.locator('#find-the-words-overlay:not([hidden])').waitFor({timeout:12000});
  assert.equal(await page.locator('#find-the-words-overlay .fw-back').getAttribute('aria-label'),'Tilbake til Norsk',
    label+' Finn ordene back button names the wrong return world');
  await assertOverlayInViewport(page,'#find-the-words-overlay','.fw-back',label+' Finn ordene');
  assert.equal(await page.locator('#find-the-words-overlay .fw-fox').evaluate(el=>el.tagName),'SPAN',
    label+' old static fox image in Finn ordene');
  // Check the actual screen hit target, not just existence in the DOM.
  // The previous absolute fox layout let footer/next buttons steal taps.
  const help=page.locator('#find-the-words-overlay .fw-fox-button');
  // The footer is scrollable on a short phone. Do not let scroll-into-view
  // conceal a broken first fold when validating the fixed dialog itself.
  await shot(page,label+'-finn-ordene-firstfold');
  await help.scrollIntoViewIfNeeded();
  const touch=await help.evaluate(el=>{
    const r=el.getBoundingClientRect();
    const x=r.left+r.width/2,y=r.top+r.height/2;
    const target=document.elementFromPoint(x,y);
    return {x,y,width:r.width,height:r.height,viewportWidth:innerWidth,
      viewportHeight:innerHeight,target:target?.className||target?.tagName,
      canTap:target===el||el.contains(target)};
  });
  assert.ok(touch.canTap&&touch.width>=44&&touch.height>=44,
    label+' Finn ordene hint is obscured by the footer or next control: '+JSON.stringify(touch));
  await help.tap();
  await shot(page,label+'-finn-ordene');
  await page.locator('#find-the-words-overlay .fw-back').tap();
  await page.locator('#eggenipa-world:visible').waitFor({timeout:12000});

  await page.locator('#eggenipa-world .eg-portal[data-eg="reading"]').tap();
  await page.locator('#session-screen.active').waitFor({timeout:14000});
  const question=await page.evaluate(()=>({
   subject:sessionScope?.subject,module:sessionScope?.module,grade:sessionScope?.grade,
   text:sessionQuestions?.[qIndex]?.prompt
  }));
  assert.equal(question.subject,'norwegian',label+' wrong subject engine');
  assert.equal(question.module,'reading',label+' wrong reading module');
  assert.equal(question.grade,2,label+' profile grade changed');
  assert.ok(question.text,label+' missing reading question');
  assert.equal(await page.locator('#session-screen.active .task-world-chip').textContent(),'Eggenipa',
    label+' old Bokskogen name remains in reading lesson');
  assert.equal(await page.locator('#session-screen.active .task-fox-companion').count(),0,
    label+' legacy fox is still inside the Norwegian lesson');
  assert.equal(await page.locator('#session-screen.active .task-norsk-guide').count(),1,
    label+' neutral Norwegian guide missing');
  // Short landscape Safari must make the answers reachable without scrolling
  // or guessing below the fold. Inspect actual layout and real hit targets.
  if(view==='iphone-landscape'){
    await shot(page,label+'-lesekroken-landscape-firstfold');
    const readTarget=await page.locator('#session-screen.active .read-aloud').evaluate(el=>{
      const r=el.getBoundingClientRect();
      const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
      return {width:r.width,height:r.height,y:r.top,bottom:r.bottom,viewport:innerHeight,
        hit:hit===el||el.contains(hit)};
    });
    assert.ok(readTarget.width>=44&&readTarget.height>=44&&readTarget.y>=0&&
      readTarget.bottom<=readTarget.viewport+1&&readTarget.hit,
      label+' Les opp must be a real 44px touch target: '+JSON.stringify(readTarget));
    const cardLayout=await page.evaluate(()=>{
      const selectors={
        screen:'#session-screen.active',top:'#session-screen .session-top',
        wrap:'#question-wrap',card:'.laria-task-card',head:'.task-card-head',
        question:'.question',scene:'.task-visual-companion-stage',
        illustration:'.task-visual-row',guide:'.task-norsk-guide',
        interaction:'.task-interaction'
      };
      return Object.fromEntries(Object.entries(selectors).map(([name,selector])=>{
        const el=document.querySelector(selector),r=el?.getBoundingClientRect();
        return [name,r?{y:Math.round(r.y),h:Math.round(r.height),
          display:getComputedStyle(el).display,
          minHeight:getComputedStyle(el).minHeight}:null];
      }));
    });
    const choices=await page.locator('#session-screen.active .answer').evaluateAll(items=>
      items.slice(0,3).map(item=>{
        const r=item.getBoundingClientRect();
        const target=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
        return {text:item.textContent.trim(),x:r.x,y:r.y,w:r.width,h:r.height,
          bottom:r.bottom,viewport:innerHeight,hit:target===item||item.contains(target)};
      }));
    assert.equal(choices.length,3,label+' Lesekroken must offer three real touch choices');
    assert.ok(choices.every(a=>a.w>=44&&a.h>=44&&a.y>=0&&a.bottom<=a.viewport+1&&a.hit),
      label+' short landscape Lesekroken obscures answers: '+JSON.stringify({choices,cardLayout}));
  }
  await shot(page,label+'-lesekroken');
  await page.locator('#close-session').tap();
  await page.locator('#eggenipa-world:visible').waitFor({timeout:12000});
  const resume=page.locator('#eggenipa-world [data-eg="resume"]');
  await resume.waitFor({state:'visible',timeout:10000});
  await resume.tap();
  await page.locator('#session-screen.active').waitFor({timeout:12000});
  await page.locator('#close-session').tap();
  await page.locator('#eggenipa-world:visible').waitFor({timeout:12000});

  const after=await page.evaluate(()=>({
   nodes:JSON.parse(localStorage.getItem('laerlittmer-v2')).journey.nodes,
   grade:JSON.parse(localStorage.getItem('laerlittmer-v2')).profile.grade
  }));
  assert.deepEqual(after.nodes,before,label+' changed historical journey progress');
  assert.equal(after.grade,2,label+' changed profile grade');
  assert.deepEqual(errors,[],label+' runtime errors');
  await page.locator('#eggenipa-world .eg-home').tap();
  await page.locator('#home-screen.active').waitFor({timeout:12000});
  console.log('[Norsk premium]',label,'Eggenipa, Ordjakt, Finn ordene, Lesekroken and resume OK');
  await context.close();
 }finally{await browser.close();}
}
(async()=>{
 for(const [view,viewport] of [
  ['iphone-portrait',{width:390,height:844}],
  ['iphone-landscape',{width:844,height:390}],
  ['ipad-portrait',{width:834,height:1112}],
  ['ipad-landscape',{width:1194,height:834}]
 ])for(const [engine,browser] of [['chromium',chromium],['webkit',webkit]]){
  await run(engine,browser,view,viewport);
 }
})().catch(error=>{console.error(error);process.exitCode=1});
