'use strict';
/* Gangemagi: true child-sized first viewport + real interactions in Chromium/WebKit. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium,webkit}=require('playwright');
const base=path.resolve(__dirname,'..');
const out=process.env.QA_SCREENSHOTS||'/tmp/laria-gangemagi-v1';
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
function serve(){return new Promise((resolve,reject)=>{const srv=http.createServer((req,res)=>{let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(name.endsWith('/'))name+='index.html';const file=path.resolve(base,'.'+name);if(!file.startsWith(base+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(file,(err,buf)=>{if(err){res.writeHead(404);res.end('Not found');return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(buf);});});srv.once('error',reject);srv.listen(0,'127.0.0.1',()=>resolve({srv,url:'http://127.0.0.1:'+srv.address().port+'/laer-litt-mer/?app=laria'}));});}
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Elev',avatar:'girl',setupVersion:2},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
async function shot(page,name){await fs.promises.mkdir(out,{recursive:true});await page.screenshot({path:path.join(out,name+'.png'),fullPage:true,animations:'disabled'});}
async function selectAndPick(page,group,count){
 await page.locator('[data-gm-action="basket"][data-gm-basket="'+group+'"]').click();
 assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).selectedBasket,group,'the basket is selected');
 for(let i=0;i<count;i++)await page.locator('[data-gm-action="source"]').click();
}
async function check(engine,label,viewport,url){
 const context=await engine.newContext({viewport,deviceScaleFactor:1,serviceWorkers:'block',isMobile:viewport.width<750,hasTouch:true});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.addInitScript(s=>{localStorage.setItem('laerlittmer-v2',JSON.stringify(s));},seed);
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.LARIA_GANGEMAGI?.version==='playable-v1');
  await page.evaluate(()=>window.openMultiplicationLab());
  await page.locator('#multiplication-lab-screen.active .gm-shell').waitFor();
  assert.equal(await page.locator('.gm-crate').count(),3);
  const bookQuickBox=await page.locator('.gm-book-quick').boundingBox();
  assert.ok(bookQuickBox&&bookQuickBox.width>=44&&bookQuickBox.height>=44&&bookQuickBox.y>=0&&bookQuickBox.y+bookQuickBox.height<=viewport.height,
    label+' book shortcut should be touch-safe and visible on the first fold');
  assert.equal((await page.locator('.gm-math-equation').innerText()).trim(),'0 + 0 + 0 = 0');
  assert.match((await page.locator('.gm-story').innerText()).replace(/\s+/g,' '),/3 kurver med 3 jordbær/);
  assert.equal(await page.locator('.gm-quest').count(),1,label+' mission has a prominent quest panel');
  assert.match(await page.locator('.gm-quest-ribbon').innerText(),/Dagens oppdrag/);
  assert.equal(await page.locator('.gm-quest-callout>span').count(),2,
    label+' children need a deliberate two-line mission instruction');
  assert.match((await page.locator('.gm-quest-callout').innerText()).replace(/\s+/g,' '),
    /Fyll 3 kurver med 3 jordbær i hver/);
  const calloutLayout=await page.locator('.gm-quest-callout').evaluate(el=>({
    overflow:[...el.querySelectorAll(':scope>span')].some(span=>span.scrollWidth>span.clientWidth+1),
    insidePanel:el.getBoundingClientRect().left>=el.closest('.gm-quest').getBoundingClientRect().left-1&&
      el.getBoundingClientRect().right<=el.closest('.gm-quest').getBoundingClientRect().right+1
  }));
  assert.equal(calloutLayout.overflow,false,label+' mission heading must never overflow painted wood');
  assert.equal(calloutLayout.insidePanel,true,label+' headline stays inside the illustrated board');
  assert.equal(await page.locator('.gm-quest-filled-preview .gm-quest-mini-basket').count(),3,
    'final instructional illustration previews one filled basket per real group');
  assert.equal(await page.locator('.gm-quest-filled-preview .gm-quest-mini-berries i').count(),9,
    label+' three baskets really show three strawberries each');
  assert.deepEqual(await page.locator('.gm-quest-step strong').allInnerTexts(),
    ['Velg en kurv','Legg i jordbær','Se at 3 × 3 = 9'],'instructions are three real readable DOM steps');
  assert.equal(await page.locator('.gm-quest-step-active[aria-current="step"][data-gm-step="1"]').count(),1,
    label+' first illustrated step invites a basket choice');
  assert.equal(await page.locator('.gm-quest-steps[role="list"] [role="listitem"]').count(),3,
    'screen-reader and touch-friendly three-step instructions');
  // Quest-step labels carry actual child instructions, not decorative microcopy.
  // All device sizes must preserve >=10px instead of the prior unreadable 8px.
  const questStepFont=await page.locator('.gm-quest-step strong').first()
    .evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
  assert.ok(questStepFont>=10,
    label+' three-step instructions must be legible for grade 2: '+questStepFont+'px');

  const missionHeading=await page.locator('.gm-quest-callout').evaluate(el=>({
    size:parseFloat(getComputedStyle(el).fontSize),bounds:el.getBoundingClientRect().toJSON(),
    panel:el.closest('.gm-quest').getBoundingClientRect().toJSON()}));
  assert.ok(missionHeading.size>=17&&missionHeading.bounds.width>viewport.width*.65,
    label+' child-sized assignment heading '+JSON.stringify(missionHeading));
  assert.equal(await page.locator('.gm-fox-art [data-avatar="girl"]').count(),1,'must render chosen full-body girl fox');
  assert.match(await page.locator('.gm-book-quick').innerText(),/0\/8/,'flower progress visible from the main scene');
  const premiumBasket=await page.request.get(new URL('gangemagi-basket-premium.svg',url).href);
  assert.equal(premiumBasket.status(),200,'premium woven basket art must load');
  assert.match(premiumBasket.headers()['content-type'],/image\/svg\+xml/);
  assert.equal(await page.locator('.gm-basket-illustration').count(),3,'baskets must be real separately illustrated DOM components');
  // The quest board is an individually authored SVG illustration behind live DOM.
  // A flat screenshot, a CSS-only box, or a missing asset does not meet the lock.
  const paintedBoard=await page.request.get(new URL('gangemagi-quest-board-painted.svg',url).href);
  assert.equal(paintedBoard.status(),200,'painted wooden quest board asset is available');
  assert.match(paintedBoard.headers()['content-type'],/image\/svg\+xml/);
  const boardMaterial=await page.locator('.gm-story.gm-quest').evaluate(el=>({
    image:getComputedStyle(el).backgroundImage,
    liveInstructions:el.querySelectorAll('.gm-quest-step').length,
    dynamicHeading:el.querySelector('h2')?.textContent.trim()
  }));
  assert.match(boardMaterial.image,/gangemagi-quest-board-painted\.svg/,
    label+' board must use hand-illustrated wood and flowers, not a generic CSS card');
  assert.equal(boardMaterial.liveInstructions,3,'dynamic interactive teaching steps remain live markup');
  assert.match(boardMaterial.dynamicHeading,/Fyll 3 kurver/);

  const calmStart=await page.evaluate(()=>{
    const shell=document.querySelector('.gm-shell[data-gm-mode="mission"]');
    return {
      redundantHint:getComputedStyle(shell.querySelector('.gm-play-hint')).display,
      visibleEmptyTags:[...shell.querySelectorAll('.gm-crate[data-gm-count="0"] .gm-crate-tag')]
        .filter(el=>getComputedStyle(el).display!=='none').length,
      basketNames:[...shell.querySelectorAll('.gm-crate-caption')].map(el=>el.textContent.trim())
    };
  });
  assert.equal(calmStart.redundantHint,'none','speaking fox and illustrated steps must not be repeated in another instruction badge');
  assert.equal(calmStart.visibleEmptyTags,0,'empty market baskets should show simple clear names, not tiny 0/3 labels');
  assert.deepEqual(calmStart.basketNames,['Kurv 1','Kurv 2','Kurv 3'],'basket names remain clear');

  const tableArt=await page.request.get(new URL('gangemagi-market-table-premium.svg',url).href);
  assert.equal(tableArt.status(),200,'original illustrated market counter must load');
  assert.match(tableArt.headers()['content-type'],/image\/svg\+xml/);
  const illustratedCounter=await page.locator('.gm-crates').evaluate(el=>
    getComputedStyle(el,'::before').backgroundImage.includes('gangemagi-market-table-premium.svg'));
  assert.equal(illustratedCounter,true,'interactable baskets should stand in front of their own market-scene artwork');
  assert.match(await page.locator('.gm-top-title').innerText(),/Gangemagi/);
  assert.match(await page.locator('.gm-top-progress').innerText(),/Oppdrag 1 av 8/);
  if(viewport.width<=360){
    const compactHeader=await page.evaluate(()=>{
      const box=selector=>{
        const r=document.querySelector(selector).getBoundingClientRect();
        return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};
      };
      return {title:box('.gm-top-title'),progress:box('.gm-top-progress'),book:box('.gm-book-quick')};
    });
    const overlap=(a,b)=>a.left<b.right-2&&a.right>b.left+2&&a.top<b.bottom-2&&a.bottom>b.top+2;
    assert.equal(overlap(compactHeader.title,compactHeader.progress),false,
      label+' title overlaps progress badge on compact iPhone '+JSON.stringify(compactHeader));
    assert.equal(overlap(compactHeader.title,compactHeader.book),false,
      label+' title overlaps the collection button '+JSON.stringify(compactHeader));
  }
  assert.equal(await page.locator('.gm-crate-invite').count(),3,
    label+' three empty baskets should invite the first tap');
  assert.match(await page.locator('.gm-fox-message').innerText(),/Trykk på en kurv for å starte/);
  const first=await page.evaluate(()=>{
   const rect=s=>{const n=document.querySelector(s)?.getBoundingClientRect();return n?{top:n.top,bottom:n.bottom,width:n.width,height:n.height}:null;};
   return {screen:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,story:rect('.gm-story'),crate:rect('.gm-crate'),source:rect('.gm-pick'),math:rect('.gm-math'),read:rect('.gm-read')};
  });
  console.log('GANGEMAGI_FIRSTFOLD '+label+' '+JSON.stringify(first));
  assert.ok(first.scrollWidth<=first.screen+4,label+' horizontal overflow '+JSON.stringify(first));
  if(viewport.width>=700&&viewport.height>=viewport.width){
    const worldWidth=await page.locator('.gm-world').evaluate(el=>el.getBoundingClientRect().width);
    assert.ok(worldWidth>=700,label+' iPad portrait should use the full-width Tallenga scene '+worldWidth);
  }
  if(viewport.width>=700&&viewport.width<=899&&viewport.height>=1000){
    const sceneLayers=await page.evaluate(()=>({
      math:Number(getComputedStyle(document.querySelector('.gm-math')).zIndex),
      fox:Number(getComputedStyle(document.querySelector('.gm-fox')).zIndex),
      mathLabel:document.querySelector('.gm-math-label>span')?.textContent.trim()
    }));
    assert.ok(sceneLayers.math>sceneLayers.fox,
      label+' illustrated fox must not be painted over math labels '+JSON.stringify(sceneLayers));
    assert.match(sceneLayers.mathLabel,/Dette lager du/,
      'math label remains readable below the enlarged personal fox');
  }
  assert.ok(first.crate.top>=0&&first.crate.bottom<=first.height,label+' interactive crates not in the first viewport '+JSON.stringify(first));
  assert.ok(first.math.top<first.height,label+' mathematical feedback invisible '+JSON.stringify(first));
  assert.ok(first.read.height>=44,label+' read aloud target too small');
  if(viewport.height>=750||viewport.width<=360)assert.ok(first.source.bottom<=first.height+3,label+' primary Plukk action must be visible without scrolling '+JSON.stringify(first));
  // Visual QA: minus glyphs may not obscure numeric basket counts, and
  // the primary action label must not be clipped on the smallest iPhone.
  const touchGeometry=await page.evaluate(()=>{
    const overlaps=(a,b)=>a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;
    const baskets=[...document.querySelectorAll('.gm-crate-wrap')].map(w=>{
      const tag=w.querySelector('.gm-crate-tag').getBoundingClientRect();
      const icon=w.querySelector('.gm-remove span').getBoundingClientRect();
      return overlaps(tag,icon);
    });
    const label=document.querySelector('.gm-pick>span:nth-child(2)');
    return {overlaps:baskets,clipped:label.scrollWidth>label.clientWidth+1,lettering:label.innerText};
  });
  assert.deepEqual(touchGeometry.overlaps,Array(touchGeometry.overlaps.length).fill(false),label+' remove affordance must not cover numeric basket label '+JSON.stringify(touchGeometry));
  assert.equal(touchGeometry.clipped,false,label+' first-fold Plukk action text is clipped '+JSON.stringify(touchGeometry));
  await shot(page,label+'-01-first-look');
  await page.locator('[data-gm-action="basket"][data-gm-basket="0"]').click();
  assert.deepEqual((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).counts,[0,0,0],
    'choosing a basket cannot silently add a strawberry');
  assert.equal((await page.locator('.gm-crate-selected').count()),1,'one glowing chosen basket');
  assert.equal(await page.locator('.gm-crate-invite').count(),0,
    label+' remaining baskets should stop flashing after the child chooses one');
  assert.equal(await page.locator('.gm-quest-step-active[aria-current="step"][data-gm-step="2"]').count(),1,
    label+' second illustrated step guides berry placement after choosing');
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).selectedBasket,0);
  await page.locator('[data-gm-action="source"]').click();
  const firstBerryGeometry=await page.locator('[data-gm-basket="0"]').evaluate(basket=>{
    const berry=basket.querySelector('.gm-fruit:not(.gm-fruit-empty)');
    const b=basket.getBoundingClientRect(),f=berry?.getBoundingClientRect();
    return {basketWidth:b.width,
      horizontalDelta:f?Math.abs((f.left+f.right)/2-(b.left+b.right)/2):Infinity,
      berryTop:f?.top,basketTop:b.top,basketBottom:b.bottom,
      extraEmptyFruitSlots:basket.querySelectorAll('.gm-fruit-empty').length};
  });
  assert.equal(firstBerryGeometry.extraEmptyFruitSlots,0,'empty basket must not render ghost placeholders');
  assert.ok(firstBerryGeometry.horizontalDelta<firstBerryGeometry.basketWidth*.15,
    label+' first strawberry should sit inside the CENTER of the basket, not on one edge '+JSON.stringify(firstBerryGeometry));
  assert.ok(firstBerryGeometry.berryTop>firstBerryGeometry.basketTop,
    label+' strawberry must be inside the illustrated basket '+JSON.stringify(firstBerryGeometry));
  await shot(page,label+'-02-one-berry');
  await page.locator('[data-gm-action="source"]').click();
  assert.equal((await page.locator('.gm-math-equation').innerText()).trim(),'2 + 0 + 0 = 2');
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).counts[0],2);
  assert.match(await page.locator('.gm-fox-message').innerText(),/2 av 3 i kurv 1/);
  assert.equal(await page.locator('.gm-fox').getAttribute('data-mood'),'cheer');
  await page.locator('[data-gm-action="undo"]').click();
  assert.deepEqual((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).counts,[1,0,0]);
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).selectedBasket,0,
    label+' undoing one berry must keep the still-valid basket selected');
  assert.equal(await page.locator('.gm-crate-invite').count(),0,
    label+' do not invite a different basket after undoing in the chosen one');
  await page.locator('[data-gm-action="source"]').click();
  assert.deepEqual((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).counts,[2,0,0]);
  await page.locator('[data-gm-action="hint"]').click();
  assert.match(await page.locator('.gm-fox-message').innerText(),/kurv/i);
  await page.locator('[data-gm-action="remove"][data-group="0"]').click();
  assert.deepEqual((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).counts,[1,0,0]);
  for(const [group,count] of [[0,2],[1,3],[2,3]]){
    await selectAndPick(page,group,count);
    if(group<2){
      assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).selectedBasket,null,
        label+' a completed basket must release selection before the child chooses the next one');
      assert.equal(await page.locator('.gm-crate-invite').count(),2-group,
        label+' only unfinished baskets should invite the next choice');
      assert.equal(await page.locator('.gm-quest-step-active[aria-current="step"][data-gm-step="1"]').count(),1,
        label+' the first illustrated step should invite the next basket');
      assert.match(await page.locator('.gm-fox-message').innerText(),/Velg en ny kurv/,
        label+' fox gives a short instruction to continue');
    }
  }
  assert.equal((await page.locator('.gm-math-equation').innerText()).trim(),'3 × 3 = 9');
  assert.equal(await page.locator('.gm-quest-step-active[aria-current="step"][data-gm-step="3"]').count(),1,
    label+' final illustrated step celebrates the multiplication discovery');
  assert.match(await page.locator('.gm-math-discovery').innerText(),/Like grupper: 3 kurver med 3 bær = 9/,'multiplication has a child-readable explanation');
  assert.match(await page.locator('.gm-book-quick').innerText(),/1\/8/,'earned flowers remain visible during play');
  assert.match(await page.locator('.gm-celebration').innerText(),/Oppdraget er klart/);
  assert.equal(await page.locator('.gm-pick').count(),0,'completed tasks must not leave a disabled fruit button');
  assert.equal(await page.locator('.gm-actions-complete .gm-next').count(),1,'one clear next action');
  const celebrationOverlap=await page.evaluate(()=>{
    const r=s=>document.querySelector(s).getBoundingClientRect();
    const a=r('.gm-celebration'),b=r('.gm-fox-bubble');
    return {overlap:a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top,
      celebrationTop:a.top,foxBottom:b.bottom,viewportHeight:innerHeight,
      nextBottom:r('.gm-actions-complete .gm-next').bottom};
  });
  assert.equal(celebrationOverlap.overlap,false,label+' celebration must not cover the personal fox '+JSON.stringify(celebrationOverlap));
  if(viewport.height>=750||viewport.width<=360)assert.ok(celebrationOverlap.nextBottom<=viewport.height+3,label+' completed-child next action missing from first fold '+JSON.stringify(celebrationOverlap));
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).wins.length,1);
  await page.locator('[data-gm-action="undo"]').click();
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).wins.length,1,'earned blossom survives undo');
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).equation.complete,false);
  await selectAndPick(page,2,1);
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).wins.length,1,'replaying must not duplicate blossom');
  await shot(page,label+'-02-all-baskets-full');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.LARIA_GANGEMAGI?.version==='playable-v1');
  await page.evaluate(()=>window.openMultiplicationLab());
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).wins.length,1);
  assert.equal((await page.locator('.gm-math-equation').innerText()).trim(),'3 × 3 = 9');
  await page.locator('[data-gm-action="open-book"]').click();
  assert.equal(await page.locator('.gm-book-mission').count(),8,'all market adventures available');
  assert.equal(await page.locator('.gm-book-open[role="dialog"][aria-modal="true"]').count(),1,'open journal is a real immersive view');
  assert.equal(await page.locator('.gm-book-fox-art [data-avatar="girl"]').count(),1,'journal keeps the chosen fox');
  assert.equal(await page.locator('.gm-book-open .gm-book-pages').count(),1,'mission pages appear in the book');
   assert.equal(await page.locator('.gm-book-back').count(),1,'only one visible return control');
   assert.equal(await page.locator('.gm-book-open .gm-book-toggle').count(),0,'do not show a duplicate close control');
   assert.equal(await page.locator('.gm-book-fox-line').count(),1,'personal fox gives context');
   assert.equal(await page.locator('.gm-book-trophy').count(),1,'visible flower collection');
   const approvedImage=await page.request.get(new URL('gangemagi-approved-eight-scenes-20261017.webp',url).href);
   assert.equal(approvedImage.status(),200,'the approved original art must load');
   assert.match(approvedImage.headers()['content-type'],/image\/webp/,'original art has WebP MIME type');
  assert.equal(await page.locator('.gm-world').evaluate(el=>el.inert),true,'underlying math actions inaccessible while choosing a mission');
  await shot(page,label+'-04-market-book');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.gm-book-open').count(),0,'Escape returns child to gameplay');
  await page.locator('[data-gm-action="book"]').click();
  const bookLayout=await page.evaluate(()=>{
    const scenes=[...document.querySelectorAll('.gm-book-landscape')];
    return {pageWidth:document.documentElement.scrollWidth,screenWidth:innerWidth,count:scenes.length,
      assets:scenes.every(x=>getComputedStyle(x).backgroundImage.includes('gangemagi-approved-eight-scenes-20261017.webp')),
      distinct:new Set(scenes.map(x=>getComputedStyle(x).backgroundPosition)).size===8,
      rightOrder:scenes.every((x,i)=>Number(x.dataset.gmArtIndex)===i),
      touch:[...document.querySelectorAll('.gm-book-mission')].every(x=>x.getBoundingClientRect().height>=44)};
  });
  assert.ok(bookLayout.assets&&bookLayout.distinct&&bookLayout.rightOrder&&bookLayout.touch&&bookLayout.pageWidth<=bookLayout.screenWidth+4,
    label+' market-book illustrations, touch targets and widths '+JSON.stringify(bookLayout));
  assert.equal(await page.locator('.gm-book-earned').count(),1,'one earned flower marked in book');
  await page.locator('[data-gm-action="select-mission"][data-index="7"]').click();
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).mission,7);
  assert.equal(await page.locator('.gm-quest-filled-preview .gm-quest-mini-basket').count(),2,
    'final instructional art must follow the selected two-group mission');
  assert.equal(await page.locator('.gm-quest-filled-preview .gm-quest-mini-berries i').count(),20,
    label+' the last adventure visibly represents two baskets of TEN berries');
  assert.match((await page.locator('.gm-quest-callout').innerText()).replace(/\s+/g,' '),/Fyll 2 kurver med 10 jordbær i hver/,
    'quest text and numbers follow selected authored mission');
  assert.deepEqual(await page.locator('.gm-quest-step strong').allInnerTexts(),
    ['Velg en kurv','Legg i jordbær','Se at 2 × 10 = 20'],'step counts match actual mission, not a screenshot');
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).undo,0,'switching adventures clears only action history');
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).wins.length,1);
  assert.equal(await page.locator('.gm-book-mission').count(),0,'book should close after selection');
  await page.locator('[data-gm-action="book"]').click();
  await page.locator('[data-gm-action="select-mission"][data-index="0"]').click();
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).mission,0);
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).equation.complete,false);
  for(let group=0;group<3;group++)await selectAndPick(page,group,3);
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).wins.length,1,'replay keeps unique flower');
  await page.locator('[data-gm-action="next"]').click();
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).groups,2);
  await page.locator('[data-gm-action="mode"][data-mode="free"]').click();
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).mode,'free');
  assert.equal(await page.locator('.gm-quest').count(),0,'free play keeps its existing independent controls');
  assert.match(await page.locator('.gm-story').innerText(),/Ditt eget jordbærmarked/);
  await page.locator('[data-gm-action="factor"][data-key="groups"][data-step="1"]').click();
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).groups,3);
  await page.locator('[data-gm-action="basket"][data-gm-basket="0"]').click();
  assert.equal((await page.evaluate(()=>LARIA_GANGEMAGI.snapshot())).equation.multiplication,null);
  // Maximal load: every real item remains visible even with five small baskets.
  await page.locator('[data-gm-action="factor"][data-key="groups"][data-step="1"]').click();
  await page.locator('[data-gm-action="factor"][data-key="groups"][data-step="1"]').click();
  for(let i=0;i<5;i++)await page.locator('[data-gm-action="factor"][data-key="each"][data-step="1"]').click();
  const dense=await page.locator('.gm-fruit-bed').first().evaluate(el=>{
    const bed=el.getBoundingClientRect(),front=el.closest('.gm-crate').querySelector('.gm-crate-front').getBoundingClientRect();
    const fruits=[...el.querySelectorAll('.gm-fruit')].map(f=>f.getBoundingClientRect());
    return {count:fruits.length,columns:getComputedStyle(el).gridTemplateColumns.split(' ').length,
      inside:fruits.every(f=>f.width>=11&&f.height>=16&&f.top>=bed.top-1&&f.bottom<=bed.bottom+1),
      aboveFront:fruits.every(f=>f.bottom<=front.top+3),
      scrollWidth:document.documentElement.scrollWidth,innerWidth:innerWidth};
  });
  assert.equal(dense.count,10,label+' dense basket must show ten individual slots');
  assert.equal(dense.columns,5,label+' dense basket needs an even 5x2 arrangement');
  assert.ok(dense.inside&&dense.aboveFront,label+' fruit hidden behind a basket front '+JSON.stringify(dense));
  assert.ok(dense.scrollWidth<=dense.innerWidth+4,label+' five baskets overflow the page');
  await shot(page,label+'-03-free-play');
  await page.locator('[data-gm-action="classic"]').click();
  await page.locator('.mp-home-screen').waitFor();
  await page.locator('.gm-classic-return').click();
  await page.locator('.gm-shell').waitFor();
  assert.deepEqual(errors,[],label+' browser exceptions '+JSON.stringify(errors));
  console.log('PASS GANGEMAGI '+label);
 }finally{await context.close();}
}
(async()=>{
 const {srv,url}=await serve();
 try{
  for(const [type,browserType,devices] of [
   ['chrome',chromium,[['iphone390',{width:390,height:844}],['ipad-landscape',{width:1180,height:820}]]],
   ['webkit',webkit,[['iphone-small',{width:320,height:568}],['iphone390',{width:390,height:844}],['ipad-portrait',{width:820,height:1180}],['ipad-landscape',{width:1180,height:820}]]]
  ]){
   const browser=await browserType.launch({headless:true});
   try{for(const [device,viewport] of devices)await check(browser,type+'-'+device,viewport,url);}finally{await browser.close();}
  }
 }finally{await new Promise(resolve=>srv.close(resolve));}
})().catch(err=>{console.error(err);process.exitCode=1;});
