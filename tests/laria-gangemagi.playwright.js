'use strict';
/* Gangemagi: true child-sized first viewport + real interactions in Chromium/WebKit. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium,webkit}=require('playwright');
const base=path.resolve(__dirname,'..');
const out=process.env.QA_SCREENSHOTS||'/tmp/laria-gangemagi-v1';
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
function serve(){return new Promise((resolve,reject)=>{const srv=http.createServer((req,res)=>{let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(name.endsWith('/'))name+='index.html';const file=path.resolve(base,'.'+name);if(!file.startsWith(base+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(file,(err,buf)=>{if(err){res.writeHead(404);res.end('Not found');return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(buf);});});srv.once('error',reject);srv.listen(0,'127.0.0.1',()=>resolve({srv,url:'http://127.0.0.1:'+srv.address().port+'/laer-litt-mer/?app=laria'}));});}
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Elev',avatar:'girl',setupVersion:2},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
async function shot(page,name){await fs.promises.mkdir(out,{recursive:true});await page.screenshot({path:path.join(out,name+'.png'),fullPage:true,animations:'disabled'});}
async function check(engine,label,viewport,url){
 const context=await engine.newContext({viewport,deviceScaleFactor:1,serviceWorkers:'block',isMobile:viewport.width<750,hasTouch:true});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.addInitScript(s=>{localStorage.setItem('laerlittmer-v2',JSON.stringify(s));},seed);
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.LARIA_GANGEMAGI?.version==='playable-v1');
  await page.evaluate(()=>window.openMultiplicationLab());
  await page.locator('#multiplication-lab-screen.active .gm-shell').waitFor();
  assert.equal(await page.locator('.gm-crate').count(),3);
  assert.equal((await page.locator('.gm-math-equation').innerText()).trim(),'0 + 0 + 0 = 0');
  assert.match(await page.locator('.gm-story').innerText(),/3 kurver med 3 jordbær/);
  assert.equal(await page.locator('.gm-fox-art [data-avatar="girl"]').count(),1,'must render chosen full-body girl fox');
  const first=await page.evaluate(()=>{
   const rect=s=>{const n=document.querySelector(s)?.getBoundingClientRect();return n?{top:n.top,bottom:n.bottom,width:n.width,height:n.height}:null;};
   return {screen:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,story:rect('.gm-story'),crate:rect('.gm-crate'),source:rect('.gm-pick'),math:rect('.gm-math'),read:rect('.gm-read')};
  });
  console.log('GANGEMAGI_FIRSTFOLD '+label+' '+JSON.stringify(first));
  assert.ok(first.scrollWidth<=first.screen+4,label+' horizontal overflow '+JSON.stringify(first));
  if(viewport.width>=700&&viewport.height>=viewport.width){
    const worldWidth=await page.locator('.gm-world').evaluate(el=>el.getBoundingClientRect().width);
    assert.ok(worldWidth>=700,label+' iPad portrait should use the full-width Tallenga scene '+worldWidth);
  }
  assert.ok(first.crate.top>=0&&first.crate.bottom<=first.height,label+' interactive crates not in the first viewport '+JSON.stringify(first));
  assert.ok(first.math.top<first.height,label+' mathematical feedback invisible '+JSON.stringify(first));
  assert.ok(first.read.height>=44,label+' read aloud target too small');
  if(viewport.height>=750)assert.ok(first.source.bottom<=first.height+3,label+' source action should be in the first viewport '+JSON.stringify(first));
  await shot(page,label+'-01-first-look');
  await page.locator('[data-gm-action="basket"][data-gm-basket="0"]').click();
  await page.locator('[data-gm-action="basket"][data-gm-basket="0"]').click();
  assert.equal((await page.locator('.gm-math-equation').innerText()).trim(),'2 + 0 + 0 = 2');
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).counts[0],2);
  assert.match(await page.locator('.gm-fox-message').innerText(),/2 av 3 i kurv 1/);
  assert.equal(await page.locator('.gm-fox').getAttribute('data-mood'),'cheer');
  await page.locator('[data-gm-action="undo"]').click();
  assert.deepEqual((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).counts,[1,0,0]);
  await page.locator('[data-gm-action="source"]').click();
  assert.deepEqual((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).counts,[2,0,0]);
  await page.locator('[data-gm-action="hint"]').click();
  assert.match(await page.locator('.gm-fox-message').innerText(),/kurv/i);
  await page.locator('[data-gm-action="remove"][data-group="0"]').click();
  assert.deepEqual((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).counts,[1,0,0]);
  for(const [group,count] of [[0,2],[1,3],[2,3]]){
   for(let i=0;i<count;i++)await page.locator('[data-gm-action="basket"][data-gm-basket="'+group+'"]').click();
  }
  assert.equal((await page.locator('.gm-math-equation').innerText()).trim(),'3 × 3 = 9');
  assert.match(await page.locator('.gm-celebration').innerText(),/Oppdraget er klart/);
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).wins.length,1);
  await page.locator('[data-gm-action="undo"]').click();
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).wins.length,1,'earned blossom survives undo');
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).equation.complete,false);
  await page.locator('[data-gm-action="basket"][data-gm-basket="2"]').click();
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).wins.length,1,'replaying must not duplicate blossom');
  await shot(page,label+'-02-all-baskets-full');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.LARIA_GANGEMAGI?.version==='playable-v1');
  await page.evaluate(()=>window.openMultiplicationLab());
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).wins.length,1);
  assert.equal((await page.locator('.gm-math-equation').innerText()).trim(),'3 × 3 = 9');
  await page.locator('[data-gm-action="next"]').click();
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).groups,2);
  await page.locator('[data-gm-action="mode"][data-mode="free"]').click();
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).mode,'free');
  await page.locator('[data-gm-action="factor"][data-key="groups"][data-step="1"]').click();
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).groups,3);
  await page.locator('[data-gm-action="basket"][data-gm-basket="0"]').click();
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).equation.multiplication,null);
  await shot(page,label+'-03-free-play');
  await page.locator('[data-gm-action="classic"]').click();
  await page.locator('.mp-home-screen').waitFor();
  await page.locator('.gm-classic-return').click();
  await page.locator('.gm-shell').waitFor();
  assert.deepEqual(errors,[],label+' browser exceptions '+JSON.stringify(errors));
  console.log('PASS GANGEMAGI '+label);
 }finally{await context.close();}
}
(async()=>{
 const {srv,url}=await serve();
 try{
  for(const [type,browserType,devices] of [
   ['chrome',chromium,[['iphone390',{width:390,height:844}],['ipad-landscape',{width:1180,height:820}]]],
   ['webkit',webkit,[['iphone-small',{width:320,height:568}],['iphone390',{width:390,height:844}],['ipad-portrait',{width:820,height:1180}],['ipad-landscape',{width:1180,height:820}]]]
  ]){
   const browser=await browserType.launch({headless:true});
   try{for(const [device,viewport] of devices)await check(browser,type+'-'+device,viewport,url);}finally{await browser.close();}
  }
 }finally{await new Promise(resolve=>srv.close(resolve));}
})().catch(err=>{console.error(err);process.exitCode=1;});
