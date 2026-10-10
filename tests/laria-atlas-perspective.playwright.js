'use strict';
/* v37 regression: preserve a live globe as default and turn illustration detail on by zoom.
   The file retains its historical name so existing manual CI invocations stay valid. */
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
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(state=>localStorage.setItem('laerlittmer-v2',JSON.stringify(state)),seed);
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  await page.goto(globalThis.testUrl+'?app=laria&globe37='+label,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof openGlobe==='function'&&window.__lariaGlobeV25Installed);
  await page.evaluate(()=>openGlobe());
  await page.waitForFunction(()=>document.getElementById('world-screen')?.classList.contains('active')&&window.__LARIA_GLOBE_V37_FRAME?.version===37);
  assert.equal(await page.locator('#globe-canvas').isVisible(),true,label+' default geography must be a live globe');
  assert.equal(await page.locator('#atlas-canvas').count(),0,label+' old flat atlas must be retired from active app');
  assert.equal(await page.locator('#globe-mode [data-globe-mode]').count(),3,label+' existing three modes must remain');
  const bounding=await page.locator('#globe-canvas').boundingBox();
  assert.ok(bounding.width>270&&Math.abs(bounding.width-bounding.height)<1,label+' must show an undistorted sphere');
  const levels=[];
  for(const [name,z] of [['overview',1],['medium',1.9],['near',3.25]]){
   const frame=await page.evaluate(zoom=>{
    globeLon=15;globeLat=30;setGlobeZoom(zoom);window.drawGlobe();
    const f=window.__LARIA_GLOBE_V37_FRAME,c=document.getElementById('globe-canvas');
    const marks=[...f.land,...f.water,...f.discovery,...f.terrain];
    return {level:f.level,source:f.renderSource,land:f.land.length,water:f.water.length,
      discovery:f.discovery.length,terrain:f.terrain.length,nearAlpha:f.nearAlpha,
      landSize:Math.max(0,...f.land.map(m=>m.size)),discoverySize:Math.max(0,...f.discovery.map(m=>m.size)),
      drift:Math.max(0,...marks.map(m=>{
       const p=globeProject(m.lon,m.lat,c._cssW,c._cssH);
       return p?Math.hypot(p[0]-m.x,p[1]-m.y):1e6;
      }))};
   },z);
   assert.equal(frame.source,'country-geometry',label+' actual country geometry must drive artwork');
   assert.ok(frame.drift<.01,label+' illustrated details drift off geographical coordinates');
   levels.push(frame);
   await page.screenshot({path:path.join(out,label+'-v37-'+name+'.png'),fullPage:true});
  }
  assert.equal(levels[0].land+levels[0].water+levels[0].discovery+levels[0].terrain,0,label+' overview is too busy');
  assert.ok(levels[1].land>=1,label+' zoom needs real forest/mountain illustrations');
  assert.ok(levels[2].nearAlpha>.99,label+' high zoom should reveal local discovery art');
  assert.ok(levels[2].terrain>=1,label+' close zoom needs genuinely geographical local brushwork');
  assert.ok(levels[2].landSize>=15,label+' close zoom needs visible illustrated relief, not pixel-sized triangles');
  assert.ok(levels[2].discoverySize>=18,label+' close zoom needs visible places and objects');
  // Norway is an interior polygon hit. Test the same click and projection.
  const norway=await page.evaluate(()=>{
    globeLon=10.3;globeLat=61.2;setGlobeZoom(2.25);
    const c=document.getElementById('globe-canvas'),p=globeProject(10.3,61.2,c._cssW,c._cssH);
    return {x:p[0],y:p[1],inside:pointInCountry(countries.no,10.3,61.2)};
  });
  assert.ok(norway.inside,label+' Norway sample must be inside true country polygon');
  await page.locator('#globe-canvas').click({position:{x:norway.x,y:norway.y}});
  assert.equal(await page.evaluate(()=>globeSelected),'no',label+' tap on Norway picked a different country');
  for(const mode of ['mine','classic','explore']){
    await page.locator('[data-globe-mode="'+mode+'"]').click();
    assert.ok((await page.locator('[data-globe-mode="'+mode+'"]').getAttribute('class')||'').includes('active'),label+' '+mode+' not selected');
    assert.equal(await page.locator('#globe-canvas').isVisible(),true,label+' sphere must survive switching '+mode);
  }
  const before=await page.evaluate(()=>globeZoom);
  await page.locator('#globe-zoom-in').click();
  const after=await page.evaluate(()=>globeZoom);
  assert.ok(after>before,label+' zoom-in control does not work');
  assert.equal(await page.locator('#random-country').isVisible(),true);
  assert.equal(await page.locator('#reset-globe').isVisible(),true);
  assert.deepEqual(errors,[],label+' uncaught browser errors: '+errors.join(' // '));
  fs.writeFileSync(path.join(out,label+'.json'),JSON.stringify({levels,norway,bounding},null,2));
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
  console.log('ok - v37 zoom-aware geographic globe and correct country taps');
 }finally{server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
