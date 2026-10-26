'use strict';
/* Regression: Home v15 is troll-led, while the child's ONE chosen fox still
   reacts and moves through real journeys and tasks. No click may modify saved
   progress accidentally. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const dir=process.env.LARIA_LIVE_FOX_QA||'/tmp/laria-live-fox';
fs.mkdirSync(dir,{recursive:true});
function seed(avatar){
  return {
    version:7,progressSchemaVersion:3,
    profile:{grade:2,onboarded:true,name:'ReveQA',avatar,setupVersion:2},
    mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},
    preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,
    journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null,
    collectibles:{version:1,ownedIds:['magisk-samlebok','oppdagerhatt'],equipped:{head:'oppdagerhatt',neck:null,back:null,cape:null}}
  };
}
async function run(engine,name,viewport,avatar){
  const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
  try{
    const context=await browser.newContext({
      viewport,isMobile:viewport.width<600,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'
    });
    await context.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed(avatar));
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
    await page.route('https://api.worldbank.org/**',r=>r.abort());
    const url=(process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria')+'&live-fox='+name;
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.locator('#home-screen.active .bc12').waitFor({timeout:17000});
    await page.waitForFunction(()=>!!window.LARIA_FOX_PRESENCE?.react,{timeout:15000});
    const home=page.locator('#home-screen.active .bc12-fox');
    await home.waitFor({state:'attached',timeout:12000});
    assert.equal(await page.evaluate(()=>window.LARIA_FOX_PRESENCE.activeAvatar()),avatar,name+' saved avatar changed');
    assert.equal(await page.evaluate(()=>window.LARIA_COLLECTION_STORE.snapshot().equipped.head),'oppdagerhatt',name+' hidden outfits must remain stored');
    const lockedHome=await page.locator('#home-screen.active .bc12.bc15-locked-home').count()>0;
    if(lockedHome){
      assert.equal(await home.isVisible(),false,name+' Home v15 must be led by the locked troll trio, not the old fox');
      assert.equal(await page.locator('.bc12-nav [data-camp="wardrobe"]').getAttribute('aria-label'),'Mine troll',
        name+' Home v15 must expose the troll entry');
      assert.equal(await home.getAttribute('data-avatar'),avatar,name+' hidden fox identity must stay synchronized behind troll Home');
      assert.equal(await page.evaluate(()=>window.LARIA_FOX_PRESENCE.react('greet')),true);
      assert.equal(await home.getAttribute('data-laria-fox-mood'),'greet',
        name+' hidden fox presence state must remain ready for journey handoff');
    }else{
      await page.waitForFunction(()=>document.querySelector('.bc12-fox .laria-fox-pose'),null,{timeout:12000});
      assert.equal(await home.locator('svg.laria-fox-wardrobe-art .laria-fox-pose').count(),1,name+' missing single personal fox rig');
      assert.equal(await home.locator('.laria-fox-wardrobe-art [data-gear]').count(),0,name+' unpublished hat leaked onto chosen fox');
      const source=await home.locator('svg.laria-fox-wardrobe-art image').getAttribute('href');
      assert.match(source,avatar==='girl'?/girl-braids-blue-dress-v1\.webp$/:/boy-adventurer-green-vest-v1\.webp$/,
        name+' must render the actual chosen full-body fox, never a portrait photo');
      const rigType=await home.locator('svg.laria-fox-wardrobe-art').getAttribute('data-fox-art');
      assert.equal(rigType,avatar+'-fullbody-v1',name+' character rig does not match selected full-body fox');
      const geometry=await home.evaluate(el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height}});
      assert(geometry.height>=geometry.width*1.3,name+' character was squashed into a portrait circle '+JSON.stringify(geometry));
      assert.equal(await home.evaluate(el=>getComputedStyle(el).borderRadius),'0px',
        name+' full-body companion should never sit in the old round portrait frame');
      assert.equal(await page.evaluate(()=>window.LARIA_FOX_PRESENCE.react('greet')),true);
      assert.equal(await home.getAttribute('data-laria-fox-mood'),'greet');
    }
    await page.screenshot({path:path.join(dir,name+'-home.png'),animations:'disabled'});

    // Norsk now uses Eggenipa's direct reading activity, never the retired Bokskogen map.
    await page.locator('.bc14-subject[data-camp="subject-norwegian"]').click();
    const eg=page.locator('#eggenipa-world:visible');
    await eg.waitFor({timeout:16000});
    assert.deepEqual(await eg.locator('.eg-portal').evaluateAll(els=>els.map(el=>el.dataset.eg)),
      ['words','find','reading'],name+' Norsk direct activities changed');
    assert.equal(await page.locator('#subject-screen.active .locked-journey-map:visible').count(),0,
      name+' retired Bokskogen map is visible');
    const journeyProgress=()=>page.evaluate(()=>{
      const j=JSON.parse(localStorage.getItem('laerlittmer-v2')).journey||{};
      return JSON.stringify({
        nodes:j.nodes||{},gradeWins:j.gradeWins||{},
        viewGrades:j.viewGrades||{},chapterProgress:j.chapterProgress||{}
      });
    });
    const beforeReading=await journeyProgress();
    await eg.locator('.eg-portal[data-eg="reading"]').click();
    await page.locator('#session-screen.active .laria-task-card').waitFor({timeout:16000});
    assert.equal(await page.evaluate(()=>sessionScope?.subject),'norwegian');
    assert.equal(await page.evaluate(()=>sessionScope?.module),'reading');
    assert.ok(await page.evaluate(()=>sessionQuestions[qIndex]?.prompt),name+' Lesekroken missing question');
    assert.equal(await page.locator('#session-screen.active .task-fox-companion').count(),0,
      name+' retired fox leaked into Norwegian reading');
    assert.equal(await page.locator('#session-screen.active .task-norsk-guide').count(),1,
      name+' Norwegian hint guide missing');
    assert.equal(await page.evaluate(()=>window.LARIA_FOX_PRESENCE.activeAvatar()),avatar,
      name+' Norsk redesign changed saved profile identity');
    await page.screenshot({path:path.join(dir,name+'-eggenipa-reading.png'),animations:'disabled'});
    await page.locator('#close-session').click();
    await eg.waitFor({timeout:16000});
    const afterReading=await journeyProgress();
    assert.equal(afterReading,beforeReading,name+' browsing Lesekroken altered historical journey');
    await eg.locator('[data-eg="home"]').click();
    await page.locator('#home-screen.active .bc14-subject[data-camp="subject-english"]').click();
    const map=page.locator('#subject-screen.active .locked-journey-map[data-journey-subject="english"]');
    await map.waitFor({timeout:16000});
    const fox=map.locator('.locked-journey-traveler');
    // The approved PNG is deliberately decoded before the map's real fox
    // enters the DOM; the warm loading scene has no synthetic traveler.
    await fox.waitFor({state:'attached',timeout:20000});
    assert.equal(await fox.count(),1,name+' must have exactly one movable personal fox');
    await fox.locator('svg.laria-fox-wardrobe-art .laria-fox-pose').waitFor({timeout:12000});
    assert.equal(await fox.getAttribute('data-avatar'),avatar,name+' route changed fox identity');
    const cameo=map.locator('.locked-journey-profile[data-avatar="'+avatar+'"]');
    assert.equal(await cameo.count(),1,name+' chosen fox header cameo missing');
    const cameoArt=await cameo.evaluate(el=>getComputedStyle(el,'::after').backgroundImage);
    assert.match(cameoArt,avatar==='girl'?/girl-braids-face-v1\.webp/:/boy-adventurer-face-v1\.webp/,
      name+' header portrait does not match the selected full-body explorer');

    assert.equal(await fox.locator('.laria-fox-wardrobe-art [data-gear]').count(),0,name+' unreleased clothing leaked onto journey fox');
    const initial=await fox.evaluate(el=>({x:el.style.getPropertyValue('--fox-x'),y:el.style.getPropertyValue('--fox-y')}));
    const before=await page.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('laerlittmer-v2')).journey));
    await map.locator('.locked-journey-hotspot').nth(3).click();
    assert.equal(await fox.getAttribute('data-laria-fox-stop'),'3',name+' fox did not travel to clicked landmark');
    assert.equal(await fox.getAttribute('data-laria-fox-mood'),'walking',name+' fox walking response missing');
    const moved=await fox.evaluate(el=>({x:el.style.getPropertyValue('--fox-x'),y:el.style.getPropertyValue('--fox-y')}));
    assert.notDeepEqual(moved,initial,name+' traveler stayed on previous stop');
    await page.locator('.locked-sheet-close').click();
    const after=await page.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('laerlittmer-v2')).journey));
    assert.equal(after,before,name+' fox movement must not fake mastery');
    assert.equal(await fox.evaluate(el=>getComputedStyle(el).pointerEvents),'none',name+' fox steals map taps');
    await page.screenshot({path:path.join(dir,name+'-journey.png'),animations:'disabled'});
    // Tour the two still-active legacy map worlds; Norsk and Matte have direct activity worlds.
    // Ensure one grounded traveler, safe taps and no accidental learning-state changes.
    const subjects=['english','geography'];
    for(let subjectIndex=0;subjectIndex<subjects.length;subjectIndex++){
      const subject=subjects[subjectIndex];
      if(subjectIndex>0){
        await page.locator('.screen.active .locked-journey-back').click();
        await page.locator('#home-screen.active .bc14-subject[data-camp="subject-'+subject+'"]').waitFor({timeout:12000});
        await page.locator('#home-screen.active .bc14-subject[data-camp="subject-'+subject+'"]').click();
      }
      const activeMap=page.locator('.screen.active .locked-journey-map[data-journey-subject="'+subject+'"]');
      await activeMap.waitFor({timeout:15000});
      const traveler=activeMap.locator('.locked-journey-traveler');
      await traveler.locator('svg.laria-fox-wardrobe-art').waitFor({timeout:12000});
      assert.equal(await traveler.count(),1,name+' '+subject+' duplicate traveler');
      assert.equal(await traveler.getAttribute('data-avatar'),avatar,name+' '+subject+' selected a different fox');
      assert.equal(await traveler.locator('[data-gear]').count(),0,name+' '+subject+' exposed deferred clothing');
      const cleaned=activeMap.locator('.locked-journey-fox-free');
      assert.equal(await cleaned.count(),1,name+' '+subject+' has no painted-fox removal');
      await cleaned.evaluate(img=>img.decode());
      const beforeMap=await page.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('laerlittmer-v2')).journey));
      for(let stop=0;stop<5;stop++){
        await activeMap.locator('.locked-journey-hotspot').nth(stop).click();
        await page.locator('.locked-journey-overlay:not([hidden])').waitFor({timeout:10000});
        assert.equal(await traveler.getAttribute('data-laria-fox-stop'),String(stop),
          name+' '+subject+' traveler missed painted landmark '+stop);
        // The premium sheet temporarily PORTALS the actual map fox, not a
        // duplicate mascot. Check its only rig in the sheet first, then its
        // grounded physical map position after the sheet closes.
        const sheetFox=await traveler.evaluate(el=>{
          const stage=el.closest('.mission-fox-stage');
          return {stage:!!stage,oneRig:el.querySelectorAll(':scope > .laria-fox-wardrobe-placed').length,
            width:el.getBoundingClientRect().width,interactive:getComputedStyle(el).pointerEvents};
        });
        assert.equal(sheetFox.stage,true,name+' '+subject+' fox not integrated in premium mission sheet');
        assert.equal(sheetFox.oneRig,1,name+' '+subject+' duplicated full-body rig in mission sheet');
        assert(sheetFox.width>=35,name+' '+subject+' fox hidden or too small in mission sheet');
        assert.equal(sheetFox.interactive,'none',name+' '+subject+' fox blocks menu taps');
        await page.locator('.locked-sheet-close').click();
        assert.equal(await traveler.evaluate(el=>!!el.closest('.locked-journey-board')),true,
          name+' '+subject+' original fox was not returned to its map');
        const position=await traveler.evaluate(el=>{
          const fox=el.getBoundingClientRect(),board=el.closest('.locked-journey-board').getBoundingClientRect();
          return {left:fox.left-board.left,right:board.right-fox.right,
            top:fox.top-board.top,bottom:board.bottom-fox.bottom,interactive:getComputedStyle(el).pointerEvents};
        });
        assert(position.left>=-3&&position.right>=-3&&position.top>=-3&&position.bottom>=-3,
          name+' '+subject+' fox clipped at stop '+stop+' '+JSON.stringify(position));
        assert.equal(position.interactive,'none',name+' '+subject+' mascot blocks destination taps');
        const visibleCharacter=await traveler.evaluate(el=>{
          const wrapper=el.getBoundingClientRect();
          const svg=el.querySelector(':scope > .laria-fox-wardrobe-placed');
          if(!svg)return {missing:true};
          const rect=svg.getBoundingClientRect();
          return {missing:false,width:rect.width,height:rect.height,
            wrapperWidth:wrapper.width,wrapperHeight:wrapper.height,
            leftDelta:rect.left-wrapper.left,topDelta:rect.top-wrapper.top};
        });
        assert(!visibleCharacter.missing&&
          Math.abs(visibleCharacter.width-visibleCharacter.wrapperWidth)<=2&&
          Math.abs(visibleCharacter.height-visibleCharacter.wrapperHeight)<=2&&
          Math.abs(visibleCharacter.leftDelta)<=2&&Math.abs(visibleCharacter.topDelta)<=2,
          name+' '+subject+' sprite overflowed its real standing anchor at stop '+stop+
          ' '+JSON.stringify(visibleCharacter));
        const paintedSignOverlap=await traveler.evaluate(el=>{
          const fox=el.querySelector(':scope > .laria-fox-wardrobe-placed').getBoundingClientRect();
          const signs=el.closest('.locked-journey-board').querySelectorAll('.locked-journey-hotspot');
          return [...signs].map((sign,i)=>{
            const box=sign.getBoundingClientRect();
            const w=Math.max(0,Math.min(fox.right,box.right)-Math.max(fox.left,box.left));
            const h=Math.max(0,Math.min(fox.bottom,box.bottom)-Math.max(fox.top,box.top));
            return {sign:i+1,area:Math.round(w*h)};
          }).filter(hit=>hit.area>8);
        });
        assert.deepEqual(paintedSignOverlap,[],name+' '+subject+
          ' fox covers a real illustrated sign at stop '+stop+': '+JSON.stringify(paintedSignOverlap));
        // Preserve one complete 20-stop visual evidence set in actual WebKit
        // iPhone mode, beyond the strict non-overlap geometry assertions.
        if(name==='webkit-girl-iphone')await page.screenshot({
          path:path.join(dir,name+'-'+subject+'-stop-'+(stop+1)+'.png'),
          animations:'disabled'
        });
      }
      const afterMap=await page.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('laerlittmer-v2')).journey));
      assert.equal(afterMap,beforeMap,name+' '+subject+' fox movement changed learning progression');
      await page.screenshot({path:path.join(dir,name+'-'+subject+'-final-stop.png'),animations:'disabled'});
    }
    // After testing Norsk's real reading route and both remaining legacy maps,
    // launch an English map task through the child's actual navigation.
    await page.locator('.screen.active .locked-journey-back').click();
    await page.locator('#home-screen.active .bc14-subject[data-camp="subject-english"]').click();
    const activeEnglishMap=page.locator('#subject-screen.active .locked-journey-map[data-journey-subject="english"]');
    await activeEnglishMap.waitFor({timeout:15000});
    const current=activeEnglishMap.locator('.locked-journey-hotspot.state-current').first();
    await current.click();
    const mission=page.locator('.locked-journey-overlay:not([hidden]) button[data-locked-node]:not([disabled])').first();
    await mission.waitFor({timeout:10000});
    await mission.click();
    const task=page.locator('#session-screen.active .task-fox-companion');
    await task.waitFor({timeout:13000});
    await task.locator('svg.laria-fox-wardrobe-art .laria-fox-pose').waitFor({timeout:12000});
    assert.equal(await task.getAttribute('data-avatar'),avatar,name+' task changed fox identity');
    assert.equal(await task.locator('.laria-fox-wardrobe-art [data-gear]').count(),0,name+' task exposed deferred clothing');
    for(const mood of ['curious','support','celebrate']){
      assert.equal(await page.evaluate(m=>window.LARIA_FOX_PRESENCE.react(m),mood),true);
      assert.equal(await task.getAttribute('data-laria-fox-mood'),mood,name+' task mood '+mood+' missing');
    }
    // Original sample foxes remain near the bottom of the source
    // paintings. The *actual* background is rendered by ::after, not the
    // session element itself: its artwork must be top-framed on iPad.
    const backdropPosition=await page.locator('#session-screen.active .session')
      .evaluate(el=>getComputedStyle(el,'::after').backgroundPosition);
    assert(backdropPosition.split(',').every(layer=>layer.trim().endsWith('0%')),
      name+' task world exposes original sample fox below the card: '+backdropPosition);
    await page.screenshot({path:path.join(dir,name+'-task.png'),animations:'disabled'});
    assert.deepEqual(errors,[],name+' browser errors '+JSON.stringify(errors));
    await context.close();
    console.log('[live fox]',name,'troll-led Home + same fox identity in journeys/tasks, hidden equipment, movement, feedback, progress and tap safety OK');
  }finally{await browser.close()}
}
(async()=>{
 for(const [engine,name,viewport,avatar] of [
  [chromium,'chromium-girl-iphone',{width:390,height:844},'girl'],
  [webkit,'webkit-girl-iphone',{width:390,height:844},'girl'],
  [webkit,'webkit-boy-ipad',{width:820,height:1180},'boy']
 ])await run(engine,name,viewport,avatar);
})().catch(e=>{console.error(e);process.exitCode=1});
