'use strict';
/* Real WebKit/Chromium QA for the independent Finn ordene image discovery activity.
 * Runs with the actual app, selected profile fox, local SVG and five equal-status Utforsk cards.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'..');
const dir=process.env.FIND_WORDS_SCREENSHOTS||'/tmp/laria-find-words';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
 '.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json'};
const targetWords=['sol','tre','telt','vann','rev','sekk'];
function seed(avatar){return {version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'Eventyrbarn',avatar,setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
 masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
 lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};}
function serve(){return new Promise((resolve,reject)=>{
 const server=http.createServer((req,res)=>{
  let file=new URL(req.url,'http://127.0.0.1').pathname;
  file=decodeURIComponent(file);
  if(file.endsWith('/'))file+='index.html';
  file=path.resolve(root,'.'+file);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
  fs.readFile(file,(err,buf)=>{if(err){res.writeHead(404);res.end('Not found');return}
   res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
   res.setHeader('Cache-Control','no-store');res.end(buf);
  });
 });
 server.once('error',reject);
 server.listen(0,'127.0.0.1',()=>resolve({server,url:'http://127.0.0.1:'+server.address().port+'/laer-litt-mer/?app=laria'}));
})}
async function shot(page,name){fs.mkdirSync(dir,{recursive:true});await page.screenshot({path:path.join(dir,name+'.png'),animations:'disabled',fullPage:false});}
async function open(page,url,label){
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>typeof window.openFindTheWords==='function'&&document.querySelector('.bc12-nav [data-camp="explore"]'),{},{timeout:30000});
 await page.locator('.bc12-nav [data-camp="explore"]').click();
 const panel=page.locator('.bc13-panel:not([hidden])');
 await panel.waitFor();
 assert.equal(await panel.locator('.bc13-card').count(),5,'Picture hunt must be a fifth, equal-size illustrated Utforsk card');
 const sizes=await panel.locator('.bc13-card').evaluateAll(cards=>cards.map(c=>{
   const r=c.getBoundingClientRect();return {w:r.width,h:r.height};
 }));
 assert.ok(sizes.every(x=>Math.abs(x.w-sizes[0].w)<=2&&Math.abs(x.h-sizes[0].h)<=2),
   'All five card surfaces must have equal dimensions: '+JSON.stringify(sizes));
 const entry=panel.locator('[data-bc13-action="find-words"]');
 assert.ok(await entry.isVisible(),'Find-the-words illustrated card must be visible');
 await shot(page,label+'-explore-five-cards');
 await entry.scrollIntoViewIfNeeded();
 await shot(page,label+'-explore-fifth-card');
 const picture=entry.locator('img.bc13-premium-art');
 await picture.evaluate(img=>img.decode());
 const photoMetrics=await picture.evaluate(img=>({w:img.naturalWidth,h:img.naturalHeight}));
 assert.ok(photoMetrics.w>=240&&photoMetrics.h>=120,'The premium forest art did not load: '+JSON.stringify(photoMetrics));
 assert.equal(await entry.locator('.bc13-find-lens').count(),1,'The card has lost its distinctive search illustration');
 const dims=await entry.boundingBox();
 assert.ok(dims&&dims.width>=44&&dims.height>=44,'New picture hunt entry must be touch accessible');
 await entry.click();
 await page.locator('#find-the-words-overlay:not([hidden])').waitFor();
 assert.equal(await page.locator('.fw-active-target').innerText(),'1. Velg et ord',
   'The first picture-hunt step must be numbered 1 before selection');
 assert.equal(await page.locator('#find-the-words-overlay .fw-back').getAttribute('aria-label'),'Tilbake til Utforsk',
   'Finn ordene entered from Utforsk must name its actual back destination');
}
async function geometry(page,label,view){
 const box=await page.evaluate(()=>{
  const bounds=s=>{const x=document.querySelector(s)?.getBoundingClientRect();return x?{x:x.x,y:x.y,w:x.width,h:x.height,b:x.bottom}:null};
  const el=document.querySelector('.fw-art');
  const img=document.querySelector('.fw-scene-image');
  return {screen:innerWidth,height:innerHeight,scroll:document.documentElement.scrollWidth,
   art:bounds('.fw-art'),picture:bounds('.fw-picture'),paint:bounds('.fw-scene-image'),list:bounds('.fw-list'),back:bounds('.fw-back'),hint:bounds('.fw-fox-button'),next:bounds('.fw-next'),
   scene:{w:img.naturalWidth,h:img.naturalHeight,complete:img.complete},
   words:[...document.querySelectorAll('.fw-word')].map(x=>x.getBoundingClientRect().height),
    wordFonts:[...document.querySelectorAll('.fw-word strong')].map(x=>parseFloat(getComputedStyle(x).fontSize)),
   hotspot:[...document.querySelectorAll('.fw-object')].map(x=>{const r=x.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {id:x.dataset.fwObject,w:r.width,h:r.height,centerReachable:hit===x||x.contains(hit)};}),
   longWord:(()=>{
     const word=document.querySelector('.fw-word[data-fw-read="sommerfugl"] strong');
     if(!word)return null;
     const r=word.getBoundingClientRect(),marker=word.closest('button').querySelector('.fw-word-check').getBoundingClientRect();
     return {height:r.height,lineHeight:parseFloat(getComputedStyle(word).lineHeight),right:r.right,checkLeft:marker.left};
   })(),
   paintedPoints:(()=>{
      // Coordinates of the pictured objects at the original 1200×720 artwork ratio.
      // Check the real visible painted point, not simply the HTML button centre.
      const garden=document.querySelector('.fw-scene-image').getAttribute('src').includes('find-the-words-garden');
      const points=garden?
        {eple:[.17,.15],ugle:[.29,.23],sommerfugl:[.56,.15],lykt:[.37,.32],
         bro:[.48,.58],sopp:[.78,.81],bok:[.18,.76],pinnsvin:[.93,.78]}:
        {sol:[.905,.17],tre:[.22,.395],telt:[.865,.745],vann:[.635,.64],
         rev:[.685,.82],sekk:[.255,.815],bat:[.545,.84],fugl:[.765,.455]};
      const picture=document.querySelector('.fw-picture').getBoundingClientRect();
      return Object.entries(points).map(([id,[x,y]])=>{
       const hit=document.elementFromPoint(picture.left+picture.width*x,picture.top+picture.height*y);
       return {id,hit:hit?.closest?.('[data-fw-object]')?.dataset?.fwObject||null};
      });
    })(),
   active:el?.getAttribute('role')};
 });
 assert.ok(box.art&&box.picture&&box.paint&&box.list&&box.hint&&box.back,'picture game missing the aligned painted scene or accessible hint '+label);
 assert.ok(Math.abs(box.picture.w/box.picture.h-5/3)<.01,
   'The interactive plane does not match the SVG native 1200:720 geometry '+label+': '+JSON.stringify(box.picture));
 assert.ok(Math.abs(box.picture.w-box.paint.w)<2&&Math.abs(box.picture.h-box.paint.h)<2,
   'Illustration and tap targets use different visible pixel bounds '+label+': '+JSON.stringify(box));
 assert.deepEqual(box.paintedPoints.filter(x=>x.id!==x.hit),[],
   'A painted object is not reachable at the point where the child sees it '+label+': '+JSON.stringify(box.paintedPoints));
 if(box.longWord){
  assert.ok(box.longWord.height<=box.longWord.lineHeight*1.2,
   'Norwegian word sommerfugl wrapped into fragments '+label+': '+JSON.stringify(box.longWord));
  assert.ok(box.longWord.right<=box.longWord.checkLeft+1,
   'The complete written word overlaps the tick control '+label+': '+JSON.stringify(box.longWord));
 }
 if(view.width>=1001&&view.height>=700&&view.height<=900){
  assert.ok(box.next&&box.next.b<=box.height+2&&box.hint.b<=box.height+2,
   'Hint or next adventure is clipped below iPad landscape first fold '+label+': '+JSON.stringify(box));
 }
 const gardenScene=label.includes('secret-garden');
 assert.ok(box.scene.complete&&
   (gardenScene?(box.scene.w===480&&box.scene.h===288):(box.scene.w===1200&&box.scene.h===720)),
   'illustrated scene failed '+label+': '+JSON.stringify(box.scene));
 assert.ok(box.scroll<=box.screen+3,'horizontal overflow '+label+': '+JSON.stringify(box));
 assert.ok(box.art.x>=-2&&box.art.x+box.art.w<=box.screen+3,'art clipped horizontally '+label);
 assert.equal(box.hotspot.length,8,'Each illustrated world must expose exactly eight tappable objects '+label);
 assert.ok(box.hotspot.every(b=>b.w>=44&&b.h>=44),'child targets too small '+label+': '+JSON.stringify(box.hotspot));
 assert.ok(box.hotspot.every(b=>b.centerReachable),'overlapping hotspots prevent children from finding an object '+label+': '+JSON.stringify(box.hotspot));
 assert.ok(box.words.every(h=>h>=39),'word-list buttons too small '+label+': '+JSON.stringify(box.words));
  if(view.width<=360)assert.ok(box.wordFonts.every(size=>size>=16),
   'Words must remain at least 16px even on the smallest supported iPhone: '+JSON.stringify(box.wordFonts));
 if(view.width>=701&&view.width<=1000&&view.height>view.width){
  assert.ok(box.art.w>=view.width*.83,'iPad portrait art should occupy most of its width: '+JSON.stringify(box));
  assert.ok(box.art.h>=view.height*.32,'iPad portrait art must not be a tiny side card: '+JSON.stringify(box));
  assert.ok(box.art.b<=box.height+2,'iPad portrait art must remain on first screen: '+JSON.stringify(box));
 }
 if(view.width>=361&&view.width<=700&&view.height>=750){
  assert.ok(box.picture.h>=205,'Tall phone illustration too small to see and touch: '+JSON.stringify(box));
   assert.ok(box.wordFonts.every(n=>n>=18),'Tall phone words must be readable at 18px or larger: '+JSON.stringify(box.wordFonts));
  assert.ok(box.hint.w>=44&&box.hint.h>=44,'The hint button is too small: '+JSON.stringify(box));
  assert.ok(box.hint.b<=box.height+2,'Hint is below the phone viewport: '+JSON.stringify(box));
 }
 if(view.height>=750&&view.width<700){
  assert.ok(box.list.y>=0&&box.list.b<=box.height,'word list hidden below first screen '+label);
  assert.ok(box.art.y>=0&&box.art.y<=box.height-80,'image cannot be seen without scrolling '+label);
 }
}
async function dragWord(page,word,targetSelector){
 const from=await page.locator('.fw-word[data-fw-read="'+word+'"]').boundingBox();
 const to=await page.locator(targetSelector).boundingBox();
 assert.ok(from&&to,'Cannot locate word tile and destination for pointer drag: '+word);
 const start={x:from.x+from.width/2,y:from.y+from.height/2};
 const end={x:to.x+to.width/2,y:to.y+to.height/2};
 await page.mouse.move(start.x,start.y);
 await page.mouse.down();
 await page.mouse.move(end.x,end.y,{steps:12});
 await page.mouse.up();
}
async function run(engine,label,viewport,url,avatar){
 const browser=await engine.launch({headless:true,args:label.startsWith('chromium')?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport,hasTouch:true,isMobile:viewport.width<701,serviceWorkers:'block',reducedMotion:'reduce'});
  await context.addInitScript(p=>localStorage.setItem('laerlittmer-v2',JSON.stringify(p)),seed(avatar));
  const page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(String(err)));
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  try{
   await open(page,url,label);
   await page.locator('.fw-scene-image').evaluate(img=>img.decode());
   await geometry(page,label,viewport);
   assert.equal(await page.locator('.fw-fox').evaluate(el=>el.tagName),'SPAN',
     'Retired static fox artwork is still in Finn ordene');
   assert.equal(await page.locator('.fw-fox-button').getAttribute('aria-label'),'Få et hint',
     'The new hint control lost its accessible label');
   assert.equal(await page.locator('.fw-word').count(),6);
   assert.deepEqual((await page.locator('.fw-word strong').allTextContents()).sort(),[...targetWords].sort());
   // Correct objects do not score until a written word has been selected.
   await page.locator('.fw-object[data-fw-object="sol"]').click();
   assert.equal(await page.locator('.fw-word.is-found').count(),0,
     'Random scene taps must not award a word');
   assert.match(await page.locator('.fw-speech').innerText(),/Velg et ord/);
   assert.equal(await page.locator('.fw-hint').count(),0,
     'Finn ordene must have one, not two, child-facing hint controls');
   const hint=page.locator('.fw-fox-button');
   assert.equal(await hint.count(),1,'One usable magical hint control must remain');
   assert.match(await page.locator('.fw-next').innerText(),/Nye ord/,
     'Next round must not be confused with the separate Ordjakt activity');
   await hint.click();
   assert.match(await page.locator('.fw-speech').innerText(),/Velg først ordet/,
     'Hints must target the selected word, not an automatic answer');
   // CI has no guaranteed Norwegian audio output, but speech controls must
   // remain usable without Javascript errors.
   await page.locator('.fw-word[data-fw-read="sol"]').click();
   assert.equal(await page.locator('.fw-word.is-selected').count(),1,'Selected word is not visibly marked');
   assert.equal(await page.locator('.fw-word[data-fw-read="sol"]').getAttribute('aria-pressed'),'true',
     'Selected word is missing an accessible selected state');
   assert.equal(await page.locator('.fw-active-target').innerText(),'2. Finn «sol» i bildet',
     'Selecting a word must advance the picture-hunt prompt to step 2');
   await page.locator('.fw-audio').click();
   await hint.click();
   assert.match(await page.locator('.fw-speech').innerText(),/Se etter/,
     'First hint did not give the selected-word clue');
   await hint.click();
   assert.equal(await page.locator('.fw-object.is-hint').count(),1,'Second hint should highlight the selected object');
   assert.equal(await page.locator('.fw-fx .fw-target-flower[data-fx-object="sol"]').count(),1,
    'Fox second hint must point inside the illustrated scene');
   assert.equal(await page.locator('.fw-fx').evaluate(el=>getComputedStyle(el).pointerEvents),'none',
    'Fox effects must not intercept taps on illustrated objects');
   const sunTap=await page.evaluate(()=>{
    const b=document.querySelector('[data-fw-object="sol"]').getBoundingClientRect();
    return document.elementFromPoint(b.left+b.width/2,b.top+b.height/2)?.closest?.('[data-fw-object]')?.dataset?.fwObject||null;
   });
   assert.equal(sunTap,'sol','Guide glow blocks the real sun touch area');
   assert.equal(await page.locator('.fw-word.is-found').count(),0,'Hint must not automatically solve the game');
   if(viewport.width<=360){
     const title=await page.locator('.fw-title h1').evaluate(el=>{
       const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:innerHeight};
     });
     assert.ok(title.top>=-1&&title.bottom<=title.height,
       'Selecting a word must not auto-scroll away the title on a compact iPhone: '+JSON.stringify(title));
   }
   // The first screen must retain the title after word selection and fox hints.
   // On an overflowing iPad landscape WebKit may auto-scroll the header away.
   const headerFold=await page.locator('.fw-title h1').evaluate(el=>{
    const r=el.getBoundingClientRect();
    return {top:r.top,bottom:r.bottom,viewport:innerHeight};
   });
   assert.ok(headerFold.top>=-1&&headerFold.bottom<=headerFold.viewport+1,
    'Asking the fox for help hid the game title '+label+': '+JSON.stringify(headerFold));
   await shot(page,label+'-chosen-word-hint');
   // An illustrated object not in the current word list should be explored, not punished.
   // A touch on water must hit the painted lake, not the grassy lower bank.
   const lakePoint=await page.evaluate(()=>{
     const stage=document.querySelector('.fw-picture').getBoundingClientRect();
     const water=document.querySelector('[data-fw-object="vann"]').getBoundingClientRect();
     return {x:(water.left+water.width*.5-stage.left)/stage.width,
       y:(water.top+water.height*.5-stage.top)/stage.height};
   });
   assert.ok(lakePoint.x>.59&&lakePoint.x<.75&&lakePoint.y>.60&&lakePoint.y<.76,
     'Water hotspot drifted away from the open lake: '+JSON.stringify(lakePoint));
   await page.locator('.fw-object[data-fw-object="fugl"]').click();
   assert.match(await page.locator('.fw-speech').innerText(),/Ikke helt/,
     'Wrong word-object pairing must give gentle corrective feedback');
   assert.equal(await page.locator('.fw-fx .fw-try-ring[data-fx-object="fugl"]').count(),1,
    'Wrong guess must show a brief gentle ripple at the pictured object');
   assert.equal(await page.locator('.fw-word.is-selected').count(),0,
     'A wrong pairing must require the child to select a word again');
   assert.equal(await page.locator('.fw-word.is-found').count(),0,'Wrong pairing awarded progress');
   await page.locator('.fw-object[data-fw-object="sol"]').click();
   assert.equal(await page.locator('.fw-word.is-found').count(),0,
     'A correct scene object without a chosen word still earned progress');
   for(const word of targetWords){
    await page.locator('.fw-word[data-fw-read="'+word+'"]').click();
    assert.equal(await page.locator('.fw-word.is-selected').count(),1,'Word selection missing: '+word);
    await page.locator('.fw-object[data-fw-object="'+word+'"]').click();
    assert.equal(await page.locator('.fw-word.is-selected').count(),0,
      'Chosen word stayed selected after it was found: '+word);
    assert.equal(await page.locator('.fw-word.is-found').count(),targetWords.indexOf(word)+1,
      'Correct chosen word-object pair did not mark progress: '+word);
    if(word==='sol'){
     assert.equal(await page.locator('.fw-fx .fw-success-burst[data-fx-object="sol"]').count(),1,
      'Successful match must celebrate at the found item in the picture');
     await shot(page,label+'-object-discovery');
    }
   }
   assert.ok(await page.locator('#find-the-words-overlay').evaluate(el=>el.classList.contains('fw-complete')),
    'Round did not complete');
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('laria-find-words-v1')).rounds),1,
    'Picture round incorrectly counted');

   // The large accessible tree hotspot may extend beyond foliage; its found
   // stamp must still sit on the visible canopy rather than floating in sky.
   const treeStamp=await page.evaluate(()=>{
     const scene=document.querySelector('.fw-picture').getBoundingClientRect();
     const p=document.querySelector('[data-fw-object="tre"] .fw-pin').getBoundingClientRect();
     return (p.top+p.height/2-scene.top)/scene.height;
   });
   assert.ok(treeStamp>.25&&treeStamp<.55,'Tree success marker floats outside the canopy: '+treeStamp);
   await shot(page,label+'-all-found');
   await page.locator('.fw-back').click();
   await page.locator('.bc13-panel:not([hidden]) [data-bc13-action="find-words"]').waitFor();
   assert.equal(await page.locator('#find-the-words-overlay:not([hidden])').count(),0,'Picture mode did not close');
   assert.equal(await page.locator('.fw-fx').locator('*').count(),0,'Fox trail remained after closing the game');
   assert.equal(await page.evaluate(()=>document.documentElement.style.overflow),'','Scroll was left locked');
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>typeof window.openFindTheWords==='function');
   await page.locator('.bc12-nav [data-camp="explore"]').click();
   await page.locator('.bc13-panel:not([hidden]) [data-bc13-action="find-words"]').click();
   assert.equal(await page.locator('.fw-word.is-found').count(),6,'Picture word progress was lost on reload');
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('laria-find-words-v1')).rounds),1);
   await page.locator('.fw-next').click();
   // Original indices 0, 1 and 2 remain unchanged for all existing saves.
   // New adventures alternate, presenting a genuinely DIFFERENT painted world.
   const gardenImage=page.locator('.fw-scene-image');
   await gardenImage.evaluate(img=>img.decode());
   assert.match(await gardenImage.getAttribute('src'),/find-the-words-garden-premium\.webp/,
     'The next adventure must have its own illustrated garden');
   assert.equal(await page.locator('.fw-word.is-found').count(),0,'Garden progress did not begin cleanly');
   assert.deepEqual((await page.locator('.fw-word strong').allTextContents()).sort(),
     ['sommerfugl','bok','eple','ugle','bro','sopp'].sort(),
     'New discovery environment reused the previous word list');
   assert.equal(await page.locator('.fw-object[data-fw-object="sol"]').count(),0,
     'Old forest hotspots leaked into the second scene');
   await geometry(page,label+'-secret-garden',viewport);
   await shot(page,label+'-secret-garden-first-look');

   // Wrong word on a valid object, genuine Pointer Events drag, and the
   // child-friendly drag->tap fallback must all work in the new world too.
   await dragWord(page,'sommerfugl','.fw-object[data-fw-object="eple"]');
   assert.equal(await page.locator('.fw-word.is-found').count(),0,
     'Wrong garden drag incorrectly awarded a word');
   assert.equal(await page.locator('.fw-word.is-selected').count(),0,
     'Wrong garden drag must clear the selection');
   await dragWord(page,'sommerfugl','.fw-object[data-fw-object="sommerfugl"]');
   assert.equal(await page.locator('.fw-word[data-fw-read="sommerfugl"].is-found').count(),1,
     'Correct butterfly drag was not recognized');
   assert.equal(await page.locator('.fw-drag-ghost').count(),0,'Drag ghost remained in new garden');
   await dragWord(page,'bok','.fw-stage-label');
   assert.equal(await page.locator('.fw-word.is-found').count(),1,
     'Dragging a book to empty space must not award progress');
   assert.equal(await page.locator('.fw-word[data-fw-read="bok"]').getAttribute('aria-pressed'),'true',
     'Unsuccessful garden drag must leave the word selected');
   await page.locator('.fw-object[data-fw-object="bok"]').click();
   assert.equal(await page.locator('.fw-word.is-found').count(),2,
     'Chosen garden book was not found with an ordinary tap');
   await shot(page,label+'-secret-garden-drag-matching');

   await page.locator('.fw-word[data-fw-read="ugle"]').click();
   await page.locator('.fw-back').click();
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>typeof window.openFindTheWords==='function');
   await page.locator('.bc12-nav [data-camp="explore"]').click();
   await page.locator('.bc13-panel:not([hidden]) [data-bc13-action="find-words"]').click();
   assert.match(await page.locator('.fw-scene-image').getAttribute('src'),/find-the-words-garden-premium\.webp/,
     'The child did not return to their saved garden');
   assert.equal(await page.locator('.fw-word[data-fw-read="ugle"]').getAttribute('aria-pressed'),'true',
     'Garden-selected word was lost on reload');
   assert.equal(await page.locator('.fw-word.is-found').count(),2,
     'Two garden discoveries were lost on reload');

   for(const word of ['eple','ugle','bro','sopp']){
    await page.locator('.fw-word[data-fw-read="'+word+'"]').click();
    await page.locator('.fw-object[data-fw-object="'+word+'"]').click();
   }
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('laria-find-words-v1')).rounds),2,
     'Completing two separate adventures must record two rounds');
   await shot(page,label+'-secret-garden-complete');
   await page.locator('.fw-next').click();
   assert.match(await page.locator('.fw-scene-image').getAttribute('src'),/find-the-words-scene\.svg/,
     'Adventure sequence did not alternate back to Bokskogen');
   assert.equal(await page.locator('.fw-word[data-fw-read="fugl"]').count(),1,
     'Original second forest word list changed after the new garden');

   // Legacy v1 save compatibility: keep the child's exact old forest round.
   await page.locator('.fw-back').click();
   await page.evaluate(()=>localStorage.setItem('laria-find-words-active-v1',
     JSON.stringify({version:1,round:1,found:['fugl'],completed:false,selected:'bat'})));
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>typeof window.openFindTheWords==='function');
   await page.locator('.bc12-nav [data-camp="explore"]').click();
   await page.locator('.bc13-panel:not([hidden]) [data-bc13-action="find-words"]').click();
   assert.equal(await page.locator('.fw-word[data-fw-read="bat"]').getAttribute('aria-pressed'),'true',
     'Old selected word did not survive new version of the game');
   assert.equal(await page.locator('.fw-word[data-fw-read="fugl"].is-found').count(),1,
     'Legacy found-word progress got lost');
   await page.locator('.fw-back').click();
   // The separate 6x6 letter-grid mode and its five themes remain available.
   await page.locator('.bc13-panel:not([hidden]) .bc13-card[data-bc13-action="words"]').click();
   const old=page.locator('.word-hunt-theme-picker:not([hidden])');
   await old.waitFor();
   assert.equal(await old.locator('.wh-theme-card').count(),5,'Existing Ordjakt themes regressed');
   assert.deepEqual(errors,[],'Runtime error in '+label);
   console.log('PASS Finn ordene '+label+' '+avatar+' '+viewport.width+'x'+viewport.height);
  }finally{await context.close()}
 }finally{await browser.close()}
}
(async()=>{
 const {server,url}=await serve();
 try{
  await run(chromium,'chromium-ipad-landscape',{width:1180,height:820},url,'girl');
  await run(webkit,'webkit-ipad',{width:820,height:1180},url,'girl');
  await run(webkit,'webkit-iphone',{width:390,height:844},url,'boy');
  await run(webkit,'webkit-small-iphone',{width:320,height:568},url,'girl');
  await run(webkit,'webkit-ipad-landscape',{width:1180,height:820},url,'boy');
 }finally{await new Promise(resolve=>server.close(resolve))}
 console.log('PASS all Læria picture-hunt matrices');
})().catch(err=>{console.error(err);process.exitCode=1});
