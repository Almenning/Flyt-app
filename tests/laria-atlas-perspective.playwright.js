'use strict';
/* Regression contract for the new atlas perspective, with the legacy sphere
   still available behind the "Kloden" selector. */
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'..','laer-litt-mer');
const out=process.env.ATLAS_QA_SCREENSHOTS||'/tmp/laria-atlas-v1';
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.json':'application/json'};
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'AtlasQA',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
 lastMilestone:null,recentCountryWin:null,lastActivity:null,journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
async function startServer(){
 const s=http.createServer((req,res)=>{
  let p;try{p=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400);res.end();return}
  const file=path.resolve(root,p.replace(/^\/+/,'')||'index.html');
  if(!file.startsWith(root)){res.writeHead(403);res.end();return}
  fs.readFile(file,(error,bytes)=>{if(error){res.writeHead(404);res.end();return}
   res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
   res.setHeader('Cache-Control','no-store');res.end(bytes);
  });
 });
 await new Promise((resolve,reject)=>{s.once('error',reject);s.listen(0,'127.0.0.1',resolve)});
 return {server:s,url:'http://127.0.0.1:'+s.address().port+'/'};
}
async function run(engine,label,viewport){
 const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext({viewport,isMobile:viewport.width<600,hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block'});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(state=>localStorage.setItem('laerlittmer-v2',JSON.stringify(state)),seed);
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  await page.goto(globalThis.testUrl+'?app=laria&atlas='+label,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof openGlobe==='function'&&window.LARIA_ATLAS_PERSPECTIVE);
  await page.evaluate(()=>openGlobe());
  await page.waitForFunction(()=>window.LARIA_ATLAS_PERSPECTIVE?.snapshot().active===true&&document.querySelector('#atlas-canvas')?.dataset.mapReady==='true');
  assert.equal(await page.locator('#atlas-canvas').isVisible(),true,label+' must load the actual atlas by default');
  assert.equal((await page.locator('.premium-globe-title').innerText()).trim(),'Kartet',label+' atlas header must not say Kloden');
  assert.equal(await page.locator('#globe-canvas').isVisible(),false,label+' sphere must not compete with the atlas');
  const rect=await page.locator('#atlas-canvas').boundingBox();
  const modes=await page.locator('#globe-mode').boundingBox();
  const card=await page.locator('#globe-status').boundingBox();
  assert.ok(rect.width>=viewport.width*.76,label+' atlas too narrow '+JSON.stringify(rect));
  assert.ok(rect.height>180,label+' atlas too shallow '+JSON.stringify(rect));
  assert.ok(rect.y>=modes.y+modes.height+4,label+' atlas overlaps mode selector');
  const separateColumns=viewport.width>=900&&viewport.width>viewport.height;
  assert.ok(separateColumns
    ?rect.x+rect.width<=card.x-2
    :rect.y+rect.height<=card.y-2,
  label+' atlas collides with country card');
  const first=await page.evaluate(()=>window.LARIA_ATLAS_PERSPECTIVE.snapshot());
  assert.equal(first.source,'country-geometry',label+' country surfaces must use real polygon data');
  const regions=await page.locator('.atlas-region-nav button').count();
  assert.equal(regions,8,label+' world, Norden and six continents missing');
  const touchTargets=await page.locator('.atlas-region-nav button').evaluateAll(all=>all.map(el=>el.getBoundingClientRect().height));
  assert.ok(touchTargets.every(h=>h>=44),label+' region buttons must be 44px touch targets');
  await page.evaluate(()=>window.LARIA_ATLAS_PERSPECTIVE.region('norden'));
  await page.waitForTimeout(120);
  const coords=await page.evaluate(()=>{
   const project=window.LARIA_ATLAS_PERSPECTIVE.project;
   const pixel=project(10.3,61.2),back=window.LARIA_ATLAS_PERSPECTIVE.inverse(pixel.x,pixel.y);
   return {pixel,back,hit:typeof countries!=='undefined'&&!!countries.no?.geometry&&pointInCountry(countries.no,10.3,61.2)};
  });
  assert.ok(Math.abs(coords.back.lon-10.3)<.0001&&Math.abs(coords.back.lat-61.2)<.0001,label+' inverse and projection out of sync');
  assert.ok(coords.hit,label+' test point must fall inside actual Norway polygon');
  assert.ok(coords.pixel.x>0&&coords.pixel.x<rect.width&&coords.pixel.y>60&&coords.pixel.y<rect.height,label+' Norway outside atlas visible area');
  await page.locator('#atlas-canvas').click({position:coords.pixel});
  await page.waitForTimeout(120);
  const selected=await page.evaluate(()=>globeSelected);
  assert.equal(selected,'no',label+' Norway tap must select Norway, not China or a neighbouring country');
  assert.ok((await page.locator('#globe-status strong').allTextContents()).some(x=>x.includes('Norge')),label+' Norway card missing');
  if(viewport.width<=430){
   assert.equal(await page.locator('#globe-status .premium-country-learn span').isVisible(),true,label+' Lær mer text must be visible beside the Norwegian country card on iPhone');
   const learnButton=await page.locator('#globe-status .premium-country-learn').boundingBox();
   assert.ok(learnButton.width>=60&&learnButton.height>=50,label+' Lær mer needs a child-friendly tap target');
  }
  const before=await page.evaluate(()=>window.LARIA_ATLAS_PERSPECTIVE.snapshot());
  assert.equal(await page.locator('#globe-zoom-out').isEnabled(),true,label+' atlas zoom-out must not inherit disabled sphere controls');
  await page.locator('#globe-zoom-in').click();
  const after=await page.evaluate(()=>window.LARIA_ATLAS_PERSPECTIVE.snapshot());
  assert.ok(after.zoom>before.zoom,label+' zoom button fails');
  await page.locator('#globe-zoom-out').click();
  const backZoom=await page.evaluate(()=>window.LARIA_ATLAS_PERSPECTIVE.snapshot().zoom);
  assert.ok(backZoom<after.zoom,label+' zoom-out button must reduce atlas scale');
  // Deeper map zoom must remain geographically accurate and must keep the
  // exact vector country outlines, not silently fall back to blurry artwork.
  await page.evaluate(()=>window.LARIA_ATLAS_PERSPECTIVE.region('norden'));
  for(let n=0;n<4;n++)await page.locator('#globe-zoom-in').click();
  const deepZoom=await page.evaluate(()=>{
   const atlas=window.LARIA_ATLAS_PERSPECTIVE,s=atlas.snapshot();
   const p=atlas.project(s.lon+.15,s.lat-.15),back=atlas.inverse(p.x,p.y);
   const canvas=document.getElementById('atlas-canvas');
   return {zoom:s.zoom,lonError:Math.abs(back.lon-(s.lon+.15)),latError:Math.abs(back.lat-(s.lat-.15)),source:canvas.dataset.renderSource};
  });
  assert.ok(deepZoom.zoom>11,label+' atlas must allow zoom beyond previous 11x cap: '+deepZoom.zoom);
  assert.ok(deepZoom.lonError<.0001&&deepZoom.latError<.0001,label+' deep zoom loses geographic pointer accuracy');
  assert.equal(deepZoom.source,'country-geometry',label+' deep zoom must still render vector country data');
  await page.evaluate(()=>window.LARIA_ATLAS_PERSPECTIVE.zoom(1000));
  const cappedZoom=await page.evaluate(()=>window.LARIA_ATLAS_PERSPECTIVE.snapshot().zoom);
  assert.equal(cappedZoom,32,label+' atlas must retain a bounded maximum zoom');
  assert.equal(await page.locator('#globe-zoom-in').isEnabled(),false,label+' zoom-in must disable at 32x');
  await page.locator('#globe-zoom-out').click();
  assert.equal(await page.locator('#globe-zoom-in').isEnabled(),true,label+' zoom-in must re-enable after zooming out');
  await page.evaluate(()=>window.LARIA_ATLAS_PERSPECTIVE.zoom(1));
  assert.equal(await page.locator('#globe-zoom-out').isEnabled(),false,label+' atlas zoom-out must disable at minimum atlas scale');
  await page.evaluate(()=>window.LARIA_ATLAS_PERSPECTIVE.region('norden'));
  assert.equal(await page.locator('#globe-zoom-out').isEnabled(),true,label+' zoom-out must re-enable on entering a zoomed region');
  const anchor=await page.evaluate(()=>{
   const atlas=window.LARIA_ATLAS_PERSPECTIVE,p=atlas.project(12,62);
   const before=atlas.inverse(p.x,p.y);
   atlas.zoom(atlas.snapshot().zoom*1.3,p.x,p.y);
   const after=atlas.inverse(p.x,p.y);
   return {dLon:Math.abs(before.lon-after.lon),dLat:Math.abs(before.lat-after.lat)};
  });
  assert.ok(anchor.dLon<.025&&anchor.dLat<.025,label+' zoom does not preserve anchor');
  await page.evaluate(()=>window.LARIA_ATLAS_PERSPECTIVE.region('europe'));
  await page.screenshot({path:path.join(out,label+'-atlas-explore.png'),fullPage:true});
  const center=await page.locator('#atlas-canvas').boundingBox();
  const initial=await page.evaluate(()=>window.LARIA_ATLAS_PERSPECTIVE.snapshot().lon);
  await page.mouse.move(center.x+center.width*.49,center.y+center.height*.55);
  await page.mouse.down();await page.mouse.move(center.x+center.width*.64,center.y+center.height*.55,{steps:7});await page.mouse.up();
  const moved=await page.evaluate(()=>window.LARIA_ATLAS_PERSPECTIVE.snapshot().lon);
  assert.ok(Math.abs(moved-initial)>2,label+' pan did not follow pointer motion');
  await page.locator('[data-globe-mode="mine"]').click();
  await page.waitForFunction(()=>window.LARIA_ATLAS_PERSPECTIVE.snapshot().mode==='mine');
  await page.waitForTimeout(90);
  const legendBox=await page.locator('#globe-legend').boundingBox();
  const mineMapBox=await page.locator('#atlas-canvas').boundingBox();
  assert.ok(legendBox&&mineMapBox&&legendBox.y+legendBox.height<=mineMapBox.y-5,label+' progress legend overlaps atlas: '+JSON.stringify({legendBox,mineMapBox}));
  assert.equal(await page.locator('#atlas-canvas').isVisible(),true,label+' Min verden must stay an atlas with progress');
  await page.screenshot({path:path.join(out,label+'-atlas-mine.png'),fullPage:true});
  await page.locator('[data-globe-mode="classic"]').click();
  await page.waitForFunction(()=>document.getElementById('world-screen').dataset.mapPerspective==='globe');
  assert.equal(await page.locator('#atlas-canvas').isVisible(),false,label+' atlas must hide for classic sphere');
  assert.equal(await page.locator('#globe-canvas').isVisible(),true,label+' classic sphere must remain playable');
  const sphereFocus=await page.evaluate(()=>{
    const c=countries?.[globeSelected];
    return {selected:globeSelected,lon:globeLon,lat:globeLat,zoom:globeZoom,targetLon:c?.lon,targetLat:c?.lat};
  });
  assert.equal(sphereFocus.selected,'no',label+' switching modes must preserve Norway selection');
  assert.ok(Math.abs(sphereFocus.lon-sphereFocus.targetLon)<.5&&Math.abs(sphereFocus.lat-sphereFocus.targetLat)<.5,
    label+' classic sphere must center on the selected Norway instead of showing an unrelated continent: '+JSON.stringify(sphereFocus));
  assert.ok(sphereFocus.zoom<=1.05,label+' returning to Kloden must keep a round, full-sized globe');
  await page.screenshot({path:path.join(out,label+'-sphere-retained.png'),fullPage:true});
  await page.locator('[data-globe-mode="explore"]').click();
  assert.equal(await page.locator('#atlas-canvas').isVisible(),true,label+' changing back should restore atlas');
  const restored=await page.evaluate(()=>window.LARIA_ATLAS_PERSPECTIVE.snapshot());
  assert.ok(Math.abs(restored.lon-sphereFocus.targetLon)<.5&&Math.abs(restored.lat-sphereFocus.targetLat)<.5,
    label+' returning from Kloden must focus the same selected country in the atlas');
  assert.equal(await page.locator('#world-back').isVisible(),true);
  assert.deepEqual(errors,[],label+' runtime exceptions: '+errors.join(', '));
  fs.writeFileSync(path.join(out,label+'.json'),JSON.stringify({first,after,anchor,moved,rect,viewport},null,2));
  await context.close();
 }finally{await browser.close()}
}
/* Landscape iPhone is not a narrow tablet. It needs a map-first left column,
   a separate country panel, reliable zoom and an unobstructed classic sphere. */
async function runLandscapePhone(){
 const label='safari-iphone-landscape',viewport={width:844,height:390};
 const browser=await webkit.launch({headless:true});
 try{
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(state=>localStorage.setItem('laerlittmer-v2',JSON.stringify(state)),seed);
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  await page.goto(globalThis.testUrl+'?app=laria&atlas='+label,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof openGlobe==='function'&&window.LARIA_ATLAS_PERSPECTIVE);
  await page.evaluate(()=>openGlobe());
  await page.waitForFunction(()=>window.LARIA_ATLAS_PERSPECTIVE?.snapshot().active===true&&document.querySelector('#atlas-canvas')?.dataset.mapReady==='true');
  const map=await page.locator('#atlas-canvas').boundingBox();
  const card=await page.locator('#globe-status').boundingBox();
  const mode=await page.locator('#globe-mode').boundingBox();
  assert.ok(map&&card&&mode,label+' interactive regions missing');
  assert.ok(map.width>=viewport.width*.46&&map.height>=190,label+' atlas did not fill the left landscape learning column: '+JSON.stringify(map));
  assert.ok(map.y>=mode.y+mode.height+3,label+' atlas overlaps the mode selector');
  assert.ok(map.x+map.width<=card.x-4,label+' map and country panel collide: '+JSON.stringify({map,card}));
  assert.ok(card.x+card.width<=viewport.width+2,label+' country panel clips outside landscape screen');
  await page.evaluate(()=>window.LARIA_ATLAS_PERSPECTIVE.region('norden'));
  const norway=await page.evaluate(()=>window.LARIA_ATLAS_PERSPECTIVE.project(10.3,61.2));
  assert.ok(norway.x>0&&norway.x<map.width&&norway.y>65&&norway.y<map.height,label+' Norway cannot be tapped in landscape');
  await page.locator('#atlas-canvas').click({position:norway});
  assert.equal(await page.evaluate(()=>globeSelected),'no',label+' landscape tap must select true country polygon');
  const targets=await page.locator('#globe-zoom-in, #globe-zoom-out').evaluateAll(all=>all.map(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})));
  assert.ok(targets.every(b=>b.width>=44&&b.height>=44),label+' landscape map zoom targets are too small');
  for(let n=0;n<4;n++)await page.locator('#globe-zoom-in').click();
  assert.ok((await page.evaluate(()=>window.LARIA_ATLAS_PERSPECTIVE.snapshot().zoom))>11,label+' landscape atlas must support deep zoom');
  await page.screenshot({path:path.join(out,label+'-deep-zoom.png'),fullPage:true});
  await page.locator('[data-globe-mode="mine"]').click();
  await page.waitForFunction(()=>window.LARIA_ATLAS_PERSPECTIVE.snapshot().mode==='mine');
  const legend=await page.locator('#globe-legend').boundingBox();
  assert.ok(legend&&legend.x>=map.x+map.width-2,label+' progress legend must stay beside the map in phone landscape');
  await page.screenshot({path:path.join(out,label+'-mine.png'),fullPage:true});
  await page.locator('[data-globe-mode="classic"]').click();
  await page.waitForFunction(()=>document.getElementById('world-screen').dataset.mapPerspective==='globe');
  const sphere=await page.locator('#globe-canvas').boundingBox();
  assert.ok(sphere&&sphere.width>=220&&Math.abs(sphere.width-sphere.height)<3,label+' classic globe too small or stretched in phone landscape: '+JSON.stringify(sphere));
  await page.screenshot({path:path.join(out,label+'-sphere.png'),fullPage:true});
  assert.deepEqual(errors,[],label+' runtime exceptions: '+errors.join(', '));
  await context.close();
 }finally{await browser.close()}
}
(async()=>{
 const {server,url}=await startServer();globalThis.testUrl=url;
 try{
  await run(chromium,'chromium-iphone',{width:390,height:844});
  await run(webkit,'safari-iphone',{width:390,height:844});
  await run(webkit,'safari-ipad',{width:820,height:1180});
  await run(webkit,'safari-ipad-landscape',{width:1180,height:820});
  await runLandscapePhone();
  console.log('ok - actual atlas panorama, accurate country hit, zoom, pan and classic globe');
 }finally{server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
