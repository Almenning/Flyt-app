'use strict';
/* Phase 2B: exact-HEAD visual evidence, real browser interactions, no mocks.
 * Candidate switch: ?lariaSigns2b=1, DEFAULT app must be unchanged.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const openHomeSubject=require('./helpers/laria-home-open-subject.cjs');
const BASE=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const OUT=process.env.LARIA_SIGNS_2B_SHOTS||'/tmp/laria-signs-2b';
const SEED={version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'Skilt QA',avatar:'girl',setupVersion:2,tallvikaTroll:'lillesoster'},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
 masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
const DEVICES=[
 ['ipad-820x1180',820,1180],
 ['ipad-1024x1366',1024,1366],
 ['ipad-1180x820',1180,820],
 ['ipad-1024x768',1024,768],
 ['ipad-1366x1024',1366,1024]
];
const SCENES=[
 {subject:'english',root:'#kinnaklova-world[data-ki-art="ready"] .ki-stage.laria-reference-layout-v1',
  back:'#kinnaklova-world .ki-painted-home:visible'},
 {subject:'math',root:'#tallvika-world .tv-scene.laria-reference-layout-v1',
  back:'#tallvika-world [data-tv="back"]:visible'}
];
async function captureScene(page,scene,filename,viewport,preview){
 await openHomeSubject(page,scene.subject);
 const root=page.locator(scene.root);
 await root.waitFor({state:'visible',timeout:30000});
 if(await root.getAttribute('data-laria-reference-mode')==='subjects')
   await root.locator('.laria-reference-heading').click();
 const rail=root.locator('nav.laria-scene-navigation:visible');
 await rail.waitFor({state:'visible',timeout:12000});
 const metrics=await rail.evaluate(node=>{
  const rectToJson=r=>({x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom});
  const rect=node.getBoundingClientRect(),style=getComputedStyle(node,'::before');
  const buttons=[...node.querySelectorAll('.laria-wayfinder')].filter(el=>{
   const s=getComputedStyle(el);return s.visibility!=='hidden'&&s.display!=='none'
  });
  const postTop=rect.top+Number.parseFloat(style.top||'0');
  const postBottom=postTop+Number.parseFloat(style.height||'0');
  return {nav:rectToJson(rect),postBottom,postImage:style.backgroundImage,
   buttons:buttons.map(el=>{
    const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
    return {...rectToJson(r),canTap:hit===el||el.contains(hit)};
   })};
 },null).catch(async error=>{
  throw new Error(scene.subject+' failed to measure real nav: '+error.message);
 });
 assert.equal(metrics.buttons.length,3,'Each subject must have THREE real activity signs');
 assert.match(metrics.postImage,/laria-grovanova-signposts\.svg/,'No shared two-post artwork');
 assert.ok(metrics.buttons.every(b=>b.width>=44&&b.height>=44&&b.canTap&&
     b.x>=-2&&b.right<=viewport.width+2&&b.y>=0&&b.bottom<=viewport.height+2),
   scene.subject+' clipped/unreachable boards '+JSON.stringify(metrics));
 assert.ok(metrics.postBottom>metrics.buttons[2].bottom-30,
   scene.subject+' posts stop too far above last board');
 if(preview&&scene.subject==='english'&&viewport.height>viewport.width){
  assert.ok(metrics.postBottom<viewport.height*.58,
   'Kinnaklova posts still end in the church roof zone: '+JSON.stringify(metrics));
  assert.ok(metrics.nav.y<viewport.height*.26,
   'Kinnaklova portrait signs still too low: '+JSON.stringify(metrics));
 }
 if(preview&&scene.subject==='math'){
  const next=await root.locator('button.tv-next-sign.laria-reference-next').evaluate(node=>{
   const rectToJson=r=>({x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom});
   const r=node.getBoundingClientRect(),s=getComputedStyle(node);
   return {rect:rectToJson(r),position:s.position,
    visibility:s.visibility,display:s.display};
  });
  assert.equal(next.position,'absolute','Next adventure must not be a fourth primary board');
  assert.ok(next.rect.height>=44&&next.rect.width>=44,'Secondary next sign is too small');
  // Compare a measured gap, not the older border-to-border expression.
  // The previous CI logged a ~26px positive gap but incorrectly failed
  // the direct relational assertion. Explicit numbers make this auditable.
  const gapToPrimary=Number(next.rect.top)-Number(metrics.buttons[2].bottom);
  assert.ok(Number.isFinite(gapToPrimary)&&gapToPrimary>=7,
   'Next sign overlaps primary boards (gap='+gapToPrimary+'): '+JSON.stringify({metrics,next}));
  assert.ok(metrics.postBottom<=next.rect.top+3,
   'Two shared posts still run through the secondary next sign: '+JSON.stringify({metrics,next}));
  assert.ok(next.rect.left>=0&&next.rect.right<=viewport.width+2&&next.rect.bottom<=viewport.height+2,
   'Secondary next sign is clipped on iPad '+JSON.stringify(next));
 }
 await page.screenshot({path:path.join(OUT,filename),animations:'disabled'});
 await page.locator(scene.back).click();
 await page.locator('#home-screen.active .bc12.bc15-v16-locked').waitFor({state:'visible',timeout:30000});
 return {subject:scene.subject,signs:metrics.buttons.length,postFoot:Math.round(metrics.postBottom),height:viewport.height};
}
async function run(engine,engineName,device,w,h){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 const viewport={width:w,height:h};
 try{
  const context=await browser.newContext({viewport,deviceScaleFactor:1,hasTouch:true,
    reducedMotion:'reduce',serviceWorkers:'block'});
  await context.addInitScript(value=>localStorage.setItem('laerlittmer-v2',JSON.stringify(value)),SEED);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  // Baseline evidence for both representative orientations, from exact HEAD.
  if(device==='ipad-1024x1366'||device==='ipad-1366x1024'){
   await page.goto(BASE+'&lariaSigns2b=0',{waitUntil:'domcontentloaded'});
   await page.locator('#home-screen.active .bc12.bc15-v16-locked').waitFor({timeout:30000});
   assert.equal(await page.locator('html[data-laria-signs-2b]').count(),0,
    '2B preview leaked into the default application');
   await page.screenshot({path:path.join(OUT,engineName+'-'+device+'-home-before.png'),animations:'disabled'});
   for(const scene of SCENES)
    await captureScene(page,scene,engineName+'-'+device+'-'+scene.subject+'-before.png',viewport,false);
  }
  await page.goto(BASE+'&lariaSigns2b=1',{waitUntil:'domcontentloaded'});
  await page.locator('#home-screen.active .bc12.bc15-v16-locked').waitFor({timeout:30000});
  assert.equal(await page.locator('html[data-laria-signs-2b="preview"]').count(),1,
    '2B preview switch failed');
  const home=page.locator('#home-screen.active .bc12.bc15-v16-locked');
  assert.match(await home.getAttribute('data-bc15-card-art'),/owner-approved-v16-painted/,
   'The owner-approved full-bleed Home has been replaced');
  assert.equal(await home.locator('.bc15-v16-sign').count(),4,'Home lost its four fag routes');
  await page.screenshot({path:path.join(OUT,engineName+'-'+device+'-home-after.png'),animations:'disabled'});
  const progressBefore=await page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2')).journey);
  const measured=[];
  for(const scene of SCENES)
   measured.push(await captureScene(page,scene,engineName+'-'+device+'-'+scene.subject+'-after.png',viewport,true));
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2')).journey),
   progressBefore,'2B navigation changed saved child journey progress');
  assert.deepEqual(errors,[],engineName+' '+device+' runtime exceptions');
  console.log('[Læria 2B]',engineName,device,JSON.stringify(measured));
  await context.close();
 }finally{await browser.close();}
}
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 for(const [name,w,h] of DEVICES)
  for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]])
   await run(engine,engineName,name,w,h);
})().catch(error=>{console.error(error);process.exitCode=1;});
