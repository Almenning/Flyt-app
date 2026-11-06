'use strict';

const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..','laer-litt-mer');
const mime={
  '.html':'text/html; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.webmanifest':'application/manifest+json',
  '.svg':'image/svg+xml',
  '.webp':'image/webp',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg'
};

function server(){
  return new Promise((resolve,reject)=>{
    const s=http.createServer((req,res)=>{
      const u=new URL(req.url,'http://127.0.0.1');
      const rel=decodeURIComponent(u.pathname).replace(/^\/+/, '')||'index.html';
      const file=path.resolve(root,rel);
      if(!file.startsWith(root)){res.writeHead(403);res.end();return}
      fs.readFile(file,(err,data)=>{
        if(err){res.writeHead(404);res.end('missing');return}
        res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
        res.setHeader('Cache-Control','no-store');
        res.end(data);
      });
    });
    s.once('error',reject);
    s.listen(0,'127.0.0.1',()=>resolve({s,url:'http://127.0.0.1:'+s.address().port+'/'}));
  });
}

function seed(grade=2){
  return {
    version:7,
    progressSchemaVersion:3,
    profile:{
      grade,
      onboarded:true,
      name:'TrollActor QA',
      avatar:'girl',
      setupVersion:2,
      tallvikaTroll:'lillesoster'
    },
    mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
    masteryEvidence:{},skillEvidence:{},
    preferences:{sound:false,autoRead:false},
    lastMilestone:null,recentCountryWin:null,lastActivity:null,
    journey:{nodes:{},gradeWins:{},viewGrades:{}},
    answerLog:[],sessionLog:[],activeSession:null
  };
}

async function blockExternal(page){
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
}

async function metrics(page,selector){
  return page.locator(selector).evaluate(el=>{
    const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
    return {
      x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height,
      display:cs.display,visibility:cs.visibility,opacity:cs.opacity,
      src:el.getAttribute('src')||''
    };
  });
}

function inside(m,w,h,label){
  assert.ok(m.w>0&&m.h>0,label+' zero geometry');
  assert.ok(m.x>=-2&&m.right<=w+2,label+' outside horizontal viewport '+JSON.stringify(m));
  assert.ok(m.y>=-4&&m.bottom<=h+4,label+' outside vertical viewport '+JSON.stringify(m));
  assert.equal(m.visibility,'visible',label+' hidden');
  assert.ok(Number(m.opacity)>.8,label+' transparent');
}

async function noHorizontalOverflow(page,label){
  const o=await page.evaluate(()=>({
    doc:document.documentElement.scrollWidth,
    body:document.body.scrollWidth,
    inner:innerWidth
  }));
  assert.ok(o.doc<=o.inner+2&&o.body<=o.inner+2,label+' horizontal overflow '+JSON.stringify(o));
}

const devices=[
  ['mac-1440x900',1440,900],
  ['ipad-portrait',1024,1366],
  ['ipad-landscape',1366,1024],
  ['iphone-portrait',393,852],
  ['iphone-landscape',852,393],
  ['iphone-small',375,667]
];

async function verifyOnboarding(browser,url,out,engineName,name,width,height){
  const label=engineName+'-'+name;
  const ctx=await browser.newContext({
    viewport:{width,height},
    isMobile:width<=430,
    hasTouch:true,
    serviceWorkers:'block',
    reducedMotion:'no-preference'
  });
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await blockExternal(page);
  await page.goto(url+'?app=laria&onboarding='+encodeURIComponent(label),{
    waitUntil:'domcontentloaded',timeout:90000
  });
  await page.locator('#onboarding.show').waitFor({state:'visible',timeout:18000});

  assert.equal(
    await page.locator('#onboarding .avatar-choice-card[data-troll]').count(),
    3,
    label+' onboarding must show three trolls'
  );

  for(const id of ['storesoster','lillesoster','lillebror']){
    const card=page.locator('#onboarding .avatar-choice-card[data-troll="'+id+'"]');
    await card.scrollIntoViewIfNeeded();
    const img=card.locator('img[data-profile-troll-img]');
    await img.waitFor({state:'visible',timeout:4000});
    const src=await img.getAttribute('src');
    assert.match(src,new RegExp('assets/gangemagi-troll/'+id+'\\.webp'),label+' wrong onboarding art for '+id);
  }

  await noHorizontalOverflow(page,label+' onboarding');

  await page.locator('#onboarding .avatar-choice-card[data-troll="lillesoster"]').click();
  assert.equal(
    await page.locator('#onboarding .avatar-choice-card[data-troll="lillesoster"]').getAttribute('aria-pressed'),
    'true',
    label+' troll picker selection did not stick'
  );

  const picker=await page.locator('#onboarding .avatar-choice-grid[data-troll-picker]').evaluate(el=>{
    const r=el.getBoundingClientRect();
    return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height};
  });
  assert.ok(
    picker.x>=-1&&picker.right<=width+1&&picker.y>=-1&&picker.bottom<=height+1,
    label+' onboarding troll picker outside viewport '+JSON.stringify(picker)
  );

  await page.screenshot({
    path:path.join(out,label+'-onboarding.png'),
    fullPage:false,
    animations:'disabled'
  });
  assert.deepEqual(errors,[],label+' onboarding page errors '+errors.join('; '));
  await ctx.close();
}

async function verifyTaskActor(browser,url,out,engineName,name,width,height){
  const label=engineName+'-'+name;
  const ctx=await browser.newContext({
    viewport:{width,height},
    isMobile:width<=430,
    hasTouch:true,
    serviceWorkers:'block',
    reducedMotion:'no-preference'
  });
  await ctx.addInitScript(v=>localStorage.setItem('laerlittmer-v2',JSON.stringify(v)),seed(2));
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await blockExternal(page);
  await page.goto(url+'?app=laria&trollactor='+encodeURIComponent(label),{
    waitUntil:'domcontentloaded',timeout:90000
  });

  await page.locator('#home-screen.active .bc12.bc15-locked-home').waitFor({
    state:'visible',timeout:18000
  });
  assert.equal(
    await page.locator('#home-screen .bc15-locked-home .laria-premium-troll-art:visible').count(),
    0,
    label+' Grovanova got an injected second troll'
  );
  assert.equal(
    await page.evaluate(()=>window.LARIA_TROLL_ACTOR?.choice()),
    'lillesoster',
    label+' selected troll identity lost'
  );

  await page.locator('.bc14-subject[data-camp="subject-norwegian"]').click();
  await page.locator('#eggenipa-world:visible').waitFor({timeout:18000});
  await page.locator('#eggenipa-world .eg-portal[data-eg="reading"]').click();
  await page.locator('#session-screen.active .laria-task-card').waitFor({timeout:18000});

  const selector='#session-screen.active .task-fox-companion.laria-troll-host .laria-premium-troll-art';
  const actor=page.locator(selector);
  await actor.waitFor({state:'visible',timeout:12000});
  await actor.evaluate(img=>img.decode?.());
  const m=await metrics(page,selector);
  inside(m,width,height,label+' task TrollActor');
  assert.match(m.src,/assets\/gangemagi-troll\/lillesoster\.webp/,label+' wrong troll art');

  await noHorizontalOverflow(page,label+' task');

  await page.evaluate(()=>{
    const host=document.querySelector('#session-screen.active .task-fox-companion.laria-troll-host');
    window.LARIA_TROLL_ACTOR.mood(host,'celebrate',{say:'Bra!',duration:1500});
  });
  assert.equal(
    await page.locator('#session-screen.active .task-fox-companion').getAttribute('data-laria-troll-mood'),
    'celebrate',
    label+' actor state did not change'
  );
  const bubble=page.locator('#session-screen.active .task-fox-companion .laria-troll-speech[data-show="true"]');
  await bubble.waitFor({state:'visible',timeout:3000});
  assert.equal(await bubble.innerText(),'Bra!',label+' actor speech failed');

  const bubbleBox=await bubble.evaluate(el=>{
    const r=el.getBoundingClientRect();
    return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height};
  });
  assert.ok(
    bubbleBox.x>=-1&&bubbleBox.right<=width+1&&bubbleBox.y>=-2&&bubbleBox.bottom<=height+2,
    label+' troll speech outside viewport '+JSON.stringify(bubbleBox)
  );

  await page.screenshot({
    path:path.join(out,label+'-task.png'),
    fullPage:false,
    animations:'disabled'
  });
  assert.deepEqual(errors,[],label+' task page errors '+errors.join('; '));
  await ctx.close();
}

async function verifyLegacyHome(browser,url,out,engineName,name,width,height){
  const label=engineName+'-'+name;
  const ctx=await browser.newContext({
    viewport:{width,height},
    isMobile:width<=430,
    hasTouch:true,
    serviceWorkers:'block',
    reducedMotion:'reduce'
  });
  await ctx.addInitScript(v=>localStorage.setItem('laerlittmer-v2',JSON.stringify(v)),seed(4));
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await blockExternal(page);
  await page.goto(url+'?app=laria&legacy-troll='+encodeURIComponent(label),{
    waitUntil:'domcontentloaded',timeout:90000
  });

  await page.locator('#home-screen.active .bc12:visible').waitFor({timeout:18000});
  const locked=await page.locator('#home-screen.active .bc12').evaluate(el=>el.classList.contains('bc15-locked-home'));
  assert.equal(locked,false,label+' grade 4 unexpectedly used locked Grovanova');

  const selector='#home-screen.active .bc12-fox.laria-troll-host .laria-premium-troll-art';
  const actor=page.locator(selector);
  await actor.waitFor({state:'visible',timeout:12000});
  const m=await metrics(page,selector);
  inside(m,width,height,label+' legacy Home TrollActor');
  assert.match(m.src,/assets\/gangemagi-troll\/lillesoster\.webp/,label+' legacy Home still renders fox art');

  const visibleFoxImages=await page.locator('#home-screen.active img[src*="fox"]:visible,#home-screen.active img[src*="rev"]:visible').count();
  assert.equal(visibleFoxImages,0,label+' visible fox image survived on legacy Home');

  const navText=(await page.locator('#home-screen.active .bc12-nav [data-camp="wardrobe"]').innerText()).trim();
  assert.match(navText,/Mine troll/,label+' legacy Min rev label survived');

  await page.locator('#home-screen.active .bc12-nav [data-camp="wardrobe"]').click();
  const chooser=page.locator('#laria-premium-troll-dialog[open]');
  await chooser.waitFor({state:'visible',timeout:6000});
  assert.equal(await chooser.locator('.laria-troll-choice').count(),3,label+' premium troll chooser missing choices');
  assert.equal(
    await chooser.locator('[data-troll-choice="lillesoster"]').getAttribute('aria-pressed'),
    'true',
    label+' premium troll chooser lost selected troll'
  );
  const chooserBox=await chooser.evaluate(el=>{
    const r=el.getBoundingClientRect();
    return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height};
  });
  assert.ok(
    chooserBox.x>=0&&chooserBox.right<=width+1&&chooserBox.y>=0&&chooserBox.bottom<=height+1,
    label+' troll chooser outside viewport '+JSON.stringify(chooserBox)
  );

  await noHorizontalOverflow(page,label+' legacy Home');
  await page.screenshot({
    path:path.join(out,label+'-legacy-home.png'),
    fullPage:false,
    animations:'disabled'
  });
  assert.deepEqual(errors,[],label+' legacy Home page errors '+errors.join('; '));
  await ctx.close();
}

async function verifyWorldSurfaces(browser,url,out,engineName,name,width,height){
  const label=engineName+'-'+name;
  const ctx=await browser.newContext({
    viewport:{width,height},
    isMobile:width<=430,
    hasTouch:true,
    serviceWorkers:'block',
    reducedMotion:'reduce'
  });
  await ctx.addInitScript(v=>localStorage.setItem('laerlittmer-v2',JSON.stringify(v)),seed(2));
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await blockExternal(page);

  const worlds=[
    {id:'norwegian',root:'#eggenipa-world:visible',actor:'#eggenipa-world .eg-companion-actor[data-troll="lillesoster"]',touch:'#eggenipa-world .eg-portal:visible'},
    {id:'math',root:'#tallvika-world:visible',actor:'#tallvika-world .tv-actor[data-troll-id="lillesoster"]',touch:'#tallvika-world .tv-sign:visible'},
    {id:'english',root:'#kinnaklova-world:visible',actor:'#kinnaklova-world .ki-companion-actor[data-troll="lillesoster"]',touch:'#kinnaklova-world .ki-card:visible'},
    {id:'geography',root:'#geography-screen.active .locked-journey-map[data-journey-subject="geography"]:visible',actor:'#geography-screen.active .locked-journey-traveler[data-troll="lillesoster"]',touch:'#geography-screen.active .locked-journey-hotspot:visible'}
  ];

  for(const spec of worlds){
    await page.goto(url+'?app=laria&surface='+encodeURIComponent(label+'-'+spec.id),{
      waitUntil:'domcontentloaded',timeout:90000
    });
    await page.locator('#home-screen.active .bc12.bc15-locked-home').waitFor({state:'visible',timeout:20000});
    await page.locator('.bc14-subject[data-camp="subject-'+spec.id+'"]').click();
    const world=page.locator(spec.root).first();
    await world.waitFor({state:'visible',timeout:22000});

    const worldBox=await world.evaluate(el=>{
      const r=el.getBoundingClientRect();
      return {x:r.x,right:r.right,w:r.width,h:r.height};
    });
    assert.ok(worldBox.w>0&&worldBox.h>0,label+' '+spec.id+' zero world geometry');
    assert.ok(worldBox.x>=-3&&worldBox.right<=width+3,
      label+' '+spec.id+' world exceeds viewport '+JSON.stringify(worldBox));

    const actor=page.locator(spec.actor).first();
    await actor.waitFor({state:'visible',timeout:14000});
    const actorBox=await actor.evaluate(el=>{
      const r=el.getBoundingClientRect();
      return {x:r.x,right:r.right,w:r.width,h:r.height};
    });
    assert.ok(actorBox.w>=20&&actorBox.h>=38&&actorBox.x>=-3&&actorBox.right<=width+3,
      label+' '+spec.id+' TrollActor geometry '+JSON.stringify(actorBox));

    const controls=await page.locator(spec.touch).evaluateAll(list=>list.slice(0,4).map(el=>{
      const r=el.getBoundingClientRect();
      return {w:r.width,h:r.height};
    }));
    assert.ok(controls.length>0,label+' '+spec.id+' missing primary controls');
    assert.ok(controls.every(r=>r.w>=44&&r.h>=44),
      label+' '+spec.id+' undersized touch control '+JSON.stringify(controls));

    await noHorizontalOverflow(page,label+' '+spec.id);
    assert.equal(
      await page.locator(spec.root+' img[src*="lia-fox"]:visible,'+spec.root+' img[src*="/assets/fox/"]:visible').count(),
      0,
      label+' '+spec.id+' visible fox art survived'
    );
    await page.screenshot({
      path:path.join(out,label+'-'+spec.id+'.png'),
      fullPage:false,
      animations:'disabled'
    });

    // Leaving an illustrated journey must remove its global presentation
    // context. A stale geography body class can otherwise intercept taps in
    // Gangemagi on short WebKit phones even though the controls look visible.
    await page.evaluate(()=>showScreen('home'));
    await page.locator('#home-screen.active').waitFor({state:'visible',timeout:8000});
    const staleJourneyClass=await page.locator('body').getAttribute('class');
    assert.ok(!/locked-journey-subject-(norwegian|math|english|geography)/.test(staleJourneyClass||''),
      label+' '+spec.id+' left stale journey context on body: '+staleJourneyClass);
  }

  assert.deepEqual(errors,[],label+' world surface errors '+errors.join('; '));
  await ctx.close();
}

(async()=>{
  const {s,url}=await server();
  const out=process.env.LARIA_PREMIUM_BETA_SCREENSHOTS||'/tmp/laria-premium-beta';
  fs.mkdirSync(out,{recursive:true});
  let failed=0;

  try{
    for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
      const browser=await engine.launch({
        headless:true,
        args:engineName==='chromium'?['--no-sandbox']:[]
      });
      try{
        for(const [name,width,height] of devices){
          const label=engineName+'-'+name;
          try{
            await verifyOnboarding(browser,url,out,engineName,name,width,height);
            await verifyTaskActor(browser,url,out,engineName,name,width,height);
            await verifyLegacyHome(browser,url,out,engineName,name,width,height);
            await verifyWorldSurfaces(browser,url,out,engineName,name,width,height);
            console.log('PASS '+label);
          }catch(e){
            failed++;
            console.error('FAIL '+label+': '+e.message);
          }
        }
      }finally{
        await browser.close();
      }
    }
    assert.equal(failed,0,failed+' premium beta device cases failed');
  }finally{
    await new Promise(r=>s.close(r));
  }
})().catch(e=>{console.error(e);process.exit(1)});
