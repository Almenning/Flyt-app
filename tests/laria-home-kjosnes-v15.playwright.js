'use strict';
/* Exact-head proof for Læria Home v15: locked Kjøsnesfjorden masters + real controls. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const path=require('node:path');
const {chromium,webkit}=require('playwright');

const LOCKED_MASTERS=[
 {file:'laer-litt-mer/assets/home-v15/kjosnes-home-tablet.webp',bytes:59628,sha:'b5165fa109db03d947e302f165467b70a63cbaee933d0f9b71ccfce903525844'},
 {file:'laer-litt-mer/assets/home-v15/kjosnes-home-phone.webp',bytes:52882,sha:'0d804d147dc38d259c13757522907f953488f0b40dea298a8efc06055427c8f7'}
];
function verifyLockedMasterFiles(){
 for(const item of LOCKED_MASTERS){
   const buf=fs.readFileSync(path.resolve(item.file));
   assert.equal(buf.length,item.bytes,item.file+' byte length changed');
   assert.equal(crypto.createHash('sha256').update(buf).digest('hex'),item.sha,item.file+' locked SHA-256 changed');
 }
}
const folder=process.env.HOME_V15_SCREENSHOTS||'/tmp/laria-home-v15';
fs.mkdirSync(folder,{recursive:true});

const seed={
 version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'Testbarn',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
 masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
 lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null
};

async function homeReady(page,label){
 const home=page.locator('.bc12.bc15-locked-home');
 await home.waitFor({state:'visible',timeout:20000});
 await page.waitForFunction(()=>{
   const h=document.querySelector('.bc12.bc15-locked-home');
   return !!h && /ready$/.test(h.dataset.bc15Asset||'');
 },null,{timeout:20000});
 const asset=await home.getAttribute('data-bc15-asset');
 assert.match(asset,/^(phone|tablet)-ready$/,label+' locked master did not activate');
 const art=await home.evaluate(el=>getComputedStyle(el).getPropertyValue('--bc15-home-art'));
 const portrait=label.includes('iphone')||(label.includes('ipad')&&!label.includes('landscape'));
 const expected=portrait?'kjosnes-home-phone.webp':'kjosnes-home-tablet.webp';
 assert(art.includes(expected),label+' must use the exact locked WebP master: '+art);
 return home;
}

async function returnFromLockedJourney(page,screen,subject,label){
 const root='#'+screen+'-screen.active';
 const back=page.locator(root+' .locked-journey-map[data-journey-subject="'+subject+'"] .locked-journey-back');
 await back.waitFor({state:'visible',timeout:16000});
 await back.scrollIntoViewIfNeeded();
 await back.click();
 await page.locator('#home-screen.active').waitFor({timeout:12000});
 await homeReady(page,label+' return '+subject);
 const hiddenNext=(await page.locator('[data-camp-next]').innerText()).trim();
 assert(hiddenNext,label+' '+subject+' return must expose next journey state');
 assert((await page.locator('.bc15-live-next').innerText()).includes(hiddenNext),
   label+' '+subject+' live next-stop must still mirror real state after return');
}

async function run(engine,label,viewport){
 const browser=await engine.launch({headless:true,args:label.startsWith('chromium')?['--no-sandbox']:[]});
 try{
   const context=await browser.newContext({
     viewport,isMobile:viewport.width<600,hasTouch:true,
     reducedMotion:'reduce',serviceWorkers:'block'
   });
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed);
   await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
   await page.route('https://api.worldbank.org/**',r=>r.abort());
   const base=(process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria');
   await page.goto(base+'&home-v15='+label,{waitUntil:'domcontentloaded'});

   const home=await homeReady(page,label);
   const liveGreeting=(await page.locator('.bc15-live-greeting').innerText()).trim();
   assert.match(liveGreeting,/Testbarn/,label+' dynamic greeting must use profile name');
   assert.doesNotMatch(liveGreeting,/Aleah/,label+' locked mockup name must not leak as live child identity');
   const originalNext=(await page.locator('[data-camp-next]').innerText()).trim();
   assert(originalNext,label+' hidden journey state must expose a next place');
   assert((await page.locator('.bc15-live-next').innerText()).includes(originalNext),label+' live next-stop copy must mirror journey state');
   assert.equal(await page.locator('.bc14-subject:visible').count(),4,label+' must keep four real subject hit areas');
   assert.equal(await page.locator('.bc12-journey:visible').count(),1,label+' journey action must stay real');
   assert.equal(await page.locator('.bc12-fox:visible').count(),0,label+' old fox must not be visible on Home v15');
   assert.equal(await page.locator('.bc12-fox-call:visible').count(),0,label+' old fox callout must not be visible');
   assert.equal(await page.locator('.bc14-free:visible').count(),0,label+' duplicate Explore card must not compete on Home v15');
   assert.equal(await page.locator('.bc12-quest:visible').count(),0,label+' old fox-letter card must not compete on Home v15');
   assert.equal(await page.locator('.bc12-place:visible').count(),0,label+' legacy activity signs must not compete');

   const geom=await page.evaluate(()=>{
     const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
     const cards=[...document.querySelectorAll('.bc14-subject')].map(rect);
     const journey=rect(document.querySelector('.bc12-journey'));
     const nav=rect(document.querySelector('.bc12-nav'));
     const navButtons=[...document.querySelectorAll('.bc12-nav button')].filter(e=>getComputedStyle(e).display!=='none').map(rect);
     return {cards,journey,nav,navButtons,scroll:document.documentElement.scrollWidth,viewport:innerWidth};
   });
   assert(geom.scroll<=geom.viewport+1,label+' horizontal overflow '+JSON.stringify(geom));
   assert(geom.cards.every(r=>r.width>=44&&r.height>=44),label+' subject touch target too small '+JSON.stringify(geom.cards));
   assert(geom.journey.width>=44&&geom.journey.height>=44,label+' journey touch target too small');
   assert(geom.navButtons.every(r=>r.width>=44&&r.height>=44),label+' nav touch target too small '+JSON.stringify(geom.navButtons));
   assert(geom.navButtons.every(r=>r.x>=-1&&r.right<=geom.viewport+1),label+' nav touch target outside viewport '+JSON.stringify(geom.navButtons));
   await page.screenshot({path:folder+'/'+label+'-home.png',fullPage:true});

   /* Mine troll must not leak into the old fox wardrobe. */
   await page.locator('.bc12-nav [data-camp="wardrobe"]').click();
   const trollDialog=page.locator('#bc15-troll-dialog');
   await trollDialog.waitFor({state:'visible',timeout:8000});
   assert.equal((await trollDialog.locator('h2').innerText()).trim(),'Mine troll');
   assert.doesNotMatch((await trollDialog.innerText()).toLowerCase(),/min rev|kle på din rev/,
     label+' Mine troll routed to fox wardrobe');
   await page.screenshot({path:folder+'/'+label+'-mine-troll.png',fullPage:true});
   await trollDialog.locator('.bc15-troll-close').click();

   /* Every subject gateway remains functional under the locked artwork. */
   for(const [subject,screen] of [
     ['norwegian','subject'],
     ['math','subject'],
     ['english','subject'],
     ['geography','geography']
   ]){
     await page.locator('.bc14-subject[data-camp="subject-'+subject+'"]').click();
     await page.locator('#'+screen+'-screen.active').waitFor({timeout:15000});
     await returnFromLockedJourney(page,screen,subject,label);
   }

   /* Reisen stays a true primary action and uses the same locked-journey return flow. */
   const journeySubject=await home.getAttribute('data-journey-subject')||'norwegian';
   await page.locator('.bc12-journey').click();
   const journeyScreen=journeySubject==='geography'?'geography':'subject';
   await page.locator('#'+journeyScreen+'-screen.active').waitFor({timeout:15000});
   await returnFromLockedJourney(page,journeyScreen,journeySubject,label+' primary journey');

   /* Explore keeps the existing v13 map-board for now. Home v15 must yield to it cleanly. */
   await page.locator('.bc12-nav [data-camp="explore"]').click();
   await page.waitForFunction(()=>document.querySelector('.bc12')?.dataset.bc13View==='explore');
   await page.locator('.bc13-panel:not([hidden])').waitFor({state:'visible',timeout:10000});
   assert.equal(await page.locator('.bc12.bc15-locked-home').count(),0,label+' locked Home leaked into Explore map-board');
   await page.locator('.bc13-close').click();
   await page.waitForFunction(()=>document.querySelector('.bc12')?.dataset.bc13View==='home');
   await homeReady(page,label+' return explore');

   assert.deepEqual(errors,[],label+' page errors '+JSON.stringify(errors));
   console.log('[home v15]',label,JSON.stringify(viewport),'locked master + controls OK');
   await context.close();
 }finally{await browser.close()}
}

(async()=>{
 verifyLockedMasterFiles();
 for(const [label,engine,viewport] of [
   ['chromium-iphone',chromium,{width:390,height:844}],
   ['safari-iphone',webkit,{width:390,height:844}],
   ['safari-ipad',webkit,{width:820,height:1180}],
   ['safari-ipad-landscape',webkit,{width:1180,height:820}]
 ])await run(engine,label,viewport);
})().catch(e=>{console.error(e);process.exitCode=1});
