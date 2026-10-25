/* Læria basecamp v12 + Ordjakt: local browser regression and responsive touch checks. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const screenshots=process.env.QA_SCREENSHOTS||'/tmp/laria-v12-qa';fs.mkdirSync(screenshots,{recursive:true});
 const errors=[];
 const engines=[['chromium',chromium],['webkit',webkit]];
 for(const [engineName,engine] of engines){
 const browser=await engine.launch({headless:true,args:engineName==='chromium'?['--no-sandbox']:[]});
 for(const [name,width,height] of [['ipad-landscape',1180,820],['ipad-portrait',820,1180],['iphone',390,844],['small-phone',320,568],['desktop',1024,768]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:name.includes('phone'),hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(engineName+' '+name+': '+e.message));
  const requested=[];
  page.on('request',req=>requested.push(req.url()));
  if(engineName==='chromium'&&name==='iphone'){
    await page.route('https://raw.githubusercontent.com/**',async route=>{await new Promise(r=>setTimeout(r,5000));await route.fulfill({status:200,contentType:'application/json',body:'{"type":"FeatureCollection","features":[]}'});});
    await page.route('https://api.worldbank.org/**',async route=>{await new Promise(r=>setTimeout(r,5000));await route.fulfill({status:200,contentType:'application/json',body:'[{},[]]'});});
  }
  const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Testbarn',avatar:'boy',setupVersion:2},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
  await page.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed);
  // The interaction suite must exercise the exact checked-out PR code in both engines.
  // Published-runtime coverage runs separately in test:laria-live; using it here can
  // accidentally test an older Pages deployment than the change under review.
  const localUrl=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
  const targetUrl=localUrl+(localUrl.includes('?')?'&':'?')+'basecampqa='+Date.now();
  console.log('[basecamp]',engineName,name,'goto',targetUrl);
  const bootStarted=Date.now();
  await page.goto(targetUrl,{waitUntil:engineName==='chromium'&&name==='iphone'?'domcontentloaded':'networkidle'});
  try{
    const bootTimeout=engineName==='webkit'?20000:10000;
    await page.waitForFunction(()=>{
      const host=document.querySelector('.bc12'),screen=document.getElementById('home-screen');
      const subjects=host?.querySelectorAll('.bc14-subject');
      return !!(host&&screen?.classList.contains('active')&&!host.hidden&&
        window.LARIA_BASECAMP_DIAG?.render&&subjects?.length===4&&![...subjects].some(x=>x.disabled));
    },null,{timeout:bootTimeout});
  }catch(err){
    const boot=await page.evaluate(()=>({
      href:location.href,
      active:document.querySelector('.screen.active')?.id||null,
      onboarding:document.getElementById('onboarding')?.className||null,
      bc12Count:document.querySelectorAll('.bc12').length,
      bc12Hidden:document.querySelector('.bc12')?.hidden??null,
      globeCount:document.querySelectorAll('.bc12-place[data-camp="globe"]').length,
      globeDisabled:document.querySelector('.bc12-place[data-camp="globe"]')?.disabled??null,
      profile:JSON.parse(localStorage.getItem('laerlittmer-v2')||'null')?.profile||null,
      ready:document.readyState,
      bodyClass:document.body?.className||'',
      basecampDiag:window.LARIA_BASECAMP_DIAG||null,
      basecampScript:[...document.scripts].find(s=>s.src.includes('home-basecamp-v12.js'))?.src||null,
      basecampResource:performance.getEntriesByType('resource').filter(x=>String(x.name).includes('home-basecamp-v12.js')).map(x=>({name:x.name,duration:x.duration,transferSize:x.transferSize}))
    }));
    throw new Error(`Basecamp bootstrap failed: engine=${engineName} viewport=${name} state=${JSON.stringify(boot)} pageErrors=${JSON.stringify(errors.slice(-5))}; ${err.message}`);
  }
  if(engineName==='chromium'&&name==='iphone'){
    const homeReadyMs=Date.now()-bootStarted;
    assert.ok(homeReadyMs<2500,'iphone cold Home took too long: '+homeReadyMs+'ms');
    assert.equal(requested.some(u=>u.includes('raw.githubusercontent.com')||u.includes('api.worldbank.org')),false,'Home must not start external geography data during critical startup');
    assert.equal(await page.locator('.bc14-subject[data-camp="subject-geography"]').isEnabled(),true,'geography subject must be interactive on first Home paint');
    console.log('[perf] iphone cold-home',homeReadyMs+'ms');
  }
  assert.equal(await page.locator('.bc12').getAttribute('data-release'),'basecamp-rc1',name+' wrong Basecamp release');
  assert.equal(await page.locator('.bc12-nav button').count(),5,name+' must expose five main navigation choices');
  assert.deepEqual(await page.locator('.bc12-nav button').evaluateAll(nodes=>nodes.map(n=>n.dataset.camp)),['home','travel','explore','collection','wardrobe'],name+' main navigation action contract changed');
  const progressPath=page.locator('.bc12-route-progress');
  assert.equal(await progressPath.count(),1,name+' needs a single physical journey-progress path');
  const progressVar=await page.locator('.bc12').evaluate(el=>getComputedStyle(el).getPropertyValue('--bc12-progress').trim());
  assert.match(progressVar,/^\d+(?:\.\d+)?$/,name+' journey progress must be bound to world state');
  await page.screenshot({path:`${screenshots}/${name}.png`,fullPage:true});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+' horizontal overflow');

  assert.equal(await page.locator('.bc14-subject:visible').count(),4,name+' subject-first Home missing four illustrated subjects');
  await page.locator('.bc12-nav [data-camp="explore"]').tap();
  await page.locator('.bc13-panel:not([hidden]) [data-bc13-action="globe"]').waitFor();
  assert.equal(await page.locator('.bc12.bc15-locked-home').count(),0,name+' locked Home must yield to the existing Explore map-board');
  for(const [action,screen,back] of [['globe','world','world-back'],['fraction','fraction-lab','fraction-lab-back'],['multiply','multiplication-lab','multiplication-lab-back']]){
   console.log('[basecamp]',engineName,name,'open',action);
   const actionStarted=Date.now();
   await page.locator(`.bc13-card[data-bc13-action="${action}"]`).tap();
   await page.locator(`#${screen}-screen.active`).waitFor({timeout:10000});
   if(engineName==='chromium'&&name==='iphone'&&action==='globe'){
    const openMs=Date.now()-actionStarted;
    assert.ok(openMs<900,'iphone Home -> globe took too long: '+openMs+'ms');
    await page.waitForFunction(()=>document.getElementById('world-screen')?.dataset.mapPerspective==='globe',null,{timeout:1500});
    await page.locator('#globe-canvas').waitFor({state:'visible',timeout:1500});
    await page.waitForFunction(()=>document.getElementById('world-screen')?.dataset.premiumGlobeMode==='classic',null,{timeout:900});
    await page.waitForFunction(()=>Number(document.getElementById('world-screen')?.dataset.globeReadyMs||0)>0,null,{timeout:900});
    const globeState=await page.evaluate(()=>({
      cssW:document.getElementById('globe-canvas')?._cssW||0,
      cssH:document.getElementById('globe-canvas')?._cssH||0,
      readyMs:Number(document.getElementById('world-screen')?.dataset.globeReadyMs||0),
      immediate:document.getElementById('world-screen')?.dataset.openedImmediately||''
    }));
    const atlasBox=await page.locator('#globe-canvas').boundingBox();
    assert.ok(atlasBox&&atlasBox.width>=200&&atlasBox.height>=180,'iphone spherical globe was not drawn immediately: '+JSON.stringify(atlasBox));
    assert.equal(globeState.immediate,'true','globe screen did not switch immediately');
    assert.ok(globeState.readyMs>0&&globeState.readyMs<900,'globe renderer took too long after tap: '+JSON.stringify(globeState));
    assert.equal(requested.some(u=>u.includes('geografi-verden.png')||u.includes('globe-map-art-v1.png')),false,'opening globe must not fetch multi-megabyte static geography art');
    console.log('[perf] iphone home-to-globe',openMs+'ms','renderer',globeState.readyMs+'ms');
   }
   console.log('[basecamp]',engineName,name,'back',action);
   await page.locator('#'+back).tap();
   try{
    await page.locator('#home-screen.active').waitFor({timeout:10000});
    console.log('[basecamp]',engineName,name,'returned',action);
   }catch(err){
    const active=await page.evaluate(()=>document.querySelector('.screen.active')?.id||null);
    throw new Error(`Basecamp return failed: engine=${engineName} viewport=${name} action=${action} active=${active}; ${err.message}`);
   }
  }

  await page.locator('.bc13-card[data-bc13-action="words"]').tap();
  const hunt=page.locator('#word-hunt-overlay');await hunt.waitFor({state:'visible'});
  const entrance=hunt.locator('.word-hunt-theme-picker:not([hidden])');
  await entrance.waitFor();
  assert.equal(await entrance.locator('.wh-theme-card').count(),5,name+' five Ordjakt topics must be visible before game');
  await entrance.locator('[data-word-theme="mixed"]').tap();
  await entrance.waitFor({state:'hidden'});
  await hunt.locator('.word-hunt-cell:visible').first().waitFor();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+' Ordjakt overflow');
  const pick=await page.evaluate(()=>{
    const cells=[...document.querySelectorAll('.word-hunt-cell')];
    const size=Math.round(Math.sqrt(cells.length));
    const letters=cells.map(x=>x.textContent.trim());
    const word=document.querySelector('.word-hunt-word')?.textContent.replace(/^✓\s*/,'').trim();
    const dirs=[[0,1],[1,0],[0,-1],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];
    if(!word)return null;
    for(let r=0;r<size;r++)for(let c=0;c<size;c++)for(const [dr,dc] of dirs){
      let s='',rr=r,cc=c;for(let i=0;i<word.length;i++,rr+=dr,cc+=dc){
        if(rr<0||cc<0||rr>=size||cc>=size){s='';break}s+=letters[rr*size+cc];
      }
      if(s===word)return {word,start:[r,c],end:[r+dr*(word.length-1),c+dc*(word.length-1)]};
    }
    return null;
  });
  assert(pick,name+' could not locate first Ordjakt word in grid');
  await page.locator(`.word-hunt-cell[data-r="${pick.start[0]}"][data-c="${pick.start[1]}"]`).tap();
  await page.locator(`.word-hunt-cell[data-r="${pick.end[0]}"][data-c="${pick.end[1]}"]`).tap();
  assert(await page.locator('.word-hunt-word.found').count()>=1,name+' Ordjakt selection did not register');
  await page.locator('.word-hunt-back').tap();await hunt.waitFor({state:'hidden'});

  await page.locator('.bc12-nav [data-camp="home"]').tap();
  await page.locator('.bc12-journey').tap();
  await page.locator('#eggenipa-world:visible').waitFor({timeout:16000});
  await page.locator('#eggenipa-world .eg-portal[data-eg="map"]').tap();
  await page.locator('#subject-screen.active .locked-journey-map[data-journey-subject="norwegian"]').waitFor({state:'visible',timeout:16000});
  await page.locator('#eggenipa-map-return:visible').tap();
  await page.locator('#eggenipa-world:visible').waitFor({timeout:16000});
  await page.locator('#eggenipa-world [data-eg="home"]').tap();
  await page.locator('.bc12.bc15-locked-home').waitFor({state:'visible',timeout:12000});
  await page.locator('.bc12-nav [data-camp="collection"]').tap();
  await page.getByRole('heading',{name:'Lærias magiske samlebok'}).waitFor();
  assert.equal(await page.locator('#bc12-dialog [data-collection-tab],#bc12-dialog .bc12-equipment-card').count(),0,name+' must hide unpublished equipment');
  await page.locator('#bc12-dialog [data-wardrobe-open]').tap();
  assert.equal(await page.locator('#bc12-dialog.is-wardrobe .bc12-wardrobe-preview svg').count(),1,name+' must retain selected fox');
  assert.equal(await page.locator('#bc12-dialog.is-wardrobe [data-wear],#bc12-dialog.is-wardrobe [data-gear]').count(),0,name+' must hide unfinished wearable visuals');
  await page.locator('#bc12-dialog .bc12-close').tap();
  await page.locator('.bc12-nav [data-camp="explore"]').tap();
  await page.locator('.bc13-panel:not([hidden])').waitFor({state:'visible',timeout:10000});
  assert.equal(await page.locator('.bc12.bc15-locked-home').count(),0,name+' Explore must use the existing Basecamp surface until its redesign pass');
  await page.locator('.bc12-nav [data-camp="wardrobe"]').tap();
  assert.equal(await page.locator('#bc12-dialog.is-wardrobe .bc12-wardrobe-preview svg').count(),1,name+' legacy Explore must retain selected fox until that surface is redesigned');
  assert.equal(await page.locator('#bc12-dialog.is-wardrobe [data-wear],#bc12-dialog.is-wardrobe [data-gear]').count(),0,name+' legacy Explore must not expose unfinished outfits');
  await page.locator('#bc12-dialog .bc12-close').tap();
  await page.locator('.bc12-nav [data-camp="home"]').tap();
  await page.locator('.bc12.bc15-locked-home').waitFor({state:'visible',timeout:12000});
  const rcTouch=await page.locator('.bc12-nav button').evaluateAll(els=>els
    .filter(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0})
    .map(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height,camp:el.dataset.camp})));
  assert.ok(rcTouch.length>=4&&rcTouch.every(x=>x.w>=44&&x.h>=44),name+' visible RC navigation has undersized touch targets: '+JSON.stringify(rcTouch));
  assert.equal(await page.evaluate(()=>state.profile.grade),2);
  console.log(engineName+' '+name+': Home v15, real Ordjakt, routes, returns, collection and legacy Explore passed');
  await context.close();
 }
 await browser.close();
 }
 assert.deepEqual(errors,[],'No JS errors');
})().catch(e=>{console.error(e);process.exit(1)});
