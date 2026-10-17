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
     ecosystems:Number(canvas.dataset.discoveryEcosystems||0),
     relief:Number(canvas.dataset.discoveryRelief||0),
     texture:Number(canvas.dataset.discoveryTexture||0),
     terrainField:Number(canvas.dataset.discoveryTerrainField||0),
     terrainMs:Number(canvas.dataset.discoveryTerrainMs||0),
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
async function verifyOffscreenCountryCard(page,label){
  // The legacy renderer can auto-select Tsjad without aligning the camera.
  // A normal map repaint must repair the card even without a pointerup.
  await page.evaluate(()=>{
    globeLon=15;globeLat=55;setGlobeZoom(2.3);
    selectGlobeCountry('td');
    drawGlobe();
  });
  await page.waitForFunction(()=>globeSelected===null,null,{timeout:5000});
  assert.match(await page.locator('#globe-status').innerText(),/Hva vil du oppdage/,
    label+' legacy offscreen Tsjad card survived ordinary globe repaint');
  await page.evaluate(()=>{
    if(!countries.td)throw new Error('Missing canonical country Tsjad');
    globeLon=18;globeLat=15;globeSelected=null;
    setGlobeZoom(2.1);selectGlobeCountry('td');
  });
  assert.match(await page.locator('#globe-status').innerText(),/Tsjad/,label+' cannot initially select Tsjad');
  await page.evaluate(()=>{
    // Simulate a completed drag after moving the real geographic camera.
    // The original globe input handler owns the pointer; the new view only
    // reconciles the status card on release, never the click or map geometry.
    globeLon=15;globeLat=62;setGlobeZoom(3.2);globeMove=35;
    document.getElementById('globe-canvas').dispatchEvent(new PointerEvent('pointerup',{
      pointerId:912,pointerType:'touch',clientX:200,clientY:200,bubbles:true
    }));
  });
  await page.waitForFunction(()=>globeSelected===null,null,{timeout:5000});
  const status=await page.locator('#globe-status').innerText();
  assert.match(status,/Hva vil du oppdage/,label+' offscreen selection did not become an exploration invitation');
  assert.doesNotMatch(status,/Tsjad/,label+' stale country card survived after rotating away');

  await page.evaluate(()=>{
    globeLon=19;globeLat=15;setGlobeZoom(2.1);selectGlobeCountry('td');
    globeMove=26;
    document.getElementById('globe-canvas').dispatchEvent(new PointerEvent('pointerup',{
      pointerId:913,pointerType:'touch',clientX:200,clientY:200,bubbles:true
    }));
  });
  await page.waitForTimeout(180);
  assert.equal(await page.evaluate(()=>globeSelected),'td',label+' still-visible country was accidentally cleared');
  assert.match(await page.locator('#globe-status').innerText(),/Tsjad/,label+' still-visible country card disappeared');
  await page.evaluate(()=>{
    globeLon=28;globeLat=61;globeSelected=null;setGlobeZoom(2.0);
    selectGlobeCountry('ru');
  });
  await page.waitForTimeout(250);
  assert.equal(await page.evaluate(()=>globeSelected),'ru',
    label+' Russia was incorrectly cleared although its European territory is visible');
  assert.match(await page.locator('#globe-status').innerText(),/Russland/,
    label+' visible large-country card disappeared');
}
async function verifyPointerDrag(page,label,isDiscovery){
 await page.evaluate(()=>{
   globeLon=18;globeLat=36;globeSelected=null;setGlobeZoom(2.2);
   if(typeof globePointers!=='undefined')globePointers.clear();
   window.__lariaGlobeInteracting=false;
   document.getElementById('globe-canvas').dataset.dragStartLon=String(globeLon);
 });
 const canvas=page.locator('#globe-canvas');
 await canvas.scrollIntoViewIfNeeded();
 const rect=await canvas.boundingBox();
 assert.ok(rect&&rect.width>100&&rect.height>100,label+' canvas has no visible drag target');
 const x=rect.x+rect.width*.48,y=rect.y+rect.height*.48;
 await page.mouse.move(x,y);
 await page.mouse.down();
 await page.mouse.move(x+52,y+12,{steps:5});
 await page.waitForTimeout(130);
 const during=await page.evaluate(()=>({
   moving:window.__lariaGlobeInteracting,
   pointerCount:globePointers.size,
   marked:document.getElementById('globe-canvas').dataset.discoveryMoving,
   before:Number(document.getElementById('globe-canvas').dataset.dragStartLon),
   after:globeLon
 }));
 assert.ok(Math.abs(during.after-during.before)>1,label+' pointer drag did not rotate the globe: '+JSON.stringify(during));
 assert.equal(during.moving,true,label+' dragging state never activated');
 assert.equal(during.pointerCount,1,label+' active pointer was lost');
 if(isDiscovery){
   assert.equal(during.marked,'true',label+' discovery detail not suppressed while dragging');
   await page.screenshot({path:path.join(out,label.replace(/[^a-z0-9-]/gi,'-')+'-moving.png'),fullPage:true,animations:'disabled'});
 }
 await page.mouse.up();
 await page.waitForTimeout(180);
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
       await standard.page.screenshot({path:path.join(out,label+'-simple-'+pose.name+'.png'),fullPage:viewport.height<500,animations:'disabled'});
     }
     for(const hit of [[8,62,'no'],[138,36,'jp'],[-55,-12,'br']])
       await verifyGeographicTap(standard.page,hit[0],hit[1],hit[2],label+' ordinary globe');
     await verifyPointerDrag(standard.page,label+' ordinary globe',false);
     await standard.page.waitForFunction(()=>typeof window.LARIA_SET_GLOBE_VIEW==='function'&&
       document.getElementById('globe-view-toggle')?.getBoundingClientRect().width>0,null,{timeout:12000});
     assert.equal(await standard.page.locator('#globe-view-toggle [data-globe-view="simple"]').getAttribute('aria-pressed'),'true',label+' simple mode not default');
     const beforeSwitch=await standard.page.evaluate(()=>({country:globeSelected,lon:globeLon,lat:globeLat,zoom:globeZoom}));
     await standard.page.locator('#globe-view-toggle [data-globe-view="discover"]').click();
     await standard.page.waitForFunction(()=>window.__lariaDiscoveryGlobePreview===true&&
       window.drawGlobe===window.LARIA_DISCOVERY_GLOBE_DRAW,null,{timeout:12000});
     const afterDiscovery=await standard.page.evaluate(()=>({
       country:globeSelected,lon:globeLon,lat:globeLat,zoom:globeZoom,
       stored:localStorage.getItem('laria-globe-view-v1')
     }));
     for(const key of ['country','lon','lat','zoom'])
       assert.equal(afterDiscovery[key],beforeSwitch[key],label+' entering Oppdag changed '+key);
     assert.equal(afterDiscovery.stored,'discover',label+' Oppdag preference not saved');
     assert.match(await standard.page.locator('[data-premium-globe-subtitle]').innerText(),
       /Oppdag fjell, skoger, elver og ørkener/,label+' discovery subtitle still describes simple globe');
     assert.equal(await standard.page.locator('#globe-view-toggle [data-globe-view="discover"]').getAttribute('aria-pressed'),'true');
     await standard.page.locator('#globe-view-toggle [data-globe-view="simple"]').click();
     await standard.page.waitForFunction(()=>window.__lariaDiscoveryGlobePreview===false&&
       window.drawGlobe!==window.LARIA_DISCOVERY_GLOBE_DRAW,null,{timeout:12000});
     const restored=await standard.page.evaluate(()=>({
       country:globeSelected,lon:globeLon,lat:globeLat,zoom:globeZoom,
       stored:localStorage.getItem('laria-globe-view-v1')
     }));
     for(const key of ['country','lon','lat','zoom'])
       assert.equal(restored[key],beforeSwitch[key],label+' returning to Enkel changed '+key);
     assert.equal(restored.stored,'simple',label+' Enkel preference not saved');
     assert.match(await standard.page.locator('[data-premium-globe-subtitle]').innerText(),
       /klassiske snurrbare kloden/,label+' original guidance not restored in simple mode');
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
       assert.equal(result.discovery,'landscapes-v2',label+' lost integrated landscape engine');
       assert.equal(result.level,pose.level,label+' wrong zoom detail level: '+pose.name);
       assert.equal(result.moving,'false',label+' stale interaction suppressed detail');
       assert.ok(result.illustrations>0,label+' painted zero geographically anchored illustrations for '+pose.name);
       assert.ok(result.ecosystems>=2,label+' missing georeferenced contiguous biome regions: '+pose.name);
       assert.equal(result.terrainField,1,label+' missing coordinate-anchored continuous landscape shading: '+pose.name);
       assert.ok(Number.isFinite(result.terrainMs)&&result.terrainMs>=0&&result.terrainMs<4000,
         label+' landscape shader stalled the device ('+result.terrainMs+'ms) at '+pose.name);
       console.log('TERRAIN PERF',label,pose.name,result.terrainMs+'ms');
       assert.ok(result.relief>=1,label+' missing geographic mountain corridors: '+pose.name);
       if(pose.level!=='1')assert.ok(result.texture>=1,label+' missing zoom-responsive terrain texture: '+pose.name);
       assert.equal(result.selected,pose.country,label+' selection was lost at '+pose.name);
       assert.notEqual(hash(result.pixels),refs[pose.name],label+' discovery image equals the ordinary globe at '+pose.name);
       await discovery.page.screenshot({path:path.join(out,label+'-discovery-'+pose.name+'.png'),fullPage:viewport.height<500,animations:'disabled'});
     }
     await verifyOffscreenCountryCard(discovery.page,label+' discovery globe');
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
