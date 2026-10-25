'use strict';
/* UX sprint #102, phase 1: buttons and edge-swipes must return to the SAME place.
   Real browser interactions, using the checked-out PR instead of Pages. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.LARIA_UX_NAV_SHOTS||'/tmp/laria-ux-phase1';
fs.mkdirSync(out,{recursive:true});
const seed={
  version:7,progressSchemaVersion:3,
  profile:{grade:2,onboarded:true,name:'Eventyrbarn',avatar:'girl',setupVersion:2},
  mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
  masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
  lastMilestone:null,recentCountryWin:null,lastActivity:null,
  journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null
};
async function edgeBack(page,label){
  const edge=page.locator('#swipe-back-edge');
  assert.equal(await edge.isVisible(),true,label+' has no available iOS edge gesture');
  const box=await edge.boundingBox();
  assert.ok(box&&box.width>0,label+' edge region is missing');
  await page.evaluate(()=>{
    window.__lariaGestureLog=[];
    const target=document.getElementById('swipe-back-edge');
    if(!target.dataset.uxGestureProbe){
      target.dataset.uxGestureProbe='1';
      ['pointerdown','pointermove','pointerup','pointercancel','mousedown','mousemove','mouseup'].forEach(type=>
        document.addEventListener(type,event=>{
          window.__lariaGestureLog?.push({type,x:Math.round(event.clientX),
            y:Math.round(event.clientY),id:event.pointerId||0,
            target:event.target?.id||event.target?.tagName||'unknown'});
        },true));
    }
  });
  const y=Math.max(125,Math.min(box.height-85,box.height*.42));
  await page.mouse.move(Math.max(2,box.x+5),box.y+y);
  await page.mouse.down();
  await page.mouse.move(box.x+105,box.y+y,{steps:8});
  await page.mouse.up();
  const result=await page.evaluate(()=>({
    events:window.__lariaGestureLog||[],
    active:document.querySelector('.screen.active')?.id,
    panel:document.querySelector('.bc12')?.dataset.bc13View,
    returnView:window.LARIA_BASECAMP_RETURN_VIEW?.()
  }));
  console.log('[edge UX]',label,JSON.stringify(result));
}
async function screen(page,id){
  await page.locator('#'+id+'-screen.active').waitFor({timeout:18000});
}
async function panel(page,id){
  try{
    await screen(page,'home');
    await page.locator('.bc13-panel:not([hidden]) [data-bc13-action="'+id+'"]').waitFor({timeout:16000});
  }catch(error){
    const snapshot=await page.evaluate(()=>({
      active:document.querySelector('.screen.active')?.id,
      chooser:document.querySelector('.bc12')?.dataset.bc13View,
      from:window.LARIA_BASECAMP_RETURN_VIEW?.(),
      panel:window.LARIA_ACTIVE_BASECAMP_PANEL?.(),
      back:document.getElementById('world-back')?.getAttribute('aria-label'),
      edgeVisible:!!document.getElementById('swipe-back-edge')?.getClientRects().length,
      url:location.href
    }));
    throw new Error('Expected Basecamp '+id+' after back; actual '+JSON.stringify(snapshot)+'; '+error.message);
  }
}
async function screenshot(page,label){
  await page.screenshot({path:out+'/'+label+'.png',animations:'disabled'});
}
async function run(engine,label,width,height){
  const browser=await engine.launch({headless:true,args:label.startsWith('chromium')?['--no-sandbox']:[]});
  const context=await browser.newContext({
    viewport:{width,height},hasTouch:true,isMobile:width<600,
    reducedMotion:'reduce',serviceWorkers:'block'
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed);
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  try{
    const root=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
    await page.goto(root+(root.includes('?')?'&':'?')+'uxphase1='+label,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelector('.bc12[data-bc13-bound="true"]')&&typeof window.LARIA_RETURN_TO_BASECAMP==='function',null,{timeout:20000});

    // Legacy Home-to-globe must also return Home even without a chooser origin.
    await page.evaluate(()=>openGlobe('classic'));
    await screen(page,'world');
    assert.equal(await page.locator('#world-back').getAttribute('aria-label'),'Tilbake til Hjem',label+' direct globe back label');
    await edgeBack(page,label+' direct Home globe');
    await screen(page,'home');

    // From Utforsk: the physical globe Back button and edge gesture agree.
    await page.locator('.bc12-nav [data-camp="explore"]').click();
    await page.locator('.bc13-card[data-bc13-action="globe"]').click();
    await screen(page,'world');
    assert.equal(await page.locator('#world-back').getAttribute('aria-label'),'Tilbake til Utforsk',label+' wrong globe return label');
    await screenshot(page,label+'-globe-from-explore');
    await edgeBack(page,label+' globe');
    await panel(page,'globe');
    assert.equal(await page.locator('.bc12').getAttribute('data-bc13-view'),'explore',label+' globe swipe lost Explore');

    // Brøklab: the same gesture as tapping its visible back arrow.
    await page.locator('.bc13-card[data-bc13-action="fraction"]').click();
    await screen(page,'fraction-lab');
    await page.locator('#fraction-lab-back').waitFor({state:'visible'});
    await edgeBack(page,label+' fraction');
    await panel(page,'fraction');
    await screenshot(page,label+'-returned-explore');

    // Gangemagi is now the first child screen. Its swipe goes straight
    // back to the same Explore panel, not to an unrelated subject.
    await page.locator('.bc13-card[data-bc13-action="multiply"]').click();
    await screen(page,'multiplication-lab');
    await page.locator('#multiplication-lab-screen.active .gm-shell').waitFor();
    await edgeBack(page,label+' gangemagi exit');
    await panel(page,'multiply');

    // The old 10x10 suite keeps its own internal Back semantics.
    await page.locator('.bc13-card[data-bc13-action="multiply"]').click();
    await screen(page,'multiplication-lab');
    await page.locator('[data-gm-action="classic"]').click();
    await page.locator('.mp-home-screen').waitFor();
    await page.locator('[data-mp-action="go"][data-page="choose"]').first().click();
    await edgeBack(page,label+' multiplication internal');
    await screen(page,'multiplication-lab');
    assert.equal(await page.evaluate(()=>window.LARIA_MULT_PREMIUM.snapshot().page),'home',
      label+' multiplication swipe skipped the internal home');
    await edgeBack(page,label+' multiplication exit');
    await panel(page,'multiply');

    // Visible Math navigation uses Tallvika, not the retired Tallenga map.
    await page.locator('.bc12-nav [data-camp="travel"]').click();
    await page.locator('.bc13-card[data-bc13-action="math"]').click();
    await screen(page,'subject');
    const tv=page.locator('#subject-screen.active #tallvika-world');
    await tv.waitFor({state:'visible',timeout:16000});
    assert.equal(await tv.locator('[data-tv="back"]').isVisible(),true,label+' no Math return');
    await screenshot(page,label+'-math-tallvika');
    await edgeBack(page,label+' Tallvika');
    await panel(page,'math');
    assert.equal(await page.locator('.bc12').getAttribute('data-bc13-view'),'travel',label+' swipe lost Reisen');

    // Geografi -> Kloden -> Geografi -> Reisen: no skipped parent.
    await page.locator('.bc13-card[data-bc13-action="geography"]').click();
    await screen(page,'geography');
    await page.evaluate(()=>openGlobe('classic'));
    await screen(page,'world');
    assert.equal(await page.locator('#world-back').getAttribute('aria-label'),'Tilbake til Geografi',
      label+' nested globe incorrectly advertises Home/Utforsk');
    await edgeBack(page,label+' nested globe');
    await screen(page,'geography');
    await edgeBack(page,label+' geography');
    await panel(page,'geography');

    // A mission must return to its world, not jump to the wrong app section.
    await page.locator('.bc13-card[data-bc13-action="norwegian"]').click();
    await screen(page,'subject');
    await page.locator('#eggenipa-world:visible').waitFor({timeout:16000});
    await page.locator('#eggenipa-world .eg-portal[data-eg="map"]').click();
    const norwegianStop=page.locator('#subject-screen.active .locked-journey-hotspot.state-current').first();
    await norwegianStop.waitFor({state:'visible',timeout:16000});
    await norwegianStop.click();
    const firstTask=page.locator('#subject-screen.active .locked-journey-overlay:not([hidden]) [data-locked-node]:not([disabled])').first();
    await firstTask.waitFor({state:'visible',timeout:12000});
    await firstTask.click();
    await screen(page,'session');
    assert.match(await page.locator('#close-session').innerText(),/Tilbake/,
      label+' task back label does not describe its action');
    assert.equal(await page.locator('#close-session').getAttribute('aria-label'),'Tilbake til Norsk');
    await edgeBack(page,label+' task');
    await screen(page,'subject');
    await page.locator('#subject-screen.active .locked-journey-back').waitFor({state:'visible',timeout:16000});
    await screenshot(page,label+'-returned-journey');
    assert.deepEqual(errors,[],label+' unhandled script errors');
    console.log('[Læria UX phase 1]',label,'origin panels, nested globe, lab subpages, mission and edge-swipe PASS');
  }finally{await context.close();await browser.close();}
}
(async()=>{
  for(const [label,engine,width,height] of [
    ['chromium-iphone',chromium,390,844],
    ['webkit-iphone',webkit,390,844],
    ['webkit-ipad-landscape',webkit,1180,820]
  ])await run(engine,label,width,height);
})().catch(error=>{console.error(error);process.exitCode=1});
