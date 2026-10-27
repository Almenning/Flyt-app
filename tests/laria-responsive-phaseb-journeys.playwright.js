'use strict';
/* Læria responsive phase B: the remaining active exact portrait map on tablet/desktop.
 * Eggenipa, Tallvika and Kinnaklova now own their own responsive presentation.
 * This gate keeps Nordlysleiren's real original PNG full-width and undistorted. */
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {webkit,chromium}=require('playwright');

const root=path.resolve(__dirname,'..');
const out=process.env.LARIA_RESPONSIVE_PHASEB_IMAGES||'/tmp/laria-responsive-phaseb';
const subjects=['geography'];
const seed={
 version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'ResponsiveQA',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
 masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
 lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null
};
const mime={
 '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8',
 '.js':'application/javascript; charset=utf-8','.png':'image/png',
 '.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml',
 '.json':'application/json'
};
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
    res.setHeader('Cache-Control','no-store');
    res.end(data);
   });
  });
  server.once('error',reject);
  server.listen(0,'127.0.0.1',()=>resolve({
   server,url:'http://127.0.0.1:'+server.address().port+'/laer-litt-mer/?app=laria'
  }));
 });
}
async function visit(page,subject){
 await page.locator('.bc14-subject[data-camp="subject-'+subject+'"]:visible').click();
 const screen=subject==='geography'?'geography':'subject';
 await page.locator('#'+screen+'-screen.active.locked-journey-active').waitFor({timeout:16000});
 await page.waitForFunction(s=>{
  const active=document.querySelector('.screen.active.locked-journey-active');
  const map=active?.querySelector('.locked-journey-map');
  const image=map?.querySelector('.locked-journey-image');
  return map?.dataset.journeySubject===s&&image?.complete&&
   image.naturalWidth===941&&image.naturalHeight===1672&&
   !map.querySelector('.locked-journey-art-guard');
 },subject,{timeout:30000});
 return page.locator('#'+screen+'-screen.active.locked-journey-active');
}
function near(a,b,epsilon){return Math.abs(a-b)<=epsilon;}
async function validateStage(page,subject,label,viewport,screen){
 const data=await page.evaluate(()=>{
  const active=document.querySelector('.screen.active.locked-journey-active');
  const app=document.querySelector('.app'),map=active.querySelector('.locked-journey-map');
  const board=map.querySelector('.locked-journey-board');
  const image=board.querySelector('.locked-journey-image');
  const rect=node=>{const r=node.getBoundingClientRect();return {
   x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom
  };};
  const imgBox=rect(image),boardBox=rect(board);
  const markers=[...map.querySelectorAll('.locked-journey-hotspot')];
  const box=rect(app),appStyle=getComputedStyle(app);
  const visibleOutside=[...active.children]
   .filter(el=>!el.contains(map)&&getComputedStyle(el).display!=='none')
   .map(el=>({id:el.id,display:getComputedStyle(el).display,
     top:el.getBoundingClientRect().top}));
  return {
   viewport:{w:innerWidth,h:innerHeight},
   app:box,appPaddingBottom:appStyle.paddingBottom,
   appBackground:appStyle.backgroundImage,appBgColor:appStyle.backgroundColor,
   screen:rect(active),map:rect(map),board:boardBox,image:imgBox,
   imageNatural:[image.naturalWidth,image.naturalHeight],
   imageFit:getComputedStyle(image).objectFit,
   bodyContext:document.body.className,
   visibleOutside,activeSubject:map.dataset.journeySubject,
   originalMarkup:map.dataset.lockedIllustration,
   companionCount:map.querySelectorAll('.locked-journey-traveler[data-troll="storesoster"]').length,
   retiredFoxCount:map.querySelectorAll('.locked-journey-traveler[data-avatar]').length,
   hotspots:markers.map(node=>rect(node)),hotspotLabels:markers.map(node=>node.getAttribute('aria-label')),
   horizontalOverflow:document.documentElement.scrollWidth-innerWidth,
   pageScrollHeight:document.documentElement.scrollHeight
  };
 });
 const width=viewport.width,height=viewport.height;
 assert(near(data.viewport.w,width,1)&&near(data.viewport.h,height,1),label+' viewport mismatched '+JSON.stringify(data.viewport));
 assert(data.app.w>=width-2&&data.screen.w>=width-2,label+' old 480px shell is still active '+JSON.stringify(data));
 assert(data.appPaddingBottom==='0px',label+' old bottom-nav padding was exposed');
 assert(data.appBackground.includes(subject+'-premium.webp'),label+' missing matching approved landscape atmosphere '+data.appBackground);
 assert(data.originalMarkup==='2026-10-10'&&data.activeSubject===subject,label+' wrong approved map');
 assert.deepEqual(data.imageNatural,[941,1672],label+' original map missing');
 assert(data.imageFit==='contain',label+' art was cropped');
 assert(near(data.board.w/data.board.h,941/1672,.002),label+' board aspect warped');
 assert(near(data.image.w/data.image.h,941/1672,.002),label+' original image aspect warped');
 assert(near(data.image.w,data.board.w,2)&&near(data.image.h,data.board.h,2),label+' source is not registered to board');
 assert(near(data.board.x+data.board.w/2,width/2,4),label+' map is not centered '+JSON.stringify(data.board));
 assert(data.board.w>=viewport.minimumWidth,label+' map is too small for the screen '+JSON.stringify(data.board));
 assert(data.board.right<=width+1&&data.board.x>=-1,label+' map is clipped horizontally');
 assert(data.horizontalOverflow<=2,label+' document has horizontal overflow '+data.horizontalOverflow);
 assert.equal(data.hotspots.length,5,label+' lost mapped landmarks');
 assert.equal(data.companionCount,1,label+' chosen forest troll is missing or duplicated');
 assert.equal(data.retiredFoxCount,0,label+' retired fox traveler returned');
 assert(data.hotspotLabels.every(s=>s&&s.includes('Sted ')),label+' landmark accessible names missing');
 assert(data.hotspots.every(hit=>hit.w>=44&&hit.h>=44&&hit.x>=data.board.x-2&&
   hit.right<=data.board.right+2&&hit.y>=data.board.y-2&&hit.bottom<=data.board.bottom+2),
  label+' tap rectangles moved outside painted map '+JSON.stringify(data.hotspots));
 if(width>height)assert(data.pageScrollHeight>height+200,
  label+' portrait map was squeezed into landscape instead of allowing native scroll');
 if(subject!=='geography'){
  assert.equal(data.visibleOutside.length,0,label+' retired subject dashboard appeared before/after art: '+JSON.stringify(data.visibleOutside));
 }else{
  const position=await screen.evaluate(root=>{
   const shell=root.querySelector('#geo-journey-shell');
   const old=root.querySelector('#open-world');
   return {first:root.firstElementChild===shell,
    above:shell?.compareDocumentPosition(old)&Node.DOCUMENT_POSITION_FOLLOWING,
    shellTop:shell?.getBoundingClientRect().top,oldTop:old?.getBoundingClientRect().top};
  });
  assert(position.above&&position.oldTop>=position.shellTop,label+' older geography card came before Nordlysleiren '+JSON.stringify(position));
 }
 await fs.promises.mkdir(out,{recursive:true});
 fs.writeFileSync(path.join(out,label+'-'+subject+'-geometry.json'),JSON.stringify(data,null,2));
 // Review the TOP frame and the current stop separately; neither is a mock.
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:path.join(out,label+'-'+subject+'-top.png'),animations:'disabled',timeout:15000});
 return data;
}
async function verifyTapAndBack(page,screen,subject,label){
 const current=screen.locator('.locked-journey-hotspot.state-current').first();
 const hit=await current.boundingBox();
 assert(hit&&hit.width>=44&&hit.height>=44,label+' no current destination');
 await current.scrollIntoViewIfNeeded();
 const box=await current.boundingBox();
 assert(box&&box.y>=-1&&box.y+box.height<=await page.evaluate(()=>innerHeight)+1,
  label+' current destination not reachable by vertical scroll');
 await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
 const overlay=page.locator('.locked-journey-overlay:not([hidden])');
 await overlay.waitFor({timeout:8000});
 assert(await overlay.locator('.locked-journey-sheet h2').count()>0,
  label+' destination opened no readable mission');
 await overlay.locator('.locked-sheet-close').click();
 await screen.locator('.locked-journey-back').scrollIntoViewIfNeeded();
 await screen.locator('.locked-journey-back').click();
 await page.locator('#home-screen.active .bc14-subject').first().waitFor({timeout:12000});
 // A hidden journey may retain its subject marker while background preloading
 // settles. Only the ACTIVE screen may own the scenic full-width stage.
 const restored=await page.evaluate(()=>{
  const app=document.querySelector('.app');
  return {home:!!document.querySelector('#home-screen.active'),
   activeJourney:!!document.querySelector('.screen.active.locked-journey-active'),
   background:getComputedStyle(app).backgroundImage};
 });
 assert(restored.home&&!restored.activeJourney&&!restored.background.includes(subject+'-premium.webp'),
  label+' journey scenery visually leaked into Basecamp '+JSON.stringify(restored));
}
async function protectPhaseACompactPhone(url){
 const browser=await webkit.launch({headless:true});
 let context;
 try{
  context=await browser.newContext({viewport:{width:844,height:390},
   hasTouch:true,isMobile:true,deviceScaleFactor:1,serviceWorkers:'block'});
  await context.addInitScript(value=>localStorage.setItem('laerlittmer-v2',JSON.stringify(value)),seed);
  const page=await context.newPage();
  await page.goto(url+'&phaseb-iphone-landscape-guard=1',{waitUntil:'domcontentloaded'});
  const screen=await visit(page,'norwegian');
  const phone=await page.evaluate(()=>{
   const stage=document.querySelector('#subject-screen.active.locked-journey-active');
   const section=stage.querySelector('#subject-journey-section');
   const app=document.querySelector('.app');
   const board=stage.querySelector('.locked-journey-board').getBoundingClientRect();
   // Phase A paints the phone atmosphere on the journey section; the outer
   // screen itself may be transparent by design.
   return {backdrop:getComputedStyle(section).backgroundImage,
    appBackdrop:getComputedStyle(app).backgroundImage,
    ratio:board.width/board.height,
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  assert(phone.backdrop.includes('bokskogen-reference-bg.webp'),
   'Phase A compact-landscape story background was replaced '+JSON.stringify(phone));
  assert(!phone.appBackdrop.includes('norwegian-premium.webp'),
   'Phase B tablet scenery accidentally styled a landscape phone');
  assert(near(phone.ratio,941/1672,.002)&&phone.overflow<=2,
   'iPhone landscape artwork geometry changed '+JSON.stringify(phone));
  await page.evaluate(()=>window.scrollTo(0,0));
  await fs.promises.mkdir(out,{recursive:true});
  await page.screenshot({path:path.join(out,'webkit-iphone-landscape-phasea-preserved.png'),
   animations:'disabled',timeout:15000});
  await screen.locator('.locked-journey-back').scrollIntoViewIfNeeded();
  await screen.locator('.locked-journey-back').click();
  await page.locator('#home-screen.active').waitFor({timeout:12000});
  console.log('PASS WebKit iPhone landscape remains on the approved phase A stage');
 }finally{if(context)await context.close();await browser.close();}
}
async function run(engine,label,viewport,url){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 let context;
 try{
  context=await browser.newContext({
   viewport:{width:viewport.width,height:viewport.height},
   isMobile:viewport.tablet,hasTouch:true,deviceScaleFactor:1,
   serviceWorkers:'block',reducedMotion:'reduce'
  });
  await context.addInitScript(value=>localStorage.setItem('laerlittmer-v2',JSON.stringify(value)),seed);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://raw.githubusercontent.com/**',route=>route.abort());
  await page.route('https://api.worldbank.org/**',route=>route.abort());
  await page.goto(url+'&responsive-phaseb='+label,{waitUntil:'domcontentloaded'});
  await page.locator('.bc14-subject[data-camp="subject-geography"]:visible').waitFor({timeout:16000});
  for(const subject of subjects){
   const screen=await visit(page,subject);
   await validateStage(page,subject,label,viewport,screen);
   if(label==='webkit-ipad-landscape'||label==='chromium-ipad-landscape'){
    await verifyTapAndBack(page,screen,subject,label);
   }else{
    await screen.locator('.locked-journey-back').scrollIntoViewIfNeeded();
    await screen.locator('.locked-journey-back').click();
    await page.locator('#home-screen.active').waitFor({timeout:12000});
   }
  }
  assert.deepEqual(errors,[],label+' uncaught script errors');
  console.log('PASS '+label+' Nordlysleiren: full-width scenic stage, no distortion, correct taps/troll, preserved return');
 }finally{if(context)await context.close();await browser.close();}
}
(async()=>{
 const {server,url}=await serve();
 try{
  // Compact phone protection is owned by the dedicated phase C3 workflow.
  await run(webkit,'webkit-ipad-portrait',{width:820,height:1180,tablet:true,minimumWidth:720},url);
  await run(webkit,'webkit-ipad-landscape',{width:1180,height:820,tablet:true,minimumWidth:800},url);
  await run(webkit,'webkit-small-ipad-landscape',{width:1024,height:768,tablet:true,minimumWidth:700},url);
  await run(chromium,'chromium-ipad-landscape',{width:1180,height:820,tablet:true,minimumWidth:800},url);
  await run(webkit,'webkit-mac',{width:1440,height:900,tablet:false,minimumWidth:800},url);
  await run(chromium,'chromium-mac',{width:1440,height:900,tablet:false,minimumWidth:800},url);
 }finally{await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1});
