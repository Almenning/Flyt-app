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
     terrainPixels:Number(canvas.dataset.discoveryTerrainPixels||0),
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
    globeLon=-35;globeLat=75;setGlobeZoom(1.72);
    selectGlobeCountry('td');
    drawGlobe();
  });
  await page.waitForFunction(()=>globeSelected===null,null,{timeout:5000});
  assert.match(await page.locator('#globe-status').innerText(),/Europa venter/,
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
    globeLon=-35;globeLat=75;setGlobeZoom(1.72);globeMove=35;
    document.getElementById('globe-canvas').dispatchEvent(new PointerEvent('pointerup',{
      pointerId:912,pointerType:'touch',clientX:200,clientY:200,bubbles:true
    }));
  });
  await page.waitForFunction(()=>globeSelected===null,null,{timeout:5000});
  const status=await page.locator('#globe-status').innerText();
  assert.match(status,/Europa venter/,label+' offscreen selection did not become an exploration invitation');
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
/* A continent-first experience must follow where the child actually spins.
   Verify all six story cards and their real camera destinations in WebKit. */
async function verifyShortPhoneTapFlow(page,label){
 const setup=await page.evaluate(()=>{
  const screen=document.getElementById('world-screen');
  screen.scrollTop=0;globeLon=2;globeLat=47;globeSelected=null;setGlobeZoom(1.25);
  const canvas=document.getElementById('globe-canvas');
  const point=globeProject(2,47,canvas._cssW,canvas._cssH);
  const rect=canvas.getBoundingClientRect();
  return {overflow:screen.scrollHeight-screen.clientHeight,
   x:rect.left+point[0],y:rect.top+point[1]};
 });
 assert.ok(setup.overflow>20,label+' short-screen layout no longer exposes a scrollable country panel');
 await page.evaluate(()=>{
  document.getElementById('globe-canvas').addEventListener('pointerup',event=>{
   window.__shortPhoneQAEvent={trusted:event.isTrusted,type:event.pointerType,
    selected:globeSelected,drag:globeMove,active:window.__lariaDiscoveryGlobePreview};
  },{once:true});
 });
 await page.touchscreen.tap(setup.x,setup.y);
 await page.waitForTimeout(700);
 const observed=await page.evaluate(()=>{
  const screen=document.getElementById('world-screen');
  return {selected:globeSelected,scrollTop:screen.scrollTop,
   scrollHeight:screen.scrollHeight,clientHeight:screen.clientHeight,
   pointer:window.__shortPhoneQAEvent||null,
   scrollTrace:screen.dataset.discoveryScrollAttempt||null,
   pointerTrace:screen.dataset.discoveryLastPointer||null,
   media:matchMedia('(orientation:portrait) and (max-width:350px) and (max-height:700px)').matches,
   overflow: getComputedStyle(screen).overflowY,
   search:document.getElementById('globe-status').innerText.slice(0,140)};
 });
 console.log('SHORT PHONE TAP',label,JSON.stringify({setup,observed}));
 assert.equal(observed.pointer?.type,'touch',label+' test must exercise real touch pointer input');
 assert.equal(observed.selected,'fr',label+' geographic finger tap missed France');
 assert.ok(observed.scrollTop>20,label+' country card was not revealed after tap: '+JSON.stringify(observed));
 await page.waitForTimeout(520);
 const frame=await page.evaluate(()=>{
  const screen=document.getElementById('world-screen');
  const card=document.getElementById('globe-status').getBoundingClientRect();
  const actions=document.querySelector('#world-screen .globe-actions').getBoundingClientRect();
  return {scrollTop:screen.scrollTop,cardTop:card.top,cardBottom:card.bottom,
   actionsBottom:actions.bottom,viewport:window.innerHeight};
 });
 assert.ok(frame.cardTop>=-1&&frame.cardBottom<=frame.viewport+2,
  label+' tapped country card is still clipped: '+JSON.stringify(frame));
 assert.ok(frame.actionsBottom<=frame.viewport+2,
  label+' actions cannot be reached after child tap: '+JSON.stringify(frame));
 await page.screenshot({path:path.join(out,label+'-discovery-tap-card.png'),
  fullPage:false,animations:'disabled'});
 await page.evaluate(()=>{document.getElementById('world-screen').scrollTop=0;});
}

async function verifyContinentInvitation(page,label){
 const stops=[
  {name:'Europa',lon:13,lat:53,zoom:1.38},
  {name:'Afrika',lon:19,lat:3,zoom:1.28},
  {name:'Asia',lon:104,lat:38,zoom:1.30},
  {name:'Nord-Amerika',lon:-105,lat:43,zoom:1.30},
  {name:'Sør-Amerika',lon:-62,lat:-14,zoom:1.30},
  {name:'Oseania',lon:135,lat:-25,zoom:1.30}
 ];
 for(const stop of stops){
  await page.evaluate(({lon,lat})=>{
   globeLon=lon;globeLat=lat;globeSelected=null;globeMove=20;
   setGlobeZoom(1.2);
   document.getElementById('globe-canvas').dispatchEvent(new PointerEvent('pointerup',{
    pointerId:611,pointerType:'touch',bubbles:true
   }));
  },stop);
  await page.waitForFunction(name=>{
   const box=document.getElementById('globe-status');
   return box?.classList.contains('discovery-continent-intro')&&box.dataset.discoveryContinent===name;
  },stop.name,{timeout:7000});
  const card=await page.locator('#globe-status').innerText();
  assert.match(card,new RegExp(stop.name+' venter'),label+' showed the wrong continent invitation');
  // The card alone is not enough: the globe must actually paint its defining
  // mountain ranges, and large continents should also show major rivers.
  const visible=await page.evaluate(()=>{
   const canvas=document.getElementById('globe-canvas');
   return {level:document.getElementById('world-screen').dataset.discoveryGlobeLevel,
    crests:Number(canvas.dataset.discoveryContinentCrests||0),
    rivers:Number(canvas.dataset.discoveryContinentRivers||0)};
  });
  assert.equal(visible.level,'1',label+' must stay at continent scale: '+stop.name);
  assert.ok(visible.crests>0,label+' missing major mountain relief at '+stop.name+': '+JSON.stringify(visible));
  if(['Afrika','Asia','Nord-Amerika','Sør-Amerika'].includes(stop.name))
   assert.ok(visible.rivers>0,label+' missing major rivers at '+stop.name+': '+JSON.stringify(visible));
  const button=page.locator('.discovery-continent-button');
  assert.equal(await button.innerText(),'Se '+stop.name,label+' continent destination button mismatch');
  const cardBounds=await page.locator('#globe-status').boundingBox();
  const buttonBounds=await button.boundingBox();
  assert.ok(cardBounds&&buttonBounds&&buttonBounds.height>=43.5,
   label+' continent button is too small for child touch input: '+stop.name);
  assert.ok(buttonBounds.x>=cardBounds.x-1&&buttonBounds.x+buttonBounds.width<=cardBounds.x+cardBounds.width+1,
   label+' continent action extends outside its card: '+stop.name);
  if(label==='webkit-ipad-landscape'||label==='webkit-iphone-portrait'){
   await page.waitForTimeout(140);
   await page.screenshot({
    path:path.join(out,label+'-discovery-continent-'+stop.name.toLowerCase()+'.png'),
    fullPage:false,animations:'disabled'
   });
  }
  await button.click();
  const focused=await page.evaluate(()=>({lon:globeLon,lat:globeLat,zoom:globeZoom}));
  assert.ok(Math.abs(focused.lon-stop.lon)<.001&&Math.abs(focused.lat-stop.lat)<.001,
   label+' continent action did not orient the geographic camera: '+stop.name);
  assert.ok(Math.abs(focused.zoom-stop.zoom)<.001,
   label+' continent action changed its approved scale: '+stop.name);
  assert.equal(await page.locator('#globe-status').getAttribute('data-discovery-story-step'),'0',
   label+' continent action did not reveal the first optional discovery');
  assert.equal(await button.innerText(),'Neste sted',
   label+' there is no child-friendly continuation after entering '+stop.name);
  assert.ok((await page.locator('.discovery-intro-teaser').innerText()).length>=28,
   label+' continent intro has no educational discovery: '+stop.name);
  await page.waitForFunction(()=>{
    return document.querySelector('.discovery-intro-fox')?.classList.contains('discovery-fox-reacting');
   },null,{timeout:3000});
  // Test a real second discovery with its geographic location; the invitation
  // is optional, can be repeated, and must never mark a school task complete.
  if(label==='webkit-ipad-landscape'||label==='webkit-iphone-portrait'){
   const nextPlace={
    'Europa':{name:'Alpene',lon:11,lat:47},
    'Afrika':{name:'Sahara',lon:13,lat:23},
    'Asia':{name:'Himalaya',lon:87,lat:29},
    'Nord-Amerika':{name:'Rocky Mountains',lon:-112,lat:42},
    'Sør-Amerika':{name:'Andesfjellene',lon:-70,lat:-19},
    'Oseania':{name:'Korallrevet',lon:146,lat:-19}
   }[stop.name];
   await button.click();
   assert.equal(await page.locator('#globe-status').getAttribute('data-discovery-story-step'),'1',
    label+' second discovery did not advance: '+stop.name);
   assert.equal(await page.locator('.discovery-intro-copy strong').innerText(),nextPlace.name,
    label+' wrong landmark appeared in '+stop.name);
   const camera=await page.evaluate(()=>({lon:globeLon,lat:globeLat,zoom:globeZoom}));
   assert.ok(Math.abs(camera.lon-nextPlace.lon)<.001&&Math.abs(camera.lat-nextPlace.lat)<.001,
    label+' landmark not georeferenced in '+stop.name+': '+JSON.stringify(camera));
   assert.ok(camera.zoom<=1.72&&camera.zoom>=1,
    label+' landmark discovery exceeds continent zoom: '+stop.name);
   assert.ok((await page.locator('.discovery-intro-teaser').innerText()).length>=25,
    label+' landmark fact missing in '+stop.name);
   await page.screenshot({
    path:path.join(out,label+'-discovery-story-'+stop.name.toLowerCase()+'.png'),
    fullPage:false,animations:'disabled'
   });
  }
 }
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
 // Wait for the real post-release paint instead of racing a fixed 180ms
 // timer against the continent terrain pass on larger WebKit canvases.
 if(isDiscovery)await page.waitForFunction(()=>
   window.__lariaGlobeInteracting===false&&globePointers.size===0&&
   document.getElementById('globe-canvas').dataset.discoveryMoving==='false',null,{timeout:5000});
 else await page.waitForTimeout(180);
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
     if(beforeSwitch.country===null){
       assert.equal(afterDiscovery.lon,13,label+' first unselected entry must face Europe');
       assert.equal(afterDiscovery.lat,53,label+' first unselected entry must face Europe');
       assert.match(await standard.page.locator('#globe-status').innerText(),/Europa venter/);
       await standard.page.screenshot({path:path.join(out,label+'-discovery-welcome.png'),fullPage:viewport.height<500,animations:'disabled'});
     }else for(const key of ['country','lon','lat'])
       assert.equal(afterDiscovery[key],beforeSwitch[key],label+' entering Oppdag changed '+key);
     assert.equal(afterDiscovery.zoom,1.72,label+' Oppdag must cap inherited close-ups at continent scale');
     assert.equal(afterDiscovery.stored,'discover',label+' Oppdag preference not saved');
     assert.match(await standard.page.locator('#world-screen').evaluate(el=>getComputedStyle(el).backgroundImage),
       /linear-gradient/,'Oppdag atmosphere is not active in WebKit: '+label);
     assert.match(await standard.page.locator('[data-premium-globe-subtitle]').innerText(),
       /Oppdag fjell, skoger, elver og ørkener/,label+' discovery subtitle still describes simple globe');
     assert.equal(await standard.page.locator('#globe-view-toggle [data-globe-view="discover"]').getAttribute('aria-pressed'),'true');
     // Discover preference must not apply the illustrated background in Atlas.
     await standard.page.locator('#globe-mode [data-globe-mode="explore"]').click();
     await standard.page.waitForFunction(()=>{
       const screen=document.getElementById('world-screen');
       return screen.dataset.mapPerspective==='atlas'&&window.__lariaDiscoveryGlobePreview===false&&
         screen.dataset.discoveryGlobe===undefined;
     },null,{timeout:12000});
     assert.doesNotMatch(await standard.page.locator('#world-screen').evaluate(el=>getComputedStyle(el).backgroundImage),
       /linear-gradient/,'Oppdag atmosphere leaked into Kartet: '+label);
     await standard.page.locator('#globe-mode [data-globe-mode="classic"]').click();
     await standard.page.waitForFunction(()=>{
       const screen=document.getElementById('world-screen');
       return screen.dataset.mapPerspective==='globe'&&window.__lariaDiscoveryGlobePreview===true&&
         screen.dataset.discoveryGlobe==='painted-atlas-v1';
     },null,{timeout:12000});
     assert.match(await standard.page.locator('#world-screen').evaluate(el=>getComputedStyle(el).backgroundImage),
       /linear-gradient/,'Oppdag atmosphere failed to return after Kartet: '+label);
     await standard.page.locator('#globe-view-toggle [data-globe-view="simple"]').click();
     await standard.page.waitForFunction(()=>window.__lariaDiscoveryGlobePreview===false&&
       window.drawGlobe!==window.LARIA_DISCOVERY_GLOBE_DRAW,null,{timeout:12000});
     const restored=await standard.page.evaluate(()=>({
       country:globeSelected,lon:globeLon,lat:globeLat,zoom:globeZoom,
       stored:localStorage.getItem('laria-globe-view-v1')
     }));
     for(const key of ['country','lon','lat','zoom'])
       assert.equal(restored[key],beforeSwitch[key],label+' returning to Enkel changed '+key);
     assert.equal(await standard.page.locator('.discovery-country-companion').count(),0,label+' companion leaked into Enkel');
     await standard.page.evaluate(()=>setGlobeZoom(5));
     assert.equal(await standard.page.evaluate(()=>globeZoom),5,label+' Enkel lost its original full zoom');
     assert.equal(restored.stored,'simple',label+' Enkel preference not saved');
     assert.doesNotMatch(await standard.page.locator('#world-screen').evaluate(el=>getComputedStyle(el).backgroundImage),
       /linear-gradient/,'Oppdag atmosphere leaked into Enkel: '+label);
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
     if(label==='webkit-iphone-small-portrait')
       await verifyShortPhoneTapFlow(discovery.page,label);
     if(label==='webkit-ipad-landscape'||label==='webkit-iphone-portrait')
       await verifyContinentInvitation(discovery.page,label);
     // A real country replaces the invitation, including its two-column CSS.
     // Selecting the same country again must recreate exactly one companion.
     for(let attempt=0;attempt<2;attempt++){
       await discovery.page.evaluate(()=>{globeLon=8;globeLat=62;setGlobeZoom(1.72);selectGlobeCountry('no')});
       await discovery.page.waitForFunction(()=>document.querySelectorAll('#globe-status .discovery-country-companion').length===1);
       assert.equal(await discovery.page.locator('#globe-status').evaluate(el=>el.classList.contains('discovery-continent-intro')),false,label+' invitation layout leaked into country card');
       assert.ok(await discovery.page.locator('#globe-status').evaluate(el=>el.getBoundingClientRect().height)<viewport.height*.4,label+' country card covers the globe');
       if(viewport.height>viewport.width){
         const card=await discovery.page.locator('#globe-status').boundingBox();
         const toggle=await discovery.page.locator('#globe-view-toggle').boundingBox();
         assert.ok(toggle.y+toggle.height<=card.y,label+' country card overlaps the view selector');
       }
       assert.equal(await discovery.page.locator('.discovery-country-companion img').getAttribute('src'),await discovery.page.evaluate(()=>window.LARIA_PROFILE_AVATARS.girl),label+' country companion does not match selected fox');
     }
     for(const pose of poses){
       const result=await drawPose(discovery.page,pose);
       assert.equal(result.renderer,true,label+' discovery renderer replaced after mode activation');
       assert.equal(result.discovery,'painted-atlas-v1',label+' lost integrated landscape engine');
       assert.ok(result.zoom<=1.72,label+' exceeded approved continent scale: '+pose.name);
       assert.equal(result.level,result.zoom<1.7?'1':'2',label+' continent-first renderer exposed the wrong terrain tier: '+pose.name);
       assert.equal(result.moving,'false',label+' stale interaction suppressed detail');
       assert.ok(result.illustrations>0,label+' painted zero geographically anchored illustrations for '+pose.name);
       if(pose.name==='world')assert.ok(result.texture>0,
         label+' continent overview lost all geographically anchored canopy/dune material');
       assert.equal(result.ecosystems,0,label+' separate biome washes must not return: '+pose.name);
       assert.equal(result.terrainField,1,label+' missing coordinate-anchored continuous landscape shading: '+pose.name);
       if(pose.name==='world'&&viewport.width>=800&&viewport.height>=700)
         assert.ok(result.terrainPixels>=175,label+' iPad overview terrain remains too low resolution');
       assert.ok(Number.isFinite(result.terrainMs)&&result.terrainMs>=0&&result.terrainMs<4000,
         label+' landscape shader stalled the device ('+result.terrainMs+'ms) at '+pose.name);
       console.log('TERRAIN PERF',label,pose.name,result.terrainMs+'ms');
       assert.ok(result.relief>=1,label+' missing geographic mountain corridors: '+pose.name);
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
     [webkit,'webkit-iphone-small-portrait',{width:320,height:568}],
     [webkit,'webkit-iphone-portrait',{width:390,height:844}],
     [webkit,'webkit-iphone-landscape',{width:844,height:390}],
     [webkit,'webkit-ipad-landscape',{width:1180,height:820}],
     [webkit,'webkit-ipad-portrait',{width:820,height:1180}],
     [chromium,'chromium-ipad-landscape',{width:1180,height:820}]
   ];
   const requested=process.env.DISCOVERY_GLOBE_ENGINE;
   assert.ok(!requested||['webkit','chromium'].includes(requested),'unknown requested browser engine');
   const selected=devices.filter(([,label])=>(!requested||label.startsWith(requested+'-'))&&
     (!process.env.DISCOVERY_GLOBE_DEVICE||label===process.env.DISCOVERY_GLOBE_DEVICE));
   assert.ok(selected.length,'no matching globe QA device');
   for(const [engine,label,viewport] of selected)
     await runDevice(engine,label,viewport,urls);
 }finally{await new Promise(resolve=>urls.server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1});
