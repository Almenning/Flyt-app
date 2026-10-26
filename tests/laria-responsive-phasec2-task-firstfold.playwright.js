'use strict';
/* Phase C2: a child can read a real multiplication question, see actual
 * counted objects and tap all FOUR choices without scrolling the page.
 * Browser evidence is captured in Chromium and WebKit, not reconstructed. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const out=process.env.LARIA_C2_FIRSTFOLD_IMAGES||'/tmp/laria-c2-firstfold';
const seed={version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'MatteQA',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
 masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
 lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp',
 '.svg':'image/svg+xml','.json':'application/json'};
function serve(){
 return new Promise((resolve,reject)=>{
  const server=http.createServer((req,res)=>{
   let requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   if(requested.endsWith('/'))requested+='index.html';
   const target=path.resolve(root,'.'+requested);
   if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
   fs.readFile(target,(err,data)=>{
    if(err){res.writeHead(404);res.end('Missing');return;}
    res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');
    res.setHeader('Cache-Control','no-store');res.end(data);
   });
  });
  server.once('error',reject);
  server.listen(0,'127.0.0.1',()=>resolve({server,url:'http://127.0.0.1:'+server.address().port+'/laer-litt-mer/?app=laria'}));
 });
}
const shot=async(page,name,fullPage=false)=>page.screenshot({
 path:path.join(out,name+'.png'),fullPage,animations:'disabled',timeout:30000
});
async function open(page,url){
 await page.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed);
 await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
 await page.route('https://api.worldbank.org/**',r=>r.abort());
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.LARIA_MULT_PREMIUM?.version==='illustrated-v2',null,{timeout:18000});
 // Real entry route, matching the child-facing navigation contract.
 // Maths uses Tallvika, so the retired free-practice shortcut is hidden.
 // Reach Gangemagi through the child-facing Utforsk activity route.
 await page.locator('.bc12-nav [data-camp="explore"]').click();
 await page.locator('.bc13-card[data-bc13-action="multiply"]:visible').click();
 await page.locator('#multiplication-lab-screen.active .gm-shell').waitFor({state:'visible'});
 // Validate the retained full classic practice in its own mode, not via the new child start screen.
 await page.evaluate(()=>window.LARIA_MULT_CLASSIC_OPEN());
 await page.locator('.mp-menu-choose').waitFor({state:'visible'});
}
async function layout(page){
 return page.evaluate(()=>{
  const r=q=>{const el=document.querySelector(q),b=el?.getBoundingClientRect();
   return b?{x:b.x,top:b.top,bottom:b.bottom,left:b.left,right:b.right,
    width:b.width,height:b.height}:null;};
  const pic=document.querySelector('.mp-practice-screen .mp-task-apples');
  const workspace=document.querySelector('.mp-practice-workspace');
  const objects=[...document.querySelectorAll('.mp-practice-screen .mp3-item')];
  const fox=document.querySelector('.mp-practice-screen .mp-mascot-small img');
  return {viewport:{width:innerWidth,height:innerHeight},
   overflow:document.documentElement.scrollWidth-innerWidth,
   workspaceDisplay:workspace&&getComputedStyle(workspace).display,
   question:r('.mp-practice-screen .mp-task-wood h2'),
   picture:r('.mp-practice-screen .mp-task-apples'),
   answerHead:r('.mp-practice-screen .mp-answer-head'),
   answerGrid:r('.mp-practice-screen .mp-answer-grid'),
   answers:[...document.querySelectorAll('.mp-practice-screen .mp-answer')].map(el=>{
    const b=el.getBoundingClientRect();return {top:b.top,bottom:b.bottom,width:b.width,height:b.height};}),
   groups:[...document.querySelectorAll('.mp-practice-screen .mp4-basket')].map(el=>{
    const b=el.getBoundingClientRect();return {top:b.top,bottom:b.bottom};}),
   objectCount:objects.length,
   basketCount:document.querySelectorAll('.mp-practice-screen .mp4-basket').length,
   pictureScrollHeight:pic?.scrollHeight||0,
   pictureClientHeight:pic?.clientHeight||0,
   foxExists:!!fox,foxLoaded:!!(fox?.complete&&fox.naturalWidth>0)};
 });
}
async function checkQuestion(page,label,large){
 if(large)await page.waitForFunction(()=>{
  const img=document.querySelector('.mp-practice-screen .mp-mascot-small img');
  return !!(img?.complete&&img.naturalWidth>0);
 },null,{timeout:10000});
 const state=await page.evaluate(()=>window.LARIA_MULT_PREMIUM.snapshot());
 const q=state.round[state.index];
 const g=await layout(page);
 assert.ok(g.question&&g.picture&&g.answerGrid,
  label+' missing question, artwork or answers '+JSON.stringify(g));
 assert.equal(g.basketCount,q.a,label+' number of real groups changed');
 assert.equal(g.objectCount,q.a*q.b,label+' counted objects do not equal question');
 assert.equal(g.answers.length,4,label+' missing one of four options');
 assert(g.answers.every(b=>b.height>=44&&b.width>=44),
  label+' undersized answer touch targets '+JSON.stringify(g.answers));
 assert(g.foxExists&&(!large||g.foxLoaded),label+' selected fox is missing');
 assert(g.overflow<=3,label+' unexpected document overflow '+JSON.stringify(g));
 if(large){
  const h=g.viewport.height;
  assert.equal(g.workspaceDisplay,'grid',label+' not using two-column iPad scene');
  assert(g.question.top>=0&&g.question.bottom<=h-5,label+' question is below first viewport '+JSON.stringify(g));
  assert(g.picture.top>=0&&g.picture.top<h-90&&g.picture.height>=185,
   label+' counted picture is not visibly alongside answers '+JSON.stringify(g));
  assert(g.answerGrid.left>g.picture.right-4,label+' choices not beside illustration '+JSON.stringify(g));
  assert(g.answers.every(b=>b.top>=0&&b.bottom<=h-5),
   label+' child must scroll to reach the four choices '+JSON.stringify(g));
  if(q.a===5){
   assert(g.groups.every(b=>b.top>=g.picture.top-4&&b.bottom<=g.picture.bottom+4),
    label+' five mathematical baskets must all fit in the visible illustration '+JSON.stringify(g));
  }
 }else{
  assert.equal(g.workspaceDisplay,'contents',label+' portrait/phone layout was changed');
 }
 await fs.promises.writeFile(path.join(out,label+'-geometry.json'),
  JSON.stringify({equation:q,layout:g},null,2));
 await shot(page,label+'-01-first-viewport');
 // Every group must remain reachable in the illustrated subregion, including
 // scenarios with ten groups, without scrolling the entire answer pane.
 if(large){
  const bottom=await page.evaluate(()=>{
   const pic=document.querySelector('.mp-practice-screen .mp-task-apples');
   const last=pic.querySelector('.mp4-basket:last-child');
   pic.scrollTop=pic.scrollHeight;
   const b=pic.getBoundingClientRect(),t=last.getBoundingClientRect();
   return {scrollTop:pic.scrollTop,scrollHeight:pic.scrollHeight,clientHeight:pic.clientHeight,
     lastTop:t.top,lastBottom:t.bottom,containerTop:b.top,containerBottom:b.bottom};
  });
  const endReachable=bottom.lastTop<bottom.containerBottom+10&&
    bottom.lastBottom>bottom.containerTop;
  assert(endReachable,label+' last counted group inaccessible in scroll region '+JSON.stringify(bottom));
  await shot(page,label+'-02-last-counted-group');
  assert((await layout(page)).answers.every(x=>x.bottom<=g.viewport.height-5),
   label+' scrolling baskets moved answer buttons out of viewport');
 }
 return q;
}
async function run(browserType,label,viewport,url,large=true){
 const browser=await browserType.launch({headless:true,args:browserType===chromium?['--no-sandbox']:[]});
 let ctx;
 try{
  ctx=await browser.newContext({viewport,hasTouch:true,isMobile:viewport.width<700,
   serviceWorkers:'block',deviceScaleFactor:1,reducedMotion:'reduce'});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await open(page,url+'&c2='+label);
  await page.locator('.mp-menu-choose').click();
  await page.locator('.mp-table-choice[data-table="5"]').click();
  await page.locator('.mp-practice-screen').waitFor();
  const first=await checkQuestion(page,label+'-five-times',large);
  // Actually exercise one response, with the established learning mechanics.
  const correct=first.a*first.b;
  await page.locator('.mp-answer[data-value="'+correct+'"]').click();
  assert.equal(await page.locator('.mp-next').count(),1,label+' correct answer did not progress');
  await page.locator('.mp-next').click();
  assert.equal((await page.evaluate(()=>window.LARIA_MULT_PREMIUM.snapshot())).index,1,
   label+' next question did not advance');
  await page.locator('.mp-back').click();
  await page.locator('.mp-menu-choose').click();
  await page.locator('.mp-table-choice[data-table="10"]').click();
  await page.locator('.mp-practice-screen').waitFor();
  await checkQuestion(page,label+'-ten-groups',large);
  // 10x10 free exploration remains present, original maths stays untouched.
  await page.locator('.mp-back').click();
  await page.locator('.mp-menu-explore').click();
  await page.locator('.mp-explore-screen').waitFor();
  assert.equal(await page.locator('.mp-grid-cell').count(),100,label+' 10×10 table changed');
  assert.deepEqual(errors,[],label+' runtime errors');
  console.log('PASS '+label+' '+viewport.width+'x'+viewport.height+
   ' first fold, real counted objects, four answers, fox, 10×10, no overflow');
 }finally{if(ctx)await ctx.close();await browser.close();}
}
(async()=>{
 const {server,url}=await serve();
 try{
  await fs.promises.mkdir(out,{recursive:true});
  await run(webkit,'webkit-ipad-1180',{width:1180,height:820},url,true);
  await run(webkit,'webkit-ipad-1024',{width:1024,height:768},url,true);
  await run(chromium,'chromium-ipad-1180',{width:1180,height:820},url,true);
  await run(webkit,'webkit-mac-1440',{width:1440,height:900},url,true);
  await run(webkit,'webkit-ipad-portrait',{width:820,height:1180},url,false);
  await run(webkit,'webkit-iphone-portrait',{width:390,height:844},url,false);
  await run(webkit,'webkit-iphone-landscape',{width:844,height:390},url,false);
 }finally{await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1});
