'use strict';
/* Actual in-game gestures, pixel screenshots and browser-generated .webm proof
 * for the approved Storesøster. Never claim a polished rig from still photos.
 * This is independent of the larger eight-mission regression suite, so its
 * video evidence is retained even when a downstream browser check fails.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium,webkit}=require('playwright');
const base=path.resolve(__dirname,'..');
const out=path.join(process.env.QA_SCREENSHOTS||'/tmp/laria-gangemagi-approved-visual','living-troll-proof');
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png',
 '.svg':'image/svg+xml','.json':'application/json'};
const seed={version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'Elev',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
 masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
 lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
function serve(){return new Promise((resolve,reject)=>{
 const srv=http.createServer((req,res)=>{
  let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(name.endsWith('/'))name+='index.html';
  const file=path.resolve(base,'.'+name);
  if(!file.startsWith(base+path.sep)){res.writeHead(403);res.end();return}
  fs.readFile(file,(err,bytes)=>{
   if(err){res.writeHead(404);res.end('Not found');return}
   res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
   res.setHeader('Cache-Control','no-store');res.end(bytes);
  });
 });
 srv.once('error',reject);
 srv.listen(0,'127.0.0.1',()=>resolve({
  srv,url:'http://127.0.0.1:'+srv.address().port+'/laer-litt-mer/?app=laria'
 }));
})}
async function start(page,url){
 await page.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed);
 await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
 await page.route('https://api.worldbank.org/**',r=>r.abort());
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.LARIA_GANGEMAGI?.version==='playable-v1',
  null,{timeout:30000});
 await page.evaluate(()=>window.showScreen('home'));
 await page.locator('#home-screen.active').waitFor();
}
async function visibleState(page,want,limit=6500){
 await page.waitForFunction(expected=>
  document.querySelector('#multiplication-lab-screen.active [data-troll-actor="storesoster"]')?.dataset.trollMood===expected,
  want,{timeout:limit});
}
async function observedState(page,want,limit=6500){
 await page.waitForFunction(expected=>
  window.__lariaTrollTrace?.some(step=>step.mood===expected),
  want,{timeout:limit});
}
async function openAndTrack(page){
 return page.evaluate(()=>{
  const root=document.getElementById('multiplication-lab-root');
  if(!root)throw Error('Real Gangemagi root missing');
  window.__lariaTrollTrace=[];
  let lastMood='';
  const capture=()=>{
   const actor=root.querySelector('[data-troll-actor="storesoster"]');
   if(!actor)return;
   const mood=actor.dataset.trollMood;
   if(mood!==lastMood){
    window.__lariaTrollTrace.push({mood,atMs:Math.round(performance.now())});
    lastMood=mood;
   }
  };
  const observer=new MutationObserver(capture);
  observer.observe(root,{subtree:true,attributes:true,childList:true,
   attributeFilter:['data-troll-mood']});
  window.__lariaTrollObserver=observer;
  window.openMultiplicationLab();
  capture();
  return root.querySelector('[data-troll-actor="storesoster"]')?.dataset.trollMood||null;
 });
}
async function shot(page,name){
 await page.screenshot({path:path.join(out,name+'.png'),fullPage:false});
}
async function record(browser,name,url,viewport){
 const context=await browser.newContext({
  viewport,deviceScaleFactor:1,hasTouch:true,isMobile:viewport.width<=700,
  serviceWorkers:'block',recordVideo:{dir:out,size:{width:viewport.width,height:viewport.height}}
 });
 const page=await context.newPage();
 const video=page.video();
 const errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 let trace=[];
 try{
  await start(page,url);
  const opening=await openAndTrack(page);
  assert.equal(opening,'wave',name+': greeting did not actually start on game entry');
  const actor=page.locator('[data-troll-actor="storesoster"]');
  await actor.waitFor();
  assert.equal(await actor.getAttribute('data-troll-rig'),'crop-v1');
  await actor.locator('img.troll-actor__fallback').evaluate(img=>img.decode());
  const source=await actor.locator('img.troll-actor__fallback').getAttribute('src');
  assert.equal(source,'./assets/gangemagi-troll/storesoster.webp',
   'character image must remain the exact approved source');
  await shot(page,name+'-01-greeting');
  await visibleState(page,'idle');
  await shot(page,name+'-02-idle');
  const movement=await actor.evaluate(node=>({
   head:getComputedStyle(node.querySelector('.troll-actor__head')).animationName,
   hair:getComputedStyle(node.querySelector('.troll-actor__hair')).animationName,
   legs:getComputedStyle(node.querySelector('.troll-actor__legs')).animationName,
   arm:getComputedStyle(node.querySelector('.troll-actor__arm--left')).animationName
  }));
  assert.match(movement.head,/troll-idle-head/,name+' head is static during rest');
  assert.match(movement.hair,/troll-idle-hair/,name+' hair is static during rest');
  assert.match(movement.legs,/troll-idle-body/,name+' body is static during rest');
  await page.waitForTimeout(500);
  await page.locator('[data-gm-action="hint"]').click();
  await observedState(page,'think');
  await observedState(page,'hint');
  await shot(page,name+'-03-hint');
  await visibleState(page,'idle');
  // The lesson requires TROLL first, THEN basket. A basket is deliberately
  // not touchable before pickup; never force-click a disabled learning step.
  // Fill the first basket using exactly three genuine berry deliveries.
  for(let berry=1;berry<=3;berry++){
   const before=await page.evaluate(()=>window.__lariaTrollTrace.filter(s=>s.mood==='celebrate').length);
   const previousWaves=await page.evaluate(()=>window.__lariaTrollTrace.filter(s=>s.mood==='wave').length);
   await page.locator('[data-gm-action="troll"][data-gm-troll="0"]').click();
   if(berry===1)await page.waitForFunction(n=>
     window.__lariaTrollTrace.filter(s=>s.mood==='wave').length>n,
     previousWaves,{timeout:3000});
   await page.locator('[data-gm-action="basket"][data-gm-basket="0"] .gm-crate-front').click();
   await page.waitForFunction(n=>window.LARIA_GANGEMAGI.snapshot().counts[0]===n,
    berry,{timeout:6500});
   await page.waitForFunction(n=>window.__lariaTrollTrace.filter(s=>s.mood==='celebrate').length>n,
    before,{timeout:3500});
   if(berry===1)await shot(page,name+'-04-berry-celebration');
  }
  // A full basket WITH a selected troll is the genuine reachable path to
  // supportive feedback. Preserve the rule that empty selections are blocked.
  await page.locator('[data-gm-action="troll"][data-gm-troll="0"]').click();
  await page.locator('[data-gm-action="basket"][data-gm-basket="0"] .gm-crate-front').click();
  await observedState(page,'support');
  await shot(page,name+'-05-full-basket-support');
  await visibleState(page,'idle');
  const progress=await page.evaluate(()=>{
   const saved=JSON.parse(localStorage.getItem('laria-gangemagi-v1'));
   const profile=JSON.parse(localStorage.getItem('laerlittmer-v2')).profile;
   return {counts:saved.counts,avatar:profile.avatar,grade:profile.grade};
  });
  assert.equal(progress.counts[0],3,name+': exact three-berry basket arithmetic changed');
  assert.equal(progress.avatar,'girl',name+': existing child identity was rewritten');
  assert.equal(progress.grade,2,name+': grade state was rewritten');
  assert.deepEqual(errors,[],name+' unexpected browser errors');
  trace=await page.evaluate(()=>window.__lariaTrollTrace);
  for(const mood of ['wave','idle','think','hint','support','celebrate'])
   assert.ok(trace.some(entry=>entry.mood===mood),
    name+' did not ACTUALLY trigger '+mood+' from normal gameplay');
  await fs.promises.writeFile(path.join(out,name+'-motion-trace.json'),
   JSON.stringify({name,viewport,source,movement,trace,progress,errors},null,2));
  console.log('PASS LIVE TROLL MOTION',name,trace.map(entry=>entry.mood).join(' > '));
 }finally{
  await context.close();
  if(video){
   await video.saveAs(path.join(out,name+'-real-gestures.webm'));
  }
 }
}
async function reducedMotion(browser,url){
 const context=await browser.newContext({viewport:{width:390,height:844},
  reducedMotion:'reduce',serviceWorkers:'block',hasTouch:true,isMobile:true});
 try{
  const page=await context.newPage();
  await start(page,url);
  const opening=await page.evaluate(()=>{
   window.openMultiplicationLab();
   return document.querySelector('[data-troll-actor="storesoster"]')?.dataset.trollMood;
  });
  assert.equal(opening,'wave','reduced motion still announces the real greeting');
  const actor=page.locator('[data-troll-actor="storesoster"]');
  await actor.waitFor();
  const styles=await actor.evaluate(el=>{
   const css=node=>getComputedStyle(el.querySelector(node));
   return {fallbackOpacity:css('.troll-actor__fallback').opacity,
    rigDisplay:css('.troll-actor__rig').display,
    armAnimation:css('.troll-actor__arm--left').animationName};
  });
  assert.equal(styles.fallbackOpacity,'1','reduced motion must display approved intact image');
  assert.equal(styles.rigDisplay,'none','reduced motion must disable the crop rig');
  assert.equal(styles.armAnimation,'none','reduced motion must not animate the arm');
  await visibleState(page,'idle');
  console.log('PASS LIVE TROLL REDUCED MOTION');
 }finally{await context.close()}
}
(async()=>{
 await fs.promises.mkdir(out,{recursive:true});
 const requested=process.env.GANGEMAGI_QA_BROWSER||'all';
 assert.ok(['all','chrome','webkit'].includes(requested));
 const {srv,url}=await serve();
 try{
  for(const [name,type,cases] of [
   ['chrome',chromium,[['iphone390',{width:390,height:844}]]],
   ['webkit',webkit,[['iphone390',{width:390,height:844}],
     ['ipad-landscape',{width:1180,height:820}]]]
  ]){
   if(requested!=='all'&&requested!==name)continue;
   const browser=await type.launch({headless:true});
   try{
    for(const [label,viewport] of cases)
     await record(browser,name+'-'+label,url,viewport);
    if(name==='webkit')await reducedMotion(browser,url);
   }finally{await browser.close()}
  }
 }finally{await new Promise(resolve=>srv.close(resolve))}
})().catch(error=>{console.error(error);process.exitCode=1});
