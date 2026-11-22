'use strict';
const openHomeSubject=require('./helpers/laria-home-open-subject.cjs');
/* Visual acceptance evidence from ACTUAL iPad app, not concept pictures.
 * Preview remains opt-in; Grovanova and Kinnaklova art are blocked. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const base=(process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria')+'&lariaV16=0'; // subject-facade acceptance, separate from default Home v16 art QA
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
  // The accepted iPad layout is now the default on this PR branch.
  // Do not silently regress to the old scattered signs without a preview query.
  if(device==='ipad-landscape'||device==='ipad-portrait'){
   const normal=base.replace(/([?&])lariaReferenceLayout=[^&]*&?/g,'$1').replace(/[?&]$/,'');
   await page.goto(normal,{waitUntil:'domcontentloaded',timeout:90000});
   await page.locator('#home-screen.active .bc12.bc15-locked-home').waitFor({state:'visible',timeout:22000});
   await openHomeSubject(page,'geography');
   const defaultGeography=page.locator('#laria-geography-world .gv-scene.laria-reference-layout-v1');
   await defaultGeography.waitFor({state:'visible',timeout:20000});
   assert.equal(await defaultGeography.locator('button.laria-reference-heading strong').textContent(),'Geografi');
   assert.equal(await defaultGeography.locator('nav.laria-scene-navigation .laria-wayfinder:visible').count(),3);
   assert.equal(await defaultGeography.locator('nav.laria-reference-subject-nav:visible').count(),0);
   await page.goto(normal+(normal.includes('?')?'&':'?')+'lariaReferenceLayout=0',{waitUntil:'domcontentloaded',timeout:90000});
   await page.locator('#home-screen.active .bc12.bc15-locked-home').waitFor({state:'visible',timeout:22000});
   await openHomeSubject(page,'geography');
   await page.locator('#laria-geography-world .gv-scene').waitFor({state:'visible',timeout:20000});
   assert.equal(await page.locator('#laria-geography-world .gv-scene.laria-reference-layout-v1').count(),0,
    'Explicit opt-out must preserve the original Geography presentation');
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
  }
  const home=page.locator('#home-screen.active .bc12.bc15-locked-home');
  await home.waitFor({state:'visible',timeout:22000});
  await fs.promises.mkdir(out,{recursive:true});
  await page.screenshot({path:path.join(out,name+'-'+device+'-home-art-blocked.png'),animations:'disabled'});
  for(const world of worlds){
   await openHomeSubject(page,world.id);
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
   // Approved scene opens with the three real activity signs, not an extra back sign.
   const entryTitle=scene.locator('button.laria-reference-heading');
   assert.equal(await scene.getAttribute('data-laria-reference-mode'),'activities');
   assert.equal(await scene.locator('nav.laria-scene-navigation .laria-wayfinder:visible').count(),3);
   assert.equal(await scene.locator('nav.laria-reference-subject-nav').isVisible(),false);
   assert.equal(await scene.locator('button.laria-reference-place').count(),0);
   assert.equal(await scene.locator('.laria-reference-activities-back').count(),0);
   assert.equal(await entryTitle.locator('strong').textContent(),
     {norwegian:'Norsk',math:'Matte',geography:'Geografi'}[world.id]);
   assert.equal(await entryTitle.locator('small').textContent(),
     {norwegian:'Eggenipa',math:'Tallvika',geography:'Nordlysleiren'}[world.id]);
   await page.screenshot({path:path.join(out,name+'-'+device+'-'+world.id+'-approved-entry.png'),animations:'disabled'});
   await entryTitle.click();
   assert.equal(await scene.getAttribute('data-laria-reference-mode'),'subjects');
   const nav=scene.locator('nav.laria-reference-subject-nav');
   assert.equal(await nav.locator('button').count(),5,world.id+' five destination signs');
   assert.equal(await nav.locator('button[aria-current="page"]').count(),1,world.id+' active menu');
   assert.equal(await nav.locator('button[aria-current="page"]').getAttribute('data-laria-ref-subject'),world.id);
   // Visual identity must be the SAME shared light-oak component in both
   // menu states. Dark prototype signs and added Premium-logo stickers do
   // not meet the owner's locked reference, even if navigation works.
   const signArt=await nav.locator(':scope > button').evaluateAll(buttons=>buttons.map(button=>{
     const css=getComputedStyle(button);
     return {art:css.backgroundImage,ink:css.color};
   }));
   for(const sign of signArt){
     assert.match(sign.art,/laria-light-arrow-sign\.svg/,
       world.id+' destination sign deviates from shared light oak: '+JSON.stringify(sign));
     assert.equal(sign.ink,'rgb(61, 39, 21)',
       world.id+' destination sign does not use the shared dark ink');
   }
   const badge=await scene.locator('.laria-scene-brand').evaluate(el=>
     getComputedStyle(el,'::after').display);
   assert.equal(badge,'none',
     world.id+' shows a duplicate Premium sticker beneath the locked logo');
   // One visible navigation rail, as in the user's locked composition.
   const activities=scene.locator('nav.laria-scene-navigation');
   const plaque=scene.locator('button.laria-reference-heading');
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
   const grovanovaSubjects=await nav.evaluate(el=>({
     arrow:getComputedStyle(el.querySelector('button')).backgroundImage,
     posts:getComputedStyle(el,'::before').backgroundImage
   }));
   assert.match(grovanovaSubjects.arrow,/laria-light-arrow-sign\.svg/,
     world.id+' uses a different signboard from Grovanova');
   assert.match(grovanovaSubjects.posts,/laria-grovanova-signposts\.svg/,
     world.id+' lacks the two shared posts of Grovanova');
   assert.equal(await plaque.isVisible(),true);
   assert.equal(await plaque.getAttribute('aria-expanded'),'true');
   assert.equal(await scene.locator('button.laria-reference-place').count(),0);
   // The lock has a text-only heading below the unchanged Læria logo.
   const titleMetrics=await plaque.evaluate(el=>{
     const title=el.querySelector('strong'),place=el.querySelector('small');
     const rect=el.getBoundingClientRect();
     return {height:rect.height,center:rect.left+rect.width/2,
       background:getComputedStyle(el).backgroundImage,
       title:parseFloat(getComputedStyle(title).fontSize),
       place:parseFloat(getComputedStyle(place).fontSize)};
   });
   assert.ok(titleMetrics.height>=70&&titleMetrics.title>=40&&titleMetrics.place>=19,
     world.id+' the restored heading is too small: '+JSON.stringify(titleMetrics));
   assert.equal(titleMetrics.background,'none',
     world.id+' rejected wooden place plaque unexpectedly returned');
   assert.ok(Math.abs(titleMetrics.center-viewport.width/2)<=5,
     world.id+' restored text heading not centered');
   const boxes=await scene.evaluate(el=>{
    const rect=e=>{const r=e.getBoundingClientRect();return {l:r.left,t:r.top,r:r.right,b:r.bottom,w:r.width,h:r.height}};
    return {
      menu:[...el.querySelectorAll('.laria-reference-subject-sign')].filter(x=>x.closest('.laria-reference-subject-nav')).map(rect),
      plaque:rect(el.querySelector('.laria-reference-heading')),
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
   assert.ok(boxes.plaque.l>=0&&boxes.plaque.r<=viewport.width+3,
     world.id+' restored text heading is clipped');
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
   // Landscape-aware placement: identical sign components, scene-specific
   // anchors instead of one arbitrary 24% overlay on every iPad painting.
   if(device.startsWith('ipad')){
    const stageBox=await scene.boundingBox();
    const anchors={
     'ipad-landscape':{norwegian:.265,math:.275,geography:.27},
     'ipad-portrait':{norwegian:.28,math:.27,geography:.30}
    };
    const expected=anchors[device][world.id];
    const observed=(menuBox.y-stageBox.y)/stageBox.height;
    assert.ok(Math.abs(observed-expected)<.017,
      world.id+' signs are not naturally anchored to the approved terrain: '+
      JSON.stringify({device,expected,observed}));
   }
   assert.ok(actorBox.width>=240&&actorBox.height>=420,
     world.id+' original TrollActor is too small for the locked reference: '+JSON.stringify(actorBox));
   assert.ok(actorBox.x>menuBox.x+menuBox.width+8,
     world.id+' original TrollActor overlaps the left navigation');
   const overlap2D=(a,b)=>Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*
     Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
   assert.ok(overlap2D(actorBox,plaqueBox)<1,
     world.id+' selected live TrollActor overlaps the restored heading');
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
   const liveHome=scene.locator('[data-laria-component="home"]');
   assert.equal(await liveHome.count(),1,'original round Home control must remain');
   assert.equal(await liveHome.isVisible(),false,'retired Home must not compete with shared return');
   const sharedBack=page.locator('.screen.active > .laria-back-control:visible');
   assert.equal(await sharedBack.count(),1,world.id+' must show exactly one shared return');
   const returnBounds=await sharedBack.boundingBox();
   assert.ok(returnBounds&&returnBounds.width>=44&&returnBounds.height>=44,
     world.id+' shared return has too small a touch target');
   await page.screenshot({path:path.join(out,name+'-'+device+'-'+world.id+'.png'),animations:'disabled'});
   // The plain subject heading swaps the one left-hand rail without
   // creating a second activity menu on the right.
   await plaque.click();
   assert.equal(await scene.getAttribute('data-laria-reference-mode'),'activities');
   assert.equal(await nav.isVisible(),false,world.id+' subject rail remained visible with activities');
   assert.equal(await activities.isVisible(),true);
   const samePosts=await activities.evaluate(el=>getComputedStyle(el,'::before').backgroundImage);
   assert.match(samePosts,/laria-grovanova-signposts\.svg/,
     world.id+' activity menu uses a different post system');
   const sameArrow=await activities.locator('.laria-wayfinder').first().evaluate(el=>
     getComputedStyle(el.matches('.eg-scene-hit')?el.querySelector('span'):el).backgroundImage);
   assert.match(sameArrow,/laria-light-arrow-sign\.svg/,
     world.id+' activity menu uses a different arrow board');
   assert.equal(await plaque.getAttribute('aria-expanded'),'false');
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
   assert.equal(await activities.locator('.laria-reference-activities-back').count(),0,
     world.id+' an extra Back sign appeared in the approved three-activity layout');
   const activityBoxes=await activities.locator('.laria-wayfinder').evaluateAll(nodes=>nodes.map(x=>{
    const r=x.getBoundingClientRect();
    return {l:r.left,r:r.right,t:r.top,b:r.bottom,w:r.width,h:r.height};
   }));
   for(const box of activityBoxes)
    assert.ok(box.l>=0&&box.r<viewport.width*.40&&box.w>=44&&box.h>=44&&box.b<=viewport.height+3,
      world.id+' activity was placed outside sole left rail: '+JSON.stringify(box));
   // The planks, not just their left edges, need identical scale in both
   // modes on iPad and desktop. No leftover 70px Eggenipa activity signs.
   assert.ok(activityBoxes.every(r=>Math.abs(r.h-boxes.menu[0].h)<=3),
     world.id+' activity planks differ in height from Home-style subject planks: '+
     JSON.stringify({subject:boxes.menu[0],activities:activityBoxes}));
   assert.equal(await activities.locator('.laria-reference-activity-icon').count(),3,
     world.id+' learning buttons lack matching subject-style pictograms');
   const icons=await activities.locator('.laria-reference-activity-icon').evaluateAll(nodes=>nodes.map(node=>{
     const style=getComputedStyle(node),r=node.getBoundingClientRect();
     return {visible:style.display!=='none'&&style.visibility!=='hidden',width:r.width,height:r.height};
   }));
   assert.ok(icons.every(x=>x.visible&&x.width>=18&&x.height>=18),
     world.id+' activity pictogram hidden or below minimum visual size: '+JSON.stringify(icons));
   if(world.id==='geography'){
     const iconPlacement=await activities.locator('button.gv-sign.laria-wayfinder').evaluateAll(buttons=>
       buttons.map(button=>{
         const icon=button.querySelector('span.laria-reference-activity-icon');
         const board=button.getBoundingClientRect(),r=icon.getBoundingClientRect();
         const style=getComputedStyle(icon);
         return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,
           boardLeft:board.left,boardRight:board.right,
           boardTop:board.top,boardBottom:board.bottom,
           transform:style.transform,border:style.borderTopWidth,color:style.color};
       }));
     assert.equal(iconPlacement.length,3,'Geografi original activity buttons changed');
     const oldArrowStates=await activities.locator('button.gv-sign.laria-wayfinder > span[aria-hidden="true"]:not(.laria-reference-activity-icon)').evaluateAll(nodes=>
       nodes.map(node=>getComputedStyle(node).display));
     assert.equal(oldArrowStates.length,3,'Geografi lost its three original fallback icons');
     assert.ok(oldArrowStates.every(display=>display==='none'),
       'Geografi still exposes legacy white arrow badges: '+JSON.stringify(oldArrowStates));
     assert.ok(iconPlacement.every(icon=>
       icon.left>=icon.boardLeft&&icon.right<=icon.boardRight&&
       icon.top>=icon.boardTop&&icon.bottom<=icon.boardBottom&&
       icon.transform==='none'&&icon.border==='0px'&&icon.color==='rgb(61, 39, 21)'),
       'Geografi pictograms float outside the oak signs or inherit white legacy badges: '+
       JSON.stringify(iconPlacement));
   }
   // The board shape now belongs to the whole sign stack, never to each
   // individual action. Check the rendered pseudo-elements, not only CSS text.
   const separatePosts=await activities.locator('.laria-wayfinder').evaluateAll(nodes=>
     nodes.map(node=>{
       const eg=node.matches('.eg-scene-hit');
       const target=eg?node.querySelector(':scope > span'):node;
       const style=getComputedStyle(target,eg?'::before':'::after');
       return {display:style.display,content:style.content};
     }));
   assert.ok(separatePosts.every(item=>item.display==='none'||item.content==='none'),
     world.id+' retains per-board posts instead of one shared Home post-pair: '+
     JSON.stringify(separatePosts));
   if(world.id==='norwegian'){
     // Visual regression: legacy Eggenipa green-arrow discs must not be
     // generated on the text board OR the nested premium pictogram.
     const originalButtons=activities.locator('button.eg-scene-hit.laria-wayfinder');
     assert.equal(await originalButtons.count(),3,'Norsk must preserve its three original learning buttons');
     const arrows=await originalButtons.evaluateAll(nodes=>nodes.map(button=>{
       const face=button.querySelector(':scope > span');
       const icon=face.querySelector('.laria-reference-activity-icon');
       const faceAfter=getComputedStyle(face,'::after');
       const iconAfter=getComputedStyle(icon,'::after');
       const style=getComputedStyle(icon);
       const rect=icon.getBoundingClientRect();
       return {
         faceAfter:{display:faceAfter.display,content:faceAfter.content},
         iconAfter:{display:iconAfter.display,content:iconAfter.content},
         iconBorder:style.borderTopWidth,
         iconBackground:style.backgroundImage,
         iconWidth:rect.width,iconHeight:rect.height
       };
     }));
     assert.ok(arrows.every(s=>
       (s.faceAfter.display==='none'||s.faceAfter.content==='none')&&
       (s.iconAfter.display==='none'||s.iconAfter.content==='none')&&
       s.iconBorder==='0px'&&s.iconBackground==='none'&&
       s.iconWidth>=18&&s.iconHeight>=18&&s.iconHeight<=36),
       'Norsk premium still has legacy green arrow discs or framed pictograms: '+
       JSON.stringify(arrows));
   }
   const leftEdges=activityBoxes.map(r=>r.l);
   const subjectsLeft=boxes.menu[0].l;
   assert.ok(leftEdges.every(left=>Math.abs(left-subjectsLeft)<=3),
     world.id+' activity signs must share the subject sign left edge: '+
      JSON.stringify({leftEdges,subjectsLeft}));
   await page.screenshot({path:path.join(out,name+'-'+device+'-'+world.id+'-activities.png'),animations:'disabled'});
   // An external iPad keyboard returns to the SAME five-sign menu.
   // Focus goes to the active subject, not an invisible activity button.
   await activities.locator('.laria-wayfinder').first().focus();
   await page.keyboard.press('Escape');
   assert.equal(await scene.getAttribute('data-laria-reference-mode'),'subjects',
     world.id+' Escape did not return to the subject menu');
   assert.equal(await nav.isVisible(),true,world.id+' subject menu hidden after Escape');
   assert.equal(await activities.isVisible(),false,world.id+' activity menu still visible after Escape');
   assert.equal(await plaque.getAttribute('aria-expanded'),'true',
     world.id+' restored heading does not expose the five-subject rail after Escape');
   const currentSubject=nav.locator('button[aria-current="page"]');
   assert.equal(await currentSubject.evaluate(el=>document.activeElement===el),true,
     world.id+' Escape did not restore focus to the current subject');
   await page.keyboard.press('Escape');
   // Second Escape is the global return; the first was the scene-local
   // activity-to-subject-menu step. Both must remain keyboard reachable.
   await home.waitFor({state:'visible',timeout:15000});
   await openHomeSubject(page,world.id);
   await scene.waitFor({state:'visible',timeout:15000});
   assert.equal(await scene.getAttribute('data-laria-reference-mode'),'subjects',
     world.id+' keyboard return lost the subject menu state');
   await plaque.click();
   assert.equal(await scene.getAttribute('data-laria-reference-mode'),'activities');
   await plaque.click();
   assert.equal(await scene.getAttribute('data-laria-reference-mode'),'subjects');
   assert.equal(await nav.isVisible(),true);
   assert.equal(await activities.isVisible(),false);
   // Clicking the currently selected subject is a second intuitive door into
   // exactly the same activities, and never creates a right-hand menu.
   await nav.locator('[data-laria-ref-subject="'+world.id+'"]').click();
   assert.equal(await scene.getAttribute('data-laria-reference-mode'),'activities');
   await plaque.click();
   assert.equal(await scene.getAttribute('data-laria-reference-mode'),'subjects');

   await nav.locator('[data-laria-ref-subject="home"]').click();
   await home.waitFor({state:'visible',timeout:15000});
  }
  // A quick click must NOT open the protected parent area. The exact same
  // deliberate long press as the original Home gate must open it on iPad.
  await openHomeSubject(page,'norwegian');
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
  await openHomeSubject(page,'norwegian');
  await page.locator('#eggenipa-world .laria-reference-heading').click();
  await page.locator('#eggenipa-world .laria-reference-subject-nav [data-laria-ref-subject="math"]').click();
  await page.locator('#tallvika-world .tv-scene.laria-reference-layout-v1').waitFor({state:'visible',timeout:17000});
  await page.locator('#tallvika-world .laria-reference-heading').click();
  await page.locator('#tallvika-world .laria-reference-subject-nav [data-laria-ref-subject="geography"]').click();
  await page.locator('#laria-geography-world .gv-scene.laria-reference-layout-v1').waitFor({state:'visible',timeout:17000});
  await page.locator('#laria-geography-world .laria-reference-heading').click();
  await page.locator('#laria-geography-world .laria-reference-subject-nav [data-laria-ref-subject="norwegian"]').click();
  await page.locator('#eggenipa-world .eg-hero.laria-reference-layout-v1').waitFor({state:'visible',timeout:17000});
  await page.locator('#eggenipa-world .laria-reference-heading').click();
  await page.locator('#eggenipa-world .laria-reference-subject-nav [data-laria-ref-subject="home"]').click();
  await home.waitFor({state:'visible',timeout:17000});
  // The three signs are the actual learning routes, not decorative labels.
  // Exercise two independent activity engines through their real DOM buttons
  // and confirm their Back actions restore the same subject artwork.
  await openHomeSubject(page,'norwegian');
  // The three original activity signs are visible on entry.
  await page.locator('#eggenipa-world .eg-hero.laria-reference-layout-v1 .eg-scene-hit[data-eg="words"]').click();
  const wordHunt=page.locator('#word-hunt-overlay:not([hidden])');
  await wordHunt.waitFor({state:'visible',timeout:16000});
  assert.match(await wordHunt.getAttribute('aria-label'),/Ordjakt/);
  // Initial Ordjakt opens the visible theme picker. Its own Back control is
  // the child's genuine route; the exercise-shell Back is intentionally hidden.
  await wordHunt.locator('.word-hunt-theme-picker:not([hidden]) .wh-theme-close:visible').click();
  await page.locator('#eggenipa-world .eg-hero.laria-reference-layout-v1').waitFor({state:'visible',timeout:16000});
  assert.equal(await page.locator('#eggenipa-world .eg-hero.laria-reference-layout-v1').getAttribute('data-laria-reference-mode'),'activities');
  await page.locator('#eggenipa-world .eg-hero.laria-reference-layout-v1 .laria-reference-heading').click();
  await page.locator('#eggenipa-world .laria-reference-subject-nav [data-laria-ref-subject="home"]').click();
  await home.waitFor({state:'visible',timeout:16000});
  await openHomeSubject(page,'math');
  // The three original activity signs are visible on entry.
  await page.locator('#tallvika-world .tv-scene.laria-reference-layout-v1 .tv-sign[data-tv="multiply"]').click();
  await page.locator('#multiplication-lab-screen.active').waitFor({state:'visible',timeout:17000});
  await page.locator('#multiplication-lab-back').click();
  await page.locator('#tallvika-world .tv-scene.laria-reference-layout-v1').waitFor({state:'visible',timeout:17000});
  assert.equal(await page.locator('#tallvika-world .tv-scene.laria-reference-layout-v1').getAttribute('data-laria-reference-mode'),'activities');
  await page.locator('#tallvika-world .tv-scene.laria-reference-layout-v1 .laria-reference-heading').click();
  await page.locator('#tallvika-world .laria-reference-subject-nav [data-laria-ref-subject="home"]').click();
  await home.waitFor({state:'visible',timeout:16000});
  await openHomeSubject(page,'english');
  const english=page.locator('#kinnaklova-world:visible');
  await english.waitFor({state:'visible',timeout:18000});
  const cleanArtApproved=(await english.getAttribute('data-ki-premium-art'))==='approved';
  if(cleanArtApproved){
    const stage=english.locator('.ki-stage.laria-reference-layout-v1');
    await stage.waitFor({state:'visible',timeout:18000});
    assert.equal(await stage.locator('nav.laria-scene-navigation .ki-painted-hit.laria-wayfinder').count(),3,
      'Clean Engelsk must have the same three real left-hand signs');
    assert.equal(await stage.locator('.ki-world-brand').count(),1,
      'Clean Engelsk must use one shared Læria wordmark');
  }else{
    assert.equal(await english.locator('.laria-reference-subject-nav').count(),0,
      'Locked painted English art cannot receive duplicate live planks');
    assert.equal(await english.locator('.ki-world-brand').count(),0,
      'Do not overlay the logo baked into the locked October image');
  }
  await page.locator('#kinnaklova-world[data-ki-art="ready"]').waitFor({timeout:22000});
  // SHA-verified original-derived clean scene, with one shared active rail.
  assert.equal(await english.getAttribute('data-ki-premium-art'),'approved',
    'English should render the real original-derived Kinn picture without painted signs');
  assert.equal(await page.evaluate(()=>window.LARIA_KINNAKLOVA?.premiumReady?.()),true,
    'Kinn artwork must be verified by actual SHA-256 before presentation');
  const rail=english.locator('.ki-stage.laria-reference-layout-v1 > nav.laria-scene-navigation');
  await rail.waitFor({state:'visible',timeout:15000});
  const actions=rail.locator('.ki-painted-hit.laria-wayfinder');
  assert.deepEqual(await actions.evaluateAll(items=>items.map(x=>x.dataset.ki)),
    ['words','sentences','reading'],'Real activity routes must survive migration');
  const xcoords=await actions.evaluateAll(items=>items.map(el=>el.getBoundingClientRect().left));
  assert.ok(Math.max(...xcoords)-Math.min(...xcoords)<3,'All Kinn signs must align left');
  if(device.startsWith('ipad')){
   const stageBox=await english.locator('.ki-stage.laria-reference-layout-v1').boundingBox();
   const railBox=await rail.boundingBox();
   const expected=device==='ipad-landscape'?.185:.27;
   const observed=(railBox.y-stageBox.y)/stageBox.height;
   assert.ok(Math.abs(observed-expected)<.017,
     'Kinnaklova signposts must sit against the left cliff, never on the church roof: '+
     JSON.stringify({device,expected,observed}));
  }
  await page.screenshot({path:path.join(out,name+'-'+device+'-english-unified-approved.png'),animations:'disabled'});
  assert.deepEqual(errors,[],name+'/'+device+' browser exceptions');
  const st=await page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2')));
  assert.equal(st.profile.tallvikaTroll,'lillesoster');
  await fs.promises.writeFile(path.join(out,name+'-'+device+'-review.json'),JSON.stringify({
    head:process.env.LARIA_GIT_SHA||null,mode:'KINN CLEAN ART VERIFIED - RELEASE STILL BLOCKED',
    engine:name,device,viewport,scenesReviewed:worlds.map(w=>w.id),
    blockedOriginals:['Grovanova/Hjem'],
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
  {id:'english-unified-approved',name:'ENGELSK · Kinnaklova',status:'REN KINN ORIGINAL: skilt samlet til venstre'},
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
  ].filter(([device])=>process.env.LARIA_IPAD_ONLY!=='1'||device.startsWith('ipad')))
  for(const [name,engine] of [['chromium',chromium],['webkit',webkit]])
    await testEngine(engine,name,device,viewport);
 } catch(error){failure=error;}
 try{await assembleRealArtReviewSheets();}
 catch(error){console.error('Review sheet assembly failed:',error);
   if(!failure)failure=error;}
 if(failure)throw failure;
})().catch(err=>{console.error(err);process.exitCode=1});
