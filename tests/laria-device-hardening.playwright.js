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
  // Young Home v15 is a single locked painting with accessible, transparent
  // interaction regions. The former Basecamp buttons remain in DOM but several
  // are deliberately hidden; do not revive obsolete chrome to pass QA.
  const home=page.locator('#home-screen.active .bc12.bc15-locked-home');
  await home.waitFor({state:'visible',timeout:20000});
  const art=await home.evaluate(el=>({
    asset:el.dataset.bc15Asset,
    width:parseFloat(el.style.getPropertyValue('--bc15-art-width')),
    height:parseFloat(el.style.getPropertyValue('--bc15-art-height')),
    background:el.style.getPropertyValue('--bc15-home-art')
  }));
  assert.ok(['phone-ready','tablet-ready'].includes(art.asset) &&
    art.width>100 && art.height>100 && art.background.includes('home-'),
    label+' must render the approved Home v15 master: '+JSON.stringify(art));
  await noOverflow(page,label+' locked Home v15');
  const nav=page.locator('.bc12-nav button');
  assert.equal(await nav.count(),5,label+' Home v15 retains five semantic navigation targets');
  assert.deepEqual(await nav.allTextContents(),
    ['Hjem','Reisen','Utforsk','Samlebok','Mine troll'],
    label+' locked Home v15 navigation identity changed');

  // All four painted subjects must have functional accessible hit areas
  // sitting over the locked illustration, not replacement artwork/cards.
  const subjects=['norwegian','math','english','geography'];
  for(const subject of subjects){
    const selector='.bc14-subject[data-camp="subject-'+subject+'"]';
    const box=await rect(page,selector);
    assertInViewport(box,width,height,label+' '+subject+' illustrated hit area');
    assertTap(box,label+' '+subject+' illustrated hit area');
    assert.equal(await page.locator(selector).getAttribute('aria-label')!==null,true,
      label+' '+subject+' requires an accessible subject name');
  }
  const journey=await rect(page,'.bc12-journey');
  assertInViewport(journey,width,height,label+' illustrated journey');
  assertTap(journey,label+' illustrated journey');
  const adult=await rect(page,'.bc12-adult-entry');
  assertInViewport(adult,width,height,label+' adult entry');
  assertTap(adult,label+' adult entry');

  // The dedicated portrait artwork has five nav destinations on both phones
  // and iPads. The landscape master shows four destinations without Home.
  const showHome=height>width;
  assert.equal(await page.locator('.bc12-nav [data-camp="home"]').isVisible(),showHome,
    label+' locked navigation home-slot visibility mismatch');
  for(const camp of ['travel','explore','collection','wardrobe']){
    const selector='.bc12-nav [data-camp="'+camp+'"]';
    const box=await rect(page,selector);
    assertInViewport(box,width,height,label+' '+camp+' artwork-aligned navigation');
    assertTap(box,label+' '+camp+' artwork-aligned navigation');
  }

  // Legacy challenge button was explicitly removed from the locked painting,
  // not accidentally clipped. Feature logic is checked through its own API.
  await page.waitForFunction(()=>!!window.LARIA_SAFE_CHALLENGE?.open);
  assert.equal(await page.locator('.safe-challenge-young').isVisible(),false,
    label+' must not overlay legacy challenge chrome on locked Home');
  await page.evaluate(()=>window.LARIA_SAFE_CHALLENGE.open());
  const challengeDialog=page.locator('#safe-challenge-dialog[open]');
  await challengeDialog.waitFor();
  const challengeClose=await rect(page,'#sc-close');
  assertTap(challengeClose,label+' challenge API dialog close');
  await page.locator('#sc-close').tap();
  await challengeDialog.waitFor({state:'hidden'});

  // Real dialogs must come from the four working artwork-aligned controls.
  await page.locator('.bc12-nav [data-camp="collection"]').tap();
  await page.locator('#bc12-dialog[open].is-collection .bc12-memory-grid').waitFor();
  const collectionClose=await rect(page,'#bc12-dialog .bc12-close');
  assertTap(collectionClose,label+' collection close');
  await page.locator('#bc12-dialog .bc12-close').tap();
  await page.locator('#bc12-dialog[open]').waitFor({state:'hidden'});

  await page.locator('.bc12-nav [data-camp="wardrobe"]').tap();
  await page.locator('#bc15-troll-dialog[open] .bc15-troll-art').waitFor();
  assert.equal(await page.locator('#bc15-troll-dialog h2').textContent(),'Mine troll');
  const trollClose=await rect(page,'#bc15-troll-dialog .bc15-troll-close');
  assertTap(trollClose,label+' troll dialog close');
  await page.locator('#bc15-troll-dialog .bc15-troll-close').tap();
  await page.locator('#bc15-troll-dialog[open]').waitFor({state:'hidden'});

  // Verify Explore -> classic globe -> back, without the hidden old free card.
  await page.locator('.bc12-nav [data-camp="explore"]').tap();
  await page.locator('.bc13-card[data-bc13-action="globe"]').waitFor({state:'visible'});
  await page.locator('.bc13-card[data-bc13-action="globe"]').tap();
  await page.locator('#world-screen.active').waitFor();
  await noOverflow(page,label+' globe');
  const back=await rect(page,'#world-back');
  assertTap(back,label+' globe back');
  await page.locator('#world-back').tap();
  await page.locator('#home-screen.active').waitFor();
  await page.locator('.bc12-nav [data-camp="home"]').tap();
  await home.waitFor({state:'visible'});

  // Verify the painted journey area, subject mission and return. This also
  // asserts that navigation state is not lost when Home v15 activates again.
  await page.locator('.bc12-journey').tap();
  await page.locator('#subject-screen.active').waitFor();
  await page.locator('#subject-screen.active .locked-journey-map[data-journey-subject="norwegian"] .locked-journey-back').waitFor({state:'visible',timeout:16000});
  await noOverflow(page,label+' subject');
  const subjectBack=await rect(page,'#subject-screen.active .locked-journey-back');
  assertTap(subjectBack,label+' subject back');
  await page.locator('#subject-screen.active .locked-journey-back').tap();
  await home.waitFor({state:'visible'});

  // Actual subject-gateway tap must work, not merely pass size checks.
  await page.locator('.bc14-subject[data-camp="subject-math"]').tap();
  await page.locator('#subject-screen.active').waitFor();
  await noOverflow(page,label+' math');
  await page.evaluate(()=>appBack());
  await home.waitFor({state:'visible'});
  await noOverflow(page,label+' return to locked Home');
}

async function verifyOlderHome(page,label,width,height,grade){
  await page.locator('#home-screen.active .bc12:visible').waitFor();
  const gradeBand=grade<=4?'middle':grade<=7?'older':'teen';
  assert.equal(await page.locator('.bc12').getAttribute('data-grade-band'),gradeBand,
    label+' grade style must come from shared Home');
  assert.equal(await page.locator('.bc14-subject:visible').count(),4,
    label+' must use exactly the same four illustrated subject gateways');
  assert.equal(await page.locator('#home-screen.active .dashboard-main-grid:visible').count(),0,
    label+' may not show the deprecated dashboard');
  assert.equal(await page.locator('#bottom-nav:visible').count(),0,
    label+' may not expose a second Home navigation');
  await noOverflow(page,label+' unified Home');
  const srcMatches=await page.evaluate(()=>{
    const img=document.querySelector('.bc12-fox img');
    return img?.getAttribute('src')===window.LARIA_FOX.source(state.profile.avatar)
      && !!document.querySelector('.bc12-fox .laria-fox-wardrobe-art');
  });
  assert.equal(srcMatches,true,label+' must show the selected personal fox and its clothing layer');
  if(width<=700){
    const placement=await page.evaluate(()=>{
      const box=sel=>document.querySelector(sel)?.getBoundingClientRect();
      const fox=box('#home-screen.active .bc12-fox');
      const signs=['.bc12-globe .bc12-sign','.bc12-words .bc12-sign'].map(box);
      const overlap=(a,b)=>a&&b?Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)):0;
      return {visible:!!fox&&fox.width>=44&&fox.height>=44,areas:signs.map(sign=>overlap(fox,sign)),fox:fox?{left:fox.left,top:fox.top,right:fox.right,bottom:fox.bottom}:null};
    });
    assert.equal(placement.visible,true,label+' chosen fox must remain a proper, visible companion');
    assert.ok(placement.areas.every(a=>a<2),
      label+' chosen fox must not cover either painted activity sign: '+JSON.stringify(placement));
  }
  for(const sel of ['.bc14-subject[data-camp="subject-norwegian"]','.bc14-subject[data-camp="subject-math"]',
    '.bc14-subject[data-camp="subject-english"]','.bc14-subject[data-camp="subject-geography"]',
    '.bc12-nav [data-camp="collection"]','.bc12-nav [data-camp="wardrobe"]',
    '.bc12-nav [data-camp="travel"]','.bc12-nav [data-camp="explore"]']){
    const r=await rect(page,sel);assertTap(r,label+' '+sel);assertInViewport(r,width,height,label+' '+sel);
  }
  await page.locator('.bc12-nav [data-camp="collection"]').tap();
  await page.locator('#bc12-dialog[open].is-collection .bc12-memory-grid').waitFor();
  await page.locator('#bc12-dialog .bc12-close').tap();
  await page.locator('#bc12-dialog[open]').waitFor({state:'hidden'});
  await page.locator('.bc12-nav [data-camp="wardrobe"]').tap();
  await page.locator('#bc12-dialog[open].is-wardrobe .bc12-wardrobe-preview svg').waitFor();
  await page.locator('#bc12-dialog .bc12-close').tap();
  await page.locator('#bc12-dialog[open]').waitFor({state:'hidden'});
  // A real subject round-trip, without falling back to the obsolete Home.
  await page.locator('.bc14-subject[data-camp="subject-math"]').tap();
  await page.locator('#subject-screen.active').waitFor();
  await noOverflow(page,label+' math subject');
  const back=page.locator('#subject-back');
  if(await back.isVisible())await back.tap();
  else await page.evaluate(()=>setTab('home'));
  await page.locator('#home-screen.active .bc12:visible').waitFor();
  // Progression and avatar remain intact across grade changes.
  if(grade===4){
    await page.evaluate(()=>{
      state.profile.grade=9;
      state.profile.avatar='girl';
      saveState();renderAll();
    });
    assert.equal(await page.locator('.bc12').getAttribute('data-grade-band'),'teen');
    assert.equal(await page.locator('.bc12-fox img').getAttribute('src'),
      await page.evaluate(()=>window.LARIA_FOX.source('girl')),
      label+' fox identity must survive grade change');
    assert.equal(await page.locator('.bc14-subject:visible').count(),4);
  }
  await noOverflow(page,label+' returned Home');
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
    {name:'middle-ipad',width:820,height:1180,grade:4},
    {name:'older-iphone',width:390,height:844,grade:7},
    {name:'older-ipad',width:820,height:1180,grade:7},
    {name:'older-ipad-landscape',width:1180,height:820,grade:7},
    {name:'teen-iphone',width:390,height:844,grade:9}
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
          else await verifyOlderHome(page,label,cfg.width,cfg.height,cfg.grade);

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
