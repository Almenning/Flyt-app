'use strict';
/* Brøklab Fjordbakeriet acceptance: actual playable SVG cake and scenic assets,
 * correct learning links, responsive first fold, remaining 6 activities, storage.
 * No assertion can pass just because a static poster looks like a game. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require('playwright');
const base=path.resolve(__dirname,'..'),out=process.env.FRACTION_QA_SCREENSHOTS||'/tmp/laria-fraction-workshop';
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
const profile={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Elev',avatar:'boy',setupVersion:2},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
function server(){return new Promise((resolve,reject)=>{const srv=http.createServer((req,res)=>{let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(name.endsWith('/'))name+='index.html';const f=path.resolve(base,'.'+name);if(!f.startsWith(base+path.sep)){res.writeHead(403);res.end('Forbidden');return}fs.readFile(f,(err,buf)=>{if(err){res.writeHead(404);res.end('Not found');return}res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(buf)})});srv.once('error',reject);srv.listen(0,'127.0.0.1',()=>resolve({srv,url:'http://127.0.0.1:'+srv.address().port+'/laer-litt-mer/?app=laria'}))})}
async function photo(page,label,fullPage=true){await fs.promises.mkdir(out,{recursive:true});await page.screenshot({path:path.join(out,label+'.png'),fullPage,animations:'disabled'})}
const cakeState=page=>page.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot().build);
const count=(page,selector)=>page.locator(selector).count();
const pct=page=>page.locator('.fc-percent-equality b').innerText();
async function assertFirstFold(page,label,w,h){
 const data=await page.evaluate(()=>{
  const rect=s=>{const r=document.querySelector(s)?.getBoundingClientRect();return r?{top:Math.round(r.top),bottom:Math.round(r.bottom),height:Math.round(r.height),width:Math.round(r.width)}:null};
  return {cake:rect('.fc-cake-svg'),num:rect('.fc-number'),pct:rect('.fc-percent-equality'),control:rect('.fc-controls'),action:rect('.fc-add-one'),width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth};
 });
 assert.ok(data.cake&&data.num&&data.pct&&data.control&&data.action,label+' missing an essential real component '+JSON.stringify(data));
 assert.ok(data.cake.width >= (w<360?120:130),label+' cake must remain large enough to play '+JSON.stringify(data));
 assert.ok([data.cake,data.num,data.pct,data.control].every(x=>x.top>=0&&x.bottom<=h+1),label+' important objects must share first fold '+JSON.stringify(data));
 assert.ok(data.scrollWidth<=w+3,label+' horizontal overflow '+JSON.stringify(data));
 const targets=await page.locator('.fc-controls .fr2-adjust-btn, .fc-add-one, .fc-troll-cycle').evaluateAll(xs=>xs.map(x=>({label:x.getAttribute('aria-label')||x.textContent.trim(),w:x.getBoundingClientRect().width,h:x.getBoundingClientRect().height})));
 assert.ok(targets.every(x=>x.w>=44&&x.h>=44),label+' targets below 44x44 '+JSON.stringify(targets));
}
async function run(browser,engine,label,viewport,url,full){
 const ctx=await browser.newContext({viewport,deviceScaleFactor:1,serviceWorkers:'block',isMobile:viewport.width<700,hasTouch:true});
 const page=await ctx.newPage(),errors=[];page.setDefaultTimeout(14000);page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.addInitScript(p=>{localStorage.setItem('laerlittmer-v2',JSON.stringify(p))},profile);
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());await page.route('https://api.worldbank.org/**',r=>r.abort());
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.LARIA_CAKE_WORLD?.version==='fjordbakeri-1' && window.LARIA_FRACTION_PREMIUM?.version==='workshop-v1',{},{timeout:25000});
  await page.evaluate(()=>openFractionLab());await page.locator('.fc-world').waitFor({timeout:20000});
  assert.equal(await count(page,'#fraction-lab-screen.active'),1,'original route must stay');
  assert.equal(await page.locator('#fraction-lab-screen').getAttribute('data-explore-release'),'explore-rc1');
  assert.equal(await count(page,'.fr2-home-card'),0,'no forced menu before first cake');
  assert.equal(await count(page,'.fr6-nav .fr2-nav-item'),3,'all routes remain available');
  assert.deepEqual((await cakeState(page)).filled,[0]);
  assert.equal(await count(page,'.fc-wedge'),4,'pie must contain four real sector actions');
  assert.equal(await page.locator('.fc-number').getAttribute('aria-label'),'1 av 4');
  assert.equal(await pct(page),'25 %');
  assert.equal(await count(page,'.fc-discovery'),0,'addition and multiplication must not crowd the first view');
  assert.equal(await count(page,'.fc-reveal-math'),0,'challenge is earned by action, not reading');
  assert.equal(await count(page,'.fr2-spare'),3,'the tray contains only empty pieces');
  const picture=await page.locator('.fc-landscape img, .fc-troll img').evaluateAll(async xs=>Promise.all(xs.map(async el=>{await el.decode();return {src:el.getAttribute('src'),width:el.naturalWidth}})));
  assert.ok(picture.length>=5&&picture.every(x=>x.width>0),label+' original scenery and troll art must load '+JSON.stringify(picture));
  assert.ok(picture.some(x=>x.src.includes('skala-window.webp')),'Skåla must remain recognizable as an independent scenic layer');
  await assertFirstFold(page,label,viewport.width,viewport.height);
  await photo(page,label+'-01-fjordbakeriet',false); // Capture actual first viewport; fullPage Safari capture can perturb scroll position before first tap.
  // Exactly the interaction the child should see first. Never rely on a static image.
  await page.locator('.fc-add-one').click();
  assert.deepEqual((await cakeState(page)).filled,[0,1]);
  assert.equal(await page.locator('.fc-number').getAttribute('aria-label'),'2 av 4');
  assert.equal(await pct(page),'50 %');
  assert.equal(await count(page,'.fc-wedge[aria-pressed="true"]'),2);
  assert.equal(await count(page,'.fr2-spare'),2);
  assert.equal(await count(page,'.fc-discovery'),1);
  assert.equal(await page.locator('.fc-discovery').isVisible(),false,'addition and multiplication are voluntary');
  await photo(page,label+'-02-added-piece');
  await page.locator('.fc-reveal-math').click();
  assert.equal(await page.locator('.fc-discovery').isVisible(),true);
  assert.match(await page.locator('.fc-discovery').innerText(),/1\/4 \+ 1\/4 = 2\/4/);
  assert.match(await page.locator('.fc-discovery').innerText(),/2 × 1\/4 = 2\/4/);
  await photo(page,label+'-03-addition-multiplication');
  await page.locator('.fc-cake-svg [data-fr-action="piece"][data-piece="0"]').click();
  assert.deepEqual((await cakeState(page)).filled,[1],'tapping the actual topping must remove exactly this sector');
  assert.equal(await pct(page),'25 %');
  assert.equal(await count(page,'.fc-discovery'),0);
  // The same actual state belongs to buttons, pie, loose pieces, drag and math.
  await page.locator('.fc-piece-tray [data-piece-index="2"]').click();
  assert.deepEqual((await cakeState(page)).filled,[1,2]);
  assert.equal(await pct(page),'50 %');
  await page.locator('[data-fr-action="adjust"][data-field="d"][data-step="1"]').click();
  assert.equal((await cakeState(page)).d,5);assert.equal(await pct(page),'40 %');
  assert.match(await page.locator('.fc-discovery').innerText(),/1\/5 \+ 1\/5 = 2\/5/);
  assert.match(await page.locator('.fc-discovery').innerText(),/2 × 1\/5 = 2\/5/);
  await page.locator('[data-fr-action="reset"]').click();
  assert.equal((await cakeState(page)).n,0);
  assert.equal(await pct(page),'0 %');
  await page.locator('.fc-piece-tray [data-piece-index="4"]').dragTo(page.locator('.fc-cake-stand'));
  assert.deepEqual((await cakeState(page)).filled,[4],'a picked slice must fill its exact sector');
  // Switching a companion cannot touch mathematics or rewrite its face/wardrobe.
  const pre=JSON.stringify(await cakeState(page));
  for(const name of ['lillesoster','lillebror','storesoster']){
   await page.locator('.fc-troll-cycle').click();
   await page.locator('.fc-troll .fr8-troll').evaluate(img=>img.decode());
   assert.ok((await page.locator('.fc-troll .fr8-troll').getAttribute('src')).endsWith('/'+name+'.webp'));
   assert.equal(JSON.stringify(await cakeState(page)),pre,'character choice must not touch the cake');
  }
  await page.locator('.fc-try-half').click();
  assert.equal(await page.locator('.fc-world').getAttribute('data-fr8-quest'),'active');
  await page.locator('.fc-try-half').click();
  assert.equal(await page.locator('.fc-world').getAttribute('data-fr8-quest'),'free');
  assert.equal((await cakeState(page)).n,1,'returning to free play retains cake');
  await page.locator('[data-fr-action="toggle-equivalents"]').click();
  assert.equal(await page.locator('.fc-decimals').isVisible(),true);
  assert.match(await page.locator('.fc-decimals').innerText(),/0,2/);
  if(!full){assert.deepEqual(errors,[],label+' unexpected errors');console.log('PASS '+engine+' '+label+' live cake, fraction, percent, responsive, math reveal, troll, drag');return}
  // Keep all original activities and progression as an independent regression.
  await page.locator('.fr2-nav-item[data-page="home"]').click();
  await page.locator('.fr6-more').waitFor();assert.equal(await count(page,'.fr2-home-card'),5);
  await page.locator('.fr2-card-explore').click();await page.locator('.fr6-explore').waitFor();
  const shared=await cakeState(page);assert.equal(await page.locator('.fr2-main-value .fr2-fraction').getAttribute('aria-label'),shared.n+' av '+shared.d);
  await page.locator('[data-fr-action="view"][data-view="bar"]').click();
  await page.locator('.fr2-bar [data-fr-action="piece"][data-piece="0"]').click();
  assert.equal((await cakeState(page)).n,2);
  await page.locator('[data-fr-action="view"][data-view="grid"]').click();
  assert.equal(await count(page,'.fr2-block-grid span'),5);
  await page.locator('[data-fr-action="view"][data-view="glass"]').click();
  await page.locator('.fr2-glass').focus();await page.locator('.fr2-glass').press('ArrowDown');
  assert.equal((await cakeState(page)).n,1);
  await page.locator('[data-fr-action="view"][data-view="circle"]').click();
  await page.locator('.fr6-nav [data-page="build"]').click();
  assert.equal(await page.locator('.fc-number').getAttribute('aria-label'),'1 av 5');
  await page.locator('.fr2-nav-item[data-page="home"]').click();
  await page.locator('.fr2-card-equal').click();await page.locator('.fr2-equal').waitFor();
  await page.locator('[data-fr-action="guess"][data-guess="equal"]').click();
  assert.match(await page.locator('.fr2-feedback').innerText(),/Du fant det!/);
  await page.locator('.fr2-nav-item[data-page="home"]').click();
  await page.locator('.fr2-card-sort').click();await page.locator('.fr2-sort').waitFor();
  await page.locator('[data-fr-action="sort-check"]').click();
  assert.match(await page.locator('.fr2-feedback').innerText(),/Ikke helt/);
  await page.locator('[data-fr-action="sort-shift"][data-position="0"][data-direction="1"]').click();
  await page.locator('[data-fr-action="sort-shift"][data-position="1"][data-direction="1"]').click();
  await page.locator('[data-fr-action="sort-check"]').click();assert.match(await page.locator('.fr2-feedback').innerText(),/sorterte riktig/);
  await page.locator('.fr2-nav-item[data-page="home"]').click();
  await page.locator('.fr2-card-convert').click();await page.locator('.fr2-convert').waitFor();
  assert.match(await page.locator('.fr2-conversion-row').innerText(),/50 %/);
  await page.locator('.fr2-nav-item[data-page="mastery"]').click();await page.locator('.fr2-mastery').waitFor();
  const stats=await page.evaluate(()=>LARIA_FRACTION_PREMIUM.progress());
  assert.ok(['explored','built','equal','sorted'].every(k=>Object.keys(stats[k]).length>0));
  assert.equal(await count(page,'.fr2-master-tile'),5);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.LARIA_FRACTION_PREMIUM?.version==='workshop-v1');
  assert.ok(Object.keys((await page.evaluate(()=>LARIA_FRACTION_PREMIUM.progress())).built).length>0,'persisted fraction learning lost');
  assert.deepEqual(errors,[],label+' runtime errors');
  console.log('PASS '+engine+' '+label+': playable scene, intuitiveness, 7 activities, persistent progress');
 }finally{await ctx.close()}
}
(async()=>{const {srv,url}=await server(),failures=[];try{
 for(const [name,type,devices] of [
  ['chromium',chromium,[['iphone',{width:390,height:844},true],['iphone-small',{width:375,height:667},false],['iphone-tiny',{width:320,height:568},false],['ipad',{width:820,height:1180},false],['ipad-landscape',{width:1180,height:820},true],['iphone-landscape',{width:844,height:390},false]]],
  ['webkit',webkit,[['iphone-safari',{width:390,height:844},true],['iphone-small-safari',{width:375,height:667},false],['iphone-tiny-safari',{width:320,height:568},false],['ipad-safari',{width:820,height:1180},false],['ipad-landscape-safari',{width:1180,height:820},true],['iphone-landscape-safari',{width:844,height:390},false]]]
 ]){
  const browser=await type.launch({headless:true});try{
   for(const [label,viewport,full] of devices){try{await run(browser,name,label,viewport,url,full)}catch(e){failures.push(name+' '+label+': '+e.message);console.error('FAIL '+name+' '+label+': '+e.stack)}}
  }finally{await browser.close()}
 }
 if(failures.length)throw new Error('Brøklaben device failures:\n'+failures.join('\n'));
 console.log('PASS all Læria Brøklab Fjordbakeriet browser tests');
}finally{await new Promise(resolve=>srv.close(resolve))}})().catch(e=>{console.error(e);process.exitCode=1});