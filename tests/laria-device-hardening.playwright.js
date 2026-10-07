'use strict';

const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..','laer-litt-mer');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg'};

function startServer(){
  return new Promise((resolve,reject)=>{
    const server=http.createServer((req,res)=>{
      const url=new URL(req.url,'http://127.0.0.1');
      const rel=decodeURIComponent(url.pathname).replace(/^\/+/,'')||'index.html';
      const file=path.resolve(root,rel);
      if(!file.startsWith(root)){res.writeHead(403);res.end('forbidden');return}
      fs.readFile(file,(err,data)=>{
        if(err){res.writeHead(404);res.end('not found');return}
        res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
        res.setHeader('Cache-Control','no-store');
        res.end(data);
      });
    });
    server.once('error',reject);
    server.listen(0,'127.0.0.1',()=>resolve({server,url:'http://127.0.0.1:'+server.address().port+'/'}));
  });
}

function seed(grade){
  return {
    version:7,progressSchemaVersion:3,
    profile:{grade,onboarded:true,name:'DeviceQA',avatar:'boy',setupVersion:2},
    mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},
    preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,
    journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null
  };
}

async function noOverflow(page,label){
  const m=await page.evaluate(()=>({
    innerWidth,
    doc:document.documentElement.scrollWidth,
    body:document.body?.scrollWidth||0,
    active:document.querySelector('.screen.active')?.id||null
  }));
  assert.ok(m.doc<=m.innerWidth+1,label+' document overflow: '+JSON.stringify(m));
  assert.ok(m.body<=m.innerWidth+1,label+' body overflow: '+JSON.stringify(m));
}

async function rect(page,selector){
  return page.locator(selector).evaluate(el=>{
    const r=el.getBoundingClientRect();
    return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom,display:getComputedStyle(el).display,visibility:getComputedStyle(el).visibility};
  });
}
function assertInViewport(r,vw,vh,label,{allowBottomScroll=false}={}){
  assert.ok(r.w>0&&r.h>0,label+' has zero size: '+JSON.stringify(r));
  assert.ok(r.right>=0&&r.x<=vw,label+' outside horizontal viewport: '+JSON.stringify(r));
  if(!allowBottomScroll)assert.ok(r.bottom>=0&&r.y<=vh,label+' outside vertical viewport: '+JSON.stringify(r));
}
function assertTap(r,label){
  assert.ok(r.w>=44&&r.h>=44,label+' tap target smaller than 44x44: '+JSON.stringify(r));
}

async function verifyBasecamp(page,label,width,height){
  await page.locator('.bc12').waitFor({state:'visible'});
  assert.equal(await page.locator('.bc12-nav button').count(),4,label+' Basecamp navigation changed');
  await noOverflow(page,label+' home');

  const challenge=await rect(page,'.safe-challenge-young');
  assertInViewport(challenge,width,height,label+' challenge');
  assertTap(challenge,label+' challenge');

  for(const sel of ['.bc12-nav [data-camp="home"]','.bc12-nav [data-camp="travel"]','.bc12-nav [data-camp="explore"]','.bc12-nav [data-camp="collection"]']){
    const r=await rect(page,sel);assertInViewport(r,width,height,label+' '+sel);assertTap(r,label+' '+sel);
  }

  await page.locator('.safe-challenge-young').tap();
  const dialog=page.locator('#safe-challenge-dialog[open]');
  await dialog.waitFor();
  await noOverflow(page,label+' challenge dialog');
  const dr=await rect(page,'#safe-challenge-dialog');
  assert.ok(dr.w<=width-8,label+' challenge dialog wider than viewport: '+JSON.stringify(dr));
  assert.ok(dr.h<=height-8,label+' challenge dialog taller than viewport: '+JSON.stringify(dr));
  const close=await rect(page,'#sc-close');assertTap(close,label+' challenge close');
  await page.locator('#sc-close').tap();
  await dialog.waitFor({state:'hidden'});

  await page.locator('.bc12-place[data-camp="globe"]').tap();
  await page.locator('#world-screen.active').waitFor();
  await noOverflow(page,label+' globe');
  const back=await rect(page,'#world-back');assertTap(back,label+' globe back');
  await page.locator('#world-back').tap();
  await page.locator('#home-screen.active').waitFor();

  await page.locator('.bc12-journey').tap();
  await page.locator('#subject-screen.active').waitFor();
  await noOverflow(page,label+' subject');
  const home=await rect(page,'.bok-v10-home');assertTap(home,label+' subject home');
  await page.locator('.bok-v10-home').tap();
  await page.locator('#home-screen.active').waitFor();

  // Edge-back must preserve the real Basecamp origin contract.
  await page.locator('.bc12-place[data-camp="globe"]').tap();
  await page.locator('#world-screen.active').waitFor();
  await page.evaluate(()=>appBack());
  await page.locator('#home-screen.active').waitFor();
  await noOverflow(page,label+' appBack home');
}

async function verifyOlderHome(page,label,width,height){
  await page.locator('#home-screen.active').waitFor();
  await page.waitForFunction(()=>document.documentElement.dataset.safeChallengeRelease==='challenge-rc1');
  await noOverflow(page,label+' home');

  const entry=page.locator('#safe-challenge-entry');
  await entry.waitFor({state:'visible'});
  const er=await rect(page,'#safe-challenge-entry');assertInViewport(er,width,height,label+' challenge entry',{allowBottomScroll:true});assertTap(er,label+' challenge entry');

  const bottom=page.locator('#bottom-nav');
  if(await bottom.isVisible()){
    const buttons=bottom.locator('button');
    const n=await buttons.count();let visibleCount=0;
    for(let i=0;i<n;i++){
      if(!await buttons.nth(i).isVisible())continue;
      visibleCount++;
      const r=await buttons.nth(i).evaluate(el=>{const b=el.getBoundingClientRect();return {w:b.width,h:b.height,x:b.x,y:b.y,right:b.right,bottom:b.bottom}});
      assertTap(r,label+' bottom nav '+i);
      assert.ok(r.right<=width+1&&r.x>=-1,label+' bottom nav button outside viewport: '+JSON.stringify(r));
    }
    assert.ok(visibleCount>=3,label+' bottom nav unexpectedly sparse: '+visibleCount);
  }

  await entry.tap();
  const dialog=page.locator('#safe-challenge-dialog[open]');
  await dialog.waitFor();
  await noOverflow(page,label+' challenge dialog');
  const dr=await rect(page,'#safe-challenge-dialog');
  assert.ok(dr.w<=width-8,label+' challenge dialog wider than viewport: '+JSON.stringify(dr));
  assert.ok(dr.h<=height-8,label+' challenge dialog taller than viewport: '+JSON.stringify(dr));
  for(const sel of ['#sc-close','#sc-share','#sc-start','#sc-new']){
    if(await page.locator(sel).isVisible()){const r=await rect(page,sel);assertTap(r,label+' '+sel)}
  }
  await page.locator('#sc-close').tap();

  // Parent area is part of the trust-critical product surface.
  const adult=page.locator('#adult-entry');
  await adult.scrollIntoViewIfNeeded();
  await adult.tap();
  await page.locator('#adult-screen.active').waitFor();
  await noOverflow(page,label+' adult');
  const adultBack=await rect(page,'#adult-back');assertTap(adultBack,label+' adult back');
  const select=await rect(page,'#adult-grade');assert.ok(select.h>=40,label+' grade select too small: '+JSON.stringify(select));
  await page.locator('#adult-back').tap();
  await page.locator('#home-screen.active').waitFor();

  // Core subject round-trip.
  await page.evaluate(()=>openSubject('math'));
  await page.locator('#subject-screen.active').waitFor();
  await noOverflow(page,label+' math subject');
  const subjectBack=page.locator('.subject-back').first();
  if(await subjectBack.count()&&await subjectBack.isVisible()){
    const r=await subjectBack.evaluate(el=>{const b=el.getBoundingClientRect();return {w:b.width,h:b.height,x:b.x,y:b.y,right:b.right,bottom:b.bottom}});
    assertTap(r,label+' subject back');
    await subjectBack.tap();
    await page.locator('#home-screen.active').waitFor();
  }else{
    await page.evaluate(()=>setTab('home'));
    await page.locator('#home-screen.active').waitFor();
  }
  await noOverflow(page,label+' returned home');
}

(async()=>{
  const {server,url}=await startServer();
  const errors=[];
  const screenshots=process.env.QA_SCREENSHOTS||'/tmp/laria-device-hardening';
  fs.mkdirSync(screenshots,{recursive:true});
  const engines=[['chromium',chromium],['webkit',webkit]];
  const cases=[
    {name:'iphone-se',width:320,height:568,grade:2},
    {name:'iphone',width:390,height:844,grade:2},
    {name:'ipad-portrait',width:820,height:1180,grade:2},
    {name:'ipad-landscape',width:1180,height:820,grade:2},
    {name:'older-iphone',width:390,height:844,grade:7},
    {name:'older-ipad',width:820,height:1180,grade:7}
  ];

  try{
    for(const [engineName,engine] of engines){
      const browser=await engine.launch({headless:true,args:engineName==='chromium'?['--no-sandbox']:[]});
      try{
        for(const cfg of cases){
          const label=engineName+' '+cfg.name;
          const context=await browser.newContext({
            viewport:{width:cfg.width,height:cfg.height},
            isMobile:cfg.width<=430,
            hasTouch:true,
            reducedMotion:'reduce',
            serviceWorkers:'block'
          });
          const page=await context.newPage();
          page.on('pageerror',e=>errors.push(label+': '+e.message));
          await page.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed(cfg.grade));
          await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
          await page.route('https://api.worldbank.org/**',r=>r.abort());
          await page.goto(url+'?app=laria&p17='+encodeURIComponent(label),{waitUntil:'domcontentloaded'});
          await page.locator('#home-screen.active').waitFor({timeout:10000});
          await page.screenshot({path:path.join(screenshots,engineName+'-'+cfg.name+'-home.png'),fullPage:true});

          if(cfg.grade<=2)await verifyBasecamp(page,label,cfg.width,cfg.height);
          else await verifyOlderHome(page,label,cfg.width,cfg.height);

          await page.screenshot({path:path.join(screenshots,engineName+'-'+cfg.name+'-final.png'),fullPage:true});
          await context.close();
          console.log(label+' device hardening passed');
        }
      }finally{
        await browser.close();
      }
    }
    assert.deepEqual(errors,[],'No page errors across device matrix');
    console.log('Laria Prompt 17 full visual/device hardening passed');
  }finally{
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(err=>{console.error(err);process.exit(1)});
