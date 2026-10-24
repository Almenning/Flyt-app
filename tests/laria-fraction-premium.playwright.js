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

  const reducedEquivalents=await page.evaluate(()=>[[3,6],[0,3],[3,3],[1,3]].map(([n,d])=>LARIA_FRACTION_PREMIUM.format(n,d)));
  assert.deepEqual(reducedEquivalents.map(x=>[x.dec,x.pct,x.exact]),[
    ['0,5','50 %',true],
    ['0','0 %',true],
    ['1','100 %',true],
    ['≈ 0,333…','≈ 33,3 %',false]
  ],'only genuinely repeating decimals may use approximate values');

  assert.deepEqual((await page.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot().build)).filled,[0]);
  assert.deepEqual(await page.locator('.fr6-piece-tray .fr2-spare').evaluateAll(xs=>xs.map(x=>Number(x.dataset.pieceIndex))),[1,2,3]);
  await page.locator('.fr5-fox-mentor .fr2-fox').evaluate(img=>img.decode());
  const firstFold=await page.evaluate(()=>{
    const rect=selector=>document.querySelector(selector)?.getBoundingClientRect();
    const cake=rect('.fr5-build-target .fr2-pie-builder'),value=rect('.fr6-result .fr2-fraction'),controls=rect('.fr6-workshop .fr6-controls');
    const fox=document.querySelector('.fr5-fox-mentor .fr2-fox');
    const equivalents=rect('.fr7-tablet-equivalents');
    return {
      cakeVisible:!!cake&&cake.width>100&&cake.top>=0&&cake.bottom<=innerHeight,
      fractionVisible:!!value&&value.height>65&&value.top>=0&&value.bottom<=innerHeight,
      controlsVisible:!!controls&&controls.top>=0&&controls.bottom<=innerHeight,
      fractionAboveControls:!!value&&!!controls&&value.bottom<controls.top,
      correctFox:!!fox&&fox.getAttribute('src')===window.LARIA_FOX.worldSource(window.LARIA_FOX.choice())&&fox.complete&&fox.naturalWidth>0,
      equivalentsBesideCake:innerWidth<700||(!!equivalents&&equivalents.top>=0&&equivalents.bottom<=innerHeight&&equivalents.left>cake.right-3),
      controlsHeight:controls?.height,
      viewportHeight:innerHeight,cakeBottom:Math.round(cake?.bottom||0),fractionBottom:Math.round(value?.bottom||0),controlsTop:Math.round(controls?.top||0),controlsBottom:Math.round(controls?.bottom||0),
      noOverflow:document.documentElement.scrollWidth<=innerWidth+3
    };
  });
  if(label.includes('tiny'))await photo(page,label+'-00-first-fold-diagnostic');
  assert.ok(firstFold.cakeVisible&&firstFold.fractionVisible&&firstFold.controlsVisible&&firstFold.fractionAboveControls&&firstFold.correctFox&&firstFold.equivalentsBesideCake&&firstFold.noOverflow,
    label+' first viewport must show cake, 1/4, both controls and personal fox: '+JSON.stringify(firstFold));
  assert.ok(firstFold.controlsHeight>=58,'real controls must remain touchable');
  const tablet=viewport.width>=700;
  // The cake is still the whole first interaction on a phone.
  // iPad uses available space to display equivalent values beside it.
  assert.equal(await page.locator('.fr7-tablet-equivalents').isVisible(),tablet,label+' iPad equivalent panel');
  assert.equal(await page.locator('.fr7-equivalents-toggle').isVisible(),!tablet,label+' mobile optional reveal');
  assert.equal(await page.locator('#fr7-mobile-values').isVisible(),false,label+' do not force decimals on first phone view');
  if(viewport.width>=1000){
    const usableWidth=await page.locator('.fr2-content').evaluate(el=>el.getBoundingClientRect().width);
    assert.ok(usableWidth>=900,label+' premium iPad landscape workshop must use its available width: '+usableWidth);
  }
  await photo(page,label+'-01-home');
  if(tablet){
    assert.deepEqual(await page.locator('.fr7-tablet-equivalents .fr7-equivalent-tile strong').allTextContents(),['0,25','25 %']);
  }else{
    await page.locator('.fr7-equivalents-toggle').click();
    assert.equal(await page.locator('.fr7-equivalents-toggle').getAttribute('aria-expanded'),'true');
    assert.equal(await page.locator('#fr7-mobile-values').isVisible(),true);
    assert.deepEqual(await page.locator('#fr7-mobile-values .fr7-equivalent-tile strong').allTextContents(),['0,25','25 %']);
    await photo(page,label+'-01-decimals-visible');
  }
  // Keyboard interaction must remain on the same tactile control after
  // replacing the fraction DOM. Children must be able to press twice.
  const up=page.locator('.fr6-controls [data-fr-action="adjust"][data-field="n"][data-step="1"]');
  await up.focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('.fr6-result .fr2-fraction').getAttribute('aria-label'),'2 av 4');
  assert.ok(await up.evaluate(el=>document.activeElement===el),label+' lost focus after teller increase');
  const down=page.locator('.fr6-controls [data-fr-action="adjust"][data-field="n"][data-step="-1"]');
  await down.focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('.fr6-result .fr2-fraction').getAttribute('aria-label'),'1 av 4');
  assert.ok(await down.evaluate(el=>document.activeElement===el),label+' lost focus after teller decrease');
  await page.locator('.fr2-pie-builder [data-fr-action="piece"][data-piece="2"]').click();
  assert.deepEqual((await page.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot().build)).filled,[0,2],'tap adds the touched sector, not the next one');
  assert.equal(await page.locator('.fr6-result .fr2-fraction').getAttribute('aria-label'),'2 av 4');
  assert.deepEqual(await page.locator((tablet?'.fr7-tablet-equivalents':'#fr7-mobile-values')+' .fr7-equivalent-tile strong').allTextContents(),['0,5','50 %'],
    label+' cake and equivalent numbers must change together');
  if(!tablet){
    await page.locator('.fr7-equivalents-toggle').click();
    assert.equal(await page.locator('#fr7-mobile-values').isVisible(),false);
  }
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
  // A voluntary adventure cannot require completing a quest before free play.
  assert.equal(await page.locator('.fr8-scene').getAttribute('data-fr8-quest'),'free');
  await page.locator('[data-fr-action="half-quest"]').click();
  assert.equal(await page.locator('.fr8-scene').getAttribute('data-fr8-quest'),'active');
  await page.locator('[data-fr-action="adjust"][data-field="d"][data-step="-1"]').click();
  await page.locator('[data-fr-action="adjust"][data-field="d"][data-step="-1"]').click();
  assert.equal((await page.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot().build)).d,2);
  await page.locator('[data-fr-action="adjust"][data-field="n"][data-step="1"]').click();
  assert.equal(await page.locator('.fr8-scene').getAttribute('data-fr8-found'),'true');
  assert.match(await page.locator('.fr8-quest-text').innerText(),/1\\/2/);
  await photo(page,label+'-03-half-quest');
  await page.locator('[data-fr-action="half-quest"]').click();
  assert.equal(await page.locator('.fr8-scene').getAttribute('data-fr8-quest'),'free');
  assert.equal((await page.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot().build)).n,1,'switching to free play must not reset the cake');

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
  // Rounded repeating decimals/percentages must never masquerade as exact.
  await page.locator('[data-fr-action="adjust"][data-field="d"][data-step="1"]').click();
  assert.equal(await page.locator('.fr6-result .fr2-fraction').getAttribute('aria-label'),'1 av 3');
  if(!tablet)await page.locator('.fr7-equivalents-toggle').click();
  const approximate=await page.locator((tablet?'.fr7-tablet-equivalents':'#fr7-mobile-values')+' .fr7-equivalent-tile strong').allTextContents();
  assert.ok(approximate[0].startsWith('≈ 0,333')&&approximate[1].startsWith('≈ 33,3'),
    label+' 1/3 is approximate in decimal/percent: '+JSON.stringify(approximate));
  if(!tablet)await page.locator('.fr7-equivalents-toggle').click();
  await page.locator('[data-fr-action="adjust"][data-field="d"][data-step="-1"]').click();
  assert.equal(await page.locator('.fr6-result .fr2-fraction').getAttribute('aria-label'),'1 av 2');
  
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
// iPhone landscape must remain an actual phone viewport, not an iPad.
// Capture geometry before asserting so a short WebKit screen yields actionable logs.
async function runLandscape(browser,engine,url){
 const ctx=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:1,serviceWorkers:'block',isMobile:true,hasTouch:true});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.addInitScript(p=>{localStorage.setItem('laerlittmer-v2',JSON.stringify(p))},profile);
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.LARIA_FRACTION_PREMIUM?.version==='workshop-v1',{},{timeout:20000});
  await page.evaluate(()=>openFractionLab());
  await page.locator('.fr6-workshop').waitFor();
  await page.locator('.fr5-fox-mentor .fr2-fox').evaluate(img=>img.decode());
  const metric=await page.evaluate(()=>{
   const rect=q=>{const r=document.querySelector(q)?.getBoundingClientRect();return r?{left:Math.round(r.left),right:Math.round(r.right),top:Math.round(r.top),bottom:Math.round(r.bottom),width:Math.round(r.width),height:Math.round(r.height)}:null};
   return {height:innerHeight,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
    cake:rect('.fr5-build-target .fr2-pie-builder'),fraction:rect('.fr6-result .fr2-fraction'),
    controls:rect('.fr6-workshop .fr6-controls'),fox:rect('.fr5-fox-mentor .fr2-fox')};
  });
  console.log('FRACTION_LANDSCAPE_'+engine+': '+JSON.stringify(metric));
  await photo(page,engine+'-iphone-landscape-01-workshop');
  assert.ok(metric.cake&&metric.cake.width>=100&&metric.fraction&&metric.fraction.height>=65&&metric.controls&&metric.fox,engine+' phone landscape primary pieces missing');
  const touches=await page.locator('#fraction-lab-back, .fr6-controls .fr2-adjust-btn').evaluateAll(nodes=>nodes.map(n=>({label:n.getAttribute('aria-label'),width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height})));
  assert.ok(touches.every(x=>x.width>=44&&x.height>=44),engine+' landscape touch targets smaller than 44px: '+JSON.stringify(touches));
  assert.ok(metric.scrollWidth<=metric.width+3,engine+' phone landscape horizontal overflow: '+JSON.stringify(metric));
  assert.ok([metric.cake,metric.fraction,metric.controls].every(r=>r.top>=0&&r.bottom<=metric.height),
   engine+' iPhone landscape cake, 1/4 and controls must fit without scrolling: '+JSON.stringify(metric));
  await page.locator('.fr2-pie-builder [data-fr-action="piece"][data-piece="2"]').click();
  assert.equal(await page.locator('.fr6-result .fr2-fraction').getAttribute('aria-label'),'2 av 4');
  await photo(page,engine+'-iphone-landscape-02-response');
  assert.deepEqual(errors,[],engine+' landscape page errors');
 }finally{await ctx.close()}
}
(async()=>{const {srv,url}=await server(),failures=[];try{
 for(const [name,type,devices] of [['chromium',chromium,[['iphone',{width:390,height:844}],['iphone-small',{width:375,height:667}],['iphone-tiny',{width:320,height:568}],['ipad',{width:820,height:1180}]]],['webkit',webkit,[['iphone-safari',{width:390,height:844}],['iphone-small-safari',{width:375,height:667}],['iphone-tiny-safari',{width:320,height:568}],['ipad-safari',{width:820,height:1180}],['ipad-landscape-safari',{width:1180,height:820}]]]]){
  const browser=await type.launch({headless:true});try{
   for(const [label,viewport] of devices){try{await run(browser,name,label,viewport,url)}catch(e){failures.push(name+' '+label+': '+e.message);console.error('FAIL '+name+' '+label+': '+e.stack)}}
   try{await runLandscape(browser,name,url)}catch(e){failures.push(name+' iphone-landscape: '+e.message);console.error('FAIL '+name+' iphone-landscape: '+e.stack)}
  }finally{await browser.close()}
 }
 if(failures.length)throw new Error('Brøklaben device failures:\\n'+failures.join('\\n'));
 console.log('PASS all Læria Brøklaben premium browser tests');
}finally{await new Promise(resolve=>srv.close(resolve))}})().catch(e=>{console.error(e);process.exitCode=1});
