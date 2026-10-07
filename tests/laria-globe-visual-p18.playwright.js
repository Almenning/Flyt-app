'use strict';
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..','laer-litt-mer');
const out=process.env.QA_SCREENSHOTS||'/tmp/laria-p18-globe';
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg'};

function server(){
  return new Promise((resolve,reject)=>{
    const s=http.createServer((req,res)=>{
      const u=new URL(req.url,'http://127.0.0.1');
      const rel=decodeURIComponent(u.pathname).replace(/^\/+/, '')||'index.html';
      const file=path.resolve(root,rel);
      if(!file.startsWith(root)){res.writeHead(403);res.end('forbidden');return}
      fs.readFile(file,(err,data)=>{
        if(err){res.writeHead(404);res.end('not found');return}
        res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
        res.setHeader('Cache-Control','no-store');res.end(data);
      });
    });
    s.once('error',reject);s.listen(0,'127.0.0.1',()=>resolve({s,url:'http://127.0.0.1:'+s.address().port+'/'}));
  });
}
const seed={
  version:7,progressSchemaVersion:3,
  profile:{grade:2,onboarded:true,name:'GlobeQA',avatar:'boy',setupVersion:2},
  mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},
  preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,
  journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null
};

async function capture(browserType,label,viewport){
  const browser=await browserType.launch({headless:true});
  try{
    const ctx=await browser.newContext({viewport,isMobile:viewport.width<600,hasTouch:true,serviceWorkers:'block',deviceScaleFactor:1});
    const page=await ctx.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.addInitScript(x=>localStorage.setItem('laerlittmer-v2',JSON.stringify(x)),seed);
    await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
    await page.route('https://api.worldbank.org/**',r=>r.abort());
    await page.goto(globalThis.__url+'?app=laria&p18=globe-'+label,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>typeof openGlobe==='function'&&document.getElementById('globe-canvas'));
    await page.evaluate(()=>openGlobe());
    await page.locator('#world-screen.active').waitFor();
    await page.waitForFunction(()=>{
      const c=document.getElementById('globe-canvas'),r=c?.getBoundingClientRect();
      return r&&r.width>250&&r.height>250;
    });
    await page.waitForTimeout(650);

    const metrics=await page.evaluate(()=>{
      const screen=document.getElementById('world-screen').getBoundingClientRect();
      const canvas=document.getElementById('globe-canvas').getBoundingClientRect();
      const mode=document.getElementById('globe-mode').getBoundingClientRect();
      const back=document.getElementById('world-back').getBoundingClientRect();
      return {
        screen:{w:screen.width,h:screen.height},
        canvas:{w:canvas.width,h:canvas.height},
        mode:{w:mode.width,h:mode.height},
        back:{w:back.width,h:back.height},
        overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth
      };
    });
    assert.equal(metrics.overflow,false,label+' horizontal overflow');
    const minGlobeWidth=viewport.width<600?viewport.width*.84:(viewport.width>viewport.height?viewport.height*.70:viewport.width*.68);
    assert.ok(metrics.canvas.w>=minGlobeWidth,label+' globe too narrow for locked composition: '+metrics.canvas.w+' < '+minGlobeWidth);
    assert.ok(metrics.canvas.h>=300,label+' globe too short: '+metrics.canvas.h);
    assert.ok(metrics.back.h>=44,label+' globe back control below 44px');
    assert.ok(metrics.mode.h>=44,label+' globe mode control below 44px');
    assert.equal(await page.locator('[data-globe-mode="explore"]').isVisible(),true);
    assert.equal(await page.locator('[data-globe-mode="mine"]').isVisible(),true);
    assert.equal(await page.locator('[data-globe-mode="classic"]').isVisible(),true);
    assert.equal(await page.locator('#globe-mode [data-globe-mode]').count(),3,label+' must expose Utforsk, Min verden and Kloden');
    assert.equal(await page.locator('#random-country').isVisible(),true);
    assert.equal(await page.locator('#reset-globe').isVisible(),true);

    for(const mode of ['explore','mine','classic']){
      await page.locator('[data-globe-mode="'+mode+'"]').click();
      await page.waitForTimeout(250);
      assert.equal(await page.locator('[data-globe-mode="'+mode+'"]').getAttribute('class').then(x=>(x||'').includes('active')),true,label+' '+mode+' mode did not activate');
      await page.screenshot({path:path.join(out,label+'-'+mode+'.png'),fullPage:true});
    }
    fs.writeFileSync(path.join(out,label+'.json'),JSON.stringify(metrics,null,2));
    assert.deepEqual(errors,[],label+' page errors: '+errors.join('\n'));
    await ctx.close();
  }finally{await browser.close()}
}

(async()=>{
  const {s,url}=await server();globalThis.__url=url;
  try{
    await capture(chromium,'chromium-iphone',{width:390,height:844});
    await capture(webkit,'webkit-iphone',{width:390,height:844});
    await capture(webkit,'webkit-ipad',{width:820,height:1180});
    await capture(webkit,'webkit-ipad-landscape',{width:1180,height:820});
    console.log('ok - Prompt 18 globe visual evidence captured');
  }finally{s.close()}
})().catch(err=>{console.error(err);process.exit(1)});
