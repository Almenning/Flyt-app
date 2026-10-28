'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const output=process.env.LARIA_TALLVIKA_SCREENSHOTS;
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Tallvika QA',avatar:'girl',setupVersion:2},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
async function screenshot(page,name){if(output){fs.mkdirSync(output,{recursive:true});await page.screenshot({path:path.join(output,name+'.png'),fullPage:true,animations:'disabled'});}}
async function enter(page){
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
  await page.locator('.bc14-subject[data-camp="subject-math"]').click();
  await page.locator('#subject-screen.active #tallvika-world').waitFor({state:'visible',timeout:18000});
}
async function assertScene(page,label){
  const scene=page.locator('#tallvika-world .tv-scene');
  assert.equal(await scene.count(),1,label+' renders one world scene');
  assert.equal(await page.locator('#tallvika-world .tv-dock, #tallvika-world .tv-mobile-actions, #tallvika-world .tv-portal-card').count(),0,label+' retains parallel navigation');
  const hotspots=await page.locator('#tallvika-world .tv-hotspot').evaluateAll(nodes=>nodes.map(node=>{
    const r=node.getBoundingClientRect();return {id:node.dataset.tv,w:r.width,h:r.height,aria:node.getAttribute('aria-label')};
  }));
  assert.deepEqual(hotspots.map(x=>x.id).sort(),['fraction','multiply','table'],label+' needs exactly the three painted destinations');
  assert.ok(hotspots.every(x=>x.w>=44&&x.h>=44&&x.aria?.startsWith('Åpne ')),label+' has inaccessible scene destination '+JSON.stringify(hotspots));
  const audit=await scene.evaluate(el=>{const r=el.getBoundingClientRect();return {w:r.width,h:r.height,scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,bg:getComputedStyle(el).backgroundImage};});
  assert.ok(audit.w>250&&audit.h>140,label+' has no substantial illustration');
  assert.ok(audit.scroll<=audit.client+2,label+' horizontal overflow');
  assert.match(audit.bg,/tallvika-figure-free-20261028\.webp/,label+' wrong derived scene background');
  assert.equal(await page.locator('#tallvika-world .tv-next').count(),0,label+' outside illustration mission card returned');
  assert.equal(await scene.locator('.tv-next-sign[data-tv="next"]').count(),1,label+' missing illustrated mission button');
  const actor=scene.locator('.tv-actor[data-troll-id]');
  assert.equal(await actor.count(),1,label+' missing selected original troll');
  assert.equal(await actor.locator('img').getAttribute('src'),'./assets/gangemagi-troll/'+(await actor.getAttribute('data-troll-id'))+'.webp',label+' wrong selected artwork');
  assert.equal(await actor.locator('.tv-actor-speech').count(),1,label+' troll has no speech');
  const sky=scene.locator('.tv-portrait-sky');
  const isPortrait=await page.evaluate(()=>matchMedia('(orientation: portrait) and (max-width: 1100px)').matches);
  assert.equal(await sky.isVisible(),isPortrait,label+' portrait mountain layer mismatch');
}
async function run(browserType,label,viewport){
  const browser=await browserType.launch({headless:true,args:browserType===chromium?['--no-sandbox']:[]});
  try{
    const context=await browser.newContext({viewport,isMobile:viewport.width<=480,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
    await context.addInitScript(value=>{if(!localStorage.getItem('laerlittmer-v2'))localStorage.setItem('laerlittmer-v2',JSON.stringify(value));},seed);
    const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.route('https://raw.githubusercontent.com/**',route=>route.abort());await page.route('https://api.worldbank.org/**',route=>route.abort());
    await enter(page);await assertScene(page,label);await screenshot(page,label);
    const bubble=page.locator('#tallvika-world .tv-actor-speech');
    const beforeSpeech=await bubble.innerText();
    await page.locator('#tallvika-world .tv-actor-touch').click();
    assert.notEqual(await bubble.innerText(),beforeSpeech,label+' troll did not answer a tap');
    // Class selection remains a view preference, not a mutation of the child profile.
    await page.locator('#tallvika-world [data-tv="grade"]').click();await page.locator('.tv-grade-dialog[open]').waitFor();await page.locator('[data-tv-grade="3"]').click();
    assert.deepEqual(await page.evaluate(()=>[window.LARIA_TALLVIKA_BRIDGE.currentGrade(),window.LARIA_TALLVIKA_BRIDGE.journeyViewGrade('math')]),[2,3],label+' grade picker changed profile grade');
    // Troll choice remains persisted for existing activity runtime without changing learning data.
    await page.locator('#tallvika-world [data-tv="choose"]').click();await page.locator('.tv-dialog[open]').waitFor();await page.locator('[data-tv-troll="lillebror"]').click();
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2')).profile.tallvikaTroll),'lillebror',label+' troll selection did not persist');
    assert.equal(await page.locator('#tallvika-world .tv-actor').getAttribute('data-troll-id'),'lillebror',label+' scene failed to display selected troll');
    assert.equal(await page.locator('#tallvika-world .tv-actor img').getAttribute('src'),'./assets/gangemagi-troll/lillebror.webp',label+' scene changed original character identity');
    // Each painted destination opens its existing activity and returns in one tap.
    await page.locator('.tv-hotspot[data-tv="multiply"]').click();await page.locator('#multiplication-lab-screen.active .gm-shell').waitFor({timeout:14000});
    assert.equal(await page.locator('#multiplication-lab-back').getAttribute('aria-label'),'Tilbake til Tallvika',label+' Gangemagi lost Tallvika return');
    await page.locator('#multiplication-lab-back').click();await page.locator('#tallvika-world').waitFor({state:'visible',timeout:14000});
    await page.locator('.tv-hotspot[data-tv="fraction"]').click();await page.locator('#fraction-lab-screen.active .fr6-workshop').waitFor({timeout:14000});
    assert.equal(await page.locator('#fraction-lab-back').getAttribute('aria-label'),'Tilbake til Tallvika',label+' Brøklab lost Tallvika return');
    await page.locator('#fraction-lab-back').click();await page.locator('#tallvika-world').waitFor({state:'visible',timeout:14000});
    await page.locator('.tv-hotspot[data-tv="table"]').click();await page.locator('#multiplication-lab-screen.active .mp-explore-screen').waitFor({timeout:14000});
    assert.equal(await page.locator('.mp-times-grid button.mp-grid-cell').count(),100,label+' Gangetabellen lost its 10x10 explorer');
    assert.equal(await page.locator('#multiplication-lab-back').getAttribute('aria-label'),'Tilbake til Tallvika',label+' Gangetabellen lost Tallvika return');
    await page.locator('#multiplication-lab-back').click();await page.locator('#tallvika-world').waitFor({state:'visible',timeout:14000});
    await assertScene(page,label+' return');
    assert.deepEqual(errors,[],label+' console errors: '+errors.join('; '));
    await context.close();
  } finally {await browser.close();}
}
(async()=>{
  const devices=[['ipad-landscape',{width:1194,height:834}],['ipad-portrait',{width:834,height:1112}],['iphone-portrait',{width:390,height:844}],['iphone-landscape',{width:844,height:390}]];
  for(const [name,viewport] of devices){await run(chromium,'chromium-'+name,viewport);await run(webkit,'webkit-'+name,viewport);}
})().catch(error=>{console.error(error);process.exitCode=1;});
