'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Tallvika QA',avatar:'girl',setupVersion:2},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const output=process.env.LARIA_TALLVIKA_SCREENSHOTS;
async function shot(page,name){if(output){fs.mkdirSync(output,{recursive:true});await page.screenshot({path:path.join(output,name+'.png'),animations:'disabled',fullPage:true});}}
async function enter(page){
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
  const tile=page.locator('.bc14-subject[data-camp="subject-math"]');await tile.waitFor({timeout:18000});await tile.click();
  await page.locator('#tallvika-world').waitFor({state:'visible',timeout:18000});
  assert.equal(await page.locator('#subject-screen').evaluate(el=>el.classList.contains('locked-journey-active')),false,
    'Tallvika must not inherit the legacy journey display:none contract');
  assert.equal(await page.locator('#subject-screen').evaluate(el=>el.classList.contains('premium-journey-active')),false,
    'Tallvika must clear the retired premium journey view state');
}
async function run(browserType,label,viewport){
  const browser=await browserType.launch({headless:true,args:browserType===chromium?['--no-sandbox']:[]});
  try{
    const context=await browser.newContext({viewport,isMobile:viewport.width<=480,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
    // Seed only a fresh browser profile. The persistence assertion below
    // reloads the page; overwriting storage on every navigation makes the
    // test itself discard the child's legitimately saved troll selection.
    await context.addInitScript(value=>{
      if(!localStorage.getItem('laerlittmer-v2'))
        localStorage.setItem('laerlittmer-v2',JSON.stringify(value));
    },seed);
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('https://raw.githubusercontent.com/**',route=>route.abort());await page.route('https://api.worldbank.org/**',route=>route.abort());
    await enter(page);await shot(page,label);
    assert.equal(await page.locator('.tv-scene').count(),1,label+' renders one locked Tallvika scene');
    assert.equal(await page.locator('.tv-scene').evaluate(el=>getComputedStyle(el).backgroundImage.includes('tallvika-master-laast-20261025.png')),true,label+' uses the locked landscape');
    // The destination library is an illustrated, accessible part of the world
    // at every screen size, not generic text-only cards or hidden legacy links.
    const portalCards=page.locator('#tallvika-world .tv-mobile-actions .tv-portal-card');
    await page.waitForFunction(()=>{
      const cards=[...document.querySelectorAll('#tallvika-world .tv-mobile-actions .tv-portal-card')];
      return cards.length===3&&cards.every(card=>card.isConnected&&card.getBoundingClientRect().width>=180);
    },null,{timeout:16000});
    assert.equal(await portalCards.count(),3,label+' must expose three premium activity portals');
    assert.equal(await page.evaluate(()=>{
      const original=document.querySelector('.tv-portal-card');
      window.LARIA_TALLVIKA.build();
      return original===document.querySelector('.tv-portal-card');
    }),true,label+' redundant legacy screen update detached live portal buttons');
    const portalAudit=await portalCards.evaluateAll(nodes=>nodes.map(node=>{
      const r=node.getBoundingClientRect();
      const art=node.querySelector('.tv-portal-art');
      const detail=node.querySelector('.tv-portal-copy small');
      const eyebrow=node.querySelector('.tv-portal-kicker');
      const title=node.querySelector('.tv-portal-copy b');
      return {name:node.getAttribute('aria-label'),height:r.height,width:r.width,
        image:art?getComputedStyle(art).backgroundImage:'none',artHeight:art?.getBoundingClientRect().height,
        detailPx:parseFloat(getComputedStyle(detail).fontSize),
        eyebrowPx:parseFloat(getComputedStyle(eyebrow).fontSize),
        titlePx:parseFloat(getComputedStyle(title).fontSize)};
    }));
    assert(portalAudit.every(item=>item.height>=90&&item.width>=180&&item.artHeight>=85),
      label+' illustrated tap targets too small: '+JSON.stringify(portalAudit));
    assert(portalAudit.every(item=>item.name?.startsWith('Åpne ')&&
      item.image.includes('tallvika-master-laast-20261025.png')),
      label+' must use original, unmodified image on each portal');
    assert(portalAudit.every(x=>x.detailPx>=12&&x.eyebrowPx>=10&&x.titlePx>=18),
      label+' activity card typography is too small: '+JSON.stringify(portalAudit));
    // The source painting also carries the hut name and a separate
    // "Neste eventyr" sign. The tight Gangetabellen window must not show
    // fragments of either sign around the reused blackboard illustration.
    const tableCrop=await page.locator('.tv-portal-art-table').evaluate(el=>{
      const style=getComputedStyle(el),box=el.getBoundingClientRect();
      const zoom=parseFloat(style.backgroundSize.split(',').pop().trim());
      const yPercent=parseFloat(style.backgroundPosition.split(',').pop().trim().split(/\s+/)[1]);
      const paintedWidth=box.width*zoom/100,paintedHeight=paintedWidth*941/1672;
      const naturalScale=paintedWidth/1672;
      const cropOffset=(paintedHeight-box.height)*yPercent/100;
      return {sourceTop:cropOffset/naturalScale,sourceBottom:(cropOffset+box.height)/naturalScale};
    });
    assert(tableCrop.sourceTop>490&&tableCrop.sourceBottom<815,
      label+' the Gangetabellen crop exposes a clipped painted sign: '+JSON.stringify(tableCrop));
    if(viewport.width>700){
      const cues=await page.locator('#tallvika-world .tv-scene .tv-hotspot-cue').evaluateAll(nodes=>
        nodes.map(n=>({w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height})));
      assert.equal(cues.length,3,label+' missing original house affordances');
      assert(cues.every(x=>x.w<=34&&x.h<=34),
        label+' activity markers cover too much of the painted houses: '+JSON.stringify(cues));
    }
    const art=await page.locator('.tv-scene').evaluate(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height,scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
    assert.ok(art.w>250,label+' has a visible world');assert.ok(art.scroll<=art.client+2,label+' has no horizontal overflow');
    assert.equal(await page.locator('.tv-dock-intro h1').evaluate(el=>getComputedStyle(el).color),
      'rgb(73, 48, 30)',label+' generic legacy blue heading leaked into Tallvika');
    const layout=await page.evaluate(()=>{
      const stage=document.querySelector('.tv-stage').getBoundingClientRect();
      const dock=document.querySelector('.tv-dock').getBoundingClientRect();
      return {stage:{top:stage.top,bottom:stage.bottom,right:stage.right},
        dock:{top:dock.top,left:dock.left}};
    });
    if(viewport.width>=1030||(viewport.width>=701&&viewport.height<=550)){
      // Keyboard focus connects the activity card to its painted hut;
      // this also makes the navigation discoverable without hover.
      await page.locator('.tv-portal-card[data-tv="fraction"]').focus();
      assert.equal(await page.locator('.tv-hotspot-fraction .tv-hotspot-cue').evaluate(
        el=>getComputedStyle(el).transform!=='none'),true,label+' portal focus did not highlight the matching hut');
      await page.locator('.tv-portal-card[data-tv="fraction"]').evaluate(el=>el.blur());
      assert.ok(layout.stage.right<=layout.dock.left+2,label+' landscape portal dock overlaps painting');
      if(viewport.width>=1030)assert.ok(art.w>=viewport.width*.58,
        label+' world is still compressed by the former 1000px app shell');
      assert.ok(Math.abs(layout.stage.top-layout.dock.top)<55,label+' landscape should show portals beside the world');
    }else{
      assert.ok(layout.dock.top>=layout.stage.bottom-2,label+' portrait portal panel must follow the uncropped art');
    }
    const shell=await page.locator('.app').evaluate(el=>({
      padding:parseFloat(getComputedStyle(el).paddingBottom),
      background:getComputedStyle(el).backgroundColor
    }));
    assert.equal(shell.padding,0,label+' must not retain the hidden bottom navigation gutter');
    assert.equal(shell.background,'rgb(247, 240, 223)',label+' must match Tallvika cream below the scene');
    assert.equal(await page.locator('#subject-screen').evaluate(el=>getComputedStyle(el).backgroundColor),
      'rgb(247, 240, 223)',label+' must not expose the former dark journey background');
    if(viewport.width<=480){
      // Painted houses on small iPhones must open the actual games,
      // even though their arrow ornaments are hidden for legibility.
      const spots=await page.locator('#tallvika-world .tv-scene .tv-hotspot').evaluateAll(nodes=>
        nodes.map(node=>{const r=node.getBoundingClientRect();return {
          action:node.dataset.tv,width:r.width,height:r.height,
          display:getComputedStyle(node).display
        }}));
      assert.equal(spots.length,3,label+' lost one of the three painted houses');
      assert(spots.every(x=>x.width>=44&&x.height>=44&&x.display!=='none'),
        label+' painted houses are not tappable on phones: '+JSON.stringify(spots));
      await page.locator('.tv-scene .tv-hotspot[data-tv="multiply"]').click();
      await page.locator('#multiplication-lab-screen.active .gm-shell').waitFor({timeout:14000});
      assert.equal(await page.locator('#multiplication-lab-back').getAttribute('aria-label'),
        'Tilbake til Tallvika',label+' painted Gangemagi back has wrong destination');
      await page.locator('#multiplication-lab-back').click();
      await page.locator('#subject-screen.active #tallvika-world').waitFor({state:'visible',timeout:14000});
      await page.locator('.tv-portal-card.tv-visited[data-tv="multiply"]').waitFor();
      await page.waitForFunction(()=>document.activeElement?.classList.contains('tv-hotspot'));
    }
    await page.locator('#tallvika-world [data-tv="grade"]').click();
    await page.locator('#tallvika-world .tv-grade-dialog[open]').waitFor();
    assert.equal(await page.locator('#tallvika-world [data-tv-grade]').count(),10,label+' grade options missing');
    await page.locator('#tallvika-world [data-tv-grade="3"]').click();
    assert.deepEqual(await page.evaluate(()=>[window.LARIA_TALLVIKA_BRIDGE.currentGrade(),window.LARIA_TALLVIKA_BRIDGE.journeyViewGrade('math')]),[2,3],label+' grade view must not change the profile');
    await page.locator('#tallvika-world [data-tv="grade"]').click();
    await page.locator('#tallvika-world .tv-grade-dialog[open] [data-tv-grade="2"]').click();
    if(viewport.width<=480){
      // Inspect the real last viewport fold, not only a container's style:
      // legacy fixed navigation can cover an otherwise correctly painted page.
      const footer=await page.evaluate(()=>{
        const point=[Math.round(innerWidth/2),Math.round(innerHeight-36)];
        const stack=document.elementsFromPoint(...point).slice(0,10).map(el=>{
          const style=getComputedStyle(el),box=el.getBoundingClientRect();
          return {tag:el.tagName,id:el.id,cls:String(el.className).slice(0,95),bg:style.backgroundColor,
            bgImage:style.backgroundImage.slice(0,80),position:style.position,
            rect:{top:Math.round(box.top),bottom:Math.round(box.bottom)}};
        });
        return {point,html:getComputedStyle(document.documentElement).backgroundColor,
          body:getComputedStyle(document.body).backgroundColor,
          app:getComputedStyle(document.querySelector('.app')).backgroundColor,stack};
      });
      console.log('[TALLVIKA_FOOTER_AUDIT]',label,JSON.stringify(footer));
    }
    if(viewport.width<=480){
      // The locked landscape carries both the world sign and the house labels.
      // Cropping it on narrow portrait phones cuts off the approved artwork.
      assert.ok(Math.abs(art.h-art.w*941/1672)<3,label+' must show the entire uncropped Tallvika artwork on portrait phones');
      assert.equal(await page.locator('.tv-scene-copy').isVisible(),false,label+' must not duplicate the painted world sign');
      assert.equal(await page.locator('.tv-mobile-actions [data-tv]').count(),3,label+' keeps all three accessible activity buttons');
    }
    await page.locator('[data-tv="choose"]').first().click();await page.locator('.tv-dialog[open]').waitFor();
    assert.equal(await page.locator('[data-tv-troll]').count(),3,label+' offers all three locked trolls');
    // Every original forest troll must be selectable, render from its own
    // approved image, and persist without changing the child's learning data.
    for(const id of ['storesoster','lillesoster','lillebror']){
      if(id!=='storesoster'){
        await page.locator('#tallvika-world [data-tv="choose"]').click();
        await page.locator('.tv-dialog[open]').waitFor();
      }
      await page.locator('[data-tv-troll="'+id+'"]').click();
      assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2')).profile.tallvikaTroll),id,label+' does not persist '+id);
      const image=page.locator('#tallvika-world .tv-companion img');
      assert.ok((await image.getAttribute('src')).includes('/'+id+'.webp'),label+' shows wrong troll for '+id);
      await image.evaluate(img=>img.decode());
      if(viewport.width<=480&&output)await shot(page,label+'-'+id);
    }
    await page.reload({waitUntil:'domcontentloaded',timeout:90000});await page.locator('.bc14-subject[data-camp="subject-math"]').click();await page.locator('#tallvika-world').waitFor();
    assert.match(await page.locator('.tv-companion').getAttribute('aria-label'),/Lillebror/,label+' restores selected troll');
    assert.equal(await page.locator('.tv-portal-card.tv-visited').count(),0,
      label+' return highlight must not be stored as learning progress');
    // Exercise the illustrated destination button itself, not only
    // invisible hotspots embedded in the original painting.
    // Restore scroll/focus and leave Brøklab in ONE action, even when the
    // child is on another internal tab. No forced tutorial or start menu.
    await page.locator('.tv-mobile-actions [data-tv="fraction"]').scrollIntoViewIfNeeded();
    const previousWorldScroll=await page.evaluate(()=>window.scrollY);
    const beforeFraction=await page.evaluate(()=>JSON.stringify(state.journey));
    await page.locator('.tv-mobile-actions [data-tv="fraction"]').click();
    await page.locator('#fraction-lab-screen.active .fr6-workshop').waitFor({timeout:12000});
    assert.equal(await page.locator('#fraction-lab-back').getAttribute('aria-label'),
      'Tilbake til Tallvika',label+' fraction back must name the real destination');
    assert.match(await page.locator('.fr2-top .tv-origin-breadcrumb').innerText(),/TALLVIKA \/ BRØKLAB/);
    await page.locator('.fr2-nav [data-fr-action="go"][data-page="home"]').click();
    await page.locator('#fraction-lab-screen.active .fr2-home-card').first().waitFor({timeout:12000});
    await page.locator('#fraction-lab-back').click();
    await page.locator('#subject-screen.active #tallvika-world').waitFor({state:'visible',timeout:12000});
    await page.locator('.tv-portal-card.tv-visited[data-tv="fraction"]').waitFor();
    await page.waitForFunction(()=>document.activeElement?.dataset.tv==='fraction');
    await page.waitForFunction(y=>Math.abs(window.scrollY-y)<130,previousWorldScroll,{timeout:12000});
    assert.equal(await page.evaluate(()=>JSON.stringify(state.journey)),beforeFraction,
      label+' entering and exiting Brøklab must not modify chapter progress');
    // Core regression: Gangetabellen is a separate activity from Gangemagi.
    // Opening the table from Tallvika must skip Gangemagi and the legacy
    // launcher, immediately showing the 10 x 10 interactive explorer.
    const journeyBeforeTable=await page.evaluate(()=>JSON.stringify(state.journey));
    await page.locator('.tv-mobile-actions [data-tv="table"]').click();
    await page.locator('#multiplication-lab-screen.active .mp-explore-screen').waitFor({timeout:12000});
    const tableState=await page.evaluate(()=>window.LARIA_MULT_PREMIUM.snapshot());
    assert.equal(tableState.page,'explore',label+' Gangetabellen opened an extra launcher');
    assert.equal(tableState.mode,'table',label+' Gangetabellen opened the wrong explore mode');
    assert.equal(await page.locator('.mp-explore-tab[data-mode="table"][aria-pressed="true"]').count(),1,
      label+' table mode must be selected');
    assert.equal(await page.locator('.mp-times-grid button.mp-grid-cell').count(),100,
      label+' table must contain all 100 multiplication answers');
    assert.equal(await page.locator('#multiplication-lab-screen.active .gm-shell').count(),0,
      label+' the table entry wrongly opened Gangemagi');
    await page.locator('.mp-grid-cell[data-row="2"][data-col="3"]').click();
    assert.equal((await page.locator('.mp-inspector-equation b').innerText()).trim(),'2 × 3 = 6',
      label+' interactive 10 x 10 table did not respond to a cell');
    assert.equal(await page.locator('#multiplication-lab-back').getAttribute('aria-label'),
      'Tilbake til Tallvika',label+' direct table back has wrong destination');
    assert.match(await page.locator('.mp-top .tv-origin-breadcrumb').innerText(),/TALLVIKA \/ GANGETABELLEN/);
    // Even from a different internal page, Back leaves in one tap.
    await page.locator('.mp-nav [data-mp-action="go"][data-page="mastery"]').click();
    await page.locator('#multiplication-lab-screen.active .mp-mastery-screen').waitFor({timeout:12000});
    await page.locator('#multiplication-lab-back').click();
    await page.locator('#subject-screen.active #tallvika-world').waitFor({state:'visible',timeout:12000});
    await page.locator('.tv-portal-card.tv-visited[data-tv="table"]').waitFor();
    await page.waitForFunction(()=>document.activeElement?.dataset.tv==='table');
    assert.equal(await page.evaluate(()=>JSON.stringify(state.journey)),journeyBeforeTable,
      label+' direct table exploration changed the journey progress');
    // The adjacent house is the original Gangemagi game, not a duplicate
    // of the classic table. A return from the table must not poison this route.
    await page.locator('.tv-mobile-actions [data-tv="multiply"]').click();
    await page.locator('#multiplication-lab-screen.active .gm-shell').waitFor({timeout:12000});
    assert.equal(await page.locator('.mp-explore-screen').count(),0,
      label+' Gangemagi was replaced by the previous table');
    assert.equal(await page.locator('#multiplication-lab-back').getAttribute('aria-label'),
      'Tilbake til Tallvika',label+' Gangemagi back lost Tallvika context');
    await page.locator('#multiplication-lab-back').click();
    await page.locator('#subject-screen.active #tallvika-world').waitFor({state:'visible',timeout:12000});
    await page.locator('.tv-portal-card.tv-visited[data-tv="multiply"]').waitFor();
    await page.waitForFunction(()=>document.activeElement?.dataset.tv==='multiply');
    assert.deepEqual(errors,[],label+' emits no page errors');
    await context.close();
  } finally {await browser.close();}
}
(async()=>{for(const [label,viewport] of [['iphone-portrait',{width:390,height:844}],['iphone-landscape',{width:844,height:390}],['ipad-portrait',{width:834,height:1112}],['ipad-landscape',{width:1194,height:834}]]){await run(chromium,'chromium-'+label,viewport);await run(webkit,'webkit-'+label,viewport);}})().catch(error=>{console.error(error);process.exitCode=1});
