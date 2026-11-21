'use strict';
/* Real app review of opt-in Storesøster motion. Only actual child-facing actions;
 * unavailable media is reported separately from working activity wiring. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const http=require('node:http');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium,webkit}=require('playwright');
const openHomeSubject=require('./helpers/laria-home-open-subject.cjs');

const repo=path.resolve(__dirname,'..');
const app=path.join(repo,'laer-litt-mer');
const out=process.env.TROLL_MOTION_QA_OUTPUT||path.join(os.tmpdir(),'laria-troll-motion-qa');
fs.mkdirSync(out,{recursive:true});
const actorSelector='#home-screen.active .bc15-v16-troll';
const taskActorSelector='#session-screen.active .task-troll-companion';
const gangemagiActorSelector='#multiplication-lab-screen.active .gm-fox-art';
const mode=process.env.TROLL_MOTION_QA_MODE||'all';
assert.ok(['all','wave','flows'].includes(mode),'TROLL_MOTION_QA_MODE must be all, wave or flows');
const motionRoot='laer-litt-mer/assets/trollactor-motion/storesoster/';
const manifest=JSON.parse(fs.readFileSync(path.join(repo,motionRoot,'manifest.json'),'utf8'));
assert.equal(manifest.version,1);assert.equal(manifest.status,'review-only');
assert.equal(manifest.identity,'storesoster');
assert.equal(manifest.identity_sha256,'b98a5ee7f264d448da557636406080b5d8ee8aae23f32f0e41b66bf811beda89');
const motionKinds=['idle','wave','think','hint','celebrate','support'];
const media=Object.fromEntries(motionKinds.map(kind=>{
  const clip=manifest.clips?.[kind];
  if(!clip)return [kind,{status:'missing',decodedPlaybackObserved:false,fullDurationVerified:false}];
  assert.match(clip.filename,/^[a-z0-9][a-z0-9._-]*\.webp$/,'safe motion filename');
  const bytes=fs.readFileSync(path.join(repo,motionRoot,clip.filename));
  assert.equal(bytes.length,clip.bytes,kind+' metadata must match the actual file size');
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),clip.sha256,
    kind+' metadata must identify the actual animation bytes');
  assert.equal(clip.loop_count,kind==='idle'?0:1,kind+' playback loop contract');
  return [kind,{status:'available',decodedPlaybackObserved:false,fullDurationVerified:false,...clip}];
}));
const poster=manifest.poster||null;
if(poster){
  assert.match(poster.filename,/^[a-z0-9][a-z0-9._-]*\.webp$/,'safe poster filename');
  const bytes=fs.readFileSync(path.join(repo,motionRoot,poster.filename));
  assert.equal(bytes.length,poster.bytes,'poster metadata must match its actual file size');
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),poster.sha256,
    'poster metadata must identify the actual cutout bytes');
}
const wavePath='/assets/trollactor-motion/storesoster/'+manifest.clips.wave.filename;
const wavePattern='**'+wavePath+'*';
const waveRequest={test:url=>new URL(url).pathname.endsWith(wavePath)};
const posterPath=poster?'/assets/trollactor-motion/storesoster/'+poster.filename:null;
const duration=manifest.clips.wave.duration_ms;
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
  'laer-litt-mer/laria-task-scene-v15.js','laer-litt-mer/multiplication-gangemagi-v1.js',
  'laer-litt-mer/multiplication-gangemagi-v1.css',
  'laer-litt-mer/gangemagi-dagens-oppdrag-v1.css',
  'laer-litt-mer/assets/home-v16/laria-grovanova-v16-approved.json',
  motionRoot+'manifest.json',
  motionRoot+manifest.clips.wave.filename.replace(/\.webp$/,'.json'),
  ...(poster?[motionRoot+poster.filename,motionRoot+poster.filename.replace(/\.webp$/,'.json')]:[]),
  'tests/laria-troll-motion.playwright.js',
  ...Object.values(manifest.clips).map(clip=>motionRoot+clip.filename)]){
  const absolute=path.join(repo,file);
  source.files[file]=fs.existsSync(absolute)?crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex'):null;
}
source.dirty=source.worktreeStatus!=='';
const report={createdAt:new Date().toISOString(),source,mode,media,poster,
  mediaCoverage:{registeredClips:motionKinds.filter(kind=>media[kind].status==='available'),
    missingClips:motionKinds.filter(kind=>media[kind].status==='missing'),
    registeredCount:motionKinds.filter(kind=>media[kind].status==='available').length,requiredCount:6},
  scope:'Real Hjem v16, Norsk and Gangemagi in desktop browser engines with iPad viewports and touch; not physical iPad Safari.',
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
async function readActor(page,selector=actorSelector){
  return page.locator(selector).evaluate(el=>{
    const img=el.querySelector('img.laria-premium-troll-art'),box=el.getBoundingClientRect();
    const nav=el.closest('.bc12')?.querySelector('.bc12-nav')?.getBoundingClientRect();
    return {id:el.dataset.troll,sequence:el.dataset.lariaTrollSequence||null,mood:el.dataset.lariaTrollMood,
      poster:el.dataset.lariaTrollPoster||img?.dataset.lariaTrollPoster||null,
      loading:el.dataset.lariaTrollLoading||null,
      src:img?.getAttribute('src'),decoded:!!img?.complete&&img.naturalWidth>0,
      width:img?.naturalWidth,height:img?.naturalHeight,
      box:{x:box.x,y:box.y,width:box.width,height:box.height,right:box.right,bottom:box.bottom},navTop:nav?.top};
  });
}
async function assertStatic(page,id='storesoster',selector=actorSelector){
  await page.waitForFunction(({selector,id})=>{
    const el=document.querySelector(selector),img=el?.querySelector('img.laria-premium-troll-art');
    return el?.dataset.troll===id&&!el.dataset.lariaTrollSequence&&img?.complete&&img.naturalWidth>0&&
      (img.getAttribute('src')?.endsWith('/gangemagi-troll/'+id+'.webp')||
        ((el.dataset.lariaTrollPoster||img.dataset.lariaTrollPoster)===id&&img.getAttribute('src')?.startsWith('blob:')));
  },{selector,id},{timeout:12000});
  const state=await readActor(page,selector);
  assert.equal(state.id,id);
  assert.equal(state.sequence,null);
  assert.ok(state.decoded,'V1 fallback must be decoded');
  if(state.poster){
    assert.ok(poster&&id==='storesoster','only the registered verified neutral poster is allowed');
    assert.equal(state.poster,id);assert.match(state.src,/^blob:/);
    assert.equal(state.width,poster.width);assert.equal(state.height,poster.height);
  }else assert.match(state.src,new RegExp('/gangemagi-troll/'+id+'\\.webp$'));
  return state;
}
async function assertRest(page,selector=actorSelector){
  if(media.idle.status!=='available'){
    if(poster)await page.waitForFunction(selector=>{
      const host=document.querySelector(selector),img=host?.querySelector('img.laria-premium-troll-art');
      return !host?.dataset.lariaTrollSequence&&
        (host?.dataset.lariaTrollPoster||img?.dataset.lariaTrollPoster)==='storesoster';
    },selector,{timeout:20000});
    return assertStatic(page,'storesoster',selector);
  }
  await page.waitForFunction(selector=>{
    const el=document.querySelector(selector),img=el?.querySelector('img.laria-premium-troll-art');
    return el?.dataset.troll==='storesoster'&&el.dataset.lariaTrollSequence==='idle'&&
      img?.complete&&img.naturalWidth>0&&img.src.startsWith('blob:');
  },selector,{timeout:20000});
  const state=await readActor(page,selector);
  assert.equal(state.mood,'idle');
  assert.equal(state.width,media.idle.width);
  assert.equal(state.height,media.idle.height);
  media.idle.decodedPlaybackObserved=true;
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
async function openHome(page,base,review,reducedMotion,waitForPoster=true){
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
  if(review&&reducedMotion!=='reduce'&&waitForPoster)await assertRest(page);
  else await assertStatic(page);
  return url.href;
}
async function runCase(browser,engine,base,name,viewport,options,check){
  const folder=path.join(out,engine+'-'+name);fs.mkdirSync(folder,{recursive:true});
  const record={engine,browserVersion:browser.version(),case:name,viewport,review:options.review!==false,
    reducedMotion:options.reducedMotion||'no-preference',status:'running',phase:'opening-home',
    screenshots:[],waveRequests:0,waveRequestEvents:[],motionRequests:[],reactions:[],errors:[]};
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
      if(/\/trollactor-motion\/storesoster\/wave-[^/]+\.webp/.test(url)){
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
    // Observe the real runtime and replaced actor nodes; never invoke a mood,
    // mutate app state, inject a character or synthesize a gameplay event.
    window.__lariaTrollEvidence=[];
    const ids=new WeakMap(),previous=new WeakMap();let nextId=1;
    function snapshot(host){
      if(!host?.matches?.('.laria-troll-host'))return;
      const img=host.querySelector('img.laria-premium-troll-art');
      if(!img)return;
      if(!ids.has(host))ids.set(host,nextId++);
      const box=host.getBoundingClientRect(),style=getComputedStyle(host);
      const value={hostId:ids.get(host),screen:host.closest('.screen')?.id||null,
        className:host.className,id:host.dataset.troll||img.dataset.troll,
        mood:host.dataset.lariaTrollMood||null,sequence:host.dataset.lariaTrollSequence||null,
        loading:host.dataset.lariaTrollLoading||null,src:img.getAttribute('src'),
        decoded:img.complete&&img.naturalWidth>0,width:img.naturalWidth,height:img.naturalHeight,
        visible:box.width>0&&box.height>0&&style.display!=='none'&&style.visibility!=='hidden'&&
          !!host.closest('.screen.active')};
      const key=JSON.stringify(value);
      if(previous.get(host)===key)return;
      previous.set(host,key);
      window.__lariaTrollEvidence.push({atMs:performance.now(),...value});
    }
    function start(){
      document.querySelectorAll('.laria-troll-host').forEach(snapshot);
      new MutationObserver(changes=>{
        const hosts=new Set();
        for(const change of changes){
          const parent=change.target.nodeType===1?change.target:change.target.parentElement;
          const host=parent?.closest('.laria-troll-host');if(host)hosts.add(host);
          for(const node of change.addedNodes||[]){
            if(node.nodeType!==1)continue;
            if(node.matches('.laria-troll-host'))hosts.add(node);
            node.querySelectorAll('.laria-troll-host').forEach(host=>hosts.add(host));
          }
        }
        hosts.forEach(snapshot);
      }).observe(document.documentElement,{subtree:true,childList:true,attributes:true,
        attributeFilter:['data-laria-troll-mood','data-laria-troll-loading','data-laria-troll-sequence','src']});
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  });
  const page=await context.newPage();
  const startedAt=Date.now();
  const releases=[];
  page.on('pageerror',error=>record.errors.push(error.message));
  page.on('request',request=>{
    if(/\/assets\/trollactor-motion\//.test(request.url()))record.motionRequests.push({
      phase:record.phase,atMs:Date.now()-startedAt,path:new URL(request.url()).pathname});
    if(waveRequest.test(request.url())){
      record.waveRequests++;
      record.waveRequestEvents.push({phase:record.phase,atMs:Date.now()-startedAt,type:request.resourceType()});
    }
  });
  await page.route('https://raw.githubusercontent.com/**',route=>route.abort());
  await page.route('https://api.worldbank.org/**',route=>route.abort());
  const capture=async label=>{
    const file=path.join(folder,label+'.png');
    await page.screenshot({path:file,fullPage:false});
    record.screenshots.push(path.relative(out,file));
  };
  try{
    if(options.setup)await options.setup(page,record,releases);
    record.url=await openHome(page,base,record.review,record.reducedMotion,options.waitForPoster!==false);
    if(options.observeCalls){
      await page.evaluate(()=>{
        const original=window.LARIA_TROLL_ACTOR;
        if(!original?.mood)throw Error('The real TrollActor runtime must exist before observation');
        window.__lariaTrollCallEvidence=[];
        const observed=Object.freeze({...original,mood:function(...args){
          const [host,kind,options]=args;
          window.__lariaTrollCallEvidence.push({atMs:performance.now(),kind,
            screen:host?.closest('.screen')?.id||null,className:host?.className||null,
            connected:!!host?.isConnected,say:options?.say,duration:options?.duration});
          return Reflect.apply(original.mood,this,args);
        }});
        // The public object is frozen, so preserve every export on a frozen
        // forwarding object. This observer never invokes mood on its own.
        window.LARIA_TROLL_ACTOR=observed;
        if(window.LARIA_TROLL===original)window.LARIA_TROLL=observed;
      });
      record.callObservation='Passive forwarding wrapper around the existing public mood API; no injected reactions.';
    }
    record.phase='ready';
    const before=await progress(page);
    await check({page,record,capture,actor:page.locator(actorSelector),releases,beforeProgress:before});
    if(options.progressCheck)await options.progressCheck(before,await progress(page),record);
    else assert.deepEqual(await progress(page),before,'non-answer interactions must preserve synthetic learning progress');
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
    record.actorEvidence=await page.evaluate(()=>window.__lariaTrollEvidence||[]).catch(()=>[]);
    record.callEvidence=await page.evaluate(()=>window.__lariaTrollCallEvidence||[]).catch(()=>[]);
    const video=page.video();
    await context.close();
    if(video){const file=path.join(folder,'app-recording.webm');await video.saveAs(file);record.video=path.relative(out,file);}
    record.finishedAt=new Date().toISOString();save();
  }
}
async function normal({page,record,capture,actor}){
  const baseline=await assertRest(page);
  assert.ok(baseline.box.x>=0&&baseline.box.y>=0&&baseline.box.right<=record.viewport.width&&
    baseline.box.bottom<=record.viewport.height,'actor must be inside the viewport');
  assert.ok(baseline.box.bottom<=baseline.navTop+4,'actor must remain above the bottom navigation');
  await capture('01-rest-before');
  await actor.click();
  const first=await waitWave(page),started=Date.now();
  record.firstWave=first;
  media.wave.decodedPlaybackObserved=true;
  for(const key of ['x','y','width','height'])
    assert.ok(Math.abs(first.box[key]-baseline.box[key])<2,'playback must preserve actor layout: '+key);
  await capture('02-wave-start');
  await atElapsed(page,started,1600);
  await assertWave(page); // catches the former 1200 ms caller overriding the whole clip
  await capture('03-wave-middle');
  await atElapsed(page,started,3600);
  await assertWave(page);
  await capture('04-wave-late');
  await assertRest(page);
  record.firstVisibleDurationMs=Date.now()-started;
  assert.ok(record.firstVisibleDurationMs>=duration-400,'clip ended before its advertised duration');
  media.wave.fullDurationVerified=true;
  await capture('05-rest-after');
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
  const beforeOtherTrolls=record.motionRequests.length;
  await actor.click();
  await assertStatic(page,'lillesoster');
  await choose(page,'lillebror');
  await actor.click();
  await assertStatic(page,'lillebror');
  await capture('08-lillebror-original');
  assert.equal(record.motionRequests.length,beforeOtherTrolls,
    'the two trolls without reviewed media must not request nonexistent clips or catalogs');
  await choose(page,'storesoster');
  await actor.click();
  const returned=await waitWave(page);
  assert.notEqual(returned.src,second.src,'returning to Storesøster must start a fresh playback');
  await capture('09-storesoster-returned-wave');
  await assertRest(page);
  record.characterSwitches=['storesoster','lillesoster','lillebror','storesoster'];
  assert.equal(record.waveRequests,1,'the decoded clip should reuse one downloaded asset');
}
async function observeCelebrateLayout(page,selector,label){
  await page.evaluate(({selector,label})=>{
    const observations=window.__lariaCelebrateLayouts||=Object.create(null);
    const observation=observations[label]={startedAtMs:null,done:false,samples:[]};
    const deadline=setTimeout(()=>{observation.done=true;observation.timedOut=true;},12000);
    const measure=element=>{
      if(!element)return null;
      const box=element.getBoundingClientRect(),style=getComputedStyle(element);
      if(!box.width||!box.height||style.display==='none'||style.visibility==='hidden')return null;
      return {rect:{left:box.left,right:box.right,top:box.top,bottom:box.bottom},
        opacity:Number(style.opacity),filter:style.filter,transform:style.transform};
    };
    const sample=()=>{
      if(observation.done)return;
      const host=document.querySelector(selector),img=host?.querySelector('img.laria-premium-troll-art');
      const now=performance.now();
      if(host?.dataset.lariaTrollMood==='celebrate'&&img?.complete&&img.naturalWidth>0){
        if(observation.startedAtMs===null)observation.startedAtMs=now;
        const animation=img.getAnimations().find(item=>item.animationName==='laria-troll-celebrate');
        const speech=host.querySelector('.laria-troll-speech');
        const card=host.closest('.laria-task-card');
        observation.samples.push({atMs:now-observation.startedAtMs,
          illustratedNorwegianTablet:matchMedia('(min-width:700px) and (min-height:700px)').matches&&
            !!host.closest('#session-screen.task-scene[data-task-band="young"][data-task-subject="norwegian"] .task-visual-companion-stage'),
          host:measure(host),art:measure(img),animationTimeMs:animation?.currentTime??null,
          animationProgress:animation?.effect.getComputedTiming().progress??null,
          speech:speech?.dataset.show==='true'?measure(speech):null,
          task:card?Object.fromEntries(['.question','.learning-passage','.task-interaction'].map(
            name=>[name,measure(card.querySelector(name))])):null});
      }
      if(observation.startedAtMs!==null&&now-observation.startedAtMs>=1300){
        observation.done=true;clearTimeout(deadline);return;
      }
      // Read after the app's animation-frame placement callbacks, without
      // changing the mood, playback time or child-facing event sequence.
      requestAnimationFrame(()=>setTimeout(sample,0));
    };
    requestAnimationFrame(()=>setTimeout(sample,0));
  },{selector,label});
}
async function assertCelebrateLayout(page,entry,selector){
  await page.waitForFunction(label=>window.__lariaCelebrateLayouts?.[label]?.done,
    entry.action,{timeout:5000});
  const layout=await page.evaluate(label=>window.__lariaCelebrateLayouts[label],entry.action);
  entry.celebrationLayout=layout;
  assert.ok(!layout.timedOut,entry.action+' must finish its passive layout observation');
  assert.ok(layout.samples.some(frame=>frame.animationProgress>=.2&&frame.animationProgress<=.4),
    entry.action+' must measure the actual CSS celebration near its jump peak');
  // Parent-filter clipping in WebKit is not represented by DOM rectangles.
  // Preserve both computed filters and the existing in-reaction screenshot
  // for visual review; do not require transparent image margins inside a host.
  if(selector!==taskActorSelector)return;
  layout.clearanceScope='Illustrated young Norwegian task stage on tablet-sized viewports only';
  const scoped=layout.samples.filter(frame=>frame.illustratedNorwegianTablet);
  layout.clearanceChecked=scoped.length>0;
  if(!layout.clearanceChecked)return;
  layout.tailPixels=7;layout.minimumArtGap=2;
  const visible=scoped.filter(frame=>frame.speech?.opacity>.1&&frame.art);
  assert.ok(visible.length>0,entry.action+' must observe visible contextual speech');
  for(const frame of visible){
    frame.artGap=frame.art.rect.top-frame.speech.rect.bottom-layout.tailPixels;
    frame.taskGaps=Object.fromEntries(Object.entries(frame.task||{}).filter(([,target])=>target).map(
      ([name,target])=>[name,Math.max(target.rect.left-frame.speech.rect.right,
        frame.speech.rect.left-target.rect.right,target.rect.top-frame.speech.rect.bottom-layout.tailPixels,
        frame.speech.rect.top-target.rect.bottom)]));
  }
  layout.minimumObservedArtGap=Math.min(...visible.map(frame=>frame.artGap));
  assert.ok(layout.minimumObservedArtGap>=layout.minimumArtGap,
    entry.action+' speech including its tail must clear the full moving art by 2px: '+layout.minimumObservedArtGap);
  assert.ok(visible.every(frame=>Object.hasOwn(frame.taskGaps,'.question')),
    entry.action+' must measure the adjacent question');
  for(const frame of visible)for(const [name,gap] of Object.entries(frame.taskGaps)){
    assert.ok(gap>=0,entry.action+' speech must not cover '+name+' during celebration: '+gap);
  }
}
async function reaction({page,record,capture},selector,label,kind,action,requireCall=false){
  const marker=await page.evaluate(()=>window.__lariaTrollEvidence.length);
  const callMarker=await page.evaluate(()=>window.__lariaTrollCallEvidence?.length||0);
  const screen=selector.startsWith('#session-screen')?'session-screen':'multiplication-lab-screen';
  const hostClass=screen==='session-screen'?'task-troll-companion':'gm-fox-art';
  record.phase=label;
  const observeLayout=kind==='celebrate'&&media.celebrate.status==='missing';
  if(observeLayout)await observeCelebrateLayout(page,selector,label);
  await action();
  await page.waitForFunction(({marker,screen,hostClass,kind})=>
    window.__lariaTrollEvidence.slice(marker).some(event=>event.screen===screen&&
      event.className.split(' ').includes(hostClass)&&event.visible&&event.mood===kind),
  {marker,screen,hostClass,kind},{timeout:15000});
  let runtimeCall=null;
  if(requireCall){
    await page.waitForFunction(({callMarker,screen,hostClass,kind})=>
      window.__lariaTrollCallEvidence.slice(callMarker).some(event=>event.screen===screen&&
        event.className?.split(' ').includes(hostClass)&&event.connected&&event.kind===kind),
    {callMarker,screen,hostClass,kind},{timeout:15000});
    runtimeCall=await page.evaluate(({callMarker,screen,hostClass,kind})=>
      window.__lariaTrollCallEvidence.slice(callMarker).find(event=>event.screen===screen&&
        event.className?.split(' ').includes(hostClass)&&event.connected&&event.kind===kind),
    {callMarker,screen,hostClass,kind});
  }
  const clipKind=kind==='curious'?'think':kind;
  const entry={action:label,mood:kind,clip:clipKind,
    wiring:requireCall?'runtime-call-and-visible-reaction':'visible-semantic-reaction',runtimeCall,
    animation:media[clipKind]?.status==='available'?'pending':'missing-v1-fallback'};
  record.reactions.push(entry);
  if(media[clipKind]?.status==='available'){
    await page.waitForFunction(({selector,clipKind})=>{
      const host=document.querySelector(selector),img=host?.querySelector('img.laria-premium-troll-art');
      return host?.dataset.lariaTrollSequence===clipKind&&img?.complete&&img.naturalWidth>0&&
        img.getAttribute('src')?.startsWith('blob:');
    },{selector,clipKind},{timeout:15000});
    const started=Date.now();
    entry.actor=await readActor(page,selector);
    assert.equal(entry.actor.id,'storesoster');
    assert.equal(entry.actor.width,media[clipKind].width);
    assert.equal(entry.actor.height,media[clipKind].height);
    await capture(label);
    await assertRest(page,selector);
    entry.visibleDurationMs=Date.now()-started;
    assert.ok(entry.visibleDurationMs>=media[clipKind].duration_ms-450,
      label+' must play the complete actual clip before returning to rest');
    entry.animation='played';media[clipKind].decodedPlaybackObserved=true;
    media[clipKind].fullDurationVerified=true;
  }else{
    entry.actor=await assertStatic(page,'storesoster',selector);
    if(observeLayout){
      // Let the passive sampler observe a real jump-peak frame before
      // expensive screenshot work in WebKit can interrupt that window.
      try{
        await page.waitForFunction(label=>window.__lariaCelebrateLayouts?.[label]?.samples.some(
          frame=>frame.animationProgress>=.2&&frame.animationProgress<=.4),label,{timeout:3000});
      }finally{
        entry.celebrationLayout=await page.evaluate(label=>window.__lariaCelebrateLayouts[label],label);
      }
    }
    await capture(label+'-v1-fallback');
    // A missing clip is not an animation success. The real semantic reaction
    // and the preserved V1 source are the separate, reviewable result.
  }
  if(observeLayout)await assertCelebrateLayout(page,entry,selector);
  return entry;
}
async function noHiddenMotion(page,screenId){
  await page.waitForFunction(id=>{
    const screen=document.getElementById(id);
    return !!screen&&!screen.classList.contains('active')&&
      !screen.querySelector('[data-laria-troll-sequence],[data-laria-troll-loading]');
  },screenId,{timeout:12000});
}
async function idleCycle({page,record,capture},selector){
  const start=await assertRest(page,selector);
  if(media.idle.status!=='available'){
    record.idleLoop={animation:'missing-v1-fallback',actor:start};return;
  }
  await capture('idle-loop-start');
  await page.waitForTimeout(media.idle.duration_ms+250);
  const end=await readActor(page,selector);
  assert.equal(end.sequence,'idle','rest must keep the real idle loop running');
  assert.equal(end.src,start.src,'idle loops within the same decoded image, without restarting its URL');
  assert.equal(await page.locator('.screen.active [data-laria-troll-sequence="idle"]:visible').count(),1,
    'only one scene companion may run idle');
  record.idleLoop={animation:'played-through-loop',durationMs:media.idle.duration_ms,
    start,end};
  media.idle.fullDurationVerified=true;
  await capture('idle-loop-after-cycle');
}
async function gangemagiLayout(page){
  return page.evaluate(()=>{
    const screen=document.querySelector('#multiplication-lab-screen.active');
    const measure=selector=>{
      const element=screen.querySelector(selector),box=element.getBoundingClientRect();
      const animation=getComputedStyle(element);
      let visible=box.width>0&&box.height>0;
      for(let node=element;node&&visible;node=node.parentElement){
        const style=getComputedStyle(node);
        if(style.display==='none'||style.visibility==='hidden'||style.opacity==='0')visible=false;
      }
      return {visible,animationName:animation.animationName,animationDuration:animation.animationDuration,
        rect:{left:box.left,right:box.right,top:box.top,bottom:box.bottom,
        width:box.width,height:box.height}};
    };
    return {measuredAtMs:performance.now(),actor:measure('.gm-fox-art'),
      actorImage:measure('.gm-fox-art>img.gm-troll-art.laria-premium-troll-art'),
      speech:measure('.gm-fox-bubble'),math:measure('.gm-math')};
  });
}
function assertGangemagiClearance(layout,phase){
  layout.minimumGap=8;layout.clearances={};
  assert.ok(layout.math.visible,phase+' calculation must remain visible');
  for(const key of ['actor','actorImage','speech']){
    assert.ok(layout[key].visible,phase+' '+key+' must remain visible');
    const guide=layout[key].rect,math=layout.math.rect;
    const gaps={left:math.left-guide.right,right:guide.left-math.right,
      above:math.top-guide.bottom,below:guide.top-math.bottom};
    layout.clearances[key]={...gaps,best:Math.max(...Object.values(gaps))};
    assert.ok(layout.clearances[key].best>=layout.minimumGap,
      phase+' '+key+' needs at least '+layout.minimumGap+'px clear space from the calculation: '+JSON.stringify(gaps));
  }
}
async function question(page){
  return page.evaluate(()=>{
    const q=sessionQuestions[qIndex];
    return {index:qIndex,type:q.type,subject:q.subject,skill:q.skill,answer:String(q.answer),
      letters:q.letters,practiceRepeat:!!q.practiceRepeat};
  });
}
async function submitReadingAnswer(page,q,correct){
  assert.equal(q.subject,'norwegian');
  assert.equal(q.practiceRepeat,false,'fresh controlled profile must receive assessed questions');
  const area=page.locator('#session-screen.active .task-interaction');
  if(q.type==='learning-choice'){
    const choices=area.locator('.answer');
    const values=await choices.evaluateAll(nodes=>nodes.map(node=>node.dataset.answer));
    const index=values.findIndex(value=>correct?value===q.answer:value!==q.answer);
    assert.ok(index>=0,'the real question must offer the requested correct or incorrect answer');
    await choices.nth(index).click();
  }else if(q.type==='build-word'){
    // Retry clears each filled slot through the visible return-letter button.
    for(let i=0;i<q.answer.length;i++){
      const filled=area.locator('.letter-slot.filled');
      if(await filled.count())await filled.first().click();
    }
    const letters=q.answer.split('');
    if(!correct){
      const different=letters.findIndex(letter=>letter!==letters[0]);
      assert.ok(different>0,'word must allow a genuinely incorrect ordering');
      [letters[0],letters[different]]=[letters[different],letters[0]];
    }
    const used=new Set();
    for(let slot=0;slot<letters.length;slot++){
      const index=q.letters.findIndex((tile,i)=>tile.l===letters[slot]&&!used.has(i));
      assert.ok(index>=0,'the actual letter bank supplies each selected letter');used.add(index);
      await area.locator('.letter-tile[data-idx="'+index+'"]').click();
      await area.locator('.letter-slot[data-slot="'+slot+'"]').click();
    }
    await area.locator('#check-build').click();
  }else throw Error('Uncovered real reading question type: '+q.type);
  await page.locator('#session-screen.active #feedback').waitFor({state:'visible'});
  assert.equal(await page.locator('#session-screen.active #feedback').evaluate(el=>el.classList.contains('bad')),!correct);
}
function checkAssessment(before,after,q,correct,record,corrected=false){
  const key='norwegian:g2:'+q.skill;
  assert.deepEqual(after.answerLog.slice(0,before.answerLog.length),before.answerLog,
    'new answers must preserve all previously recorded learning');
  assert.equal(after.answerLog.length,before.answerLog.length+1,'one assessed answer adds exactly one log entry');
  const answer=after.answerLog.at(-1);
  for(const [field,value] of Object.entries({subject:q.subject,skill:q.skill,type:q.type,grade:2,
    correct,countsForLearning:true}))assert.equal(answer[field],value,'assessed answer '+field);
  if(corrected)assert.equal(answer.corrected,true);
  assert.ok(answer.questionKey&&answer.at>0);
  for(const field of ['mastery','mistakes','masteryEvidence','journey','sessionLog'])
    assert.deepEqual(after[field],before[field],'one Norsk answer must preserve '+field);
  for(const field of ['skillMastery','skillMistakes','skillLastSeen','skillEvidence']){
    const exceptKey=value=>Object.fromEntries(Object.entries(value||{}).filter(([entry])=>entry!==key));
    assert.deepEqual(exceptKey(after[field]),exceptKey(before[field]),'unrelated skills must remain unchanged in '+field);
  }
  const old=Number(before.skillMastery[key]||0);
  assert.equal(after.skillMastery[key],correct?Math.min(3,old+1):Math.max(0,old-1));
  assert.equal(Number(after.skillMistakes[key]||0),Number(before.skillMistakes[key]||0)+(correct?0:1));
  const oldEvidence=before.skillEvidence[key]||{},newEvidence=after.skillEvidence[key];
  assert.equal(newEvidence.attempts,Number(oldEvidence.attempts||0)+1);
  assert.equal(newEvidence.correctCount,Number(oldEvidence.correctCount||0)+(correct?1:0));
  assert.equal(newEvidence.wrongCount,Number(oldEvidence.wrongCount||0)+(correct?0:1));
  record.assessments.push({questionIndex:q.index,type:q.type,skill:q.skill,correct,corrected,questionKey:answer.questionKey});
}
function checkReadingProgress(before,after,record){
  assert.deepEqual(after.answerLog.slice(0,before.answerLog.length),before.answerLog);
  assert.equal(after.answerLog.length,before.answerLog.length+record.assessments.length,
    'only the explicit assessed answers may change the answer log');
  assert.deepEqual(record.assessments.map(answer=>answer.correct),
    record.secondQuestion.type==='build-word'?[true,false,true]:[true,false]);
  for(const field of ['mastery','mistakes','masteryEvidence','journey','sessionLog'])
    assert.deepEqual(after[field],before[field],'the unfinished reading session must preserve '+field);
}
async function norskFlow(context){
  const {page,record,capture,beforeProgress}=context;record.assessments=[];
  record.phase='open-norsk';
  await openHomeSubject(page,'norwegian');
  await page.locator('#eggenipa-world:visible').waitFor({timeout:18000});
  const painted=page.locator('#eggenipa-world .eg-scene-reading:visible');
  const entry=await painted.count()?painted:page.locator('#eggenipa-world .eg-portal[data-eg="reading"]:visible');
  await entry.click();
  await page.locator('#session-screen.active .laria-task-card').waitFor();
  await page.locator(taskActorSelector).waitFor({state:'visible'});
  await noHiddenMotion(page,'home-screen');
  assert.deepEqual(await progress(page),beforeProgress,'opening Lesekroken must not award learning progress');
  const beforeHint=await progress(page),hint=page.locator('#session-screen.active .task-norsk-guide');
  await reaction(context,taskActorSelector,'norsk-first-hint','hint',()=>hint.click(),true);
  assert.equal(await hint.getAttribute('aria-expanded'),'true');
  assert.ok((await page.locator('#task-norsk-hint').innerText()).trim().length>0);
  assert.deepEqual(await progress(page),beforeHint,'Norsk hint must not mark an answer');
  await hint.click();
  assert.equal(await hint.getAttribute('aria-expanded'),'true');
  await hint.click();
  assert.equal(await hint.getAttribute('aria-expanded'),'false');
  assert.equal(await page.locator('#task-norsk-hint').isVisible(),false);
  assert.deepEqual(await progress(page),beforeHint,'showing and closing hints must preserve all progress');
  await assertRest(page,taskActorSelector);
  record.firstQuestion=await question(page);
  await reaction(context,taskActorSelector,'norsk-correct-answer','celebrate',()=>submitReadingAnswer(page,record.firstQuestion,true));
  const afterCorrect=await progress(page);
  checkAssessment(beforeHint,afterCorrect,record.firstQuestion,true,record);
  await page.locator('#session-screen.active #next-question').click();
  await page.waitForFunction(index=>qIndex===index,record.firstQuestion.index+1);
  record.secondQuestion=await question(page);
  assert.deepEqual(await progress(page),afterCorrect,'advancing to a question must not assess another answer');
  await reaction(context,taskActorSelector,'norsk-wrong-answer','support',()=>submitReadingAnswer(page,record.secondQuestion,false));
  const afterWrong=await progress(page);
  checkAssessment(afterCorrect,afterWrong,record.secondQuestion,false,record);
  assert.equal(await page.locator('#session-screen.active #next-question').isVisible(),false,
    'wrong young answer leaves the actual retry controls available');
  await reaction(context,taskActorSelector,'norsk-correct-retry','celebrate',()=>submitReadingAnswer(page,record.secondQuestion,true));
  const afterRetry=await progress(page);
  if(record.secondQuestion.type==='build-word')checkAssessment(afterWrong,afterRetry,record.secondQuestion,true,record,true);
  else assert.deepEqual(afterRetry,afterWrong,'correcting a young multiple-choice mistake must not add another scored attempt');
  await page.locator('#session-screen.active #next-question').waitFor({state:'visible'});
  await page.locator('#session-screen.active #close-session').click();
  await page.locator('#eggenipa-world:visible').waitFor();
  await noHiddenMotion(page,'session-screen');
  await page.locator('#eggenipa-world [data-eg="home"]:visible').click();
  await page.locator(actorSelector).waitFor({state:'visible'});
  await assertRest(page);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2')).profile.tallvikaTroll),'storesoster');
  await capture('norsk-return-home');
}
async function gangemagiFlow(context){
  const {page,record,capture,beforeProgress}=context;
  record.phase='open-gangemagi';
  await openHomeSubject(page,'math');
  await page.locator('#tallvika-world:visible').waitFor({timeout:18000});
  await page.locator('#tallvika-world [data-tv="multiply"]:visible').click();
  await page.locator('#multiplication-lab-screen.active .gm-shell').waitFor();
  await page.locator(gangemagiActorSelector).waitFor({state:'visible'});
  await noHiddenMotion(page,'home-screen');
  const game=()=>page.evaluate(()=>window.LARIA_GANGEMAGI.snapshot());
  const initial=await game();
  assert.deepEqual(initial.counts,[0,0,0]);assert.deepEqual(initial.wins,[]);
  assert.equal(initial.each,3);assert.equal(initial.groups,3);
  await idleCycle(context,gangemagiActorSelector);
  const add=async group=>{
    await page.locator('#multiplication-lab-screen.active [data-gm-action="source"]').click();
    await page.locator('#multiplication-lab-screen.active [data-gm-action="basket"][data-gm-basket="'+group+'"] .gm-crate-front').click();
  };
  await add(0);assert.deepEqual((await game()).counts,[1,0,0]);
  await reaction(context,gangemagiActorSelector,'gangemagi-remove-think','think',()=>
    page.locator('#multiplication-lab-screen.active [data-gm-action="remove"][data-group="0"]').click(),true);
  assert.deepEqual((await game()).counts,[0,0,0]);
  const beforeHint=await game();
  await reaction(context,gangemagiActorSelector,'gangemagi-hint','hint',()=>
    page.locator('#multiplication-lab-screen.active [data-gm-action="hint"]').click(),true);
  record.hintLayout=await gangemagiLayout(page);
  assertGangemagiClearance(record.hintLayout,'hint');
  assert.deepEqual(await game(),beforeHint,'a game hint must not move berries or award a flower');
  assert.deepEqual(await progress(page),beforeProgress,'Gangemagi preparation and hints must preserve assessed learning progress');
  for(let group=0;group<3;group++)for(let berry=0;berry<3;berry++){
    if(group===2&&berry===2){
      await reaction(context,gangemagiActorSelector,'gangemagi-complete-celebrate','celebrate',()=>add(group),true);
    }else await add(group);
    const expected=Array.from({length:3},(_,index)=>index<group?3:index===group?berry+1:0);
    assert.deepEqual((await game()).counts,expected,'each real berry action changes exactly one basket');
  }
  const complete=await game();
  assert.equal(complete.wins.length,1);assert.equal(complete.equation.complete,true);
  assert.equal((await page.locator('#multiplication-lab-screen.active .gm-math-equation').innerText()).trim(),'3 × 3 = 9');
  await page.locator('#multiplication-lab-screen.active .gm-celebration').waitFor({state:'visible'});
  record.game={initial,complete};
  record.completionLayout=await gangemagiLayout(page);
  await capture('gangemagi-earned-flower');
  assertGangemagiClearance(record.completionLayout,'completed');
  await page.locator('#multiplication-lab-screen.active [data-gm-action="back"]').click();
  await page.locator('#tallvika-world:visible').waitFor();
  await noHiddenMotion(page,'multiplication-lab-screen');
  assert.equal((await game()).wins.length,1,'return navigation must preserve the earned flower');
  await page.locator('#tallvika-world [data-tv="back"]:visible').click();
  await page.locator(actorSelector).waitFor({state:'visible'});await assertRest(page);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2')).profile.tallvikaTroll),'storesoster');
  await capture('gangemagi-return-home');
}
async function guards(browser,engine,base){
  const viewport={width:1024,height:1366};
  for(const [name,options] of [['default-v1',{review:false}],['reduced-motion',{reducedMotion:'reduce'}]]){
    await runCase(browser,engine,base,name,viewport,options,async({page,record,actor,capture})=>{
      await actor.click();await page.waitForTimeout(1700);await assertStatic(page);
      assert.equal((await readActor(page)).poster,null,'guarded initial context must keep the locked V1 source');
      assert.equal(record.waveRequests,0,'guarded context must never fetch animated art');
      assert.equal(record.motionRequests.length,0,'guarded context must not fetch the motion manifest or any clip');
      await capture('static-v1');
    });
  }
  if(poster){
    let failPoster=true;
    await runCase(browser,engine,base,'poster-failure-and-retry',viewport,
      {waitForPoster:false,setup:async page=>{
        await page.route('**'+posterPath+'*',route=>failPoster?route.abort():route.continue());
      }},async({page,record,actor,capture})=>{
        await actor.click();
        await page.waitForFunction(selector=>!document.querySelector(selector)?.dataset.lariaTrollLoading,actorSelector);
        const original=await assertStatic(page);
        assert.equal(original.poster,null,'failed neutral cutout must keep the immutable original');
        assert.equal(record.waveRequests,0,'a clean wave must not play with an unavailable matching poster');
        await capture('failed-poster-keeps-original');
        failPoster=false;
        await actor.click();await waitWave(page);
        await capture('poster-retry-wave');
        await assertRest(page);
        const restored=await readActor(page);
        assert.equal(restored.poster,'storesoster','wave completion must keep the matching clean neutral image');
        await capture('poster-after-wave');
        record.posterRecovery={failedSource:original.src,restoredPoster:restored.poster};
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
          await assertRest(page);
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
        for(const [name,viewport] of [['ipad-portrait',{width:1024,height:1366}],['ipad-landscape',{width:1366,height:1024}]]){
          if(mode!=='flows')await runCase(browser,engine,base,name,viewport,{video:true},normal);
          if(mode!=='wave'){
            await runCase(browser,engine,base,'norsk-'+name,viewport,
              {video:true,observeCalls:true,progressCheck:checkReadingProgress},norskFlow);
            await runCase(browser,engine,base,'gangemagi-'+name,viewport,{video:true,observeCalls:true},gangemagiFlow);
          }
        }
        if(mode!=='flows')await guards(browser,engine,base);
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
