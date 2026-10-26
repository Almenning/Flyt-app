'use strict';
/* End-to-end premium Ordjakt themes in Chromium and WebKit.
 * Tests real navigation, cards, word picking, calm magic and existing book. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium,webkit}=require('playwright');
const themes=require('../laer-litt-mer/word-hunt-themes.js');
const root=path.resolve(__dirname,'..');
const out=process.env.WORD_HUNT_THEMES_SCREENSHOTS||'/tmp/laria-wordhunt-themes';
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.json':'application/json'};
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Elev',avatar:'girl',setupVersion:2},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
function serve(){return new Promise((resolve,reject)=>{
 const server=http.createServer((req,res)=>{
  let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname.endsWith('/'))pathname+='index.html';
  const file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end('Not Found');return}
   res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
   res.setHeader('Cache-Control','no-store');res.end(data);
  });
 });
 server.once('error',reject);
 server.listen(0,'127.0.0.1',()=>resolve({server,url:'http://127.0.0.1:'+server.address().port+'/laer-litt-mer/?app=laria'}));
})}
async function shot(page,name){fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,name+'.png'),animations:'disabled'});}
async function open(page,url){
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>typeof window.openWordHunt==='function'&&document.querySelector('.bc12-nav [data-camp="explore"]'),{},{timeout:30000});
 await page.locator('.bc12-nav [data-camp="explore"]').click();
 await page.locator('.bc13-panel:not([hidden]) .bc13-card[data-bc13-action="words"]').click();
 const first=page.locator('#word-hunt-overlay:not([hidden]) .word-hunt-theme-picker:not([hidden])');
 await first.waitFor();
 assert.equal(await first.locator('.wh-theme-card').count(),5,'Ordjakt must show all five topics on entry');
 assert.equal(await page.locator('.word-hunt-cell:visible').count(),0,'letter board must stay hidden until a topic is selected');
 assert.equal(await page.locator('#word-hunt-overlay').evaluate(el=>el.classList.contains('is-theme-entry')),true);
 assert.equal(await first.locator('.wh-theme-close').getAttribute('aria-label'),'Tilbake til Utforsk',
   'Ordjakt entered from Utforsk must name its actual back destination');
}
async function selectTopic(page,topic,label,fromEntry=false){
 if(!fromEntry){
  const trigger=page.locator('.word-hunt-theme-mobile:visible,.word-hunt-theme-open:visible');
  assert.equal(await trigger.count(),1,label+' missing single visible theme selection');
  await trigger.click();
 }
 const picker=page.locator('.word-hunt-theme-picker:not([hidden])');
 await picker.waitFor();
 assert.equal(await picker.locator('.wh-theme-card').count(),5);
 assert.ok(await picker.locator('.wh-theme-card.selected').count()===1);
 // Every scene is a local, small painted WebP, not a remote dependency.
 await picker.locator('.wh-theme-card img').first().evaluate(img=>img.decode());
 const valid=await picker.locator('.wh-theme-card img').evaluateAll(imgs=>imgs.every(img=>{
  const name=img.closest('[data-word-theme]')?.dataset.wordTheme;
  const expected=name==='animals'?
    '/find-the-words-garden-premium.webp?v=20261026-dyrevenner1':
    '/assets/word-hunt/themes/'+name+'.webp?v=20261017-painted1';
  return !!name&&img.src.includes(expected)&&img.getAttribute('alt')==='';
 }));
 assert.ok(valid,label+' broken illustrated topic assets');
 const art=await picker.locator('.wh-theme-card img').evaluateAll(async imgs=>{
  // WebKit can defer loading cards in a horizontal mid-game selector.
  // Eagerly load each bundled asset and bound the wait to fail clearly.
  imgs.forEach(img=>{img.loading='eager'});
  await Promise.all(imgs.map(img=>{
    if(img.complete)return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const limit=setTimeout(()=>reject(new Error('Theme image load exceeded 12 seconds: '+img.src)),12000);
      img.addEventListener('load',()=>{clearTimeout(limit);resolve()},{once:true});
      img.addEventListener('error',()=>{clearTimeout(limit);reject(new Error('Theme image failed: '+img.src))},{once:true});
    });
  }));
  return imgs.map(img=>({theme:img.closest('[data-word-theme]')?.dataset.wordTheme,width:img.naturalWidth,height:img.naturalHeight,
   bg:getComputedStyle(img).backgroundImage,complete:img.complete}));
 });
 for(const piece of art){
  const expected=piece.theme==='animals'?[480,288]:[160,169];
  assert.ok(piece.complete&&piece.width===expected[0]&&piece.height===expected[1],
    label+' failed to load premium topic illustration: '+JSON.stringify(piece));
  assert.ok(piece.bg==='none',label+' missing painted theme scene: '+JSON.stringify(piece));
 }
 assert.equal(await picker.locator('.wh-theme-fox').evaluate(el=>el.tagName),'SPAN',
  'Old fox art remains in the Eggenipa theme picker');
 await shot(page,label+'-choose-'+topic);
 const selectedCard=page.locator('.word-hunt-theme-picker [data-word-theme="'+topic+'"]');
 await selectedCard.click();
 // A first-entry card directly launches the game. The picker is therefore
 // hidden when this assertion runs, but the button remains in the DOM.
 assert.equal(await selectedCard.getAttribute('aria-pressed'),'true');
 if(!fromEntry)await picker.locator('.wh-theme-start').click();
 await picker.waitFor({state:'hidden'});
 const isHard=await page.locator('.word-hunt-level.active').getAttribute('data-word-level')==='hard';
 assert.equal(await page.locator('.word-hunt-cell:visible').count(),isHard?49:36);
 assert.equal(await page.locator('#word-hunt-overlay').evaluate(el=>el.classList.contains('is-theme-entry')),false);
 const progress=await page.evaluate(()=>JSON.parse(localStorage.getItem('laria-wordhunt-v1')));
 assert.equal(progress.theme,topic,'selected theme was not persisted');
 const rows=await page.locator('.word-hunt-word').allTextContents();
 const level=await page.locator('.word-hunt-level.active').getAttribute('data-word-level');
 const allowed=new Set(themes.get(topic)[level]);
 for(const label of rows)assert.ok(allowed.has(label.trim()),topic+' generated a word outside its bank: '+label);
 return rows.map(s=>s.trim());
}
async function pathFor(page,word){
 const result=await page.evaluate(w=>{
  const grid=[...document.querySelectorAll('.word-hunt-cell')].reduce((o,el)=>{
   const r=Number(el.dataset.r),c=Number(el.dataset.c);(o[r]||(o[r]=[]))[c]=el.textContent.trim();return o;
  },[]);
  const dirs=[[0,1],[1,0],[0,-1],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];
  for(let r=0;r<grid.length;r++)for(let c=0;c<grid[r].length;c++)for(const [dr,dc] of dirs){
   const endR=r+dr*(w.length-1),endC=c+dc*(w.length-1);
   if(endR<0||endC<0||endR>=grid.length||endC>=grid[r].length)continue;
   let got='';for(let i=0;i<w.length;i++)got+=grid[r+i*dr][c+i*dc];
   if(got===w)return [[r,c],[endR,endC]];
  }
  return null;
 },word);
 assert.ok(result,'Word '+word+' was not placed in the playable board');
 return result;
}
async function tapWord(page,word){
 const [first,last]=await pathFor(page,word);
 for(const [r,c] of [first,last])await page.locator('.word-hunt-cell[data-r="'+r+'"][data-c="'+c+'"]').tap();
}
async function checkLayout(page,label,viewport){
 const box=await page.evaluate(()=>{
  const rect=q=>{const r=document.querySelector(q)?.getBoundingClientRect();return r?{top:r.top,bottom:r.bottom,left:r.left,right:r.right}:null};
  return {height:innerHeight,width:innerWidth,documentWidth:document.documentElement.scrollWidth,
    board:rect('.word-hunt-board-card'),targets:rect('.word-hunt-targets'),title:rect('.word-hunt-top')};
 });
 assert.ok(box.board&&box.targets&&box.title,label+' missing game elements');
 assert.ok(box.documentWidth<=box.width+3,label+' page overflow');
 if(viewport.width>700||viewport.height>=800){
  assert.ok(box.title.top>=-3&&box.title.bottom<=box.height,label+' title not on initial screen');
  assert.ok(box.board.top>=0&&box.board.bottom<=box.height+2,label+' puzzle does not fit without scrolling');
  assert.ok(box.targets.top>=0&&box.targets.bottom<=box.height,label+' word list offscreen');
 }
}
async function verify(engine,launcher,label,viewport,url){
 const browser=await launcher.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
 try{
  const ctx=await browser.newContext({viewport,hasTouch:true,isMobile:viewport.width<700,serviceWorkers:'block'});
  await ctx.addInitScript(value=>localStorage.setItem('laerlittmer-v2',JSON.stringify(value)),seed);
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  try{
   await open(page,url);
   assert.equal(await page.locator('.word-hunt-theme-picker .wh-theme-start:visible').count(),0,
     label+' must not advertise resuming a round that was never started');
   // Capture the genuine child-facing first screen before keyboard focus
   // tests scroll to the final topic on compact phones.
   const entryModal=page.locator('.word-hunt-theme-picker:not([hidden])');
   if(viewport.width<=350){
     const top=await entryModal.locator('#wh-theme-heading').evaluate(el=>{
       const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,viewport:innerHeight};
     });
     assert.ok(top.top>=-1&&top.bottom<=top.viewport,
       label+' theme title hidden on compact iPhone entry: '+JSON.stringify(top));
   }
   await shot(page,label+'-first-topic-gallery');
   // When resume is hidden, cycle between the last visible card and close.
   await entryModal.locator('.wh-theme-card').last().focus();
   await page.keyboard.press('Tab');
   assert.equal(await entryModal.locator('.wh-theme-close').evaluate(el=>el===document.activeElement),true,
     label+' Tab escaped the first-entry theme dialog');
   await page.keyboard.press('Shift+Tab');
   assert.equal(await entryModal.locator('.wh-theme-card').last().evaluate(el=>el===document.activeElement),true,
     label+' Shift+Tab did not return to the final visible topic');
   const layout=await page.locator('.word-hunt-theme-picker').evaluate(el=>({
    width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
    cards:[...el.querySelectorAll('.wh-theme-card')].map(card=>{
      const r=card.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};
    })
   }));
   assert.ok(layout.scrollWidth<=layout.width+3,label+' first-entry gallery overflows horizontally');
   if(viewport.width<=700){
    assert.ok(layout.cards[0].left>=0&&layout.cards[1].right<=layout.width+2,
      label+' two storybook topics are not visible on phone first row');
    assert.ok(layout.cards[2].top>layout.cards[0].top,
      label+' mobile topics still hidden in a horizontal carousel');
   }
   const animalWords=await selectTopic(page,'animals',label,true);
   assert.equal(await page.locator('.word-hunt-targets-heading h2').innerText(),'Finn disse');
   assert.equal(await page.locator('.word-hunt-targets-count').innerText(),'0 av 4');
   assert.equal(await page.locator('.word-hunt-status').isVisible(),false,
     label+' redundant idle guide card is still covering the fox');
   // The hint/celebration channel remains, with no static old fox picture.
   const fox=page.locator('.word-hunt-companion');
   assert.equal(await fox.getAttribute('data-norsk-guide'),'magic');
   assert.equal(await fox.locator('.word-hunt-companion-fox').evaluate(el=>el.tagName),'SPAN');
   assert.equal(await fox.locator('.word-hunt-companion-hint').count(),1);
   assert.equal(await fox.locator('.word-hunt-companion-cheer').count(),1);
   const foxGeometry=await fox.evaluate(host=>{
     const bounds=el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right}};
     const stageEl=host.querySelector('.word-hunt-companion-stage');
     const artEl=host.querySelector('.word-hunt-companion-fox');
     const stage=bounds(stageEl),art=bounds(artEl);
     const controls=bounds(host.querySelector('.word-hunt-companion-controls'));
     // Layout dimensions do not include the fox's brief intentional hopping
     // and turning animation. Old intrinsic overflow makes these fail.
     const layout={
       left:artEl.offsetLeft,top:artEl.offsetTop,width:artEl.offsetWidth,height:artEl.offsetHeight,
       stageWidth:stageEl.clientWidth,stageHeight:stageEl.clientHeight
     };
     return {stage,art,controls,layout,fit:getComputedStyle(artEl).objectFit};
   });
   assert.ok(foxGeometry.art&&foxGeometry.stage,label+' missing Norwegian help stage');
   const stable=foxGeometry.layout;
   const minGuideWidth=viewport.width>700?70:55;
   const minGuideHeight=viewport.width>700?70:55;
   assert.ok(stable.stageWidth>=minGuideWidth&&stable.stageHeight>=minGuideHeight&&
     stable.width>=minGuideWidth&&stable.height>=minGuideHeight,
     label+' invisible or too-small magic guide: '+JSON.stringify(foxGeometry));
   assert.ok(stable.left>=-1.5&&stable.top>=-1.5&&
     stable.left+stable.width<=stable.stageWidth+1.5&&
     stable.top+stable.height<=stable.stageHeight+1.5,
     label+' magic guide grows beyond its own stage: '+JSON.stringify(foxGeometry));
   if(viewport.width>700){
     assert.ok(foxGeometry.stage.bottom<=foxGeometry.controls.top+2,
       label+' fox stage occupies the iPad/Mac help buttons: '+JSON.stringify(foxGeometry));
   }
   const beforeHints=await page.locator('.word-hunt-word.found').count();
   await fox.locator('.word-hunt-companion-hint').click();
   assert.equal(await page.locator('.word-hunt-cell.is-hint-start').count(),1,
     label+' first voluntary hint must mark exactly one starting cell');
   await fox.locator('.word-hunt-companion-hint').click();
   assert.equal(await page.locator('.word-hunt-cell.is-hint-path').count(),2,
     label+' second hint must mark a direction, not the whole answer');
   await fox.locator('.word-hunt-companion-hint').click();
   assert.ok(await page.locator('.word-hunt-cell.is-hint-path').count()>=3,
     label+' third hint must mark a discoverable word');
   assert.equal(await page.locator('.word-hunt-word.found').count(),beforeHints,
     label+' hints must not complete a word or grant an award');
   await fox.locator('.word-hunt-companion-cheer').click();
   assert.match(await fox.locator('.word-hunt-companion-speech').innerText(),/Heia deg/);
   assert.equal(await page.locator('.word-hunt-cell').count(),36);
   await page.locator('.word-hunt-companion').scrollIntoViewIfNeeded();
   await shot(page,label+'-selected-fox-detail');
   // Clicking a helper placed below the mobile board may scroll the overlay.
   // Restore the actual opening viewport before asserting first-fold geometry.
   await page.evaluate(()=>{document.getElementById('word-hunt-overlay').scrollTop=0});
   await shot(page,label+'-personal-fox-and-board');
   await checkLayout(page,label+'-original',viewport);
   assert.equal(animalWords.length,4);
   const mobileTopic=page.locator('.word-hunt-theme-mobile:visible');
   if(await mobileTopic.count()){
    assert.equal(await mobileTopic.locator('.word-hunt-mobile-label').innerText(),'Dyr',label+' hides its selected topic on the phone');
    assert.equal(await mobileTopic.getAttribute('aria-label'),'Velg ordtema. Nå: Dyrevenner');
    const pill=await mobileTopic.evaluate(el=>{const r=el.getBoundingClientRect(),parent=el.parentElement.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,parentTop:parent.top,parentBottom:parent.bottom,width:innerWidth}});
    assert.ok(pill.left>=0&&pill.right<=pill.width+2&&pill.top>=pill.parentTop-2&&pill.bottom<=pill.parentBottom+2,
      label+' selected topic spills beyond the level controls: '+JSON.stringify(pill));
   }
   await checkLayout(page,label+'-animals',viewport);
   await shot(page,label+'-animals-game');
   for(let i=0;i<animalWords.length;i++){
    await tapWord(page,animalWords[i]);
    if(i===0){
     assert.equal(await page.locator('.word-hunt-magic:not([hidden])').count(),1,'No calm discovery in animal round');
     assert.match(await fox.locator('.word-hunt-companion-speech').innerText(),

      /fant |var riktig|Vi fant /i,label+' the personal fox did not celebrate a found word');

     assert.equal(await page.locator('.word-hunt-targets-count').innerText(),'1 av 4',

      label+' main mission card did not record the discovery');
    }
    assert.equal(await page.locator('.word-hunt-word.found').count(),i+1);
   }
   assert.match(await fox.locator('.word-hunt-companion-speech').innerText(),/Hurra.*alle ordene/);
   assert.match(await page.locator('.word-hunt-status').innerText(),/Ordjakten er løst/);
   assert.match(await page.locator('.word-hunt-status').innerText(),/klistremerke.*Dyrevenner/,
     'First themed completion needs a visible sticker congratulations');
   assert.equal(await page.locator('.word-hunt-status').evaluate(el=>el.classList.contains('is-sticker-earned')),true);
   assert.equal(await page.locator('.word-hunt-magic:not([hidden])').count(),1,
     label+' first sticker must appear over the board, not solely below it');
   assert.match(await page.locator('.word-hunt-magic-message').innerText(),/Nytt klistremerke.*Dyrevenner/);
   await shot(page,label+'-first-sticker-celebration');
   const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('laria-wordhunt-v1')));
   assert.equal(saved.rounds,1);
   assert.equal(saved.themeRounds.animals,1);
   assert.equal(saved.themeRounds.mixed,0);
   await page.locator('.word-hunt-new').click();
   const next=await page.locator('.word-hunt-word').allTextContents();
   assert.equal(next.filter(w=>animalWords.includes(w.trim())).length,0,'The next round repeats the same words');
   // Save one found word to check the child's progress survives reload.
   await tapWord(page,next[0].trim());
   assert.equal(await page.locator('.word-hunt-word.found').count(),1);
   await page.locator('.word-hunt-back').click();
   await page.locator('.bc12-nav [data-camp="collection"]').click();
   const book=page.locator('#bc12-dialog[open].is-collection');
   await book.waitFor();
   assert.equal(await book.locator('.bc12-memory').count(),4,'Existing four subject keepsakes were changed');
   await book.locator('.lmc-tabs [data-book-page="words"]').click();
   assert.equal(await book.locator('.bc12-wordhunt-sticker').count(),5);
   assert.equal(await book.locator('.bc12-wordhunt-sticker[data-word-theme="animals"]').getAttribute('data-owned'),'true');
   assert.equal(await book.locator('.bc12-wordhunt-sticker[data-word-theme="mixed"]').getAttribute('data-owned'),'false');
   await book.locator('.bc12-wordhunt-collection').scrollIntoViewIfNeeded();
   await shot(page,label+'-themed-collection');
   await book.locator('.bc12-close').click();
   await open(page,url);
   const resume=page.locator('.word-hunt-theme-picker .wh-theme-start:visible');
   assert.match(await resume.innerText(),/Fortsett ordjakten i Dyrevenner/);
   // On return the real resume action is visible and is the last tab stop.
   await resume.focus();
   await page.keyboard.press('Tab');
   assert.equal(await page.locator('.word-hunt-theme-picker .wh-theme-close').evaluate(el=>el===document.activeElement),true,
     label+' Tab escaped picker with a genuine saved round');
   await page.keyboard.press('Shift+Tab');
   assert.equal(await resume.evaluate(el=>el===document.activeElement),true,
     label+' Shift+Tab skipped the saved-round resume action');
   await resume.click();
   await page.locator('.word-hunt-cell:visible').first().waitFor();
   assert.deepEqual(await page.locator('.word-hunt-word').allTextContents().then(items=>items.map(s=>s.replace(/^✓\s*/,'').trim())),next,
     'Resuming an unfinished puzzle must preserve its exact target words');
   assert.equal(await page.locator('.word-hunt-word.found').count(),1,'Found words must survive a full page reload');
   await page.locator('[data-word-level="hard"]').click();
   assert.equal(await page.locator('.word-hunt-cell').count(),49);
   const worldWords=await selectTopic(page,'world',label+'-hard');
   assert.equal(worldWords.length,5);
   assert.equal(await page.locator('.word-hunt-cell').count(),49);
   await checkLayout(page,label+'-world-hard',viewport);
   await shot(page,label+'-world-hard');
   await page.reload({waitUntil:'domcontentloaded'});
   await open(page,url);
   assert.equal(await page.locator('.word-hunt-theme-picker .wh-theme-card.selected').getAttribute('data-word-theme'),'world');
   await page.locator('.word-hunt-theme-picker [data-word-theme="world"]').click();
   await page.locator('.word-hunt-cell:visible').first().waitFor();
   const current=await page.locator('.word-hunt-current-theme').innerText();
   assert.equal(current,'Verden rundt','selected topic not restored after reload');
   if(await page.locator('.word-hunt-theme-mobile:visible').count()){
    assert.equal(await page.locator('.word-hunt-mobile-label').innerText(),'Verden',
      label+' saved topic missing from visible phone control');
   }
   // When Verden rundt is saved, the mobile carousel must reopen at its
   // selected card rather than hiding the choice off the right edge.
   const beforeCancelledChoice=await page.locator('.word-hunt-word').allTextContents();
   await page.locator('.word-hunt-theme-mobile:visible,.word-hunt-theme-open:visible').click();
   const chooser=page.locator('.word-hunt-theme-picker:not([hidden])');
   await chooser.waitFor();
   assert.equal(await chooser.locator('.wh-theme-card.selected').getAttribute('data-word-theme'),'world');
   const selectedGeometry=await chooser.evaluate(el=>{
    const scroller=el.querySelector('.wh-theme-cards'),selected=el.querySelector('.wh-theme-card.selected');
    const a=scroller.getBoundingClientRect(),b=selected.getBoundingClientRect();
    return {left:b.left,right:b.right,frameLeft:a.left,frameRight:a.right,
      overflow:scroller.scrollWidth>scroller.clientWidth+2,scrollLeft:scroller.scrollLeft};
   });
   if(selectedGeometry.overflow){
    assert.ok(selectedGeometry.left>=selectedGeometry.frameLeft-4&&selectedGeometry.right<=selectedGeometry.frameRight+4,
      label+' reopened themed carousel hides the selected card: '+JSON.stringify(selectedGeometry));
   }
   await chooser.locator('[data-word-theme="magic"]').click();
   await chooser.locator('.wh-theme-close').click();
   assert.equal(await page.locator('.word-hunt-current-theme').innerText(),'Verden rundt',
      'Cancelling a different topic changed the active choice');
   assert.deepEqual(await page.locator('.word-hunt-word').allTextContents(),beforeCancelledChoice,
     'Cancelling a picker selection restarted the puzzle');
   const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('laria-wordhunt-v1')));
   assert.equal(after.rounds,1,'topic selection incorrectly increased completed rounds');
   assert.equal(after.themeRounds.animals,1,'earned sticker disappeared');
   assert.deepEqual(errors,[],label+' runtime errors');
   console.log('PASS Ordjakt magical themes '+engine+' '+label);
  }finally{await ctx.close();}
 }finally{await browser.close();}
}
(async()=>{
 const {server,url}=await serve();
 try{
  await verify('chromium',chromium,'mac',{width:1525,height:833},url);
  await verify('webkit',webkit,'ipad',{width:820,height:1180},url);
  await verify('webkit',webkit,'iphone',{width:390,height:844},url);
  await verify('webkit',webkit,'iphone-compact',{width:320,height:568},url);
 }finally{await new Promise(resolve=>server.close(resolve))}
 console.log('PASS Læria illustrated Ordjakt themes, responsive play and stickers');
})().catch(error=>{console.error(error);process.exitCode=1});