'use strict';
/* Phase C: real responsive Gangetabellen, WebKit and Chromium.
 * Confirm that landscape tablets/desktops have a full-width illustrated
 * stage, while iPhone and iPad portrait preserve the previous geometry. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {webkit,chromium}=require('playwright');

const root=path.resolve(__dirname,'..');
const out=process.env.LARIA_RESPONSIVE_PHASEC_IMAGES||'/tmp/laria-responsive-phasec';
const seed={
 version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'MatteQA',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
 masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
 lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null
};
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp',
 '.svg':'image/svg+xml','.json':'application/json'};
function serve(){
 return new Promise((resolve,reject)=>{
  const server=http.createServer((req,res)=>{
   let file=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
   if(file.endsWith('/'))file+='index.html';
   file=path.resolve(root,'.'+file);
   if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
   fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404);res.end('Missing');return;}
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
    res.setHeader('Cache-Control','no-store');
    res.end(data);
   });
  });
  server.once('error',reject);
  server.listen(0,'127.0.0.1',()=>{
   resolve({server,url:'http://127.0.0.1:'+server.address().port+'/laer-litt-mer/?app=laria'});
  });
 });
}
async function photo(page,name){
 await fs.promises.mkdir(out,{recursive:true});
 await page.screenshot({path:path.join(out,name+'.png'),fullPage:true,animations:'disabled',timeout:20000});
}
async function openLab(page,url){
 await page.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed);
 await page.route('https://raw.githubusercontent.com/**',route=>route.abort());
 await page.route('https://api.worldbank.org/**',route=>route.abort());
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.LARIA_MULT_PREMIUM?.version==='illustrated-v2',null,{timeout:16000});
 // Enter through the real child-facing Basecamp/Utforsk route, so the back
 // path is the same one a child gets rather than the API's Maths fallback.
 await page.locator('.bc14-free:visible').click();
 await page.locator('.bc13-card[data-bc13-action="multiply"]:visible').click();
 await page.locator('#multiplication-lab-screen.active .mp-home-screen').waitFor({timeout:12000});
}
async function geometry(page){
 return page.evaluate(()=>{
  const rect=el=>{
   if(!el)return null;
   const r=el.getBoundingClientRect();
   return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};
  };
  const app=document.querySelector('.app');
  const screen=document.querySelector('#multiplication-lab-screen.active');
  const shell=screen?.querySelector('.mp-shell');
  const main=screen?.querySelector('.mp-main');
  const cards=[...screen.querySelectorAll('.mp-home-screen .mp-menu-card')];
  const back=screen.querySelector('#multiplication-lab-back');
  return {
   viewport:{width:innerWidth,height:innerHeight},
   app:rect(app),screen:rect(screen),shell:rect(shell),main:rect(main),
   back:rect(back),cards:cards.map(rect),
   appBottomPadding:getComputedStyle(app).paddingBottom,
   shellBackground:getComputedStyle(shell).backgroundImage,
   horizontalOverflow:document.documentElement.scrollWidth-innerWidth,
   foxCount:[...screen.querySelectorAll('.mp-mascot img')].filter(i=>i.complete&&i.naturalWidth>0).length
  };
 });
}
async function validateHome(page,label,view,large){
 const g=await geometry(page);
 const w=view.width;
 assert(g.app&&g.shell&&g.main&&g.cards.length===3,label+' missing premium maths scene '+JSON.stringify(g));
 assert(g.horizontalOverflow<=3,label+' horizontal overflow '+JSON.stringify(g));
 assert(g.cards.every(x=>x.width>=190&&x.height>=150&&x.x>=g.main.x-3&&x.right<=g.main.right+3),
  label+' menu cards escaped illustration surface '+JSON.stringify(g));
 assert(g.foxCount>=1,label+' chosen fox failed to load '+JSON.stringify(g));
 if(large){
  assert(g.app.width>=w-2&&g.screen.width>=w-2&&g.shell.width>=w-2,
   label+' still displaying the old narrow app shell '+JSON.stringify(g));
  assert(g.main.width>=900,label+' workshop not using available iPad/Mac width '+JSON.stringify(g));
  assert(g.shellBackground.includes('matte-verden.png'),
   label+' missing warm illustrated landscape atmosphere '+JSON.stringify(g));
  assert(g.appBottomPadding==='0px',label+' old navigation blank space remained');
 }else if(w===820){
  assert(g.app.width<=780,label+' iPad portrait should keep its approved composition '+JSON.stringify(g));
 }else if(w===844){
  assert(g.app.width<=780,label+' short landscape iPhone must not use tablet stage '+JSON.stringify(g));
 }else {
  assert(g.app.width<=w+2,label+' portrait phone overflows '+JSON.stringify(g));
 }
 await fs.promises.writeFile(path.join(out,label+'-geometry.json'),JSON.stringify(g,null,2));
 await photo(page,label+'-01-home');
}
async function run(engine,label,view,url){
 const large=view.width>=1000&&view.height>=540&&view.width>view.height;
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 let context;
 try{
  context=await browser.newContext({
   viewport:{width:view.width,height:view.height},
   isMobile:!!view.mobile,hasTouch:true,deviceScaleFactor:1,
   serviceWorkers:'block',reducedMotion:'reduce'
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await openLab(page,url+'&phasec='+label);
  await validateHome(page,label,view,large);
  // The responsive wrapper must never alter mathematical groups or answers.
  await page.locator('.mp-menu-choose').click();
  await page.locator('.mp-table-choice[data-table="5"]').first().click();
  await page.locator('.mp-practice-screen').waitFor();
  const snapshot=await page.evaluate(()=>window.LARIA_MULT_PREMIUM.snapshot());
  const q=snapshot.round[snapshot.index];
  assert(q.a===5,label+' chosen table did not persist');
  assert.equal(await page.locator('.mp-answer').count(),4,label+' missing answer options');
  assert.equal(await page.locator('.mp3-item').count(),q.a*q.b,label+' illustrated totals changed');
  const buttons=await page.locator('.mp-answer').evaluateAll(xs=>xs.map(x=>{
   const r=x.getBoundingClientRect();
   return {width:r.width,height:r.height};
  }));
  assert(buttons.every(x=>x.width>=44&&x.height>=44),
   label+' undersized answer touch targets '+JSON.stringify(buttons));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3),
   label+' practice has horizontal overflow');
  await photo(page,label+'-02-practice');
  await page.locator('.mp-back').click();
  await page.locator('.mp-menu-explore').click();
  await page.locator('.mp-explore-screen').waitFor();
  assert.equal(await page.locator('.mp-grid-cell').count(),100,
   label+' 10x10 exploration is missing');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3),
   label+' exploration has horizontal overflow');
  await photo(page,label+'-03-explore');
  // The header back button first returns from free exploration to the
  // Gangetabellen hub, then from that hub to Læria Basecamp.
  await page.locator('.mp-back').click();
  await page.locator('.mp-home-screen').waitFor({timeout:10000});
  await page.locator('#multiplication-lab-back').click();
  await page.locator('#home-screen.active').waitFor({timeout:10000});
  assert.deepEqual(errors,[],label+' runtime errors');
  console.log('PASS '+label+' width '+view.width+' fullscreen landscape='+large+
   ': atmosphere, maths, fox, touches, 10x10, return, overflow');
 }finally{
  if(context)await context.close();
  await browser.close();
 }
}
(async()=>{
 const {server,url}=await serve();
 try{
  await fs.promises.mkdir(out,{recursive:true});
  await run(webkit,'webkit-ipad-landscape',{width:1180,height:820},url);
  await run(webkit,'webkit-small-ipad-landscape',{width:1024,height:768},url);
  await run(chromium,'chromium-ipad-landscape',{width:1180,height:820},url);
  await run(webkit,'webkit-mac',{width:1440,height:900},url);
  await run(chromium,'chromium-mac',{width:1440,height:900},url);
  await run(webkit,'webkit-ipad-portrait',{width:820,height:1180},url);
  await run(webkit,'webkit-iphone-portrait',{width:390,height:844,mobile:true},url);
  await run(webkit,'webkit-iphone-landscape',{width:844,height:390,mobile:true},url);
 }finally{await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1});
