'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium,webkit}=require('playwright');
const base=path.resolve(__dirname,'..');
const dir=process.env.QA_SCREENSHOTS||'/tmp/laria-magical-book-v2';
function serve(){return new Promise((resolve,reject)=>{
 const s=http.createServer((req,res)=>{
  const raw=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(base,'.'+(raw.endsWith('/')?raw+'index.html':raw));
  if(!file.startsWith(base+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(err,data)=>{
   if(err){res.writeHead(404);res.end();return;}
   const ext=path.extname(file),mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
   res.setHeader('Content-Type',mime[ext]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(data);
  });
 });s.once('error',reject);s.listen(0,'127.0.0.1',()=>resolve({server:s,url:'http://127.0.0.1:'+s.address().port+'/laer-litt-mer/?app=laria'}));
});}
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Eventyrbarn',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},
 preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{'math:2:talldalen':{attempts:1}},gradeWins:{},viewGrades:{}},
 answerLog:Array.from({length:13},(_,i)=>({at:i+1,subject:'math',correct:true,countsForLearning:true,questionKey:'visual-'+i})),sessionLog:[],activeSession:null};
async function capture(page,name){await fs.promises.mkdir(dir,{recursive:true});await page.screenshot({path:path.join(dir,name+'.png'),fullPage:false,animations:'disabled'});}
async function run(browserType,label,viewport){
 const browser=await browserType.launch({headless:true,args:browserType===chromium?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport,deviceScaleFactor:1,isMobile:viewport.width<=600,hasTouch:true,serviceWorkers:'block'});
  await context.addInitScript(s=>{localStorage.setItem('laerlittmer-v2',JSON.stringify(s));localStorage.setItem('laria-gangemagi-v1',JSON.stringify({mode:'mission',mission:0,wins:['meadow-3-3']}));
   localStorage.setItem('laria-wordhunt-v1',JSON.stringify({rounds:2,themeRounds:{animals:2}}));},seed);
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());await page.route('https://api.worldbank.org/**',r=>r.abort());
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.locator('#home-screen.active .bc12-nav [data-camp="collection"]').waitFor({timeout:30000});
  await page.locator('.bc12-nav [data-camp="collection"]').click();
  const d=page.locator('#bc12-dialog[open].is-collection.lmc-expanded');await d.waitFor();
  assert.equal(await d.locator('.lmc-shell[data-lmc-version="2"]').count(),1);
  if(viewport.width<=620){
   const tabs=await d.locator('.lmc-tabs [data-book-page]').evaluateAll(nodes=>
     nodes.map(el=>({title:el.textContent.trim(),left:el.getBoundingClientRect().left,
       right:el.getBoundingClientRect().right,width:el.getBoundingClientRect().width,
       height:el.getBoundingClientRect().height})));
   assert.equal(tabs.length,4,label+' all four chapters must remain visible');
   assert.ok(tabs.every(t=>t.left>=-2&&t.right<=viewport.width+2&&t.width>=120&&t.height>=44),
     label+' every collection chapter must be discoverable and touchable '+JSON.stringify(tabs));
  }
  assert.equal(await d.locator('.bc12-memory').count(),4);
  assert.equal(await d.locator('.bc12-memory-symbol svg').count(),4);
  assert.equal(await d.locator('.bc12-memory-intro b').innerText(),'1 av 4 minner funnet');
  assert.equal(await d.locator('.lmc-fox svg[data-avatar="girl"]').count(),1);
  assert.equal(await d.locator('[data-gear],[data-wear],.bc12-wardrobe-grid').count(),0);
  const dimensions=await d.evaluate(el=>({width:el.getBoundingClientRect().width,screen:innerWidth,scroll:document.documentElement.scrollWidth,height:el.getBoundingClientRect().height,visible:innerHeight}));
  assert.ok(dimensions.width<=dimensions.screen+3&&dimensions.scroll<=dimensions.screen+4&&dimensions.height<=dimensions.visible+3,
    label+' layout overflow '+JSON.stringify(dimensions));
  await capture(page,label+'-01-four-worlds');
  await d.locator('[data-book-page="words"]').first().click();
  assert.equal(await d.locator('.bc12-wordhunt-sticker').count(),5);
  assert.equal(await d.locator('.bc12-wordhunt-sticker[data-word-theme="animals"]').getAttribute('data-owned'),'true');
  await capture(page,label+'-02-word-stickers');
  await d.locator('.lmc-tabs [data-book-page="berries"]').click();
  assert.equal(await d.locator('[data-lmc-mission]').count(),8);
  assert.equal(await d.locator('.lmc-mission.is-earned').count(),1);
  const distinct=await d.locator('.lmc-mission-scene').evaluateAll(nodes=>new Set(nodes.map(n=>getComputedStyle(n).backgroundPosition)).size);
  assert.equal(distinct,8,label+' no eight distinct original illustration crops');
  await capture(page,label+'-03-market-blossoms');
  await d.locator('.lmc-tabs [data-book-page="place"]').click();
  assert.equal(await d.locator('.lmc-display-slot').count(),3);
  assert.equal(await d.locator('.lmc-place-fox svg[data-avatar="girl"]').count(),1,
    label+' the child’s selected fox must be inside the adventure place');
  const placeBackground=await d.locator('.lmc-place-scene').evaluate(el=>getComputedStyle(el).backgroundImage);
  assert.match(placeBackground,/basecamp-v11\.webp/,label+' no flat generic gradient');
  assert.equal((await page.request.get(new URL('./basecamp-v11.webp',url))).status(),200,
    label+' the existing illustrated Læria scenery must load');
  const plinthDimensions=await d.locator('.lmc-display-slot').evaluateAll(nodes=>
    nodes.map(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})));
  assert.ok(plinthDimensions.every(p=>p.width>=44&&p.height>=44),
    label+' treasure display targets must be touch-friendly '+JSON.stringify(plinthDimensions));
  await d.locator('[data-lmc-slot="1"]').click();
  await d.locator('[data-lmc-place-id="tallkrystall"]').click();
  assert.match(await d.locator('[data-lmc-slot="1"]').getAttribute('aria-label'),/Tallkrystall/);
  assert.equal(await d.locator('[data-lmc-slot="1"]').evaluate(el=>document.activeElement===el),true,
    label+' focus must return to the newly decorated display slot');
  assert.match(await d.locator('.lmc-live-status').innerText(),/Tallkrystall er plassert/,
    label+' placement must have spoken confirmation');
  await capture(page,label+'-04-my-story-place');
  await d.locator('.bc12-close').click();
  await page.locator('.bc12-nav [data-camp="collection"]').click();
  await page.locator('#bc12-dialog[open] .lmc-tabs [data-book-page="place"]').click();
  assert.match(await page.locator('#bc12-dialog[open] [data-lmc-slot="1"]').getAttribute('aria-label'),/Tallkrystall/,'scene is persisted');
  await page.locator('#bc12-dialog[open] .bc12-close').click();
  await page.locator('.bc12-nav [data-camp="collection"]').click();
  await page.locator('#bc12-dialog[open] .lmc-tabs [data-book-page="berries"]').click();
  await page.locator('#bc12-dialog[open] [data-lmc-mission="7"]').click();
  assert.equal((await page.evaluate(()=>window.LARIA_GANGEMAGI.snapshot())).mission,7,'collection opens exact adventure');
  assert.equal((await page.evaluate(()=>window.LARIA_GANGEMAGI.snapshot())).each,10);
  assert.equal((await page.evaluate(()=>window.LARIA_GANGEMAGI.snapshot())).wins.length,1,'previous blossom survives journey');
  assert.deepEqual(errors,[],label+' page exceptions');
  console.log('PASS MAGICAL BOOK '+label);
  await context.close();
 }finally{await browser.close()}
}
let url;
(async()=>{const s=await serve();url=s.url;try{
 for(const [name,engine,vps] of [
  ['chromium',chromium,[['iphone390',{width:390,height:844}],['ipad-landscape',{width:1180,height:820}]]],
  ['webkit',webkit,[['iphone-small',{width:320,height:568}],['iphone390',{width:390,height:844}],['ipad-portrait',{width:820,height:1180}],['ipad-landscape',{width:1180,height:820}]]]
 ])for(const [device,viewport] of vps)await run(engine,name+'-'+device,viewport);
}finally{await new Promise(r=>s.server.close(r))}})().catch(e=>{console.error(e);process.exitCode=1});