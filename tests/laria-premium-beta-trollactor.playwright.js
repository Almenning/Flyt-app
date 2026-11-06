'use strict';
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..','laer-litt-mer');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg'};

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
  return {version:7,progressSchemaVersion:3,profile:{grade,onboarded:true,name:'TrollActor QA',avatar:'girl',setupVersion:2,tallvikaTroll:'lillesoster'},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
}
async function metrics(page,selector){
  return page.locator(selector).evaluate(el=>{
    const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
    return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height,display:cs.display,visibility:cs.visibility,opacity:cs.opacity,src:el.getAttribute('src')||''};
  });
}
function inside(m,w,h,label){
  assert.ok(m.w>0&&m.h>0,label+' zero geometry');
  assert.ok(m.x>=-2&&m.right<=w+2,label+' outside horizontal viewport '+JSON.stringify(m));
  assert.ok(m.y>=-4&&m.bottom<=h+4,label+' outside vertical viewport '+JSON.stringify(m));
  assert.equal(m.visibility,'visible',label+' hidden');
  assert.ok(Number(m.opacity)>.8,label+' transparent');
}
const devices=[
 ['mac-1440x900',1440,900],
 ['ipad-portrait',1024,1366],
 ['ipad-landscape',1366,1024],
 ['iphone-portrait',393,852],
 ['iphone-landscape',852,393],
 ['iphone-small',375,667]
];

(async()=>{
  const {s,url}=await server();
  const out=process.env.LARIA_PREMIUM_BETA_SCREENSHOTS||'/tmp/laria-premium-beta';
  fs.mkdirSync(out,{recursive:true});
  let failed=0;
  try{
    for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
      const browser=await engine.launch({headless:true,args:engineName==='chromium'?['--no-sandbox']:[]});
      try{
        for(const [name,width,height] of devices){
          const label=engineName+'-'+name;
          try{
            const ctx=await browser.newContext({viewport:{width,height},isMobile:width<=430,hasTouch:true,serviceWorkers:'block',reducedMotion:'no-preference'});
            await ctx.addInitScript(v=>localStorage.setItem('laerlittmer-v2',JSON.stringify(v)),seed(2));
            const page=await ctx.newPage(),errors=[];
            page.on('pageerror',e=>errors.push(e.message));
            await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
            await page.route('https://api.worldbank.org/**',r=>r.abort());
            await page.goto(url+'?app=laria&trollactor='+encodeURIComponent(label),{waitUntil:'domcontentloaded',timeout:90000});
            await page.locator('#home-screen.active .bc12.bc15-locked-home').waitFor({state:'visible',timeout:18000});

            assert.equal(await page.locator('#home-screen .bc15-locked-home .laria-premium-troll-art:visible').count(),0,
              label+' Grovanova got an injected second troll');
            assert.equal(await page.evaluate(()=>window.LARIA_TROLL_ACTOR?.choice()),'lillesoster',
              label+' selected troll identity lost');

            await page.locator('.bc14-subject[data-camp="subject-norwegian"]').click();
            await page.locator('#eggenipa-world:visible').waitFor({timeout:18000});
            await page.locator('#eggenipa-world .eg-portal[data-eg="reading"]').click();
            await page.locator('#session-screen.active .laria-task-card').waitFor({timeout:18000});
            const actor=page.locator('#session-screen.active .task-fox-companion.laria-troll-host .laria-premium-troll-art');
            await actor.waitFor({state:'visible',timeout:12000});
            await actor.evaluate(img=>img.decode?.());
            const m=await metrics(page,'#session-screen.active .task-fox-companion.laria-troll-host .laria-premium-troll-art');
            inside(m,width,height,label+' task TrollActor');
            assert.match(m.src,/assets\/gangemagi-troll\/lillesoster\.webp/,label+' wrong troll art');

            const overflow=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,inner:innerWidth}));
            assert.ok(overflow.doc<=overflow.inner+2&&overflow.body<=overflow.inner+2,label+' horizontal overflow '+JSON.stringify(overflow));

            await page.evaluate(()=>{
              const h=document.querySelector('#session-screen.active .task-fox-companion.laria-troll-host');
              window.LARIA_TROLL_ACTOR.mood(h,'celebrate',{say:'Bra!',duration:1500});
            });
            assert.equal(await page.locator('#session-screen.active .task-fox-companion').getAttribute('data-laria-troll-mood'),'celebrate',
              label+' actor state did not change');
            const bubble=page.locator('#session-screen.active .task-fox-companion .laria-troll-speech[data-show="true"]');
            await bubble.waitFor({state:'visible',timeout:3000});
            assert.equal(await bubble.innerText(),'Bra!',label+' actor speech failed');

            await page.screenshot({path:path.join(out,label+'-task.png'),fullPage:false,animations:'disabled'});
            assert.deepEqual(errors,[],label+' page errors '+errors.join('; '));
            await ctx.close();

            // Legacy Home migration: no visible fox identity may survive outside locked Grovanova.
            const legacyCtx=await browser.newContext({viewport:{width,height},isMobile:width<=430,hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'});
            await legacyCtx.addInitScript(v=>localStorage.setItem('laerlittmer-v2',JSON.stringify(v)),seed(4));
            const legacy=await legacyCtx.newPage();
            await legacy.route('https://raw.githubusercontent.com/**',r=>r.abort());
            await legacy.route('https://api.worldbank.org/**',r=>r.abort());
            await legacy.goto(url+'?app=laria&legacy-troll='+encodeURIComponent(label),{waitUntil:'domcontentloaded',timeout:90000});
            await legacy.locator('#home-screen.active .bc12:visible').waitFor({timeout:18000});
            const legacyLocked=await legacy.locator('#home-screen.active .bc12').evaluate(el=>el.classList.contains('bc15-locked-home'));
            assert.equal(legacyLocked,false,label+' grade 4 unexpectedly used locked Grovanova');
            const legacyActor=legacy.locator('#home-screen.active .bc12-fox.laria-troll-host .laria-premium-troll-art');
            await legacyActor.waitFor({state:'visible',timeout:12000});
            const lm=await metrics(legacy,'#home-screen.active .bc12-fox.laria-troll-host .laria-premium-troll-art');
            inside(lm,width,height,label+' legacy Home TrollActor');
            assert.match(lm.src,/assets\/gangemagi-troll\/lillesoster\.webp/,label+' legacy Home still renders fox art');
            const navText=(await legacy.locator('#home-screen.active .bc12-nav [data-camp="wardrobe"]').innerText()).trim();
            assert.match(navText,/Mine troll/,label+' legacy Min rev label survived');
            await legacy.locator('#home-screen.active .bc12-nav [data-camp="wardrobe"]').click();
            const chooser=legacy.locator('#laria-premium-troll-dialog[open]');
            await chooser.waitFor({state:'visible',timeout:6000});
            assert.equal(await chooser.locator('.laria-troll-choice').count(),3,label+' premium troll chooser missing choices');
            assert.equal(await chooser.locator('[data-troll-choice="lillesoster"]').getAttribute('aria-pressed'),'true',
              label+' premium troll chooser lost selected troll');
            const chooserBox=await chooser.evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height};});
            assert.ok(chooserBox.x>=0&&chooserBox.right<=width+1&&chooserBox.y>=0&&chooserBox.bottom<=height+1,
              label+' troll chooser outside viewport '+JSON.stringify(chooserBox));
            await legacy.screenshot({path:path.join(out,label+'-legacy-home.png'),fullPage:false,animations:'disabled'});
            await legacyCtx.close();
            console.log('PASS '+label);
          }catch(e){failed++;console.error('FAIL '+label+': '+e.message);}
        }
      }finally{await browser.close();}
    }
    assert.equal(failed,0,failed+' premium beta device cases failed');
  }finally{await new Promise(r=>s.close(r));}
})().catch(e=>{console.error(e);process.exit(1)});
