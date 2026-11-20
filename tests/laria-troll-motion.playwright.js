'use strict';
/* Real app review of the opt-in Storesøster wave. No fake actor DOM or force clicks. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const http=require('node:http');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium,webkit}=require('playwright');

const repo=path.resolve(__dirname,'..');
const app=path.join(repo,'laer-litt-mer');
const out=process.env.TROLL_MOTION_QA_OUTPUT||path.join(os.tmpdir(),'laria-troll-motion-qa');
fs.mkdirSync(out,{recursive:true});
const actorSelector='#home-screen.active .bc15-v16-troll';
const wavePattern='**/assets/trollactor-motion/storesoster/wave-20261121.webp*';
const waveRequest=/\/assets\/trollactor-motion\/storesoster\/wave-20261121\.webp(?:[?#]|$)/;
const duration=5250;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.json':'application/json','.webp':'image/webp',
  '.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webmanifest':'application/manifest+json'};
const seed={version:7,progressSchemaVersion:3,
  profile:{grade:2,onboarded:true,name:'Prøvebarn',avatar:'girl',setupVersion:2,tallvikaTroll:'storesoster'},
  mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},
  preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,
  journey:{nodes:{'math:2:talldalen':{attempts:1}},gradeWins:{},viewGrades:{},chapterProgress:{}},
  answerLog:[{at:1,subject:'math',correct:true,countsForLearning:true,questionKey:'motion-qa-math-1'}],
  sessionLog:[],activeSession:null};
const results=[];
function git(args){try{return execFileSync('git',['-c','safe.directory='+repo,...args],
  {cwd:repo,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();}catch(_){return null;}}
const source={commit:git(['rev-parse','HEAD']),branch:git(['branch','--show-current']),
  worktreeStatus:git(['status','--porcelain','--untracked-files=all']),files:{}};
for(const file of ['laer-litt-mer/index.html','laer-litt-mer/laria-troll-runtime-v1.js',
  'laer-litt-mer/laria-troll-runtime-v1.css','laer-litt-mer/laria-grovanova-v16.js',
  'laer-litt-mer/assets/home-v16/laria-grovanova-v16-approved.json',
  'laer-litt-mer/assets/trollactor-motion/storesoster/wave-20261121.webp',
  'laer-litt-mer/assets/trollactor-motion/storesoster/wave-20261121.json',
  'tests/laria-troll-motion.playwright.js']){
  const absolute=path.join(repo,file);
  source.files[file]=fs.existsSync(absolute)?crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex'):null;
}
source.dirty=source.worktreeStatus!=='';
const report={createdAt:new Date().toISOString(),source,
  scope:'Real Hjem v16 in desktop browser engines with iPad viewports and touch; not physical iPad Safari.',
  results};
function save(){fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2)+'\n');}
function serve(){
  return new Promise((resolve,reject)=>{
    const server=http.createServer((req,res)=>{
      const pathname=new URL(req.url,'http://127.0.0.1').pathname;
      let file;try{file=path.resolve(app,decodeURIComponent(pathname).replace(/^\/+/, '')||'index.html');}
      catch(_){res.writeHead(400);res.end();return;}
      if(file!==app&&!file.startsWith(app+path.sep)){res.writeHead(403);res.end();return;}
      fs.readFile(file,(error,bytes)=>{
        if(error){res.writeHead(404);res.end('missing');return;}
        res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
        res.end(bytes);
      });
    });
    server.once('error',reject);
    server.listen(0,'127.0.0.1',()=>resolve({server,url:'http://127.0.0.1:'+server.address().port+'/'}));
  });
}
function deferred(){let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};}
async function timed(promise,ms,message){
  let timer;
  try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(message)),ms);})]);}
  finally{clearTimeout(timer);}
}
async function atElapsed(page,started,targetMs){
  await page.waitForTimeout(Math.max(0,targetMs-(Date.now()-started)));
}
async function progress(page){
  return page.evaluate(()=>{
    const data=JSON.parse(localStorage.getItem('laerlittmer-v2'));
    return Object.fromEntries(['mastery','mistakes','skillMastery','skillMistakes','skillLastSeen',
      'masteryEvidence','skillEvidence','journey','answerLog','sessionLog'].map(key=>[key,data[key]]));
  });
}
async function readActor(page){
  return page.locator(actorSelector).evaluate(el=>{
    const img=el.querySelector('img.laria-premium-troll-art'),box=el.getBoundingClientRect();
    const nav=el.closest('.bc12').querySelector('.bc12-nav').getBoundingClientRect();
    return {id:el.dataset.troll,sequence:el.dataset.lariaTrollSequence||null,mood:el.dataset.lariaTrollMood,
      src:img?.getAttribute('src'),decoded:!!img?.complete&&img.naturalWidth>0,
      width:img?.naturalWidth,height:img?.naturalHeight,
      box:{x:box.x,y:box.y,width:box.width,height:box.height,right:box.right,bottom:box.bottom},navTop:nav.top};
  });
}
async function assertStatic(page,id='storesoster'){
  await page.waitForFunction(({selector,id})=>{
    const el=document.querySelector(selector),img=el?.querySelector('img.laria-premium-troll-art');
    return el?.dataset.troll===id&&!el.dataset.lariaTrollSequence&&img?.complete&&img.naturalWidth>0&&
      img.getAttribute('src')?.endsWith('/'+id+'.webp');
  },{selector:actorSelector,id},{timeout:12000});
  const state=await readActor(page);
  assert.equal(state.id,id);
  assert.equal(state.sequence,null);
  assert.ok(state.decoded,'V1 fallback must be decoded');
  assert.match(state.src,new RegExp('/gangemagi-troll/'+id+'\\.webp$'));
  return state;
}
async function waitWave(page){
  await page.waitForFunction(selector=>{
    const el=document.querySelector(selector),img=el?.querySelector('img.laria-premium-troll-art');
    return el?.dataset.lariaTrollSequence==='wave'&&img?.complete&&img.naturalWidth>0&&img.src.startsWith('blob:');
  },actorSelector,{timeout:15000});
  return readActor(page);
}
async function assertWave(page){
  const state=await readActor(page);
  assert.equal(state.id,'storesoster');
  assert.equal(state.sequence,'wave','the visible clip must still be playing');
  assert.match(state.src,/^blob:/);
  assert.ok(state.decoded,'the animated image must be decoded');
  return state;
}
async function choose(page,id){
  await page.locator('#home-screen.active .bc12-nav [data-camp="wardrobe"]').click();
  const dialog=page.locator('#laria-premium-troll-dialog');
  await dialog.waitFor({state:'visible'});
  await dialog.locator('[data-troll-choice="'+id+'"]').click();
  await dialog.waitFor({state:'hidden'});
  await assertStatic(page,id);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2')).profile.tallvikaTroll),id);
}
async function openHome(page,base,review){
  const url=new URL(base);url.searchParams.set('app','laria');
  if(review)url.searchParams.set('laria-troll-motion','1');else url.searchParams.delete('laria-troll-motion');
  await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>{
    const home=document.querySelector('#home-screen.active .bc12');
    return home?.dataset.bc15Asset==='ipad-v16-'+(innerHeight>innerWidth?'portrait':'landscape')&&
      home.dataset.bc15CardArt==='owner-approved-v16-painted';
  },null,{timeout:30000});
  await page.locator(actorSelector).waitFor({state:'visible'});
  assert.equal(await page.locator(actorSelector).count(),1,'exactly one actual Hjem actor');
  await assertStatic(page);
  return url.href;
}
async function runCase(browser,engine,base,name,viewport,options,check){
  const folder=path.join(out,engine+'-'+name);fs.mkdirSync(folder,{recursive:true});
  const record={engine,browserVersion:browser.version(),case:name,viewport,review:options.review!==false,
    reducedMotion:options.reducedMotion||'no-preference',status:'running',phase:'opening-home',
    screenshots:[],waveRequests:0,waveRequestEvents:[],errors:[]};
  results.push(record);save();
  const context=await browser.newContext({viewport,hasTouch:true,isMobile:true,deviceScaleFactor:1,
    serviceWorkers:'block',reducedMotion:record.reducedMotion,
    ...(options.video?{recordVideo:{dir:folder,size:viewport}}:{})});
  await context.addInitScript(value=>localStorage.setItem('laerlittmer-v2',JSON.stringify(value)),seed);
  await context.addInitScript(()=>{
    const originalFetch=window.fetch;
    window.__lariaMotionFetchEvidence=[];
    window.fetch=function(input){
      const url=typeof input==='string'?input:(input?.url||String(input));
      if(/\/trollactor-motion\/storesoster\/wave-20261121\.webp/.test(url)){
        window.__lariaMotionFetchEvidence.push({atMs:performance.now(),url,stack:new Error().stack,
          hosts:[...document.querySelectorAll('[data-laria-troll-loading]')].map(host=>{
            const r=host.getBoundingClientRect(),style=getComputedStyle(host);
            return {className:host.className,activeScreen:host.closest('.screen.active')?.id||null,
              display:style.display,visibility:style.visibility,opacity:style.opacity,
              rect:{x:r.x,y:r.y,width:r.width,height:r.height}};
          })});
      }
      return originalFetch.apply(this,arguments);
    };
  });
  const page=await context.newPage();
  const startedAt=Date.now();
  const releases=[];
  page.on('pageerror',error=>record.errors.push(error.message));
  page.on('request',request=>{if(waveRequest.test(request.url())){
    record.waveRequests++;
    record.waveRequestEvents.push({phase:record.phase,atMs:Date.now()-startedAt,type:request.resourceType()});
  }});
  await page.route('https://raw.githubusercontent.com/**',route=>route.abort());
  await page.route('https://api.worldbank.org/**',route=>route.abort());
  const capture=async label=>{
    const file=path.join(folder,label+'.png');
    await page.screenshot({path:file,fullPage:false});
    record.screenshots.push(path.relative(out,file));
  };
  try{
    if(options.setup)await options.setup(page,record,releases);
    record.url=await openHome(page,base,record.review);
    record.phase='ready';
    const before=await progress(page);
    await check({page,record,capture,actor:page.locator(actorSelector),releases});
    assert.deepEqual(await progress(page),before,'wave interactions must preserve synthetic learning progress');
    assert.deepEqual(record.errors,[],'page JavaScript exceptions');
    record.status='passed';
    console.log('[troll-motion] '+engine+' '+name+' PASS');
  }catch(error){
    record.status='failed';record.failure=error.stack||String(error);
    await capture('failure').catch(()=>{});
    console.error('[troll-motion] '+engine+' '+name+' FAIL '+error.message);
  }finally{
    for(const release of releases)release();
    record.fetchEvidence=await page.evaluate(()=>window.__lariaMotionFetchEvidence||[]).catch(()=>[]);
    const video=page.video();
    await context.close();
    if(video){const file=path.join(folder,'app-recording.webm');await video.saveAs(file);record.video=path.relative(out,file);}
    record.finishedAt=new Date().toISOString();save();
  }
}
async function normal({page,record,capture,actor}){
  const baseline=await assertStatic(page);
  assert.ok(baseline.box.x>=0&&baseline.box.y>=0&&baseline.box.right<=record.viewport.width&&
    baseline.box.bottom<=record.viewport.height,'actor must be inside the viewport');
  assert.ok(baseline.box.bottom<=baseline.navTop+4,'actor must remain above the bottom navigation');
  await capture('01-v1-before');
  await actor.click();
  const first=await waitWave(page),started=Date.now();
  record.firstWave=first;
  for(const key of ['x','y','width','height'])
    assert.ok(Math.abs(first.box[key]-baseline.box[key])<2,'playback must preserve actor layout: '+key);
  await capture('02-wave-start');
  await atElapsed(page,started,1600);
  await assertWave(page); // catches the former 1200 ms caller overriding the whole clip
  await capture('03-wave-middle');
  await atElapsed(page,started,3600);
  await assertWave(page);
  await capture('04-wave-late');
  await assertStatic(page);
  record.firstVisibleDurationMs=Date.now()-started;
  assert.ok(record.firstVisibleDurationMs>=duration-400,'clip ended before its advertised duration');
  await capture('05-v1-after');
  await actor.click();
  const second=await waitWave(page),restarted=Date.now();
  assert.notEqual(second.src,first.src,'repeat play needs a fresh image URL to restart');
  await atElapsed(page,restarted,1600);
  await assertWave(page);
  await capture('06-wave-repeat');
  await choose(page,'lillesoster');
  await capture('07-choice-during-playback');
  await page.waitForTimeout(duration);
  await assertStatic(page,'lillesoster');
  assert.equal(record.waveRequests,1,'the decoded clip should reuse one downloaded asset');
}
async function guards(browser,engine,base){
  const viewport={width:1024,height:1366};
  for(const [name,options] of [['default-v1',{review:false}],['reduced-motion',{reducedMotion:'reduce'}]]){
    await runCase(browser,engine,base,name,viewport,options,async({page,record,actor,capture})=>{
      await actor.click();await page.waitForTimeout(1700);await assertStatic(page);
      assert.equal(record.waveRequests,0,'guarded context must never fetch animated art');
      await capture('static-v1');
    });
  }
  let fail=true;
  await runCase(browser,engine,base,'asset-failure-and-retry',viewport,{setup:async page=>{
    await page.route(wavePattern,route=>fail?route.abort():route.continue());
  }},async({page,record,actor,capture})=>{
    const beforeClick=record.waveRequests;
    record.requestsBeforeManualClick=beforeClick;
    assert.ok(beforeClick<=1,'at most one automatic welcome may precede the manual click');
    record.phase='first-manual-click';
    const failed=page.waitForEvent('requestfailed',{predicate:request=>waveRequest.test(request.url())});
    await actor.click();await failed;
    await page.waitForFunction(selector=>document.querySelector(selector)?.dataset.lariaTrollMood==='idle',actorSelector);
    await assertStatic(page);await capture('failed-asset-v1');
    assert.equal(record.waveRequests,beforeClick+1,'one manual click must attempt exactly one fetch');
    record.phase='manual-retry';
    fail=false;await actor.click();await waitWave(page);
    assert.equal(record.waveRequests,beforeClick+2,'a failed load must retry exactly once on the next click');
    await capture('recovered-wave');
  });
  for(const cancel of [false,true]){
    const gate=deferred(),seen=deferred();
    await runCase(browser,engine,base,cancel?'choice-during-loading':'delayed-asset',viewport,
      {setup:async(page,_record,releases)=>{
        releases.push(gate.resolve);
        await page.route(wavePattern,async route=>{seen.resolve();await gate.promise;await route.continue().catch(()=>{});});
      }},async({page,record,actor,capture})=>{
        await actor.click();
        await timed(seen.promise,10000,'wave asset was not requested');
        await page.waitForTimeout(1700);
        await assertStatic(page);await capture('loading-keeps-v1');
        if(cancel)await choose(page,'lillesoster');
        const response=page.waitForResponse(response=>waveRequest.test(response.url()));
        gate.resolve();await response;
        if(cancel){
          await page.waitForTimeout(1300);await assertStatic(page,'lillesoster');
          await capture('late-load-keeps-new-choice');
        }else{
          await waitWave(page);const started=Date.now();
          await capture('wave-after-delay');
          await atElapsed(page,started,1700);await assertWave(page);
          await assertStatic(page);
          record.visibleDurationAfterDelayMs=Date.now()-started;
          assert.ok(record.visibleDurationAfterDelayMs>=duration-400,'loading time must not consume the visible clip');
        }
      });
  }
}
(async()=>{
  assert.match(source.commit||'',/^[a-f0-9]{40}$/,'QA evidence must identify the actual checked-out commit');
  const local=process.env.QA_URL?null:await serve();
  const base=process.env.QA_URL||local.url;
  try{
    for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
      let browser;
      try{
        browser=await type.launch({headless:true});
        for(const [name,viewport] of [['ipad-portrait',{width:1024,height:1366}],['ipad-landscape',{width:1366,height:1024}]])
          await runCase(browser,engine,base,name,viewport,{video:true},normal);
        await guards(browser,engine,base);
      }catch(error){
        results.push({engine,status:'blocked',failure:error.stack||String(error)});save();
        console.error('[troll-motion] '+engine+' BLOCKED '+error.message);
      }finally{if(browser)await browser.close();}
    }
  }finally{
    if(local)await new Promise(resolve=>local.server.close(resolve));
    report.finishedAt=new Date().toISOString();save();
  }
  if(results.some(result=>result.status!=='passed'))process.exitCode=1;
})().catch(error=>{report.failure=error.stack||String(error);save();console.error(error);process.exitCode=1;});
