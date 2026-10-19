'use strict';
/* Real WebKit/Chromium QA for the independent Finn ordene image discovery activity.
 * Runs with the actual app, selected profile fox, local SVG and four original Utforsk cards.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'..');
const dir=process.env.FIND_WORDS_SCREENSHOTS||'/tmp/laria-find-words';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
 '.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json'};
const targetWords=['sol','tre','telt','vann','rev','sekk'];
function seed(avatar){return {version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'Eventyrbarn',avatar,setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
 masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
 lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};}
function serve(){return new Promise((resolve,reject)=>{
 const server=http.createServer((req,res)=>{
  let file=new URL(req.url,'http://127.0.0.1').pathname;
  file=decodeURIComponent(file);
  if(file.endsWith('/'))file+='index.html';
  file=path.resolve(root,'.'+file);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
  fs.readFile(file,(err,buf)=>{if(err){res.writeHead(404);res.end('Not found');return}
   res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
   res.setHeader('Cache-Control','no-store');res.end(buf);
  });
 });
 server.once('error',reject);
 server.listen(0,'127.0.0.1',()=>resolve({server,url:'http://127.0.0.1:'+server.address().port+'/laer-litt-mer/?app=laria'}));
})}
async function shot(page,name){fs.mkdirSync(dir,{recursive:true});await page.screenshot({path:path.join(dir,name+'.png'),animations:'disabled',fullPage:false});}
async function open(page,url){
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>typeof window.openFindTheWords==='function'&&document.querySelector('.bc12-nav [data-camp="explore"]'),{},{timeout:30000});
 await page.locator('.bc12-nav [data-camp="explore"]').click();
 const panel=page.locator('.bc13-panel:not([hidden])');
 await panel.waitFor();
 assert.equal(await panel.locator('.bc13-card').count(),4,'Existing four illustrated Utforsk activities must stay intact');
 const entry=panel.locator('[data-bc13-action="find-words"]');
 assert.ok(await entry.isVisible(),'Find-the-words entry must be visible');
 const dims=await entry.boundingBox();
 assert.ok(dims&&dims.width>=44&&dims.height>=44,'New picture hunt entry must be touch accessible');
 await entry.click();
 await page.locator('#find-the-words-overlay:not([hidden])').waitFor();
}
async function geometry(page,label,view){
 const box=await page.evaluate(()=>{
  const bounds=s=>{const x=document.querySelector(s)?.getBoundingClientRect();return x?{x:x.x,y:x.y,w:x.width,h:x.height,b:x.bottom}:null};
  const el=document.querySelector('.fw-art');
  const img=document.querySelector('.fw-scene-image');
  return {screen:innerWidth,height:innerHeight,scroll:document.documentElement.scrollWidth,
   art:bounds('.fw-art'),list:bounds('.fw-list'),back:bounds('.fw-back'),fox:bounds('.fw-fox'),
   scene:{w:img.naturalWidth,h:img.naturalHeight,complete:img.complete},
   words:[...document.querySelectorAll('.fw-word')].map(x=>x.getBoundingClientRect().height),
   hotspot:[...document.querySelectorAll('.fw-object')].map(x=>{const r=x.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {id:x.dataset.fwObject,w:r.width,h:r.height,centerReachable:hit===x||x.contains(hit)};}),
   active:el?.getAttribute('role')};
 });
 assert.ok(box.art&&box.list&&box.fox&&box.back,'picture game missing art, word list or personal fox '+label);
 assert.ok(box.scene.complete&&box.scene.w===1200&&box.scene.h===720,'illustrated scene failed '+label+': '+JSON.stringify(box.scene));
 assert.ok(box.scroll<=box.screen+3,'horizontal overflow '+label+': '+JSON.stringify(box));
 assert.ok(box.art.x>=-2&&box.art.x+box.art.w<=box.screen+3,'art clipped horizontally '+label);
 assert.ok(box.hotspot.every(b=>b.w>=44&&b.h>=44),'child targets too small '+label+': '+JSON.stringify(box.hotspot));
 assert.ok(box.hotspot.every(b=>b.centerReachable),'overlapping hotspots prevent children from finding an object '+label+': '+JSON.stringify(box.hotspot));
 assert.ok(box.words.every(h=>h>=39),'word-list buttons too small '+label+': '+JSON.stringify(box.words));
 if(view.width>=701&&view.width<=1000&&view.height>view.width){
  assert.ok(box.art.w>=view.width*.83,'iPad portrait art should occupy most of its width: '+JSON.stringify(box));
  assert.ok(box.art.h>=view.height*.32,'iPad portrait art must not be a tiny side card: '+JSON.stringify(box));
  assert.ok(box.art.b<=box.height+2,'iPad portrait art must remain on first screen: '+JSON.stringify(box));
 }
 if(view.width>=361&&view.width<=700&&view.height>=750){
  assert.ok(box.art.h>=245,'Tall phone artwork reverted to its small 5:3 layout: '+JSON.stringify(box));
  assert.ok(box.fox.h>=100,'Child-selected fox is too small on tall phone: '+JSON.stringify(box));
  assert.ok(box.fox.y+box.fox.h<=box.height+2,'Fox companion is pushed below the phone viewport: '+JSON.stringify(box));
 }
 if(view.height>=750&&view.width<700){
  assert.ok(box.list.y>=0&&box.list.b<=box.height,'word list hidden below first screen '+label);
  assert.ok(box.art.y>=0&&box.art.y<=box.height-80,'image cannot be seen without scrolling '+label);
 }
}
async function run(engine,label,viewport,url,avatar){
 const browser=await engine.launch({headless:true,args:label.startsWith('chromium')?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport,hasTouch:true,isMobile:viewport.width<701,serviceWorkers:'block',reducedMotion:'reduce'});
  await context.addInitScript(p=>localStorage.setItem('laerlittmer-v2',JSON.stringify(p)),seed(avatar));
  const page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(String(err)));
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  try{
   await open(page,url);
   await page.locator('.fw-scene-image').evaluate(img=>img.decode());
   await geometry(page,label,viewport);
   const foxSource=await page.locator('.fw-fox').getAttribute('src');
   assert.match(foxSource,avatar==='girl'?/girl-braids-blue-dress/:/boy-adventurer-green-vest/,
     'Picture mode does not use the personal selected fox');
   assert.equal(await page.locator('.fw-word').count(),6);
   assert.deepEqual((await page.locator('.fw-word strong').allTextContents()).sort(),[...targetWords].sort());
   // Browser CI has no guaranteed Norwegian voice; verify speakable controls
   // work without asserting that CI emitted audible Norwegian speech.
   await page.locator('.fw-word[data-fw-read="sol"]').click();
   await page.locator('.fw-audio').click();
   const hint=page.locator('.fw-hint');
   await hint.click();
   assert.match(await page.locator('.fw-speech').innerText(),/Se etter/,'Fox did not offer a clue');
   await page.locator('.fw-fox-button').click();
   assert.equal(await page.locator('.fw-object.is-hint').count(),1,'Second hint should highlight one location');
   assert.equal(await page.locator('.fw-word.is-found').count(),0,'Hint must not automatically solve the game');
   await shot(page,label+'-first-hint');
   // An illustrated object not in the current word list should be explored, not punished.
   // A touch on water must hit the painted lake, not the grassy lower bank.
   const lakePoint=await page.evaluate(()=>{
     const stage=document.querySelector('.fw-art').getBoundingClientRect();
     const water=document.querySelector('[data-fw-object="vann"]').getBoundingClientRect();
     return {x:(water.left+water.width*.5-stage.left)/stage.width,
       y:(water.top+water.height*.5-stage.top)/stage.height};
   });
   assert.ok(lakePoint.x>.59&&lakePoint.x<.75&&lakePoint.y>.60&&lakePoint.y<.76,
     'Water hotspot drifted away from the open lake: '+JSON.stringify(lakePoint));
   await page.locator('.fw-object[data-fw-object="fugl"]').click();
   assert.match(await page.locator('.fw-speech').innerText(),/Du oppdaget/,'Exploration decoy is silent');
   for(const word of targetWords){
    await page.locator('.fw-object[data-fw-object="'+word+'"]').click();
    assert.equal(await page.locator('.fw-word.is-found').count(),targetWords.indexOf(word)+1,
      'Correct picture target did not mark the written word: '+word);
   }
   assert.ok(await page.locator('#find-the-words-overlay').evaluate(el=>el.classList.contains('fw-complete')),
    'Round did not complete');
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('laria-find-words-v1')).rounds),1,
    'Picture round incorrectly counted');

   // The large accessible tree hotspot may extend beyond foliage; its found
   // stamp must still sit on the visible canopy rather than floating in sky.
   const treeStamp=await page.evaluate(()=>{
     const scene=document.querySelector('.fw-art').getBoundingClientRect();
     const p=document.querySelector('[data-fw-object="tre"] .fw-pin').getBoundingClientRect();
     return (p.top+p.height/2-scene.top)/scene.height;
   });
   assert.ok(treeStamp>.25&&treeStamp<.55,'Tree success marker floats outside the canopy: '+treeStamp);
   await shot(page,label+'-all-found');
   await page.locator('.fw-back').click();
   await page.locator('.bc13-panel:not([hidden]) [data-bc13-action="find-words"]').waitFor();
   assert.equal(await page.locator('#find-the-words-overlay:not([hidden])').count(),0,'Picture mode did not close');
   assert.equal(await page.evaluate(()=>document.documentElement.style.overflow),'','Scroll was left locked');
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>typeof window.openFindTheWords==='function');
   await page.locator('.bc12-nav [data-camp="explore"]').click();
   await page.locator('.bc13-panel:not([hidden]) [data-bc13-action="find-words"]').click();
   assert.equal(await page.locator('.fw-word.is-found').count(),6,'Picture word progress was lost on reload');
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('laria-find-words-v1')).rounds),1);
   await page.locator('.fw-next').click();
   assert.equal(await page.locator('.fw-word.is-found').count(),0,'New illustrated round was not reset');
   assert.equal(await page.locator('.fw-word').count(),6);
   await page.locator('.fw-back').click();
   // The separate 6x6 letter-grid mode and its five themes remain available.
   await page.locator('.bc13-panel:not([hidden]) .bc13-card[data-bc13-action="words"]').click();
   const old=page.locator('.word-hunt-theme-picker:not([hidden])');
   await old.waitFor();
   assert.equal(await old.locator('.wh-theme-card').count(),5,'Existing Ordjakt themes regressed');
   assert.deepEqual(errors,[],'Runtime error in '+label);
   console.log('PASS Finn ordene '+label+' '+avatar+' '+viewport.width+'x'+viewport.height);
  }finally{await context.close()}
 }finally{await browser.close()}
}
(async()=>{
 const {server,url}=await serve();
 try{
  await run(chromium,'chromium-ipad-landscape',{width:1180,height:820},url,'girl');
  await run(webkit,'webkit-ipad',{width:820,height:1180},url,'girl');
  await run(webkit,'webkit-iphone',{width:390,height:844},url,'boy');
  await run(webkit,'webkit-small-iphone',{width:320,height:568},url,'girl');
  await run(webkit,'webkit-ipad-landscape',{width:1180,height:820},url,'boy');
 }finally{await new Promise(resolve=>server.close(resolve))}
 console.log('PASS all Læria picture-hunt matrices');
})().catch(err=>{console.error(err);process.exitCode=1});
