'use strict';
const openHomeSubject=require('./helpers/laria-home-open-subject.cjs');
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
 assert.equal(await home.getAttribute('data-bc15-premium-art'),'blocked',
   label+' historical Grovanova art was incorrectly marked clean and premium-approved');
 const art=await home.evaluate(el=>getComputedStyle(el).getPropertyValue('--bc15-home-art'));
 const portrait=label.includes('iphone')||(label.includes('ipad')&&!label.includes('landscape'));
 const cardArt=await home.getAttribute('data-bc15-card-art');
 assert.equal(await home.locator('.bc15-live-next').count(),0,
   label+' no pasted-on next-stop label may cover the original painted journey sign');
 const expected=cardArt==='clean-candidate'?
  (portrait?'kjosnes-home-phone-no-bottom-cards-no-next-stop.webp':'kjosnes-home-tablet-no-bottom-cards-no-next-stop.webp'):
  (portrait?'kjosnes-home-phone.webp':'kjosnes-home-tablet.webp');
 assert(art.includes(expected),label+' must use the exact locked WebP master: '+art);
 if(label.includes('ipad')||label.includes('iphone')){
   assert.equal(cardArt,'clean-candidate',label+' iPad/iPhone must use the separate no-card clean derivative');
   assert(art.includes('-no-next-stop.webp'),label+' static Next Stop text has reappeared in the Home asset: '+art);
   assert.equal(await home.locator('.bc15-live-next').count(),0,
     label+' must never put the old next-stop sticker over the wood sign');
 }
 // The top scenic margin may only be filled by a source-locked, UI-free
 // texture, never an extra copy of the Home logo or painted navigation.
 if(label.includes('ipad')&&label.includes('landscape')&&cardArt==='clean-candidate'){
   const scenic=await home.evaluate(async el=>{
     const needed=el.classList.contains('bc15-landscape-bleed');
     const p=getComputedStyle(el,'::before'),q=getComputedStyle(el,'::after');
     const img=new Image();
     img.src=new URL('./assets/home-v15/kjosnes-home-tablet-scenic-top-edge.webp',location.href).href;
     try{await img.decode();}
     catch(e){return {needed,loaded:false,reason:String(e),background:p.backgroundImage};}
     return {needed,loaded:true,width:img.naturalWidth,height:img.naturalHeight,
       background:p.backgroundImage,mask:q.maskImage||q.webkitMaskImage};
   });
   assert(scenic.needed,label+' must enable scenic-only top continuation');
   assert(scenic.loaded&&scenic.width===1127&&scenic.height===20,
     label+' top continuation must decode to the verified 1127x20 source strip: '+JSON.stringify(scenic));
   assert.match(scenic.background,/kjosnes-home-tablet-scenic-top-edge\\?\.webp/,
     label+' must replace the rejected brown-blue top letterbox with source-faithful pixels');
   assert.match(scenic.mask,/linear-gradient/,label+' top background must meet the real painting without a black seam');
 }

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
   { const painted=page.locator('#eggenipa-world .eg-scene-reading:visible');
  const entry=(await painted.count())?painted:page.locator('#eggenipa-world .eg-portal[data-eg="reading"]:visible');
  await entry.click(); }
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
   // The clean painted background switches navigation controls when image integrity
   // settles. Wait before deciding, otherwise the temporary utility link can vanish
   // during a Playwright click on iPad.
   await page.waitForFunction(()=>{
     const host=document.querySelector('#subject-screen.active #kinnaklova-world');
     return ['ready','missing','unapproved'].includes(host?.dataset.kiArt);
   },null,{timeout:20000});
   const utility=world.locator('.ki-utility [data-ki="home"]');
   if(await utility.isVisible())await utility.click();
   else await world.locator('.ki-painted-home').click();
 }else if(subject==='geography'){
   // Geography now has a proper Nordlysleiren scene in front of the old map.
   // The Home sign goes straight back without opening an unrelated lesson.
   const world=page.locator('#laria-geography-world:visible');
   await world.waitFor({timeout:16000});
   await world.locator('[data-gv="home"]').click();
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
 const journeyLabel=await page.locator('.bc12-journey').getAttribute('aria-label');
 assert(journeyLabel?.includes(hiddenNext),
   label+' '+subject+' journey progress must be readable by assistive tech after return');
 assert.equal(await page.locator('.bc15-live-next').count(),0,
   label+' '+subject+' return may not recreate pasted-on progress plaque');
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
   await page.addInitScript(()=>{window.__LARIA_QA_SKIP_V16=true;});
   await page.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed);
   await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
   await page.route('https://api.worldbank.org/**',r=>r.abort());
   const base=(process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria');
   await page.goto(base+'&home-v15='+label,{waitUntil:'domcontentloaded'});

   const home=await homeReady(page,label);
   // Home is a fixed scene: page-level scroll and rubber-band bleed are not allowed.
   const viewportLock=await page.evaluate(()=>{
     const doc=document.scrollingElement;
     const stage=document.querySelector('#home-screen.active > .bc12.bc15-locked-home');
     window.scrollTo(0,200);
     return {
       scrollY:window.scrollY, scrollHeight:doc?.scrollHeight, clientHeight:doc?.clientHeight,
       stageHeight:stage?.getBoundingClientRect().height, viewportHeight:window.innerHeight,
       overscroll:getComputedStyle(document.body).overscrollBehaviorY,
       touch:getComputedStyle(stage).touchAction
     };
   });
   assert.equal(viewportLock.scrollY,0,label+' Home must not scroll: '+JSON.stringify(viewportLock));
   assert.ok(viewportLock.scrollHeight<=viewportLock.clientHeight+2,
     label+' Home extends below the viewport: '+JSON.stringify(viewportLock));
   assert.ok(Math.abs(viewportLock.stageHeight-viewportLock.viewportHeight)<=2,
     label+' Home artwork stage does not fill the viewport: '+JSON.stringify(viewportLock));
   assert.equal(viewportLock.overscroll,'none',label+' browser backdrop may rubber-band');
   assert.equal(viewportLock.touch,'pan-x',label+' Home vertical drag must stay contained');
   const liveGreeting=(await page.locator('.bc15-live-greeting').innerText()).trim();
   assert.match(liveGreeting,/Testbarn/,label+' dynamic greeting must use profile name');
   assert.doesNotMatch(liveGreeting,/Aleah/,label+' locked mockup name must not leak as live child identity');
   const portrait=!label.includes('landscape');
   assert.equal(await page.locator('.bc15-live-intro').isVisible(),true,
     label+' Home greeting and introduction must share one accessible speech bubble');
   const originalNext=(await page.locator('[data-camp-next]').innerText()).trim();
   assert(originalNext,label+' hidden journey state must expose a next place');
   const journeyLabel=await home.locator('.bc12-journey').getAttribute('aria-label');
   assert.match(journeyLabel||'',/^Fortsett reisen\. (Pågående|Neste stopp): /,
     label+' journey status must be accessible without covering the sign');
   assert(journeyLabel.includes(originalNext),label+' journey destination lost its accessible state');
   assert.equal(await home.locator('.bc15-live-next').count(),0,
     label+' no artificial label should be glued over Fortsett reisen');
   const cleanHome=(await home.getAttribute('data-bc15-card-art'))==='clean-candidate';
   const visibleOldCards=await page.locator('.bc14-subject:visible').count();
   assert.equal(visibleOldCards,cleanHome?0:4,
     label+' must hide all four old bottom hit areas ONLY when original-faithful clean artwork loaded');
   if(cleanHome){
    assert.equal(await home.locator('.bc15-subject-signs button:visible').count(),4,
      label+' no-card Home must instead provide four working oak signs');
    assert.equal(await home.locator('.bc14-subjects').getAttribute('aria-hidden'),'true');
    assert.equal(await home.locator('.bc14-subjects').evaluate(el=>el.inert),true);
   }
   assert.equal(await page.locator('.bc12-journey:visible').count(),1,label+' journey action must stay real');
   assert.equal(await page.locator('.bc12-fox:visible').count(),0,label+' old fox must not be visible on Home v15');
   assert.equal(await page.locator('.bc12-fox-call:visible').count(),0,label+' old fox callout must not be visible');
   assert.equal(await page.locator('.bc14-free:visible').count(),0,label+' duplicate Explore card must not compete on Home v15');
   assert.equal(await page.locator('.bc12-quest:visible').count(),0,label+' old fox-letter card must not compete on Home v15');
   assert.equal(await page.locator('.bc12-place:visible').count(),0,label+' legacy activity signs must not compete');
   assert.equal(await page.locator('.safe-challenge-young:visible').count(),0,label+' legacy challenge button must stay hidden on locked Home');
   // Boats must be a separate, non-interactive image overlay. Their positions
   // follow the immutable background crop on both iPad orientations and must
   // never be introduced on iPhone Home.
   const boatLayer=home.locator('.bc15-boats');
   if(label.includes('ipad')){
     assert.equal(await boatLayer.count(),1,label+' two rowboats need one shared decorative layer');
     const boats=await boatLayer.evaluate(layer=>{
       const home=layer.parentElement,stage=home.getBoundingClientRect();
       const cs=getComputedStyle(home);
       const left=parseFloat(cs.getPropertyValue('--bc15-art-left'));
       const top=parseFloat(cs.getPropertyValue('--bc15-art-top'));
       const width=parseFloat(cs.getPropertyValue('--bc15-art-width'));
       const height=parseFloat(cs.getPropertyValue('--bc15-art-height'));
       return {
         hidden:layer.getAttribute('aria-hidden'),pointer:getComputedStyle(layer).pointerEvents,
         orientation:layer.dataset.bc15Orientation,
         rects:[...layer.children].map(el=>{
           const r=el.getBoundingClientRect(),s=getComputedStyle(el);
           return {name:el.dataset.bc15Boat,width:r.width,height:r.height,
             cx:r.left-stage.left+r.width/2,cy:r.top-stage.top+r.height/2,
             pointer:s.pointerEvents,art:s.backgroundImage};
         }),
         art:{left,top,width,height}
       };
     });
     assert.equal(boats.hidden,'true',label+' boats must not enter accessibility tree');
     assert.equal(boats.pointer,'none',label+' boat layer must never intercept navigation');
     assert.equal(boats.orientation,portrait?'portrait':'landscape',label+' boat positions did not track orientation');
     assert.deepEqual(boats.rects.map(r=>r.name),['near','far'],label+' add exactly two discrete rowboats');
     for(const boat of boats.rects){
       assert.equal(boat.pointer,'none',label+' wooden boat cannot capture taps');
       assert.match(boat.art,/laria-grovanova-rowboat\.svg/,label+' boat must use separate original SVG');
       assert(boat.width>12&&boat.height>8,label+' boat must be visibly sized');
       const x=(boat.cx-boats.art.left)/boats.art.width;
       const y=(boat.cy-boats.art.top)/boats.art.height;
       assert(x>.53&&x<.90&&y>.43&&y<.72,
         label+' boat leaves the open water or exceeds artwork: '+JSON.stringify({name:boat.name,x,y}));
     }
   }else assert.equal(await boatLayer.count(),0,label+' iPhone must retain its prior composition');
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
     const liveCopy=rect(document.querySelector('.bc15-live-copy'));
     const navButtons=[...document.querySelectorAll('.bc12-nav button')].filter(e=>getComputedStyle(e).display!=='none').map(rect);
     const host=document.querySelector('.bc12.bc15-locked-home');
     const liveCopyStyle=getComputedStyle(document.querySelector('.bc15-live-copy'));
     const liveCopyBg=liveCopyStyle.backgroundImage;
     const scenic=getComputedStyle(host,'::before');
     const artLeft=parseFloat(getComputedStyle(host).getPropertyValue('--bc15-art-left'))||0;
     const artTop=parseFloat(getComputedStyle(host).getPropertyValue('--bc15-art-top'))||0;
     const artWidth=parseFloat(getComputedStyle(host).getPropertyValue('--bc15-art-width'))||0;
     return {cards,journey,nav,liveCopy,liveCopyBg,liveCopyShadow:liveCopyStyle.boxShadow,scenicFilter:scenic.filter,scenicBg:scenic.backgroundImage,artLeft,artTop,artWidth,navButtons,scroll:document.documentElement.scrollWidth,viewport:innerWidth};
   });
   assert(geom.scroll<=geom.viewport+1,label+' horizontal overflow '+JSON.stringify(geom));
   if(cleanHome)assert(geom.cards.every(r=>r.width===0&&r.height===0),
     label+' removed bottom hotspot still has touch geometry');
   else assert(geom.cards.every(r=>r.width>=44&&r.height>=44),
     label+' fallback subject hotspot too small '+JSON.stringify(geom.cards));
   assert(geom.journey.width>=44&&geom.journey.height>=44,label+' journey touch target too small');
   assert(geom.liveCopy.width<geom.viewport*.65,label+' greeting overlay became a dashboard-sized panel '+JSON.stringify(geom.liveCopy));
   if(!portrait){
     const firstSign=await page.locator('.bc15-painted-subject').first().boundingBox();
     assert.ok(firstSign&&geom.liveCopy.bottom+9<=firstSign.y,
       label+' speech bubble or pointer physically overlaps first wooden subject sign: '+
       JSON.stringify({bubble:geom.liveCopy,firstSign}));
   }
   if(portrait&&label.includes('iphone')&&cleanHome){
     const boards=await home.locator('.bc15-subject-signs .bc15-painted-subject')
       .evaluateAll(nodes=>nodes.map(el=>{
         const r=el.getBoundingClientRect(),style=getComputedStyle(el);
         return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,
           width:r.width,height:r.height,background:style.backgroundImage};
       }));
     assert.equal(boards.length,4,label+' phone needs four real oak signs');
     assert.ok(boards.every(b=>b.width>=118&&b.height>=44&&b.left>=-1&&b.right<=geom.viewport+1),
       label+' oak subjects must be tappable and in screen: '+JSON.stringify(boards));
     assert.ok(boards.every(b=>b.top>=geom.journey.bottom+1&&b.bottom<=geom.nav.y-1),
       label+' oak subjects must fit between the journey and painted footer: '+
       JSON.stringify({boards,journey:geom.journey,nav:geom.nav}));
     assert.ok(boards.every(b=>/laria-light-arrow-sign/.test(b.background)),
       label+' phone must use the same light oak image as iPad');
   }
   if(portrait&&label.includes('ipad')&&cleanHome){
     // The locked Home painting has three children in the lower-left. No menu
     // plank may run through the painted silhouettes in portrait orientation.
     const boards=await home.locator('.bc15-subject-signs .bc15-painted-subject')
       .evaluateAll(nodes=>nodes.map(el=>{
         const r=el.getBoundingClientRect();
         return {left:r.left,right:r.right,width:r.width,top:r.top,bottom:r.bottom};
       }));
     const clearOfFigures=geom.artLeft+geom.artWidth*.125;
     assert.equal(boards.length,4,label+' portrait Home needs four real sign buttons');
     assert.ok(boards.every(b=>b.width>=130&&b.right<=clearOfFigures),
       label+' portrait rail obscures the locked painted troll silhouettes: '+
       JSON.stringify({boards,clearOfFigures}));
   }

   const speech=await page.locator('.bc15-live-copy').evaluate(el=>{
     const c=getComputedStyle(el),tail=getComputedStyle(el,'::after');
     return {radius:parseFloat(c.borderTopLeftRadius),bg:c.backgroundImage,
       tail:tail.content,colour:c.color,opaque:c.opacity};
   });
   assert.ok(speech.radius>=24,label+' Home greeting must be a rounded storybook speech bubble '+JSON.stringify(speech));
   assert.notEqual(speech.tail,'none',label+' speech bubble pointer missing');
   assert.match(speech.bg,/linear-gradient/,label+' storybook speech background missing');

   assert.doesNotMatch(geom.liveCopyBg,/rgba?\([^)]*,\s*0\./,
     label+' greeting plaque must be fully opaque so baked child-name text cannot ghost through: '+geom.liveCopyBg);
   assert.equal(geom.scenicFilter,'none',label+' Home safe-area fill must not blur the locked artwork');
   if(portrait&&label.includes('ipad')){
     const realArt=await home.evaluate(el=>getComputedStyle(el,'::after').filter);
     assert.doesNotMatch(realArt,/blur\(/,label+' actual locked portrait artwork must never be blurred');
   }
   if(!portrait&&label.includes('ipad')&&cleanHome){
     // Exception is ONLY the 1127x20 verified source crop from BEFORE the
     // painted top-right nav. Any whole illustration/other URL is forbidden.
     assert.match(geom.scenicBg,/\/assets\/home-v15\/kjosnes-home-tablet-scenic-top-edge\.webp/,
       label+' top safe area must use the pixel-locked UI-free sky strip, not another artwork: '+geom.scenicBg);
   }else{
     assert.doesNotMatch(geom.scenicBg,/url\(/,
       label+' safe-area fill must not repeat logo, gear, text or other painted UI');
   }
   if(portrait){
     assert(geom.artLeft>=-1&&geom.artLeft+geom.artWidth<=geom.viewport+1,
       label+' portrait artwork must not crop the locked original/navigation: '+JSON.stringify({artLeft:geom.artLeft,artWidth:geom.artWidth,viewport:geom.viewport}));
     if(label.includes('iphone')){
       assert(geom.artTop<=40,label+' phone top safe-area grew too tall: '+JSON.stringify({artTop:geom.artTop}));
       assert.notEqual(geom.liveCopyShadow,'none',label+' selected speech bubble must have clear foreground separation');
     }
   }
   assert(geom.navButtons.every(r=>r.width>=44&&r.height>=44),label+' nav touch target too small '+JSON.stringify(geom.navButtons));
   assert(geom.navButtons.every(r=>r.x>=-1&&r.right<=geom.viewport+1),label+' nav touch target outside viewport '+JSON.stringify(geom.navButtons));
   await page.screenshot({path:folder+'/'+label+'-home.png',fullPage:true});
   await page.screenshot({path:folder+'/'+label+'-home-review.jpg',type:'jpeg',quality:50,fullPage:false});

   /* Mine troll is one live, selectable companion, not a static gallery. */
   await page.locator('.bc12-nav [data-camp="wardrobe"]').click();
   const trollDialog=page.locator('#laria-premium-troll-dialog[open]');
   await trollDialog.waitFor({state:'visible',timeout:10000});
   assert.equal((await trollDialog.locator('h2').innerText()).trim(),'Mine troll');
   assert.equal((await page.locator('.bc12-nav [data-camp="wardrobe"]').innerText()).trim(),'Mine troll');
   assert.equal(await page.locator('#bc15-troll-dialog[open],#bc12-dialog.is-wardrobe[open]').count(),0,
     label+' legacy static gallery or fox wardrobe was opened');
   assert.deepEqual(await trollDialog.locator('[data-troll-choice]').evaluateAll(xs=>xs.map(x=>x.dataset.trollChoice)),
     ['storesoster','lillesoster','lillebror'],label+' original three companion choices changed');
   assert.equal(await trollDialog.locator('[data-troll-choice][aria-pressed="true"]').getAttribute('data-troll-choice'),
     'storesoster',label+' must initially select approved Storesøster');
   await page.screenshot({path:folder+'/'+label+'-mine-troll.png',fullPage:true});
   await trollDialog.locator('[data-troll-choice="lillesoster"]').click();
   await trollDialog.waitFor({state:'hidden',timeout:9000});
   assert.equal(await page.evaluate(()=>window.LARIA_TROLL_ACTOR.choice()),'lillesoster',
     label+' chosen companion was not applied');
   assert.equal(await page.evaluate(()=>state.profile.tallvikaTroll),'lillesoster',
     label+' chosen companion was not saved');

   /* Every subject gateway remains functional under the locked artwork. */
   for(const [subject,screen] of [
     ['norwegian','subject'],
     ['math','subject'],
     ['english','subject'],
     ['geography','geography']
   ]){
     await openHomeSubject(page,subject);
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

async function runPortraitMasterFixture(engine,label,broken=false,viewport={width:1024,height:1366}){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage();
  const diagnostics={pageErrors:[],consoleErrors:[],failedRequests:[],manifestHits:0,imageHits:0};
  page.on('pageerror',e=>diagnostics.pageErrors.push(String(e.message).slice(0,400)));
  page.on('console',m=>{if(m.type()==='error')diagnostics.consoleErrors.push(m.text().slice(0,400));});
  page.on('requestfailed',req=>diagnostics.failedRequests.push({url:req.url().slice(-140),reason:req.failure()?.errorText}));
  await page.addInitScript(()=>{window.__LARIA_QA_SKIP_V16=true;});
  await page.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed);
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="2732"><rect width="100%" height="100%" fill="#2b6d84"/><text x="70" y="160" fill="white" font-size="64">TEST FIXTURE ONLY — NOT APPROVED ART</text></svg>';
  const sha=crypto.createHash('sha256').update(svg).digest('hex');
  const ui=ownerCatalog.portrait.ui;
  const manifest={status:'approved',source:'./assets/home-v15/__test-only-portrait-master.webp',sha256:broken?'0'.repeat(64):sha,width:2048,height:2732,ui};
  await page.route('**/assets/home-v15/grovanova-ipad-portrait-master.json',route=>{diagnostics.manifestHits++;return route.fulfill({contentType:'application/json',body:JSON.stringify(manifest)});});
  await page.route('**/assets/home-v15/__test-only-portrait-master.webp',route=>{diagnostics.imageHits++;return route.fulfill({contentType:'image/svg+xml',body:svg});});
  await page.goto((process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria')+'&portrait-fixture='+label,{waitUntil:'domcontentloaded'});
  const home=page.locator('.bc12.bc15-locked-home');await home.waitFor({state:'visible',timeout:20000});
  // Diagnose activation failures from actual browser state instead of a blind
  // thirty-second timeout. This fixture must not silently pass on the fallback.
  const state=broken?'phone-ready':'ipad-portrait-approved';
  try{
   await page.waitForFunction(expected=>document.querySelector('#home-screen .bc12')?.dataset.bc15Asset===expected,
     state,{timeout:12000});
  }catch(error){
   const dom=await page.evaluate(()=>{
    const host=document.querySelector('#home-screen .bc12');
    return {home:!!host,active:document.querySelector('#home-screen')?.className,
      state:host?.dataset.bc15Asset,master:host?.dataset.bc15Master,
      premium:host?.dataset.bc15PremiumArt,
      logo:host?.querySelector('.bc15-approved-logo')?.getAttribute('src'),
      secure:globalThis.isSecureContext,crypto:!!globalThis.crypto?.subtle,
      orientation:matchMedia('(orientation:portrait)').matches,
      ipad:matchMedia('(min-width:768px) and (max-width:1366px) and (min-height:650px)').matches,
      bg:host?.style.getPropertyValue('--bc15-home-art'),
      docUrl:location.href};
   });
   throw new Error(label+' portrait fixture expected '+state+' but got '+JSON.stringify({dom,diagnostics})+'; '+error.message);
  }
  if(broken){
   assert.equal(await home.getAttribute('data-bc15-master'),'portrait');
   assert.equal(await home.locator('.bc15-approved-logo').count(),0,label+' corrupt fixture must not expose approved UI');
  }else{
   assert.equal(await home.locator('.bc15-boats').count(),0,label+' no boats on new portrait until owner approves water anchors');
   assert.equal(await home.locator('.bc15-approved-logo:visible').count(),1,label+' real SVG logo missing');
   await page.waitForFunction(()=>{const logo=document.querySelector('.bc15-approved-logo');return logo?.complete&&logo.naturalWidth>0;},null,{timeout:10000});
   const logoLoaded=await home.locator('.bc15-approved-logo').evaluate(el=>el.complete&&el.naturalWidth>0);
   assert.equal(logoLoaded,true,label+' logo must load from the real Læria UI asset, not a broken image URL');
   assert.equal(await home.locator('.bc15-subject-signs button:visible').count(),4,label+' four visible sign buttons missing');
   assert.equal(await home.locator('.bc12-journey:visible').count(),1,label+' visible journey button missing');
   assert.equal(await home.locator('.bc12-nav button:visible').count(),5,label+' visible real navigation missing');
   const polish=await home.evaluate(el=>{
     const nav=el.querySelector('.bc12-nav'),buttons=[...nav.querySelectorAll('button')];
     const journey=el.querySelector('.bc12-journey');
     return {
       navImage:getComputedStyle(nav).backgroundImage,
       artMask:getComputedStyle(el,'::after').webkitMaskImage,
       buttons:buttons.map(b=>({shadow:getComputedStyle(b).boxShadow,
         border:getComputedStyle(b).borderTopWidth,background:getComputedStyle(b).backgroundColor})),
       journeySmall:getComputedStyle(journey.querySelector('small')).display,
       journeySpan:getComputedStyle(journey.querySelector('span')).display,
       journeySpanArt:getComputedStyle(journey.querySelector('span')).backgroundImage,
       journeySpanBorder:getComputedStyle(journey.querySelector('span')).borderTopWidth
     };
   });
   assert.match(polish.navImage,/gradient/,label+' approved UI needs a single warm navigation rail');
   assert.equal(polish.artMask,'none',label+' clean full-bleed art must not inherit painted-master edge masks');
   assert(polish.buttons.every(b=>b.shadow==='none'&&b.border==='0px'),
     label+' five freestanding dashboard cards must not return: '+JSON.stringify(polish.buttons));
   assert.equal(polish.journeySmall,'none',label+' extra destination card must not be pasted below journey sign');
   assert.equal(polish.journeySpan,'flex',label+' journey sign label must be visible');
   assert.equal(polish.journeySpanArt,'none',label+' inherited Basecamp inner plaque overlays the only journey sign');
   assert.equal(polish.journeySpanBorder,'0px',label+' inherited Basecamp inner border draws a second sign');

   const targets=await home.locator('.bc15-subject-signs button').evaluateAll(xs=>xs.map(x=>x.getBoundingClientRect().height));
   assert(targets.every(h=>h>=44),label+' sign touch targets too small '+targets);
   assert.equal(await home.getAttribute('data-bc15-fit'),'approved-cover',
     label+' approved 3:4 art must fill a supported iPad without synthetic sidebars');
   const geometry=await home.evaluate(el=>{
     const cs=getComputedStyle(el),n=prop=>parseFloat(cs.getPropertyValue(prop));
     return {viewportW:el.clientWidth,viewportH:el.clientHeight,
       artW:n('--bc15-art-width'),artH:n('--bc15-art-height'),
       artX:n('--bc15-art-left'),artY:n('--bc15-art-top')};
   });
   assert(geometry.artW>=geometry.viewportW-.75&&geometry.artH>=geometry.viewportH-.75,
     label+' approved portrait must cover the entire viewport: '+JSON.stringify(geometry));
   assert(geometry.artX<=1&&geometry.artY<=1,
     label+' approved image must be centered, not letterboxed: '+JSON.stringify(geometry));
   await page.screenshot({path:folder+'/'+label+'.png',fullPage:true});
  }
  await context.close();
 }finally{await browser.close();}
}

// Test-only mock: there is STILL no production landscape image on this branch.
// The mock is never copied under assets/, and is rejected when its SHA differs.
async function runLandscapeMasterFixture(engine,label,broken=false,viewport={width:1180,height:820}){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.__LARIA_QA_SKIP_V16=true;});
  await page.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed);
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="1536"><rect width="100%" height="100%" fill="#246b77"/><text x="90" y="180" font-size="60" fill="white">TEST FIXTURE ONLY / NOT APPROVED ART</text></svg>';
  const sha=crypto.createHash('sha256').update(svg).digest('hex');
  const ui=ownerCatalog.landscape.ui;
  const manifest={status:'approved',source:'./assets/home-v15/__test-only-landscape-master.webp',
    sha256:broken?'0'.repeat(64):sha,width:2048,height:1536,ui};
  await page.route('**/assets/home-v15/grovanova-ipad-landscape-master.json',
    route=>route.fulfill({contentType:'application/json',body:JSON.stringify(manifest)}));
  await page.route('**/assets/home-v15/__test-only-landscape-master.webp',
    route=>route.fulfill({contentType:'image/svg+xml',body:svg}));
  await page.goto((process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria')+'&landscape-fixture='+label,
    {waitUntil:'domcontentloaded'});
  const home=page.locator('.bc12.bc15-locked-home');
  await home.waitFor({state:'visible',timeout:20000});
  const expected=broken?'tablet-ready':'ipad-landscape-approved';
  await page.waitForFunction(expected=>document.querySelector('#home-screen .bc12')?.dataset.bc15Asset===expected,
    expected,{timeout:15000});
  if(broken){
   assert.equal(await home.getAttribute('data-bc15-master'),'landscape');
   assert.equal(await home.locator('.bc15-approved-logo').count(),0,label+' fallback must never show approved logo overlay');
   assert.equal(await home.locator('.bc15-boats').count(),1,label+' locked landscape must keep its real rowboats');
  }else{
   assert.equal(await home.getAttribute('data-bc15-master'),'ipad-landscape-approved');
   assert.equal(await home.locator('.bc15-boats').count(),0,label+' approved landscape has no reviewed boat anchors');
   assert.equal(await home.locator('.bc15-approved-logo:visible').count(),1,label+' real SVG logo missing');
   await page.waitForFunction(()=>{const logo=document.querySelector('.bc15-approved-logo');return logo?.complete&&logo.naturalWidth>0;},null,{timeout:10000});
   const signs=home.locator('.bc15-subject-signs[data-bc15-presentation="live"] button:visible');
   assert.equal(await signs.count(),4,label+' four left wooden subject signs are required');
   const names=await signs.evaluateAll(elements=>elements.map(x=>x.querySelector('.bc15-sign-name')?.textContent));
   assert.deepEqual(names,['Norsk','Matte','Engelsk','Geografi']);
   const touchHeights=await signs.evaluateAll(elements=>elements.map(x=>x.getBoundingClientRect().height));
   assert(touchHeights.every(h=>h>=44),label+' subject signs are too small: '+touchHeights);
   assert.equal(await home.locator('.bc12-nav button:visible').count(),5,label+' native navigation must be present');
   assert.equal(await home.locator('.bc12-journey:visible').count(),1,label+' real journey action must be visible');
   const elements=await home.evaluate(el=>{
    const nav=el.querySelector('.bc12-nav'),journey=el.querySelector('.bc12-journey');
    const boards=[...el.querySelectorAll('.bc15-painted-subject')];
    const n=prop=>parseFloat(getComputedStyle(el).getPropertyValue(prop));
    return {nav:getComputedStyle(nav).backgroundImage,
      artMask:getComputedStyle(el,'::after').webkitMaskImage,
      journeyText:getComputedStyle(journey.querySelector('span')).display,
      journeyExtra:getComputedStyle(journey.querySelector('small')).display,
      journeyTextBackground:getComputedStyle(journey.querySelector('span')).backgroundImage,
      journeyTextBorder:getComputedStyle(journey.querySelector('span')).borderTopWidth,
      signLabels:boards.map(x=>getComputedStyle(x.querySelector('.bc15-sign-name')).display),
      dimensions:{w:el.clientWidth,h:el.clientHeight,artW:n('--bc15-art-width'),artH:n('--bc15-art-height')}};
   });
   assert.match(elements.nav,/gradient/,label+' navigation must use one shared background');
   assert.equal(elements.artMask,'none',label+' approved landscape must not inherit painted art edge fades');
   assert.equal(elements.journeyText,'flex');
   assert.equal(elements.journeyExtra,'none',label+' duplicate journey sticker');
   assert.equal(elements.journeyTextBackground,'none',label+' legacy nested wooden sign must be transparent');
   assert.equal(elements.journeyTextBorder,'0px',label+' duplicate sign border must be absent');
   assert(elements.signLabels.every(x=>x!=='none'),label+' live wooden signs are invisible');
   assert(elements.dimensions.artW>=elements.dimensions.w-.5&&elements.dimensions.artH>=elements.dimensions.h-.5,
     label+' approved landscape art must fill the iPad without letterboxing');
   assert.equal(await home.getAttribute('data-bc15-fit'),'approved-cover');
   await page.screenshot({path:folder+'/'+label+'.png',fullPage:true});
  }
  assert.deepEqual(errors,[],label+' page JavaScript errors');
  await context.close();
 }finally{await browser.close()}
}

// Real WebP approval smoke. This does NOT alter either production manifest.
// Once the exact owner-approved binary files are staged in the PR, Chromium and
// WebKit show the real pictures with real DOM controls. Prior to import this
// prints ART_PENDING, never claiming an illustrated screenshot passed.
const ownerCatalog=JSON.parse(fs.readFileSync('docs/LARIA-GROVANOVA-APPROVED-CANDIDATES-2026-11-18.json','utf8'));
function stagedArtReady(){
 const orientations=['portrait','landscape'];
 const present=orientations.map(key=>fs.existsSync(ownerCatalog[key].path));
 if(!present.some(Boolean)){
  console.log('[Grovanova] ART_PENDING: both approved WebPs are absent from GitHub. Only test fixtures are rendered.');
  return false;
 }
 assert(present.every(Boolean),'The two owner-approved WebPs must be staged together, never only one');
 for(const orientation of orientations){
  const item=ownerCatalog[orientation];
  const bytes=fs.readFileSync(item.path);
  const sha=crypto.createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha,item.sha256,orientation+' exact owner-approved bytes changed');
 }
 return true;
}
async function runOwnerArtScreenshot(engine,label,orientation,broken=false){
 const item=ownerCatalog[orientation];
 const portrait=orientation==='portrait';
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 try{
  const viewport=portrait?{width:1024,height:1366}:{width:1180,height:820};
  const context=await browser.newContext({viewport,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{window.__LARIA_QA_SKIP_V16=true;});
  await page.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed);
  const manifest={status:'approved',
    source:'./assets/home-v15/'+path.basename(item.path),
    sha256:broken?'0'.repeat(64):item.sha256,
    width:item.width,height:item.height,ui:item.ui};
  await page.route('**/assets/home-v15/grovanova-ipad-'+orientation+'-master.json',
    route=>route.fulfill({contentType:'application/json',body:JSON.stringify(manifest)}));
  await page.goto((process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria')+
    '&owner-art-review='+label,{waitUntil:'domcontentloaded'});
  const home=page.locator('.bc12.bc15-locked-home');
  await home.waitFor({state:'visible',timeout:20000});
  await page.waitForFunction(expected=>document.querySelector('#home-screen .bc12')?.dataset.bc15Asset===expected,
    broken?(portrait?'phone-ready':'tablet-ready'):'ipad-'+orientation+'-approved',{timeout:20000});
  if(broken){
   assert.equal(await home.locator('.bc15-approved-logo').count(),0,label+' art fallback must remove standalone logo');
   assert.equal(await home.getAttribute('data-bc15-master'),portrait?'portrait':'landscape');
  }else{
   assert.equal(await home.getAttribute('data-bc15-card-art'),'owner-approved-ui-free');
   assert.equal(await home.locator('.bc15-boats').count(),0,label+' no reused boat coordinates on new art');
   assert.equal(await home.locator('.bc15-approved-logo:visible').count(),1,label+' standalone Læria logo missing');
   await page.waitForFunction(()=>{const logo=document.querySelector('.bc15-approved-logo');return logo?.complete&&logo.naturalWidth>0;},null,{timeout:10000});
   assert.equal(await home.locator('.bc15-subject-signs[data-bc15-presentation="live"] button:visible').count(),4,
     label+' genuine independent wooden subject signs missing');
   const signSizes=await home.locator('.bc15-subject-signs button').evaluateAll(buttons=>
     buttons.map(b=>({w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height})));
   assert(signSizes.every(v=>v.h>=44&&v.w>=44),label+' 44px touch-target failure '+JSON.stringify(signSizes));
   assert.equal(await home.locator('.bc12-nav button:visible').count(),5,label+' real bottom/top navigation missing');
   assert.equal(await home.locator('.bc12-journey:visible').count(),1,label+' journey sign missing');
   assert.equal(await home.getAttribute('data-bc15-fit'),'approved-cover',label+' approved image letterboxed');
   const layout=await home.evaluate(el=>{
     const style=getComputedStyle(el),n=k=>parseFloat(style.getPropertyValue(k));
     return {vw:el.clientWidth,vh:el.clientHeight,aw:n('--bc15-art-width'),
       ah:n('--bc15-art-height'),bg:el.style.getPropertyValue('--bc15-home-art'),
       navigation:getComputedStyle(el.querySelector('.bc12-nav')).backgroundImage,
       extraJourney:getComputedStyle(el.querySelector('.bc12-journey small')).display};
   });
   assert(layout.aw>=layout.vw-.75&&layout.ah>=layout.vh-.75,
     label+' landscape crop/sizing leaves empty strips: '+JSON.stringify(layout));
   assert.match(layout.bg,/blob:/,label+' displayed art is not SHA-verified bytes');
   assert.match(layout.navigation,/gradient/,label+' one native navigation rail missing');
   assert.equal(layout.extraJourney,'none',label+' duplicate journey sticker returned');
   await page.screenshot({path:folder+'/'+label+'.png',fullPage:true});
   console.log('[Grovanova] REAL_ART_SCREENSHOT '+label+' '+JSON.stringify(layout));
  }
  assert.deepEqual(errors,[],label+' JS console exceptions');
  await context.close();
 }finally{await browser.close()}
}

(async()=>{
 verifyLockedMasterFiles();
 for(const [label,engine,viewport] of [
   ['chromium-iphone',chromium,{width:390,height:844}],
   ['safari-iphone',webkit,{width:390,height:844}],
   ['safari-ipad',webkit,{width:820,height:1180}],
   ['safari-ipad-pro',webkit,{width:1024,height:1366}],
   ['safari-ipad-landscape',webkit,{width:1180,height:820}]
 ].filter(([label])=>process.env.LARIA_IPAD_ONLY!=='1'||label.includes('ipad')))
  await run(engine,label,viewport);
 for(const [label,engine] of [['chromium-ipad-portrait-fixture',chromium],['webkit-ipad-portrait-fixture',webkit]]){
  await runPortraitMasterFixture(engine,label,false);
  await runPortraitMasterFixture(engine,label+'-fallback',true);
  // iPad Air/Mini-like portrait 820x1180 is narrower than 3:4 master.
  // Verify restrained cover rather than stretching or top-edge letterboxing.
  await runPortraitMasterFixture(engine,label+'-820x1180',false,{width:820,height:1180});
 }
 for(const [label,engine] of [['chromium-ipad-landscape-fixture',chromium],['webkit-ipad-landscape-fixture',webkit]]){
  await runLandscapeMasterFixture(engine,label,false);
  await runLandscapeMasterFixture(engine,label+'-sha-fallback',true);
  await runLandscapeMasterFixture(engine,label+'-1024x768',false,{width:1024,height:768});
 }
 if(stagedArtReady()){
  for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
   for(const orientation of ['portrait','landscape']){
    const label=engineName+'-owner-approved-'+orientation;
    await runOwnerArtScreenshot(engine,label,orientation,false);
    await runOwnerArtScreenshot(engine,label+'-sha-fallback',orientation,true);
   }
  }
 }
})().catch(e=>{console.error(e);process.exitCode=1});
