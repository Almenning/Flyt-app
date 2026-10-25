'use strict';
/* Phase 4C: real Chromium/WebKit touch and pointer QA for Læria Ordjakt.
   Test the opening viewport, counted letter cells, selected fox, free play,
   touch endpoint taps, real pointer drag, completion, persistence and return.
   No test-only helpers are added to production code. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium,webkit}=require('playwright');
const base=path.resolve(__dirname,'..');
const out=process.env.WORD_HUNT_QA_SCREENSHOTS||'/tmp/laria-wordhunt-phase4';
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Elev',avatar:'girl',setupVersion:2},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
function serve(){return new Promise((resolve,reject)=>{
 const srv=http.createServer((req,res)=>{
  let requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(requested.endsWith('/'))requested+='index.html';
  const file=path.resolve(base,'.'+requested);
  if(!file.startsWith(base+path.sep)){res.writeHead(403);res.end();return}
  fs.readFile(file,(err,buf)=>{if(err){res.writeHead(404);res.end('Not found');return}
   res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
   res.setHeader('Cache-Control','no-store');res.end(buf)});
 });
 srv.once('error',reject);
 srv.listen(0,'127.0.0.1',()=>resolve({srv,url:'http://127.0.0.1:'+srv.address().port+'/laer-litt-mer/?app=laria'}));
})}
async function shot(page,label){
 await fs.promises.mkdir(out,{recursive:true});
 await page.screenshot({path:path.join(out,label+'.png'),animations:'disabled',fullPage:false});
}
const cell=(page,rc)=>page.locator('.word-hunt-cell[data-r="'+rc[0]+'"][data-c="'+rc[1]+'"]');
async function open(page,url){
 await page.addInitScript(p=>localStorage.setItem('laerlittmer-v2',JSON.stringify(p)),seed);
 await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
 await page.route('https://api.worldbank.org/**',r=>r.abort());
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>typeof window.openWordHunt==='function'&&document.querySelector('.bc12-nav [data-camp="explore"]'),{},{timeout:25000});
 // The actual child-facing Utforsk is the premium BC13 chooser. Its
 // four storybook cards intentionally cover the retired Basecamp pin buttons.
 await page.locator('.bc12-nav [data-camp="explore"]').first().click();
 const chooser=page.locator('.bc13-panel:not([hidden])');
 await chooser.waitFor({state:'visible'});
 assert.equal(await page.locator('.bc12').getAttribute('data-bc13-view'),'explore');
 for(const action of ['words','globe','fraction','multiply']){
  const card=chooser.locator('.bc13-card[data-bc13-action="'+action+'"]');
  assert.ok(await card.isVisible(),'Young Utforsk hides its premium '+action+' activity card');
 }
 await chooser.locator('.bc13-card[data-bc13-action="words"]').click();
 // First screen must be the five-theme gallery, never a surprise puzzle.
 const entry=page.locator('#word-hunt-overlay:not([hidden]) .word-hunt-theme-picker:not([hidden])');
 await entry.waitFor();
 assert.equal(await entry.locator('.wh-theme-card').count(),5,'child does not see all five topic choices');
 assert.equal(await page.locator('.word-hunt-cell:visible').count(),0,'puzzle is visible before a theme is chosen');
 // The child must be able to TOUCH the actual first theme card on the
 // initial screen. A locator.click() may wait indefinitely for Playwright's
 // "stable" heuristic in 320px WebKit's nested scroll panel.
 // Check hit-testing and minimum touch size instead of forcing a DOM click.
 const firstTheme=entry.locator('[data-word-theme="mixed"]');
 const touch=await firstTheme.evaluate(el=>{
   const rect=el.getBoundingClientRect();
   const x=Math.round(rect.left+rect.width/2),y=Math.round(rect.top+rect.height/2);
   const top=document.elementFromPoint(x,y);
   return {x,y,width:rect.width,height:rect.height,
     viewportWidth:innerWidth,viewportHeight:innerHeight,
     enabled:!el.disabled,
     reachable:top===el||el.contains(top),
     obstruction:top?.tagName||null};
 });
 assert.ok(touch.enabled&&touch.width>=44&&touch.height>=44&&
   touch.x>=0&&touch.x<touch.viewportWidth&&
   touch.y>=0&&touch.y<touch.viewportHeight&&touch.reachable,
   'First Ordjakt theme cannot be touched in the opening viewport: '+JSON.stringify(touch));
 await page.touchscreen.tap(touch.x,touch.y);
 await entry.waitFor({state:'hidden'});
 await page.locator('#word-hunt-overlay:not([hidden]) .word-hunt-cell:visible').first().waitFor();
}
async function geometry(page,label,viewport,firstFold){
 const m=await page.evaluate(()=>{
  const rect=q=>{const el=document.querySelector(q);if(!el)return null;
   const r=el.getBoundingClientRect();return {top:Math.round(r.top),bottom:Math.round(r.bottom),left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width),height:Math.round(r.height)}};
  const cells=[...document.querySelectorAll('#word-hunt-overlay .word-hunt-cell')].map(el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height}});
  const overlay=document.querySelector('.word-hunt-overlay'),shell=document.querySelector('.word-hunt-shell');
  return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,
   top:rect('.word-hunt-top'),intro:rect('.word-hunt-intro'),levels:rect('.word-hunt-levels'),
   targets:rect('.word-hunt-targets'),board:rect('.word-hunt-board-card'),grid:rect('.word-hunt-board'),
   status:rect('.word-hunt-status'),companion:rect('.word-hunt-companion'),newRound:rect('.word-hunt-new'),
   back:rect('.word-hunt-back'),cells,fox:rect('.word-hunt-fox'),
   environment:overlay?getComputedStyle(overlay).backgroundImage:'',
   shellBackground:shell?getComputedStyle(shell).backgroundImage:'',
   shellColor:shell?getComputedStyle(shell).backgroundColor:''};
 });
 console.log('WORD_HUNT_VIEWPORT '+label+': '+JSON.stringify({width:m.width,height:m.height,targets:m.targets,board:m.board,minCell:Math.min(...m.cells.map(c=>c.width)),overflow:m.scrollWidth}));
 assert.ok(m.board&&m.targets&&m.fox,label+' missing board/list/selected fox');
 assert.ok(m.scrollWidth<=m.width+3,label+' horizontal overflow: '+JSON.stringify(m));
 assert.ok(m.back.width>=44&&m.back.height>=44,label+' return target too small');
 if(firstFold){
  assert.ok(m.targets.top>=0&&m.targets.bottom<=m.height,label+' word list must be visible on first screen: '+JSON.stringify(m));
  assert.ok(m.board.top>=0&&m.board.bottom<=m.height,label+' letter board must be visible on first screen: '+JSON.stringify(m));
  for(const [name,rect] of [['title',m.top],['instructions',m.intro],['levels',m.levels]]){
   assert.ok(rect&&rect.top>=0&&rect.bottom<=m.height,label+' '+name+' is clipped on first screen: '+JSON.stringify(m));
  }
 }
 if(viewport.width>=1401&&viewport.height>=700&&viewport.height<=1000){
  assert.ok(m.board.width>=Math.min(590,viewport.height-230),label+' desktop puzzle shrank unnecessarily: '+JSON.stringify(m));
  assert.ok(m.board.bottom<=m.height-6,label+' bottom row still clips on Mac first screen: '+JSON.stringify(m));
 }
 if(viewport.width<=700 && m.cells.length===36){
  assert.ok(m.cells.every(x=>x.width>=44&&x.height>=44),label+' easy cells under 44px: '+JSON.stringify(m));
  if(viewport.height>viewport.width){
   assert.ok(m.board.width>=viewport.width*.90,label+' premium frame shrank the portrait puzzle too much: '+JSON.stringify(m.board));
   // Active personal fox is now the guide. The duplicate idle status card is gone.
   assert.ok(m.companion&&m.companion.width>=viewport.width*.90,
     label+' personal fox helper is not aligned with the puzzle: '+JSON.stringify(m));
   assert.ok(m.newRound&&m.newRound.width>=viewport.width*.60,label+' new-round action is too small on portrait mobile');
  }
 }
 if(viewport.width<=700 && viewport.height>viewport.width){
  assert.match(m.environment,/bokskogen-verden\.png/,label+' portrait Ordjakt does not use the illustrated Bokskogen scene');
  assert.ok(m.shellBackground==='none'||/rgba\(255, 248, 222, 0\.1/.test(m.shellBackground)===false,
   label+' portrait shell still behaves like a full cream page: '+m.shellBackground);
 }else{
  assert.match(m.environment,/bokskogen-(atlas32\.webp|verden\.png)/,label+' no Bokskogen environment behind the puzzle');
 }
}
async function pathFor(page,word){
 const found=await page.evaluate(w=>{
  const grid=[...document.querySelectorAll('.word-hunt-cell')].reduce((o,el)=>{
   const r=Number(el.dataset.r),c=Number(el.dataset.c);(o[r]||(o[r]=[]))[c]=el.textContent.trim();return o
  },[]);
  const dirs=[[0,1],[1,0],[0,-1],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];
  for(let r=0;r<grid.length;r++)for(let c=0;c<grid[r].length;c++)for(const [dr,dc] of dirs){
   const endR=r+dr*(w.length-1),endC=c+dc*(w.length-1);
   if(endR<0||endC<0||endR>=grid.length||endC>=grid[r].length)continue;
   let wordMade='';for(let i=0;i<w.length;i++)wordMade+=grid[r+dr*i][c+dc*i];
   if(wordMade===w)return {start:[r,c],end:[endR,endC]};
  }
  return null;
 },word);
 assert.ok(found,'Placed word '+word+' was not found in the visible board');
 return found;
}
async function tapWord(page,word){
 const p=await pathFor(page,word);
 await cell(page,p.start).tap();
 await cell(page,p.end).tap();
}
async function directionProfile(page){
 return page.evaluate(()=>{
  const words=[...document.querySelectorAll('.word-hunt-word')].map(el=>el.textContent.replace(/^✓\s*/,'').trim());
  const grid=[...document.querySelectorAll('.word-hunt-cell')].reduce((o,el)=>{
   const r=Number(el.dataset.r),c=Number(el.dataset.c);(o[r]||(o[r]=[]))[c]=el.textContent.trim();return o
  },[]);
  const dirs=[[0,1],[1,0],[0,-1],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]],hits=[];
  for(const word of words)for(let r=0;r<grid.length;r++)for(let c=0;c<grid[r].length;c++)for(const [dr,dc] of dirs){
   const er=r+dr*(word.length-1),ec=c+dc*(word.length-1);
   if(er<0||ec<0||er>=grid.length||ec>=grid[r].length)continue;
   let made='';for(let i=0;i<word.length;i++)made+=grid[r+dr*i][c+dc*i];
   if(made===word)hits.push({word,dr,dc});
  }
  return {
   hits,
   horizontal:hits.some(x=>x.dr===0),
   vertical:hits.some(x=>x.dc===0),
   diagonal:hits.some(x=>x.dr!==0&&x.dc!==0),
   reverse:hits.some(x=>x.dr<0||x.dc<0)
  };
 });
}
async function dragWord(page,word){
 const p=await pathFor(page,word);
 await cell(page,p.start).scrollIntoViewIfNeeded();
 const a=await cell(page,p.start).boundingBox(),b=await cell(page,p.end).boundingBox();
 assert.ok(a&&b,'Missing drag endpoints for '+word);
 await page.mouse.move(a.x+a.width/2,a.y+a.height/2);
 await page.mouse.down();
 await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:Math.max(6,word.length+2)});
 await page.mouse.up();
}
async function testView(browser,engine,label,viewport,url){
 const ctx=await browser.newContext({viewport,deviceScaleFactor:1,serviceWorkers:'block',isMobile:viewport.width<900,hasTouch:true});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 try{
  await open(page,url);
  assert.equal(await page.locator('.word-hunt-cell').count(),36,label+' easy puzzle not 6x6');
  assert.equal(await page.locator('.word-hunt-word').count(),4,label+' easy puzzle not 4 words');
  const fox=await page.locator('.word-hunt-fox').evaluate(el=>({src:el.getAttribute('src'),expected:window.LARIA_SKOGSTROLL.sourceForActivity('wordHunt'),complete:el.complete,naturalWidth:el.naturalWidth}));
  assert.equal(fox.src,fox.expected,label+' must show original storesøster');
  assert.equal(await page.evaluate(()=>state.profile.avatar),'girl',label+' original art changed the saved profile');
  await page.locator('.word-hunt-fox').evaluate(img=>img.decode());
  await shot(page,label+'-01-words-and-board');
  await geometry(page,label,viewport,viewport.width<=700||viewport.height<=500||label.includes('ipad')||label.includes('mac'));
  const shortcut=page.locator('.word-hunt-fox-shortcut');
  assert.equal(await shortcut.getAttribute('aria-label'),'Få hint fra skogstrollet',
    label+' skogstroll must provide accessible optional hint');
  if(viewport.width<=700&&viewport.height>viewport.width){
   const b=await shortcut.boundingBox();
   assert.ok(b&&b.width>=44&&b.height>=44&&b.x>=0&&b.x+b.width<=viewport.width+1,
     label+' first-screen fox hint touch target is too small or outside viewport: '+JSON.stringify(b));
   assert.equal(await shortcut.locator('.word-hunt-fox').count(),1,
     label+' shortcut must use original saved fox, not another mascot');
   const before=await page.locator('.word-hunt-word.found').count();
   const boardBeforeHint=await page.locator('.word-hunt-board-card').boundingBox();
   await shortcut.click();
   assert.equal(await page.locator('.word-hunt-cell.is-hint-start').count(),1,
     label+' fox shortcut did not mark the first letter');
   assert.match(await page.locator('.word-hunt-intro').innerText(),/Se etter et ord/,
     label+' fox clue remains below the fold instead of visible over the puzzle');
   assert.equal(await page.locator('.word-hunt-word.found').count(),before,
     label+' shortcut falsely awards a word');
   const boardAfterHint=await page.locator('.word-hunt-board-card').boundingBox();
   assert.ok(boardAfterHint&&boardBeforeHint&&
     boardAfterHint.width>=boardBeforeHint.width-1&&
     boardAfterHint.height>=boardBeforeHint.height-1&&
     boardAfterHint.y+boardAfterHint.height<=viewport.height+1,
     label+' opening the fox hint shrinks or pushes the letter board off the first screen: '+
     JSON.stringify({before:boardBeforeHint,after:boardAfterHint,viewport}));
  }
  const easyDirections=await directionProfile(page);
  assert.ok(easyDirections.horizontal&&easyDirections.vertical,label+' easy round lacks horizontal/vertical variety: '+JSON.stringify(easyDirections));
  // The fox is the live response channel, not a static illustration plus
  // a detached warning card. A partial prefix counts as friendly near-miss.
  const firstWord=(await page.locator('.word-hunt-word').first().innerText()).trim();
  const {start:begin,end}=await pathFor(page,firstWord);
  const second=[begin[0]+Math.sign(end[0]-begin[0]),begin[1]+Math.sign(end[1]-begin[1])];
  for(const [r,c] of [begin,second])
    await page.locator('.word-hunt-cell[data-r="'+r+'"][data-c="'+c+'"]').tap();
  assert.match(await page.locator('.word-hunt-companion-speech').innerText(),
    /God start|på sporet/i,label+' fox did not react to a near-miss');
  assert.equal(await page.locator('.word-hunt-targets-count').innerText(),'0 av 4',
    label+' incomplete attempt changed the mission count');
  if(viewport.width<=700&&viewport.height>viewport.width){
   const animation=await page.locator('.word-hunt-fox-shortcut .word-hunt-fox').evaluate(
     el=>getComputedStyle(el).animationName);
   assert.match(animation,/whFoxShortcutSupport/,
     label+' visible personal fox did not react to a near-miss');
  }
  // On compact iPhones, the first selected letter and voluntary help offer
  // must be visible above the puzzle, not confined to the below-fold companion.
  if(viewport.width<=700&&viewport.height>viewport.width){
   await page.locator('.word-hunt-cell[data-r="'+begin[0]+'"][data-c="'+begin[1]+'"]').tap();
   assert.match(await page.locator('.word-hunt-intro').innerText(),/Velg siste bokstav/,
     label+' fox first-letter guidance is invisible above the board');
   await page.locator('.word-hunt-cell[data-r="'+begin[0]+'"][data-c="'+begin[1]+'"]').tap();
  }
  // A second tap on the same letter is invalid but must not penalize the child.
  await page.waitForTimeout(950);
  for(let i=0;i<2;i++)
    await page.locator('.word-hunt-cell[data-r="'+begin[0]+'"][data-c="'+begin[1]+'"]').tap();
  assert.match(await page.locator('.word-hunt-companion-speech').innerText(),
    /Prøv å følge|Velg første/i,label+' fox did not explain an invalid line');
  assert.equal(await page.locator('.word-hunt-word.found').count(),0,
    label+' unsuccessful attempts awarded an actual word');
  const feedbackStyle=await page.locator('.word-hunt-status').evaluate(el=>({
    position:getComputedStyle(el).position,width:el.getBoundingClientRect().width
  }));
  assert.ok(feedbackStyle.position==='absolute'&&feedbackStyle.width<=2,
    label+' redundant detached status card is still visually dominant');
  const missionStyle=await page.evaluate(()=>({
    title:parseFloat(getComputedStyle(document.querySelector('.word-hunt-targets h2')).fontSize),
    theme:parseFloat(getComputedStyle(document.querySelector('.word-hunt-theme-open strong')).fontSize),
    word:parseFloat(getComputedStyle(document.querySelector('.word-hunt-word')).fontSize)
  }));
  assert.ok(missionStyle.title>missionStyle.theme&&missionStyle.word>=10,
    label+' the words are not visually prioritized: '+JSON.stringify(missionStyle));
  if(viewport.width<=700&&viewport.height>viewport.width)
    await geometry(page,label+'-fox-feedback',viewport,true);
  await shot(page,label+'-fox-reaction');
  const words=await page.locator('.word-hunt-word').allTextContents();
  for(let i=0;i<words.length;i++){
   const word=words[i].replace(/^✓\s*/,'').trim();
   if(i===1)await dragWord(page,word);else await tapWord(page,word);
   assert.equal(await page.locator('.word-hunt-word.found').count(),i+1,label+' missed '+word+' by touch or drag');
   if(i===0){
     assert.match(await page.locator('.word-hunt-companion-speech').innerText(),
       /fant |var riktig|Vi fant /i,label+' fox stayed silent when a word was found');
     assert.equal(await page.locator('.word-hunt-targets-count').innerText(),'1 av 4',
       label+' the mission progress did not update');
     if(viewport.width<=700&&viewport.height>viewport.width){
      const animation=await page.locator('.word-hunt-fox-shortcut .word-hunt-fox').evaluate(
        el=>getComputedStyle(el).animationName);
      assert.match(animation,/whFoxShortcutCelebrate/,
        label+' visible personal fox did not celebrate the correct word');
     }
   }
  }
  assert.match(await page.locator('.word-hunt-companion-speech').innerText(),
    /Hurra!.*alle ordene/i,label+' fox did not celebrate the completed mission');
  assert.equal(await page.locator('.word-hunt-targets-count').innerText(),'4 av 4');
  assert.match(await page.locator('.word-hunt-status').innerText(),/Ordjakten er løst/);
  assert.ok(await page.locator('#word-hunt-overlay').evaluate(el=>el.classList.contains('word-hunt-complete')),label+' completion did not promote the new-round action');
  assert.equal(await page.locator('.word-hunt-rounds').innerText(),'Du har fullført 1 ordjakt',label+' child-facing completion copy is not singular');
  const completionDelight=await page.evaluate(()=>({
   board:getComputedStyle(document.querySelector('.word-hunt-board-card')).animationName,
   fox:getComputedStyle(document.querySelector('.word-hunt-fox')).animationName,
   next:getComputedStyle(document.querySelector('.word-hunt-new')).animationName,
   statusBackground:getComputedStyle(document.querySelector('.word-hunt-status')).backgroundImage
  }));
  assert.match(completionDelight.board,/wordHuntBoardCelebrate/,label+' completion lacks board celebration');
  assert.match(completionDelight.fox,viewport.width<=700&&viewport.height>viewport.width?
    /whFoxShortcutCelebrate/:/wordHuntFoxCelebrate/,
    label+' completion lacks the correct selected-fox reaction for this viewport');
  assert.match(completionDelight.next,/wordHuntReadyPulse/,label+' completion lacks next-round emphasis');
  assert.match(completionDelight.statusBackground,/linear-gradient/,label+' completion status lacks resolved-state treatment');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('laria-wordhunt-v1')||'{}').rounds),1,label+' no persisted completion');
  await shot(page,label+'-02-complete');
  await page.locator('.word-hunt-level[data-word-level="hard"]').click();
  if(viewport.width<=700&&viewport.height>viewport.width){
   assert.equal(await page.locator('.word-hunt-intro.has-fox-hint').count(),0,
     label+' stale fox clue not cleared on a new round');
   assert.match(await page.locator('.word-hunt-intro').innerText(),/Finn ordene!/);
  }
  assert.equal(await page.locator('.word-hunt-cell').count(),49,label+' harder puzzle not 7x7');
  assert.equal(await page.locator('.word-hunt-word').count(),5,label+' harder puzzle not 5 words');
  if(viewport.width>=1401)await geometry(page,label+'-hard',viewport,true);
  const hardDirections=await directionProfile(page);
  assert.ok(hardDirections.horizontal&&hardDirections.vertical&&hardDirections.diagonal&&hardDirections.reverse,
   label+' harder round lacks straight/diagonal/reverse variety: '+JSON.stringify(hardDirections));
  // After four misses the fox offers voluntary help, without gifting an answer.
  // Fresh hard round resets the earlier mobile hint state.
  const stillMissing=(await page.locator('.word-hunt-word').first().innerText()).trim();
  const tip=await pathFor(page,stillMissing);
  const adjacent=[tip.start[0]+Math.sign(tip.end[0]-tip.start[0]),tip.start[1]+Math.sign(tip.end[1]-tip.start[1])];
  for(let attempt=0;attempt<4;attempt++){
   for(const [r,c] of [tip.start,adjacent])
    await page.locator('.word-hunt-cell[data-r="'+r+'"][data-c="'+c+'"]').tap();
  }
  assert.match(await page.locator('.word-hunt-companion-speech').innerText(),/Trykk på skogstrollet når du vil/,
    label+' fox did not offer optional help after repeated misses');
  assert.equal(await page.locator('.word-hunt-word.found').count(),0,
    label+' offering help awarded a word without the child finding it');
  if(viewport.width<=700&&viewport.height>viewport.width){
   assert.match(await page.locator('.word-hunt-intro').innerText(),/Trykk på skogstrollet når du vil/,
     label+' fox optional help is invisible above the phone board');
   await geometry(page,label+'-help-offer',viewport,true);
  }
  await shot(page,label+'-04-optional-help');
  await tapWord(page,(await page.locator('.word-hunt-word').first().innerText()).trim());
  assert.equal(await page.locator('.word-hunt-word.found').count(),1,label+' harder puzzle touch selection failed');
  await shot(page,label+'-03-harder');
  await page.locator('.word-hunt-back').click();
  assert.equal(await page.locator('#word-hunt-overlay:not([hidden])').count(),0,label+' did not close');
  assert.equal(await page.evaluate(()=>document.documentElement.style.overflow),'',label+' scroll lock not restored');
  const returned=page.locator('.bc13-panel:not([hidden]) .bc13-card[data-bc13-action="words"]');
  await returned.waitFor({state:'visible'});
  assert.equal(await page.locator('.bc12').getAttribute('data-bc13-view'),'explore',
   label+' return must restore actual Utforsk chooser, not silently reset to Home');
  assert.ok(await returned.evaluate(el=>document.activeElement===el),
   label+' returning child loses keyboard/screen-reader focus instead of receiving new Word Hunt card');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('laria-wordhunt-v1')||'{}').rounds),1,label+' completion not saved on return');
  await page.reload({waitUntil:'domcontentloaded'});
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('laria-wordhunt-v1')||'{}').rounds),1,label+' completion lost on reload');
  assert.deepEqual(errors,[],label+' runtime JS errors');
  console.log('PASS '+engine+' '+label+' board, touch endpoints, real pointer drag, personal fox, completion and return');
 }finally{await ctx.close()}
}
(async()=>{
 const {srv,url}=await serve();
 try{
  for(const [engine,launcher,views] of [
   ['chromium',chromium,[['iphone',{width:390,height:844}],['iphone-tiny',{width:320,height:568}],['ipad',{width:820,height:1180}],['mac',{width:1525,height:833}]]],
   ['webkit',webkit,[['iphone-safari',{width:390,height:844}],['iphone-tiny-safari',{width:320,height:568}],['iphone-landscape-safari',{width:844,height:390}],['ipad-safari',{width:820,height:1180}],['ipad-landscape-safari',{width:1180,height:820}],['mac-safari',{width:1525,height:833}]]]
  ]){
   const browser=await launcher.launch({headless:true});
   try{for(const [label,viewport] of views)await testView(browser,engine,label,viewport,url)}
   finally{await browser.close()}
  }
  console.log('PASS complete Læria Word Hunt phase4 Chromium/WebKit matrix');
 }finally{await new Promise(resolve=>srv.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
