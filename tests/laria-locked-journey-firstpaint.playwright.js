'use strict';
/* WebKit/Chromium first-paint contract for the original October 10 journeys.
 * Force slow artwork fetches: no retired green map or dark empty board may
 * appear between Home and the approved locked paintings. */
// Playwright/WebKit's screenshotter can wait indefinitely for font readiness
// while our deliberately held PNG requests are pending. Screenshots must still
// capture the real unblocked DOM/pixels, not wait for unrelated font promises.
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'..');
const out=process.env.LARIA_JOURNEY_FIRSTPAINT_IMAGES||'/tmp/laria-journey-firstpaint';
const subjects=['norwegian','math','english','geography'];
const seed={
 version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'KartQA',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
 masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
 lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null
};
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp',
 '.svg':'image/svg+xml','.json':'application/json'};
async function serve(){
 return new Promise((resolve,reject)=>{
  const server=http.createServer((req,res)=>{
   let file=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   if(file.endsWith('/'))file+='index.html';
   file=path.resolve(root,'.'+file);
   if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
   fs.readFile(file,(error,data)=>{
    if(error){res.writeHead(404);res.end('Missing');return;}
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
    res.setHeader('Cache-Control','no-store');res.end(data);
   });
  });
  server.once('error',reject);
  server.listen(0,'127.0.0.1',()=>{
   resolve({server,url:'http://127.0.0.1:'+server.address().port+'/laer-litt-mer/?app=laria'});
  });
 });
}
async function shot(page,name){
 await fs.promises.mkdir(out,{recursive:true});
 await page.screenshot({path:path.join(out,name+'.png'),animations:'disabled'});
}
async function contextFor(browser,viewport){
 const ctx=await browser.newContext({viewport,deviceScaleFactor:1,
  isMobile:viewport.width<=900,hasTouch:true,serviceWorkers:'block',
  reducedMotion:'reduce'});
 await ctx.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed);
 return ctx;
}
async function navigateTo(page,subject){
 await page.locator('.bc14-subject[data-camp="subject-'+subject+'"]:visible').click();
 const screen=subject==='geography'?'geography':'subject';
 await page.locator('#'+screen+'-screen.active').waitFor();
 return page.locator('#'+screen+'-screen.active');
}
// The original Geografi HTML places its two legacy cards ahead of the journey.
// While the full PNG is deliberately held, the *waiting scene* must already
// be the first child-facing geography content. The decoded state must keep it.
async function assertGeographyPriority(screen,label){
 const geometry=await screen.evaluate(root=>{
  const shell=root.querySelector('#geo-journey-shell');
  const originalGlobeCard=root.querySelector('#open-world');
  const recommendation=root.querySelector('.geography-continue');
  const map=root.querySelector('#geo-journey-map');
  const top=el=>el?Math.round(el.getBoundingClientRect().top):-999;
  return {
   ahead:!!shell&&!!originalGlobeCard&&!!recommendation&&
    Boolean(shell.compareDocumentPosition(originalGlobeCard)&Node.DOCUMENT_POSITION_FOLLOWING)&&
    Boolean(shell.compareDocumentPosition(recommendation)&Node.DOCUMENT_POSITION_FOLLOWING),
   journeyTop:top(shell),mapTop:top(map),
   legacyGlobeTop:top(originalGlobeCard),legacyRecommendationTop:top(recommendation)
  };
 });
 assert.ok(geometry.ahead&&geometry.mapTop<=geometry.legacyGlobeTop,
  label+' legacy geography cards preceded Nordlysleiren during loading: '+JSON.stringify(geometry));
}
async function proof(engine,label,viewport,url){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 let ctx;
 try{
  ctx=await contextFor(browser,viewport);
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  // Every approved PNG remains unavailable until the child has seen the
  // intended premium loading cover. This also catches prefetch-on-boot.
  const held={};
  for(const subject of subjects){
   held[subject]={};
   held[subject].ready=new Promise(resolve=>held[subject].release=resolve);
  }
  await page.route('**/locked-journeys/*-locked-20261010.png',async route=>{
   const match=/\/(bokskogen|tallenga|ordlandsbyen|nordlysleiren)-locked-20261010\.png/.exec(route.request().url());
   const key={bokskogen:'norwegian',tallenga:'math',ordlandsbyen:'english',nordlysleiren:'geography'}[match?.[1]];
   if(key)await held[key].ready;
   await route.continue();
  });
  await page.goto(url+'&firstpaint='+label,{waitUntil:'domcontentloaded'});
  await page.locator('#home-screen.active .bc14-subject[data-camp="subject-math"]').waitFor();
  for(const subject of subjects){
   const screen=await navigateTo(page,subject);
   const pending=screen.locator('.locked-journey-waiting-stage');
   await pending.waitFor({state:'visible',timeout:16000});
   assert.equal(await screen.locator('.locked-journey-image').count(),0,
     label+' '+subject+' exposed original image before decode');
   assert.equal(await screen.locator('.premium-journey-map,.bok-v10-map,.premium-world').count(),0,
     label+' '+subject+' flashed a retired renderer while the original was pending');
   const box=await pending.locator('.locked-journey-art-card').boundingBox();
   assert(box&&box.y<viewport.height&&box.y+box.height>0,
     label+' '+subject+' premium transition cover is offscreen: '+JSON.stringify(box));
   assert.ok(await pending.locator('img[src*="/cards/reisen/"]').count(),
     label+' '+subject+' approved preview missing');
   if(subject==='geography')await assertGeographyPriority(screen,label+' pending artwork');
   // The approved card artwork is a separate 80-110KB resource. Decode it
   // for a deterministic visual frame while the multi-MB original remains held.
   await pending.locator('.locked-journey-art-card img').evaluate(img=>img.decode());
   await shot(page,label+'-'+subject+'-01-waiting');
   held[subject].release();
   await screen.locator('.locked-journey-image').waitFor({state:'attached',timeout:30000});
   await page.waitForFunction(s=>{
    const image=document.querySelector('.screen.active .locked-journey-image');
    const board=document.querySelector('.screen.active .locked-journey-map');
    return board?.dataset.journeySubject===s&&image?.complete&&
      image.naturalWidth===941&&image.naturalHeight===1672&&
      !board.querySelector('.locked-journey-art-guard');
   },subject,{timeout:30000});
   assert.equal(await screen.locator('.locked-journey-hotspot').count(),5,
     label+' '+subject+' original five hotspots missing');
   // The old renderer used to initialize these hidden-but-persistent grade
   // controls. The exact art must now initialize them without legacy flicker.
   const gradeStrip=subject==='geography'?'#geo-journey-grade-strip':'#journey-grade-strip';
   assert.equal(await screen.locator(gradeStrip+' [data-journey-grade]').count(),10,
     label+' '+subject+' chapter grade selector was not initialized');
   const key={norwegian:'storesoster',math:'lillebror',english:'lillesoster',geography:'storesoster'}[subject];
   const companion=screen.locator('.locked-journey-traveler.laria-troll-host[data-laria-troll="'+key+'"]');
   assert.equal(await companion.count(),1,label+' '+subject+' approved original skogstroll lost during transition');
   const companionImg=companion.locator(':scope > img');
   await companionImg.evaluate(img=>img.decode());
   assert((await companionImg.getAttribute('src')).endsWith('/assets/skogstroll/'+key+'.webp'),
     label+' '+subject+' first painting displayed wrong approved character');
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2')).profile.avatar),'girl',
     label+' '+subject+' character art must never rewrite saved profile');
   if(subject==='geography')await assertGeographyPriority(screen,label+' decoded artwork');
   await shot(page,label+'-'+subject+'-02-approved-map');
   await screen.locator('.locked-journey-back').click();
   await page.locator('#home-screen.active .bc14-subject[data-camp="subject-'+subject+'"]').waitFor();
  }
  assert.deepEqual(errors,[],label+' unhandled script errors');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2')).profile.avatar),'girl');
  console.log('PASS '+label+' four original journeys; slow PNG, no legacy flash, full decoded images, navigation/identity');
 }finally{if(ctx)await ctx.close();await browser.close();}
}
async function missingArtRecovery(url){
 const browser=await webkit.launch({headless:true});
 let ctx;
 try{
  ctx=await contextFor(browser,{width:390,height:844});
  const page=await ctx.newPage();
  const pattern='**/locked-journeys/tallenga-locked-20261010.png';
  await page.route(pattern,route=>route.abort());
  await page.goto(url+'&missing-art=webkit',{waitUntil:'domcontentloaded'});
  await page.locator('#home-screen.active .bc14-subject[data-camp="subject-math"]').waitFor();
  const screen=await navigateTo(page,'math');
  await screen.locator('.locked-journey-art-retry').waitFor({timeout:16000});
  assert.equal(await screen.locator('.premium-journey-map,.bok-v10-map').count(),0,
   'Failed artwork silently exposed the retired map');
  assert.equal(await screen.locator('.locked-journey-image').count(),0,
   'Failed original image attempted to display as dark empty art');
  await shot(page,'webkit-iphone-missing-art-retry');
  await page.unroute(pattern);
  await screen.locator('.locked-journey-art-retry').click();
  await page.waitForFunction(()=>{
   const image=document.querySelector('#subject-screen.active .locked-journey-image');
   return image?.naturalWidth===941&&image.complete&&
      !document.querySelector('#subject-screen.active .locked-journey-art-guard');
  },{},{timeout:30000});
  await screen.locator('.locked-journey-back').click();
  await page.locator('#home-screen.active').waitFor();
  console.log('PASS WebKit missing original artwork: clear retry, no old renderer, correct recovery');
 }finally{if(ctx)await ctx.close();await browser.close();}
}
(async()=>{
 const {server,url}=await serve();
 try{
  await proof(chromium,'chromium-iphone',{width:390,height:844},url);
  await proof(webkit,'webkit-tiny',{width:320,height:568},url);
  await proof(webkit,'webkit-iphone',{width:390,height:844},url);
  await proof(webkit,'webkit-ipad-landscape',{width:1180,height:820},url);
  await missingArtRecovery(url);
 }finally{await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1});
