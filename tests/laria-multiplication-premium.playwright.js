'use strict';
/* Læria multiplication illustrated-v2: real mobile/iPad/WebKit interaction and persistence QA. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium,webkit}=require('playwright');
const base=path.resolve(__dirname,'..');
const screenshots=process.env.QA_SCREENSHOTS||'/tmp/laria-multiplication-v2';
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Elev',avatar:'boy',setupVersion:2},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
function serve(){return new Promise((resolve,reject)=>{const srv=http.createServer((req,res)=>{const requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(base,'.'+requested);if(!file.startsWith(base+path.sep)){res.writeHead(403);res.end();return}fs.readFile(file,(err,buf)=>{if(err){res.writeHead(404);res.end('Not found');return}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(buf)})});srv.once('error',reject);srv.listen(0,'127.0.0.1',()=>resolve({srv,url:'http://127.0.0.1:'+srv.address().port+'/laer-litt-mer/?app=laria'}))})}
async function screenshot(page,name){await fs.promises.mkdir(screenshots,{recursive:true});await page.screenshot({path:path.join(screenshots,name+'.png'),fullPage:true,animations:'disabled'})}
async function open(page,url){await page.addInitScript(profile=>localStorage.setItem('laerlittmer-v2',JSON.stringify(profile)),seed);await page.route('https://raw.githubusercontent.com/**',r=>r.abort());await page.route('https://api.worldbank.org/**',r=>r.abort());await page.goto(url,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.LARIA_MULT_PREMIUM&&window.LARIA_MULT_PREMIUM.version==='illustrated-v2');await page.evaluate(()=>window.openMultiplicationLab());await page.locator('.mp-home-screen').waitFor();assert.equal(await page.locator('#multiplication-lab-screen.active').count(),1)}
async function dimensions(page,width,label){const m=await page.evaluate(()=>({inner:window.innerWidth,scroll:document.documentElement.scrollWidth,screen:document.getElementById('multiplication-lab-screen').getBoundingClientRect().width,buttons:[...document.querySelectorAll('#multiplication-lab-root .mp-answer,#multiplication-lab-root .mp-nav-link')].map(x=>({width:x.getBoundingClientRect().width,height:x.getBoundingClientRect().height}))}));assert.ok(m.scroll<=m.inner+4,label+' page overflow '+JSON.stringify(m));assert.ok(m.buttons.every(x=>x.height>=44&&x.width>=44),label+' touch target too small '+JSON.stringify(m))}
async function testView(browser,engine,label,viewport,url){
 const context=await browser.newContext({viewport,deviceScaleFactor:1,serviceWorkers:'block',isMobile:viewport.width<700,hasTouch:true});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 try{
  await open(page,url);
  await dimensions(page,viewport.width,label+' home');
  await screenshot(page,label+'-01-home');
  await page.locator('.mp-menu-choose').click();
  await page.locator('.mp-choose-screen').waitFor();
  assert.equal(await page.locator('.mp-table-choice').count(),9);
  await page.locator('[data-mp-action="more"]').click();
  assert.equal(await page.locator('.mp-table-choice').count(),12,'1-, 11-, 12-gangen must be accessible');
  await screenshot(page,label+'-02-choose');
  await page.locator('.mp-table-choice[data-table="5"]').first().click();
  await page.locator('.mp-practice-screen').waitFor();
  let snap=await page.evaluate(()=>LARIA_MULT_PREMIUM.snapshot());
  assert.equal(snap.round.length,8);
  assert.ok(snap.round.every(q=>q.a===5),'selected 5-gangen not honored');
  await dimensions(page,viewport.width,label+' practice');
  await screenshot(page,label+'-03-practice');
  const initial=snap.round[0];assert.equal(await page.locator('.mp-apple-basket').count(),initial.a);assert.equal(await page.locator('.mp-apple').count(),initial.a*initial.b,'visual groups disagree with math');
  const answer=initial.a*initial.b,wrong=await page.locator('.mp-answer').evaluateAll((els,n)=>Number(els.find(x=>Number(x.dataset.value)!==n)?.dataset.value),answer);
  await page.locator('.mp-answer[data-value="'+wrong+'"]').click();
  assert.match(await page.locator('.mp-answer-feedback').innerText(),/Prøv igjen/);
  await page.locator('.mp-answer[data-value="'+answer+'"]').click();
  assert.equal(await page.locator('.mp-next').count(),1);
  await page.locator('.mp-next').click();
  assert.equal((await page.evaluate(()=>LARIA_MULT_PREMIUM.snapshot())).firstTry,0,'wrong then right cannot count as first-try');
  for(let i=1;i<8;i++){snap=await page.evaluate(()=>LARIA_MULT_PREMIUM.snapshot());const q=snap.round[snap.index];await page.locator('.mp-answer[data-value="'+q.a*q.b+'"]').click();await page.locator('.mp-next').click()}
  await page.locator('.mp-complete-screen').waitFor();
  const summary=await page.locator('.mp-complete-medal').innerText();assert.match(summary,/7 av 8/);
  assert.equal((await page.evaluate(()=>LARIA_MULT_PREMIUM.stats())).sessions,1);
  await screenshot(page,label+'-04-finished');
  await page.locator('.mp-nav-link[data-page="explore"]').click();
  await page.locator('.mp-explore-screen').waitFor();
  assert.equal(await page.locator('.mp-apple-basket').count(),4);
  await page.locator('[data-mp-action="factor"][data-factor="a"][data-step="1"]').click();
  assert.match(await page.locator('.mp-math-result').innerText(),/5 × 3/);
  await page.locator('[data-mp-action="mode"][data-mode="array"]').click();
  assert.equal(await page.locator('.mp-array-panel .mp-mini-array i').count(),15);
  await page.locator('[data-mp-action="mode"][data-mode="line"]').click();
  assert.ok(await page.locator('.mp-line-stop').count()>1);
  await page.locator('[data-mp-action="mode"][data-mode="swap"]').click();
  assert.equal(await page.locator('.mp-swap-pair .mp-mini-array').count(),2);
  await page.locator('[data-mp-action="mode"][data-mode="patterns"]').click();
  assert.equal(await page.locator('.mp-pattern-grid>div').count(),12);
  await page.locator('[data-mp-action="mode"][data-mode="table"]').click();
  assert.equal(await page.locator('.mp-times-grid tbody tr').count(),12);
  assert.equal(await page.locator('.mp-grid-cell').count(),144);
  await page.locator('[data-mp-action="cell"][data-row="4"][data-col="6"]').click();
  assert.match(await page.locator('.mp-table-inspector').innerText(),/4 × 6 = 24/);
  assert.match(await page.locator('.mp-table-inspector').innerText(),/6 × 4 = 24/);
  await screenshot(page,label+'-05-table');
  await page.locator('.mp-nav-link[data-page="mastery"]').click();
  await page.locator('.mp-mastery-screen').waitFor();
  assert.equal(await page.locator('.mp-award').count(),12);
  assert.match(await page.locator('.mp-mastery-highlights').innerText(),/Dagens økt/);
  await screenshot(page,label+'-06-mastery');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.LARIA_MULT_PREMIUM?.version==='illustrated-v2');
  assert.equal((await page.evaluate(()=>LARIA_MULT_PREMIUM.stats())).sessions,1,'progress not persisted on reload');
  assert.deepEqual(errors,[],label+' runtime errors');
  console.log('PASS '+engine+' '+label+': 6 screens, 8 questions, hints, all exploratory modes, 12x12, persistence, no page errors');
 }finally{await context.close()}
}
(async()=>{const {srv,url}=await serve();try{for(const [engine,launcher,views] of [['chromium',chromium,[['iphone', {width:390,height:844}],['ipad',{width:820,height:1180}]]],['webkit',webkit,[['iphone-safari',{width:390,height:844}],['ipad-safari',{width:820,height:1180}]]]]){const browser=await launcher.launch({headless:true});try{for(const [label,viewport] of views)await testView(browser,engine,label,viewport,url)}finally{await browser.close()}}console.log('PASS Læria illustrated multiplication complete browser matrix')}finally{await new Promise(resolve=>srv.close(resolve))}})().catch(e=>{console.error(e);process.exitCode=1});
