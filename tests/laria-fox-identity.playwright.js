'use strict';
/* Runtime proof: selected fox, not a generic picture or icon, follows the child
 * through all four approved worlds and their actual question screens. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const folder=process.env.LARIA_FOX_SCREENSHOTS||'/tmp/laria-fox-identity';
fs.mkdirSync(folder,{recursive:true});
const subjects=['norwegian','math','english','geography'];
const makeSeed=which=>({
 version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'ReveQA',avatar:which,setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},
 preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null
});
async function imageIsChosen(page,selector,which,label){
 // The selected source <img> remains in DOM as the saved identity.
 // World scenes may intentionally hide its old portrait pixels in favour of
 // the SAME selected fox's transparent full-body SVG rig.
 const img=page.locator(selector);await img.waitFor({state:'attached',timeout:16000});
 await page.waitForFunction(([css,id])=>{
  const el=document.querySelector(css);
  return el?.complete&&el.naturalWidth>0&&
    el.getAttribute('src')===window.LARIA_PROFILE_AVATARS?.[id];
 },[selector,which],{timeout:16000});
 const info=await img.evaluate(el=>({
  src:el.getAttribute('src'),width:el.naturalWidth,height:el.naturalHeight,
  rect:(()=>{const r=el.getBoundingClientRect();return {w:r.width,h:r.height}})()
 }));
 assert.ok(info.src.startsWith('data:image/webp;base64,'),label+' uses non-profile asset');
 assert.ok(info.width>50&&info.height>50,label+' profile picture does not decode');
 assert.ok(info.rect.w>0&&info.rect.h>0,label+' saved identity image has no measured layout');
 if(selector.includes('.task-fox-companion')){
  const host=page.locator('#session-screen.active .task-fox-companion');
  const rig=host.locator(':scope > svg.laria-fox-wardrobe-art[data-fox-art="'+which+'-fullbody-v1"]');
  await rig.waitFor({state:'visible',timeout:12000});
  const art=await rig.evaluate(svg=>{
   const img=svg.querySelector('image'),r=svg.getBoundingClientRect();
   return {source:img?.getAttribute('href')||'',width:r.width,height:r.height};
  });
  assert.ok(art.width>25&&art.height>35,label+' visible full-body chosen fox rig missing');
  assert.match(art.source,which==='girl'?/girl-braids-blue-dress-v1\.webp$/:/boy-adventurer-green-vest-v1\.webp$/,
    label+' displayed fox does not match persisted identity');
 }
}
async function run(engine,name,viewport,which){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport,isMobile:viewport.width<600,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
  const seed=makeSeed(which);
  await context.addInitScript(s=>{
   if(!localStorage.getItem('laerlittmer-v2'))
    localStorage.setItem('laerlittmer-v2',JSON.stringify(s));
  },seed);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  const url=(process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria')+'&personal-fox='+name;
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.locator('#home-screen.active .bc14-subject:visible').first().waitFor({timeout:16000});
  assert.equal(await page.evaluate(()=>state.profile.avatar),which,name+' wrong persisted identity');
  assert.notEqual(await page.evaluate(()=>window.LARIA_FOX.source('girl')),await page.evaluate(()=>window.LARIA_FOX.source('boy')),name+' two foxes are identical');
  const lockedHome=await page.locator('.bc12.bc15-locked-home').count()>0;
  if(lockedHome){
   assert.equal(await page.locator('.bc12-fox:visible').count(),0,name+' Home v15 must not show the old fox');
   const saved=page.locator('.bc12-fox img');
   await saved.waitFor({state:'attached',timeout:16000});
   await page.waitForFunction(([css,id])=>{
    const el=document.querySelector(css);
    return el?.complete&&el.naturalWidth>0&&el.getAttribute('src')===window.LARIA_PROFILE_AVATARS?.[id];
   },['.bc12-fox img',which],{timeout:16000});
  }else{
   await imageIsChosen(page,'.bc12-fox img',which,name+' Home');
   if(viewport.width<600){
    const placement=await page.evaluate(()=>{
      const r=document.querySelector('.bc12-fox').getBoundingClientRect();
      const first=document.querySelector('.bc14-subject').getBoundingClientRect();
      return {foxBottom:r.bottom,firstCardTop:first.top,foxX:r.x};
    });
    assert.ok(placement.foxBottom<=placement.firstCardTop-5,
      name+' personal fox covered by the Home subject cards: '+JSON.stringify(placement));
    assert.ok(placement.foxX>=0,name+' personal fox positioned outside screen');
   }
  }
  await page.screenshot({path:folder+'/'+name+'-home.png',fullPage:true});
  for(const subject of subjects){
   const target=subject==='geography'?'geography':'subject';
   await page.locator('.bc14-subject[data-camp="subject-'+subject+'"]').click();
   if(subject==='math'){
     // The child's Tallvika friend is an original troll, rather than the
     // retired fox on the old Math map. Profile data itself remains intact.
     const tv=page.locator('#subject-screen.active #tallvika-world');
     await tv.waitFor({state:'visible',timeout:16000});
     const original=tv.locator('.tv-companion img');
     assert.match(await original.getAttribute('src'),/gangemagi-troll\/storesoster\.webp$/,name+' incorrect original troll');
     await original.evaluate(img=>img.decode());
     await page.screenshot({path:folder+'/'+name+'-math-tallvika.png',fullPage:true});
     await tv.locator('[data-tv="next"]').click();
     await page.locator('#session-screen.active .laria-task-card').waitFor({timeout:16000});
     assert.equal(await page.locator('.task-fox-companion').getAttribute('data-avatar'),which,name+' profile avatar changed');
     await page.locator('#close-session').click();
     await tv.waitFor({state:'visible',timeout:14000});
     await tv.locator('[data-tv="back"]').click();
     await page.locator('#home-screen.active').waitFor({timeout:14000});
     continue;
   }
   if(subject==='norwegian'){
     await page.locator('#eggenipa-world:visible').waitFor({timeout:16000});
     await page.locator('#eggenipa-world [data-eg="map"]').click();
   }
   const root=page.locator('#'+target+'-screen.active .locked-journey-map[data-journey-subject="'+subject+'"]');
   await root.waitFor({timeout:16000});
   await imageIsChosen(page,'#'+target+'-screen.active .locked-journey-profile img',which,name+' '+subject+' profile');
   const traveler=root.locator('.locked-journey-traveler');
   assert.equal(await traveler.getAttribute('data-avatar'),which,name+' '+subject+' traveler identity');
   await imageIsChosen(page,'#'+target+'-screen.active .locked-journey-traveler img',which,name+' '+subject+' traveler');
   const scene=await traveler.evaluate(el=>({
    pointer:getComputedStyle(el).pointerEvents,
    border:getComputedStyle(el).borderRadius,
    x:el.getBoundingClientRect().x,
    w:el.getBoundingClientRect().width
   }));
   assert.equal(scene.pointer,'none',name+' '+subject+' fox intercepts landmark taps');
   assert.ok(scene.w>=28,name+' '+subject+' tiny traveling fox');
   await page.screenshot({path:folder+'/'+name+'-'+subject+'.png',fullPage:true});
   await root.locator('.locked-journey-hotspot.state-current').first().click();
   const mission=page.locator('.locked-journey-overlay:not([hidden]) button[data-locked-node]:not([disabled])').first();
   await mission.waitFor({timeout:10000});await mission.click();
   await page.locator('#session-screen.active .laria-task-card').waitFor({timeout:16000});
   assert.equal(await page.locator('.task-fox-companion').getAttribute('data-avatar'),which,name+' '+subject+' question identity');
   await imageIsChosen(page,'#session-screen.active .task-fox-companion img',which,name+' '+subject+' question');
   const taskGeometry=await page.evaluate(()=>{
    const root=document.querySelector('#session-screen.active');
    const fox=root?.querySelector('.task-fox-companion');
    const prompt=root?.querySelector('.task-prompt-fox-stage > .question');
    const answer=root?.querySelector('.task-interaction button, .task-interaction [role="button"], .letter-tile');
    const bound=el=>el?.getBoundingClientRect().toJSON()||null;
    return {foxCount:root?.querySelectorAll('.task-fox-companion').length||0,
      inline:!!root?.querySelector('.task-inline-fox'),
      fox:bound(fox),prompt:bound(prompt),answer:bound(answer)};
   });
   assert.equal(taskGeometry.foxCount,1,name+' '+subject+' duplicated selected fox');
   if(taskGeometry.inline&&taskGeometry.answer){
    assert.ok(taskGeometry.fox?.bottom<=taskGeometry.answer.top+2,
      name+' '+subject+' fox overlaps first answer: '+JSON.stringify(taskGeometry));
    assert.ok(taskGeometry.prompt?.right<=taskGeometry.fox.left+3,
      name+' '+subject+' fox covers question text: '+JSON.stringify(taskGeometry));
   }
   // Actual WebKit/Chromium task scenes for visual QA across all four worlds.
   // The same profile choice must be present on the task, not only on the map.
   await page.screenshot({path:folder+'/'+name+'-'+subject+'-task.png',fullPage:true,animations:'disabled'});
   await page.locator('#close-session').click();await root.waitFor({timeout:16000});
   await root.locator('.locked-journey-back').click();
   await page.locator('#home-screen.active .bc14-subject[data-camp="subject-'+subject+'"]:visible').waitFor({timeout:12000});
  }
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#home-screen.active .bc14-subject:visible').first().waitFor({timeout:16000});
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2')).profile.avatar),which,name+' reload lost avatar');
  if(await page.locator('.bc12.bc15-locked-home').count()){
   assert.equal(await page.locator('.bc12-fox:visible').count(),0,name+' reloaded Home v15 must keep old fox hidden');
   await page.waitForFunction(id=>{
    const el=document.querySelector('.bc12-fox img');
    return el?.complete&&el.naturalWidth>0&&el.getAttribute('src')===window.LARIA_PROFILE_AVATARS?.[id];
   },which,{timeout:16000});
  }else{
   await imageIsChosen(page,'.bc12-fox img',which,name+' reloaded Home');
  }
  assert.deepEqual(errors,[],name+' uncaught errors');
  await context.close();
  console.log('Personal fox verified',name,which,'Home + four real journeys + four tasks + reload');
 }finally{await browser.close()}
}
(async()=>{
 for(const [engine,name,viewport,which] of [
  [chromium,'chromium-iphone-boy',{width:390,height:844},'boy'],
  [webkit,'webkit-iphone-girl',{width:390,height:844},'girl'],
  [webkit,'webkit-ipad-boy',{width:820,height:1180},'boy'],
  [webkit,'webkit-ipad-landscape-girl',{width:1180,height:820},'girl']
 ])await run(engine,name,viewport,which);
})().catch(e=>{console.error(e);process.exitCode=1});
