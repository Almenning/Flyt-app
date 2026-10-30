'use strict';
/*
 * Evidence gate for the NEW two-post Tallvika sign navigation.
 * Do not label legacy painted-house hotspots as approved screenshots.
 * The original image is read-only; this test never changes saved progress.
 */
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');

const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const folder=process.env.LARIA_TALLVIKA_PREMIUM_SCREENSHOTS||'/tmp/laria-tallvika-premium';
const revision=process.env.LARIA_GIT_SHA||'unspecified-revision';
const art=path.join(__dirname,'..','laer-litt-mer','assets','tallvika','laria-tallvika-premium-locked-20261027.png');
const originalSha='632c9a2a1476e220e493b6e802e044bdfb025e9afc02e7f62fcc39c81cc4a3a5';
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Tallvika QA',avatar:'girl',setupVersion:2},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
const devices=[
  ['pc-1920x1080',{width:1920,height:1080}],
  ['mac-1440x900',{width:1440,height:900}],
  ['ipad-landscape-1366x1024',{width:1366,height:1024}],
  ['ipad-portrait-1024x1366',{width:1024,height:1366}],
  ['iphone-portrait-393x852',{width:393,height:852}],
  ['iphone-landscape-852x393',{width:852,height:393}],
  ['iphone-small-portrait-375x667',{width:375,height:667}]
];

async function collect(page){
  return page.evaluate(()=>{
    const scene=document.querySelector('#tallvika-world .tv-scene');
    if(!scene)return {error:'Tallvika scene missing'};
    const sr=scene.getBoundingClientRect();
    const summary=(el)=>{
      if(!el)return null;
      const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
      return {tag:el.tagName,className:el.className,
        x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,
        background:cs.backgroundImage,backgroundColor:cs.backgroundColor,display:cs.display,
        ariaLabel:el.getAttribute('aria-label')};
    };
    const keys=['multiply','fraction','table'];
    const actions=keys.map(key=>{
      const matches=[...document.querySelectorAll('#tallvika-world button[data-tv="'+key+'"]')];
      return {key,count:matches.length,...(summary(matches[0])||{})};
    });
    const next=summary(document.querySelector('#tallvika-world [data-tv="next"]'));
    const selected=[...document.querySelectorAll('#tallvika-world .tv-actor[data-troll-id]')].map(summary);
    const signControls=actions.map(x=>document.querySelector('#tallvika-world button[data-tv="'+x.key+'"]'));
    const ancestors=signControls[0]?[signControls[0].parentElement,signControls[0].parentElement?.parentElement]:[];
    const woodStructure=ancestors.map(el=>{
      if(!el)return null;
      const before=getComputedStyle(el,'::before'),after=getComputedStyle(el,'::after');
      return {className:el.className,
        before:before.content,after:after.content,
        beforeWidth:before.width,afterWidth:after.width};
    });
    const sceneCss=getComputedStyle(scene);
    return {viewport:{width:innerWidth,height:innerHeight},
      scrollWidth:document.documentElement.scrollWidth,
      clientWidth:document.documentElement.clientWidth,
      scene:summary(scene),sceneBackground:sceneCss.backgroundImage,
      actions,next,selected,woodStructure};
  });
}

function assertPremium(a,label){
  assert.ok(!a.error,label+' '+a.error);
  assert.equal(a.actions.length,3,label+' missing three activity routes');
  for(const x of a.actions){
    assert.equal(x.count,1,label+' duplicate/missing '+x.key);
    assert.ok(x.width>=44&&x.height>=44,label+' inaccessible '+x.key);
    assert.ok(x.x>=a.scene.x-2&&x.right<=a.scene.right+2,label+' '+x.key+' outside scene');
    assert.ok(x.x<=a.scene.x+a.scene.width*.46,label+' '+x.key+' not on left signpost');
    assert.ok(x.y>=a.scene.y-2&&x.bottom<=a.scene.bottom+2,label+' '+x.key+' outside scene');
    assert.ok(x.x>=-2&&x.right<=a.viewport.width+2,label+' '+x.key+' outside device width');
    assert.ok(x.y>=-2&&x.bottom<=a.viewport.height+4,label+' '+x.key+' below the visible device');
  }
  const [multiply,fraction,table]=a.actions;
  assert.ok(multiply.y+multiply.height<=fraction.y+5,label+' Gangemagi/Brøklab overlap');
  assert.ok(fraction.y+fraction.height<=table.y+5,label+' Brøklab/Gangetabellen overlap');
  const minX=Math.min(...a.actions.map(x=>x.x));
  const maxX=Math.max(...a.actions.map(x=>x.x));
  assert.ok(maxX-minX<=a.scene.width*.11,label+' signs are not a single left-side stack');
  assert.ok(a.actions.some(x=>x.background!=='none'||x.backgroundColor!=='rgba(0, 0, 0, 0)')||
    a.woodStructure.some(x=>x&&(x.before!=='none'||x.after!=='none')),
    label+' no visible wooden navigation; likely old invisible house hotspots');
  assert.ok(a.next&&a.next.width>=44&&a.next.height>=44,label+' missing Next adventure');
  assert.ok(a.next.x>=0&&a.next.right<=a.viewport.width+2&&a.next.bottom<=a.viewport.height+4,
    label+' Next adventure is clipped');
  assert.equal(a.selected.length,1,label+' must show only one selected living troll');
  assert.ok(a.scrollWidth<=a.clientWidth+2,label+' horizontal scrolling');
}

async function run(browserType,engine,device,viewport,sha){
  const name=engine+'-'+device;
  const browser=await browserType.launch({headless:true,args:browserType===chromium?['--no-sandbox']:[]});
  try{
    const context=await browser.newContext({
      viewport,isMobile:viewport.width<=480,hasTouch:true,reducedMotion:'reduce',
      serviceWorkers:'block',deviceScaleFactor:1
    });
    await context.addInitScript(value=>{
      if(!localStorage.getItem('laerlittmer-v2'))localStorage.setItem('laerlittmer-v2',JSON.stringify(value));
    },seed);
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('https://raw.githubusercontent.com/**',route=>route.abort());
    await page.route('https://api.worldbank.org/**',route=>route.abort());
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
    await page.locator('.bc14-subject[data-camp="subject-math"]').click();
    const scene=page.locator('#subject-screen.active #tallvika-world .tv-scene');
    await scene.waitFor({state:'visible',timeout:18000});
    await page.evaluate(()=>document.fonts?.ready);
    const a=await collect(page);
    const meta={name,revision,artSha256:sha,approved:false,...a};
    fs.writeFileSync(path.join(folder,name+'-audit.json'),JSON.stringify(meta,null,2));
    try{assertPremium(a,name);}
    catch(e){
      // Failure screenshots have a REJECTED prefix; never mix them with approved evidence.
      await page.screenshot({path:path.join(folder,name+'-REJECTED-debug.png'),
        fullPage:false,animations:'disabled'});
      throw e;
    }
    assert.deepEqual(errors,[],name+' script errors: '+errors.join('; '));
    // Capture the real visible viewport as well as the unmodified world scene.
    await page.screenshot({path:path.join(folder,name+'-viewport.png'),
      fullPage:false,animations:'disabled'});
    await scene.screenshot({path:path.join(folder,name+'-scene.png'),animations:'disabled'});
    meta.approved=true;meta.screenshotType='real rendered PR-head Playwright Chromium/WebKit';
    fs.writeFileSync(path.join(folder,name+'-audit.json'),JSON.stringify(meta,null,2));
    await context.close();
  }finally{await browser.close();}
}

(async()=>{
  const sha=crypto.createHash('sha256').update(fs.readFileSync(art)).digest('hex');
  assert.equal(sha,originalSha,'The locked 27 October Tallvika illustration must not change');
  fs.mkdirSync(folder,{recursive:true});
  fs.writeFileSync(path.join(folder,'README.json'),JSON.stringify({
    purpose:'Only after left-hand premium sign geometry passes may screenshot files lack REJECTED',
    commit:revision,lockedOriginalSha256:sha,source:url,createdAt:new Date().toISOString(),
    engines:['chromium','webkit'],devices
  },null,2));
  let failures=0;
  for(const [engine,browserType] of [['chromium',chromium],['webkit',webkit]]){
    for(const [name,viewport] of devices){
      try{await run(browserType,engine,name,viewport,sha);console.log('PASS '+engine+' '+name);}
      catch(e){failures++;console.error('FAIL '+engine+' '+name+': '+e.message);}
    }
  }
  assert.equal(failures,0,failures+' premium-device assertions failed; draft PR is not approved');
})().catch(e=>{console.error(e);process.exitCode=1;});
