'use strict';
/* Phase A visual contract: Bokskogen is full-bleed on small phones while the
 * approved portrait artwork and its map coordinates remain untouched. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const out=process.env.LARIA_RESPONSIVE_PHASEA_IMAGES||'/tmp/laria-responsive-phasea';
const seed={
 version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'BokQA',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
 masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
 lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null
};
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json'};

function serve(){
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
  server.listen(0,'127.0.0.1',()=>resolve({server,url:'http://127.0.0.1:'+server.address().port+'/laer-litt-mer/?app=laria'}));
 });
}

async function proof(engine,label,viewport,url){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 let context;
 try{
  context=await browser.newContext({viewport,isMobile:true,hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block',reducedMotion:'reduce'});
  await context.addInitScript(value=>localStorage.setItem('laerlittmer-v2',JSON.stringify(value)),seed);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://raw.githubusercontent.com/**',route=>route.abort());
  await page.route('https://api.worldbank.org/**',route=>route.abort());
  await page.goto(url+'&responsive-phase-a='+label,{waitUntil:'domcontentloaded'});
  await page.locator('.bc14-subject[data-camp="subject-norwegian"]:visible').click();
  await page.locator('#eggenipa-world:visible').waitFor({timeout:16000});
  await page.locator('#eggenipa-world .eg-portal[data-eg="map"]').click();
  const screen=page.locator('#subject-screen.active');
  const map=screen.locator('.locked-journey-map[data-journey-subject="norwegian"]');
  await map.waitFor({state:'visible',timeout:30000});
  await page.waitForFunction(()=>{
   const image=document.querySelector('#subject-screen.active .locked-journey-image');
   return image?.complete&&image.naturalWidth===941&&image.naturalHeight===1672&&
     !document.querySelector('#subject-screen.active .locked-journey-art-guard');
  },{timeout:30000});
  // The legacy journey intentionally scrolls to the current stop on short
  // landscape screens. Wait for that behavior instead of asserting that a
  // correctly focused illustrated map must be at scrollY=0.
  await page.waitForFunction(()=>{
   const stop=document.querySelector('#subject-screen.active .locked-journey-hotspot.state-current');
   if(!stop)return false;
   const r=stop.getBoundingClientRect();
   return r.top>=-1&&r.bottom<=innerHeight+1;
  },null,{timeout:12000});
  const geometry=await page.evaluate(()=>{
   const screen=document.querySelector('#subject-screen.active');
   const app=document.querySelector('.app');
   const journeySection=document.querySelector('#subject-screen.active>#subject-journey-section');
   const map=document.querySelector('#subject-screen.active .locked-journey-map');
   const board=document.querySelector('#subject-screen.active .locked-journey-board');
   const image=document.querySelector('#subject-screen.active .locked-journey-image');
   const sb=screen.getBoundingClientRect(),bb=board.getBoundingClientRect(),ib=image.getBoundingClientRect();
   const style=getComputedStyle(screen),journeyStyle=getComputedStyle(journeySection),mapStyle=getComputedStyle(map),appStyle=getComputedStyle(app),boardStyle=getComputedStyle(board);
   const stop=screen.querySelector('.locked-journey-hotspot.state-current')?.getBoundingClientRect();
   return {scrollY:window.scrollY,
    currentStop:stop?{top:stop.top,bottom:stop.bottom}:null,viewport:innerHeight,
    screen:{top:sb.top,height:sb.height},board:{top:bb.top,width:bb.width,height:bb.height},
    imageRatio:ib.width/ib.height,boardRatio:bb.width/bb.height,appPaddingBottom:appStyle.paddingBottom,
    screenBackground:style.backgroundImage,journeyBackground:journeyStyle.backgroundImage,appBackground:appStyle.backgroundImage,borderRadius:boardStyle.borderTopLeftRadius,
    journey:{display:journeyStyle.display,marginTop:journeyStyle.marginTop,paddingTop:journeyStyle.paddingTop,gap:journeyStyle.gap},
    map:{display:mapStyle.display,marginTop:mapStyle.marginTop,paddingTop:mapStyle.paddingTop},
    visibleChildren:[...screen.children].filter(node=>getComputedStyle(node).display!=='none').map(node=>({id:node.id,className:node.className,top:node.getBoundingClientRect().top,height:node.getBoundingClientRect().height})),
    overflow:document.documentElement.scrollWidth-innerWidth,
    hotspots:[...document.querySelectorAll('#subject-screen.active .locked-journey-hotspot')].map(node=>{
     const r=node.getBoundingClientRect();return {w:r.width,h:r.height};
    })};
  });
  assert.ok(Math.abs(geometry.screen.top+geometry.scrollY)<=2,
   label+' journey is offset in document layout (not a current-stop focus): '+JSON.stringify(geometry));
  assert.ok(geometry.currentStop&&geometry.currentStop.top>=-1&&geometry.currentStop.bottom<=geometry.viewport+1,
   label+' current illustrated stop is outside the screen: '+JSON.stringify(geometry));
  if(viewport.height>=viewport.width)
   assert.ok(Math.abs(geometry.screen.top)<=1,
    label+' portrait journey unexpectedly begins below the viewport: '+JSON.stringify(geometry));
  // WebKit can resolve 100dvh a fraction below the integer viewport after
  // device-scale rounding (for example 843.984375px for an 844px viewport).
  // One CSS pixel is below visual precision and avoids treating that rounding
  // as the white-stage regression this contract guards against.
  assert.ok(geometry.screen.height>=viewport.height-1,label+' stage must cover the entire viewport '+JSON.stringify(geometry));
  assert.equal(geometry.appPaddingBottom,'0px',label+' obsolete app nav spacing leaked below the map');
  assert.ok(await screen.evaluate(node=>node.classList.contains('locked-journey-subject-norwegian')),
    label+' Bokskogen stage context is missing');
  assert.match(geometry.journeyBackground,/bokskogen-reference-bg/,label+' empty stage lost Bokskogen atmosphere');
  assert.equal(geometry.borderRadius,'0px',label+' map edge introduced a pale rounded seam');
  assert.ok(Math.abs(geometry.boardRatio-941/1672)<.003&&Math.abs(geometry.imageRatio-941/1672)<.003,
    label+' approved map was stretched or cropped '+JSON.stringify(geometry));
  assert.ok(Math.abs(geometry.board.top-geometry.screen.top)<=1,
   label+' map has blank header space before the painted board '+JSON.stringify(geometry));
  assert.ok(geometry.overflow<=1,label+' horizontal overflow '+JSON.stringify(geometry));
  assert.equal(geometry.hotspots.length,5,label+' mission locations changed');
  assert.ok(geometry.hotspots.every(hit=>hit.w>=44&&hit.h>=44),label+' a map touch target fell below 44px');
  assert.equal(await screen.locator('.locked-journey-traveler[data-avatar="girl"]').count(),1,label+' selected fox is missing');
  await fs.promises.mkdir(out,{recursive:true});
  await page.screenshot({path:path.join(out,label+'-bokskogen-after.png'),animations:'disabled'});
  assert.deepEqual(errors,[],label+' page errors '+JSON.stringify(errors));
  console.log('PASS '+label+' Bokskogen full-bleed stage, original art, fox, hotspots and no horizontal overflow');
 }finally{if(context)await context.close();await browser.close();}
}

(async()=>{
 const {server,url}=await serve();
 try{
  await proof(chromium,'chromium-iphone-390x844',{width:390,height:844},url);
  for(const [label,viewport] of [
   ['webkit-iphone-320x568',{width:320,height:568}],
   ['webkit-iphone-375x667',{width:375,height:667}],
   ['webkit-iphone-390x844',{width:390,height:844}],
   ['webkit-iphone-430x932',{width:430,height:932}],
   ['webkit-iphone-landscape-844x390',{width:844,height:390}]
  ])await proof(webkit,label,viewport,url);
 }finally{await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1});
