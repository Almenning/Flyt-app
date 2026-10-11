'use strict';
/* Regression: the child's ONE chosen fox reacts and moves between real
   journey hotspots. No click should modify saved progress accidentally. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const dir=process.env.LARIA_LIVE_FOX_QA||'/tmp/laria-live-fox';
fs.mkdirSync(dir,{recursive:true});
function seed(avatar){
  return {
    version:7,progressSchemaVersion:3,
    profile:{grade:2,onboarded:true,name:'ReveQA',avatar,setupVersion:2},
    mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},
    preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,
    journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null,
    collectibles:{version:1,ownedIds:['magisk-samlebok','oppdagerhatt'],equipped:{head:'oppdagerhatt',neck:null,back:null,cape:null}}
  };
}
async function run(engine,name,viewport,avatar){
  const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
  try{
    const context=await browser.newContext({
      viewport,isMobile:viewport.width<600,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'
    });
    await context.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed(avatar));
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
    await page.route('https://api.worldbank.org/**',r=>r.abort());
    const url=(process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria')+'&live-fox='+name;
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.locator('#home-screen.active .bc12-fox').waitFor({timeout:17000});
    await page.waitForFunction(()=>!!window.LARIA_FOX_PRESENCE?.react,{timeout:15000});
    const home=page.locator('#home-screen.active .bc12-fox');
    await page.waitForFunction(()=>document.querySelector('.bc12-fox .laria-fox-pose'),null,{timeout:12000});
    assert.equal(await page.evaluate(()=>window.LARIA_FOX_PRESENCE.activeAvatar()),avatar,name+' saved avatar changed');
    assert.equal(await home.locator('svg.laria-fox-wardrobe-art .laria-fox-pose').count(),1,name+' missing single dressed fox rig');
    assert.equal(await home.locator('.laria-fox-wardrobe-art [data-gear="oppdagerhatt"]').count(),1,name+' the chosen fox lost its equipped hat');
    const source=await home.locator('svg.laria-fox-wardrobe-art image').getAttribute('href');
    assert.match(source,avatar==='girl'?/girl-braids-blue-dress-v1\.webp$/:/boy-adventurer-green-vest-v1\.webp$/,
      name+' must render the actual chosen full-body fox, never a portrait photo');
    const rigType=await home.locator('svg.laria-fox-wardrobe-art').getAttribute('data-fox-art');
    assert.equal(rigType,avatar+'-fullbody-v1',name+' outfit rig does not match selected full-body fox');
    const geometry=await home.evaluate(el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height}});
    assert(geometry.height>=geometry.width*1.3,name+' character was squashed into a portrait circle '+JSON.stringify(geometry));
    assert.equal(await home.evaluate(el=>getComputedStyle(el).borderRadius),'0px',
      name+' full-body companion should never sit in the old round portrait frame');
    assert.equal(await page.evaluate(()=>window.LARIA_FOX_PRESENCE.react('greet')),true);
    assert.equal(await home.getAttribute('data-laria-fox-mood'),'greet');
    await page.screenshot({path:path.join(dir,name+'-home.png'),animations:'disabled'});

    await page.locator('.bc14-subject[data-camp="subject-norwegian"]').click();
    const map=page.locator('#subject-screen.active .locked-journey-map');
    await map.waitFor({timeout:16000});
    const fox=map.locator('.locked-journey-traveler');
    assert.equal(await fox.count(),1,name+' must have exactly one movable personal fox');
    await fox.locator('svg.laria-fox-wardrobe-art .laria-fox-pose').waitFor({timeout:12000});
    assert.equal(await fox.getAttribute('data-avatar'),avatar,name+' route changed fox identity');
    assert.equal(await fox.locator('.laria-fox-wardrobe-art [data-gear="oppdagerhatt"]').count(),1,name+' journey lost equipped clothes');
    const initial=await fox.evaluate(el=>({x:el.style.getPropertyValue('--fox-x'),y:el.style.getPropertyValue('--fox-y')}));
    const before=await page.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('laerlittmer-v2')).journey));
    await map.locator('.locked-journey-hotspot').nth(3).click();
    assert.equal(await fox.getAttribute('data-laria-fox-stop'),'3',name+' fox did not travel to clicked landmark');
    assert.equal(await fox.getAttribute('data-laria-fox-mood'),'walking',name+' fox walking response missing');
    const moved=await fox.evaluate(el=>({x:el.style.getPropertyValue('--fox-x'),y:el.style.getPropertyValue('--fox-y')}));
    assert.notDeepEqual(moved,initial,name+' traveler stayed on previous stop');
    await page.locator('.locked-sheet-close').click();
    const after=await page.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('laerlittmer-v2')).journey));
    assert.equal(after,before,name+' fox movement must not fake mastery');
    assert.equal(await fox.evaluate(el=>getComputedStyle(el).pointerEvents),'none',name+' fox steals map taps');
    await page.screenshot({path:path.join(dir,name+'-journey.png'),animations:'disabled'});
    const current=map.locator('.locked-journey-hotspot.state-current').first();
    await current.click();
    const mission=page.locator('.locked-journey-overlay:not([hidden]) button[data-locked-node]:not([disabled])').first();
    await mission.waitFor({timeout:10000});
    await mission.click();
    const task=page.locator('#session-screen.active .task-fox-companion');
    await task.waitFor({timeout:13000});
    await task.locator('svg.laria-fox-wardrobe-art .laria-fox-pose').waitFor({timeout:12000});
    assert.equal(await task.getAttribute('data-avatar'),avatar,name+' task changed fox identity');
    assert.equal(await task.locator('.laria-fox-wardrobe-art [data-gear="oppdagerhatt"]').count(),1,name+' task lost equipped clothes');
    for(const mood of ['curious','support','celebrate']){
      assert.equal(await page.evaluate(m=>window.LARIA_FOX_PRESENCE.react(m),mood),true);
      assert.equal(await task.getAttribute('data-laria-fox-mood'),mood,name+' task mood '+mood+' missing');
    }
    await page.screenshot({path:path.join(dir,name+'-task.png'),animations:'disabled'});
    assert.deepEqual(errors,[],name+' browser errors '+JSON.stringify(errors));
    await context.close();
    console.log('[live fox]',name,'same identity, equipment rig, move, feedback, progress and tap safety OK');
  }finally{await browser.close()}
}
(async()=>{
 for(const [engine,name,viewport,avatar] of [
  [chromium,'chromium-girl-iphone',{width:390,height:844},'girl'],
  [webkit,'webkit-girl-iphone',{width:390,height:844},'girl'],
  [webkit,'webkit-boy-ipad',{width:820,height:1180},'boy']
 ])await run(engine,name,viewport,avatar);
})().catch(e=>{console.error(e);process.exitCode=1});
