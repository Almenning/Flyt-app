'use strict';
/* Screenshots are real Playwright browser captures, not concept illustrations.
   The ordinary globe is the control and must never use the preview renderer. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const crypto=require('node:crypto');
const {webkit,chromium}=require('playwright');
const root=path.resolve(__dirname,'..','laer-litt-mer');
const out=process.env.DISCOVERY_GLOBE_SCREENSHOTS||path.resolve('/tmp/laria-discovery-globe-phase1');
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json'};
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'GlobeQA',avatar:'girl',setupVersion:2},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
const poses=[
  {name:'world',lon:15,lat:18,zoom:1,country:'no',level:'1'},
  {name:'europe',lon:15,lat:50,zoom:2.1,country:'fr',level:'2'},
  {name:'norway',lon:8,lat:62,zoom:3.5,country:'no',level:'3'},
  {name:'japan',lon:138,lat:36,zoom:3.6,country:'jp',level:'3'},
  {name:'brazil',lon:-55,lat:-12,zoom:3.2,country:'br',level:'3'}
];
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
async function serve(){
 const server=http.createServer((req,res)=>{
   const part=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   const file=path.resolve(root,'.'+(part==='/'?'/index.html':part));
   if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
   fs.readFile(file,(err,data)=>{
     if(err){res.writeHead(404);return res.end();}
     res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
     res.setHeader('Cache-Control','no-store');res.end(data);
   });
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port+'/?app=laria';
 return {server,base,preview:base+'&discovery-globe-preview=1'};
}
async function openPage(browser,url,viewport,errors){
 const ctx=await browser.newContext({viewport,isMobile:viewport.width<600,hasTouch:true,serviceWorkers:'block',deviceScaleFactor:1});
 const page=await ctx.newPage();
 page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(value=>localStorage.setItem('laerlittmer-v2',JSON.stringify(value)),seed);
 await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
 await page.route('https://api.worldbank.org/**',r=>r.abort());
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>typeof openGlobe==='function');
 await page.evaluate(()=>openGlobe('classic'));
 await page.waitForFunction(()=>document.getElementById('world-screen')?.classList.contains('active')&&document.getElementById('globe-canvas')?._cssW>0,{timeout:15000});
 return {ctx,page};
}
async function drawPose(page,pose){
 await page.evaluate(({lon,lat,zoom,country})=>{
   window.__lariaGlobeInteracting=false;
   if(typeof globePointers!=='undefined')globePointers.clear();
   globeLon=lon;globeLat=lat;globeSelected=null;
   setGlobeZoom(zoom);
   selectGlobeCountry(country);
   drawGlobe();
 },pose);
 await page.waitForTimeout(260);
 return page.evaluate(()=>{
   const canvas=document.getElementById('globe-canvas');
   return {
     pixels:canvas.toDataURL('image/png'),
     renderer:window.drawGlobe===window.LARIA_DISCOVERY_GLOBE_DRAW,
     level:document.getElementById('world-screen').dataset.discoveryGlobeLevel,
     discovery:document.getElementById('world-screen').dataset.discoveryGlobe,
     moving:canvas.dataset.discoveryMoving,
     illustrations:Number(canvas.dataset.discoveryLandmarks||0),
     selected:globeSelected,
     dimensions:[canvas._cssW,canvas._cssH],
     zoom:globeZoom
   };
 });
}
async function verifyGeographicTap(page,lon,lat,expected,label){
 const result=await page.evaluate(({lon,lat})=>{
   globeLon=lon;globeLat=lat;globeSelected=null;setGlobeZoom(3.5);
   const canvas=document.getElementById('globe-canvas'),p=globeProject(lon,lat,canvas._cssW,canvas._cssH);
   const roundtrip=globeInverse(p[0],p[1]);
   const rect=canvas.getBoundingClientRect();
   pickGlobeCountry({clientX:rect.left+p[0],clientY:rect.top+p[1]});
   return {country:globeSelected,roundtrip};
 },{lon,lat});
 assert.equal(result.country,expected,label+' geographic tap did not select '+expected);
 assert.ok(Math.abs(result.roundtrip.lon-lon)<.001&&Math.abs(result.roundtrip.lat-lat)<.001,label+' longitude/latitude projection lost accuracy');
}
async function verifyPointerDrag(page,label,isDiscovery){
 await page.evaluate(()=>{
   globeLon=18;globeLat=36;globeSelected=null;setGlobeZoom(2.2);
   if(typeof globePointers!=='undefined')globePointers.clear();
   window.__lariaGlobeInteracting=false;
   const canvas=document.getElementById('globe-canvas'),rect=canvas.getBoundingClientRect();
   const x=rect.left+rect.width*.50,y=rect.top+rect.height*.50;
   canvas.dataset.dragStartLon=String(globeLon);
   const evt=(type,cx,cy)=>new PointerEvent(type,{pointerId:831,pointerType:'touch',isPrimary:true,bubbles:true,clientX:cx,clientY:cy});
   canvas.dispatchEvent(evt('pointerdown',x,y));
   canvas.dispatchEvent(evt('pointermove',x+52,y+12));
   canvas.dataset.dragMovedLon=String(globeLon);
 });
 await page.waitForTimeout(120);
 const during=await page.evaluate(()=>({
   moving:window.__lariaGlobeInteracting,
   pointerCount:globePointers.size,
   marked:document.getElementById('globe-canvas').dataset.discoveryMoving,
   before:Number(document.getElementById('globe-canvas').dataset.dragStartLon),
   after:Number(document.getElementById('globe-canvas').dataset.dragMovedLon)
 }));
 assert.ok(Math.abs(during.after-during.before)>1,label+' pointer drag did not rotate the globe');
 assert.equal(during.moving,true,label+' dragging state never activated');
 assert.equal(during.pointerCount,1,label+' active pointer was lost');
 if(isDiscovery){
   assert.equal(during.marked,'true',label+' discovery detail not suppressed while dragging');
   await page.screenshot({path:path.join(out,label.replace(/[^a-z0-9-]/gi,'-')+'-moving.png'),fullPage:true,animations:'disabled'});
 }
 await page.evaluate(()=>{
   const canvas=document.getElementById('globe-canvas'),rect=canvas.getBoundingClientRect();
   const x=rect.left+rect.width*.50,y=rect.top+rect.height*.50;
   canvas.dispatchEvent(new PointerEvent('pointerup',{pointerId:831,pointerType:'touch',isPrimary:true,bubbles:true,clientX:x+52,clientY:y+12}));
 });
 await page.waitForTimeout(160);
 const after=await page.evaluate(()=>({
   moving:window.__lariaGlobeInteracting,
   pointerCount:globePointers.size,
   marked:document.getElementById('globe-canvas').dataset.discoveryMoving,
   illustrations:Number(document.getElementById('globe-canvas').dataset.discoveryLandmarks||0)
 }));
 assert.equal(after.moving,false,label+' pointer movement flag remained set after release');
 assert.equal(after.pointerCount,0,label+' pointer not released');
 if(isDiscovery){
   assert.equal(after.marked,'false',label+' high detail did not return after pointer release');
   assert.ok(after.illustrations>0,label+' geography illustration missing after pointer release');
 }
}

async function runDevice(engine,label,viewport,urls){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 try{
   const refErrors=[];
   const standard=await openPage(browser,urls.base,viewport,refErrors);
   const refs={};
   try{
     for(const pose of poses){
       const result=await drawPose(standard.page,pose);
       assert.equal(result.discovery,undefined,label+' ordinary globe unexpectedly uses discovery mode');
       assert.notEqual(result.renderer,true,label+' preview leaked into ordinary globe');
       assert.equal(result.selected,pose.country,label+' standard globe country selection changed');
       refs[pose.name]=hash(result.pixels);
       if(pose.name==='world'||pose.name==='norway')
         await standard.page.screenshot({path:path.join(out,label+'-simple-'+pose.name+'.png'),fullPage:viewport.height<500,animations:'disabled'});
     }
     for(const hit of [[8,62,'no'],[138,36,'jp'],[-55,-12,'br']])
       await verifyGeographicTap(standard.page,hit[0],hit[1],hit[2],label+' ordinary globe');
     await verifyPointerDrag(standard.page,label+' ordinary globe',false);
     assert.deepEqual(refErrors,[],label+' ordinary globe errors');
   }finally{await standard.ctx.close();}
   const errors=[];
   const discovery=await openPage(browser,urls.preview,viewport,errors);
   try{
     try{
       await discovery.page.waitForFunction(()=>window.drawGlobe===window.LARIA_DISCOVERY_GLOBE_DRAW&&document.getElementById('globe-canvas')?.dataset.discoveryRenderer==='live',null,{timeout:12000});
     }catch(error){
       const diagnostic=await discovery.page.evaluate(()=>({
         previewEnabled:window.__lariaDiscoveryGlobePreview,
         startupError:window.__lariaDiscoveryStartupError,
         paintError:window.__lariaDiscoveryGlobeLastError,
         drawType:typeof window.LARIA_DISCOVERY_GLOBE_DRAW,
         active:document.getElementById('world-screen')?.classList.contains('active'),
         mapPerspective:document.getElementById('world-screen')?.dataset.mapPerspective,
         rendererMatch:window.drawGlobe===window.LARIA_DISCOVERY_GLOBE_DRAW,
         canvasData:{...document.getElementById('globe-canvas')?.dataset}
       }));
       console.error('DISCOVERY BOOT DIAGNOSTIC',label,JSON.stringify(diagnostic),errors);
       throw error;
     }
     for(const pose of poses){
       const result=await drawPose(discovery.page,pose);
       assert.equal(result.renderer,true,label+' discovery renderer replaced after mode activation');
       assert.equal(result.discovery,'phase1',label+' lost preview state');
       assert.equal(result.level,pose.level,label+' wrong zoom detail level: '+pose.name);
       assert.equal(result.moving,'false',label+' stale interaction suppressed detail');
       assert.ok(result.illustrations>0,label+' painted zero geographically anchored illustrations for '+pose.name);
       assert.equal(result.selected,pose.country,label+' selection was lost at '+pose.name);
       assert.notEqual(hash(result.pixels),refs[pose.name],label+' discovery image equals the ordinary globe at '+pose.name);
       await discovery.page.screenshot({path:path.join(out,label+'-discovery-'+pose.name+'.png'),fullPage:viewport.height<500,animations:'disabled'});
     }
     for(const hit of [[8,62,'no'],[138,36,'jp'],[-55,-12,'br']])
       await verifyGeographicTap(discovery.page,hit[0],hit[1],hit[2],label+' discovery globe');
     await verifyPointerDrag(discovery.page,label+' discovery globe',true);
     await discovery.page.waitForTimeout(360);
     const idleStart=await discovery.page.evaluate(()=>Number(document.getElementById('globe-canvas').dataset.discoveryPaintCount||0));
     await discovery.page.waitForTimeout(720);
     const idleEnd=await discovery.page.evaluate(()=>Number(document.getElementById('globe-canvas').dataset.discoveryPaintCount||0));
     assert.ok(idleEnd-idleStart<=1,label+' idle preview repainted '+(idleEnd-idleStart)+' times without input');
     assert.deepEqual(errors,[],label+' discovery page errors');
   }finally{await discovery.ctx.close();}
   console.log('PASS geographically correct, visually distinct ordinary/discovery globes: '+label);
 }finally{await browser.close();}
}
(async()=>{
 const urls=await serve();
 try{
   const devices=[
     [webkit,'webkit-iphone-portrait',{width:390,height:844}],
     [webkit,'webkit-iphone-landscape',{width:844,height:390}],
     [webkit,'webkit-ipad-landscape',{width:1180,height:820}],
     [webkit,'webkit-ipad-portrait',{width:820,height:1180}],
     [chromium,'chromium-ipad-landscape',{width:1180,height:820}]
   ];
   for(const [engine,label,viewport] of devices)
     await runDevice(engine,label,viewport,urls);
 }finally{await new Promise(resolve=>urls.server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1});
