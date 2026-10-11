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
  // First experience: no menu and no technical prerequisites.
  await page.evaluate(()=>openFractionLab());
  await page.locator('.fr6-workshop').waitFor();
  assert.equal(await page.locator('#fraction-lab-screen.active').count(),1);
  assert.equal(await page.locator('#fraction-lab-screen').getAttribute('data-explore-release'),'explore-rc1');
  assert.equal(await page.locator('.fr2-home-card').count(),0,'the cake must be playable without navigating a menu');
  assert.equal(await page.locator('.fr6-nav .fr2-nav-item').count(),3);
  assert.equal(await page.locator('.fr6-result .fr2-fraction').getAttribute('aria-label'),'1 av 4');
  assert.deepEqual((await page.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot().build)).filled,[0]);
  assert.deepEqual(await page.locator('.fr6-piece-tray .fr2-spare').evaluateAll(xs=>xs.map(x=>Number(x.dataset.pieceIndex))),[1,2,3]);
  const firstFold=await page.evaluate(()=>{
    const rect=selector=>document.querySelector(selector)?.getBoundingClientRect();
    const cake=rect('.fr5-build-target .fr2-pie-builder'),value=rect('.fr6-result .fr2-fraction'),controls=rect('.fr6-workshop .fr6-controls');
    const fox=document.querySelector('.fr5-fox-mentor .fr2-fox');
    return {
      cakeVisible:!!cake&&cake.width>100&&cake.top>=0&&cake.bottom<=innerHeight,
      fractionVisible:!!value&&value.height>65&&value.top>=0&&value.bottom<=innerHeight,
      controlsVisible:!!controls&&controls.top>=0&&controls.bottom<=innerHeight,
      fractionAboveControls:!!value&&!!controls&&value.bottom<controls.top,
      correctFox:!!fox&&fox.getAttribute('src')===window.LARIA_FOX.source(window.LARIA_FOX.choice()),
      controlsHeight:controls?.height,
      noOverflow:document.documentElement.scrollWidth<=innerWidth+3
    };
  });
  assert.ok(firstFold.cakeVisible&&firstFold.fractionVisible&&firstFold.controlsVisible&&firstFold.fractionAboveControls&&firstFold.correctFox&&firstFold.noOverflow,
    label+' first viewport must show cake, 1/4, both controls and personal fox: '+JSON.stringify(firstFold));
  assert.ok(firstFold.controlsHeight>=58,'real controls must remain touchable');
  await photo(page,label+'-01-home');
  await page.locator('.fr2-pie-builder [data-fr-action="piece"][data-piece="2"]').click();
  assert.deepEqual((await page.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot().build)).filled,[0,2],'tap adds the touched sector, not the next one');
  assert.equal(await page.locator('.fr6-result .fr2-fraction').getAttribute('aria-label'),'2 av 4');
  assert.deepEqual(await page.locator('.fr6-piece-tray .fr2-spare').evaluateAll(xs=>xs.map(x=>Number(x.dataset.pieceIndex))),[1,3],'placed piece must vanish from tray');
  await page.locator('.fr2-pie-builder [data-fr-action="piece"][data-piece="2"]').click();
  assert.deepEqual((await page.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot().build)).filled,[0],'same sector removes exactly that sector');
  await page.locator('.fr5-fox-mentor').click();
  assert.equal(await page.locator('.fr6-result .fr2-fraction').getAttribute('aria-label'),'1 av 4','fox hint may not change the cake');
  await page.locator('.fr6-piece-tray [data-piece-index="2"]').click();
  assert.deepEqual((await page.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot().build)).filled,[0,2],'a physical wedge must fill its own position');
  await page.locator('[data-fr-action="reset"]').click();
  assert.deepEqual((await page.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot().build)).filled,[]);
  assert.equal(await page.locator('.fr6-piece-tray .fr2-spare').count(),4);
  await page.locator('.fr6-piece-tray [data-piece-index="3"]').dragTo(page.locator('.fr2-build-target'));
  assert.deepEqual((await page.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot().build)).filled,[3],'dragging piece 4 must not fill piece 1: '+JSON.stringify(await page.evaluate(()=>LARIA_FRACTION_PREMIUM.dragDiagnostics())));
  // A denominator change may reshape the cake, but must not erase the
  // filled piece merely because its prior sector index is out of range.
  await page.locator('[data-fr-action="adjust"][data-field="d"][data-step="-1"]').click();
  assert.deepEqual(await page.evaluate(()=>{const x=LARIA_FRACTION_PREMIUM.snapshot().build;return [x.n,x.d,x.filled]}),[1,3,[2]],
     'splitting the cake into fewer parts must preserve its single filled piece');
  await page.locator('[data-fr-action="adjust"][data-field="d"][data-step="1"]').click();
  assert.deepEqual(await page.evaluate(()=>{const x=LARIA_FRACTION_PREMIUM.snapshot().build;return [x.n,x.d,x.filled]}),[1,4,[3]]);
  await page.locator('.fr6-piece-tray [data-piece-index="1"]').click();
  assert.deepEqual((await page.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot().build)).filled,[1,3]);
  await page.locator('[data-fr-action="adjust"][data-field="d"][data-step="1"]').click();
  assert.deepEqual(await page.evaluate(()=>[LARIA_FRACTION_PREMIUM.snapshot().build.n,LARIA_FRACTION_PREMIUM.snapshot().build.d]),[2,5]);
  assert.equal(await page.locator('.fr6-result .fr2-fraction').getAttribute('aria-label'),'2 av 5');
  await page.locator('[data-fr-action="next-build"]').click();
  assert.equal((await page.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot().build)).n,0);
  await photo(page,label+'-03-build');

  await page.locator('.fr6-nav [data-page="home"]').click();
  await page.locator('.fr6-more').waitFor();
  assert.equal(await page.locator('.fr2-home-card').count(),5,'other games remain accessible, not mandatory');
  assert.equal(await page.locator('.fr2-home-card .fr2-illustration').count(),5,'original game illustrations stay');
  const cardOverlaps=await page.locator('.fr2-home-card').evaluateAll(cards=>cards.map(card=>{
    const name=card.querySelector('strong').getBoundingClientRect(),arrow=card.querySelector('.fr2-card-arrow').getBoundingClientRect();
    return name.left<arrow.right&&name.right>arrow.left&&name.top<arrow.bottom&&name.bottom>arrow.top;
  }));
  assert.ok(cardOverlaps.every(x=>!x),label+' card labels must not overlap their arrows');
  assert.equal(await page.locator('.fr2-sign-decoration .fr2-illustration').count(),1);
  const scenery=await page.evaluate(async()=>({
    bg:getComputedStyle(document.querySelector('.fr2-world-art')).backgroundImage,
    workshop:(await fetch('./fraction-workshop-scene.svg')).status,
    foreground:(await fetch('./fraction-bakery-foreground-v4.svg')).status,
    painted:getComputedStyle(document.querySelector('.fr4-home-foreground')).backgroundImage
  }));
  assert.equal(scenery.workshop,200);
  assert.equal(scenery.foreground,200);
  assert.ok(scenery.bg.includes('fraction-workshop-scene.svg'));
  assert.ok(scenery.painted.includes('fraction-bakery-foreground-v4.svg'));
  assert.equal(await page.locator('.fr4-top .fr4-earned').count(),1);
  await photo(page,label+'-01-more');

  // Alternate shapes share exactly the fraction that the child just built.
  await page.locator('.fr2-card-explore').click();
  await page.locator('.fr6-explore').waitFor();
  assert.equal(await page.locator('.fr2-view').count(),4);
  assert.equal(await page.locator('.fr4-mode-art svg').count(),4);
  assert.equal(await page.locator('.fr4-presets .fr2-pie-preset').count(),7);
  assert.equal(await page.locator('.fr4-scene-fox .fr2-fox').count(),1);
  const same=await page.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot().build);
  assert.equal(await page.locator('.fr2-main-value .fr2-fraction').getAttribute('aria-label'),same.n+' av '+same.d);
  await photo(page,label+'-02-explore');
  await page.locator('.fr2-pie-large [data-fr-action="piece"][data-piece="3"]').click();
  assert.deepEqual((await page.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot().build)).filled,[3]);
  await page.locator('[data-fr-action="preset"][data-n="1"][data-d="2"]').click();
  assert.deepEqual(await page.evaluate(()=>{const x=LARIA_FRACTION_PREMIUM.snapshot().build;return [x.n,x.d,x.filled]}),[1,2,[0]]);
  await page.locator('[data-fr-action="view"][data-view="bar"]').click();
  await page.locator('.fr2-bar [data-fr-action="piece"][data-piece="1"]').click();
  assert.deepEqual((await page.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot().build)).filled,[0,1]);
  await page.locator('[data-fr-action="view"][data-view="grid"]').click();
  assert.equal(await page.locator('.fr2-block-grid span').count(),2);
  await page.locator('.fr2-block-grid [data-fr-action="piece"][data-piece="0"]').click();
  assert.deepEqual((await page.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot().build)).filled,[1]);
  await page.locator('[data-fr-action="view"][data-view="glass"]').click();
  await page.locator('.fr2-glass').focus();
  await page.locator('.fr2-glass').press('ArrowDown');
  assert.equal((await page.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot().build)).n,0);
  await page.locator('[data-fr-action="view"][data-view="circle"]').click();
  await page.locator('[data-fr-action="adjust"][data-field="n"][data-step="1"]').click();
  await page.locator('.fr6-nav [data-page="build"]').click();
  assert.equal(await page.locator('.fr6-result .fr2-fraction').getAttribute('aria-label'),'1 av 2','changing the view must never reset the same actual cake');

  await page.locator('.fr2-nav-item[data-page="home"]').click();
  await page.locator('.fr2-card-equal').click();
  await page.locator('.fr2-equal').waitFor();
  await photo(page,label+'-04-equal');
  assert.equal(await page.locator('.fr2-pie-compare').count(),2);
  assert.equal((await page.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot())).equal,0);
  await page.locator('[data-fr-action="guess"][data-guess="equal"]').click();
  assert.match(await page.locator('.fr2-feedback').innerText(),/Du fant det!/);
  assert.match(await page.locator('.fr2-aha').innerText(),/1\/2 = 2\/4/,'children must see a clear visual Aha moment');
  await page.locator('[data-fr-action="next-equal"]').click();
  assert.equal((await page.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot())).equal,1);

  // The 16 comparisons must balance equal and unequal amounts. Simply
  // answering "ja" must not pass, while the correct "nei" gives feedback.
  assert.match(await page.locator('.fr2-trail').innerText(),/av 16/);

  const markers=await page.locator('.fr2-trail-nodes i').evaluateAll(nodes=>({
    count:nodes.length,
    container:nodes[0].parentElement.getBoundingClientRect().toJSON(),
    markers:nodes.map(n=>n.getBoundingClientRect().toJSON())
  }));
  assert.equal(markers.count,16,'All 16 discovery milestones should render');
  assert.ok(markers.markers.every(m=>m.width>=9&&m.height>=9&&
    m.left>=markers.container.left-1&&m.right<=markers.container.right+1&&
    m.top>=markers.container.top-1&&m.bottom<=markers.container.bottom+1),
    label+' fraction milestones must stay fully visible: '+JSON.stringify(markers));

  await page.locator('[data-fr-action="guess"][data-guess="equal"]').click();
  assert.doesNotMatch(await page.locator('.fr2-feedback').innerText(),/Du fant det!/);
  await page.locator('[data-fr-action="guess"][data-guess="different"]').click();
  assert.match(await page.locator('.fr2-feedback').innerText(),/Du fant det!/);
  let equalCount=1,differentCount=1;
  for(let i=2;i<16;i++){
    await page.locator('[data-fr-action="next-equal"]').click();
    await page.locator('[data-fr-action="guess"][data-guess="equal"]').click();
    if((await page.locator('.fr2-feedback').innerText()).includes('Du fant det!'))equalCount++;
    else differentCount++;
  }
  assert.deepEqual([equalCount,differentCount],[8,8],'Eight equal and eight unequal fraction pairs expected');


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
  assert.equal(await page.locator('.fr2-journey-stop').count(),5,'illustrated discovery path needs real progress for each activity');
  assert.ok(await page.locator('.fr2-journey-stop.visited').count()>0,'only truly explored activities should be marked visited');
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
 for(const [name,type,devices] of [['chromium',chromium,[['iphone',{width:390,height:844}],['iphone-small',{width:375,height:667}],['ipad',{width:820,height:1180}]]],['webkit',webkit,[['iphone-safari',{width:390,height:844}],['iphone-small-safari',{width:375,height:667}],['ipad-safari',{width:820,height:1180}],['ipad-landscape-safari',{width:1180,height:820}]]]]){
  const browser=await type.launch({headless:true});try{for(const [label,viewport] of devices)await run(browser,name,label,viewport,url)}finally{await browser.close()}
 }
 console.log('PASS all Læria Brøklaben premium browser tests');
}finally{await new Promise(resolve=>srv.close(resolve))}})().catch(e=>{console.error(e);process.exitCode=1});
