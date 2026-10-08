'use strict';
/* Standalone illustrated Brøklaben QA: real Chromium/WebKit tablet + phone interactions. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require('playwright');
const base=path.resolve(__dirname,'..'),out=process.env.FRACTION_QA_SCREENSHOTS||'/tmp/laria-fraction-workshop';
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
const profile={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Elev',avatar:'boy',setupVersion:2},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
function server(){return new Promise((resolve,reject)=>{const srv=http.createServer((req,res)=>{let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(name.endsWith('/'))name+='index.html';const f=path.resolve(base,'.'+name);if(!f.startsWith(base+path.sep)){res.writeHead(403);res.end('Forbidden');return}fs.readFile(f,(err,buf)=>{if(err){res.writeHead(404);res.end('Not found');return}res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(buf)})});srv.once('error',reject);srv.listen(0,'127.0.0.1',()=>resolve({srv,url:'http://127.0.0.1:'+srv.address().port+'/laer-litt-mer/?app=laria'}))})}
async function photo(page,label){await fs.promises.mkdir(out,{recursive:true});await page.screenshot({path:path.join(out,label+'.png'),fullPage:true,animations:'disabled'})}
async function run(browser,engine,label,viewport,url){
 const ctx=await browser.newContext({viewport,deviceScaleFactor:1,serviceWorkers:'block',isMobile:viewport.width<700,hasTouch:true});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.addInitScript(p=>{localStorage.setItem('laerlittmer-v2',JSON.stringify(p))},profile);
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.LARIA_FRACTION_PREMIUM?.version==='workshop-v1',{},{timeout:20000});
  await page.evaluate(()=>openFractionLab());
  await page.locator('.fr2-home').waitFor();
  assert.equal(await page.locator('#fraction-lab-screen.active').count(),1);
  assert.equal(await page.locator('#fraction-lab-screen').getAttribute('data-explore-release'),'explore-rc1');
  assert.equal(await page.locator('.fr2-home-card').count(),6);
  await photo(page,label+'-01-home');

  await page.locator('.fr2-card-explore').click();
  await page.locator('.fr2-explore').waitFor();
  assert.equal(await page.locator('.fr2-view').count(),4);
  assert.equal(await page.locator('.fr2-pie-large').count(),1);
  await photo(page,label+'-02-explore');
  await page.locator('[data-fr-action="preset"][data-n="1"][data-d="2"]').click();
  assert.deepEqual(await page.evaluate(()=>[LARIA_FRACTION_PREMIUM.snapshot().explore.n,LARIA_FRACTION_PREMIUM.snapshot().explore.d]),[1,2]);
  await page.locator('[data-fr-action="view"][data-view="bar"]').click();
  assert.equal(await page.locator('.fr2-bar').count(),1);
  await page.locator('[data-fr-action="view"][data-view="grid"]').click();
  assert.equal(await page.locator('.fr2-block-grid span').count(),2);
  await page.locator('[data-fr-action="view"][data-view="glass"]').click();
  assert.equal(await page.locator('.fr2-glass').count(),1);
  await page.locator('[data-fr-action="view"][data-view="circle"]').click();
  await page.locator('[data-fr-action="adjust"][data-field="n"][data-step="1"]').click();
  assert.equal((await page.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot())).explore.n,2);

  await page.locator('.fr2-nav-item[data-page="build"]').click();
  await page.locator('.fr2-build').waitFor();
  await photo(page,label+'-03-build');
  await page.locator('[data-fr-action="reset"]').click();
  assert.equal((await page.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot())).build.n,0);
  await page.locator('.fr2-spare').first().dragTo(page.locator('.fr2-build-target'));
  assert.equal((await page.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot())).build.n,1,'dragging a physical piece must fill the pie: '+JSON.stringify(await page.evaluate(()=>LARIA_FRACTION_PREMIUM.dragDiagnostics())));
  await page.locator('[data-fr-action="reset"]').click();
  await page.locator('[data-fr-action="add"]').first().click();
  assert.equal((await page.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot())).build.n,1);
  await page.locator('.fr2-pie-builder path[data-fr-action="piece"][data-piece="2"]').click();
  assert.equal((await page.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot())).build.n,3);
  await page.locator('[data-fr-action="adjust"][data-field="d"][data-step="1"]').click();
  const build=await page.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot().build);
  assert.equal(build.d,5);assert.equal(build.n,3);
  await page.locator('[data-fr-action="next-build"]').click();
  assert.equal((await page.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot())).build.n,0);

  await page.locator('.fr2-nav-item[data-page="home"]').click();
  await page.locator('.fr2-card-equal').click();
  await page.locator('.fr2-equal').waitFor();
  await photo(page,label+'-04-equal');
  assert.equal(await page.locator('.fr2-pie-compare').count(),2);
  assert.equal((await page.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot())).equal,0);
  await page.locator('[data-fr-action="guess"][data-guess="equal"]').click();
  assert.match(await page.locator('.fr2-feedback').innerText(),/Du fant det!/);
  await page.locator('[data-fr-action="next-equal"]').click();
  assert.equal((await page.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot())).equal,1);

  await page.locator('.fr2-nav-item[data-page="home"]').click();
  await page.locator('.fr2-card-sort').click();
  await page.locator('.fr2-sort').waitFor();
  await photo(page,label+'-05-sort');
  await page.locator('[data-fr-action="sort-check"]').click();
  assert.match(await page.locator('.fr2-feedback').innerText(),/Ikke helt/);
  await page.locator('[data-fr-action="sort-shift"][data-position="0"][data-direction="1"]').click();
  await page.locator('[data-fr-action="sort-shift"][data-position="1"][data-direction="1"]').click();
  await page.locator('[data-fr-action="sort-check"]').click();
  assert.match(await page.locator('.fr2-feedback').innerText(),/sorterte riktig/);
  await page.locator('[data-fr-action="sort-next"]').click();
  await page.locator('.fr2-sort-card').first().dragTo(page.locator('.fr2-sort-card').last());
  assert.deepEqual((await page.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot())).sortOrder,[0,1,2],'drag-to-reorder cards did not move: '+JSON.stringify(await page.evaluate(()=>LARIA_FRACTION_PREMIUM.dragDiagnostics())));

  await page.locator('.fr2-nav-item[data-page="home"]').click();
  await page.locator('.fr2-card-convert').click();
  await page.locator('.fr2-convert').waitFor();
  await photo(page,label+'-06-convert');
  assert.match(await page.locator('.fr2-conversion-row').innerText(),/50 %/);
  assert.match(await page.locator('.fr2-conversion-row').innerText(),/0,5/);
  await page.locator('[data-fr-action="convert-example"][data-example="1"]').click();
  assert.match(await page.locator('.fr2-conversion-row').innerText(),/25 %/);
  assert.match(await page.locator('.fr2-conversion-row').innerText(),/0,25/);
  await page.locator('[data-fr-action="convert-example"][data-example="6"]').click();
  assert.match(await page.locator('.fr2-approx-note').innerText(),/omtrent/);

  await page.locator('.fr2-nav-item[data-page="mastery"]').click();
  await page.locator('.fr2-mastery').waitFor();
  await photo(page,label+'-07-mastery');
  const stats=await page.evaluate(()=>LARIA_FRACTION_PREMIUM.progress());
  assert.ok(Object.keys(stats.explored).length>=1);
  assert.ok(Object.keys(stats.built).length>=1);
  assert.ok(Object.keys(stats.equal).length>=1);
  assert.ok(Object.keys(stats.sorted).length>=1);
  assert.ok(Object.keys(stats.converted).length>=1);
  assert.equal(await page.locator('.fr2-master-tile').count(),5);
  const geom=await page.evaluate(()=>({viewport:window.innerWidth,pageWidth:document.documentElement.scrollWidth,targets:[...document.querySelectorAll('#fraction-lab-root .fr2-nav-item, #fraction-lab-root .fr2-next-arrow, #fraction-lab-root .fr2-back')].map(n=>({width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height}))}));
  assert.ok(geom.pageWidth<=geom.viewport+3,label+' page overflow '+JSON.stringify(geom));
  assert.ok(geom.targets.every(x=>x.width>=44&&x.height>=44),label+' touch target below 44px '+JSON.stringify(geom));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.LARIA_FRACTION_PREMIUM?.version==='workshop-v1');
  assert.ok(Object.keys((await page.evaluate(()=>LARIA_FRACTION_PREMIUM.progress())).explored).length>=1,'Brøklaben lost saved discoveries');
  assert.deepEqual(errors,[],label+' unexpected runtime errors');
  console.log('PASS '+engine+' '+label+': seven screens, correct fractions, tactile controls, comparison, sorting, conversion, persistence');
 }finally{await ctx.close()}
}
(async()=>{const {srv,url}=await server();try{
 for(const [name,type,devices] of [['chromium',chromium,[['iphone',{width:390,height:844}],['ipad',{width:820,height:1180}]]],['webkit',webkit,[['iphone-safari',{width:390,height:844}],['ipad-safari',{width:820,height:1180}]]]]){
  const browser=await type.launch({headless:true});try{for(const [label,viewport] of devices)await run(browser,name,label,viewport,url)}finally{await browser.close()}
 }
 console.log('PASS all Læria Brøklaben premium browser tests');
}finally{await new Promise(resolve=>srv.close(resolve))}})().catch(e=>{console.error(e);process.exitCode=1});
