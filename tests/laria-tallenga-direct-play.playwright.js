'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'..');
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Testbarn',avatar:'girl',setupVersion:2},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
const out=process.env.TALLENGA_QA_SCREENSHOTS||'/tmp/laria-tallenga-direct';
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const serve=()=>new Promise((resolve,reject)=>{
 const server=http.createServer((req,res)=>{
  let url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(url.endsWith('/'))url+='index.html';
  const file=path.resolve(root,'.'+url);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(data);});
 });
 server.once('error',reject);
 server.listen(0,'127.0.0.1',()=>resolve({server,url:'http://127.0.0.1:'+server.address().port+'/laer-litt-mer/?app=laria'}));
});
async function run(engine,engineName,label,width,height,url){
 const browser=await engine.launch({headless:true,...(engineName==='chromium'?{args:['--no-sandbox']}:{})});
 const context=await browser.newContext({viewport:{width,height},isMobile:width<600,hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 await page.addInitScript(data=>localStorage.setItem('laerlittmer-v2',JSON.stringify(data)),seed);
 await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
 await page.route('https://api.worldbank.org/**',r=>r.abort());
 try{
  await page.goto(url+'&tallenga=prototype',{waitUntil:'domcontentloaded'});
  await page.locator('#home-screen.active').waitFor();
  await page.locator('.bc14-subject[data-camp="subject-math"]:visible').click();
  await page.waitForTimeout(300);
  const diag=await page.evaluate(()=>({
   url:location.href,
   prototype:typeof window.LARIA_TALLENGA_PROTOTYPE,
   openSubject:typeof window.openSubject,
   subjectActive:document.getElementById('subject-screen')?.classList.contains('active'),
   subjectKey:document.getElementById('subject-screen')?.dataset.subject,
   screenClasses:document.getElementById('subject-screen')?.className,
   previewExists:!!document.getElementById('tallenga-direct-play'),
   previewStyle:document.getElementById('tallenga-direct-play')?getComputedStyle(document.getElementById('tallenga-direct-play')).display:null,
   currentActive:document.querySelector('.screen.active')?.id,
   scriptPresent:!!document.querySelector('script[src*="tallenga-direct-play-prototype"]'),
   errorMessage:document.querySelector('.toast')?.textContent
  }));
  console.log('TALLENGA_DIAG '+engineName+' '+label+' '+JSON.stringify(diag)+' PAGE_ERRORS='+JSON.stringify(errors));
  assert(diag.prototype==='object'&&diag.subjectActive&&diag.previewExists&&diag.screenClasses.includes('tlp-active'),
   'Matte did not open Tallenga; '+JSON.stringify(diag)+' errors '+JSON.stringify(errors));
  await page.locator('#tallenga-direct-play:visible').waitFor({timeout:4000});
  // The original troll files are deliberately not composited into this scene.
  // They are flattened, low-resolution WebPs with baked ground and no rig/layer
  // data. Showing them as hero or card cut-outs would violate the art gate.
  assert.equal(await page.locator('.tlp-troll-trio, .tlp-game-art img').count(),0);
  assert.equal(await page.locator('.tlp-game:visible').count(),3);
  // Each math activity needs its OWN working illustration rather than three
  // crops of the same generic mountain. Validate both reference and bytes.
  const activityArt=await page.evaluate(async()=>{
    const expected=[
      ['multiply','gangemagi-tallenga-market-v1.svg'],
      ['fraction','fraction-workshop-scene.svg'],
      ['table','math-pattern-haven-storymap-v1.svg']
    ];
    return await Promise.all(expected.map(async([action,file])=>{
      const node=document.querySelector('.tlp-game[data-tlp="'+action+'"] .tlp-game-art');
      const background=node?getComputedStyle(node).backgroundImage:'none';
      const res=await fetch('./'+file,{cache:'no-store'});
      const parsed=new DOMParser().parseFromString(await res.text(),'image/svg+xml');
      return {action,file,background,status:res.status,isSvg:parsed.documentElement.tagName==='svg',
        parseError:!!parsed.querySelector('parsererror')};
    }));
  });
  assert(activityArt.every(a=>a.background.includes(a.file)&&a.status===200&&a.isSvg&&!a.parseError),
    'every activity needs a distinct loadable SVG artwork: '+JSON.stringify(activityArt));
  // Three stage planes share the SAME natural 1500x680 world coordinates.
  // Layered character assets remain deliberately absent until approved.
  const stage=await page.evaluate(()=>{
    const sc=document.querySelector('.tlp-scene');
    const back=getComputedStyle(sc);
    const actor=document.querySelector('.tlp-stage-actors');
    const front=document.querySelector('.tlp-stage-foreground');
    const foreStyle=front&&getComputedStyle(front);
    // The hero uses two CSS background layers: a tint gradient followed by
    // the actual image. The foreground uses one image. Compare image to image.
    const imageLayer=v=>v.split(',').at(-1).trim();
    return {back:back.backgroundImage,actors:actor?.children.length,front:foreStyle?.backgroundImage,
      backgroundPosition:imageLayer(back.backgroundPosition),foregroundPosition:foreStyle?.backgroundPosition,
      backgroundSize:imageLayer(back.backgroundSize),foregroundSize:foreStyle?.backgroundSize};
  });
  assert.match(stage.back,/tallenga-fjord-background-v2\.svg/,'painted backdrop layer must be active');
  assert.match(stage.front,/tallenga-fjord-foreground-v2\.svg/,'front meadow must occlude future actors');
  assert.equal(stage.actors,0,'No low-res cardboard trolls may be placed in actor depth plane');
  assert.equal(stage.backgroundPosition,stage.foregroundPosition,'foreground alignment must match actual background image, not tint gradient');
  assert.equal(stage.backgroundSize,stage.foregroundSize,'both painted layers must share the same crop/scale');
  assert.equal(stage.foregroundSize,'cover');
  const layerFiles=await page.evaluate(async()=>{
    const files=['tallenga-fjord-background-v2.svg','tallenga-fjord-foreground-v2.svg'];
    return Promise.all(files.map(async file=>{
      const response=await fetch('./'+file,{cache:'no-store'});
      const source=await response.text();
      const svg=new DOMParser().parseFromString(source,'image/svg+xml').documentElement;
      return {file,status:response.status,tag:svg.tagName,viewBox:svg.getAttribute('viewBox'),
        parseError:!!svg.querySelector('parsererror')};
    }));
  });
  assert(layerFiles.every(x=>x.status===200&&x.tag==='svg'&&x.viewBox==='0 0 1500 680'&&!x.parseError),
    'painted backdrop and foreground must both be valid, aligned SVG images: '+JSON.stringify(layerFiles));
  // Check visually significant painted layers, not merely game-button routing.
  const artwork=await page.evaluate(()=>{
    const root=document.querySelector('#subject-screen');
    const el=document.querySelector('#tallenga-direct-play');
    const intro=document.querySelector('.tlp-intro h1');
    const legacy=document.querySelector('#subject-journey-section');
    const shell=document.querySelector('.app');
    return {preview:getComputedStyle(el).display,
      legacy:getComputedStyle(legacy).display,
      background:getComputedStyle(shell).backgroundImage,
      subjectBackground:getComputedStyle(root).backgroundImage,
      title:getComputedStyle(intro).color,
      mobileWidth:document.documentElement.scrollWidth,
      viewport:window.innerWidth};
  });
  assert.equal(artwork.legacy,'none','old journey must not appear below Tallenga: '+JSON.stringify(artwork));
  assert.equal(artwork.background,'none','old journey photo must not bleed through Tallenga: '+JSON.stringify(artwork));
  assert(artwork.mobileWidth<=artwork.viewport+4,'no horizontal overflow '+JSON.stringify(artwork));
  const sizes=await page.evaluate(()=>({inner:innerWidth,scroll:document.documentElement.scrollWidth,targets:[...document.querySelectorAll('#tallenga-direct-play button')].map(b=>({w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height}))}));
  assert(sizes.scroll<=sizes.inner+4,'horizontal overflow '+JSON.stringify(sizes));
  assert(sizes.targets.every(x=>x.h>=44),'small buttons '+JSON.stringify(sizes));
  await fs.promises.mkdir(out,{recursive:true});
  await page.screenshot({path:path.join(out,engineName+'-'+label+'-tallenga.png'),fullPage:true,animations:'disabled'});
  await page.locator('[data-tlp="multiply"]').click();
  await page.locator('#multiplication-lab-screen.active').waitFor();
  const gameBefore=await page.evaluate(()=>window.LARIA_GANGEMAGI.snapshot().counts[0]);
  await page.locator('[data-gm-action="source"]').click();
  await page.locator('[data-gm-action="basket"][data-gm-basket="0"]').click();
  assert.equal((await page.evaluate(()=>window.LARIA_GANGEMAGI.snapshot().counts[0])),gameBefore+1,
    label+' one berry must add exactly one to the real game state');
  if(engineName==='webkit'){
    await page.screenshot({path:path.join(out,'webkit-'+label+'-gangemagi-play.png'),fullPage:true,animations:'disabled'});
  }
  await page.locator('.gm-back, [data-gm-action="back"]').first().click();
  await page.locator('#tallenga-direct-play:visible').waitFor();
  await page.locator('[data-tlp="multiply"]').click();
  await page.locator('#multiplication-lab-screen.active').waitFor();
  assert.equal((await page.evaluate(()=>window.LARIA_GANGEMAGI.snapshot().counts[0])),gameBefore+1,
    label+' game state must survive returning to Tallenga and re-opening');
  // Test persisted math, not merely the in-memory game scene. The independent
  // Gangemagi storage schema must survive a real page reload.
  const savedCount=await page.evaluate(()=>JSON.parse(localStorage.getItem('laria-gangemagi-v1')||'null')?.counts?.[0]);
  assert.equal(savedCount,gameBefore+1,label+' basket change not saved to localStorage');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#home-screen.active').waitFor();
  await page.locator('.bc14-subject[data-camp="subject-math"]:visible').click();
  await page.locator('#tallenga-direct-play:visible').waitFor();
  await page.locator('[data-tlp="multiply"]').click();
  await page.locator('#multiplication-lab-screen.active').waitFor();
  assert.equal((await page.evaluate(()=>window.LARIA_GANGEMAGI.snapshot().counts[0])),gameBefore+1,
    label+' saved basket must survive a full browser reload and return to Tallenga');
  await page.locator('.gm-back, [data-gm-action="back"]').first().click();
  await page.locator('#tallenga-direct-play:visible').waitFor();
  await page.locator('[data-tlp="fraction"]').click();
  await page.locator('#fraction-lab-screen.active').waitFor();
  const beforeFraction=await page.locator('.fr6-result .fr2-fraction').getAttribute('aria-label');
  assert.equal(beforeFraction,'1 av 4',label+' Brøklab must start with a real quarter cake');
  await page.locator('.fr6-controls [data-fr-action="adjust"][data-field="n"][data-step="1"]').click();
  assert.equal(await page.locator('.fr6-result .fr2-fraction').getAttribute('aria-label'),'2 av 4',
    label+' Brøklab cake and fraction must respond to a real math action');
  if(engineName==='webkit'){
    await page.screenshot({path:path.join(out,'webkit-'+label+'-broklab-play.png'),fullPage:true,animations:'disabled'});
  }
  // The fraction premium screen has an existing back contract to math.
  await page.locator('[data-fr-action="back"]').first().click();
  await page.locator('#tallenga-direct-play:visible').waitFor();
  await page.locator('[data-tlp="table"]').click();
  await page.locator('#multiplication-lab-screen.active .mp-explore-screen').waitFor();
  assert.equal(await page.locator('#multiplication-lab-root .mp-explore-tab[data-mode="table"][aria-pressed="true"]').count(),1,'table mode not selected');
  await page.evaluate(()=>openSubject('math'));
  await page.locator('[data-tlp="next"]').click();
  await page.locator('#session-screen.active').waitFor();
  assert.equal(await page.evaluate(()=>sessionScope.subject),'math');
  await page.evaluate(()=>openSubject('math'));
  // The old painted journey must be created on demand, not behind the
  // direct-play content. The previous source contract is still preserved.
  assert.equal(await page.locator('#subject-screen.locked-journey-active').count(),0,
    'direct-play must not boot the legacy map rendering layer');
  await page.locator('[data-tlp="original"]').click();
  assert.equal(await page.locator('#subject-screen.tlp-active').count(),0);
  await page.locator('#journey-map:visible').waitFor();
  await page.locator('#subject-screen.locked-journey-active').waitFor();
  assert.equal(await page.locator('#journey-map').getAttribute('data-journey-subject'),'math');
  assert.deepEqual(errors,[],'runtime page errors');
  console.log('PASS '+engineName+' '+label);
 }finally{await context.close();await browser.close();}
}

async function checkUnflaggedOriginal(engine,engineName,url){
 // A separate fresh browser context proves that default Læria never sees
 // any prototype UI or modified chapter navigation.
 const browser=await engine.launch({headless:true,...(engineName==='chromium'?{args:['--no-sandbox']}:{})});
 const context=await browser.newContext({viewport:{width:820,height:1180},hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 await page.addInitScript(data=>localStorage.setItem('laerlittmer-v2',JSON.stringify(data)),seed);
 await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
 await page.route('https://api.worldbank.org/**',r=>r.abort());
 try{
   await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.locator('#home-screen.active').waitFor();
   assert.equal(await page.evaluate(()=>window.LARIA_TALLENGA_PROTOTYPE),undefined,
     engineName+' default launch must not enable the prototype');
   await page.locator('.bc14-subject[data-camp="subject-math"]:visible').click();
   await page.locator('#subject-screen.active').waitFor();
   await page.locator('#journey-map:visible').waitFor();
   assert.equal(await page.locator('#tallenga-direct-play').count(),0,
     engineName+' default math journey must not mount direct-play markup');
   assert.equal(await page.locator('#journey-map').getAttribute('data-journey-subject'),'math');
   await page.evaluate(()=>openSubject('norwegian'));
   assert.equal(await page.locator('#subject-screen.active').getAttribute('data-subject'),'norwegian');
   await page.evaluate(()=>openSubject('english'));
   assert.equal(await page.locator('#subject-screen.active').getAttribute('data-subject'),'english');
   assert.equal(await page.locator('#tallenga-direct-play').count(),0);
   assert.equal(await page.locator('#open-world').count(),1,'existing Kloden entrance must remain installed');
   assert.deepEqual(errors,[],engineName+' default experience page errors');
   console.log('PASS '+engineName+' default no-prototype regression');
 }finally{await context.close();await browser.close();}
}

(async()=>{
 const {server,url}=await serve();
 try{
  for(const [e,n] of [[chromium,'chromium'],[webkit,'webkit']]){
   for(const [label,w,h] of [['iphone',390,844],['ipad-portrait',820,1180],['ipad-landscape',1180,820]])await run(e,n,label,w,h,url);
   await checkUnflaggedOriginal(e,n,url);
  }
 }finally{server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
