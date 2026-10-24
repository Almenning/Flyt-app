'use strict';
/* Browser contract: real wardrobe artwork, permissions and saved gear. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const seed={
  version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Eventyrbarn',avatar:'boy',setupVersion:2},
  mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},
  preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,
  journey:{nodes:{'math:2:talldalen':{attempts:1}},gradeWins:{},viewGrades:{}},
  answerLog:Array.from({length:13},(_,i)=>({at:i+1,subject:'math',correct:true,countsForLearning:true,questionKey:'test-'+i})),
  sessionLog:[],activeSession:null
};
const url=(process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria');
const evidence=process.env.LARIA_COLLECTION_QA||'/tmp/laria-collection-review';
fs.mkdirSync(evidence,{recursive:true});
async function verify(browserType,label,viewport){
  const browser=await browserType.launch({headless:true,args:browserType===chromium?['--no-sandbox']:[]});
  try{
    const context=await browser.newContext({viewport,isMobile:viewport.width<600,hasTouch:true,serviceWorkers:'block'});
    await context.addInitScript(s=>{
      if(!localStorage.getItem('laerlittmer-v2'))
        localStorage.setItem('laerlittmer-v2',JSON.stringify(s));
    },seed);
    const page=await context.newPage();
    await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
    await page.route('https://api.worldbank.org/**',r=>r.abort());
    await page.goto(url+'&collection-qa='+label,{waitUntil:'domcontentloaded'});
    await page.locator('#home-screen.active .bc14-subject').first().waitFor({timeout:18000});
    // Preserve exact, already-approved original portraits for manual visual QA,
    // so a clothing cutout cannot silently replace a child's chosen fox.
    const originals=await page.evaluate(()=>Object.fromEntries(['boy','girl'].map(id=>[
      id,window.LARIA_PROFILE_AVATARS[id].split(',')[1]
    ])));
    for(const id of ['boy','girl']){
      fs.writeFileSync(path.join(evidence,id+'-original-portrait.webp'),Buffer.from(originals[id],'base64'));
    }

    // Child-facing release contract: only the chosen premium fox and earned
    // keepsakes are visible. Previous outfit artwork is deliberately hidden.
    assert.equal(await page.locator('.bc12-nav [data-camp]').count(),5,'Keep the five main destinations');
    assert.equal(await page.evaluate(()=>window.LARIA_FOX_WARDROBE.gearPreviewEnabled),false);
    const lockedHome=await page.locator('.bc12.bc15-locked-home').count()>0;
    if(lockedHome){
      await page.locator('.bc12-nav [data-camp="wardrobe"]').click();
      const trollDialog=page.locator('#bc15-troll-dialog[open]');
      await trollDialog.waitFor({state:'visible'});
      assert.match(await trollDialog.locator('h2').innerText(),/Mine troll/);
      assert.equal(await page.locator('#bc12-dialog[open].is-wardrobe').count(),0,
        'Home v15 troll entry must not open the legacy fox wardrobe');
      await trollDialog.locator('.bc15-troll-close').click();
    }
    await page.locator('.bc12-nav [data-camp="collection"]').click();
    await page.locator('#bc12-dialog[open].is-collection .bc12-memory-grid').waitFor();
    assert.equal(await page.locator('#bc12-dialog[open] .bc12-memory').count(),4);
    assert.equal(await page.locator('#bc12-dialog[open] .bc12-memory-symbol svg').count(),4);
    assert.equal(await page.locator('#bc12-dialog[open] [data-collectible-id="tallkrystall"]').getAttribute('data-owned'),'true');
    assert.equal(await page.locator('#bc12-dialog[open] [data-collectible-id="bokskogens-fjaer"]').getAttribute('data-owned'),'false');
    assert.equal(await page.locator('#bc12-dialog[open] .bc12-memory-intro b').innerText(),'1 av 4 minner funnet');
    assert.equal(await page.locator('#bc12-dialog[open] .bc12-collection-tabs,#bc12-dialog[open] .bc12-equipment-card').count(),0);
    assert.equal(await page.locator('#bc12-dialog[open] [data-wardrobe-open]').count(),1);
    // The collection book still provides the deliberate route to the existing
    // personal fox preview. Home v15 itself is troll-led.
    await page.locator('#bc12-dialog[open] [data-wardrobe-open]').click();
    const foxPreview=page.locator('#bc12-dialog[open].is-wardrobe .bc12-wardrobe-preview svg[data-avatar="boy"]');
    await foxPreview.waitFor();
    assert.equal(await page.locator('#bc12-dialog[open] [data-wear],#bc12-dialog[open] [data-gear],#bc12-dialog[open] .bc12-wardrobe-grid').count(),0,'Unfinished clothing UI leaked');
    const portrait=await foxPreview.evaluate(svg=>({
      viewBox:svg.getAttribute('viewBox'),mask:svg.querySelector('image')?.getAttribute('mask'),
      hardCrop:svg.querySelectorAll('clipPath').length,imageHeight:svg.querySelector('image')?.getAttribute('height')
    }));
    assert.equal(portrait.viewBox,'0 0 200 300','Min rev must retain original full-body composition');
    assert.equal(portrait.imageHeight,'300');
    assert.equal(portrait.mask,null);
    assert.equal(portrait.hardCrop,0);
    const legacy=await page.evaluate(()=>{
      const svg=new DOMParser().parseFromString(
        window.LARIA_FOX_WARDROBE.render('boy',window.LARIA_COLLECTION_STORE.snapshot(),'portrait'),
        'image/svg+xml').documentElement;
      return {viewBox:svg.getAttribute('viewBox'),mask:svg.querySelector('image')?.getAttribute('mask')};
    });
    assert.equal(legacy.viewBox,'0 0 200 272');
    assert.match(legacy.mask||'',/^url\(#laria-wd-/);
    await page.screenshot({path:path.join(evidence,label+'-min-rev-uten-utstyr.png'),animations:'disabled'});
    await page.locator('#bc12-dialog[open] .bc12-close').click();
    await page.locator('.bc12-nav [data-camp="collection"]').click();
    const layout=await page.locator('#bc12-dialog[open]').evaluate(el=>{
      const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,windowHeight:innerHeight,
        scrollHeight:el.scrollHeight,clientHeight:el.clientHeight}
    });
    assert.ok(layout.top>=-2&&layout.bottom<=layout.windowHeight+2,
      label+' collection book overflows viewport: '+JSON.stringify(layout));
    await page.screenshot({path:path.join(evidence,label+'-magisk-samlebok.png'),animations:'disabled'});
    await page.locator('#bc12-dialog[open] .bc12-close').click();
    assert.equal(await page.locator('#bc12-dialog[open]').count(),0);
    const first=await page.evaluate(()=>({
      avatar:state.profile.avatar,
      answers:state.answerLog.length,
      collection:window.LARIA_COLLECTION_STORE.snapshot(),
      node:state.journey.nodes['math:2:talldalen']
    }));
    assert.equal(first.avatar,'boy');
    assert.equal(first.answers,13);
    assert.equal(first.node.attempts,1);
    assert.ok(first.collection.ownedIds.includes('magisk-samlebok'));
    assert.ok(first.collection.ownedIds.includes('tallkrystall'));
    assert.ok(first.collection.ownedIds.includes('eventyrskjerf'));
    assert.ok(first.collection.ownedIds.includes('oppdagerhatt'));
    assert.ok(!first.collection.ownedIds.includes('bokskogens-fjaer'));
    assert.equal(await page.evaluate(()=>window.LARIA_COLLECTION_STORE.equip('nordlyskappe')),false,'locked item was equipped');
    assert.equal(await page.evaluate(()=>window.LARIA_COLLECTION_STORE.equip('oppdagerhatt')),true);
    assert.equal(await page.evaluate(()=>window.LARIA_COLLECTION_STORE.equip('eventyrskjerf')),true);
    await page.evaluate(()=>{state.profile.avatar='girl';saveState()});
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#home-screen.active .bc14-subject').first().waitFor({timeout:18000});
    const persisted=await page.evaluate(()=>({
      profile:state.profile,
      source:document.querySelector('.bc12-fox img')?.getAttribute('src'),
      expected:window.LARIA_FOX.source('girl'),
      collection:window.LARIA_COLLECTION_STORE.snapshot(),
      answers:state.answerLog.length,
      nodes:state.journey.nodes
    }));
    assert.equal(persisted.profile.avatar,'girl','avatar overwritten by collection migration');
    assert.equal(persisted.source,persisted.expected,'chosen fox missing after save');
    assert.equal(persisted.collection.equipped.head,'oppdagerhatt');
    // Existing saves still remember equipped items. The unpublished
    // accessory graphics must remain absent even after reload.
    await page.locator('#home-screen.active .bc12-fox svg.laria-fox-wardrobe-placed').waitFor({state:'attached',timeout:12000});
    assert.equal(await page.locator('#home-screen.active .bc12-fox [data-gear]').count(),0);
    await page.locator('.bc12-nav [data-camp="wardrobe"]').click();
    if(await page.locator('.bc12.bc15-locked-home').count()){
      const trollDialog=page.locator('#bc15-troll-dialog[open]');
      await trollDialog.waitFor({state:'visible'});
      assert.match(await trollDialog.locator('h2').innerText(),/Mine troll/);
      await trollDialog.locator('.bc15-troll-close').click();
    }else{
      assert.equal(await page.locator('#bc12-dialog[open] [data-gear],#bc12-dialog[open] [data-wear]').count(),0);
      await page.locator('#bc12-dialog[open] .bc12-close').click();
    }
    await page.locator('.bc12-nav [data-camp="collection"]').click();
    assert.equal(await page.locator('#bc12-dialog[open] [data-collectible-id="tallkrystall"]').getAttribute('data-owned'),'true',
      'earned keepsake must remain visible after avatar change and reload');
    await page.locator('#bc12-dialog[open] .bc12-close').click();
    assert.equal(persisted.collection.equipped.neck,'eventyrskjerf');
    assert.equal(persisted.answers,13);
    assert.equal(persisted.nodes['math:2:talldalen'].attempts,1);
    assert.deepEqual(await page.evaluate(()=>window.LARIA_COLLECTION_STORE.refresh()),[],
      'reloaded progress was paid out a second time');
    assert.equal(await page.evaluate(()=>window.LARIA_COLLECTION_STORE.unequip('head')),true);
    assert.equal(await page.evaluate(()=>window.LARIA_COLLECTION_STORE.snapshot().equipped.head),null);
    assert.equal(await page.evaluate(()=>window.LARIA_COLLECTION_STORE.snapshot().ownedIds.includes('oppdagerhatt')),true);
    const bad=await page.evaluate(()=>{
      state.collectibles={ownedIds:['FAKE'],equipped:{head:'FAKE'}};
      saveState();return true;
    });
    assert.ok(bad);
    await page.reload({waitUntil:'domcontentloaded'});
    const safe=await page.evaluate(()=>window.LARIA_COLLECTION_STORE.snapshot());
    assert.equal(safe.ownedIds.includes('FAKE'),false);
    assert.equal(safe.equipped.head,null);
    assert.ok(safe.ownedIds.includes('oppdagerhatt'),
      'previous owned item must be reconstructed from still-present learning');
    // Wardrobe composition is intentionally scheduled on requestAnimationFrame
    // after state recovery. Wait for the real selected character layer rather
    // than inspecting the DOM before the first post-reload render frame.
    const homeFox=page.locator('#home-screen.active .bc12-fox');
    await homeFox.locator(':scope > svg.laria-fox-wardrobe-placed').waitFor({state:'attached',timeout:12000});
    assert.equal(await homeFox.locator(':scope > svg.laria-fox-wardrobe-placed').count(),1,
      'home selected fox must have exactly one composited art layer');
    assert.equal(await homeFox.locator(':scope > svg.laria-fox-wardrobe-placed').getAttribute('data-avatar'),'girl',
      'reloading recovered inventory must preserve the selected girl fox');
    await context.close();
    console.log('Collection inventory persistent',label,viewport);
  }finally{await browser.close();}
}
(async()=>{
  await verify(chromium,'iphone',{width:390,height:844});
  await verify(webkit,'ipad',{width:820,height:1180});
})().catch(err=>{console.error(err);process.exitCode=1});