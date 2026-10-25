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
      viewport,hasTouch:true,isMobile:viewport.width<=480,reducedMotion:'reduce',serviceWorkers:'block'
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
    const overflow=await page.evaluate(()=>({
      scroll:document.documentElement.scrollWidth,width:document.documentElement.clientWidth
    }));
    assert.ok(overflow.scroll<=overflow.width+2,name+' has horizontal overflow');

    await page.locator('.eg-grade').click();
    await page.locator('#eggenipa-world .eg-grade-dialog[open]').waitFor();
    assert.equal(await page.locator('#eggenipa-world [data-eg-grade]').count(),10,name+' grade choices');
    await page.locator('#eggenipa-world [data-eg-grade="3"]').click();
    assert.deepEqual(await page.evaluate(()=>{
      const b=window.LARIA_TALLVIKA_BRIDGE;
      return [b.currentGrade(),b.journeyViewGrade('norwegian')];
    }),[2,3],name+' grade choice must not change profile grade');
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
    await page.locator('#eggenipa-map-return').waitFor({state:'visible',timeout:15000});
    assert.equal(await page.locator('#subject-screen').evaluate(el=>el.classList.contains('eggenipa-active')),false,
      name+' old map must be visible when explicitly selected');
    await shot(page,name+'-original-bokskogen');
    await page.locator('#eggenipa-map-return').click();
    await page.locator('#eggenipa-world').waitFor({state:'visible',timeout:15000});

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
