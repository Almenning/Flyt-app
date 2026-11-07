'use strict';
/* Compatibility filename retained for CI history.
 * Premium beta regression: selected TrollActor must own visible companions
 * across existing free-play surfaces. No fox art may reappear.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const out=process.env.LARIA_FOX_FREEPLAY_SCREENSHOTS||'/tmp/laria-fox-freeplay';
fs.mkdirSync(out,{recursive:true});

function seed(troll){
 const legacyAvatar=troll==='lillebror'?'boy':'girl';
 return {version:7,progressSchemaVersion:3,
  profile:{grade:2,onboarded:true,name:'TrollQA',avatar:legacyAvatar,setupVersion:2,tallvikaTroll:troll},
  mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},
  preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,
  journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
}

async function expectTroll(page,selector,troll,label){
 const img=page.locator(selector).first();
 await img.waitFor({state:'visible',timeout:17000});
 await page.waitForFunction(([css,id])=>{
   const node=document.querySelector(css);
   const expected=window.LARIA_TROLL_ACTOR?.source?.(id);
   return !!(node&&expected&&node.complete&&node.naturalWidth>0&&node.getAttribute('src')===expected);
 },[selector,troll],{timeout:17000});
 const info=await img.evaluate(el=>{
   const r=el.getBoundingClientRect();
   return {src:el.getAttribute('src')||'',w:r.width,h:r.height,visibility:getComputedStyle(el).visibility};
 });
 assert.match(info.src,new RegExp('assets/gangemagi-troll/'+troll+'\\.webp$'),label+' wrong troll source');
 assert.ok(info.w>0&&info.h>0,label+' has no geometry');
 assert.equal(info.visibility,'visible',label+' hidden');
}

async function launch(page,url,troll){
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.locator('#home-screen.active .bc14-subject:visible').first().waitFor({timeout:17000});
 assert.equal(await page.evaluate(()=>state.profile.tallvikaTroll),troll);
 assert.equal(await page.evaluate(()=>window.LARIA_TROLL_ACTOR?.choice?.()),troll);
}

async function run(engine,name,viewport,troll){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({
    viewport,isMobile:viewport.width<600,hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'
  });
  await context.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed(troll));
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  const url=(process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria')+'&troll-freeplay='+name;

  await launch(page,url,troll);
  await page.waitForFunction(()=>typeof openFractionLab==='function');
  await page.evaluate(()=>openFractionLab());
  await expectTroll(page,'.fr2-guide .fr2-fox',troll,name+' Brøklab helper');
  assert.equal(await page.locator('#fraction-lab-screen.active img[src*="/assets/fox/"]:visible,#fraction-lab-screen.active img[src*="lia-fox"]:visible').count(),0,
    name+' Brøklab reintroduced fox art');
  await page.screenshot({path:out+'/'+name+'-broklab.png',fullPage:true,animations:'disabled'});

  await launch(page,url+'&part=mult',troll);
  await page.waitForFunction(()=>typeof window.openMultiplicationLab==='function');
  await page.evaluate(()=>window.openMultiplicationLab());
  const classic=page.locator('#multiplication-lab-screen.active [data-gm-action="classic"]');
  if(await classic.count())await classic.click();
  await page.locator('#multiplication-lab-screen.active .mp-home-screen').waitFor({timeout:17000});
  await expectTroll(page,'.mp-avatar img',troll,name+' gangetabell header');
  await expectTroll(page,'.mp-mascot img',troll,name+' gangetabell guide');
  assert.equal(await page.locator('#multiplication-lab-screen.active img[src*="/assets/fox/"]:visible,#multiplication-lab-screen.active img[src*="lia-fox"]:visible').count(),0,
    name+' multiplication surface reintroduced fox art');
  await page.screenshot({path:out+'/'+name+'-gangetabell.png',fullPage:true,animations:'disabled'});

  await launch(page,url+'&part=words',troll);
  await page.waitForFunction(()=>typeof window.openWordHunt==='function');
  await page.evaluate(()=>window.openWordHunt());
  await page.locator('.word-hunt-theme-picker:not([hidden])').waitFor();
  assert.equal(await page.locator('#word-hunt-overlay img[src*="/assets/fox/"],#word-hunt-overlay img[src*="lia-fox"]').count(),0,
    name+' Ordjakt reintroduced fox art');
  await page.locator('.word-hunt-theme-picker [data-word-theme="mixed"]').click();
  await page.locator('.word-hunt-cell:visible').first().waitFor();
  assert.equal(await page.locator('.word-hunt-companion-hint').count(),1);
  await page.locator('.word-hunt-companion-hint').click();
  assert.equal(await page.locator('.word-hunt-cell.is-hint-start').count(),1,
    name+' child must get a first hint without awarding a word');
  await page.screenshot({path:out+'/'+name+'-ordjakt.png',fullPage:true,animations:'disabled'});

  await launch(page,url+'&part=globe',troll);
  await page.waitForFunction(()=>typeof openGlobe==='function');
  await page.evaluate(()=>openGlobe());
  await expectTroll(page,'#world-screen.active .premium-globe-fox',troll,name+' globe header');
  await expectTroll(page,'#world-screen.active .premium-globe-guide',troll,name+' globe guide');
  assert.equal(await page.locator('#world-screen.active img[src*="/assets/fox/"]:visible,#world-screen.active img[src*="lia-fox"]:visible').count(),0,
    name+' Kloden reintroduced fox art');
  await page.screenshot({path:out+'/'+name+'-globe.png',fullPage:true,animations:'disabled'});

  assert.deepEqual(errors,[],name+' runtime exceptions');
  console.log('TrollActor freeplay',name,troll,'passed');
  await context.close();
 }finally{await browser.close()}
}

(async()=>{
 await run(chromium,'chromium-iphone-lillesoster',{width:390,height:844},'lillesoster');
 await run(webkit,'webkit-ipad-lillebror',{width:820,height:1180},'lillebror');
})().catch(e=>{console.error(e);process.exitCode=1});
