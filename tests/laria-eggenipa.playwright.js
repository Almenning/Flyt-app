'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const out=process.env.LARIA_EGGENIPA_SCREENSHOTS;
const missingArtwork=[];
const profile={
  version:7,progressSchemaVersion:3,
  profile:{grade:2,onboarded:true,name:'Eggenipa QA',avatar:'girl',setupVersion:2},
  mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
  masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
  recentCountryWin:null,lastMilestone:null,lastActivity:null,
  journey:{nodes:{},gradeWins:{},viewGrades:{},chapterProgress:{}},
  answerLog:[],sessionLog:[],activeSession:null
};
async function shot(page,name){
  if(!out)return;
  fs.mkdirSync(out,{recursive:true});
  await page.screenshot({path:path.join(out,name+'.png'),fullPage:true,animations:'disabled'});
}
async function returnFromBokskogen(page,name){
  await page.waitForFunction(()=>
    document.querySelector('#subject-screen.active .locked-journey-back')
      ?.getAttribute('aria-label')==='Tilbake til Eggenipa',null,{timeout:12000});
  assert.equal(await page.locator('#eggenipa-map-return').count(),0,
    name+' redundant fixed return overlay must not obscure the painted map');
  const floating=page.locator('#subject-screen.active .locked-journey-floating-back');
  const back=page.locator('#subject-screen.active .locked-journey-back');
  // A child taps this painted control. Synthetic mouse clicks previously
  // missed an intermittent iPad touch-return failure in full Basecamp QA.
  if(await floating.isVisible())await floating.tap();
  else await back.tap();
  await page.locator('#eggenipa-world').waitFor({state:'visible',timeout:15000});
  assert.equal(await page.locator('#subject-screen.active').getAttribute('data-subject'),'norwegian',
    name+' back tap must remain on Norsk, not jump to Home');
  assert.equal(await page.evaluate(()=>window.LARIA_EGGENIPA.isMapOpen()),false,
    name+' back tap left Bokskogen map open');
}
async function enter(page){
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
  const subject=page.locator('.bc14-subject[data-camp="subject-norwegian"]');
  await subject.waitFor({state:'visible',timeout:25000});
  await subject.click();
  await page.locator('#eggenipa-world').waitFor({state:'visible',timeout:18000});
}
async function run(browserType,engine,name,viewport){
  const browser=await browserType.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
  try{
    const context=await browser.newContext({
      viewport,hasTouch:true,isMobile:name.includes('iphone'),reducedMotion:'reduce',serviceWorkers:'block'
    });
    await context.addInitScript(value=>{
      if(!localStorage.getItem('laerlittmer-v2'))
        localStorage.setItem('laerlittmer-v2',JSON.stringify(value));
    },profile);
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
    await page.route('https://api.worldbank.org/**',r=>r.abort());
    await enter(page);
    // All three primary activities are visible content, not deferred
    // below-the-fold decorations. Full-page captures can otherwise show a
    // blank third card despite a successful navigation contract.
    const decoded=await page.locator('#eggenipa-world .eg-portal-art img').evaluateAll(async images=>{
      await Promise.all(images.map(image=>image.decode()));
      return images.map(image=>[image.complete,image.naturalWidth,image.naturalHeight]);
    });
    assert.ok(decoded.length===3&&decoded.every(([complete,w,h])=>complete&&w>0&&h>0),
      name+' all activity cards must have decoded art '+JSON.stringify(decoded));
    const pre=await page.evaluate(()=>structuredClone(JSON.parse(localStorage.getItem('laerlittmer-v2'))?.journey?.nodes||{}));
    assert.equal(await page.locator('#eggenipa-world .eg-portal').count(),3,name+' must show three illustrated places');
    assert.equal(await page.locator('#subject-screen').evaluate(el=>el.classList.contains('locked-journey-active')),false,
      name+' must not inherit hidden legacy journey view');
    await shot(page,name+'-firstfold');
    const image=await page.locator('#eggenipa-world .eg-master').evaluate(img=>({
      naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,
      visibleWidth:img.getBoundingClientRect().width
    }));
    // Continue interaction QA while art handoff is pending, but fail release at the end.
    if(image.naturalWidth!==1672||image.naturalHeight!==941)missingArtwork.push(name);
    assert.ok(image.visibleWidth>300,name+' landscape too small');
    assert.equal(await page.locator('.eg-world-label').isVisible(),false,
      name+' must not cover the locked landscape with illegible heading text');
    if(viewport.width<=480){
      const rows=await page.locator('#eggenipa-world .eg-portal').evaluateAll(els=>
        els.map(el=>Math.round(el.getBoundingClientRect().height)));
      assert.ok(Math.max(...rows)-Math.min(...rows)<=2,
        name+' must not stretch Bokskogen card beyond other activities: '+rows.join(','));
    }
    const overflow=await page.evaluate(()=>({
      scroll:document.documentElement.scrollWidth,width:document.documentElement.clientWidth
    }));
    assert.ok(overflow.scroll<=overflow.width+2,name+' has horizontal overflow');

    // Open Bokskogen immediately after entering Norsk, before changing
    // grade or waiting for the legacy map art. This used to leave an
    // existing but CSS-hidden map when renderWaiting() short-circuited.
    await page.locator('#eggenipa-world .eg-portal[data-eg="map"]').click();
    await page.locator('#subject-screen.active .locked-journey-map[data-journey-subject="norwegian"]')
      .waitFor({state:'visible',timeout:18000});
    // An immediate real touch on the painted arrow must work even while the
    // map's first paint, sticky back controls and scroll anchors are settling.
    await page.waitForFunction(()=>
      document.querySelector('#subject-screen.active .locked-journey-back')
        ?.getAttribute('aria-label')==='Tilbake til Eggenipa',null,{timeout:12000});
    await page.locator('#subject-screen.active .locked-journey-back').tap();
    await page.locator('#eggenipa-world:visible').waitFor({timeout:12000});
    assert.equal(await page.evaluate(()=>window.LARIA_EGGENIPA.isMapOpen()),false,
      name+' immediate touch return kept the map open');
    await page.locator('#eggenipa-world .eg-portal[data-eg="map"]').tap();
    await page.locator('#subject-screen.active .locked-journey-map[data-journey-subject="norwegian"]')
      .waitFor({state:'visible',timeout:18000});
    // Bokskogen deliberately centers the child's current illustrated stop
    // when that stop is below the fold (notably on landscape phones). Testing
    // for scrollY===0 contradicted the approved renderer's existing behavior.
    // Instead prove the map is anchored correctly AND the current task is
    // visible, so a stale Eggenipa scroll cannot masquerade as a valid entry.
    await page.waitForFunction(()=>{
      const marker=document.querySelector('#subject-screen.active .locked-journey-hotspot.state-current');
      if(!marker)return false;
      const box=marker.getBoundingClientRect();
      return box.top>=-1&&box.bottom<=innerHeight+1;
    },null,{timeout:10000});
    const mapOrigin=await page.locator('#subject-screen').evaluate(element=>{
      const marker=element.querySelector('.locked-journey-hotspot.state-current');
      const rect=marker?.getBoundingClientRect();
      return {top:element.getBoundingClientRect().top,scrollY:window.scrollY,
        currentStop:rect?{top:rect.top,bottom:rect.bottom}:null,viewport:innerHeight};
    });
    assert.ok(Math.abs(mapOrigin.top+mapOrigin.scrollY)<=2,
      name+' map is not anchored at the document origin: '+JSON.stringify(mapOrigin));
    assert.ok(mapOrigin.currentStop&&mapOrigin.currentStop.top>=-1&&
      mapOrigin.currentStop.bottom<=mapOrigin.viewport+1,
      name+' current illustrated mission is not visible: '+JSON.stringify(mapOrigin));
    // The old fixed return chip obscured the native painted settings cog.
    // Open the REAL map settings button, not a synthetic DOM click.
    await page.locator('#subject-screen.active .locked-journey-options').click();
    await page.locator('#subject-screen.active .locked-journey-grade-grid button').first()
      .waitFor({state:'visible',timeout:8000});
    await page.locator('#subject-screen.active .locked-sheet-close').click();
    await shot(page,name+'-bokskogen-settings-reachable');
    await returnFromBokskogen(page,name);

    await page.locator('.eg-grade').click();
    await page.locator('#eggenipa-world .eg-grade-dialog[open]').waitFor();
    assert.equal(await page.locator('#eggenipa-world [data-eg-grade]').count(),10,name+' grade choices');
    await page.locator('#eggenipa-world [data-eg-grade="3"]').click();
    assert.deepEqual(await page.evaluate(()=>{
      const b=window.LARIA_TALLVIKA_BRIDGE;
      return [b.currentGrade(),b.journeyViewGrade('norwegian')];
    }),[2,3],name+' grade choice must not change profile grade');
    // Higher grades retain the original classic journey, whose existing
    // subject-back control must still return to this Eggenipa subject page.
    await page.locator('#eggenipa-world .eg-portal[data-eg="map"]').click();
    const classicBack=page.locator('#subject-screen.active #subject-back');
    await classicBack.waitFor({state:'visible',timeout:12000});
    assert.equal(await classicBack.getAttribute('aria-label'),'Tilbake til Eggenipa',
      name+' classic grade-3 back must return to Norwegian landing');
    await classicBack.click();
    await page.locator('#eggenipa-world').waitFor({state:'visible',timeout:12000});
    await page.locator('.eg-grade').click();
    await page.locator('#eggenipa-world [data-eg-grade="2"]').click();

    await page.locator('.eg-portal[data-eg="words"]').click();
    await page.locator('#word-hunt-overlay:not([hidden])').waitFor({state:'visible',timeout:15000});
    await page.locator('#word-hunt-overlay .wh-theme-close').click();
    await page.locator('#eggenipa-world').waitFor({state:'visible',timeout:12000});

    await page.locator('.eg-portal[data-eg="find"]').click();
    await page.locator('#find-the-words-overlay:not([hidden])').waitFor({state:'visible',timeout:15000});
    await page.locator('#find-the-words-overlay .fw-back').click();
    await page.locator('#eggenipa-world').waitFor({state:'visible',timeout:12000});

    await page.locator('.eg-portal[data-eg="map"]').click();
    await page.locator('#subject-screen.active .locked-journey-back')
      .waitFor({state:'visible',timeout:15000});
    assert.equal(await page.locator('#subject-screen').evaluate(el=>el.classList.contains('eggenipa-active')),false,
      name+' old map must be visible when explicitly selected');
    await shot(page,name+'-original-bokskogen');
    await returnFromBokskogen(page,name);

    // The native iOS left-edge back gesture calls appBack(), not the painted
    // map button. Both must follow Bokskogen -> Eggenipa -> Home, without
    // changing learning records or forcing a new character selection.
    await page.locator('.eg-portal[data-eg="map"]').click();
    await page.locator('#subject-screen.active .locked-journey-map[data-journey-subject="norwegian"]')
      .waitFor({state:'visible',timeout:12000});
    assert.equal(await page.evaluate(()=>window.LARIA_EGGENIPA.isMapOpen()),true,
      name+' Bokskogen edge-back precondition missing');
    await page.evaluate(()=>appBack());
    await page.locator('#eggenipa-world:visible').waitFor({timeout:12000});
    assert.equal(await page.evaluate(()=>window.LARIA_EGGENIPA.isMapOpen()),false,
      name+' iOS edge-back must close Bokskogen before leaving Norsk');

    const post=await page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2'))?.journey?.nodes||{});
    assert.deepEqual(post,pre,name+' no activities or grade selection may reset learning progress');
    assert.deepEqual(errors,[],name+' runtime errors');
    await page.locator('#eggenipa-world .eg-home').click();
    await page.locator('#home-screen.active').waitFor({state:'visible',timeout:15000});
    await context.close();
  }finally{await browser.close();}
}
(async()=>{
  for(const [name,viewport] of [
    ['iphone-portrait',{width:390,height:844}],
    ['iphone-landscape',{width:844,height:390}],
    ['ipad-portrait',{width:834,height:1112}],
    ['ipad-landscape',{width:1194,height:834}]
  ]){
    for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
      await run(type,engine,engine+'-'+name,viewport);
    }
  }
  assert.deepEqual(missingArtwork,[],
    'Locked Eggenipa master image missing in these viewports. Upload the SHA-verified original before merge.');
})().catch(error=>{console.error(error);process.exitCode=1});
