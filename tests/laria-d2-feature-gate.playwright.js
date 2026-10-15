'use strict';
/* D2 release gate: all four 941px art files decode before ANY journey gets a
 * painted extension. Original map, five hits, personal fox and route unchanged.
 * These test image responses are MOCKS; passing is not visual approval. */
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const http=require('node:http');
const {webkit,chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
const seed={
 version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'D2QA',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
 masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
 lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null
};
const asset='/laer-litt-mer/assets/locked-journey-ground/';
const artNames=['bokskogen','tallenga','ordlandsbyen','nordlysleiren'];
const fixture=fs.readFileSync(path.join(root,'laer-litt-mer/locked-journeys/tallenga-fox-free-20261011.webp'));
async function serve(){
 return new Promise((resolve,reject)=>{
  const server=http.createServer((req,res)=>{
   let filename=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   if(filename.endsWith('/'))filename+='index.html';
   filename=path.resolve(root,'.'+filename);
   if(!filename.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
   fs.readFile(filename,(err,buf)=>{
    if(err){res.writeHead(404);res.end('Missing');return;}
    res.setHeader('Content-Type',mime[path.extname(filename)]||'application/octet-stream');
    res.setHeader('Cache-Control','no-store');res.end(buf);
   });
  });
  server.once('error',reject);
  server.listen(0,'127.0.0.1',()=>resolve({server,url:'http://127.0.0.1:'+server.address().port+'/laer-litt-mer/?app=laria'}));
 });
}
async function openMath(page,url){
 await page.goto(url+'&d2-release-gate=1',{waitUntil:'domcontentloaded'});
 await page.locator('.bc14-subject[data-camp="subject-math"]:visible').click();
 await page.locator('#subject-screen.active .locked-journey-map[data-journey-subject="math"]').waitFor();
 await page.waitForFunction(()=>{
  const img=document.querySelector('.screen.active .locked-journey-image');
  return img?.complete&&img.naturalWidth===941&&img.naturalHeight===1672&&
   !document.querySelector('.screen.active .locked-journey-art-guard');
 },{timeout:25000});
}
async function inspect(page){
 return page.evaluate(()=>{
  const map=document.querySelector('.screen.active.locked-journey-active .locked-journey-map');
  const board=map.querySelector('.locked-journey-board');
  return {
   ready:map.classList.contains('laria-d2-terrain-ready'),
   marginBottom:getComputedStyle(map).marginBottom,
   boardRatio:board.getBoundingClientRect().width/board.getBoundingClientRect().height,
   hits:map.querySelectorAll('.locked-journey-hotspot').length,
   fox:map.querySelectorAll('.locked-journey-traveler[data-avatar="girl"]').length,
   after:getComputedStyle(map,'::after').backgroundImage,
   width:innerWidth,height:innerHeight
  };
 });
}
async function scenario(browser,label,url,flag,missing,viewport){
 const context=await browser.newContext({viewport,isMobile:true,hasTouch:true,
  serviceWorkers:'block',deviceScaleFactor:1,reducedMotion:'reduce'});
 const page=await context.newPage();
 const calls=[],errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await context.addInitScript(({seed,flag})=>{
  localStorage.setItem('laerlittmer-v2',JSON.stringify(seed));
  if(flag)window.LARIA_D2_ART_APPROVED=true;
 },{seed,flag});
 await page.route('**/assets/locked-journey-ground/*.webp',async route=>{
  const name=artNames.find(x=>route.request().url().includes(x+'-ground-v1.webp'));
  calls.push(name||'unexpected');
  if(name===missing)await route.fulfill({status:404,body:'Missing'});
  else await route.fulfill({status:200,contentType:'image/webp',body:fixture});
 });
 await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
 await page.route('https://api.worldbank.org/**',r=>r.abort());
 try{
  await openMath(page,url);
  if(flag&&viewport.width<700&&viewport.height>viewport.width){
   await page.waitForFunction(()=>performance.getEntriesByType('resource')
    .filter(x=>x.name.includes('/assets/locked-journey-ground/')).length>=4,
    {timeout:12000}).catch(()=>{});
   // The generated test route serves four separate image onload/error signals.
   if(!missing)await page.waitForFunction(()=>document.querySelector('.screen.active .locked-journey-map')
    ?.classList.contains('laria-d2-terrain-ready'),{timeout:12000});
   else await page.waitForTimeout(450);
  }
  const g=await inspect(page);
  const shouldActivate=flag&&!missing&&viewport.width<700&&viewport.height>viewport.width;
  assert.equal(g.ready,shouldActivate,label+' wrong all-or-nothing art state '+JSON.stringify({g,calls}));
  assert(Math.abs(g.boardRatio-941/1672)<.003,label+' original artwork proportions changed');
  assert.equal(g.hits,5,label+' hotspots changed');
  assert.equal(g.fox,1,label+' selected fox changed');
  if(!shouldActivate){
   assert.equal(g.marginBottom,'0px',label+' empty art slot caused ghost space');
  }else{
   const want=viewport.height-viewport.width*1672/941;
   const got=Number.parseFloat(g.marginBottom);
   assert(Math.abs(got-want)<3,label+' wrong remaining scene height '+JSON.stringify({want,got}));
   assert(g.after.includes('tallenga-ground-v1.webp'),
    label+' wrong painted asset '+g.after);
   assert(artNames.every(n=>calls.includes(n)),label+' not all four files checked '+calls);
  }
  if(!flag||viewport.width>=700||viewport.height<viewport.width){
   assert.equal(calls.length,0,label+' unused terrain requested');
  }
  assert.deepEqual(errors,[],label+' page JS error '+errors);
  console.log('PASS '+label+' all-or-nothing, original geometry, no 404 leakage');
 }finally{await context.close();}
}
(async()=>{
 const {server,url}=await serve();
 try{
  for(const [engine,label] of [[webkit,'webkit'],[chromium,'chromium']]){
   const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
   try{
    const phone={width:390,height:844};
    await scenario(browser,label+'-flag-off',url,false,null,phone);
    await scenario(browser,label+'-one-of-four-missing',url,true,'nordlysleiren',phone);
    await scenario(browser,label+'-all-four-mocked',url,true,null,phone);
    await scenario(browser,label+'-landscape-stays-off',url,true,null,{width:844,height:390});
    await scenario(browser,label+'-ipad-stays-off',url,true,null,{width:820,height:1180});
   }finally{await browser.close();}
  }
 }finally{await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1});
