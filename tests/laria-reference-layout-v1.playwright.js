'use strict';
/* Visual acceptance evidence from ACTUAL iPad app, not concept pictures.
 * Preview remains opt-in; Grovanova and Kinnaklova art are blocked. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const base=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const url=base+(base.includes('?')?'&':'?')+'lariaReferenceLayout=1';
const out=process.env.LARIA_REFERENCE_SCREENSHOTS||'/tmp/laria-reference-layout';
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Referanse QA',avatar:'girl',setupVersion:2,tallvikaTroll:'lillesoster'},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},preferences:{sound:false,autoRead:false},journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
const worlds=[
 {id:'norwegian',root:'#eggenipa-world .eg-hero.laria-reference-layout-v1',actor:'.eg-companion-actor'},
 {id:'math',root:'#tallvika-world .tv-scene.laria-reference-layout-v1',actor:'.tv-actor-touch'},
 {id:'geography',root:'#laria-geography-world .gv-scene.laria-reference-layout-v1',actor:'.gv-troll'}
];
async function testEngine(engine,name,device,viewport){
 const browser=await engine.launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport,hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce',deviceScaleFactor:1});
  await context.addInitScript(v=>localStorage.setItem('laerlittmer-v2',JSON.stringify(v)),seed);
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
  const home=page.locator('#home-screen.active .bc12.bc15-locked-home');
  await home.waitFor({state:'visible',timeout:22000});
  await fs.promises.mkdir(out,{recursive:true});
  await page.screenshot({path:path.join(out,name+'-'+device+'-home-art-blocked.png'),animations:'disabled'});
  for(const world of worlds){
   await page.locator('#home-screen .bc14-subject[data-camp="subject-'+world.id+'"]').click();
   const scene=page.locator(world.root);
   await scene.waitFor({state:'visible',timeout:20000});
   // The real selected TrollActor greets the child once on first entrance.
   // Maths owns its existing speech component and must not duplicate it.
   if(world.id==='norwegian'||world.id==='geography'){
    const bubble=scene.locator('.laria-troll-speech[data-show="true"]');
    await bubble.waitFor({state:'attached',timeout:6500});
    const line=await bubble.textContent();
    assert.ok(line&&line.length>10,world.id+' live greeting not present');
    assert.equal(await scene.locator('.laria-troll-speech').count(),1,
      world.id+' duplicated the chosen troll speech bubble');
   }
   const nav=scene.locator('nav.laria-reference-subject-nav');
   assert.equal(await nav.locator('button').count(),5,world.id+' five destination signs');
   assert.equal(await nav.locator('button[aria-current="page"]').count(),1,world.id+' active menu');
   assert.equal(await nav.locator('button[aria-current="page"]').getAttribute('data-laria-ref-subject'),world.id);
   // One visible navigation rail, as in the user's locked composition.
   const activities=scene.locator('nav.laria-scene-navigation');
   const plaque=scene.locator('button.laria-reference-place');
   assert.equal(await scene.getAttribute('data-laria-reference-mode'),'subjects');
   assert.equal(await activities.isVisible(),false,world.id+' duplicates signs on the right');
   if(world.id==='math'){
    assert.equal(await scene.locator('.tv-next-sign').count(),1);
    assert.equal(await scene.locator('.tv-next-sign').isVisible(),false,
      'Tallvika shows a second Next eventyr sign on the right');
   }
   assert.equal(await nav.isVisible(),true);
   assert.equal(await plaque.isVisible(),true);
   assert.equal(await plaque.getAttribute('aria-expanded'),'false');
   const boxes=await scene.evaluate(el=>{
    const rect=e=>{const r=e.getBoundingClientRect();return {l:r.left,t:r.top,r:r.right,b:r.bottom,w:r.width,h:r.height}};
    return {
      menu:[...el.querySelectorAll('.laria-reference-subject-sign')].filter(x=>x.closest('.laria-reference-subject-nav')).map(rect),
      plaque:rect(el.querySelector('.laria-reference-place')),
      hiddenActions:[...el.querySelectorAll('.laria-scene-navigation > .laria-wayfinder')].length
    };
   });
   assert.equal(boxes.hiddenActions,3,world.id+' did not retain real original learning buttons');
   for(const box of boxes.menu){
    assert.ok(box.l>=0&&box.t>=0&&box.r<=viewport.width+3&&box.b<=viewport.height+3,
      world.id+' left sign clipped: '+JSON.stringify(box));
    assert.ok(box.w>=44&&box.h>=44&&box.r<viewport.width*.40,
      world.id+' destination sign outside sole left rail');
   }
   assert.ok(boxes.plaque.l>viewport.width*.54&&boxes.plaque.r<=viewport.width+3,
      world.id+' title plaque is not on the right');
   assert.ok(boxes.plaque.w>=44&&boxes.plaque.h>=44,'open activities target must be accessible');
   // Top controls are real actions: existing troll chooser, and the
   // protected adult settings. Grade selection remains independently present.
   const chooser=scene.locator('.laria-scene-chooser:visible');
   const settings=scene.locator('button.laria-reference-settings:visible');
   const grade=scene.locator('.laria-scene-grade:visible');
   assert.equal(await chooser.count(),1,world.id+' lost the original troll chooser');
   assert.equal(await settings.count(),1,world.id+' missing protected settings');
   assert.equal(await grade.count(),1,world.id+' lost the grade control');
   const toolbar=await scene.evaluate(el=>{
    const rect=node=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
    return {choose:rect(el.querySelector('.laria-scene-chooser')),
      settings:rect(el.querySelector('.laria-reference-settings')),
      grade:rect(el.querySelector('.laria-scene-grade'))};
   });
   for(const box of Object.values(toolbar))
    assert.ok(box.width>=44&&box.height>=44&&box.left>=0&&box.right<=viewport.width+3,
      world.id+' toolbar is clipped or too small '+JSON.stringify(toolbar));
   assert.ok(toolbar.grade.right+4<=toolbar.choose.left&&toolbar.choose.right+4<=toolbar.settings.left,
     world.id+' toolbar controls collide '+JSON.stringify(toolbar));
   if(world.id==='norwegian'){
    await chooser.click();
    const dialog=page.locator('#laria-premium-troll-dialog[open]');
    await dialog.waitFor({state:'visible',timeout:7000});
    assert.equal(await dialog.locator('[data-troll-choice]').count(),3,
      'original three locked TrollActor choices remain available');
    await dialog.locator('.laria-troll-dialog-close').click();
    await dialog.waitFor({state:'hidden',timeout:7000});
    await chooser.evaluate(element=>element.blur()); // screenshots without test-induced focus ring
   }
   const actor=scene.locator(world.actor).first();
   assert.equal(await actor.getAttribute('data-troll'),'lillesoster',world.id+' selected original troll');
   const art=await actor.locator('img').evaluate(img=>({src:img.getAttribute('src'),ok:img.complete&&img.naturalWidth>0}));
   assert.match(art.src||'',/gangemagi-troll\/lillesoster\.webp/);
   assert.ok(art.ok,world.id+' original troll image missing');
   const oldHome=scene.locator('[data-laria-reference-hidden="true"]');
   assert.equal(await oldHome.count(),1,'one original legacy Home anchor');
   assert.equal(await oldHome.isVisible(),false,'no double Home control');
   await page.screenshot({path:path.join(out,name+'-'+device+'-'+world.id+'.png'),animations:'disabled'});
   // The wooden title opens the same left-side location formerly occupied by
   // the five subject signs. No second right-hand activity stack is permitted.
   await plaque.click();
   assert.equal(await scene.getAttribute('data-laria-reference-mode'),'activities');
   assert.equal(await nav.isVisible(),false,world.id+' subject rail remained visible with activities');
   assert.equal(await activities.isVisible(),true);
   assert.equal(await plaque.getAttribute('aria-expanded'),'true');
   assert.equal(await activities.locator('.laria-wayfinder').count(),3,
     world.id+' must preserve all three live activity controls');
   if(world.id==='math'){
    const next=activities.locator('button.tv-next-sign.laria-reference-next');
    assert.equal(await next.count(),1,'original Next adventure route was not moved');
    assert.equal(await next.isVisible(),true,'Next adventure not shown in the sole rail');
    const r=await next.boundingBox();
    assert.ok(r&&r.x>=0&&r.x+r.width<viewport.width*.40,
      'Next adventure button escaped left rail: '+JSON.stringify(r));
   }
   assert.equal(await activities.locator('.laria-reference-activities-back').count(),1);
   const activityBoxes=await activities.locator('.laria-wayfinder').evaluateAll(nodes=>nodes.map(x=>{
    const r=x.getBoundingClientRect();
    return {l:r.left,r:r.right,t:r.top,b:r.bottom,w:r.width,h:r.height};
   }));
   for(const box of activityBoxes)
    assert.ok(box.l>=0&&box.r<viewport.width*.40&&box.w>=44&&box.h>=44&&box.b<=viewport.height+3,
      world.id+' activity was placed outside sole left rail: '+JSON.stringify(box));
   const leftEdges=activityBoxes.map(r=>r.l);
   const subjectsLeft=boxes.menu[0].l;
   assert.ok(leftEdges.every(left=>Math.abs(left-subjectsLeft)<=3),
     world.id+' activity signs must share the subject sign left edge: '+
      JSON.stringify({leftEdges,subjectsLeft}));
   await page.screenshot({path:path.join(out,name+'-'+device+'-'+world.id+'-activities.png'),animations:'disabled'});
   await activities.locator('.laria-reference-activities-back').click();
   assert.equal(await scene.getAttribute('data-laria-reference-mode'),'subjects');
   assert.equal(await nav.isVisible(),true);
   assert.equal(await activities.isVisible(),false);
   // Clicking the currently selected subject is a second intuitive door into
   // exactly the same activities, and never creates a right-hand menu.
   await nav.locator('[data-laria-ref-subject="'+world.id+'"]').click();
   assert.equal(await scene.getAttribute('data-laria-reference-mode'),'activities');
   await activities.locator('.laria-reference-activities-back').click();
   assert.equal(await scene.getAttribute('data-laria-reference-mode'),'subjects');

   await nav.locator('[data-laria-ref-subject="home"]').click();
   await home.waitFor({state:'visible',timeout:15000});
  }
  // A quick click must NOT open the protected parent area. The exact same
  // deliberate long press as the original Home gate must open it on iPad.
  await page.locator('#home-screen .bc14-subject[data-camp="subject-norwegian"]').click();
  const gate=page.locator('#eggenipa-world .eg-hero.laria-reference-layout-v1 .laria-reference-settings');
  await gate.waitFor({state:'visible',timeout:15000});
  await gate.click();
  assert.equal(await page.locator('#adult-screen.active').count(),0,
    'parent settings opened on a short child tap');
  await gate.dispatchEvent('pointerdown',{pointerType:'touch',button:0});
  await page.waitForTimeout(1650);
  await page.locator('#adult-screen.active').waitFor({state:'visible',timeout:7000});
  await page.locator('#adult-back').click();
  await home.waitFor({state:'visible',timeout:16000});
  // Test the new five-sign navigation itself, not only a return to Home.
  // Clicking an inactive subject must reuse the original child routes.
  await page.locator('#home-screen .bc14-subject[data-camp="subject-norwegian"]').click();
  await page.locator('#eggenipa-world .laria-reference-subject-nav [data-laria-ref-subject="math"]').click();
  await page.locator('#tallvika-world .tv-scene.laria-reference-layout-v1').waitFor({state:'visible',timeout:17000});
  await page.locator('#tallvika-world .laria-reference-subject-nav [data-laria-ref-subject="geography"]').click();
  await page.locator('#laria-geography-world .gv-scene.laria-reference-layout-v1').waitFor({state:'visible',timeout:17000});
  await page.locator('#laria-geography-world .laria-reference-subject-nav [data-laria-ref-subject="norwegian"]').click();
  await page.locator('#eggenipa-world .eg-hero.laria-reference-layout-v1').waitFor({state:'visible',timeout:17000});
  await page.locator('#eggenipa-world .laria-reference-subject-nav [data-laria-ref-subject="home"]').click();
  await home.waitFor({state:'visible',timeout:17000});
  // The three signs are the actual learning routes, not decorative labels.
  // Exercise two independent activity engines through their real DOM buttons
  // and confirm their Back actions restore the same subject artwork.
  await page.locator('#home-screen .bc14-subject[data-camp="subject-norwegian"]').click();
  await page.locator('#eggenipa-world .eg-hero.laria-reference-layout-v1 button.laria-reference-place').click();
  await page.locator('#eggenipa-world .eg-hero.laria-reference-layout-v1 .eg-scene-hit[data-eg="words"]').click();
  const wordHunt=page.locator('#word-hunt-overlay:not([hidden])');
  await wordHunt.waitFor({state:'visible',timeout:16000});
  assert.match(await wordHunt.getAttribute('aria-label'),/Ordjakt/);
  // Initial Ordjakt opens the visible theme picker. Its own Back control is
  // the child's genuine route; the exercise-shell Back is intentionally hidden.
  await wordHunt.locator('.word-hunt-theme-picker:not([hidden]) .wh-theme-close:visible').click();
  await page.locator('#eggenipa-world .eg-hero.laria-reference-layout-v1').waitFor({state:'visible',timeout:16000});
  assert.equal(await page.locator('#eggenipa-world .eg-hero.laria-reference-layout-v1').getAttribute('data-laria-reference-mode'),'activities');
  await page.locator('#eggenipa-world .eg-hero.laria-reference-layout-v1 .laria-reference-activities-back').click();
  await page.locator('#eggenipa-world .laria-reference-subject-nav [data-laria-ref-subject="home"]').click();
  await home.waitFor({state:'visible',timeout:16000});
  await page.locator('#home-screen .bc14-subject[data-camp="subject-math"]').click();
  await page.locator('#tallvika-world .tv-scene.laria-reference-layout-v1 button.laria-reference-place').click();
  await page.locator('#tallvika-world .tv-scene.laria-reference-layout-v1 .tv-sign[data-tv="multiply"]').click();
  await page.locator('#multiplication-lab-screen.active').waitFor({state:'visible',timeout:17000});
  await page.locator('#multiplication-lab-back').click();
  await page.locator('#tallvika-world .tv-scene.laria-reference-layout-v1').waitFor({state:'visible',timeout:17000});
  assert.equal(await page.locator('#tallvika-world .tv-scene.laria-reference-layout-v1').getAttribute('data-laria-reference-mode'),'activities');
  await page.locator('#tallvika-world .tv-scene.laria-reference-layout-v1 .laria-reference-activities-back').click();
  await page.locator('#tallvika-world .laria-reference-subject-nav [data-laria-ref-subject="home"]').click();
  await home.waitFor({state:'visible',timeout:16000});
  await page.locator('#home-screen .bc14-subject[data-camp="subject-english"]').click();
  const english=page.locator('#kinnaklova-world:visible');
  await english.waitFor({state:'visible',timeout:18000});
  assert.equal(await english.locator('.laria-reference-subject-nav').count(),0);
  await page.locator('#kinnaklova-world[data-ki-art="ready"]').waitFor({timeout:22000});
  await page.screenshot({path:path.join(out,name+'-'+device+'-english-art-blocked.png'),animations:'disabled'});
  assert.deepEqual(errors,[],name+'/'+device+' browser exceptions');
  const st=await page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2')));
  assert.equal(st.profile.tallvikaTroll,'lillesoster');
  await fs.promises.writeFile(path.join(out,name+'-'+device+'-review.json'),JSON.stringify({
    head:process.env.LARIA_GIT_SHA||null,mode:'NOT APPROVED - real app screenshot',
    engine:name,device,viewport,scenesReviewed:worlds.map(w=>w.id),
    blockedOriginals:['Grovanova/Hjem','Kinnaklova/Engelsk'],
    childProgressPreserved:true
  },null,2));
  console.log('PASS real '+name+' '+device+' Læria preview');
  await context.close();
 }finally{await browser.close()}
}
(async()=>{
 for(const [device,viewport] of [
  ['ipad-landscape',{width:1366,height:1024}],
  ['ipad-portrait',{width:1024,height:1366}]
 ])for(const [name,engine] of [['chromium',chromium],['webkit',webkit]])
   await testEngine(engine,name,device,viewport);
})().catch(err=>{console.error(err);process.exitCode=1});
