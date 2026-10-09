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
  assert.ok(rect.y+rect.height<=card.y-2,label+' atlas collides with country card');
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
  const before=await page.evaluate(()=>window.LARIA_ATLAS_PERSPECTIVE.snapshot());
  await page.locator('#globe-zoom-in').click();
  const after=await page.evaluate(()=>window.LARIA_ATLAS_PERSPECTIVE.snapshot());
  assert.ok(after.zoom>before.zoom,label+' zoom button fails');
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
  await page.screenshot({path:path.join(out,label+'-sphere-retained.png'),fullPage:true});
  await page.locator('[data-globe-mode="explore"]').click();
  assert.equal(await page.locator('#atlas-canvas').isVisible(),true,label+' changing back should restore atlas');
  assert.equal(await page.locator('#world-back').isVisible(),true);
  assert.deepEqual(errors,[],label+' runtime exceptions: '+errors.join(', '));
  fs.writeFileSync(path.join(out,label+'.json'),JSON.stringify({first,after,anchor,moved,rect,viewport},null,2));
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
  console.log('ok - actual atlas panorama, accurate country hit, zoom, pan and classic globe');
 }finally{server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
