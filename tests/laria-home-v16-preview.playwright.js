'use strict';
/* Home v16 is deliberately a navigation pilot only.
   This test MUST NOT certify removal of the four baked-in bottom cards. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {chromium,webkit}=require('playwright');

const out=process.env.LARIA_HOME_V16_SCREENSHOTS||'/tmp/laria-home-v16';
const cleanArt=path.join(__dirname,'..','laer-litt-mer','assets','home-v16','kjosnes-home-desktop-clean-DRAFT.webp');
const cleanArtCommitted=fs.existsSync(cleanArt);
const address=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const src=[
 ['kjosnes-home-tablet.webp',459450,'246edc1572d652af5c3ebf452be60db0b2f842b6afd9fd27529c04145bdf38e5'],
 ['kjosnes-home-phone.webp',52882,'0d804d147dc38d259c13757522907f953488f0b40dea298a8efc06055427c8f7']
];
for(const [name,bytes,hash] of src){
 const raw=fs.readFileSync(path.join(__dirname,'../laer-litt-mer/assets/home-v15',name));
 assert.equal(raw.length,bytes,name+' original byte count changed');
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),hash,name+' locked image SHA changed');
}
const seed={
 version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'Testbarn',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
 masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
 lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},
 answerLog:[],sessionLog:[],activeSession:null
};
const screens=[
 ['pc-1920x1080',{width:1920,height:1080},true],
 ['mac-1440x900',{width:1440,height:900},true],
 ['ipad-landscape-1366x1024',{width:1366,height:1024},true],
 ['ipad-portrait-1024x1366',{width:1024,height:1366},false],
 ['iphone-portrait-393x852',{width:393,height:852},false],
 ['iphone-landscape-852x393',{width:852,height:393},true]
];
const expects=[['norwegian','subject'],['math','subject'],['english','subject'],['geography','geography']];
fs.mkdirSync(out,{recursive:true});
async function run(engine,browserType,name,viewport,expectSigns){
 const browser=await browserType.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
 try{
  const ctx=await browser.newContext({viewport,hasTouch:true,isMobile:viewport.width<700,serviceWorkers:'block',reducedMotion:'reduce'});
  await ctx.addInitScript(v=>localStorage.setItem('laerlittmer-v2',JSON.stringify(v)),seed);
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  const url=new URL(address);url.searchParams.set('laria-home-v16-preview','1');
  await page.goto(url.toString(),{waitUntil:'domcontentloaded',timeout:75000});
  const home=page.locator('#home-screen.active .bc12.bc15-locked-home');
  await home.waitFor({state:'visible',timeout:22000});
  await page.waitForFunction(()=>Boolean(document.querySelector('#home-screen .bc12')?.dataset.bc16Stage) && document.querySelector('#home-screen .bc12')?.dataset.bc16Stage!=='not-ready',null,{timeout:18000});
  const portraitCase=viewport.height>viewport.width;
  if(expectSigns&&!portraitCase){
    await page.waitForFunction(()=>document.querySelector('#home-screen .bc12')?.dataset.bc16Stage==='navigation-pilot',null,{timeout:18000});
  }
  const actual=await home.getAttribute('data-bc16-stage');
  const signs=home.locator('.bc16-sign');
  if(portraitCase){
   assert.equal(actual,'portrait-navigation-pilot',engine+' '+name+' portrait v16 pilot did not mount: '+actual);
   assert.equal(await signs.count(),4,engine+' '+name+' portrait four subject signs missing');
   const audit=await home.evaluate(el=>{
    const rect=node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};
    const nav=rect(el.querySelector('.bc16-sign-nav-portrait'));
    const deck=rect(el.querySelector('.bc16-portrait-deck'));
    const buttons=[...el.querySelectorAll('.bc16-sign')].map(x=>({...rect(x),subject:x.dataset.bc16Subject,label:x.innerText.trim()}));
    const old=el.querySelector('.bc14-subjects'),oldStyle=getComputedStyle(old);
    const journey=rect(el.querySelector('.bc12-journey'));
    const bottomNav=rect(el.querySelector('.bc12-nav'));
    const bottomButtons=[...el.querySelectorAll('.bc12-nav button')].filter(x=>getComputedStyle(x).display!=='none').map(rect);
    return {
      art:getComputedStyle(el).getPropertyValue('--bc15-home-art'),
      nav,deck,buttons,journey,bottomNav,bottomButtons,
      stage:el.dataset.bc16Stage,cleanArt:el.dataset.bc16CleanArt,
      oldVisibility:oldStyle.visibility,oldPointerEvents:oldStyle.pointerEvents,
      screen:{w:innerWidth,h:innerHeight,scrollWidth:document.documentElement.scrollWidth},
      journeyText:el.querySelector('.bc12-journey')?.innerText||''
    };
   });
   assert.match(audit.art,/kjosnes-home-phone\.webp/,engine+' '+name+' portrait must preserve locked phone master');
   assert.equal(audit.cleanArt,'portrait-locked-master',engine+' '+name+' portrait art provenance is unclear');
   assert.equal(audit.oldVisibility,'hidden',engine+' '+name+' old baked-card hit areas remain visible');
   assert.equal(audit.oldPointerEvents,'none',engine+' '+name+' old baked-card hit areas intercept taps');
   assert.deepEqual(audit.buttons.map(b=>b.subject),expects.map(x=>x[0]),engine+' '+name+' portrait subject order changed');
   assert(audit.buttons.every(b=>b.w>=44&&b.h>=44),engine+' '+name+' portrait sign has inaccessible hit target');
   assert(audit.buttons.every(b=>b.x>=-2&&b.right<=viewport.width+2&&b.y>=-2&&b.bottom<=viewport.height+2),
     engine+' '+name+' portrait sign is outside viewport');
   assert(audit.deck.y<=audit.nav.y+2&&audit.deck.bottom>=viewport.height-2,
     engine+' '+name+' portrait deck does not cover the obsolete baked bottom chrome');
   assert.equal(audit.bottomButtons.length,5,engine+' '+name+' real five-item bottom navigation is not visible');
   assert(audit.bottomButtons.every(b=>b.w>=44&&b.h>=44),engine+' '+name+' bottom navigation has inaccessible targets');
   assert(audit.bottomNav.x>=-2&&audit.bottomNav.right<=viewport.width+2&&audit.bottomNav.y>=-2&&audit.bottomNav.bottom<=viewport.height+2,
     engine+' '+name+' bottom navigation is outside viewport');
   assert(audit.buttons[audit.buttons.length-1].bottom<=audit.bottomNav.y-4,
     engine+' '+name+' portrait subject signs overlap bottom navigation');
   assert(audit.journey.bottom<=audit.buttons[0].y-4,
     engine+' '+name+' portrait journey plank overlaps subject signs');
   assert(audit.journey.x>=-2&&audit.journey.right<=viewport.width+2&&audit.journey.y>=-2&&audit.journey.bottom<=viewport.height+2,
     engine+' '+name+' portrait journey plank is outside viewport');
   assert.match(audit.journeyText,/Fortsett reisen/,'Portrait live journey action disappeared');
   assert(audit.screen.scrollWidth<=audit.screen.w+2,engine+' '+name+' portrait has horizontal overflow');
   for(const [subject,screen] of expects){
    await home.locator('.bc16-sign[data-bc16-subject="'+subject+'"]').click();
    await page.locator('#'+screen+'-screen.active').waitFor({state:'visible',timeout:18000});
    await page.evaluate(()=>{showScreen('home');});
    await page.locator('#home-screen.active .bc16-sign-nav-portrait').waitFor({timeout:22000});
   }
  }else if(expectSigns){
   if(cleanArtCommitted){
    await page.waitForFunction(()=>{
      const status=window.LARIA_HOME_V16_PREVIEW?.cleanArtStatus;
      return status==='verified-preview-only'||status==='not-available'||status==='digest-unavailable';
    },null,{timeout:14000});
    const cleanStatus=await page.evaluate(()=>({
      state:window.LARIA_HOME_V16_PREVIEW?.cleanArtStatus,
      error:window.LARIA_HOME_V16_PREVIEW?.cleanArtError,
      stage:document.querySelector('#home-screen .bc12')?.dataset.bc16Stage,
      bg:document.querySelector('#home-screen .bc12')?.style.getPropertyValue('--bc15-home-art'),
      hasSubtle:typeof crypto!=='undefined'&&!!crypto.subtle
    }));
    assert.equal(cleanStatus.state,'verified-preview-only',
      engine+' '+name+' clean derivative rejected: '+JSON.stringify(cleanStatus));
    await page.waitForFunction(()=>document.querySelector('#home-screen .bc12')?.classList.contains('bc16-clean-art-ready'),null,{timeout:8000});
    const pixels=await page.evaluate(async()=>{
      const paths=['./assets/home-v15/kjosnes-home-tablet.webp','./assets/home-v16/kjosnes-home-desktop-clean-DRAFT.webp'];
      const decoded=await Promise.all(paths.map(async src=>{const img=new Image();img.src=src;await img.decode();const cn=document.createElement('canvas');cn.width=img.width;cn.height=img.height;const c=cn.getContext('2d',{willReadFrequently:true});c.drawImage(img,0,0);return{data:c.getImageData(0,0,cn.width,cn.height).data,width:cn.width,height:cn.height};}));
      const [original,clean]=decoded;
      let mountainDifferences=0,alteredBottomPixels=0;
      for(let y=0;y<original.height;y++){
       for(let x=0;x<original.width;x++){
        const offset=(y*original.width+x)*4;
        const different=original.data[offset]!==clean.data[offset]||original.data[offset+1]!==clean.data[offset+1]||original.data[offset+2]!==clean.data[offset+2];
        if(y<426&&different)mountainDifferences++;
        if(y>470&&x>401&&different)alteredBottomPixels++;
       }
      }
      return {size:[original.width,original.height],mountainDifferences,alteredBottomPixels};
    });
    assert.deepEqual(pixels.size,[1127,681],engine+' '+name+' preview dimensions changed');
    assert.equal(pixels.mountainDifferences,0,engine+' '+name+' mountain or child pixels changed');
    assert.ok(pixels.alteredBottomPixels>15000,engine+' '+name+' four baked-in bottom cards were not removed');
    const realText=await home.locator('.bc15-live-next').innerText();
    assert.match(realText,/· (Norsk|Matte|Engelsk|Geografi) · /,'Clean wooden plank does not show live subject information');
   }
   assert.equal(actual,'navigation-pilot',engine+' '+name+' new left sign navigation did not mount: '+actual);
   assert.equal(await signs.count(),4,engine+' '+name+' four wooden sign routes missing');
   const audit=await home.evaluate(el=>{
    const art=getComputedStyle(el).getPropertyValue('--bc15-home-art');
    const rect=node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};
    const buttons=[...el.querySelectorAll('.bc16-sign')].map(x=>({...rect(x),subject:x.dataset.bc16Subject,label:x.getAttribute('aria-label')}));
    const nav=rect(el.querySelector('.bc16-sign-nav'));
    const old=el.querySelector('.bc14-subjects');
    const ctl=getComputedStyle(old);
    const journey=el.querySelector('.bc12-journey'),live=el.querySelector('.bc15-live-next');
    const style=getComputedStyle(el);
    return {art,nav,buttons,oldVisibility:ctl.visibility,oldPointerEvents:ctl.pointerEvents,
      stage:el.dataset.bc16Stage,journeyDescription:journey.getAttribute('aria-describedby'),
      journeyRect:rect(journey),
      liveId:live.id,liveText:live.textContent,realNext:el.querySelector('[data-camp-next]').textContent,
      artLeft:parseFloat(style.getPropertyValue('--bc15-art-left'))||0,
      artWidth:parseFloat(style.getPropertyValue('--bc15-art-width'))||0,
      smallLandscape:el.classList.contains('bc16-small-landscape-ready'),
      smallScene:(()=>{const img=el.querySelector('.bc16-small-landscape-art');return img?{complete:img.complete,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,...rect(img)}:null})(),
      smallVisual:(()=>{const ui=el.querySelector('.bc16-small-landscape-ui');const copy=el.querySelector('.bc16-small-copy');const card=el.querySelector('.bc16-small-journey-visual');return ui&&copy&&card?{pointerEvents:getComputedStyle(ui).pointerEvents,copy:rect(copy),card:rect(card),greeting:el.querySelector('.bc16-small-greeting')?.textContent||'',meta:el.querySelector('.bc16-small-journey-meta')?.textContent||''}:null})(),
      screen:{w:innerWidth,h:innerHeight,scrollWidth:document.documentElement.scrollWidth}};
   });
   if(cleanArtCommitted){
     assert.match(audit.art,/assets\/home-v16\/kjosnes-home-desktop-clean-DRAFT\.webp/,engine+' '+name+' SHA-verified same-origin clean image is not active');
     assert.equal(await home.getAttribute('data-bc16-clean-art'),'verified-preview-only',engine+' '+name+' clean candidate not verified');
     assert.equal(await home.locator('.bc15-live-next').evaluate(el=>getComputedStyle(el).backgroundImage),'none',
       engine+' '+name+' a painted-on progress text must never have a fake opaque strip');
   }else{
     assert.match(audit.art,/kjosnes-home-tablet\.webp/,engine+' '+name+' must retain unchanged original until the candidate exists');
     assert.notEqual(await home.getAttribute('data-bc16-clean-art'),'verified-preview-only',
       engine+' '+name+' must not mislabel the old master as clean artwork');
   }
   assert.deepEqual(audit.buttons.map(b=>b.subject),expects.map(x=>x[0]),'incorrect subject order');
   assert.equal(audit.oldVisibility,'hidden',engine+' '+name+' old bottom hit areas still active');
   assert.equal(audit.oldPointerEvents,'none',engine+' '+name+' old bottom hit areas intercept taps');
   assert.equal(audit.journeyDescription,audit.liveId,'dynamic progress is disconnected');
   assert(audit.liveText.includes(audit.realNext),'dynamic next title not bound to real state');
   assert(audit.buttons.every(b=>b.w>=44&&b.h>=44),'a wooden sign has an inaccessible hit target');
   assert(audit.buttons.every(b=>b.right<=viewport.width+2&&b.x>=-2&&b.y>=-2&&b.bottom<=viewport.height+2),'sign hit outside viewport');
   assert(audit.nav.x<viewport.width*.28,'wooden signs are not on the left');
   assert(audit.buttons.every(b=>b.x>=audit.nav.x-2&&b.right<=audit.nav.right+2),'sign outside its artwork map');
   assert(audit.buttons.every((b,i)=>i===0||b.y>=audit.buttons[i-1].bottom-1),'wooden signs overlap');
   if(viewport.height<=580&&viewport.width>viewport.height){
     assert.equal(audit.smallLandscape,true,engine+' '+name+' did not mount the short-landscape v16 scene');
     assert.ok(Math.abs(audit.artLeft)<=1,engine+' '+name+' short-landscape art is not left-aligned');
     assert.ok(audit.artWidth>=viewport.width-1,engine+' '+name+' short-landscape art does not fill viewport width');
     assert.ok(audit.smallScene&&audit.smallScene.complete&&audit.smallScene.naturalWidth===1127&&audit.smallScene.naturalHeight===681,
       engine+' '+name+' verified landscape image element did not decode');
     assert.ok(audit.smallScene.w>=viewport.width-1&&audit.smallScene.x<=1,
       engine+' '+name+' landscape image element does not cover the full viewport width');
     assert.ok(audit.smallVisual&&audit.smallVisual.pointerEvents==='none',
       engine+' '+name+' deterministic landscape visual layer is missing or captures input');
     assert.match(audit.smallVisual.greeting,/Hei,/,
       engine+' '+name+' landscape greeting is missing');
     assert.ok(audit.smallVisual.meta.includes(audit.realNext),
       engine+' '+name+' journey visual is not bound to real next state');
     assert.ok(audit.smallVisual.card.x>=-2&&audit.smallVisual.card.right<=viewport.width+2&&audit.smallVisual.card.bottom<=viewport.height+2,
       engine+' '+name+' journey visual is outside short-landscape viewport');
     assert.ok(audit.journeyRect.x>=-2&&audit.journeyRect.right<=viewport.width+2&&audit.journeyRect.bottom<=viewport.height+2,
       engine+' '+name+' journey control is outside short-landscape viewport');
   }
   assert(audit.screen.scrollWidth<=audit.screen.w+2,'horizontal overflow');
   fs.writeFileSync(path.join(out,engine+'-'+name+'.json'),JSON.stringify({automatedNavigationPassed:true,artworkApproved:false,...audit},null,2));
   // Verify actual existing navigation, not a prototype function or a mock.
   for(const [subject,screen] of expects){
    await home.locator('.bc16-sign[data-bc16-subject="'+subject+'"]').click();
    await page.locator('#'+screen+'-screen.active').waitFor({state:'visible',timeout:18000});
    await page.evaluate(()=>{showScreen('home');});
    await page.locator('#home-screen.active .bc16-sign-nav').waitFor({timeout:22000});
   }
   if(viewport.height<=580&&viewport.width>viewport.height){
     await page.waitForFunction(()=>document.querySelector('#home-screen.active .bc12')?.dataset.bc16Stage==='navigation-pilot',null,{timeout:18000});
     const afterReturn=await home.evaluate(el=>{
       const ui=el.querySelector('.bc16-small-landscape-ui');
       const scene=el.querySelector('.bc16-small-landscape-art');
       const card=el.querySelector('.bc16-small-journey-visual');
       return {
         ui:!!ui,
         scene:!!scene&&scene.complete&&scene.naturalWidth===1127,
         card:!!card&&getComputedStyle(card).display!=='none',
         meta:el.querySelector('.bc16-small-journey-meta')?.textContent||'',
         stage:el.dataset.bc16Stage
       };
     });
     assert.equal(afterReturn.stage,'navigation-pilot',engine+' '+name+' lost v16 stage after returning Home');
     assert.equal(afterReturn.ui,true,engine+' '+name+' lost short-landscape UI after returning Home');
     assert.equal(afterReturn.scene,true,engine+' '+name+' lost verified scene after returning Home');
     assert.equal(afterReturn.card,true,engine+' '+name+' lost journey visual after returning Home');
     assert(afterReturn.meta.length>0,engine+' '+name+' lost live journey copy after returning Home');
   }
  }else{
   assert.notEqual(actual,'navigation-pilot',engine+' '+name+' should not fake signs in an unapproved portrait/short-landscape painting');
   assert.equal(await signs.count(),0,engine+' '+name+' drew fake signposts over the original children');
   assert.equal(await home.locator('.bc14-subject:visible').count(),4,'fallback must preserve the original four subject gateways');
   if(viewport.height<=580&&viewport.width>viewport.height){
    const rect=await home.boundingBox();
    assert.ok(rect&&rect.height<=viewport.height+2,
      engine+' '+name+' short landscape Home exceeds visible viewport: '+JSON.stringify(rect));
   }
  }
  await page.screenshot({path:path.join(out,engine+'-'+name+'.png'),fullPage:false,animations:'disabled'});
  assert.deepEqual(errors,[],engine+' '+name+' page errors');
  await ctx.close();
 }finally{await browser.close();}
}
(async()=>{
 fs.writeFileSync(path.join(out,'README.json'),JSON.stringify({
  description:'Home v16 draft navigation pilot, not an approved clean illustration',
  head:process.env.LARIA_GIT_SHA||'unrecorded',originalArtworkUnchanged:true,
  bottomPaintedCardsStillPresent:!cleanArtCommitted,awaitingApprovedCleanDerivative:!cleanArtCommitted,
  cleanArtCommitted,artworkApproved:false,
  allScreensAreRealBrowserRenders:true,
 },null,2));
 let failed=0;
 for(const [engine,browserType] of [['chromium',chromium],['webkit',webkit]]){
  for(const [name,viewport,supported] of screens){
   try{await run(engine,browserType,name,viewport,supported);console.log('PASS',engine,name);}
   catch(e){failed++;console.error('FAIL',engine,name,e.stack||e.message);}
  }
 }
 assert.equal(failed,0,failed+' Home v16 preview cases failed');
})().catch(e=>{console.error(e);process.exitCode=1;});
