'use strict';
/* Real browser regression for the selected fox in existing Explore activities. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const out=process.env.LARIA_FOX_FREEPLAY_SCREENSHOTS||'/tmp/laria-fox-freeplay';
fs.mkdirSync(out,{recursive:true});
function seed(which){return {version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'MinRev',avatar:which,setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},
 preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};}
async function match(page,selector,which,label,world=false){
 const img=page.locator(selector).first();await img.waitFor({timeout:17000});
 await page.waitForFunction(([s,c,inWorld])=>{
  const node=document.querySelector(s);
  const selected=inWorld?window.LARIA_FOX.worldSource(c):window.LARIA_FOX.source(c);
  return !!(node&&node.complete&&node.naturalWidth>0&&node.getAttribute('src')===selected);
 },[selector,which,world],{timeout:17000});
 assert.equal(await img.evaluate(el=>getComputedStyle(el).visibility),'visible',label+' hidden image');
}
async function launch(page,url,which){
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.locator('#home-screen.active .bc14-subject:visible').first().waitFor({timeout:17000});
 assert.equal(await page.evaluate(()=>state.profile.avatar),which);
}
async function run(engine,name,viewport,which){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport,isMobile:viewport.width<600,hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'});
  await context.addInitScript(s=>{if(!localStorage.getItem('laerlittmer-v2'))localStorage.setItem('laerlittmer-v2',JSON.stringify(s));},seed(which));
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  const url=(process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria')+'&fox-freeplay='+name;
  await launch(page,url,which);
  await page.waitForFunction(()=>typeof openFractionLab==='function');
  await page.evaluate(()=>openFractionLab());
  await match(page,'.fr2-guide .fr2-fox',which,name+' Brøklab',true);
  await page.screenshot({path:out+'/'+name+'-broklab.png',fullPage:true});
  await launch(page,url+'&part=mult',which);
  await page.waitForFunction(()=>typeof window.openMultiplicationLab==='function');
  await page.evaluate(()=>window.openMultiplicationLab());
  // Gangemagi mission mode is now deliberately troll-led. The three locked
  // forest-troll assets replace the personal fox only inside this activity.
  // Classic multiplication and the other Explore activities below must still
  // retain the child's selected fox identity.
  const trolls=page.locator('#multiplication-lab-screen.active [data-gm-action="troll"]');
  await trolls.first().waitFor({state:'visible'});
  assert.equal(await trolls.count(),3,name+' Gangemagi must show exactly the three locked forest trolls');
  const trollSources=await trolls.locator('.gm-troll-figure img').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('src')));
  assert.deepEqual(trollSources,[
    './assets/gangemagi-troll/storesoster.webp',
    './assets/gangemagi-troll/lillesoster.webp',
    './assets/gangemagi-troll/lillebror.webp'
  ],name+' Gangemagi must use the locked troll files, not regenerated variants');
  assert.equal(await page.locator('#multiplication-lab-screen.active .gm-fox-art').count(),0,
    name+' Gangemagi mission must not retain the obsolete personal-fox guide beside the trolls');
  await page.screenshot({path:out+'/'+name+'-gangemagi.png',fullPage:true});
  await page.locator('#multiplication-lab-screen.active [data-gm-action="classic"]').click();
  await page.locator('#multiplication-lab-screen.active .mp-home-screen').waitFor();
  await match(page,'.mp-avatar img',which,name+' classic gangetabell header');
  await match(page,'.mp-mascot img',which,name+' gangetabell guide');
  await match(page,'.mp-art-practice img',which,name+' gangetabell card');
  await page.locator('.mp-menu-explore').click();
  await page.locator('.mp-explore-tab[data-mode="pick"]').click();
  await match(page,'.mp-pick-easy-intro img',which,name+' Plukk og tell');
  await page.screenshot({path:out+'/'+name+'-plukk.png',fullPage:true});
  await launch(page,url+'&part=words',which);
  await page.waitForFunction(()=>typeof window.openWordHunt==='function');
  await page.evaluate(()=>window.openWordHunt());
  await page.locator('.word-hunt-theme-picker:not([hidden])').waitFor();
  await match(page,'.wh-theme-fox',which,name+' Ordjakt entrance');
  await page.locator('.word-hunt-theme-picker [data-word-theme="mixed"]').click();
  await page.locator('.word-hunt-cell:visible').first().waitFor();
  await match(page,'.word-hunt-fox',which,name+' Ordjakt game');
  await match(page,'.word-hunt-companion-fox',which,name+' Ordjakt personal in-world fox',true);
  assert.equal(await page.locator('.word-hunt-companion').getAttribute('data-avatar'),which,
    name+' companion identity does not match the saved child profile');
  assert.equal(await page.locator('.word-hunt-companion-fox').count(),1,
    name+' must show one personal fox, not generic duplicates');
  assert.equal(await page.locator('.word-hunt-companion-hint').count(),1);
  await page.locator('.word-hunt-companion-hint').click();
  assert.equal(await page.locator('.word-hunt-cell.is-hint-start').count(),1,
    name+' child must get first hint without awarding a word');
  assert.equal(await page.locator('.word-hunt-word.found').count(),0);
  await page.evaluate(()=>{document.getElementById('word-hunt-overlay').scrollTop=0});
  await page.screenshot({path:out+'/'+name+'-ordjakt.png',fullPage:true});
  await page.locator('.word-hunt-companion').scrollIntoViewIfNeeded();
  await page.screenshot({path:out+'/'+name+'-ordjakt-personal-fox.png',fullPage:true});
  await launch(page,url+'&part=globe',which);
  await page.waitForFunction(()=>typeof openGlobe==='function');
  await page.evaluate(()=>openGlobe());
  await match(page,'#world-screen.active .premium-globe-fox',which,name+' globe');
  // The separate transparent, locked atlas guide is scenic art, not the child's
  // profile; the visible profile portrait in the globe header must be personal.
  assert.equal(await page.locator('#world-screen.active .premium-globe-guide').getAttribute('src'),
    './lia-fox-explorer-home.webp',name+' locked physical globe guide must stay intact');
  assert.equal(await page.locator('#world-screen.active .premium-globe-guide').getAttribute('data-profile-avatar'),
    which,name+' globe scenery lost the saved profile context');
  await page.screenshot({path:out+'/'+name+'-globe.png',fullPage:true});
  assert.deepEqual(errors,[],name+' runtime exceptions');
  console.log('Selected fox freeplay',name,which,'all relevant existing activities');
  await context.close();
 }finally{await browser.close()}
}
(async()=>{
 await run(chromium,'chromium-iphone-girl',{width:390,height:844},'girl');
 await run(webkit,'webkit-ipad-boy',{width:820,height:1180},'boy');
})().catch(e=>{console.error(e);process.exitCode=1});
