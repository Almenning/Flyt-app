'use strict';
/* Exact-head visual and functional QA for the illustrated Basecamp map-board. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const folder=process.env.NAV_QA_SCREENSHOTS||'/tmp/laria-navigation-v13';
fs.mkdirSync(folder,{recursive:true});
const seed={
 version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Kartbarn',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
 masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
 lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null
};
async function checkBoard(page,mode,tag){
 const board=page.locator('.bc13-panel:not([hidden])');
 await board.waitFor({state:'visible',timeout:13000});
 assert.equal(await page.locator('.bc12').getAttribute('data-bc13-view'),mode,tag+' wrong chooser mode');
 const actions=await page.locator('.bc13-card').evaluateAll(nodes=>nodes.map(n=>n.dataset.bc13Action));
 assert.deepEqual(actions,mode==='travel'?['norwegian','math','english','geography']:['globe','words','fraction','multiply'],tag+' incorrect destinations');
 assert.equal(await page.locator('.bc13-scene svg').count(),4,tag+' must have four illustrated destinations');
 const positions=await page.evaluate(()=>{
  const bounds=node=>{const {x,y,width,height}=node.getBoundingClientRect();return {x,y,width,height}};
  return {board:bounds(document.querySelector('.bc13-panel')),nav:bounds(document.querySelector('.bc12-nav')),close:bounds(document.querySelector('.bc13-close')),
    cards:[...document.querySelectorAll('.bc13-card')].map(bounds),scroll:document.documentElement.scrollWidth,viewport:innerWidth};
 });
 assert(positions.board.x>=0&&positions.board.x+positions.board.width<=positions.viewport+1,tag+' board clipped horizontally: '+JSON.stringify(positions));
 assert(positions.board.y+positions.board.height<=positions.nav.y+4,tag+' map-board hides bottom navigation: '+JSON.stringify(positions));
 assert(positions.cards.every(b=>b.width>=75&&b.height>=75),tag+' destination has too small tap area: '+JSON.stringify(positions.cards));
 assert(positions.close.width>=44&&positions.close.height>=44,tag+' Home return target must be at least 44px: '+JSON.stringify(positions.close));
 assert(positions.scroll<=positions.viewport+1,tag+' horizontal scroll');
 await page.screenshot({path:folder+'/'+tag+'-'+mode+'.png',fullPage:true});
}
async function run(engine,label,viewport){
 const browser=await engine.launch({headless:true,args:label==='chromium'?['--no-sandbox']:[]});
 const context=await browser.newContext({viewport,isMobile:viewport.width<=600,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed);
 await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
 await page.route('https://api.worldbank.org/**',r=>r.abort());
 try{
  await page.goto((process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria')+'&navqa='+label,{waitUntil:'domcontentloaded'});
  await page.locator('.bc12:not([hidden])').waitFor({timeout:16000});
  await page.waitForFunction(()=>document.querySelector('.bc12[data-bc13-bound="true"]')&&document.querySelector('.bc12-nav button'));
  await page.screenshot({path:folder+'/'+label+'-home.png',fullPage:true});
  assert.equal(await page.locator('.bc13-panel:not([hidden])').count(),0,'Home should not show a detached chooser');
  await page.locator('.bc12-nav [data-camp="travel"]').click();
  await checkBoard(page,'travel',label);
  for(const [subject,screen,back] of [
   ['norwegian','subject','subject-back'],
   ['math','subject','subject-back'],
   ['english','subject','subject-back'],
   ['geography','geography','geography-back']]){
   await page.locator('[data-bc13-action="'+subject+'"]').click();
   await page.locator('#'+screen+'-screen.active').waitFor({timeout:10000});
   const visibleBack=page.locator('#'+screen+'-screen .bok-v10-home:visible, #'+screen+'-screen .premium-world-back:visible, #'+back+':visible').first();
   await visibleBack.waitFor({state:'visible',timeout:10000});
   await visibleBack.click();
   await page.locator('#home-screen.active').waitFor({timeout:10000});
   await page.locator('.bc13-panel:not([hidden]) [data-bc13-action="'+subject+'"]').waitFor({timeout:10000});
  }
  await page.locator('.bc12-nav [data-camp="explore"]').click();
  await checkBoard(page,'explore',label);
  for(const [action,screen,back] of [
   ['globe','world','world-back'],
   ['fraction','fraction-lab','fraction-lab-back'],
   ['multiply','multiplication-lab','multiplication-lab-back']]){
   await page.locator('[data-bc13-action="'+action+'"]').click();
   await page.locator('#'+screen+'-screen.active').waitFor({timeout:13000});
   if(action==='globe'){
    await page.waitForFunction(()=>document.getElementById('world-screen')?.dataset.mapPerspective==='globe'&&document.getElementById('world-screen')?.dataset.premiumGlobeMode==='classic',{timeout:8000});
    assert.equal(await page.locator('#globe-canvas').isVisible(),true,label+' Kloden must show the interactive globe rather than atlas');
   }
   await page.locator('#'+back).click();
   await page.locator('#home-screen.active').waitFor({timeout:10000});
   await page.locator('.bc13-panel:not([hidden]) [data-bc13-action="'+action+'"]').waitFor({timeout:10000});
  }
  await page.locator('[data-bc13-action="words"]').click();
  await page.locator('#word-hunt-overlay').waitFor({state:'visible',timeout:13000});
  await page.locator('.word-hunt-back').click();
  await page.locator('.bc13-panel:not([hidden]) [data-bc13-action="words"]').waitFor();
  await page.locator('.bc13-close').click();
  assert.equal(await page.locator('.bc12').getAttribute('data-bc13-view'),'home','close returns to physical Home');
  assert.equal(await page.locator('.bc13-panel:not([hidden])').count(),0,'panel should hide on Home');
  assert.deepEqual(errors,[],label+' JS runtime errors');
  console.log('[nav v13]',label,JSON.stringify(viewport),'journeys/explore/returns/art/geometry OK');
 }finally{await context.close();await browser.close();}
}
(async()=>{
 for(const [label,engine,viewport] of [
  ['chromium-iphone',chromium,{width:390,height:844}],
  ['safari-iphone',webkit,{width:390,height:844}],
  ['safari-small',webkit,{width:320,height:568}],
  ['safari-ipad',webkit,{width:820,height:1180}],
  ['safari-ipad-landscape',webkit,{width:1180,height:820}]
 ])await run(engine,label,viewport);
})().catch(err=>{console.error(err);process.exitCode=1});
