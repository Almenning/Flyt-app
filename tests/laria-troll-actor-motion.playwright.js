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
const {spawnSync}=require('node:child_process');
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
/* Source-identity gate: compare the actual DOM-composited resting actor to
 * the exact same original WebP, at identical native 1:2 aspect ratio. The
 * screenshots are evidence, not AI-generated concept art. This test catches
 * accidental holes, colored overlays or a swapped character source. */
async function auditSourceArtwork(page,name){
 const proof=page.locator('#laria-storesoster-identity-proof');
 const source=await page.evaluate(()=>{
  const live=document.querySelector('#multiplication-lab-screen.active [data-troll-actor="storesoster"]');
  const src=live?.querySelector('img.troll-actor__fallback')?.getAttribute('src');
  if(!src)throw Error('Approved in-game Storesøster source not mounted');
  document.getElementById('laria-storesoster-identity-proof')?.remove();
  document.getElementById('laria-storesoster-identity-style')?.remove();
  const style=document.createElement('style');
  style.id='laria-storesoster-identity-style';
  style.textContent='#laria-storesoster-identity-proof .troll-actor, #laria-storesoster-identity-proof .troll-actor *{animation:none!important;transition:none!important}';
  document.head.appendChild(style);
  const host=document.createElement('div');
  host.id='laria-storesoster-identity-proof';
  host.style.cssText='position:fixed;left:0;top:0;width:180px;height:360px;z-index:2147483647;pointer-events:none;background:white;overflow:hidden';
  const approved=document.createElement('img');
  approved.dataset.original=true;
  approved.src=src;
  approved.style.cssText='display:block;position:absolute;inset:0;width:100%;height:100%;object-fit:contain';
  const animated=document.createElement('div');
  animated.dataset.rig=true;
  animated.style.cssText='display:none;position:absolute;inset:0;width:100%;height:100%';
  animated.innerHTML=window.LARIA_TROLL_ACTOR.render({id:'identity-proof',name:'Storesøster',src,mood:'idle'});
  host.append(approved,animated);
  document.body.appendChild(host);
  return src;
 });
 try{
  await proof.locator('[data-original]').evaluate(img=>img.decode());
  const original=await proof.screenshot({path:path.join(out,name+'-06-locked-source-identity.png'),animations:'disabled'});
  await page.evaluate(()=>{
   const host=document.getElementById('laria-storesoster-identity-proof');
   host.querySelector('[data-original]').style.display='none';
   host.querySelector('[data-rig]').style.display='block';
  });
  const rig=await proof.screenshot({path:path.join(out,name+'-07-resting-actor-identity.png'),animations:'disabled'});
  const diff=await page.evaluate(async values=>{
   const images=await Promise.all(values.map(async bytes=>{
    const img=new Image();
    img.src='data:image/png;base64,'+bytes;
    await img.decode();
    const canvas=document.createElement('canvas');
    canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(img,0,0);
    return {width:canvas.width,height:canvas.height,pixels:ctx.getImageData(0,0,canvas.width,canvas.height).data};
   }));
   if(images[0].width!==images[1].width||images[0].height!==images[1].height)
    throw Error('Original and rig evidence dimensions differ');
   let colored=0,significantMismatch=0,totalChannelError=0;
   const before=images[0].pixels,after=images[1].pixels;
   for(let i=0;i<before.length;i+=4){
    // The proof has a WHITE opaque backdrop. Restrict comparison to source
    // figure pixels; blank canvas cannot dilute an identity discrepancy.
    const sourceInk=765-before[i]-before[i+1]-before[i+2];
    if(sourceInk<=40)continue;
    colored++;
    const delta=Math.abs(before[i]-after[i])+Math.abs(before[i+1]-after[i+1])+Math.abs(before[i+2]-after[i+2]);
    totalChannelError+=delta;
    if(delta>135)significantMismatch++;
   }
   return {width:images[0].width,height:images[0].height,
    sourceInkPixels:colored,mismatchedPixels:significantMismatch,
    mismatchedPct:colored?Number((100*significantMismatch/colored).toFixed(2)):100,
    meanRGBError:colored?Number((totalChannelError/(colored*3)).toFixed(2)):255};
  },[original.toString('base64'),rig.toString('base64')]);
  await fs.promises.writeFile(path.join(out,name+'-08-source-identity-report.json'),
   JSON.stringify({name,source,rig:'source-bones-v2',...diff,thresholdPct:5},null,2));
  assert.ok(diff.sourceInkPixels>12000,name+' source mask unexpectedly empty');
  assert.ok(diff.mismatchedPct<=5,
   name+' the resting actor visibly departs from the locked source: '+diff.mismatchedPct+'%');
  console.log('PASS LOCKED CHARACTER IDENTITY',name,'mismatch',diff.mismatchedPct+'%',
   'mean RGB drift',diff.meanRGBError);
 }finally{
  await page.evaluate(()=>{
   document.getElementById('laria-storesoster-identity-proof')?.remove();
   document.getElementById('laria-storesoster-identity-style')?.remove();
  });
 }
}
async function record(browser,name,url,viewport){
 const context=await browser.newContext({
  viewport,deviceScaleFactor:1,hasTouch:true,isMobile:viewport.width<=700,
  serviceWorkers:'block',recordVideo:{dir:out,size:{width:viewport.width,height:viewport.height}}
 });
 const page=await context.newPage();
 const videoOrigin=Date.now(); // the untrimmed recording begins at page creation
 let gameStartSec=0;
 const video=page.video();
 const errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 let trace=[];
 try{
  await start(page,url);
  const opening=await openAndTrack(page);
  // CI startup can show Home for many seconds before Gangemagi has mounted.
  // Preserve the raw browser recording, but also export a reviewable MP4
  // that begins just before the ACTUAL on-screen greeting.
  gameStartSec=Math.max(0,Math.floor((Date.now()-videoOrigin)/100)/10-.8);
  assert.equal(opening,'wave',name+': greeting did not actually start on game entry');
  const actor=page.locator('[data-troll-actor="storesoster"]');
  await actor.waitFor();
  assert.equal(await actor.getAttribute('data-troll-rig'),'source-bones-v2');
  await actor.locator('img.troll-actor__fallback').evaluate(img=>img.decode());
  const source=await actor.locator('img.troll-actor__fallback').getAttribute('src');
  assert.equal(source,'./assets/gangemagi-troll/storesoster.webp',
   'character image must remain the exact approved source');
  await shot(page,name+'-01-greeting');
  await visibleState(page,'idle');
  await shot(page,name+'-02-idle');
  await auditSourceArtwork(page,name);
  const movement=await actor.evaluate(node=>({
   head:getComputedStyle(node.querySelector('.troll-actor__head-rig')).animationName,
   hair:getComputedStyle(node.querySelector('.troll-actor__hair')).animationName,
   body:getComputedStyle(node.querySelector('.troll-actor__body-rig')).animationName,
   legs:getComputedStyle(node.querySelector('.troll-actor__legs')).animationName,
   blink:getComputedStyle(node.querySelector('.troll-actor__blink i')).animationName,
   arm:getComputedStyle(node.querySelector('.troll-actor__arm--left')).animationName
  }));
  assert.match(movement.head,/troll-idle-head/,name+' head is static during rest');
  assert.match(movement.hair,/troll-idle-hair/,name+' hair is static during rest');
  assert.match(movement.body,/troll-idle-body/,name+' torso is static during rest');
  assert.equal(movement.legs,'none',name+' feet must remain firmly planted');
  assert.match(movement.blink,/troll-blink/,name+' eyelids have no real animation');
  // Verify actual computed opacity at OPEN and CLOSED positions of the CSS
  // animation. This catches the old bug: animating a parent while its eyelid
  // children remained permanently opacity:0. No screenshot of a fake state.
  const blink=await actor.evaluate(async node=>{
   const lids=[...node.querySelectorAll('.troll-actor__blink i')];
   const animations=lids.map(lid=>lid.getAnimations().find(anim=>anim.animationName==='troll-blink'));
   if(animations.some(anim=>!anim))return {error:'no per-eye browser animations'};
   animations.forEach(anim=>{anim.pause();anim.currentTime=0;});
   await new Promise(requestAnimationFrame);
   const open=lids.map(lid=>Number(getComputedStyle(lid).opacity));
   animations.forEach(anim=>{anim.currentTime=630;});
   await new Promise(requestAnimationFrame);
   const closed=lids.map(lid=>Number(getComputedStyle(lid).opacity));
   return {open,closed};
  });
  assert.ok(!blink.error,name+' '+blink.error);
  assert.ok(blink.open.every(opacity=>opacity<.1),
   name+' the original eye pixels must remain visible at rest');
  assert.ok(blink.closed.every(opacity=>opacity>.7),
   name+' both eyelids must visibly close (not opacity:0)');
  await shot(page,name+'-02-eyelids-closed');
  await actor.evaluate(node=>node.querySelectorAll('.troll-actor__blink i').forEach(lid=>{
   const anim=lid.getAnimations().find(a=>a.animationName==='troll-blink');
   if(anim){anim.currentTime=0;anim.play();}
  }));
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
   const raw=path.join(out,name+'-real-gestures.webm');
   await video.saveAs(raw);
   // A short, browser-authentic clip is far easier to inspect than a video
   // dominated by 10-20 seconds of Home-loading on slower Safari/WebKit.
   const mp4=path.join(out,name+'-game-only.mp4');
   const ffmpeg=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y',
    '-ss',String(gameStartSec),'-i',raw,'-an','-c:v','libx264',
    '-preset','veryfast','-crf','21','-movflags','+faststart',mp4],
    {encoding:'utf8',timeout:120000});
   if(ffmpeg.status!==0){
    const reason=String(ffmpeg.stderr||ffmpeg.error||'').slice(-350);
    if(process.env.REQUIRE_TROLL_MP4==='1')
     throw Error('Required game-only MP4 evidence could not be created: '+reason);
    console.warn('Optional game-only MP4 conversion unavailable:',reason);
   }else{
    const stat=await fs.promises.stat(mp4);
    assert.ok(stat.size>10000,'Game-only MP4 must contain actual browser frames');
    console.log('RECORDED GAME-ONLY TROLL VIDEO',mp4,'from',gameStartSec,'seconds');
   }
   // The Playwright context also stores a randomly named original webm.
   // Remove only that duplicate; preserve named raw video and MP4 proof.
   try{
    const originalPath=await video.path();
    if(originalPath!==raw&&path.dirname(originalPath)===out)
     await fs.promises.unlink(originalPath);
   }catch(_){}
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
    armAnimation:css('.troll-actor__arm--left').animationName,
    blinkAnimation:css('.troll-actor__blink i').animationName,
    blinkOpacity:css('.troll-actor__blink i').opacity};
  });
  assert.equal(styles.fallbackOpacity,'1','reduced motion must display approved intact image');
  assert.equal(styles.rigDisplay,'none','reduced motion must disable the crop rig');
  assert.equal(styles.armAnimation,'none','reduced motion must not animate the arm');
  assert.equal(styles.blinkAnimation,'none','reduced motion must disable eye animation');
  assert.equal(styles.blinkOpacity,'0','reduced motion must show original eye pixels');
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
     ['iphone-landscape',{width:844,height:390}],
     ['ipad-portrait',{width:820,height:1180}],
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
