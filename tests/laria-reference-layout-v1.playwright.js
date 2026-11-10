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
   assert.equal(await scene.locator('.laria-wayfinder:visible, .tv-next-sign:visible').count(),0,
     world.id+' has visible additional activity signs outside the primary subject rail');
   if(world.id==='math'){
    assert.equal(await scene.locator('.tv-next-sign').count(),1);
    assert.equal(await scene.locator('.tv-next-sign').isVisible(),false,
      'Tallvika shows a second Next eventyr sign on the right');
   }
   assert.equal(await nav.isVisible(),true);
   assert.equal(await plaque.isVisible(),true);
   assert.equal(await plaque.getAttribute('aria-expanded'),'false');
   assert.equal(await plaque.locator('.laria-reference-place-kicker svg').count(),1,
     world.id+' place plaque does not use the shared subject icon from the locked sketch');

   const titleMetrics=await plaque.evaluate(el=>{
     const title=el.querySelector('strong'),place=el.querySelector('small'),entry=el.querySelector('em');
     return {height:el.getBoundingClientRect().height,
       background:getComputedStyle(el).backgroundImage,
       title:parseFloat(getComputedStyle(title).fontSize),
       place:parseFloat(getComputedStyle(place).fontSize),
       entry:parseFloat(getComputedStyle(entry).fontSize),
       posts:parseFloat(getComputedStyle(el,'::after').height)};
   });
   assert.ok(titleMetrics.height>=190&&titleMetrics.title>=40&&titleMetrics.place>=19&&titleMetrics.entry>=14,
     world.id+' arched title plaque has unreadably small content: '+JSON.stringify(titleMetrics));
   assert.match(titleMetrics.background,/arched-plaque/,world.id+' did not use upgraded single arched wooden plaque');
   assert.ok(titleMetrics.posts>=60,world.id+' title plaque two posts are too short');

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

   // Composition gate: the living, selected ORIGINAL character must be visible
   // at storybook scale in the middle, never as a tiny sticker or over a sign.
   const actorBox=await actor.boundingBox();
   const plaqueBox=await plaque.boundingBox();
   const menuBox=await nav.boundingBox();
   assert.ok(actorBox&&plaqueBox&&menuBox,world.id+' scene geometry unavailable');
   assert.ok(actorBox.width>=240&&actorBox.height>=420,
     world.id+' original TrollActor is too small for the locked reference: '+JSON.stringify(actorBox));
   assert.ok(actorBox.x>menuBox.x+menuBox.width+8,
     world.id+' original TrollActor overlaps the left navigation');
   assert.ok(actorBox.x+actorBox.width+8<plaqueBox.x,
     world.id+' original TrollActor overlaps the title plaque');
   assert.ok(actorBox.y>=0&&actorBox.y+actorBox.height<=viewport.height+4,
     world.id+' original TrollActor is clipped');
   if(world.id!=='math'){
    const speechMetrics=await scene.locator('.laria-troll-speech').evaluate(el=>{
     const styles=getComputedStyle(el);
     return {fontSize:parseFloat(styles.fontSize),maxWidth:parseFloat(styles.maxWidth)};
    });
    assert.ok(speechMetrics.fontSize>=16&&speechMetrics.maxWidth>=190,
      world.id+' companion speech is too small to read on iPad '+JSON.stringify(speechMetrics));
   }

   if(world.id==='math'){
    const bubble=await scene.locator('.tv-actor-speech').evaluate(el=>{
      const c=getComputedStyle(el),r=el.getBoundingClientRect();
      return {font:parseFloat(c.fontSize),background:c.backgroundColor,
        left:r.left,right:r.right,top:r.top,bottom:r.bottom};
    });
    assert.ok(bubble.font>=16,'Tallvika speech is unreadably small');
    const speechBox={x:bubble.left,y:bubble.top,width:bubble.right-bubble.left,
      height:bubble.bottom-bubble.top};
    const intersection=(a,b)=>Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*
      Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
    assert.ok(bubble.font>=16&&bubble.top>=0&&bubble.bottom<=viewport.height+3&&
      intersection(speechBox,menuBox)<1&&intersection(speechBox,plaqueBox)<1,
      'Tallvika speech overlaps a sign or leaves the screen: '+JSON.stringify(bubble));
   }
   if(world.id==='geography'){
    const source=await scene.locator('img.gv-landscape').evaluate(el=>({
      src:el.getAttribute('src'),transform:getComputedStyle(el).transform,
      loaded:el.complete&&el.naturalWidth>0
    }));
    assert.ok(source.loaded&&/geography-premium\.webp/.test(source.src),
      'Nordlysleiren original low-resolution source unexpectedly replaced');
    assert.match(source.transform,/matrix\(1\.054, 0, 0, 1\.054, 0, 0\)/,
      'original thumbnail white sky stripe was not cropped by art-safe overscan');
   }
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
   const allVisibleActions=scene.locator('.laria-wayfinder:visible, .tv-next-sign:visible');
   assert.equal(await allVisibleActions.count(),world.id==='math'?4:3,
     world.id+' has duplicated or missing visible activity signs');
   const visibleXs=await allVisibleActions.evaluateAll(nodes=>nodes.map(n=>{
     const r=n.getBoundingClientRect();return {left:r.left,right:r.right};
   }));
   assert.ok(visibleXs.every(b=>b.left>=0&&b.right<viewport.width*.40),
     world.id+' has an extra activity sign outside the single left rail: '+JSON.stringify(visibleXs));
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

async function assembleRealArtReviewSheets(){
 const screens=[
  {id:'home-art-blocked',name:'HJEM · Grovanova',status:'KUNST BLOKKERT: innmalte knapper'},
  {id:'norwegian',name:'NORSK · Eggenipa',status:'FELLES LAYOUT: klar for visuell vurdering'},
  {id:'math',name:'MATTE · Tallvika',status:'FELLES LAYOUT: klar for visuell vurdering'},
  {id:'english-art-blocked',name:'ENGELSK · Kinnaklova',status:'KUNST BLOKKERT: innmalte skilt'},
  {id:'geography',name:'GEOGRAFI · Nordlysleiren',status:'FELLES LAYOUT: lavoppløst kunst'}
 ];
 const reports=[];
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try {
  for(const device of ['ipad-landscape','ipad-portrait']){
   const cards=[];
   for(const item of screens){
    const file=path.join(out,'webkit-'+device+'-'+item.id+'.png');
    if(!fs.existsSync(file))continue;
    const base64=await fs.promises.readFile(file,'base64');
    cards.push('<article><div class="preview"><img alt="'+item.name+
      '" src="data:image/png;base64,'+base64+'"></div><div class="name">'+item.name+
      '</div><div class="status">'+item.status+'</div></article>');
   }
   if(!cards.length)continue;
   const page=await browser.newPage({viewport:{width:1548,height:920},
     deviceScaleFactor:1,reducedMotion:'reduce'});
   const html='<!doctype html><html lang="no"><head><meta charset="utf-8">'+
    '<style>*{box-sizing:border-box}html,body{margin:0;background:#0c2538;color:#fff;'+
    'font-family:system-ui,-apple-system,Arial,sans-serif}.sheet{padding:38px 38px 44px}'+
    'h1{font-size:35px;line-height:1.15;margin:0 0 9px}header p{margin:0 0 27px;'+
    'font-size:15px;color:#d0e1e8}main{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));'+
    'gap:24px}article{min-width:0}.preview{background:#122c40;'+
    'border:1px solid #547186;border-radius:17px;overflow:hidden;'+
    'display:flex;align-items:center;justify-content:center}img{display:block;'+
    'width:100%;height:auto;max-height:570px;object-fit:contain}'+
    '.name{margin:11px 0 4px;font-size:23px;font-weight:800}'+
    '.status{font-size:14px;color:#bcd0dc}footer{font-size:13px;'+
    'border-top:1px solid #4c6473;margin-top:29px;padding-top:16px;color:#d5e0e8}'+
    '</style></head><body><div class="sheet"><header><h1>Læria · faktisk iPad-test</h1>'+
    '<p>WebKit · '+device+' · commit '+(process.env.LARIA_GIT_SHA||'local')+
    ' · automatisk skjermbilde, IKKE konseptillustrasjon</p></header>'+
    '<main>'+cards.join('')+'</main><footer>Kun originalkunst fra repositoriet. '+
    'Hjem og Engelsk er IKKE premiumgodkjent. Grønn teknisk QA er ingen '+
    'visuell godkjenning eller publiseringsbeslutning.</footer></div></body></html>';
   await page.setContent(html,{waitUntil:'load',timeout:30000});
   await page.locator('img').evaluateAll(async images=>Promise.all(
    images.map(img=>img.complete?null:new Promise(resolve=>{
      img.addEventListener('load',resolve,{once:true});
      img.addEventListener('error',resolve,{once:true});
    }))));
   const filename='laria-actual-'+device+'-five-screens.png';
   await page.screenshot({path:path.join(out,filename),fullPage:true,animations:'disabled'});
   reports.push({file:filename,device,screenIds:cards.length,
     sources:screens.map(s=>path.join(out,'webkit-'+device+'-'+s.id+'.png')).filter(fs.existsSync)});
   await page.close();
  }
 } finally {await browser.close();}
 await fs.promises.writeFile(path.join(out,'VISUAL-REVIEW-NOT-APPROVED.json'),
  JSON.stringify({commit:process.env.LARIA_GIT_SHA||null,
   generatedFrom:'actual app in Playwright WebKit iPad',
   sourceMasterPolicy:'originals unmodified',
   artBlocked:['Grovanova/Hjem','Kinnaklova/Engelsk'],
   geographyResolutionBlocked:true,
   visualApproval:false,publish:false,sheets:reports},null,2));
 console.log('Real iPad art review sheets: '+reports.map(x=>x.file).join(', '));
}
(async()=>{
 let failure=null;
 try {
  for(const [device,viewport] of [
   ['ipad-landscape',{width:1366,height:1024}],
   ['ipad-portrait',{width:1024,height:1366}],
   // Desktop was previously outside actual device QA. Capture the SAME app,
   // chosen TrollActor, five-sign navigation and child activities on PC/Mac.
   // This is engineering evidence, NOT a product-owner visual sign-off.
   ['desktop',{width:1440,height:900}]
  ])for(const [name,engine] of [['chromium',chromium],['webkit',webkit]])
    await testEngine(engine,name,device,viewport);
 } catch(error){failure=error;}
 try{await assembleRealArtReviewSheets();}
 catch(error){console.error('Review sheet assembly failed:',error);
   if(!failure)failure=error;}
 if(failure)throw failure;
})().catch(err=>{console.error(err);process.exitCode=1});
