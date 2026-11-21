'use strict';
/* Actual exact-head WebKit/Chromium checks of owner-approved Grovanova v16. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const folder=process.env.HOME_V15_SCREENSHOTS||'/tmp/laria-home-v15';
fs.mkdirSync(folder,{recursive:true});
const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const seed={version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'Prøvebarn',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
 masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
 recentCountryWin:null,lastMilestone:null,lastActivity:null,journey:{nodes:{},gradeWins:{},viewGrades:{}},
 answerLog:[],sessionLog:[],activeSession:null};
async function run(engine,name,viewport,corrupt=false,desktop=false){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport,hasTouch:!desktop,serviceWorkers:'block'});
  const page=await context.newPage();
  const errors=[],legacyProbeRequests=[],homeArtRequests=[];
  const coldStartAt=Date.now();
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',req=>{
   if(/\/assets\/home-v16\/laria-grovanova-v16-(portrait|landscape)\.webp(?:\?|$)/.test(req.url()))homeArtRequests.push(req.url());
   if(/grovanova-ipad-(portrait|landscape)-master\.json/.test(req.url()))
    legacyProbeRequests.push(req.url());
  });
  await page.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed);
  const orientation=viewport.height>viewport.width?'portrait':'landscape';
  if(corrupt){
   await page.route('**/assets/home-v16/laria-grovanova-v16-approved.json',async route=>{
    const body=JSON.parse(fs.readFileSync('laer-litt-mer/assets/home-v16/laria-grovanova-v16-approved.json','utf8'));
    body.variants[orientation].sha256='0'.repeat(64);
    await route.fulfill({contentType:'application/json',body:JSON.stringify(body)});
   });
  }
  await page.goto(url+'&v16-review='+name,{waitUntil:'domcontentloaded'}); // assert default approved Home, no hidden preview flag
  const deviceProfile=await page.evaluate(()=>({
   touchPoints:navigator.maxTouchPoints||0,
   touchEvent:'ontouchstart' in window,
   pointerFine:matchMedia('(pointer:fine)').matches,
   hover:matchMedia('(hover:hover)').matches,
   desktop:window.LARIA_HOME_V16?.supportsDesktop?.()||false
  }));
  console.log('[Læria v16 device] '+name+' '+JSON.stringify(deviceProfile));
  const home=page.locator('#home-screen .bc12');
  await home.waitFor({state:'visible',timeout:25000});
  const expected=corrupt?(orientation==='portrait'?'phone-ready':'tablet-ready'):
   (desktop?'desktop':'ipad')+'-v16-'+orientation;
  await page.waitForFunction(value=>document.querySelector('#home-screen .bc12')?.dataset.bc15Asset===value,
   expected,{timeout:30000});
  const homeReadyMs=Date.now()-coldStartAt;
  console.log('[Læria v16 cold-start] '+name+' '+orientation+' '+homeReadyMs+'ms to approved-or-fallback Home');
  if(corrupt){
   assert.equal(await home.locator('.bc15-v16-sign').count(),0,'bad SHA must remove v16 signs');
   assert.equal(await home.locator('.bc15-v16-greeting').count(),0,'bad SHA must remove live v16 greeting');
   assert.equal(await home.locator('.bc15-v16-troll').count(),0,'bad SHA must remove v16 actor');
   assert.equal(await home.getAttribute('data-bc15-premium-art'),'blocked');
  }else{
   assert.equal(await home.getAttribute('data-bc15-card-art'),'owner-approved-v16-painted');
   assert.equal(await home.getAttribute('data-bc15-fit'),desktop?'approved-contain':'approved-cover');
   assert.equal(await home.getAttribute('data-bc15-v16-device'),desktop?'desktop':'ipad');
   assert.equal(await home.locator('.bc15-v16-sign').count(),4,'exactly four live subject hitboxes');
   assert.deepEqual(await home.locator('.bc15-v16-sign').evaluateAll(items=>items.map(x=>x.dataset.bc15Subject)),
    ['norwegian','math','english','geography']);
   assert.equal(await home.locator('.bc15-v16-reisen').count(),1,'separate Reisen route');
   assert.equal(await home.locator('.bc12-journey').count(),1,'existing Fortsett reisen route');
   assert.equal(await home.locator('.bc15-v16-greeting-name').textContent(),'Hei, Prøvebarn!');
   assert.equal(await home.locator('.bc15-boats').count(),0,'old boat positions cannot move to new art');
   assert.equal(await home.locator('.bc15-approved-logo').count(),0,'no duplicate logo over painted source');
   assert.equal(await home.locator('.bc14-subjects').getAttribute('aria-hidden'),'true',
    'legacy subject row must remain inaccessible');
   const nav=await home.locator('.bc12-nav button').evaluateAll(buttons=>
     buttons.map(x=>({name:x.dataset.camp,display:getComputedStyle(x).display})));
   assert.deepEqual(nav.filter(x=>x.display!=='none').map(x=>x.name),
    ['home','explore','collection','wardrobe'],'only four bottom navigation buttons');
   const layout=await home.evaluate(el=>{
    const box=el.getBoundingClientRect();
    const bg=getComputedStyle(el,'::after');
    const signBoxes=[...el.querySelectorAll('.bc15-v16-sign')].map(x=>x.getBoundingClientRect());
    return {vw:box.width,vh:box.height,
     aw:parseFloat(el.style.getPropertyValue('--bc15-art-width')),
     ah:parseFloat(el.style.getPropertyValue('--bc15-art-height')),
     bg:bg.backgroundImage,mask:bg.webkitMaskImage||bg.maskImage,
     artLeft:parseFloat(el.style.getPropertyValue('--bc15-art-left')),
     artTop:parseFloat(el.style.getPropertyValue('--bc15-art-top')),
     signs:signBoxes.map(x=>({
      x:x.x-box.x,y:x.y-box.y,width:x.width,height:x.height,
      right:x.right-box.x,bottom:x.bottom-box.y
     }))};
   });
   assert.match(layout.bg,/blob:/,'background must come from verified WebP bytes');
   assert.equal(layout.mask,'none','full-screen art must not inherit legacy edge masks');
   if(desktop){
    assert(layout.aw<=layout.vw+.5&&layout.ah<=layout.vh+.5,
      'Mac image must fit entirely in viewport without cropping: '+JSON.stringify(layout));
    assert(Math.abs(layout.artLeft*2+layout.aw-layout.vw)<2,
      'Mac artwork must be centered horizontally');
    assert(Math.abs(layout.artTop*2+layout.ah-layout.vh)<2,
      'Mac artwork must be centered vertically');
    assert(layout.signs.every(x=>x.x>=-1&&x.y>=-1&&x.right<=layout.vw+1&&x.bottom<=layout.vh+1),
      'Mac painted signs must never be cropped: '+JSON.stringify(layout));
   }else{
    assert(layout.aw>=layout.vw-.5&&layout.ah>=layout.vh-.5,'iPad image must cover full screen');
   }
   assert(layout.signs.every(x=>x.width>=44&&x.height>=44),'accessible sign targets >=44px');

   const actor=home.locator('.bc15-v16-troll');
   assert.equal(await actor.count(),1,'v16 must display exactly one live TrollActor');
   await actor.locator('img').evaluate(img=>img.decode());
   const troll=await actor.evaluate(el=>{
    const img=el.querySelector('img'),r=el.getBoundingClientRect();
    const nav=el.closest('.bc12').querySelector('.bc12-nav').getBoundingClientRect();
    const style=getComputedStyle(el);
    return {id:el.dataset.troll,source:img.getAttribute('src'),decoded:img.naturalWidth>0,
     width:r.width,height:r.height,bottom:r.bottom,navTop:nav.top,
     visible:style.display!=='none'&&style.visibility!=='hidden'};
   });
   assert.equal(troll.id,'storesoster','the selected default troll was not loaded');
   assert.match(troll.source,/storesoster\.webp$/);
   assert(troll.decoded&&troll.visible&&troll.width>=44&&troll.height>=44,
    'TrollActor must be a decoded visible separate image: '+JSON.stringify(troll));
   assert(troll.bottom<=troll.navTop+4,'the actor cannot overlap the footer: '+JSON.stringify(troll));
   const fname=name+'-v16-'+orientation+(corrupt?'-sha-fallback':'')+'.png';
   if(!corrupt)await page.screenshot({path:path.join(folder,fname),fullPage:true});
   await home.locator('.bc15-v16-reisen').click();
   const dialog=page.locator('#bc15-v16-journey-dialog');
   await dialog.waitFor({state:'visible',timeout:10000});
   assert.equal(await dialog.locator('.bc15-v16-journey-choices button').count(),4);
   await dialog.locator('.bc15-v16-dialog-close').click();
   assert.equal(await dialog.isVisible(),false);
   await actor.click();
   assert.equal(await actor.getAttribute('data-laria-troll-mood'),'wave','TrollActor tap must wave');
   await home.locator('.bc12-nav [data-camp="wardrobe"]').click();
   const chooser=page.locator('#laria-premium-troll-dialog');
   await chooser.waitFor({state:'visible',timeout:10000});
   await chooser.locator('[data-troll-choice="lillesoster"]').click();
   await page.waitForFunction(()=>document.querySelector('.bc15-v16-troll')?.dataset.troll==='lillesoster');
   assert.match(await actor.locator('img').getAttribute('src'),/lillesoster\.webp$/);
   await chooser.waitFor({state:'hidden',timeout:10000});
   const norwegian=home.locator('.bc15-v16-sign[data-bc15-subject="norwegian"]');
   if(desktop){
    await norwegian.focus();
    assert.equal(await norwegian.evaluate(el=>document.activeElement===el),true,
      'Mac signs must be keyboard-focusable');
    await page.keyboard.press('Enter');
   }else await norwegian.click();
   await page.locator('#subject-screen.active #eggenipa-world').waitFor({state:'visible',timeout:20000});
   await page.locator('#eggenipa-world [data-eg="home"]').click();
   await page.waitForFunction(device=>document.querySelector('#home-screen.active .bc12')?.dataset.bc15Asset===
     device+'-v16-'+(matchMedia('(orientation:portrait)').matches?'portrait':'landscape'),
     desktop?'desktop':'ipad',{timeout:30000});
   assert.equal(await home.locator('.bc15-v16-troll').getAttribute('data-troll'),'lillesoster',
    'selected TrollActor must survive the return from Norsk');
   assert.equal(homeArtRequests.length,1,
    'Home v16 image must be fetched and SHA-verified only once per same-orientation session: '+JSON.stringify(homeArtRequests));
   console.log('[Læria v16 cached-return] '+name+' verified Home image requests: '+homeArtRequests.length);
  }
  assert.deepEqual(legacyProbeRequests,[],name+' must not probe retired v15 approval manifests');
  assert.deepEqual(errors,[],name+' JS exceptions');
  console.log('[Læria v16] '+name+' '+orientation+(corrupt?' invalid SHA fallback':' owner-locked full-screen')+' OK');
  await context.close();
 }finally{await browser.close();}
}
(async()=>{
 for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
  for(const [size,viewport] of [
   ['1024x1366',{width:1024,height:1366}],
   ['820x1180',{width:820,height:1180}],
   ['1180x820',{width:1180,height:820}],
   ['1024x768',{width:1024,height:768}]
  ])await run(engine,engineName+'-'+size,viewport);
  await run(engine,engineName+'-invalidsha-portrait',{width:1024,height:1366},true);
  // Mac Safari/WebKit and Chromium: desktop pointer, not a simulated iPad.
  // Full pixels, functional painted signs, one living selected TrollActor.
  for(const [size,viewport] of [
   ['1280x800',{width:1280,height:800}],
   ['1440x900',{width:1440,height:900}],
   ['1728x1117',{width:1728,height:1117}]
  ])await run(engine,engineName+'-mac-'+size,viewport,false,true);
  await run(engine,engineName+'-mac-invalidsha',{width:1440,height:900},true,true);
 }
})().catch(e=>{console.error(e);process.exitCode=1});
