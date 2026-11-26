'use strict';
/* Exact-head evidence for the default iPad and desktop entries, without preview flags. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const openHomeSubject=require('./helpers/laria-home-open-subject.cjs');
const base=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const url=new URL(base);
assert.ok(!url.searchParams.has('lariaPremiumSignArt')&&!url.searchParams.has('lariaReferenceLayout'),'test the normal app entry, not a preview override');
const out=process.env.LARIA_PREMIUM_INTEGRATION_SCREENSHOTS||'/tmp/laria-premium-integration';
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Premium QA',avatar:'girl',setupVersion:2,tallvikaTroll:'lillesoster'},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},preferences:{sound:false,autoRead:false},journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
const views=[['820x1180',{width:820,height:1180}],['1024x1366',{width:1024,height:1366}],['1180x820',{width:1180,height:820}],['1024x768',{width:1024,height:768}],['1366x1024',{width:1366,height:1024}]];
const desktopViews=[['desktop-1280x720',{width:1280,height:720}],['desktop-1440x900',{width:1440,height:900}],['desktop-1728x900',{width:1728,height:900}]];
const subjects=[
 ['norwegian','#eggenipa-world .eg-hero','.eg-scene-reading','#session-screen.active'],
 ['math','#tallvika-world .tv-scene','[data-tv="table"]','#multiplication-lab-screen.active .mp-grid-cell'],
 ['english','#kinnaklova-world .ki-stage','[data-ki="words"]','#session-screen.active .laria-task-card'],
 ['geography','#laria-geography-world .gv-scene','[data-gv="globe"]','#world-screen.active']
];
async function visit(engine,engineName,viewName,viewport,hasTouch){
 const browser=await engine.launch({headless:true,args:engineName==='chromium'?['--no-sandbox']:[],
  ...(engineName==='chromium'&&process.env.LARIA_CHROMIUM_PATH?{executablePath:process.env.LARIA_CHROMIUM_PATH}:{})});
 try{const context=await browser.newContext({viewport,hasTouch,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
  await context.addInitScript(v=>localStorage.setItem('laerlittmer-v2',JSON.stringify(v)),seed);
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:90000});
  await page.locator('#home-screen.active .bc12.bc15-locked-home').waitFor({state:'visible',timeout:25000});
  if(hasTouch){
  const reisen=page.locator('#home-screen.active .bc15-v16-reisen');
  await reisen.tap({timeout:25000});
  const overview=page.locator('#bc15-v16-journey-dialog:modal');
  await overview.waitFor({state:'visible',timeout:12000});
  assert.equal(await overview.locator('.bc15-v16-journey-choices button:visible').count(),4);
  await overview.locator('.bc15-v16-dialog-close').tap();
  await overview.waitFor({state:'hidden',timeout:12000});
  }
  await fs.promises.mkdir(out,{recursive:true});
  await page.screenshot({path:path.join(out,`${engineName}-${viewName}-home.png`),animations:'disabled'});
  for(const [id,selector,activity,destination] of subjects){
   await openHomeSubject(page,id); const scene=page.locator(selector); await scene.waitFor({state:'visible',timeout:25000});
   const nav=scene.locator('nav.laria-scene-navigation');await nav.waitFor({state:'visible',timeout:15000});
   await page.waitForFunction(n=>document.querySelector(n)?.dataset.lariaPremiumSignArt==='ready',selector+' nav.laria-scene-navigation',{timeout:25000});
   const data=await nav.evaluate(async el=>{
    const rail=el.getBoundingClientRect(),scene=el.parentElement.getBoundingClientRect();
    const support=getComputedStyle(el,'::before');
    const footY=(rail.top+parseFloat(support.top)+parseFloat(support.height)-scene.top)/scene.height;
    const next=el.querySelector('.tv-next-sign');
    const nextFeet=next&&getComputedStyle(next,'::after').content;

    async function cornerAlpha(background){
     const source=background.match(/data:image\/png[^"')]+/)?.[0];
     if(!source)return null;
     const image=new Image();image.src=source;await image.decode();
     const canvas=document.createElement('canvas');
     canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
     const ctx=canvas.getContext('2d');
     ctx.drawImage(image,0,0);
     return [[0,0],[canvas.width-1,0],[0,canvas.height-1],[canvas.width-1,canvas.height-1]]
      .map(([x,y])=>ctx.getImageData(x,y,1,1).data[3]);
    }
    const posts=getComputedStyle(el,'::before').backgroundImage;
    return {footY,nextFeet,posts:await cornerAlpha(posts),signs:await Promise.all(
     [...el.querySelectorAll('button.laria-premium-sign')].map(async b=>{
      const r=b.getBoundingClientRect(),face=b.querySelector('.laria-premium-sign-face');
      const medal=face.querySelector('.laria-premium-sign-medallion').getBoundingClientRect();
      const label=face.querySelector('.laria-premium-sign-label');
      const range=document.createRange();range.selectNodeContents(label);
      const text=range.getBoundingClientRect(),box=label.getBoundingClientRect();
      return {w:r.width,h:r.height,l:r.left,r:r.right,t:r.top,b:r.bottom,
       board:await cornerAlpha(getComputedStyle(face).backgroundImage),
       hidden:[...b.querySelectorAll('.laria-premium-sign-legacy')].every(n=>!n.getClientRects().length),
       badges:face.querySelectorAll('.laria-premium-sign-medallion').length,
       pictogram:face.querySelector('svg.laria-enamel[aria-hidden="true"]')?.innerHTML||'',
       label:label.textContent.trim(),
       textWidth:text.width,labelWidth:box.width,
       readable:!!label.textContent.trim()&&text.left>=box.left&&text.right<=box.right&&text.left>=medal.right,
       clickable:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===b,
       accessible:!!b.getAttribute('aria-label')
      };
     })
    )};
   });
   assert.deepEqual(data.posts,[0,0,0,0],id+' post silhouettes must not carry scene corners');
   if(id==='math'){
    assert.ok(data.footY>=.83&&data.footY<=.97,'Tallvika supports must reach the foreground bank: '+data.footY);
    assert.equal(data.nextFeet,'none','Next adventure duplicated the shared supports');
   }
   const expected=id==='geography'?2:3;
   assert.equal(data.signs.length,expected,id+' has unexpected primary activity actions');
   if(id==='geography'){
    assert.deepEqual(await nav.locator('button.laria-wayfinder').evaluateAll(buttons=>buttons.map(b=>b.dataset.gv)),['globe','country']);
    assert.equal(await scene.locator('[data-gv="journey"]').count(),0,'Retired Geografireisen must not be focusable or present');
   }
   assert.ok(data.signs.every(s=>s.pictogram.includes('fill="#')),id+' activity badge must have a painted motif');
   assert.equal(new Set(data.signs.map(s=>s.pictogram)).size,expected,id+' activities must use distinguishable motifs');
   for(const sign of data.signs){
    assert.ok(sign.w>=44&&sign.h>=44,id+' touch target smaller than 44px');
    assert.ok(Math.abs(sign.w/sign.h-3.5)<.06,id+' plaque distorted from the exact Grovanova source ratio: '+sign.w+'x'+sign.h);
    assert.ok(sign.l>=-2&&sign.r<=viewport.width+2&&sign.t>=-2&&sign.b<=viewport.height+2,id+' sign clipped');
    if(id==='english')assert.ok(sign.r<viewport.width*.40,'English activity sign escaped the left rail');
    assert.deepEqual(sign.board,[0,0,0,0],id+' plank must have transparent corners');
    assert.ok(sign.hidden&&sign.badges===1,id+' overlapping legacy or duplicate icon');
    assert.ok(sign.readable,id+' label '+JSON.stringify(sign.label)+' overlaps the badge or overflows the plank ('+sign.textWidth+'/'+sign.labelWidth+'px)');
    assert.ok(sign.clickable&&sign.accessible,id+' original button must stay clickable and named');
   }
   await page.screenshot({path:path.join(out,`${engineName}-${viewName}-${id}.png`),animations:'disabled'});
   await nav.locator('button.laria-premium-sign'+activity)[hasTouch?'tap':'click']();
   await page.locator(destination).first().waitFor({state:'visible',timeout:18000});
   if(id==='math'){
    await page.locator('.mp-explore-tab[data-mode="pick"]')[hasTouch?'tap':'click']();
    await page.locator('.mp-pick-screen').waitFor({state:'visible',timeout:18000});
   }
   if(id==='geography'){
    await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:90000});
    await openHomeSubject(page,id);
    await scene.locator('nav.laria-scene-navigation [data-gv="country"]')[hasTouch?'tap':'click']();
    await page.locator('#session-screen.active').waitFor({state:'visible',timeout:18000});
   }
   // Use a fresh default app entry after smoke-testing each destination.
   if(id!=='geography')await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:90000});
  }
  assert.deepEqual(errors,[],engineName+'/'+viewName+' page errors');await context.close();console.log('PASS',engineName,viewName);
 }finally{await browser.close()}
}
async function legacyGeography(engine,engineName){
 const browser=await engine.launch({headless:true,args:engineName==='chromium'?['--no-sandbox']:[],
  ...(engineName==='chromium'&&process.env.LARIA_CHROMIUM_PATH?{executablePath:process.env.LARIA_CHROMIUM_PATH}:{})});
 try{
  const viewport={width:1440,height:900};
  const context=await browser.newContext({viewport,hasTouch:false,serviceWorkers:'block'});
  await context.addInitScript(v=>localStorage.setItem('laerlittmer-v2',JSON.stringify(v)),seed);
  const page=await context.newPage(), fallback=new URL(url.href);
  fallback.searchParams.set('lariaPremiumSignArt','0');
  await page.goto(fallback.href,{waitUntil:'domcontentloaded',timeout:90000});
  await openHomeSubject(page,'geography');
  const sign=page.locator('#laria-geography-world .gv-sign[data-gv="country"]:visible');
  await sign.waitFor({state:'visible',timeout:20000});
  await page.evaluate(()=>document.fonts.ready.then(()=>true));
  const words=await sign.evaluate(el=>{
   const range=document.createRange(),node=[...el.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());
   if(!node)return null;
   range.selectNode(node);
   const b=el.getBoundingClientRect(),t=range.getBoundingClientRect(),icon=el.querySelector('.laria-reference-activity-icon').getBoundingClientRect();
   return {label:node.textContent.trim(),fits:t.left>=icon.right&&t.right<=b.right-b.width*.10};
  });
  assert.deepEqual(words,{label:'Land og flagg',fits:true},'Geography fallback must contain its complete label');
  await page.screenshot({path:path.join(out,`${engineName}-desktop-geography-fallback.png`),animations:'disabled'});
 }finally{await browser.close()}
}
(async()=>{for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
 if(process.env.LARIA_SIGN_ENGINE&&process.env.LARIA_SIGN_ENGINE!==engineName)continue;
 for(const [name,viewport] of views)await visit(engine,engineName,name,viewport,true);
 for(const [name,viewport] of desktopViews)await visit(engine,engineName,name,viewport,false);
 await legacyGeography(engine,engineName);
}
 if(process.env.CI&&!process.env.LARIA_SIGN_ENGINE)await require('./laria-land-flag-pilot.playwright.js')();
 if(process.env.CI&&!process.env.LARIA_SIGN_ENGINE)await require('./laria-subject-identity.playwright.js')();
 if(process.env.CI&&!process.env.LARIA_SIGN_ENGINE)await require('./laria-learning-identity.playwright.js')();
 if(process.env.CI&&!process.env.LARIA_SIGN_ENGINE)await require('./laria-support-identity.playwright.js')();
})().catch(e=>{console.error(e);process.exitCode=1});
