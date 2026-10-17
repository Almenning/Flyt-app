'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {webkit,chromium}=require('playwright');

const root=path.resolve(__dirname,'..','laer-litt-mer');
const out=process.env.DISCOVERY_GLOBE_SCREENSHOTS||path.resolve('/tmp/laria-discovery-globe-phase1');
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json'};
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'GlobeQA',avatar:'girl',setupVersion:2},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
async function serve(){const server=http.createServer((req,res)=>{const part=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+(part==='/'?'/index.html':part));if(!file.startsWith(root)){res.writeHead(403);return res.end()}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end()}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(data)})});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return {server,url:'http://127.0.0.1:'+server.address().port+'/?app=laria&discovery-globe-preview=1'}}
async function run(engine,label,viewport){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 try{const ctx=await browser.newContext({viewport,isMobile:viewport.width<600,hasTouch:true,serviceWorkers:'block',deviceScaleFactor:1});const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.addInitScript(value=>localStorage.setItem('laerlittmer-v2',JSON.stringify(value)),seed);await page.route('https://raw.githubusercontent.com/**',r=>r.abort());await page.route('https://api.worldbank.org/**',r=>r.abort());await page.goto(globalThis.__discoveryUrl,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof openGlobe==='function');await page.evaluate(()=>openGlobe('classic'));await page.waitForFunction(()=>document.getElementById('world-screen')?.classList.contains('active'));
  await page.waitForFunction(()=>document.getElementById('globe-canvas')?._cssW>0&&window.drawGlobe===window.LARIA_DISCOVERY_GLOBE_DRAW&&document.getElementById('globe-canvas')?.dataset.discoveryRenderer==='live',{timeout:15000});
  const captures=[['world',15,18,1],['europe',15,50,2.1],['norway',8,62,3.5],['japan',138,36,3.6],['brazil',-55,-12,3.2]];
  for(const [name,lon,lat,zoom] of captures){await page.evaluate(({lon,lat,zoom})=>{window.__lariaGlobeInteracting=false;globeLon=lon;globeLat=lat;setGlobeZoom(zoom);drawGlobe()},{lon,lat,zoom});await page.waitForTimeout(280);const data=await page.evaluate(()=>({level:document.getElementById('world-screen').dataset.discoveryGlobeLevel,ready:document.getElementById('globe-canvas').dataset.ready,renderer:window.drawGlobe===window.LARIA_DISCOVERY_GLOBE_DRAW,landmarks:Number(document.getElementById('globe-canvas').dataset.discoveryLandmarks||0),moving:document.getElementById('globe-canvas').dataset.discoveryMoving,canvas:[globeLon,globeLat,globeZoom]}));assert.ok(['1','2','3'].includes(data.level),'missing detail level');assert.equal(data.renderer,true,'atlas router replaced isolated discovery renderer');assert.equal(data.moving,'false','settled capture was incorrectly treated as moving');assert.ok(data.landmarks>0,'settled capture painted no geographically anchored illustrations');await page.screenshot({path:path.join(out,label+'-'+name+'.png'),fullPage:false,animations:'disabled'});}
  const selected=await page.evaluate(()=>{selectGlobeCountry('no');return [globeSelected,globeLon,globeLat]});assert.equal(selected[0],'no','country selection changed by paint layer');
  assert.deepEqual(errors,[],label+' page errors: '+errors.join('; '));await ctx.close();console.log('PASS discovery globe',label);
 }finally{await browser.close()}
}
(async()=>{const {server,url}=await serve();globalThis.__discoveryUrl=url;try{for(const row of [[webkit,'webkit-iphone',{width:390,height:844}],[webkit,'webkit-ipad-landscape',{width:1180,height:820}],[chromium,'chromium-ipad-landscape',{width:1180,height:820}]])await run(...row)}finally{await new Promise(resolve=>server.close(resolve))}})().catch(error=>{console.error(error);process.exitCode=1});
