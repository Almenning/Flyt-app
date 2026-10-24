'use strict';
/* Gangemagi: true child-sized first viewport + real interactions in Chromium/WebKit. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const Engine=require('../laer-litt-mer/multiplication-gangemagi-engine-v1.js');
const {chromium,webkit}=require('playwright');
const base=path.resolve(__dirname,'..');
const out=process.env.QA_SCREENSHOTS||'/tmp/laria-gangemagi-v1';
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
function serve(){return new Promise((resolve,reject)=>{const srv=http.createServer((req,res)=>{let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(name.endsWith('/'))name+='index.html';const file=path.resolve(base,'.'+name);if(!file.startsWith(base+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(file,(err,buf)=>{if(err){res.writeHead(404);res.end('Not found');return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(buf);});});srv.once('error',reject);srv.listen(0,'127.0.0.1',()=>resolve({srv,url:'http://127.0.0.1:'+srv.address().port+'/laer-litt-mer/?app=laria'}));});}
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Elev',avatar:'girl',setupVersion:2},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
async function shot(page,name){await fs.promises.mkdir(out,{recursive:true});await page.screenshot({path:path.join(out,name+'.png'),fullPage:true,animations:'disabled'});}
/* All authored adventures must use real multiplication, unique collectibles,
   and keep progress after replays and saved-state restoration. */
function auditAllEightMissions(){
 const specs=Engine.MISSIONS;
 assert.equal(specs.length,8,'all eight locked missions must exist');
 assert.equal(new Set(specs.map(m=>m.id)).size,8,'unique permanent flower identifiers');
 let state=Engine.initial();
 for(const [index,mission] of specs.entries()){
   state=Engine.apply(state,{type:'mission',index});
   assert.deepEqual(state.counts,Array(mission.groups).fill(0),'new mission resets fruit, not flowers');
   for(let group=0;group<mission.groups;group++){
     for(let berry=1;berry<=mission.each;berry++){
       const was=Engine.total(state);
       state=Engine.apply(state,{type:'add',group});
       assert.equal(Engine.total(state),was+1,'one action adds exactly one strawberry');
       assert.equal(state.counts[group],berry,'wicker contents reflect reality');
       if(group!==mission.groups-1||berry!==mission.each){
         assert.equal(Engine.filled(state),false,'partial baskets never finish the mission');
         assert.equal(state.wins.length,index,'no blossom may be earned early');
       }
       assert.equal(Engine.equation(state).target,
         mission.groups+' × '+mission.each+' = '+mission.groups*mission.each,
         'authored multiplication stays correct while exploring');
     }
   }
   assert.equal(Engine.filled(state),true,'the mission can really be completed');
   for(let group=0;group<mission.groups;group++){
     const before=Engine.total(state);
     const again=Engine.apply(state,{type:'add',group});
     assert.equal(Engine.total(again),before,'a full basket cannot gain an extra fruit');
     assert.equal(again.wins.length,index+1,'completed reward cannot be duplicated by extra taps');
   }
   assert.equal(Engine.equation(state).addition,
     Array(mission.groups).fill(mission.each).join(' + ')+' = '+mission.groups*mission.each,
     'finished addition must match the true strawberries in all eight adventures');
   assert.equal(Engine.equation(state).multiplication,
     mission.groups+' × '+mission.each+' = '+mission.groups*mission.each,
     'completed multiplication is mathematically correct');
   assert.equal(state.wins.length,index+1,'exactly one new flower per completed adventure');
   state=Engine.normalize(JSON.parse(JSON.stringify(state)));
   assert.equal(state.wins.length,index+1,'flower progress survives JSON restore');
 }
 state=Engine.apply(state,{type:'mission',index:3});
 for(let group=0;group<state.groups;group++)
   for(let berry=0;berry<state.each;berry++)state=Engine.apply(state,{type:'add',group});
 assert.equal(state.wins.length,8,'replaying a favorite never duplicates a flower');
 const free=Engine.apply(state,{type:'mode',mode:'free'});
 assert.equal(free.wins.length,8,'free play never erases earned flowers');
 console.log('PASS GANGEMAGI all eight missions: maths, replay, saved progress');
}
async function chooseTrollAndPlace(page,troll,group){
  const before=await page.evaluate(()=>LARIA_GANGEMAGI.snapshot());
  await page.locator('[data-gm-action="troll"][data-gm-troll="'+troll+'"]').click();
  const picked=await page.evaluate(()=>LARIA_GANGEMAGI.snapshot());
  assert.equal(picked.selectedTroll,troll,'chosen locked troll is recorded for the placement');
  assert.equal(picked.holdingBerry,true,'choosing a troll picks exactly one berry before a destination exists');
  assert.deepEqual(picked.counts,before.counts,'troll choice alone cannot change the maths');
  await page.locator('[data-gm-action="basket"][data-gm-basket="'+group+'"] .gm-crate-front').click();
  await page.waitForFunction(({group,expected})=>window.LARIA_GANGEMAGI.snapshot().counts[group]===expected,
    {group,expected:before.counts[group]+1});
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).holdingBerry,false,
    'berry leaves the troll hand after delivery');
}
async function selectAndPick(page,group,count){
  const troll=group%3;
  for(let i=0;i<count;i++)await chooseTrollAndPlace(page,troll,group);
}
async function dragBerry(page,fromSelector,toSelector,expectTarget){
  const from=page.locator(fromSelector).first(),to=page.locator(toSelector).first();
  const a=await from.boundingBox(),b=await to.boundingBox();
  assert.ok(a&&b,'source and target must both be visible for drag play');
  await page.mouse.move(a.x+a.width/2,a.y+a.height/2);
  await page.mouse.down();
  await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:9});
  if(expectTarget)assert.equal(await page.locator(expectTarget).count(),1,
    'dragging over a valid target must give a visible live glow');
  await page.mouse.up();
}
// Browser-generated touch taps are tested separately below. This additionally
// exercises the same pointer flow with pointerType=touch while moving a berry.
async function touchPointerDrag(page,fromSelector,toSelector){
 return page.evaluate(({fromSelector,toSelector})=>{
   const from=document.querySelector(fromSelector),to=document.querySelector(toSelector);
   if(!from||!to)throw Error('Touch drag needs a real source and destination');
   const a=from.getBoundingClientRect(),b=to.getBoundingClientRect();
   const x=a.left+a.width/2,y=a.top+a.height/2;
   const dx=b.left+b.width/2,dy=b.top+b.height/2;
   const emit=(target,type,xx,yy)=>target.dispatchEvent(new PointerEvent(type,{
     bubbles:true,cancelable:true,pointerId:71,pointerType:'touch',
     button:0,buttons:type==='pointerup'?0:1,clientX:xx,clientY:yy
   }));
   emit(from,'pointerdown',x,y);
   for(let i=1;i<=9;i++)emit(window,'pointermove',x+(dx-x)*i/9,y+(dy-y)*i/9);
   emit(window,'pointerup',dx,dy);
 },{fromSelector,toSelector});
}
async function check(engine,label,viewport,url){
 const context=await engine.newContext({viewport,deviceScaleFactor:1,serviceWorkers:'block',isMobile:viewport.width<750,hasTouch:true});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.addInitScript(s=>{localStorage.setItem('laerlittmer-v2',JSON.stringify(s));},seed);
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.LARIA_GANGEMAGI?.version==='playable-v1');
  // Navigate to the actual home screen before checking the home palette:
  // the app may legitimately restore an active lab during startup.
  await page.evaluate(()=>showScreen('home'));
  await page.locator('#home-screen.active').waitFor();
  const homeTheme=await page.locator('.app').evaluate(el=>({
    young:el.classList.contains('grade-band-young'),
    image:getComputedStyle(el).backgroundImage,
    color:getComputedStyle(el).backgroundColor,
    gameActive:!!el.querySelector('#multiplication-lab-screen.active .gm-shell')
  }));
  assert.equal(homeTheme.gameActive,false,
    label+' the home-background check must run on Home, never inside Gangemagi');
  // Home's artwork can live on nested layers; compare its original paint
  // after returning instead of demanding a gradient on the .app wrapper.
  await page.evaluate(()=>window.openMultiplicationLab());
  await page.locator('#multiplication-lab-screen.active .gm-shell').waitFor();
  // Always preserve a first-look screenshot before geometry assertions. If a
  // later premium gate fails, reviewers still get the exact rendered scene.
  await shot(page,label+'-00-diagnostic-first-look');
  assert.equal(await page.locator('.gm-story.gm-quest').evaluate(el=>getComputedStyle(el).display),'block',
    label+' mission board must not inherit the old horizontal flex story layout');
  assert.equal(await page.locator('.gm-crate').count(),3);
  const bookQuickBox=await page.locator('.gm-book-quick').boundingBox();
  assert.ok(bookQuickBox&&bookQuickBox.width>=44&&bookQuickBox.height>=44&&bookQuickBox.y>=0&&bookQuickBox.y+bookQuickBox.height<=viewport.height,
    label+' book shortcut should be touch-safe and visible on the first fold');
  assert.equal((await page.locator('.gm-math-equation').innerText()).trim(),'3 × 3 = ?',
    label+' must show the unfinished multiplication before the child starts');
  assert.match((await page.locator('.gm-story').innerText()).replace(/\s+/g,' '),/3 kurver med 3 jordbær/);
  assert.equal(await page.locator('.gm-quest').count(),1,label+' mission has a prominent quest panel');
  assert.match(await page.locator('.gm-quest-ribbon').innerText(),/Dagens oppdrag/);
  assert.equal(await page.locator('.gm-quest-callout>span').count(),2,
    label+' children need a deliberate two-line mission instruction');
  assert.match((await page.locator('.gm-quest-callout').innerText()).replace(/\s+/g,' '),
    /Fyll 3 kurver med 3 jordbær i hver/);
  const calloutLayout=await page.locator('.gm-quest-callout').evaluate(el=>({
    overflow:[...el.querySelectorAll(':scope>span')].some(span=>span.scrollWidth>span.clientWidth+1),
    insidePanel:el.getBoundingClientRect().left>=el.closest('.gm-quest').getBoundingClientRect().left-1&&
      el.getBoundingClientRect().right<=el.closest('.gm-quest').getBoundingClientRect().right+1
  }));
  assert.equal(calloutLayout.overflow,false,label+' mission heading must never overflow painted wood');
  assert.equal(calloutLayout.insidePanel,true,label+' headline stays inside the illustrated board');
  assert.equal(await page.locator('.gm-quest-filled-preview .gm-quest-mini-basket').count(),3,
    'final instructional illustration previews one filled basket per real group');
  assert.equal(await page.locator('.gm-quest-filled-preview .gm-quest-mini-berries i').count(),0,
    label+' pictured baskets must begin empty, not reveal the completed answer');
  assert.deepEqual(await page.locator('.gm-quest-step strong').allInnerTexts(),
    ['Velg troll','Velg kurv','Se gangemagien'],'instructions are three real readable DOM steps');
  assert.equal(await page.locator('.gm-quest-step-active[aria-current="step"][data-gm-step="1"]').count(),1,
    label+' first illustrated step invites a basket choice');
  assert.equal(await page.locator('.gm-quest-steps[role="list"] [role="listitem"]').count(),3,
    'screen-reader and touch-friendly three-step instructions');
  // Quest-step labels carry actual child instructions, not decorative microcopy.
  // Mobile instructions must remain legible, not squeeze into microtype.
  const questStepFont=await page.locator('.gm-quest-step strong').first()
    .evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
  const requiredStepSize=viewport.width>=700?14:viewport.width>=375?13:12;
  assert.ok(questStepFont>=requiredStepSize,
    label+' grade-two quest instructions: '+questStepFont+'px; minimum '+requiredStepSize);
  const stepGeometry=await page.locator('.gm-quest-step').evaluateAll(steps=>steps.map(step=>{
    const text=step.querySelector('strong'),box=step.getBoundingClientRect(),labelBox=text.getBoundingClientRect();
    return {text:text.textContent,width:text.clientWidth,scrollWidth:text.scrollWidth,
      labelBottom:labelBox.bottom,cardBottom:box.bottom};
  }));
  assert.ok(stepGeometry.every(x=>x.scrollWidth<=x.width+1&&x.labelBottom<=x.cardBottom+2),
    label+' all three step captions must fit their illustrated cards '+JSON.stringify(stepGeometry));
  if(viewport.width>=361&&viewport.width<700){
    const phoneHierarchy=await page.evaluate(()=>{
      const steps=document.querySelector('.gm-quest-steps'),title=document.querySelector('.gm-top-title h1'),
        classic=document.querySelector('.gm-secondary-nav .gm-classic strong');
      return {
        stepsDisplay:getComputedStyle(steps).display,
        visibleSteps:[...steps.querySelectorAll('.gm-quest-step')].filter(x=>getComputedStyle(x).display!=='none').length,
        title:title.textContent.trim(),titleClipped:title.scrollWidth>title.clientWidth+1,
        classic:classic?.textContent.trim(),classicClipped:classic?classic.scrollWidth>classic.clientWidth+1:true
      };
    });
    assert.notEqual(phoneHierarchy.stepsDisplay,'none',
      label+' ordinary iPhone must retain the locked three-step illustrated quest '+JSON.stringify(phoneHierarchy));
    assert.equal(phoneHierarchy.visibleSteps,3,label+' ordinary iPhone needs all three quest steps visible');
    assert.equal(phoneHierarchy.titleClipped,false,label+' Gangemagi title must fit the phone header '+JSON.stringify(phoneHierarchy));
    assert.equal(phoneHierarchy.classicClipped,false,label+' Gangetabellen secondary choice must not clip '+JSON.stringify(phoneHierarchy));
  }
  const foxSize=await page.locator('.gm-fox-message')
    .evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
  const requiredFoxSize=viewport.width>=700?(viewport.height>=1000?14:13):
    viewport.width>=375?13:11;
  assert.ok(foxSize>=requiredFoxSize,
    label+' personal fox feedback too small: '+foxSize+'px; minimum '+requiredFoxSize);

  const missionHeading=await page.locator('.gm-quest-callout').evaluate(el=>({
    size:parseFloat(getComputedStyle(el).fontSize),bounds:el.getBoundingClientRect().toJSON(),
    panel:el.closest('.gm-quest').getBoundingClientRect().toJSON()}));
  assert.ok(missionHeading.size>=17&&missionHeading.bounds.width>missionHeading.panel.width*.84,
    label+' child-sized assignment heading must dominate its painted board while leaving the fox its own scene space '+JSON.stringify(missionHeading));
  assert.equal(await page.locator('.gm-fox-art').count(),0,'mission scene uses the locked troll trio instead of a fox sprite');
  assert.equal(await page.locator('[data-gm-action="troll"]').count(),3,'all three locked forest trolls are real choices');
  const lockedTrolls=await page.locator('[data-gm-action="troll"] img').evaluateAll(images=>
    images.map(img=>({src:img.getAttribute('src'),complete:img.complete,width:img.naturalWidth,height:img.naturalHeight})));
  assert.deepEqual(lockedTrolls.map(x=>x.src),[
    './assets/gangemagi-troll/storesoster.webp',
    './assets/gangemagi-troll/lillesoster.webp',
    './assets/gangemagi-troll/lillebror.webp'
  ],label+' mission must use the exact locked trio assets');
  assert.ok(lockedTrolls.every(x=>x.complete&&x.width===512&&x.height===1024),
    label+' locked troll WebPs must decode at original 512×1024 size '+JSON.stringify(lockedTrolls));
  assert.match(await page.locator('.gm-book-quick').innerText(),/0\/8/,'flower progress visible from the main scene');
  assert.equal(await page.locator('.gm-book-collapsed:visible').count(),0,
    label+' only one collection access point should remain on the mission screen');
  assert.equal(await page.locator('[data-gm-action="undo"]').count(),0,
    label+' do not show a dead Angre control before the child has done anything');
  assert.equal(await page.locator('.gm-footer').evaluate(el=>getComputedStyle(el).display),'none',
    label+' do not offer Begynn på nytt while the fresh mission has nothing to reset');
  const premiumBasket=await page.request.get(new URL('gangemagi-basket-locked-illustration.svg',url).href);
  assert.equal(premiumBasket.status(),200,'illustrated basket sourced from the LOCKED reference must load');
  assert.match(premiumBasket.headers()['content-type'],/image\/svg\+xml/);
  assert.match(await premiumBasket.text(),/data:image\/webp;base64,/,
    'separate basket component must retain the original painterly reference material');
  assert.equal(await page.locator('.gm-basket-illustration').count(),3,'baskets must be real independently tappable DOM elements');
  assert.equal(await page.locator('.gm-quest-wicker').count(),4,
    label+' all 3 example baskets plus both teaching steps use the SAME locked illustrated wicker');
  assert.equal(await page.locator('.gm-quest-wicker').evaluateAll(xs=>xs.every(x=>x.complete&&x.naturalWidth>0)),
    true,label+' the locked picture-led instruction art must decode in Safari/WebKit');
  const wickerImages=await page.locator('.gm-basket-illustration').evaluateAll(images=>
    images.map(img=>({complete:img.complete,width:img.naturalWidth,src:img.getAttribute('src')})));
  assert.ok(wickerImages.every(img=>img.complete&&img.width>0),
    label+' reference wicker resource must decode in Chromium AND WebKit '+JSON.stringify(wickerImages));
  // The quest board is an individually authored SVG illustration behind live DOM.
  // A flat screenshot, a CSS-only box, or a missing asset does not meet the lock.
  if(viewport.width>=700&&viewport.height>=650){
    const brand=await page.request.get(new URL('gangemagi-title-brand-premium.svg',url).href);
    assert.equal(brand.status(),200,label+' ornate Tallenga sign must load');
    assert.match(brand.headers()['content-type'],/image\/svg\+xml/);
    assert.doesNotMatch(await brand.text(),/<text(?:\s|>)|<foreignObject(?:\s|>)/i,
      label+' title remains editable, accessible DOM, not baked into the sign');
    const title=await page.locator('.gm-top-title').evaluate(el=>({
      image:getComputedStyle(el).backgroundImage,
      text:el.querySelector('h1')?.textContent.trim(),
      font:parseFloat(getComputedStyle(el.querySelector('h1')).fontSize),
      subtitleDisplay:getComputedStyle(el.querySelector('span')).display
    }));
    assert.match(title.image,/gangemagi-title-brand-premium\.svg/);
    assert.equal(title.text,'Gangemagi');
    assert.ok(title.font>=24,label+' readable wooden chapter sign '+JSON.stringify(title));
    assert.equal(title.subtitleDisplay,'none',
      label+' the obsolete subtitle must not overlap the new wooden Gangemagi sign');
  }
  const paintedBoard=await page.request.get(new URL('gangemagi-quest-board-painted.svg',url).href);
  assert.equal(paintedBoard.status(),200,'painted wooden quest board asset is available');
  assert.match(await paintedBoard.text(),/preserveAspectRatio="none"/,
    label+' painted board must fill its own panel, not letterbox behind the live instruction');
  assert.match(paintedBoard.headers()['content-type'],/image\/svg\+xml/);
  const boardMaterial=await page.locator('.gm-story.gm-quest').evaluate(el=>({
    image:getComputedStyle(el).backgroundImage,
    liveInstructions:el.querySelectorAll('.gm-quest-step').length,
    dynamicHeading:el.querySelector('h2')?.textContent.trim()
  }));
  assert.match(boardMaterial.image,/gangemagi-quest-board-painted\.svg/,
    label+' board must use hand-illustrated wood and flowers, not a generic CSS card');
  assert.equal(boardMaterial.liveInstructions,3,'dynamic interactive teaching steps remain live markup');
  assert.match(boardMaterial.dynamicHeading,/Fyll 3 kurver/);
  if(viewport.width>=1050&&viewport.height<=950){
    const storyComposition=await page.locator('.gm-story.gm-quest').evaluate(board=>{
      const bounds=board.getBoundingClientRect(),title=board.querySelector('h2');
      const steps=[...board.querySelectorAll('.gm-quest-step')];
      const preview=board.querySelector('.gm-quest-filled-preview');
      const visibleSteps=steps.map(el=>({
        visible:getComputedStyle(el).display!=='none',
        font:parseFloat(getComputedStyle(el.querySelector('strong')).fontSize),
        bounds:el.getBoundingClientRect()
      }));
      return {height:bounds.height,width:bounds.width,
        titleHeight:title.getBoundingClientRect().height,
        boardBottom:bounds.bottom,
        steps:visibleSteps.map(v=>({shown:v.visible,font:v.font,
           inside:v.bounds.left>=bounds.left-2&&v.bounds.right<=bounds.right+2&&
                  v.bounds.bottom<=bounds.bottom+2})),
        miniBaskets:preview?.querySelectorAll('.gm-quest-mini-basket').length};
    });
    assert.ok(storyComposition.height<=164,
      label+' iPad quest sign must leave market centre free for actual play '+JSON.stringify(storyComposition));
    assert.ok(storyComposition.titleHeight<=72,
      label+' wide tablet instructions must form one readable sentence '+JSON.stringify(storyComposition));
    assert.ok(storyComposition.steps.every(s=>s.shown&&s.font>=14&&s.inside),
      label+' pictorial steps must remain visible and readable, not clipped '+JSON.stringify(storyComposition));
    assert.equal(storyComposition.miniBaskets,3,
      label+' live group preview must stay on the sign');
  }

  const calmStart=await page.evaluate(()=>{
    const shell=document.querySelector('.gm-shell[data-gm-mode="mission"]');
    return {
      redundantHint:getComputedStyle(shell.querySelector('.gm-play-hint')).display,
      visibleEmptyTags:[...shell.querySelectorAll('.gm-crate[data-gm-count="0"] .gm-crate-tag')]
        .filter(el=>getComputedStyle(el).display!=='none').length,
      basketNames:[...shell.querySelectorAll('.gm-crate-caption')].map(el=>el.textContent.trim())
    };
  });
  assert.equal(calmStart.redundantHint,'none','speaking fox and illustrated steps must not be repeated in another instruction badge');
  assert.equal(calmStart.visibleEmptyTags,0,'empty market baskets should show simple clear names, not tiny 0/3 labels');
  assert.deepEqual(calmStart.basketNames,['Kurv 1','Kurv 2','Kurv 3'],'basket names remain clear');

  // The locked original remains available, while the playable scene now uses
  // its own richer Tallenga painting. Verify both assets, not just a filename.
  const tallengaScene=await page.request.get(new URL('gangemagi-tallenga-market-v1.svg',url).href);
  assert.equal(tallengaScene.status(),200,'the original dedicated Tallenga market scene must remain available');
  assert.match(tallengaScene.headers()['content-type'],/image\/svg\+xml/);
  const premiumScene=await page.request.get(new URL('gangemagi-tallenga-market-premium-20261023.svg',url).href);
  assert.equal(premiumScene.status(),200,'the new detailed Tallenga landscape must load');
  assert.match(premiumScene.headers()['content-type'],/image\/svg\+xml/);
  const premiumMarkup=await premiumScene.text();
  assert.match(premiumMarkup,/<svg[^>]+viewBox="0 0 1400 730"/,
    label+' the premium landscape must retain a scalable wide scene, not a fixed screenshot');
  assert.match(premiumMarkup,/aria-label="Lysere Tallenga-marked med bro, blomster, handelsboder og dybde"/,
    label+' the detailed market must be our authored Tallenga landscape');
  assert.doesNotMatch(premiumMarkup,/<text(?:\s|>)|<foreignObject(?:\s|>)/i,
    label+' the background must not bake in false tasks, numbers or controls');
  const marketOverlay=await page.request.get(new URL('gangemagi-tallenga-market-overlay-v2.svg',url).href);
  assert.equal(marketOverlay.status(),200,label+' transparent Tallenga market overlay must load');
  assert.match(marketOverlay.headers()['content-type'],/image\/svg\+xml/);
  const overlayMarkup=await marketOverlay.text();
  assert.match(overlayMarkup,/<svg[^>]+viewBox="0 0 1400 730"/,
    label+' market overlay must retain the wide scalable Tallenga composition');
  assert.match(overlayMarkup,/id="market-stalls"/,
    label+' market overlay must contain authored stall architecture');
  assert.match(overlayMarkup,/id="market-bridge"/,
    label+' market overlay must retain the stone bridge depth cue');
  assert.match(overlayMarkup,/id="market-fountain"/,
    label+' market overlay must retain the square fountain depth cue');
  assert.doesNotMatch(overlayMarkup,/<text(?:\s|>)|<foreignObject(?:\s|>)/i,
    label+' market overlay must not bake in fake tasks, labels or controls');
  const sceneBackground=await page.locator('.gm-world').evaluate(el=>getComputedStyle(el).backgroundImage);
  assert.match(sceneBackground,/gangemagi-tallenga-market-premium-20261023\.svg/,
    label+' Gangemagi must retain its authored premium market geometry beneath the painting');
  assert.match(sceneBackground,/gangemagi-tallenga-market-overlay-v2\.svg/,
    label+' Gangemagi must render the transparent Tallenga market architecture above the painting');
  assert.ok(sceneBackground.indexOf('gangemagi-tallenga-market-overlay-v2.svg') < sceneBackground.indexOf('gangemagi-grovanova-storybook-locked.webp'),
    label+' Tallenga market architecture must sit above the locked Grovanova scene, not remain hidden beneath it');
  const grovanovaWorld=await page.request.get(new URL('gangemagi-grovanova-storybook-locked.webp',url).href);
  assert.equal(grovanovaWorld.status(),200,label+' the geometry-locked Grovanova scene must load');
  assert.match(grovanovaWorld.headers()['content-type'],/image\/webp/,
    label+' Grovanova scene is a local raster source, not an external dependency');
  assert.match(sceneBackground,/gangemagi-grovanova-storybook-locked\.webp/,
    label+' mission world must use the supplied Grovanova geometry beneath the Tallenga market');
  assert.doesNotMatch(sceneBackground,/home-math-v14\.webp/,
    label+' generic waterfall painting must not replace the locked Grovanova geometry');
  const tableArt=await page.request.get(new URL('gangemagi-market-table-premium.svg',url).href);
  assert.equal(tableArt.status(),200,'original illustrated market counter must load');
  assert.match(tableArt.headers()['content-type'],/image\/svg\+xml/);
  const tableSvg=await tableArt.text();
  assert.match(tableSvg,/id="forest"/,
    label+' market counter must use the locked moss-green botanical tablecloth');
  assert.doesNotMatch(tableSvg,/id="checked"/,
    label+' the old red checkerboard is not part of the approved market style');
  const illustratedCounter=await page.locator('.gm-crates').evaluate(el=>
    getComputedStyle(el,'::before').backgroundImage.includes('gangemagi-market-table-premium.svg'));
  assert.equal(illustratedCounter,true,'interactable baskets should stand in front of their own market-scene artwork');
  assert.match(await page.locator('.gm-top-title').innerText(),/Gangemagi/);
  assert.match(await page.locator('.gm-top-progress').innerText(),/Oppdrag 1 av 8/);
  if(viewport.width<=360){
    const compactHeader=await page.evaluate(()=>{
      const box=selector=>{
        const r=document.querySelector(selector).getBoundingClientRect();
        return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};
      };
      return {title:box('.gm-top-title'),progress:box('.gm-top-progress'),book:box('.gm-book-quick')};
    });
    const overlap=(a,b)=>a.left<b.right-2&&a.right>b.left+2&&a.top<b.bottom-2&&a.bottom>b.top+2;
    assert.equal(overlap(compactHeader.title,compactHeader.progress),false,
      label+' title overlaps progress badge on compact iPhone '+JSON.stringify(compactHeader));
    assert.equal(overlap(compactHeader.title,compactHeader.book),false,
      label+' title overlaps the collection button '+JSON.stringify(compactHeader));
    const narrowHeading=await page.locator('.gm-top-title h1').evaluate(el=>({
      text:el.textContent.trim(),clipped:el.scrollWidth>el.clientWidth+1,
      font:parseFloat(getComputedStyle(el).fontSize)
    }));
    assert.equal(narrowHeading.text,'Gangemagi');
    assert.ok(!narrowHeading.clipped&&narrowHeading.font>=19,
      label+' whole game title must be readable at 320px '+JSON.stringify(narrowHeading));
    assert.equal(await page.locator('.gm-brand').evaluate(el=>getComputedStyle(el).display),'none',
      label+' redundant Læria wordmark must not steal game-title space');
  }
  assert.equal(await page.locator('.gm-crate-invite').count(),0,
    label+' do not draw attention to basket selection before a berry is picked');
  assert.equal(await page.locator('.gm-pick-invite').count(),0,
    label+' mission fruit crate is scenery/source material, not the child action');
  assert.match(await page.locator('.gm-fox-message').innerText(),/Velg et troll/);
  const trollTargets=await page.locator('[data-gm-action="troll"]').evaluateAll(buttons=>
    buttons.map(el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height};}));
  assert.ok(trollTargets.every(x=>x.width>=44&&x.height>=44),
    label+' every troll choice is touch-safe '+JSON.stringify(trollTargets));
  const first=await page.evaluate(()=>{
   const rect=s=>{const n=document.querySelector(s)?.getBoundingClientRect();return n?{top:n.top,bottom:n.bottom,width:n.width,height:n.height}:null;};
   return {screen:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,story:rect('.gm-story'),crate:rect('.gm-crate'),source:rect('.gm-pick'),math:rect('.gm-math'),read:rect('.gm-read')};
  });
  console.log('GANGEMAGI_FIRSTFOLD '+label+' '+JSON.stringify(first));
  assert.ok(first.scrollWidth<=first.screen+4,label+' horizontal overflow '+JSON.stringify(first));
  if(viewport.width<=360&&viewport.height<=650){
    assert.ok(first.crate&&first.crate.height>=96,
      label+' compact first fold must keep large recognisable baskets '+JSON.stringify(first));
    assert.ok(first.source&&first.source.height>=44,
      label+' compact first fold must keep a touch-safe physical berry source '+JSON.stringify(first));
    assert.ok(first.math&&first.math.bottom<=first.height+1,
      label+' compact first fold must show the complete maths parchment before scrolling '+JSON.stringify(first));
  }
  assert.equal(await page.locator('.gm-market-fruit-supply .gm-pick').count(),1,
    label+' the real strawberry supply belongs in the illustrated market');
  if(viewport.width>=700&&viewport.width<=899&&viewport.height<=699){
    const sourceLayout=await page.locator('.gm-market-fruit-supply .gm-pick').evaluate(el=>{
      const area=el.getBoundingClientRect(),plaque=el.children[1];
      const rect=plaque.getBoundingClientRect(),style=getComputedStyle(plaque);
      return {width:area.width,height:area.height,font:parseFloat(style.fontSize),
        plaqueWidth:rect.width,plaqueHeight:rect.height,sourceVisible:area.top>=0};
    });
    assert.ok(sourceLayout.width>=170&&sourceLayout.height>=44&&
      sourceLayout.font>=12&&sourceLayout.plaqueWidth>=160&&sourceLayout.plaqueHeight>=34&&
      sourceLayout.sourceVisible,
      label+' short-landscape berries must have a visible legible physical source, not a 10px microscopic plaque '+JSON.stringify(sourceLayout));
  }
  if(viewport.width>=900&&viewport.height>=650){
    const front=await page.locator('.gm-market-fruit-supply .gm-pick').evaluate(el=>{
      const crate=el.querySelector('.gm-pick-fruit').getBoundingClientRect();
      const plaque=el.children[1].getBoundingClientRect();
      const style=getComputedStyle(el.children[1]);
      return {overlap:crate.bottom-plaque.top,plaqueHeight:plaque.height,
        frontText:el.children[1].textContent.trim(),wood:style.backgroundImage};
    });
    assert.ok(front.overlap>=12&&front.plaqueHeight>=44,
      label+' front must be a connected legible 44px+ wood plaque '+JSON.stringify(front));
    assert.match(front.wood,/repeating-linear-gradient/,
      label+' physical source needs illustrated wood grain, not a coral CTA');
    assert.match(front.frontText,/Jordbærkassen/);
  }
  assert.equal(await page.locator('.gm-basket-inner').count(),3,
    label+' every transparent wicker basket needs a stable painted interior');
  assert.ok(first.source.top>first.crate.top&&first.source.bottom<=first.math.top+6,
    label+' picking strawberries must lead naturally from baskets to maths '+JSON.stringify(first));
  if(viewport.width>=700&&viewport.height>=viewport.width){
    const worldWidth=await page.locator('.gm-world').evaluate(el=>el.getBoundingClientRect().width);
    assert.ok(worldWidth>=700,label+' iPad portrait should use the full-width Tallenga scene '+worldWidth);
  }
  if(viewport.width>=700&&viewport.width<=899&&viewport.height>=1000){
    const sceneLayers=await page.evaluate(()=>({
      math:Number(getComputedStyle(document.querySelector('.gm-math')).zIndex),
      fox:Number(getComputedStyle(document.querySelector('.gm-fox')).zIndex),
      equation:document.querySelector('.gm-math-equation')?.textContent.trim(),
       equationFont:parseFloat(getComputedStyle(document.querySelector('.gm-math-equation')).fontSize)
    }));
    assert.ok(sceneLayers.math>sceneLayers.fox,
      label+' illustrated fox must not be painted over the live equation '+JSON.stringify(sceneLayers));
    assert.match(sceneLayers.equation,/=/,
      label+' mathematical result remains readable without redundant label');
    assert.ok(sceneLayers.equationFont>=24,
      label+' iPad portrait equation must be prominent '+JSON.stringify(sceneLayers));
    const foxSpeech=await page.locator('.gm-fox-bubble').evaluate(el=>{
      const style=getComputedStyle(el),tail=getComputedStyle(el,'::before');
      const size=parseFloat(tail.width),left=parseFloat(tail.left);
      const bubble=el.getBoundingClientRect(),math=document.querySelector('.gm-math').getBoundingClientRect();
      return {tailDisplay:tail.display,arrowRight:left+size*(1+Math.SQRT2)/2,
        textInset:parseFloat(style.paddingLeft),
        textWidth:el.querySelector('.gm-fox-message').clientWidth,
        textScroll:el.querySelector('.gm-fox-message').scrollWidth,
        bubbleBottom:bubble.bottom,mathTop:math.top};
    });
    assert.ok((foxSpeech.tailDisplay==='none'||foxSpeech.arrowRight<=foxSpeech.textInset-2)&&
      foxSpeech.textScroll<=foxSpeech.textWidth+1,
      label+' iPad portrait troll speech must keep every letter readable '+JSON.stringify(foxSpeech));
    assert.ok(foxSpeech.bubbleBottom<=foxSpeech.mathTop+2,
      label+' iPad portrait maths must not cover the fox instruction '+JSON.stringify(foxSpeech));
  }
  if(viewport.width>=900&&viewport.height<=900){
    const guide=await page.evaluate(()=>{
      const box=s=>{const r=document.querySelector(s).getBoundingClientRect();
        return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height}};
      return {fox:box('.gm-troll-stage'),bubble:box('.gm-fox-bubble'),
        firstBasket:box('.gm-crate'),math:box('.gm-math'),
        speechSize:parseFloat(getComputedStyle(document.querySelector('.gm-fox-message')).fontSize)};
    });
    assert.ok(guide.fox.height>=96&&guide.fox.width>=700,
      label+' iPad landscape locked troll trio must remain clearly visible as small market actors '+JSON.stringify(guide));
    assert.ok(guide.bubble.width>=205&&guide.speechSize>=14,
      label+' iPad landscape speech must be readable at arm’s length '+JSON.stringify(guide));
    assert.ok(guide.fox.left<=guide.firstBasket.left+2&&guide.fox.right>=guide.firstBasket.right-2,
      label+' troll trio should span the physical basket market instead of returning to a detached guide lane '+JSON.stringify(guide));
    assert.ok(guide.fox.bottom<=guide.firstBasket.top+2,
      label+' small troll row must end before the live basket hit area begins '+JSON.stringify(guide));
    assert.ok(guide.bubble.right<=guide.firstBasket.left+2,
      label+' speech prompt must stay outside the first basket touch target '+JSON.stringify(guide));
    const groupMath=await page.locator('.gm-group-plus').evaluateAll(nodes=>nodes.map(el=>({
      display:getComputedStyle(el).display,text:el.textContent.trim(),pointer:getComputedStyle(el).pointerEvents
    })));
    assert.equal(groupMath.length,2,label+' 3-group mission needs two visual addition links between real baskets');
    assert.ok(groupMath.every(x=>x.display!=='none'&&x.text==='+'&&x.pointer==='none'),
      label+' wide iPad must show non-interactive plus signs between the three physical groups '+JSON.stringify(groupMath));
    assert.ok(guide.fox.bottom<=guide.math.top+3&&guide.bubble.bottom<=guide.math.top+3,
      label+' troll guide and speech must stay clear of live mathematical feedback '+JSON.stringify(guide));
  }
  assert.ok(first.crate.top>=0&&first.crate.bottom<=first.height,label+' interactive crates not in the first viewport '+JSON.stringify(first));
  assert.ok(first.math.top<first.height,label+' mathematical feedback invisible '+JSON.stringify(first));
  assert.ok(first.read.height>=44,label+' read aloud target too small');
  // The painted SVG, not just its wrapper, must remain clear of the equation.
  // A replaced SVG's intrinsic grid min-size previously painted 345px inside
  // the nominal 227px fox slot. Keep the real personal character contained.
  const materialLayout=await page.evaluate(()=>{
    const box=s=>document.querySelector(s).getBoundingClientRect();
    const actor=box('.gm-troll-stage'),slot=box('.gm-troll-stage');
    return {foxBottom:actor.bottom,slotBottom:slot.bottom,foxWidth:slot.width,mathTop:box('.gm-math').top,
      iconHeight:box('.gm-quest-icon').height,
      sourceArtWidth:box('.gm-market-fruit-supply .gm-pick-fruit').width,
      marketBlur:getComputedStyle(document.querySelector('.gm-market'),'::before').backdropFilter};
  });
  assert.ok(materialLayout.foxBottom<=materialLayout.slotBottom+2&&
    materialLayout.foxBottom<=materialLayout.mathTop+3,
    label+' locked troll trio must fit its slot and stay above the live equation '+JSON.stringify(materialLayout));
  if(viewport.width>=900&&viewport.height<=900){
    const wideBoard=await page.locator('.gm-quest-steps').evaluate(el=>({
      display:getComputedStyle(el).display,
      steps:el.querySelectorAll('.gm-quest-step').length,
      visibleLabels:[...el.querySelectorAll('.gm-quest-step strong')].filter(x=>getComputedStyle(x).display!=='none').map(x=>x.textContent.trim())
    }));
    assert.notEqual(wideBoard.display,'none',
      label+' wide iPad must keep the locked three-step illustrated quest explanation '+JSON.stringify(wideBoard));
    assert.equal(wideBoard.steps,3,label+' wide iPad quest board must have exactly three authored steps');
    assert.deepEqual(wideBoard.visibleLabels,['Velg troll','Velg kurv','Se gangemagien'],
      label+' wide iPad quest steps must explain the real interaction in order '+JSON.stringify(wideBoard));
    assert.ok(materialLayout.sourceArtWidth>=180,
      label+' actual strawberry market crate must be prominent, not a tiny pill '+JSON.stringify(materialLayout));
  }
  if(viewport.width>=700&&viewport.width<=899&&viewport.height>=1000)assert.ok(materialLayout.iconHeight>=68,
    label+' portrait iPad instructions must use the existing picture area');
  if(viewport.width>=361&&viewport.width<700)assert.ok(materialLayout.foxWidth>=138,
    label+' ordinary phone must keep the locked troll trio visibly present '+JSON.stringify(materialLayout));
  if(viewport.width>=375)assert.ok(materialLayout.sourceArtWidth>=109,
    label+' the real strawberry supply must be visually substantial');
  assert.ok(!materialLayout.marketBlur||materialLayout.marketBlur==='none',
    label+' keep the market sharp; the physical table separates the playing area');

  if(viewport.height>=750||viewport.width<=360)assert.ok(first.source.bottom<=first.height+3,label+' primary Plukk action must be visible without scrolling '+JSON.stringify(first));
  // Visual QA: minus glyphs may not obscure numeric basket counts, and
  // the primary action label must not be clipped on the smallest iPhone.
  const touchGeometry=await page.evaluate(()=>{
    const overlaps=(a,b)=>a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;
    const baskets=[...document.querySelectorAll('.gm-crate-wrap')].map(w=>{
      const tag=w.querySelector('.gm-crate-tag').getBoundingClientRect();
      const icon=w.querySelector('.gm-remove span').getBoundingClientRect();
      return overlaps(tag,icon);
    });
    const label=document.querySelector('.gm-pick>span:nth-child(2)'),labelRect=label.getBoundingClientRect();
    return {overlaps:baskets,clipped:label.scrollWidth>label.clientWidth+1,lettering:label.innerText,
      labelWidth:labelRect.width,labelHeight:labelRect.height};
  });
  assert.deepEqual(touchGeometry.overlaps,Array(touchGeometry.overlaps.length).fill(false),label+' remove affordance must not cover numeric basket label '+JSON.stringify(touchGeometry));
  assert.equal(touchGeometry.clipped,false,label+' first-fold Plukk action text is clipped '+JSON.stringify(touchGeometry));
  assert.equal(touchGeometry.lettering,'Jordbærkassen',label+' primary strawberry action must say exactly what the child can do');
  if(!(viewport.width>=700&&viewport.width<=899&&viewport.height<700))assert.ok(touchGeometry.labelHeight>=40,
    label+' primary strawberry action needs visual button weight '+JSON.stringify(touchGeometry));
  const pageCanvas=await page.evaluate(()=>{
    const screen=document.querySelector('#multiplication-lab-screen');
    const app=document.querySelector('.app');
    return {colors:[document.documentElement,document.body,app]
      .map(el=>getComputedStyle(el).backgroundColor),
      screenMatches:screen.matches(':has(.gm-shell)'),
      appBackgroundImage:getComputedStyle(app).backgroundImage,
      screenBackground:getComputedStyle(screen).backgroundColor};
  });
  // The inner screen MAY remain transparent: a fully opaque warm .app behind
  // it is correct. What caused the white band was the grade 1–2 home gradient
  // still painting behind the game despite its opaque background-color.
  assert.ok(pageCanvas.colors.every(color=>color!=='rgba(0, 0, 0, 0)'&&color!=='rgb(255, 255, 255)')&&
    pageCanvas.appBackgroundImage==='none'&&pageCanvas.screenMatches,
    label+' entire game canvas including iPhone bottom scroll must be warm, never white '+JSON.stringify(pageCanvas));
  const crateControl=await page.locator('.gm-market-fruit-supply .gm-pick.gm-strawberry-tray')
    .evaluate(el=>{
      const rect=el.getBoundingClientRect(),style=getComputedStyle(el);
      return {width:rect.width,height:rect.height,image:style.backgroundImage,
        berryCount:el.querySelectorAll('.gm-source-berry').length,
        caption:el.querySelector(':scope>span:nth-child(2)')?.textContent.trim(),
        touchAction:style.touchAction,pointerEvents:style.pointerEvents,tag:el.tagName};
    });
  const minPhysicalCrateWidth=Math.min(250,viewport.width*.75);
  assert.ok(crateControl.width>=minPhysicalCrateWidth&&crateControl.width<=viewport.width*.96&&
    crateControl.height>=44&&crateControl.image==='none'&&crateControl.berryCount===5&&
    crateControl.caption==='Jordbærkassen'&&crateControl.pointerEvents==='none'&&crateControl.tag==='DIV',
    label+' strawberry crate stays substantial while troll choices own the interaction '+JSON.stringify(crateControl));
  // The same locally served illustrations must decode in both engines.
  // Checking an Image load catches broken SVG dependencies before visual QA.
  const props=await page.evaluate(async()=>{
    const images=[...document.querySelectorAll('[data-gm-prop] image')];
    const urls=[...new Set(images.map(el=>el.getAttribute('href')))];
    const decoded=await Promise.all(urls.map(src=>new Promise(resolve=>{
      const image=new Image();image.onload=()=>resolve({src,ok:image.naturalWidth>0});
      image.onerror=()=>resolve({src,ok:false});image.src=src;
    })));
    return {decoded,berryCount:document.querySelectorAll('[data-gm-prop="berry"]').length,
      handCount:document.querySelectorAll('[data-gm-prop="hand"]').length,
      repeatedPaint:document.querySelectorAll('[id="gmB"]').length};
  });
  assert.equal(props.decoded.length,1,label+' berry is the shared SVG prop after trolls replace the generic picking hand');
  assert.ok(props.decoded.every(item=>item.ok),label+' play-prop SVG must decode '+JSON.stringify(props));
  assert.ok(props.berryCount>=7&&props.handCount===0,
    label+' exact troll images replace the generic picking-hand illustration');
  assert.equal(props.repeatedPaint,0,label+' repeated fruit may not duplicate gradient IDs');

  await shot(page,label+'-01-first-look');
  const disabledRemoveStyles=await page.locator('.gm-remove:disabled').evaluateAll(buttons=>
    buttons.map(el=>({opacity:parseFloat(getComputedStyle(el).opacity),
      pointerEvents:getComputedStyle(el).pointerEvents})));
  assert.ok(disabledRemoveStyles.length===3&&disabledRemoveStyles.every(x=>
    x.opacity===0&&x.pointerEvents==='none'),
    label+' an empty basket must not show a useless minus control '+JSON.stringify(disabledRemoveStyles));
  // Child-directed troll play: choose a locked troll, then choose a basket.
  assert.equal(await page.locator('[data-gm-action="source"]').count(),0,
    label+' mission must not expose the old direct berry-source action');
  await page.locator('[data-gm-action="troll"][data-gm-troll="0"]').click();
  let picked=await page.evaluate(()=>LARIA_GANGEMAGI.snapshot());
  assert.deepEqual(picked.counts,[0,0,0],label+' troll choice alone cannot add fruit');
  assert.equal(picked.selectedTroll,0,label+' storesøster is the chosen helper');
  assert.equal(picked.holdingBerry,true,label+' storesøster picked exactly one berry');
  assert.equal(await page.locator('.gm-troll-selected[data-gm-troll="0"]').count(),1,
    label+' chosen troll is visibly selected');
  // Baskets become the second interaction step only after a troll is chosen.
  await page.locator('.gm-crate').first().hover();
  assert.equal(await page.locator('.gm-crate-invite').count(),3,
    label+' after a troll picks, all non-full baskets invite a destination');
  await page.locator('[data-gm-action="basket"][data-gm-basket="1"] .gm-crate-front').click();
  assert.equal(await page.locator('.gm-troll-delivering').count(),1,
    label+' troll visibly performs delivery before maths changes');
  await page.waitForFunction(()=>window.LARIA_GANGEMAGI.snapshot().counts[1]===1);
  assert.deepEqual((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).counts,[0,1,0],
    label+' troll delivery adds exactly one strawberry');
  assert.equal((await page.locator('.gm-math-equation').innerText()).trim(),'0 + 1 + 0 = 1',
    label+' maths follows completed troll delivery');
  const placedBerryHit=await page.locator('[data-gm-basket="1"] .gm-fruit[data-gm-fruit]').first().evaluate(el=>{
    const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
    const hit=document.elementFromPoint(x,y);
    return {fruit:!!hit?.closest?.('.gm-fruit[data-gm-fruit]'),
      troll:!!hit?.closest?.('[data-gm-action="troll"]'),
      basket:!!hit?.closest?.('[data-gm-action="basket"]')};
  });
  assert.equal(placedBerryHit.fruit,true,
    label+' placed berry must own its actual pixel hit target '+JSON.stringify(placedBerryHit));
  assert.equal(placedBerryHit.troll,false,
    label+' locked troll artwork may not cover a placed berry '+JSON.stringify(placedBerryHit));
  await page.locator('[data-gm-basket="1"] .gm-fruit[data-gm-fruit]').first().click();
  assert.deepEqual((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).counts,[0,0,0],
    label+' direct touch still removes a placed berry');
  assert.match(await page.locator('[data-gm-action="basket"][data-gm-basket="2"]').getAttribute('aria-label'),/Velg et troll først/,
    label+' inactive basket tells the child which step comes first');
  assert.deepEqual((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).counts,[0,0,0],
    label+' waiting for a new troll choice cannot silently change maths');
  assert.match(await page.locator('.gm-fox-message').innerText(),/Velg et troll/);
  if(viewport.width===390&&viewport.height===844){
    await page.locator('[data-gm-action="troll"][data-gm-troll="1"]').tap();
    assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).holdingBerry,true,
      label+' touchscreen troll choice picks one berry');
    await page.locator('[data-gm-action="basket"][data-gm-basket="1"] .gm-crate-front').tap();
    await page.waitForFunction(()=>window.LARIA_GANGEMAGI.snapshot().counts[1]===1);
    assert.deepEqual((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).counts,[0,1,0],
      label+' touchscreen troll + basket performs one delivery');
    await page.locator('[data-gm-basket="1"] .gm-fruit[data-gm-fruit]').first().tap();
    assert.deepEqual((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).counts,[0,0,0],
      label+' touchscreen can still remove the berry');
  }
  await page.evaluate(()=>LARIA_GANGEMAGI.reset());
  assert.match(await page.locator('[data-gm-action="basket"][data-gm-basket="0"]').getAttribute('aria-label'),/Velg et troll først/,
    label+' reset basket remains visibly secondary to troll choice');
  assert.deepEqual((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).counts,[0,0,0],
    'reset mission starts with no silent strawberry placement');
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).selectedBasket,null,
    label+' basket does not become primary choice before a troll');
  assert.equal(await page.locator('.gm-quest-step-active[aria-current="step"][data-gm-step="1"]').count(),1,
    label+' first step remains troll choice');
  await page.locator('[data-gm-action="troll"][data-gm-troll="0"]').click();
  assert.equal(await page.locator('.gm-quest-step-active[aria-current="step"][data-gm-step="2"]').count(),1,
    label+' choosing a troll advances to Velg kurv');
  assert.deepEqual((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).counts,[0,0,0],
    label+' choosing storesøster still does not change maths');
  await page.locator('[data-gm-basket="0"] .gm-crate-front').click();
  await page.waitForFunction(()=>window.LARIA_GANGEMAGI.snapshot().counts[0]===1);
  const firstBerryGeometry=await page.locator('[data-gm-basket="0"]').evaluate(basket=>{
    const berry=basket.querySelector('.gm-fruit:not(.gm-fruit-empty)');
    const b=basket.getBoundingClientRect(),f=berry?.getBoundingClientRect();
    return {basketWidth:b.width,
      horizontalDelta:f?Math.abs((f.left+f.right)/2-(b.left+b.right)/2):Infinity,
      berryTop:f?.top,basketTop:b.top,basketBottom:b.bottom,
      extraEmptyFruitSlots:basket.querySelectorAll('.gm-fruit-empty').length};
  });
  assert.equal(firstBerryGeometry.extraEmptyFruitSlots,0,'empty basket must not render ghost placeholders');
  assert.ok(firstBerryGeometry.horizontalDelta<firstBerryGeometry.basketWidth*.15,
    label+' first strawberry should sit inside the CENTER of the basket, not on one edge '+JSON.stringify(firstBerryGeometry));
  assert.ok(firstBerryGeometry.berryTop>firstBerryGeometry.basketTop,
    label+' strawberry must be inside the illustrated basket '+JSON.stringify(firstBerryGeometry));
  assert.equal(await page.locator('.gm-fruit-pop').count(),1,
    label+' ONLY the newly added strawberry should bounce after the first pick');
  assert.equal(await page.locator('.gm-quest-mini-berries i').count(),1,
    label+' illustrated maths must mirror the first real berry placed');
  const liveMathBridge=await page.locator('.gm-math').evaluate(root=>{
    const label=root.querySelector('.gm-math-label'),goal=root.querySelector('.gm-goal'),
      equation=root.querySelector('.gm-math-equation');
    return {labelDisplay:getComputedStyle(label).display,
      label:label.textContent.replace(/\s+/g,' ').trim(),
      goal:goal.textContent.trim(),equation:equation.textContent.trim()};
  });
  assert.ok(liveMathBridge.labelDisplay!=='none'&&liveMathBridge.goal==='3 × 3 = ?'&&
    liveMathBridge.equation==='1 + 0 + 0 = 1',
    label+' child must see the multiplication goal and the live addition together '+JSON.stringify(liveMathBridge));
  await shot(page,label+'-02-one-berry');
  await chooseTrollAndPlace(page,0,0);
  assert.equal((await page.locator('.gm-math-equation').innerText()).trim(),'2 + 0 + 0 = 2');
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).counts[0],2);
  assert.equal(await page.locator('.gm-fruit').count(),2);
  assert.equal(await page.locator('.gm-quest-mini-berries i').count(),2,
    label+' illustrated baskets must track the actual total after two placements');
  assert.equal(await page.locator('.gm-fruit-pop').count(),1,
    label+' on the second pick the previous berry must remain stable');
  assert.match(await page.locator('.gm-fox-message').innerText(),/2 av 3 i kurv 1/);
  assert.equal(await page.locator('.gm-fox').getAttribute('data-mood'),'cheer');
  await page.locator('[data-gm-action="undo"]').click();
  assert.deepEqual((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).counts,[1,0,0]);
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).selectedBasket,null,
    label+' undo returns to neutral troll choice rather than silently selecting a basket');
  assert.equal(await page.locator('.gm-crate-invite').count(),0,
    label+' do not invite a different basket after undoing in the chosen one');
  await chooseTrollAndPlace(page,0,0);
  assert.deepEqual((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).counts,[2,0,0]);
  await page.locator('[data-gm-action="hint"]').click();
  assert.match(await page.locator('.gm-fox-message').innerText(),/troll/i,
    label+' hint returns the child to the new first step: choose a troll');
  assert.equal(await page.locator('.gm-fruit-pop').count(),0,
    label+' opening a fox hint must NOT replay the last fruit animation');
  await page.locator('[data-gm-action="remove"][data-group="0"]').click();
  assert.deepEqual((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).counts,[1,0,0]);
  for(const [group,count] of [[0,2],[1,3],[2,3]]){
    await selectAndPick(page,group,count);
    if(group<2){
      const filledBasketSnapshot=await page.evaluate(()=>LARIA_GANGEMAGI.snapshot());
      assert.equal(filledBasketSnapshot.selectedBasket,null,
        label+' a completed basket must release selection before the child chooses the next one '+JSON.stringify({counts:filledBasketSnapshot.counts,each:filledBasketSnapshot.each,group,holdingBerry:await page.locator('.gm-play-hint').innerText()}));
      assert.equal(await page.locator('.gm-crate-invite').count(),0,
        label+' after finishing a basket, the child first picks another berry');
      assert.equal(await page.locator('[data-gm-action="troll"]').count(),3,
        label+' after a full basket all three troll choices remain available');
      assert.equal(await page.locator('.gm-quest-step-active[aria-current="step"][data-gm-step="1"]').count(),1,
        label+' the first illustrated step should invite the next basket');
      assert.match(await page.locator('.gm-fox-message').innerText(),/Velg et troll/,
        label+' guide returns to troll choice after a completed basket');
    }
  }
  assert.equal((await page.locator('.gm-math-equation').innerText()).trim(),'3 × 3 = 9');
  assert.equal(await page.locator('.gm-quest-mini-berries i').count(),9,
    label+' completed diagram must now display all nine actually placed berries');
  assert.equal((await page.locator('.gm-math-addition').innerText()).trim(),'3 + 3 + 3 = 9',
    label+' completed addition must visually connect equal baskets to multiplication');
  assert.equal(await page.locator('.gm-quest-step-active[aria-current="step"][data-gm-step="3"]').count(),1,
    label+' final illustrated step celebrates the multiplication discovery');
  assert.match(await page.locator('.gm-math-discovery').innerText(),/Like grupper: 3 kurver med 3 bær = 9/,'multiplication has a child-readable explanation');
  assert.match(await page.locator('.gm-book-quick').innerText(),/1\/8/,'earned flowers remain visible during play');
  assert.match(await page.locator('.gm-celebration').innerText(),/Oppdraget er klart/);
  assert.match(await page.locator('.gm-celebration-copy small').innerText(),/Markedsblomst 1 av 8 · 9 jordbær pakket/,
    label+' completion must connect mastery to the persistent market collection');
  assert.equal(await page.locator('.gm-pick').count(),0,'completed tasks must not leave a disabled fruit button');
  // Regression: finishing an adventure used to remove the supply, so a berry
  // could not be dragged back to its source. Reveal the return crate only
  // during a drag; keep Next and the full multiplication visible at rest.
  assert.equal(await page.locator('.gm-return-tray').count(),0,
    label+' completion must not add another permanent toolbar');
  const completedFruit=await page.locator('[data-gm-basket="2"] .gm-fruit[data-gm-fruit]').first().boundingBox();
  assert.ok(completedFruit,'full basket still holds removable real berries');
  const cx=completedFruit.x+completedFruit.width/2,cy=completedFruit.y+completedFruit.height/2;
  await page.mouse.move(cx,cy);
  await page.mouse.down();
  await page.mouse.move(cx,cy-18,{steps:5});
  const returnTray=page.locator('.gm-return-tray');
  assert.equal(await returnTray.count(),1,label+' return source appears only after child starts berry drag');
  const returnBox=await returnTray.boundingBox();
  assert.ok(returnBox&&returnBox.width>=44&&returnBox.height>=44,
    label+' temporary berry-return target must be touch-sized');
  await page.mouse.move(returnBox.x+returnBox.width/2,returnBox.y+returnBox.height/2,{steps:8});
  assert.equal(await page.locator('.gm-return-tray.gm-drop-target').count(),1,
    label+' return crate must glow when the strawberry is over it');
  await page.mouse.up();
  assert.deepEqual((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).counts,[3,3,2],
    label+' returning berry after completion must remove exactly one, not reset the adventure');
  assert.equal(await page.locator('.gm-return-tray').count(),0,
    label+' temporary return target disappears after drop');
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).wins.length,1,
    label+' earned blossom survives removing a berry after completion');
  await page.locator('[data-gm-action="undo"]').click();
  assert.deepEqual((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).counts,[3,3,3],
    label+' undo restores the completed baskets without duplicating a flower');
  assert.equal(await page.locator('.gm-actions-complete .gm-next').count(),1,'one clear next action');
  const celebrationOverlap=await page.evaluate(()=>{
    const r=s=>document.querySelector(s).getBoundingClientRect();
    const a=r('.gm-celebration'),b=r('.gm-fox-bubble'),fox=r('.gm-troll-stage'),math=r('.gm-math');
    return {overlap:a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top,
      bubbleMathOverlap:b.left<math.right&&b.right>math.left&&b.top<math.bottom&&b.bottom>math.top,
      foxMathOverlap:fox.left<math.right&&fox.right>math.left&&fox.top<math.bottom&&fox.bottom>math.top,
      celebrationTop:a.top,foxBottom:fox.bottom,bubbleBottom:b.bottom,mathTop:math.top,viewportHeight:innerHeight,
      nextBottom:r('.gm-actions-complete .gm-next').bottom};
  });
  assert.equal(celebrationOverlap.overlap,false,label+' celebration must not cover the personal fox '+JSON.stringify(celebrationOverlap));
  if(viewport.width>=900&&viewport.height<=950){
    assert.equal(celebrationOverlap.bubbleMathOverlap,false,
      label+' completed iPad maths must stay fully readable beside the fox praise '+JSON.stringify(celebrationOverlap));
    assert.equal(celebrationOverlap.foxMathOverlap,false,
      label+' completed iPad personal fox must not stand on the final maths parchment '+JSON.stringify(celebrationOverlap));
  }
  if(viewport.height>=750||viewport.width<=360)assert.ok(celebrationOverlap.nextBottom<=viewport.height+3,label+' completed-child next action missing from first fold '+JSON.stringify(celebrationOverlap));
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).wins.length,1);
  await page.locator('[data-gm-action="undo"]').click();
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).wins.length,1,'earned blossom survives undo');
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).equation.complete,false);
  await selectAndPick(page,2,1);
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).wins.length,1,'replaying must not duplicate blossom');
  await shot(page,label+'-02-all-baskets-full');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.LARIA_GANGEMAGI?.version==='playable-v1');
  await page.evaluate(()=>window.openMultiplicationLab());
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).wins.length,1);
  assert.equal((await page.locator('.gm-math-equation').innerText()).trim(),'3 × 3 = 9');
  await page.locator('[data-gm-action="open-book"]').click();
  assert.equal(await page.locator('.gm-book-mission').count(),8,'all market adventures available');
  assert.equal(await page.locator('.gm-book-open[role="dialog"][aria-modal="true"]').count(),1,'open journal is a real immersive view');
  assert.equal(await page.locator('.gm-book-fox-art [data-avatar="girl"]').count(),1,'journal keeps the chosen fox');
  assert.equal(await page.locator('.gm-book-open .gm-book-pages').count(),1,'mission pages appear in the book');
   assert.equal(await page.locator('.gm-book-back').count(),1,'only one visible return control');
   assert.equal(await page.locator('.gm-book-open .gm-book-toggle').count(),0,'do not show a duplicate close control');
   assert.equal(await page.locator('.gm-book-fox-line').count(),1,'personal fox gives context');
   assert.equal(await page.locator('.gm-book-trophy').count(),1,'visible flower collection');
   const approvedImage=await page.request.get(new URL('gangemagi-approved-eight-scenes-20261017.webp',url).href);
   assert.equal(approvedImage.status(),200,'the approved original art must load');
   assert.match(approvedImage.headers()['content-type'],/image\/webp/,'original art has WebP MIME type');
  assert.equal(await page.locator('.gm-world').evaluate(el=>el.inert),true,'underlying math actions inaccessible while choosing a mission');
  await shot(page,label+'-04-market-book');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.gm-book-open').count(),0,'Escape returns child to gameplay');
  await page.locator('[data-gm-action="open-book"]').click();
  const bookLayout=await page.evaluate(()=>{
    const scenes=[...document.querySelectorAll('.gm-book-landscape')];
    return {pageWidth:document.documentElement.scrollWidth,screenWidth:innerWidth,count:scenes.length,
      assets:scenes.every(x=>getComputedStyle(x).backgroundImage.includes('gangemagi-approved-eight-scenes-20261017.webp')),
      distinct:new Set(scenes.map(x=>getComputedStyle(x).backgroundPosition)).size===8,
      rightOrder:scenes.every((x,i)=>Number(x.dataset.gmArtIndex)===i),
      touch:[...document.querySelectorAll('.gm-book-mission')].every(x=>x.getBoundingClientRect().height>=44)};
  });
  assert.ok(bookLayout.assets&&bookLayout.distinct&&bookLayout.rightOrder&&bookLayout.touch&&bookLayout.pageWidth<=bookLayout.screenWidth+4,
    label+' market-book illustrations, touch targets and widths '+JSON.stringify(bookLayout));
  assert.equal(await page.locator('.gm-book-earned').count(),1,'one earned flower marked in book');
  await page.locator('[data-gm-action="select-mission"][data-index="7"]').click();
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).mission,7);
  assert.equal(await page.locator('.gm-quest-wicker').count(),3,
    label+' two-group illustration contains two mini baskets and one instructional basket');
  assert.equal(await page.locator('.gm-quest-filled-preview .gm-quest-mini-basket').count(),2,
    'final instructional art must follow the selected two-group mission');
  assert.equal(await page.locator('.gm-quest-filled-preview .gm-quest-mini-berries i').count(),0,
    label+' the ten-berry adventure starts with TWO EMPTY illustrated baskets, not its answer');
  assert.match((await page.locator('.gm-quest-callout').innerText()).replace(/\s+/g,' '),/Fyll 2 kurver med 10 jordbær i hver/,
    'quest text and numbers follow selected authored mission');
  assert.deepEqual(await page.locator('.gm-quest-step strong').allInnerTexts(),
    ['Velg troll','Velg kurv','Se gangemagien'],'step counts match actual mission, not a screenshot');
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).undo,0,'switching adventures clears only action history');
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).wins.length,1);
  assert.equal(await page.locator('.gm-book-mission').count(),0,'book should close after selection');
  /* Compare EACH actual authored mission with its equation and guide. Capture
     mission 4 to match the specific approved "3 baskets of 4" illustration. */
  if(label==='webkit-iphone390'||label==='chrome-ipad-landscape'){
    for(const [index,mission] of Engine.MISSIONS.entries()){
      await page.locator('[data-gm-action="open-book"]').click();
      await page.locator('[data-gm-action="select-mission"][data-index="'+index+'"]').click();
      const actual=await page.evaluate(()=>LARIA_GANGEMAGI.snapshot());
      assert.equal(actual.mission,index,'eight adventures preserve authored order');
      assert.deepEqual(actual.counts,Array(mission.groups).fill(0),
        'switching mission starts with empty baskets and keeps flower history');
      assert.equal(await page.locator('.gm-crate').count(),mission.groups,
        label+' must show the authored number of clickable wicker baskets');
      assert.equal(await page.locator('.gm-quest-mini-berries i').count(),0,
        label+' chapter '+(index+1)+' pictured baskets must start empty before play');
      const stepTexts=await page.locator('.gm-quest-step strong').allInnerTexts();
      assert.equal(stepTexts[2],
        'Se gangemagien',
        label+' step three invites discovery rather than giving away the answer');
      const bounds=await page.evaluate(()=>{
        const a=document.querySelector('.gm-quest-callout').getBoundingClientRect();
        const b=document.querySelector('.gm-pick').getBoundingClientRect();
        return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,
          headingLeft:a.left,headingRight:a.right,buttonTop:b.top,buttonBottom:b.bottom};
      });
      assert.ok(bounds.scrollWidth<=bounds.width+4&&bounds.headingLeft>=-1&&
        bounds.headingRight<=bounds.width+1&&bounds.buttonTop>=0&&
        bounds.buttonBottom<=bounds.height+3,
        label+' mission '+(index+1)+' must fit its first screen '+JSON.stringify(bounds));
      if(index===3)await shot(page,label+'-07-locked-reference-mission-4');
      if(index===5)await shot(page,label+'-08-three-baskets-of-six');
    }
  }
  // The five-basket mission is visually the most constrained responsive state.
  // Preserve five clear, real basket targets and the full illustration in WebKit.
  await page.locator('[data-gm-action="open-book"]').click();
  await page.locator('[data-gm-action="select-mission"][data-index="4"]').click();
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).groups,5);
  assert.equal(await page.locator('.gm-crate').count(),5,
    label+' five group mission retains five real independently tappable baskets');
  assert.equal(await page.locator('.gm-quest-wicker').count(),6,
    label+' five preview baskets + one instructional basket');
  const five=await page.locator('.gm-crate').evaluateAll(els=>({
    width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
    labels:els.map(el=>el.querySelector('.gm-crate-caption')?.textContent.trim()),
    tapWidths:els.map(el=>Math.round(el.getBoundingClientRect().width))
  }));
  assert.ok(five.scrollWidth<=five.width+4&&five.tapWidths.every(n=>n>=44),
    label+' dense five-basket mission must fit width with 44px touch targets '+JSON.stringify(five));
  assert.deepEqual(five.labels,['Kurv 1','Kurv 2','Kurv 3','Kurv 4','Kurv 5']);

  const verifyCompactFiveCounts=async()=>{
    if(viewport.width>360)return;
    const counts=await page.locator('.gm-group-counts').evaluate(el=>{
      const frame=el.closest('.gm-math').getBoundingClientRect();
      const nodes=[...el.querySelectorAll('.gm-group-count')];
      return {count:nodes.length,plus:el.querySelectorAll(':scope>i').length,
        overflow:el.scrollWidth-el.clientWidth,
        inside:nodes.every(n=>{const r=n.getBoundingClientRect();return r.left>=frame.left-1&&r.right<=frame.right+1;}),
        values:nodes.map(n=>n.querySelector('b')?.textContent.trim())};
    });
    assert.equal(counts.count,5,label+' five numeric basket counts must exist');
    assert.equal(counts.plus,4,label+' four addition separators must exist');
    assert.ok(counts.overflow<=1&&counts.inside,
      label+' no clipped fifth group on 320px maths parchment '+JSON.stringify(counts));
  };
  await verifyCompactFiveCounts();
  const mathsLayout=async()=>{
    return await page.locator('.gm-math').evaluate(root=>{
      const equation=root.querySelector('.gm-math-equation'),progress=root.querySelector('.gm-berry-progress');
      const a=equation.getBoundingClientRect(),b=progress.getBoundingClientRect();
      const overlap=a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;
      return {overlap,textWidth:equation.scrollWidth,availableWidth:equation.clientWidth,
        fontSize:parseFloat(getComputedStyle(equation).fontSize),
        progressRight:b.right,panelRight:root.getBoundingClientRect().right};
    });
  };
  if(viewport.width<700){
    const m=await mathsLayout();
    assert.equal(m.overlap,false,label+' live 5-group addition must NOT overlap berry progress '+JSON.stringify(m));
    assert.ok(m.textWidth<=m.availableWidth+2&&m.fontSize>=17&&m.progressRight<=m.panelRight+2,
      label+' five-basket maths must remain legible and within the panel '+JSON.stringify(m));
  }
  await shot(page,label+'-05-five-basket-mission');
  if(viewport.width<=360){
    await chooseTrollAndPlace(page,0,0);
    assert.equal((await page.locator('.gm-math-equation').innerText()).trim(),'1 + 0 + 0 + 0 + 0 = 1',
      label+' first actual berry updates all five numeric groups');
    await verifyCompactFiveCounts();
    const partial=await mathsLayout();
    assert.ok(partial.textWidth<=partial.availableWidth+2&&partial.fontSize>=17,
      label+' partial five-group equation remains readable '+JSON.stringify(partial));
    await shot(page,label+'-05-five-basket-one-berry');
  }
  await page.locator('[data-gm-action="open-book"]').click();
  await page.locator('[data-gm-action="select-mission"][data-index="6"]').click();
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).groups,4);
  if(viewport.width<700){
    const m=await mathsLayout();
    assert.equal(m.overlap,false,label+' 4×4 addition must not intersect visual strawberry progress '+JSON.stringify(m));
    assert.ok(m.textWidth<=m.availableWidth+2&&m.fontSize>=17,
      label+' 4×4 addition must stay complete and child-readable '+JSON.stringify(m));
  }
  await shot(page,label+'-06-four-basket-mission');
  await page.locator('[data-gm-action="open-book"]').click();
  await page.locator('[data-gm-action="select-mission"][data-index="0"]').click();
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).mission,0);
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).equation.complete,false);
  for(let group=0;group<3;group++)await selectAndPick(page,group,3);
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).wins.length,1,'replay keeps unique flower');
  await page.locator('[data-gm-action="next"]').click();
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).groups,2);
  assert.deepEqual(await page.locator('.gm-secondary-nav button strong').allInnerTexts(),
    ['Fri lek','Markedsbok','Gangetabellen'],
    label+' mission mode needs three real secondary choices instead of a selected mode toggle');
  assert.equal(await page.locator('.gm-modes').count(),0,label+' remove the passive old mission/free segmented control');
  await page.locator('[data-gm-action="open-book-secondary"]').click();
  assert.equal(await page.locator('.gm-book-open[role="dialog"]').count(),1,
    label+' secondary Markedsbok choice must open the same real eventyrbok');
  await page.keyboard.press('Escape');
  await page.locator('[data-gm-action="mode"][data-mode="free"]').click();
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).mode,'free');
  assert.deepEqual(await page.locator('.gm-secondary-nav button strong').allInnerTexts(),
    ['Oppdrag','Markedsbok','Gangetabellen'],
    label+' free play must offer an obvious way back plus book and classic table');
  assert.equal(await page.locator('.gm-quest').count(),0,'free play keeps its existing independent controls');

  // Free play has a single-icon pickup button, not the mission's five-berry
  // crate. Stacking crate art here used to paint over the mode/factor controls.
  const freeSupply=page.locator('[data-gm-action="source"]');
  assert.equal(await freeSupply.locator('.gm-source-berry').count(),0,
    label+' free play must not inherit the mission crate pile');
  assert.equal(await freeSupply.locator('.gm-pick-fruit [data-gm-prop="berry"]').count(),1,
    label+' free pickup button has exactly one illustrated fruit');
  const freeProp=await freeSupply.evaluate(button=>{
    const b=button.getBoundingClientRect();
    const f=button.querySelector('.gm-pick-fruit svg').getBoundingClientRect();
    return {inside:f.left>=b.left-1&&f.right<=b.right+1&&f.top>=b.top-1&&f.bottom<=b.bottom+1,
      button:b.toJSON(),fruit:f.toJSON()};
  });
  assert.ok(freeProp.inside,label+' free-play fruit must stay inside its own button '+JSON.stringify(freeProp));
  const freeBefore=(await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).counts;
  await freeSupply.click();
  assert.deepEqual((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).counts,
    freeBefore.map((n,i)=>n+(i===0?1:0)),label+' free pickup still adds exactly one berry');
  await page.locator('[data-gm-action="undo"]').click();
  assert.deepEqual((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).counts,freeBefore,
    label+' undo restores free play after the pickup regression');

  assert.match(await page.locator('.gm-story').innerText(),/Ditt eget jordbærmarked/);
  await page.locator('[data-gm-action="factor"][data-key="groups"][data-step="1"]').click();
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).groups,3);
  await page.locator('[data-gm-action="basket"][data-gm-basket="0"]').click();
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).equation.multiplication,null);
  // Maximal load: every real item remains visible even with five small baskets.
  await page.locator('[data-gm-action="factor"][data-key="groups"][data-step="1"]').click();
  await page.locator('[data-gm-action="factor"][data-key="groups"][data-step="1"]').click();
  for(let i=0;i<5;i++)await page.locator('[data-gm-action="factor"][data-key="each"][data-step="1"]').click();
  const dense=await page.locator('.gm-fruit-bed').first().evaluate(el=>{
    const bed=el.getBoundingClientRect(),front=el.closest('.gm-crate').querySelector('.gm-crate-front').getBoundingClientRect();
    const fruits=[...el.querySelectorAll('.gm-fruit')].map(f=>f.getBoundingClientRect());
    return {count:fruits.length,columns:getComputedStyle(el).gridTemplateColumns.split(' ').length,
      inside:fruits.every(f=>f.width>=11&&f.height>=16&&f.top>=bed.top-1&&f.bottom<=bed.bottom+1),
      aboveFront:fruits.every(f=>f.bottom<=front.top+3),
      scrollWidth:document.documentElement.scrollWidth,innerWidth:innerWidth};
  });
  assert.equal(dense.count,10,label+' dense basket must show ten individual slots');
  assert.equal(dense.columns,5,label+' dense basket needs an even 5x2 arrangement');
  assert.ok(dense.inside&&dense.aboveFront,label+' fruit hidden behind a basket front '+JSON.stringify(dense));
  assert.ok(dense.scrollWidth<=dense.innerWidth+4,label+' five baskets overflow the page');
  await shot(page,label+'-03-free-play');
  await page.locator('[data-gm-action="classic"]').click();
  await page.locator('.mp-home-screen').waitFor();
  await page.locator('.gm-classic-return').click();
  await page.locator('.gm-shell').waitFor();

  // Every authored adventure must remain a REAL, tappable scene across all
  // six browser/viewport combinations, not just the attractive first 3 × 3.
  // Check every chapter's mission title, pictured groups, live mathematical
  // controls, touch widths and ability to add the FIRST fruit to a basket.
  const allMissions=require('../laer-litt-mer/multiplication-gangemagi-engine-v1.js').MISSIONS;
  for(const [index,spec] of allMissions.entries()){
    await page.locator('[data-gm-action="open-book"]').click();
    await page.locator('[data-gm-action="select-mission"][data-index="'+index+'"]').click();
    const snapshot=await page.evaluate(()=>LARIA_GANGEMAGI.snapshot());
    assert.equal(snapshot.mission,index,label+' chapter '+(index+1)+' mission selection');
    assert.equal(snapshot.mode,'mission');
    assert.equal(snapshot.groups,spec.groups);
    assert.equal(snapshot.each,spec.each);
    assert.deepEqual(snapshot.counts,Array(spec.groups).fill(0));
    assert.equal(await page.locator('.gm-crate').count(),spec.groups,
      label+' chapter '+(index+1)+' real interactive basket count');
    assert.equal(await page.locator('.gm-quest-filled-preview .gm-quest-mini-basket').count(),spec.groups,
      label+' chapter '+(index+1)+' illustrated group count');
    assert.equal(await page.locator('.gm-quest-mini-berries i').count(),0,
      label+' chapter '+(index+1)+' pictures start empty, not with a pre-filled result');
    const heading=(await page.locator('.gm-quest-callout').innerText()).replace(/\s+/g,' ');
    assert.equal(heading,'Fyll '+spec.groups+' '+(spec.groups===1?'kurv':'kurver')+
      ' med '+spec.each+' jordbær i hver.',label+' chapter '+(index+1)+' child instruction');
    const boxes=await page.locator('.gm-crate').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().width));
    assert.ok(boxes.every(width=>width>=44),
      label+' chapter '+(index+1)+' each real basket has a 44px touch width: '+JSON.stringify(boxes));
    await page.locator('[data-gm-action="troll"][data-gm-troll="'+(index%3)+'"]').click();
    assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).selectedTroll,index%3,
      label+' chapter '+(index+1)+' troll can be selected');
    await page.locator('[data-gm-basket="0"] .gm-crate-front').click();
    await page.waitForFunction(()=>window.LARIA_GANGEMAGI.snapshot().counts[0]===1);
    const after=await page.evaluate(()=>LARIA_GANGEMAGI.snapshot());
    assert.equal(after.counts[0],1,label+' chapter '+(index+1)+' one deliberate pick and placement adds exactly one berry');
    assert.equal(after.equation.total,1,label+' chapter '+(index+1)+' visible maths tracks first berry');
    assert.equal(await page.locator('.gm-quest-mini-berries i').count(),1,
      label+' chapter '+(index+1)+' the live illustration counts exactly one placed berry');
  }
  // An earned eighth flower must end at a real celebration, not silently
  // wrap to the first chapter. The pure engine verifies actual fruit packing;
  // here we verify the child-facing choices on every real test device.
  await page.evaluate(ids=>{
    const current=JSON.parse(localStorage.getItem('laria-gangemagi-v1')||'{}');
    localStorage.setItem('laria-gangemagi-v1',JSON.stringify({
      ...current,mode:'mission',mission:7,groups:2,each:10,
      counts:[10,10],wins:ids
    }));
  },allMissions.map(m=>m.id));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.LARIA_GANGEMAGI?.version==='playable-v1');
  await page.evaluate(()=>window.openMultiplicationLab());
  assert.equal(await page.locator('.gm-shell[data-gm-finale="true"]').count(),1,
    label+' chapter eight must have an explicit celebratory scene');
  assert.match(await page.locator('.gm-celebration-copy strong').innerText(),/Hele markedet feirer/);
  assert.equal(await page.locator('[data-gm-action="next"]').count(),0,
    label+' the completed market must not silently restart at chapter one');
  assert.equal(await page.locator('.gm-actions-complete .gm-next[data-gm-action="mode"][data-mode="free"]').count(),1,
    label+' child may opt into free play, rather than being pushed along');
  assert.equal(await page.locator('.gm-finale-book[data-gm-action="open-book"]').count(),1,
    label+' the saved completed favourites remain accessible');
  const finaleLayout=await page.evaluate(()=>{
    const buttons=[...document.querySelectorAll('.gm-actions-complete button')].map(b=>b.getBoundingClientRect());
    return {overflow:document.documentElement.scrollWidth-innerWidth,
      touch:buttons.map(b=>({width:b.width,height:b.height})),
      overlap:buttons.length>1&&buttons[0].left<buttons[1].right-2&&buttons[0].right>buttons[1].left+2&&buttons[0].top<buttons[1].bottom-2&&buttons[0].bottom>buttons[1].top+2};
  });
  assert.ok(finaleLayout.overflow<=4&&!finaleLayout.overlap&&
    finaleLayout.touch.every(b=>b.width>=44&&b.height>=44),
    label+' final choices must be separated, legible and touch-sized '+JSON.stringify(finaleLayout));
  await shot(page,label+'-09-completed-market-finale');
  await page.locator('.gm-actions-complete .gm-next[data-gm-action="mode"][data-mode="free"]').click();
  const afterFinale=await page.evaluate(()=>LARIA_GANGEMAGI.snapshot());
  assert.equal(afterFinale.mode,'free','finale moves to free play only when chosen');
  assert.equal(afterFinale.wins.length,8,'all flowers survive the free-play transition');
  await page.evaluate(()=>showScreen('home'));
  await page.locator('#home-screen.active').waitFor();
  const returnedHome=await page.locator('.app').evaluate(el=>({
    young:el.classList.contains('grade-band-young'),
    image:getComputedStyle(el).backgroundImage,
    color:getComputedStyle(el).backgroundColor,
    gameActive:!!el.querySelector('#multiplication-lab-screen.active .gm-shell')
  }));
  assert.deepEqual(returnedHome,homeTheme,
    label+' returning to Home must restore the original background and grade');
  assert.deepEqual(errors,[],label+' browser exceptions '+JSON.stringify(errors));
  console.log('PASS GANGEMAGI '+label);
 }finally{await context.close();}
}
// Landscape iPhone is an explicitly locked Safari release target, distinct
// from iPad landscape. Its 390px height may scroll, but never horizontally.
async function checkLandscape(engine,label,url){
 const viewport={width:844,height:390};
 const context=await engine.newContext({viewport,isMobile:true,hasTouch:true,
   deviceScaleFactor:1,serviceWorkers:'block'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 try{
   await page.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed);
   await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.LARIA_GANGEMAGI?.version==='playable-v1');
   await page.evaluate(()=>window.openMultiplicationLab());
   await page.locator('#multiplication-lab-screen.active .gm-shell').waitFor();
   assert.match((await page.locator('.gm-quest-callout').innerText()).replace(/\s+/g,' '),
     /Fyll 3 kurver med 3 jordbær i hver/,label+' original task must survive short landscape');
   assert.equal(await page.locator('.gm-crate').count(),3,
     label+' three functional illustrated baskets survive landscape');
   const geometry=await page.evaluate(()=>{
     const box=s=>document.querySelector(s).getBoundingClientRect();
     const back=box('.gm-back'),title=box('.gm-top-title'),
       progress=box('.gm-top-progress'),book=box('.gm-book-quick');
     const overlap=(a,b)=>a.left<b.right-2&&a.right>b.left+2&&a.top<b.bottom-2&&a.bottom>b.top+2;
     const baskets=[...document.querySelectorAll('.gm-crate')].map(el=>el.getBoundingClientRect());
     const source=box('.gm-market-fruit-supply .gm-pick');
     return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
       topOverlap:overlap(back,title)||overlap(title,progress)||overlap(progress,book),
       basketWidths:baskets.map(b=>b.width),sourceWidth:source.width,
       sourceHeight:source.height,sourceTop:source.top};
   });
   assert.ok(geometry.scrollWidth<=geometry.width+4,
     label+' never let the landscape page scroll sideways '+JSON.stringify(geometry));
   assert.equal(geometry.topOverlap,false,
     label+' landscape header must not overlap back/title/progress/collection '+JSON.stringify(geometry));
   assert.ok(geometry.basketWidths.every(w=>w>=44)&&
     geometry.sourceWidth>=44&&geometry.sourceHeight>=44,
     label+' child-sized interactive props on landscape '+JSON.stringify(geometry));
   // Visual first-fold contract: a child in landscape must SEE the real game,
   // not only a wooden instruction board. Vertical scrolling stays available
   // for secondary modes, but the fruit source and baskets start on-screen.
   const fold=await page.evaluate(()=>{
     const rect=s=>document.querySelector(s).getBoundingClientRect();
     return {height:innerHeight,boardBottom:rect('.gm-story.gm-quest').bottom,
       firstBasketBottom:rect('.gm-crate').bottom,
       sourceBottom:rect('.gm-market-fruit-supply .gm-pick').bottom,
       mathTop:rect('.gm-math').top,mathBottom:rect('.gm-math').bottom};
   });
   assert.ok(fold.firstBasketBottom<=fold.height+3&&
     fold.sourceBottom<=fold.height+3&&fold.mathTop<fold.height,
     label+' real baskets, pickup source and live maths must enter FIRST landscape viewport '+JSON.stringify(fold));
   await shot(page,label+'-01-first-look');
   // The short viewport is deliberately scrollable. The child still chooses
   // a troll first and then a real basket with touch taps.
   await page.locator('[data-gm-action="troll"][data-gm-troll="1"]').tap();
   assert.deepEqual((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).counts,[0,0,0],
     label+' first touch chooses lillesøster and picks one berry');
    const touchLayer=await page.evaluate(()=>{
      const basket=document.querySelector('[data-gm-action="basket"][data-gm-basket="1"]');
      const front=basket.querySelector('.gm-crate-front').getBoundingClientRect();
      const x=front.left+front.width/2,y=front.top+front.height/2;
      const hit=document.elementFromPoint(x,y);
      return {basket:!!hit?.closest?.('[data-gm-action="basket"][data-gm-basket="1"]'),
        troll:!!hit?.closest?.('[data-gm-action="troll"]'),
        holding:document.querySelector('.gm-shell')?.dataset.gmHolding,
        moving:document.querySelector('.gm-shell')?.dataset.gmTrollMoving};
    });
    assert.equal(touchLayer.holding,'true',label+' selected troll exposes the basket interaction step');
    assert.equal(touchLayer.troll,false,
      label+' troll artwork must not steal the chosen basket touch target '+JSON.stringify(touchLayer));
    assert.equal(touchLayer.basket,true,
      label+' selected basket surface remains the actual hit target '+JSON.stringify(touchLayer));
   await page.locator('[data-gm-action="basket"][data-gm-basket="1"] .gm-crate-front').tap();
   await page.waitForFunction(()=>window.LARIA_GANGEMAGI.snapshot().counts[1]===1);
   assert.deepEqual((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).counts,[0,1,0],
     label+' second touch lets the troll place exactly one berry despite scrolling');
   assert.equal((await page.locator('.gm-math-equation').innerText()).trim(),'0 + 1 + 0 = 1',
     label+' displayed maths follows landscape touch placement');
   await shot(page,label+'-02-one-berry');
   await page.locator('[data-gm-basket="1"] .gm-fruit[data-gm-fruit]').first().tap();
   assert.deepEqual((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).counts,[0,0,0],
     label+' landscape berry can be touched to remove it');
   // The two dense mission layouts were missing from short-landscape visual QA.
   // Test the real illustrated five-basket step and a full ten-berry basket,
   // not only the introductory 3×3 lesson.
   for(const spec of [{index:4,groups:5,each:2,slug:'five-baskets'},
                      {index:7,groups:2,each:10,slug:'ten-berries'}]){
     await page.evaluate(index=>window.LARIA_GANGEMAGI.openMission(index),spec.index);
     const snap=await page.evaluate(()=>LARIA_GANGEMAGI.snapshot());
     assert.equal(snap.groups,spec.groups,label+' '+spec.slug+' real basket count');
     assert.equal(snap.each,spec.each,label+' '+spec.slug+' authored group size');
     assert.equal(await page.locator('.gm-quest-mini-basket').count(),spec.groups);
     assert.equal(await page.locator('.gm-quest-mini-berries i').count(),0,
       label+' '+spec.slug+' pictured baskets must start empty before play');
     const scene=await page.evaluate(()=>{
       const box=selector=>document.querySelector(selector).getBoundingClientRect();
       const mini=[...document.querySelectorAll('.gm-quest-step[data-gm-step="3"] .gm-quest-mini-basket')]
         .map(el=>el.getBoundingClientRect());
       const text=box('.gm-quest-step[data-gm-step="3"] strong');
       const source=box('.gm-market-fruit-supply .gm-pick');
       const basket=[...document.querySelectorAll('.gm-crate')].map(el=>el.getBoundingClientRect());
       return {scrollWidth:document.documentElement.scrollWidth,screen:innerWidth,height:innerHeight,
         labelLeft:text.left,previewRight:Math.max(...mini.map(x=>x.right)),
         miniWidths:mini.map(x=>x.width),basketWidths:basket.map(x=>x.width),
         basketBottom:Math.max(...basket.map(x=>x.bottom)),sourceBottom:source.bottom,
         mathTop:box('.gm-math').top};
     });
     assert.ok(scene.scrollWidth<=scene.screen+4&&
       scene.basketWidths.every(w=>w>=44)&&scene.basketBottom<=scene.height+3&&
       scene.sourceBottom<=scene.height+3&&scene.mathTop<scene.height,
       label+' '+spec.slug+' keeps all five/ten-berry gameplay elements in the first fold '+JSON.stringify(scene));
     assert.ok(scene.miniWidths.every(width=>width>=14)&&scene.previewRight<=scene.labelLeft-2,
       label+' '+spec.slug+' mini-basket art must not shrink or cover the instruction '+JSON.stringify(scene));
     await shot(page,label+'-03-'+spec.slug);
     if(spec.index===7){
       for(let i=0;i<10;i++)await chooseTrollAndPlace(page,i%3,0);
       const state=await page.evaluate(()=>LARIA_GANGEMAGI.snapshot());
       assert.deepEqual(state.counts,[10,0],label+' ten actual berries packed into one basket');
       assert.equal(await page.locator('.gm-quest-mini-berries i').count(),10,
         label+' illustrated ten-berry group reflects placement without showing a full solution');
       assert.equal((await page.locator('.gm-math-equation').innerText()).trim(),'10 + 0 = 10');
       const packed=await page.locator('[data-gm-basket="0"]').evaluate(basket=>{
         const front=basket.querySelector('.gm-crate-front').getBoundingClientRect();
         const berries=[...basket.querySelectorAll('.gm-fruit:not(.gm-fruit-empty)')]
           .map(el=>el.getBoundingClientRect());
         return {count:berries.length,frontTop:front.top,
           fruitBottom:Math.max(...berries.map(b=>b.bottom)),
           narrowest:Math.min(...berries.map(b=>b.width)),
           basketTop:basket.getBoundingClientRect().top};
       });
       assert.ok(packed.count===10&&packed.narrowest>=14&&
         packed.fruitBottom<=packed.frontTop+2,
         label+' ten countable berries must remain above the illustrated nameplate '+JSON.stringify(packed));
       await shot(page,label+'-04-ten-packed');
     }
   }
   assert.deepEqual(errors,[],label+' landscape browser errors '+JSON.stringify(errors));
   console.log('PASS GANGEMAGI '+label);
 }finally{await context.close();}
}

/* The existing Læria character must be the child's real saved boy OR girl.
   Ordinary Gangemagi tests exercise the girl; this checks the boy in the
   SAME real WebKit browser and his original full-body source, including book. */
async function checkBoyFox(browser,url){
 const context=await browser.newContext({viewport:{width:1180,height:820},hasTouch:true,
   deviceScaleFactor:1,serviceWorkers:'block',reducedMotion:'reduce'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 try{
   await page.addInitScript(s=>{
     localStorage.setItem('laerlittmer-v2',JSON.stringify(s));
   },{...seed,profile:{...seed.profile,avatar:'boy'}});
   await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.LARIA_GANGEMAGI?.version==='playable-v1');
   assert.equal(await page.evaluate(()=>window.LARIA_FOX.choice()),'boy',
     'profile-backed identity must remain the selected boy');
   await page.evaluate(()=>window.openMultiplicationLab());
   assert.equal(await page.locator('.gm-fox-art').count(),0,
     'Gangemagi mission uses the locked troll trio instead of the saved fox');
   assert.equal(await page.locator('[data-gm-action="troll"]').count(),3,
     'all three locked troll helpers are available for the boy profile too');
   const trollSources=await page.locator('[data-gm-action="troll"] img').evaluateAll(xs=>xs.map(x=>x.getAttribute('src')));
   assert.deepEqual(trollSources,[
     './assets/gangemagi-troll/storesoster.webp',
     './assets/gangemagi-troll/lillesoster.webp',
     './assets/gangemagi-troll/lillebror.webp'
   ],'profile choice must not alter the locked mission trio');
   await shot(page,'webkit-ipad-landscape-boy-profile-troll-mission');
   await page.locator('[data-gm-action="open-book"]').click();
   assert.equal(await page.locator('.gm-book-fox-art svg[data-avatar="boy"]').count(),1,
     'the actual saved boy fox remains in the Market Book');
   await page.keyboard.press('Escape');
   await page.locator('[data-gm-action="mode"][data-mode="free"]').click();
   assert.equal(await page.locator('.gm-fox-art svg[data-avatar="boy"]').count(),1,
     'the real boy fox remains in free play');
   assert.deepEqual(errors,[],'no boy-fox render errors in real WebKit');
   console.log('PASS GANGEMAGI WebKit personal boy fox and Market Book');
 }finally{await context.close()}
}

(async()=>{
 auditAllEightMissions();
 // Run the full historical suite locally with no filter. The CI matrix
 // splits the same Chromium and WebKit scenarios onto separate runners.
 const selected=process.env.GANGEMAGI_QA_BROWSER||'all';
 assert.ok(['all','chrome','webkit'].includes(selected),
   'unsupported requested browser filter: '+selected);
 const {srv,url}=await serve();
 let browsersTested=0;
 try{
  for(const [type,browserType,devices] of [
   ['chrome',chromium,[['iphone390',{width:390,height:844}],['ipad-landscape',{width:1180,height:820}]]],
   ['webkit',webkit,[['iphone-small',{width:320,height:568}],['iphone390',{width:390,height:844}],['ipad-portrait',{width:820,height:1180}],['ipad-landscape',{width:1180,height:820}]]]
  ]){
   if(selected!=='all'&&selected!==type)continue;
   browsersTested++;
   const browser=await browserType.launch({headless:true});
   try{for(const [device,viewport] of devices)await check(browser,type+'-'+device,viewport,url);
    await checkLandscape(browser,type+'-iphone-landscape',url);
    if(type==='webkit')await checkBoyFox(browser,url);
   }finally{await browser.close();}
  }
  assert.equal(browsersTested,selected==='all'?2:1,
    'every requested browser must execute all its unchanged viewport checks');
 }finally{await new Promise(resolve=>srv.close(resolve));}
})().catch(err=>{console.error(err);process.exitCode=1;});
