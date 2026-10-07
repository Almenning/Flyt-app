'use strict';
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..','laer-litt-mer');
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

const seed=grade=>({
  version:7,progressSchemaVersion:3,
  profile:{grade,onboarded:true,name:'Testbarn',avatar:'girl',setupVersion:2},
  mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},
  preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,
  journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null
});

async function runCase(browserType,label,viewport){
  const browser=await browserType.launch({headless:true});
  try{
    const ctx=await browser.newContext({viewport,isMobile:viewport.width<600,hasTouch:true,serviceWorkers:'block'});
    const page=await ctx.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.addInitScript(x=>localStorage.setItem('laerlittmer-v2',JSON.stringify(x)),seed(2));
    await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
    await page.route('https://api.worldbank.org/**',r=>r.abort());
    await page.goto(globalThis.__lariaUrl+'?app=laria&p18=commerce-'+label,{waitUntil:'domcontentloaded'});

    const adult=page.locator('#adult-entry');
    await adult.waitFor({state:'visible'});
    await adult.dispatchEvent('pointerdown',{pointerType:'touch',button:0});
    await page.waitForTimeout(1600);
    await adult.dispatchEvent('pointerup',{pointerType:'touch',button:0});
    await page.locator('#adult-screen.active').waitFor();

    await page.locator('#open-terms').click();
    await page.locator('#terms-screen.active').waitFor();
    assert.match(await page.locator('#terms-screen').innerText(),/Vilkår og personvern/);
    assert.match(await page.locator('#terms-screen').innerText(),/App Store/);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false,label+' terms overflow');
    await page.locator('#terms-back').click();

    await page.locator('#open-commerce').click();
    await page.locator('#commerce-screen.active').waitFor();
    await page.waitForFunction(()=>/Forhåndsvisning|Premium er aktiv|App Store-oppsettet/.test(document.getElementById('commerce-status-title')?.textContent||''));
    assert.equal((await page.locator('#commerce-status-title').textContent()).trim(),'Forhåndsvisning',label+' web preview should not pretend StoreKit is live');
    assert.match(await page.locator('#commerce-status-copy').textContent(),/tar ikke betalt/i);
    assert.equal(await page.locator('.commerce-buy').count(),0,label+' web preview exposed purchase button');
    const restoreBox=await page.locator('#commerce-restore').boundingBox();
    assert.ok(restoreBox&&restoreBox.height>=44,label+' restore control below 44px');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false,label+' commerce overflow');

    await page.locator('#commerce-back').click();
    await page.locator('#adult-screen.active').waitFor();

    await page.evaluate(()=>showScreen('home'));
    await page.locator('#open-norwegian').click();
    await page.locator('#subject-screen.active').waitFor();
    await page.locator('#start-subject-session').click();
    await page.locator('#session-screen.active').waitFor();
    assert.ok(await page.locator('#question-wrap').isVisible(),label+' web preview was incorrectly paywalled');

    assert.deepEqual(errors,[],label+' page errors: '+errors.join('\n'));
    await ctx.close();
  }finally{await browser.close()}
}

(async()=>{
  const {s,url}=await server();globalThis.__lariaUrl=url;
  try{
    await runCase(chromium,'iphone',{width:390,height:844});
    await runCase(webkit,'ipad',{width:820,height:1180});
    console.log('ok - Prompt 18 parent commerce and terms work in Chromium + WebKit');
  }finally{s.close()}
})().catch(err=>{console.error(err);process.exit(1)});
