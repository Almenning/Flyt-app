'use strict';
/* Exact-head proof for Læria Home v15: locked Kjøsnesfjorden masters + real controls. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const path=require('node:path');
const {chromium,webkit}=require('playwright');

const LOCKED_MASTERS=[
 {file:'laer-litt-mer/assets/home-v15/kjosnes-home-tablet.webp',bytes:459450,sha:'246edc1572d652af5c3ebf452be60db0b2f842b6afd9fd27529c04145bdf38e5'},
 {file:'laer-litt-mer/assets/home-v15/kjosnes-home-phone.webp',bytes:52882,sha:'0d804d147dc38d259c13757522907f953488f0b40dea298a8efc06055427c8f7'},
 {file:'laer-litt-mer/assets/home-v15/laria-troll-trio-nav.webp',bytes:11448,sha:'a9937014dbefbb32096b413b49d62511aeff2ed287092b1b91fd9dee671d5137'},
 {file:'laer-litt-mer/assets/home-v15/laria-troll-trio-v3.webp',bytes:195078,sha:'695a598b236162cf409c208c76a09e5e3d3f18ec2c7eb925bf7148c66b2883ca'}
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
 const natural=await home.evaluate(async el=>{
   const raw=getComputedStyle(el).getPropertyValue('--bc15-home-art');
   const src=raw.match(/url\(["']?(.*?)["']?\)/)?.[1];
   if(!src)return {width:0,height:0,src:raw};
   const img=new Image();
   img.src=src;
   await img.decode();
   return {width:img.naturalWidth,height:img.naturalHeight,src};
 });
 if(!portrait){
   assert(natural.width>=1127&&natural.height>=681,
     label+' tablet Home master is too low-resolution and will blur when enlarged: '+JSON.stringify(natural));
 }
 return home;
}

async function returnFromLockedJourney(page,screen,subject,label){
 const root='#'+screen+'-screen.active';
 if(subject==='math'){
   // Tallvika is now the real Math landing, not the hidden former map.
   const world=page.locator(root+' #tallvika-world');
   await world.waitFor({state:'visible',timeout:16000});
   const back=world.locator('[data-tv="back"]');
   await back.waitFor({state:'visible'});
   await back.click();
 }else if(subject==='norwegian'){
   const world=page.locator('#eggenipa-world:visible');
   await world.waitFor({timeout:16000});
   assert.deepEqual(await world.locator('.eg-portal').evaluateAll(nodes=>nodes.map(n=>n.dataset.eg)),
     ['words','find','reading'],label+' Norsk has not switched to direct learning activities');
   assert.equal(await page.locator('#subject-screen.active .locked-journey-map:visible').count(),0,
     label+' retired Bokskogen map unexpectedly visible');
   await world.locator('.eg-portal[data-eg="reading"]').click();
   await page.locator('#session-screen.active .laria-task-card').waitFor({timeout:16000});
   const learning=await page.evaluate(()=>({subject:sessionScope?.subject,module:sessionScope?.module,
     question:sessionQuestions[qIndex]?.prompt}));
   assert.equal(learning.subject,'norwegian');
   assert.equal(learning.module,'reading',label+' Lesekroken must use the Norwegian reading engine');
   assert.ok(learning.question,label+' reading mission did not load a question');
   await page.locator('#close-session').click();
   await world.waitFor({timeout:16000});
   await world.locator('[data-eg="home"]').click();
 }else if(subject==='english'){
   // Direct Kinnaklova replaces the hidden Ordlandsbyen map. Navigate by
   // the real controls a child can tap, not by a retired map back-button.
   const world=page.locator(root+' #kinnaklova-world');
   await world.waitFor({state:'visible',timeout:16000});
   const utility=world.locator('.ki-utility [data-ki="home"]');
   if(await utility.isVisible())await utility.click();
   else await world.locator('.ki-painted-home').click();
 }else{
   const back=page.locator(root+' .locked-journey-map[data-journey-subject="'+subject+'"] .locked-journey-back');
   await back.waitFor({state:'visible',timeout:16000});
   await back.scrollIntoViewIfNeeded();
   await back.click();
 }
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
   const portrait=!label.includes('landscape');
   assert.equal(await page.locator('.bc15-live-intro').isVisible(),portrait,
     label+' portrait must replace the baked intro while landscape keeps the locked intro');
   const originalNext=(await page.locator('[data-camp-next]').innerText()).trim();
   assert(originalNext,label+' hidden journey state must expose a next place');
   const liveNextText=(await page.locator('.bc15-live-next').innerText()).trim();
   assert(liveNextText.includes(originalNext),label+' live next-stop copy must mirror journey state');
   assert.match(liveNextText,/^(Pågående|Neste stopp) · /,label+' journey status must use the compact integrated label');
   assert.equal(await page.locator('.bc14-subject:visible').count(),4,label+' must keep four real subject hit areas');
   assert.equal(await page.locator('.bc12-journey:visible').count(),1,label+' journey action must stay real');
   assert.equal(await page.locator('.bc12-fox:visible').count(),0,label+' old fox must not be visible on Home v15');
   assert.equal(await page.locator('.bc12-fox-call:visible').count(),0,label+' old fox callout must not be visible');
   assert.equal(await page.locator('.bc14-free:visible').count(),0,label+' duplicate Explore card must not compete on Home v15');
   assert.equal(await page.locator('.bc12-quest:visible').count(),0,label+' old fox-letter card must not compete on Home v15');
   assert.equal(await page.locator('.bc12-place:visible').count(),0,label+' legacy activity signs must not compete');
   assert.equal(await page.locator('.safe-challenge-young:visible').count(),0,label+' legacy challenge button must stay hidden on locked Home');
   assert.equal(await page.locator('.bc15-ambient').count(),1,label+' Home ambience layer missing');
   assert.equal(await page.locator('.bc15-ambient>span').count(),3,label+' Home ambience must stay deliberately minimal');
   const ambient=await page.locator('.bc15-ambient').evaluate(el=>({
     pointer:getComputedStyle(el).pointerEvents,
     hidden:el.getAttribute('aria-hidden'),
     animations:[...el.children].map(child=>getComputedStyle(child).animationName)
   }));
   assert.equal(ambient.pointer,'none',label+' ambience must never capture taps');
   assert.equal(ambient.hidden,'true',label+' ambience must stay decorative for assistive tech');
   assert(ambient.animations.every(name=>name==='none'),label+' reduced-motion context must disable ambient animation '+JSON.stringify(ambient.animations));

   const geom=await page.evaluate(()=>{
     const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
     const cards=[...document.querySelectorAll('.bc14-subject')].map(rect);
     const journey=rect(document.querySelector('.bc12-journey'));
     const nav=rect(document.querySelector('.bc12-nav'));
     const liveNext=rect(document.querySelector('.bc15-live-next'));
     const liveCopy=rect(document.querySelector('.bc15-live-copy'));
     const navButtons=[...document.querySelectorAll('.bc12-nav button')].filter(e=>getComputedStyle(e).display!=='none').map(rect);
     const host=document.querySelector('.bc12.bc15-locked-home');
     const liveCopyStyle=getComputedStyle(document.querySelector('.bc15-live-copy'));
     const liveNextStyle=getComputedStyle(document.querySelector('.bc15-live-next'));
     const liveCopyBg=liveCopyStyle.backgroundImage;
     const liveNextBg=liveNextStyle.backgroundImage;
     const scenic=getComputedStyle(host,'::before');
     const artLeft=parseFloat(getComputedStyle(host).getPropertyValue('--bc15-art-left'))||0;
     const artTop=parseFloat(getComputedStyle(host).getPropertyValue('--bc15-art-top'))||0;
     const artWidth=parseFloat(getComputedStyle(host).getPropertyValue('--bc15-art-width'))||0;
     return {cards,journey,nav,liveNext,liveCopy,liveCopyBg,liveNextBg,liveCopyShadow:liveCopyStyle.boxShadow,liveNextShadow:liveNextStyle.boxShadow,scenicFilter:scenic.filter,scenicBg:scenic.backgroundImage,artLeft,artTop,artWidth,navButtons,scroll:document.documentElement.scrollWidth,viewport:innerWidth};
   });
   assert(geom.scroll<=geom.viewport+1,label+' horizontal overflow '+JSON.stringify(geom));
   assert(geom.cards.every(r=>r.width>=44&&r.height>=44),label+' subject touch target too small '+JSON.stringify(geom.cards));
   assert(geom.journey.width>=44&&geom.journey.height>=44,label+' journey touch target too small');
   assert(geom.liveNext.x>=geom.journey.x-2&&geom.liveNext.right<=geom.journey.right+2&&
     geom.liveNext.y>=geom.journey.y-2&&geom.liveNext.bottom<=geom.journey.bottom+2,
     label+' journey status escaped the painted Fortsett reisen sign '+JSON.stringify({journey:geom.journey,status:geom.liveNext}));
   assert(geom.liveCopy.width<geom.viewport*.65,label+' greeting overlay became a dashboard-sized panel '+JSON.stringify(geom.liveCopy));
   assert.doesNotMatch(geom.liveCopyBg,/rgba?\([^)]*,\s*0\./,
     label+' greeting plaque must be fully opaque so baked child-name text cannot ghost through: '+geom.liveCopyBg);
   assert.equal(geom.scenicFilter,'none',label+' Home safe-area fill must not blur the locked artwork');
   assert.doesNotMatch(geom.scenicBg,/url\(/,
     label+' safe-area fill must not repeat logo, gear, text or other painted UI from the locked artwork');
   if(portrait){
     assert(geom.artLeft>=-1&&geom.artLeft+geom.artWidth<=geom.viewport+1,
       label+' portrait artwork must not crop the subject cards/navigation: '+JSON.stringify({artLeft:geom.artLeft,artWidth:geom.artWidth,viewport:geom.viewport}));
     assert.notEqual(geom.liveNextBg,'none',
       label+' portrait journey status must cover baked placeholder text instead of ghosting over it');
     if(label.includes('iphone')){
       assert(geom.artTop<=40,label+' phone top safe-area grew too tall: '+JSON.stringify({artTop:geom.artTop}));
       assert.equal(geom.liveCopyShadow,'none',label+' phone greeting must read as sky, not a floating UI card');
       assert.equal(geom.liveNextShadow,'none',label+' phone journey copy must sit flat on the painted sign');
     }
   }
   assert(geom.navButtons.every(r=>r.width>=44&&r.height>=44),label+' nav touch target too small '+JSON.stringify(geom.navButtons));
   assert(geom.navButtons.every(r=>r.x>=-1&&r.right<=geom.viewport+1),label+' nav touch target outside viewport '+JSON.stringify(geom.navButtons));
   await page.screenshot({path:folder+'/'+label+'-home.png',fullPage:true});

   /* Mine troll must not leak into the old fox wardrobe. */
   await page.locator('.bc12-nav [data-camp="wardrobe"]').click();
   const trollDialog=page.locator('#bc15-troll-dialog');
   await trollDialog.waitFor({state:'visible',timeout:8000});
   assert.equal((await trollDialog.locator('h2').innerText()).trim(),'Mine troll');
   assert.equal((await page.locator('.bc12-nav [data-camp="wardrobe"]').innerText()).trim(),'Mine troll',
     label+' troll navigation label must not fall back to Min rev');
   assert.doesNotMatch((await trollDialog.innerText()).toLowerCase(),/min rev|kle på din rev/,
     label+' Mine troll routed to fox wardrobe');
   const trollArt=await trollDialog.locator('.bc15-troll-art').evaluate(el=>getComputedStyle(el).backgroundImage);
   assert(trollArt.includes('laria-troll-trio-v3.webp'),
     label+' Mine troll must use the locked standalone troll trio art: '+trollArt);
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

   /* "Fortsett reisen" prioritizes a saved unfinished activity over the
      decorative journey map. Verify actual resume semantics on this path. */
   const pending=await page.evaluate(()=>state.activeSession?.scope?
     {subject:state.activeSession.scope.subject,module:state.activeSession.scope.module,
      index:state.activeSession.qIndex}:null);
   const journeySubject=await home.getAttribute('data-journey-subject')||'norwegian';
   await page.locator('.bc12-journey').click();
   if(pending){
     await page.locator('#session-screen.active .laria-task-card').waitFor({timeout:15000});
     const resumed=await page.evaluate(()=>({subject:sessionScope?.subject,module:sessionScope?.module,index:qIndex}));
     assert.deepEqual(resumed,pending,label+' Home journey changed interrupted question');
     await page.locator('#close-session').click();
     if(pending.subject==='norwegian'){
       await page.locator('#eggenipa-world:visible').waitFor({timeout:15000});
       await page.locator('#eggenipa-world [data-eg="home"]').click();
       await page.locator('#home-screen.active').waitFor({timeout:12000});
       await homeReady(page,label+' resumed reading');
     }else{
       const screen=pending.subject==='geography'?'geography':'subject';
       await returnFromLockedJourney(page,screen,pending.subject,label+' resumed journey');
     }
   }else{
     const journeyScreen=journeySubject==='geography'?'geography':'subject';
     await page.locator('#'+journeyScreen+'-screen.active').waitFor({timeout:15000});
     await returnFromLockedJourney(page,journeyScreen,journeySubject,label+' primary journey');
   }

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
