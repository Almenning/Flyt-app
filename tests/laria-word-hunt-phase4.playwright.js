'use strict';
/* Phase 4C: real Chromium/WebKit touch and pointer QA for Læria Ordjakt.
   Test the opening viewport, counted letter cells, selected fox, free play,
   touch endpoint taps, real pointer drag, completion, persistence and return.
   No test-only helpers are added to production code. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium,webkit}=require('playwright');
const base=path.resolve(__dirname,'..');
const out=process.env.WORD_HUNT_QA_SCREENSHOTS||'/tmp/laria-wordhunt-phase4';
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Elev',avatar:'girl',setupVersion:2},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
function serve(){return new Promise((resolve,reject)=>{
 const srv=http.createServer((req,res)=>{
  let requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(requested.endsWith('/'))requested+='index.html';
  const file=path.resolve(base,'.'+requested);
  if(!file.startsWith(base+path.sep)){res.writeHead(403);res.end();return}
  fs.readFile(file,(err,buf)=>{if(err){res.writeHead(404);res.end('Not found');return}
   res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
   res.setHeader('Cache-Control','no-store');res.end(buf)});
 });
 srv.once('error',reject);
 srv.listen(0,'127.0.0.1',()=>resolve({srv,url:'http://127.0.0.1:'+srv.address().port+'/laer-litt-mer/?app=laria'}));
})}
async function shot(page,label){
 await fs.promises.mkdir(out,{recursive:true});
 await page.screenshot({path:path.join(out,label+'.png'),animations:'disabled',fullPage:false});
}
const cell=(page,rc)=>page.locator('.word-hunt-cell[data-r="'+rc[0]+'"][data-c="'+rc[1]+'"]');
async function open(page,url){
 await page.addInitScript(p=>localStorage.setItem('laerlittmer-v2',JSON.stringify(p)),seed);
 await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
 await page.route('https://api.worldbank.org/**',r=>r.abort());
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>typeof window.openWordHunt==='function'&&document.querySelector('.bc12-nav [data-camp="explore"]'),{},{timeout:25000});
 // The actual child-facing Utforsk is the premium BC13 chooser. Its
 // four storybook cards intentionally cover the retired Basecamp pin buttons.
 await page.locator('.bc12-nav [data-camp="explore"]').first().click();
 const chooser=page.locator('.bc13-panel:not([hidden])');
 await chooser.waitFor({state:'visible'});
 assert.equal(await page.locator('.bc12').getAttribute('data-bc13-view'),'explore');
 for(const action of ['words','globe','fraction','multiply']){
  const card=chooser.locator('.bc13-card[data-bc13-action="'+action+'"]');
  assert.ok(await card.isVisible(),'Young Utforsk hides its premium '+action+' activity card');
 }
 await chooser.locator('.bc13-card[data-bc13-action="words"]').click();
 await page.locator('#word-hunt-overlay:not([hidden]) .word-hunt-cell').first().waitFor();
}
async function geometry(page,label,viewport,firstFold){
 const m=await page.evaluate(()=>{
  const rect=q=>{const el=document.querySelector(q);if(!el)return null;
   const r=el.getBoundingClientRect();return {top:Math.round(r.top),bottom:Math.round(r.bottom),left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width),height:Math.round(r.height)}};
  const cells=[...document.querySelectorAll('#word-hunt-overlay .word-hunt-cell')].map(el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height}});
  return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,
   targets:rect('.word-hunt-targets'),board:rect('.word-hunt-board-card'),grid:rect('.word-hunt-board'),
   back:rect('.word-hunt-back'),cells,fox:rect('.word-hunt-fox')};
 });
 console.log('WORD_HUNT_VIEWPORT '+label+': '+JSON.stringify({width:m.width,height:m.height,targets:m.targets,board:m.board,minCell:Math.min(...m.cells.map(c=>c.width)),overflow:m.scrollWidth}));
 assert.ok(m.board&&m.targets&&m.fox,label+' missing board/list/selected fox');
 assert.ok(m.scrollWidth<=m.width+3,label+' horizontal overflow: '+JSON.stringify(m));
 assert.ok(m.back.width>=44&&m.back.height>=44,label+' return target too small');
 if(firstFold){
  assert.ok(m.targets.top>=0&&m.targets.bottom<=m.height,label+' word list must be visible on first screen: '+JSON.stringify(m));
  assert.ok(m.board.top>=0&&m.board.bottom<=m.height,label+' letter board must be visible on first screen: '+JSON.stringify(m));
 }
 if(viewport.width<=700 && m.cells.length===36){
  assert.ok(m.cells.every(x=>x.width>=44&&x.height>=44),label+' easy cells under 44px: '+JSON.stringify(m));
 }
}
async function pathFor(page,word){
 const found=await page.evaluate(w=>{
  const grid=[...document.querySelectorAll('.word-hunt-cell')].reduce((o,el)=>{
   const r=Number(el.dataset.r),c=Number(el.dataset.c);(o[r]||(o[r]=[]))[c]=el.textContent.trim();return o
  },[]);
  const dirs=[[0,1],[1,0],[0,-1],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];
  for(let r=0;r<grid.length;r++)for(let c=0;c<grid[r].length;c++)for(const [dr,dc] of dirs){
   const endR=r+dr*(w.length-1),endC=c+dc*(w.length-1);
   if(endR<0||endC<0||endR>=grid.length||endC>=grid[r].length)continue;
   let wordMade='';for(let i=0;i<w.length;i++)wordMade+=grid[r+dr*i][c+dc*i];
   if(wordMade===w)return {start:[r,c],end:[endR,endC]};
  }
  return null;
 },word);
 assert.ok(found,'Placed word '+word+' was not found in the visible board');
 return found;
}
async function tapWord(page,word){
 const p=await pathFor(page,word);
 await cell(page,p.start).tap();
 await cell(page,p.end).tap();
}
async function dragWord(page,word){
 const p=await pathFor(page,word);
 await cell(page,p.start).scrollIntoViewIfNeeded();
 const a=await cell(page,p.start).boundingBox(),b=await cell(page,p.end).boundingBox();
 assert.ok(a&&b,'Missing drag endpoints for '+word);
 await page.mouse.move(a.x+a.width/2,a.y+a.height/2);
 await page.mouse.down();
 await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:Math.max(6,word.length+2)});
 await page.mouse.up();
}
async function testView(browser,engine,label,viewport,url){
 const ctx=await browser.newContext({viewport,deviceScaleFactor:1,serviceWorkers:'block',isMobile:viewport.width<900,hasTouch:true});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 try{
  await open(page,url);
  assert.equal(await page.locator('.word-hunt-cell').count(),36,label+' easy puzzle not 6x6');
  assert.equal(await page.locator('.word-hunt-word').count(),4,label+' easy puzzle not 4 words');
  const fox=await page.locator('.word-hunt-fox').evaluate(el=>({src:el.getAttribute('src'),expected:window.LARIA_FOX.source(window.LARIA_FOX.choice()),complete:el.complete,naturalWidth:el.naturalWidth}));
  assert.equal(fox.src,fox.expected,label+' did not use child-selected persistent fox');
  await page.locator('.word-hunt-fox').evaluate(img=>img.decode());
  await shot(page,label+'-01-words-and-board');
  await geometry(page,label,viewport,viewport.width<=700||viewport.height<=500);
  const words=await page.locator('.word-hunt-word').allTextContents();
  for(let i=0;i<words.length;i++){
   const word=words[i].replace(/^✓\s*/,'').trim();
   if(i===1)await dragWord(page,word);else await tapWord(page,word);
   assert.equal(await page.locator('.word-hunt-word.found').count(),i+1,label+' missed '+word+' by touch or drag');
  }
  assert.match(await page.locator('.word-hunt-status').innerText(),/Ordjakten er løst/);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('laria-wordhunt-v1')||'{}').rounds),1,label+' no persisted completion');
  await shot(page,label+'-02-complete');
  await page.locator('.word-hunt-level[data-word-level="hard"]').click();
  assert.equal(await page.locator('.word-hunt-cell').count(),49,label+' harder puzzle not 7x7');
  assert.equal(await page.locator('.word-hunt-word').count(),5,label+' harder puzzle not 5 words');
  await tapWord(page,(await page.locator('.word-hunt-word').first().innerText()).trim());
  assert.equal(await page.locator('.word-hunt-word.found').count(),1,label+' harder puzzle touch selection failed');
  await shot(page,label+'-03-harder');
  await page.locator('.word-hunt-back').click();
  assert.equal(await page.locator('#word-hunt-overlay:not([hidden])').count(),0,label+' did not close');
  assert.equal(await page.evaluate(()=>document.documentElement.style.overflow),'',label+' scroll lock not restored');
  const returned=page.locator('.bc13-panel:not([hidden]) .bc13-card[data-bc13-action="words"]');
  await returned.waitFor({state:'visible'});
  assert.equal(await page.locator('.bc12').getAttribute('data-bc13-view'),'explore',
   label+' return must restore actual Utforsk chooser, not silently reset to Home');
  assert.ok(await returned.evaluate(el=>document.activeElement===el),
   label+' returning child loses keyboard/screen-reader focus instead of receiving new Word Hunt card');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('laria-wordhunt-v1')||'{}').rounds),1,label+' completion not saved on return');
  await page.reload({waitUntil:'domcontentloaded'});
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('laria-wordhunt-v1')||'{}').rounds),1,label+' completion lost on reload');
  assert.deepEqual(errors,[],label+' runtime JS errors');
  console.log('PASS '+engine+' '+label+' board, touch endpoints, real pointer drag, personal fox, completion and return');
 }finally{await ctx.close()}
}
(async()=>{
 const {srv,url}=await serve();
 try{
  for(const [engine,launcher,views] of [
   ['chromium',chromium,[['iphone',{width:390,height:844}],['iphone-tiny',{width:320,height:568}],['ipad',{width:820,height:1180}]]],
   ['webkit',webkit,[['iphone-safari',{width:390,height:844}],['iphone-tiny-safari',{width:320,height:568}],['iphone-landscape-safari',{width:844,height:390}],['ipad-safari',{width:820,height:1180}],['ipad-landscape-safari',{width:1180,height:820}]]]
  ]){
   const browser=await launcher.launch({headless:true});
   try{for(const [label,viewport] of views)await testView(browser,engine,label,viewport,url)}
   finally{await browser.close()}
  }
  console.log('PASS complete Læria Word Hunt phase4 Chromium/WebKit matrix');
 }finally{await new Promise(resolve=>srv.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
