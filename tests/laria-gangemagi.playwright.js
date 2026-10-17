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
  if(viewport.height>=750||viewport.width<=360)assert.ok(first.source.bottom<=first.height+3,label+' primary Plukk action must be visible without scrolling '+JSON.stringify(first));
  // Visual QA: minus glyphs may not obscure numeric basket counts, and
  // the primary action label must not be clipped on the smallest iPhone.
  const touchGeometry=await page.evaluate(()=>{
    const overlaps=(a,b)=>a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;
    const baskets=[...document.querySelectorAll('.gm-crate-wrap')].map(w=>{
      const tag=w.querySelector('.gm-crate-tag').getBoundingClientRect();
      const icon=w.querySelector('.gm-remove span').getBoundingClientRect();
      return overlaps(tag,icon);
    });
    const label=document.querySelector('.gm-pick>span:nth-child(2)');
    return {overlaps:baskets,clipped:label.scrollWidth>label.clientWidth+1,lettering:label.innerText};
  });
  assert.deepEqual(touchGeometry.overlaps,Array(touchGeometry.overlaps.length).fill(false),label+' remove affordance must not cover numeric basket label '+JSON.stringify(touchGeometry));
  assert.equal(touchGeometry.clipped,false,label+' first-fold Plukk action text is clipped '+JSON.stringify(touchGeometry));
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
  assert.equal(await page.locator('.gm-pick').count(),0,'completed tasks must not leave a disabled fruit button');
  assert.equal(await page.locator('.gm-actions-complete .gm-next').count(),1,'one clear next action');
  const celebrationOverlap=await page.evaluate(()=>{
    const r=s=>document.querySelector(s).getBoundingClientRect();
    const a=r('.gm-celebration'),b=r('.gm-fox-bubble');
    return {overlap:a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top,
      celebrationTop:a.top,foxBottom:b.bottom,viewportHeight:innerHeight,
      nextBottom:r('.gm-actions-complete .gm-next').bottom};
  });
  assert.equal(celebrationOverlap.overlap,false,label+' celebration must not cover the personal fox '+JSON.stringify(celebrationOverlap));
  if(viewport.height>=750||viewport.width<=360)assert.ok(celebrationOverlap.nextBottom<=viewport.height+3,label+' completed-child next action missing from first fold '+JSON.stringify(celebrationOverlap));
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
  await page.locator('[data-gm-action="book"]').click();
  assert.equal(await page.locator('.gm-book-mission').count(),8,'all market adventures available');
  const bookLayout=await page.evaluate(()=>{
    const scenes=[...document.querySelectorAll('.gm-book-landscape')];
    return {pageWidth:document.documentElement.scrollWidth,screenWidth:innerWidth,count:scenes.length,
      assets:scenes.every(x=>getComputedStyle(x).backgroundImage.includes('gangemagi-tallenga-market-v1.svg')),
      touch:[...document.querySelectorAll('.gm-book-mission')].every(x=>x.getBoundingClientRect().height>=44)};
  });
  assert.ok(bookLayout.assets&&bookLayout.touch&&bookLayout.pageWidth<=bookLayout.screenWidth+4,
    label+' market-book illustrations, touch targets and widths '+JSON.stringify(bookLayout));
  assert.equal(await page.locator('.gm-book-earned').count(),1,'one earned flower marked in book');
  await page.locator('[data-gm-action="select-mission"][data-index="7"]').click();
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).mission,7);
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).wins.length,1);
  assert.equal(await page.locator('.gm-book-mission').count(),0,'book should close after selection');
  await page.locator('[data-gm-action="book"]').click();
  await page.locator('[data-gm-action="select-mission"][data-index="0"]').click();
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).mission,0);
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).equation.complete,false);
  for(let group=0;group<3;group++)for(let j=0;j<3;j++)await page.locator('[data-gm-action="basket"][data-gm-basket="'+group+'"]').click();
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).wins.length,1,'replay keeps unique flower');
  await page.locator('[data-gm-action="next"]').click();
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).groups,2);
  await page.locator('[data-gm-action="mode"][data-mode="free"]').click();
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).mode,'free');
  await page.locator('[data-gm-action="factor"][data-key="groups"][data-step="1"]').click();
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).groups,3);
  await page.locator('[data-gm-action="basket"][data-gm-basket="0"]').click();
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).equation.multiplication,null);
  // Maximal load: every real item remains visible even with five small baskets.
  await page.locator('[data-gm-action="factor"][data-key="groups"][data-step="1"]').click();
  await page.locator('[data-gm-action="factor"][data-key="groups"][data-step="1"]').click();
  for(let i=0;i<5;i++)await page.locator('[data-gm-action="factor"][data-key="each"][data-step="1"]').click();
  const dense=await page.locator('.gm-fruit-bed').first().evaluate(el=>{
    const bed=el.getBoundingClientRect(),front=el.closest('.gm-crate').querySelector('.gm-crate-front').getBoundingClientRect();
    const fruits=[...el.querySelectorAll('.gm-fruit')].map(f=>f.getBoundingClientRect());
    return {count:fruits.length,columns:getComputedStyle(el).gridTemplateColumns.split(' ').length,
      inside:fruits.every(f=>f.width>=11&&f.height>=16&&f.top>=bed.top-1&&f.bottom<=bed.bottom+1),
      aboveFront:fruits.every(f=>f.bottom<=front.top+3),
      scrollWidth:document.documentElement.scrollWidth,innerWidth:innerWidth};
  });
  assert.equal(dense.count,10,label+' dense basket must show ten individual slots');
  assert.equal(dense.columns,5,label+' dense basket needs an even 5x2 arrangement');
  assert.ok(dense.inside&&dense.aboveFront,label+' fruit hidden behind a basket front '+JSON.stringify(dense));
  assert.ok(dense.scrollWidth<=dense.innerWidth+4,label+' five baskets overflow the page');
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
