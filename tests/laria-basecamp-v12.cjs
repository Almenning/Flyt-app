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
  const localUrl=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
  const publishedUrl=process.env.QA_WEBKIT_URL||'https://almenning.github.io/Flyt-app/laer-litt-mer/?app=laria';
  const targetUrl=(engineName==='webkit'?publishedUrl:localUrl)+(engineName==='webkit'?(publishedUrl.includes('?')?'&':'?')+'basecampqa='+Date.now():'');
  console.log('[basecamp]',engineName,name,'goto',targetUrl);
  const bootStarted=Date.now();
  await page.goto(targetUrl,{waitUntil:engineName==='chromium'&&name==='iphone'?'domcontentloaded':'networkidle'});
  try{
    await page.waitForFunction(()=>{
      const host=document.querySelector('.bc12'),screen=document.getElementById('home-screen');
      const globe=host?.querySelector('.bc12-place[data-camp="globe"]');
      return !!(host&&screen?.classList.contains('active')&&!host.hidden&&
        window.LARIA_BASECAMP_DIAG?.render&&globe&&!globe.disabled);
    },null,{timeout:10000});
  }catch(err){
    const boot=await page.evaluate(()=>({
      href:location.href,
      active:document.querySelector('.screen.active')?.id||null,
      onboarding:document.getElementById('onboarding')?.className||null,
      bc12Count:document.querySelectorAll('.bc12').length,
      bc12Hidden:document.querySelector('.bc12')?.hidden??null,
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
    assert.equal(await page.locator('.bc12-place[data-camp="globe"]').isEnabled(),true,'globe control must be interactive on first Home paint');
    console.log('[perf] iphone cold-home',homeReadyMs+'ms');
  }
  assert.equal(await page.locator('.bc12').getAttribute('data-release'),'basecamp-rc1',name+' wrong Basecamp release');
  assert.equal(await page.locator('.bc12-nav button').count(),4,name+' must expose four main navigation choices');
  assert.deepEqual(await page.locator('.bc12-nav button').allTextContents(),['Hjem','Reisen','Utforsk','Samlingen'],name+' main navigation contract changed');
  const progressPath=page.locator('.bc12-route-progress');
  assert.equal(await progressPath.count(),1,name+' needs a single physical journey-progress path');
  const progressVar=await page.locator('.bc12').evaluate(el=>getComputedStyle(el).getPropertyValue('--bc12-progress').trim());
  assert.match(progressVar,/^\d+(?:\.\d+)?$/,name+' journey progress must be bound to world state');
  await page.screenshot({path:`${screenshots}/${name}.png`,fullPage:true});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+' horizontal overflow');

  for(const [action,screen,back] of [['globe','world','world-back'],['fraction','fraction-lab','fraction-lab-back'],['multiply','multiplication-lab','multiplication-lab-back']]){
   console.log('[basecamp]',engineName,name,'open',action);
   const actionStarted=Date.now();
   await page.locator(`.bc12-place[data-camp="${action}"]`).tap();
   await page.locator(`#${screen}-screen.active`).waitFor({timeout:10000});
   if(engineName==='chromium'&&name==='iphone'&&action==='globe'){
    const openMs=Date.now()-actionStarted;
    assert.ok(openMs<900,'iphone Home -> globe took too long: '+openMs+'ms');
    await page.locator('#globe-canvas').waitFor({state:'visible',timeout:1500});
    await page.waitForFunction(()=>Number(document.getElementById('world-screen')?.dataset.globeReadyMs||0)>0,null,{timeout:900});
    const globeState=await page.evaluate(()=>({
      cssW:document.getElementById('globe-canvas')?._cssW||0,
      cssH:document.getElementById('globe-canvas')?._cssH||0,
      readyMs:Number(document.getElementById('world-screen')?.dataset.globeReadyMs||0),
      immediate:document.getElementById('world-screen')?.dataset.openedImmediately||''
    }));
    assert.ok(globeState.cssW>=280&&globeState.cssH>=280,'iphone globe canvas was not initialized immediately: '+JSON.stringify(globeState));
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

  await page.locator('.bc12-place[data-camp="words"]').tap();
  const hunt=page.locator('#word-hunt-overlay');await hunt.waitFor({state:'visible'});
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

  await page.locator('.bc12-journey').tap();await page.locator('#subject-screen.active').waitFor();await page.locator('.bok-v10-home').tap();
  await page.locator('[data-camp="quest"]').tap();assert(await page.locator('#bc12-dialog').isVisible());await page.getByRole('button',{name:'Kanskje senere'}).tap();
  await page.locator('.bc12-nav [data-camp="collection"]').tap();await page.getByRole('heading',{name:'Samlingen din'}).waitFor();await page.getByRole('button',{name:'Tilbake til basecamp'}).tap();
  await page.locator('.bc12-nav [data-camp="explore"]').tap();assert.equal(await page.locator('.bc12 h1').textContent(),'Hva vil du leke med?');
  assert.equal(await page.locator('[data-camp-fox-call]').textContent(),'Velg noe du liker!');
  await page.locator('.bc12-nav [data-camp="home"]').tap();
  const rcTouch=await page.locator('.bc12-nav button').evaluateAll(els=>els.map(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})));
  assert.ok(rcTouch.every(x=>x.w>=44&&x.h>=44),name+' RC navigation has undersized touch targets: '+JSON.stringify(rcTouch));
  assert.equal(await page.evaluate(()=>state.profile.grade),2);
  console.log(engineName+' '+name+': basecamp, real Ordjakt, routes, returns, optional quest, collection and explore passed');
  await context.close();
 }
 await browser.close();
 }
 assert.deepEqual(errors,[],'No JS errors');
})().catch(e=>{console.error(e);process.exit(1)});
