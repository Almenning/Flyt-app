'use strict';
/* Isolated production-safe Kinnaklova regression and screenshot QA. */
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const output=process.env.LARIA_KINNAKLOVA_SCREENSHOTS||'/tmp/laria-kinn-isolated';
const seed={
 version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'Kinnaklova QA',avatar:'girl',setupVersion:2,tallvikaTroll:'lillesoster'},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
 masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
 lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null
};
async function enter(page){
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
 const home=page.locator('#home-screen .bc14-subject[data-camp="subject-english"]');
 await home.waitFor({state:'visible',timeout:30000});
 await home.click();
 await page.locator('#kinnaklova-world[data-ki-art="ready"]').waitFor({timeout:25000});
 const stage=page.locator('#kinnaklova-world .ki-stage.laria-reference-layout-v1');
 await stage.waitFor({state:'visible',timeout:16000});
 return stage;
}
async function visit(engine,name,device,viewport){
 const browser=await engine.launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block',deviceScaleFactor:1});
  await context.addInitScript(v=>localStorage.setItem('laerlittmer-v2',JSON.stringify(v)),seed);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const stage=await enter(page);
  const world=page.locator('#kinnaklova-world');
  assert.equal(await world.getAttribute('data-ki-premium-art'),'approved');
  assert.equal(await world.getAttribute('data-ki-unified-left-rail'),'ready');
  assert.equal(await stage.locator('.ki-world-brand:visible').count(),1,'must have one real Læria logo');
  assert.equal((await stage.locator('.laria-reference-heading strong').textContent()).trim(),'Engelsk');
  assert.equal((await stage.locator('.laria-reference-heading small').textContent()).trim(),'Kinnaklova');
  const controls=await stage.evaluate(stage=>{
   const r=sel=>stage.querySelector(sel)?.getBoundingClientRect();
   const brand=r('.ki-world-brand'),heading=r('.laria-reference-heading');
   const home=r('.ki-painted-home'),choose=r('.ki-stage-choose');
   const overlaps=(a,b)=>!!(a&&b&&a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top);
   const visible=sel=>{const el=stage.querySelector(sel);return !!(el&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden')};
   return {headingAboveLogo:overlaps(brand,heading),chooserOverLogo:overlaps(brand,choose),
    homeVisible:visible('.ki-painted-home'),homeWidth:home?.width};
  });
  assert.equal(controls.headingAboveLogo,false,'English heading must never overlap Læria logo');
  assert.equal(controls.chooserOverLogo,false,'Troll chooser must not cover Læria logo');
  assert.equal(controls.homeVisible,true,'Compact devices must not hide Home');
  assert.ok(controls.homeWidth>=44,'Home needs a 44px touch target');
  const art=stage.locator('img.ki-master');
  assert.match(await art.getAttribute('src'),/kinnaklova-ui-free-approved\.webp/);
  const dimensions=await art.evaluate(img=>[img.naturalWidth,img.naturalHeight]);
  assert.deepEqual(dimensions,[1672,941],'Must use the locked Kinn source edit');
  assert.equal(await stage.locator('button.ki-painted-hit.laria-wayfinder').count(),3,
   'Only 3 real activity signs, without old hotspots');
  const rail=stage.locator('nav.laria-scene-navigation');
  assert.equal(await rail.count(),1,'one rail only');
  const signData=await rail.locator('button.ki-painted-hit.laria-wayfinder').evaluateAll(els=>
   els.map(el=>({action:el.dataset.ki,label:el.innerText?.trim(),rect:{
    x:el.getBoundingClientRect().x,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height
   }})));
  assert.deepEqual(signData.map(x=>x.action),['words','sentences','reading']);
  assert.ok(signData.every(x=>x.rect.width>=44&&x.rect.height>=44),'All destinations must be accessible');
  assert.ok(Math.max(...signData.map(x=>x.rect.x))-Math.min(...signData.map(x=>x.rect.x))<3,
   'All three signs must align on the left, not scatter across the landscape');
  assert.ok(signData[0].rect.x<viewport.width*.48,'The activity group must be on the left');
  const posts=await rail.evaluate(el=>getComputedStyle(el,'::before').backgroundImage);
  assert.match(posts,/laria-grovanova-signposts\.svg/,'Shared two continuous posts missing');
  const actor=stage.locator('.ki-companion-actor[data-troll="lillesoster"]');
  await actor.waitFor({state:'visible'});
  assert.equal(await stage.locator('.ki-companion-actor:visible').count(),1,
    'Only the selected original TrollActor may appear');
  assert.match(await actor.locator('img').getAttribute('src'),/gangemagi-troll\/lillesoster\.webp/);
  await fs.promises.mkdir(output,{recursive:true});
  await page.screenshot({path:path.join(output,name+'-'+device+'-Kinnaklova.png'),animations:'disabled'});
  await rail.locator('button[data-ki="words"]').click();
  await page.locator('#session-screen.active .laria-task-card').waitFor({state:'visible',timeout:20000});
  const scope=await page.evaluate(()=>({subject:sessionScope?.subject,module:sessionScope?.module}));
  assert.deepEqual(scope,{subject:'english',module:'words'},'Real Words activity must open');
  assert.deepEqual(errors,[],name+'/'+device+' page errors');
  await context.close();
  console.log('PASS',name,device,JSON.stringify(signData.map(x=>[x.action,Math.round(x.rect.x)])));
 }finally{await browser.close()}
}
async function poisonedArt(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:1194,height:834},serviceWorkers:'block'});
  await context.addInitScript(v=>localStorage.setItem('laerlittmer-v2',JSON.stringify(v)),seed);
  const page=await context.newPage();
  const original=path.resolve(__dirname,'../laer-litt-mer/assets/kinnaklova/kinnaklova-scene-clean-approved-20261026.webp');
  await page.route('**/assets/kinnaklova/kinnaklova-ui-free-approved.webp',route=>
   route.fulfill({path:original,contentType:'image/webp'}));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
  await page.locator('#home-screen .bc14-subject[data-camp="subject-english"]').click();
  const world=page.locator('#kinnaklova-world[data-ki-art="unapproved"]');
  await world.waitFor({timeout:22000});
  assert.equal(await world.locator('.ki-master').isVisible(),false,'Wrong art became visible');
  assert.equal(await world.locator('button.ki-painted-words').isVisible(),false,'Invalid painted art made navigation visible');
  assert.equal(await world.locator('.ki-companions').isVisible(),false,'Troll shown over invalid art');
  assert.equal(await world.locator('.ki-card').count(),3,'Learning fallback removed');
  await context.close();
  console.log('PASS SHA failure is safely hidden');
 }finally{await browser.close()}
}
(async()=>{
 await poisonedArt();
 const sizes={
  'ipad-landscape':{width:1366,height:1024},
  'ipad-portrait':{width:1024,height:1366},
  'iphone-portrait':{width:390,height:844},
  'iphone-landscape':{width:844,height:390}
 };
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  for(const [device,viewport] of Object.entries(sizes)){
   await visit(engine,name,device,viewport);
  }
 }
})().catch(error=>{console.error(error);process.exitCode=1});
