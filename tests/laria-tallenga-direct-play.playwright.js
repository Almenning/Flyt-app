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
 page.on('response',response=>{if(response.url().includes('/assets/skogstroll/')&&response.status()!==200)errors.push('missing troll '+response.url());});
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
  assert.equal(await page.locator('.tlp-troll-trio .tlp-actor').count(),3);
  const sources=await page.locator('.tlp-troll-trio .tlp-actor').evaluateAll(els=>els.map(x=>x.getAttribute('src')));
  assert.deepEqual(sources,['./assets/skogstroll/storesoster.webp','./assets/skogstroll/lillesoster.webp','./assets/skogstroll/lillebror.webp']);
  assert.equal(await page.locator('.tlp-game:visible').count(),3);
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
  const images=await page.locator('.tlp-troll-trio img, .tlp-game-art img').evaluateAll(els=>els.map(i=>({src:i.getAttribute('src'),ready:i.complete&&i.naturalWidth>0})));
  assert(images.every(i=>i.ready),'original image failed '+JSON.stringify(images));
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
  await page.locator('[data-tlp="original"]').click();
  assert.equal(await page.locator('#subject-screen.tlp-active').count(),0);
  assert.equal(await page.locator('#journey-map').count(),1);
  assert.deepEqual(errors,[],'runtime page errors');
  console.log('PASS '+engineName+' '+label);
 }finally{await context.close();await browser.close();}
}
(async()=>{
 const {server,url}=await serve();
 try{
  for(const [e,n] of [[chromium,'chromium'],[webkit,'webkit']]){
   for(const [label,w,h] of [['iphone',390,844],['ipad-portrait',820,1180],['ipad-landscape',1180,820]])await run(e,n,label,w,h,url);
  }
 }finally{server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
