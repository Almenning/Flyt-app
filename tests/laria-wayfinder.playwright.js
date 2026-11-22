'use strict';
const openHomeSubject=require('./helpers/laria-home-open-subject.cjs');
/* Real painted Grovanova arrow hotspots + ONE shared light-wood sign across
   all four subjects. Browser and screen renders are from the exact PR SHA. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const url=(process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria')+'&lariaV16=0'; // test the historical v15 subjects separately from the approved v16 Home
const out=process.env.LARIA_WAYFINDER_SHOTS||'/tmp/laria-wayfinder';
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Treskilt QA',avatar:'girl',setupVersion:2,tallvikaTroll:'lillesoster'},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},preferences:{sound:false,autoRead:false},journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
const worlds=[
 {id:'norwegian',root:'#eggenipa-world',sign:'.eg-scene-reading',paint:'.eg-scene-reading > span',target:'#session-screen.active'},
 {id:'math',root:'#tallvika-world',sign:'.tv-sign[data-tv="multiply"]',paint:'.tv-sign[data-tv="multiply"]',target:'#multiplication-lab-screen.active'},
 {id:'english',root:'#kinnaklova-world',sign:'.ki-painted-words',paint:'.ki-painted-words',target:'#session-screen.active'},
 {id:'geography',root:'#laria-geography-world',sign:'.gv-sign[data-gv="globe"]',paint:'.gv-sign[data-gv="globe"]',target:'#world-screen.active'}
];
function sameLearning(a,b){
 const j=v=>v.journey||{},as=x=>JSON.stringify(x||{});
 assert.equal(as(j(a).nodes),as(j(b).nodes),'past journey nodes changed');
 assert.equal(as(a.mastery),as(b.mastery),'mastery was rewritten');
 assert.equal(as(a.sessionLog),as(b.sessionLog),'unfinished navigation must not add completed sessions');
}
async function run(browserType,engine,name,viewport){
 const browser=await browserType.launch({headless:true,args:browserType===chromium?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport,hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce',deviceScaleFactor:1});
  await context.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
  const home=page.locator('#home-screen.active .bc12.bc15-locked-home');
  await home.waitFor({state:'visible',timeout:20000});
  await fs.promises.mkdir(out,{recursive:true});
  const portrait=viewport.height>viewport.width;
  if(!portrait&&viewport.height<=580){
   // Same approved, card-free Grovanova landscape art and painted LEFT oak
   // signs as iPad. No second row of photo cards may remain at the bottom.
   await page.waitForFunction(()=>{
    const h=document.querySelector('#home-screen.active .bc12.bc15-locked-home');
    return h?.dataset.bc15CardArt==='clean-candidate'&&
      h.classList.contains('bc15-phone-fagmenu')&&
      !!h.querySelector('.bc15-subject-signs[data-bc15-presentation="painted"]');
   },null,{timeout:20000});
   const frame=await home.evaluate(el=>{
    const rect=node=>{const b=node.getBoundingClientRect();
     return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,
       width:b.width,height:b.height};
    };
    const row=el.querySelector('.bc14-subjects');
    const rail=el.querySelector('.bc15-subject-signs[data-bc15-presentation="painted"]');
    const signs=[...rail.querySelectorAll('.bc15-painted-subject')].map(node=>{
     const style=getComputedStyle(node);
     return {subject:node.dataset.bc15Subject,...rect(node),
       pointerEvents:style.pointerEvents,visibility:style.visibility};
    });
    return {scene:rect(el),art:el.style.getPropertyValue('--bc15-home-art'),
      oldRowInert:row.inert,oldRowDisplay:getComputedStyle(row).display,
      greeting:rect(el.querySelector('.bc15-live-copy')),signs};
   });
   assert.ok(frame.scene.top>=-2&&frame.scene.bottom<=viewport.height+2&&
     frame.scene.height>=viewport.height-2,
     engine+' short landscape Home must fill its screen: '+JSON.stringify(frame.scene));
   assert.match(frame.art,/kjosnes-home-tablet-no-bottom-cards-no-next-stop/,
     engine+' landscape iPhone must use the clean iPad Home master');
   assert.equal(frame.oldRowInert,true,engine+' retired photo buttons remained interactive');
   assert.equal(frame.oldRowDisplay,'none',engine+' lower photo cards must not appear');
   assert.deepEqual(frame.signs.map(s=>s.subject),
     ['norwegian','math','english','geography'],
     engine+' must provide exactly the four left painted oak signs');
   assert.ok(frame.signs.every(s=>s.width>=70&&s.height>=26&&
     s.left>=0&&s.right<=viewport.width+2&&s.top>=0&&s.bottom<=viewport.height+2&&
     s.pointerEvents==='auto'&&s.visibility==='visible'),
     engine+' painted left-hand sign hotspots must stay tappable: '+JSON.stringify(frame.signs));
   for(let i=1;i<frame.signs.length;i++)
    assert.ok(frame.signs[i].top>=frame.signs[i-1].bottom-2,
      engine+' sign hotspots overlap: '+JSON.stringify(frame.signs));
   assert.ok(frame.greeting.bottom<=frame.signs[0].top-2,
     engine+' single live greeting must clear the first left oak sign: '+
     JSON.stringify({greeting:frame.greeting,sign:frame.signs[0]}));
  }
  if(!portrait&&viewport.height>500){
   const nav=home.locator('.bc15-subject-signs');
   await nav.waitFor({state:'visible',timeout:15000});
   const signs=await nav.locator('button').evaluateAll(buttons=>buttons.map(button=>{
    const r=button.getBoundingClientRect();return {id:button.dataset.bc15Subject,x:r.x,y:r.y,w:r.width,h:r.height};
   }));
   assert.deepEqual(signs.map(x=>x.id),['norwegian','math','english','geography'],'wrong painted arrows order');
   assert.ok(signs.every(s=>s.w>=44&&s.h>=44&&s.x>=0&&s.y>=0&&s.x+s.w<=viewport.width+2&&s.y+s.h<=viewport.height+2),
      'painted arrow touch rectangles are invalid '+JSON.stringify(signs));
   for(const spec of worlds){
    await home.locator('[data-bc15-subject="'+spec.id+'"]').click();
    await page.locator(spec.root+':visible').waitFor({timeout:18000});
    await page.evaluate(()=>showScreen('home'));
    await home.waitFor({state:'visible',timeout:15000});
   }
  }else if(portrait&&viewport.width>=768&&viewport.height>=650){
    // The LOCKED portrait master has no painted left-hand signs. Its four
    // fully live oak signs are the primary route and must be tested as such.
    const rail=home.locator('.bc15-subject-signs[data-bc15-presentation="live"]');
    await rail.waitFor({state:'visible',timeout:15000});
    const entries=rail.locator('button.bc15-painted-subject:visible');
    assert.equal(await entries.count(),4,'portrait iPad must provide four live subject signs');
    const style=await entries.first().evaluate(el=>{
      const s=getComputedStyle(el),p=getComputedStyle(el.parentElement,'::before');
      return {art:s.backgroundImage,alpha:s.opacity,posts:p.backgroundImage};
    });
    assert.match(style.art,/laria-light-arrow-sign\\?\.svg/,
      'portrait iPad must use the shared light oak arrow boards');
    assert.match(style.posts,/laria-grovanova-signposts\\?\.svg/,
      'portrait iPad must show the shared pair of posts');
    assert.notEqual(style.alpha,'0.001','portrait signs may not be invisible');
    const geom=await entries.evaluateAll(nodes=>nodes.map(node=>{
      const b=node.getBoundingClientRect();
      return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,height:b.height};
    }));
    assert.ok(geom.every(g=>g.left>=0&&g.right<=viewport.width*.33&&g.width>=130&&g.height>=48),
      'portrait signs must be legible and stay left of the painted troll trio: '+JSON.stringify(geom));
    for(let i=1;i<geom.length;i++)assert.ok(geom[i].top>=geom[i-1].bottom,
      'portrait Home sign boards overlap each other: '+JSON.stringify(geom));
    const greeting=await home.locator('.bc15-live-copy').boundingBox();
    assert.ok(greeting&&geom[0].top>greeting.y+greeting.height+8,
      "portrait Home rail overlaps the child greeting bubble: "+JSON.stringify({greeting,geom}));

    for(const spec of worlds){
      await home.locator('.bc15-subject-signs [data-bc15-subject="'+spec.id+'"]').click();
      await page.locator(spec.root+':visible').waitFor({timeout:18000});
      await page.evaluate(()=>showScreen('home'));
      await home.waitFor({state:'visible',timeout:15000});
    }
  }else if(portrait&&viewport.width<=700){
    // A separate clean phone derivative has the same real oak navigation as
    // iPad, compacted into two rows on the meadow, not hidden old photo cards.
    const rail=home.locator('.bc15-subject-signs[data-bc15-presentation="live"]');
    await rail.waitFor({state:'visible',timeout:15000});
    const buttons=rail.locator('button.bc15-painted-subject:visible');
    assert.equal(await buttons.count(),4,'iPhone must expose four living oak subject signs');
    const geo=await buttons.evaluateAll(xs=>xs.map(el=>{
      const r=el.getBoundingClientRect(),s=getComputedStyle(el);
      return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,
        width:r.width,height:r.height,background:s.backgroundImage};
    }));
    assert.ok(geo.every(x=>x.width>=118&&x.height>=44&&x.left>=0&&x.right<=viewport.width+1),
      'iPhone oak hit areas must be in bounds: '+JSON.stringify(geo));
    assert.ok(geo.every(x=>/laria-light-arrow-sign/.test(x.background)),
      'iPhone must reuse the same oak component as iPad');
    for(const spec of worlds){
      await rail.locator('[data-bc15-subject="'+spec.id+'"]').click();
      await page.locator(spec.root+':visible').waitFor({timeout:18000});
      await page.evaluate(()=>showScreen('home'));
      await home.waitFor({state:'visible',timeout:15000});
    }
  }
  await page.screenshot({path:path.join(out,engine+'-'+name+'-home.png'),animations:'disabled',fullPage:false});
  for(const spec of worlds){
   const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2')));
   // All devices use the actual currently child-visible subject entry.
   // On short landscape phones this is the painted LEFT oak rail, never cards.
   await openHomeSubject(page,spec.id);
   const root=page.locator(spec.root+':visible');
   await root.waitFor({timeout:20000});
   if(spec.id==='english')await page.locator('#kinnaklova-world[data-ki-art="ready"]').waitFor({timeout:20000});
   if(spec.id==='english'&&portrait&&viewport.width<=767&&viewport.height>=600){
     // Regression: the old phone variant only painted a 219px panorama,
     // stranding the entire rest of the iPhone on an empty beige field.
     const stage=root.locator('.ki-stage.laria-reference-layout-v1');
     await stage.waitFor({state:'visible',timeout:16000});
     const frame=await stage.evaluate(el=>{
       const r=el.getBoundingClientRect(),img=el.querySelector('.ki-master');
       const rs=getComputedStyle(img);
       return {top:r.top,bottom:r.bottom,width:r.width,height:r.height,
         artFit:rs.objectFit,paintedArtReady:el.closest('#kinnaklova-world')?.dataset.kiArt};
     });
     assert.ok(frame.top>=-2&&frame.bottom>=viewport.height-2&&
       frame.height>=viewport.height-2&&frame.width>=viewport.width-2,
       engine+' '+name+' English must fill the iPhone screen, not a thin banner: '+JSON.stringify(frame));
     assert.equal(frame.artFit,'cover',engine+' '+name+' English art must fill its approved scene');
     assert.equal(frame.paintedArtReady,'ready',engine+' '+name+' English art integrity must remain ready');
     assert.equal(await stage.locator('.laria-reference-heading:visible').count(),1,
       engine+' '+name+' English needs the shared live heading');
     assert.equal(await stage.locator('nav.laria-scene-navigation .ki-painted-hit:visible').count(),3,
       engine+' '+name+' all English wooden activities must remain available');
     // A phone can rotate mid-journey: clear the portrait-only menu in
     // landscape, then restore the one live left rail on returning.
     const learningBefore=await page.evaluate(()=>localStorage.getItem('laerlittmer-v2'));
     await page.setViewportSize({width:844,height:390});
     await page.waitForFunction(()=>{
       const scene=document.querySelector('#subject-screen.active #kinnaklova-world .ki-stage');
       return scene&&!scene.classList.contains('laria-reference-layout-v1')&&
         !scene.querySelector(':scope > nav.laria-reference-subject-nav');
     },null,{timeout:16000});
     assert.equal(await root.locator('button.laria-reference-heading').count(),0,
       engine+' English left its portrait controls mounted in landscape');
     await page.setViewportSize(viewport);
     await stage.waitFor({state:'visible',timeout:16000});
     assert.equal(await stage.locator('nav.laria-scene-navigation .ki-painted-hit:visible').count(),3,
       engine+' English failed to restore all three activities');
     assert.equal(await stage.locator('nav.laria-reference-subject-nav').count(),1,
       engine+' English duplicated or lost its subject rail on rotate-back');
     assert.equal(await page.evaluate(()=>localStorage.getItem('laerlittmer-v2')),learningBefore,
       engine+' rotating Kinnaklova rewrote saved progress');
   }
   if(spec.id==='english'&&!portrait&&viewport.width>=740&&viewport.height<=600){
     // Starting directly in landscape must also mount portrait English after
     // rotation without leaving two menus or modifying learning progress.
     const scene=root.locator('.ki-stage');
     const learningBefore=await page.evaluate(()=>localStorage.getItem('laerlittmer-v2'));
     await page.setViewportSize({width:390,height:844});
     await scene.locator('nav.laria-reference-subject-nav').waitFor({state:'attached',timeout:16000});
     assert.equal(await scene.locator('nav.laria-scene-navigation .ki-painted-hit:visible').count(),3,
       engine+' landscape-first English failed to mount portrait navigation');
     await page.setViewportSize(viewport);
     await page.waitForFunction(()=>{
       const stage=document.querySelector('#subject-screen.active #kinnaklova-world .ki-stage');
       return stage&&!stage.classList.contains('laria-reference-layout-v1')&&
         !stage.querySelector(':scope > nav.laria-reference-subject-nav');
     },null,{timeout:16000});
     assert.equal(await page.evaluate(()=>localStorage.getItem('laerlittmer-v2')),learningBefore,
       engine+' landscape-first English rotation rewrote saved progress');
   }
   const sign=root.locator(spec.sign);
   const board=root.locator(spec.paint);
   if(spec.id==='english')
     assert.equal(await root.locator('.ki-actions:visible').count(),0,
       engine+' '+name+' English must not duplicate its three painted signs');
   await sign.waitFor({state:'visible',timeout:13000});
   const b=await board.evaluate(el=>{
    const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
    return {x:r.x,y:r.y,w:r.width,h:r.height,background:cs.backgroundImage,color:cs.color,visibility:cs.visibility};
   });
   assert.ok(b.w>=44&&b.h>=44&&b.x>=-2&&b.x+b.w<=viewport.width+2&&b.y>=-2&&b.y+b.h<=viewport.height+2,
     engine+' '+name+' '+spec.id+' sign outside device: '+JSON.stringify(b));
   // The user-locked carved board replaces the retired light arrow on iPad.
   // Keep the old image only as a deliberate small-screen fallback.
   const wooden=await board.evaluate(el=>
     el.classList.contains('laria-wooden-sign')||!!el.closest('.laria-wooden-sign'));
   if(viewport.width>=768&&viewport.height>=650)
     assert.equal(wooden,true,engine+' '+name+' '+spec.id+' missing the approved wooden sign');
   if(wooden){
     assert.match(b.background,/gradient/,spec.id+' retained the old arrow artwork');
     assert.equal(await board.locator('.laria-wooden-sign-medallion svg').count(),1,
       spec.id+' lost the real carved-sign medallion');
     assert.equal(b.color,'rgb(46, 26, 12)',spec.id+' uses wrong carved-sign ink');
   } else {
     assert.match(b.background,/laria-light-arrow-sign\\.svg/,
       spec.id+' fallback arrow artwork unexpectedly changed');
   }
   // Kinn now uses the certified UI-free image and the SAME left-hand
   // live sign family as the other subjects. Do not regress to invisible
   // hotspots over the original painted Words/Sentences/Reading labels.
   if(spec.id==='english'&&viewport.width>=701&&viewport.height>=600){
     assert.equal(await root.getAttribute('data-ki-premium-art'),'approved',
       engine+' '+name+' English clean art adapter not enabled');
     assert.equal(await root.locator('.ki-world-brand:visible').count(),1,
       engine+' '+name+' English must show one live brand on clean art');
     const leftRail=root.locator('.ki-stage > nav.laria-scene-navigation');
     const boxes=await leftRail.locator('.ki-painted-hit:visible').evaluateAll(nodes=>
       nodes.map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}}));
     assert.equal(boxes.length,3,engine+' '+name+' requires three English activities');
     assert.ok(boxes.every(x=>x.left>=0&&x.right<viewport.width*.40),
       engine+' '+name+' English activity signs escaped left rail: '+JSON.stringify(boxes));
   }
   await page.screenshot({path:path.join(out,engine+'-'+name+'-'+spec.id+'.png'),animations:'disabled',fullPage:false});
   await sign.click();
   await page.locator(spec.target).waitFor({state:'visible',timeout:18000});
   await page.evaluate(()=>showScreen('home'));
   await home.waitFor({state:'visible',timeout:15000});
   const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2')));
   sameLearning(before,after);
  }
  assert.deepEqual(errors,[],engine+' '+name+' JavaScript exceptions');
  await context.close();
 }finally{await browser.close();}
}
(async()=>{
 for(const [name,view] of [
   ['ipad-landscape',{width:1180,height:820}],
   ['ipad-portrait',{width:820,height:1180}],
   ['iphone-portrait',{width:390,height:844}],
   ['iphone-landscape',{width:852,height:393}]
 ].filter(([device])=>process.env.LARIA_IPAD_ONLY!=='1'||device.startsWith('ipad')))
 for(const [engine,browser] of [['chromium',chromium],['webkit',webkit]]){
  await run(browser,engine,name,view);
  console.log('PASS wooden arrow '+engine+' '+name);
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
