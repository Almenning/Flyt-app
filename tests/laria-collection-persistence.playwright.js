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
      const trollDialog=page.locator('#laria-premium-troll-dialog[open]');
      await trollDialog.waitFor({state:'visible'});
      assert.equal(await trollDialog.locator('[data-troll-choice]').count(),3,
        'Home must offer the locked trio of selectable living TrollActors');
      assert.equal(await page.locator('#bc15-troll-dialog[open],#bc12-dialog[open].is-wardrobe').count(),0,
        'Home must not show a static gallery or retired fox wardrobe');
      await trollDialog.locator('.laria-troll-dialog-close').click();
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
    // The collection's character link must lead to the THREE approved
    // living trolls, never an obsolete fox SVG or unfinished clothing UI.
    await page.locator('#bc12-dialog[open] [data-wardrobe-open]').click();
    const trollChooser=page.locator('#laria-premium-troll-dialog[open]');
    await trollChooser.waitFor({state:'visible',timeout:12000});
    assert.deepEqual(await trollChooser.locator('[data-troll-choice]').evaluateAll(nodes=>
      nodes.map(el=>el.dataset.trollChoice)),['storesoster','lillesoster','lillebror']);
    assert.equal(await trollChooser.locator('[data-troll-choice][aria-pressed="true"]').getAttribute('data-troll-choice'),
      'storesoster','A legacy avatar must not replace the saved approved troll');
    assert.equal(await page.locator('#bc12-dialog [data-wear],#bc12-dialog [data-gear],#bc12-dialog .bc12-wardrobe-grid').count(),
      0,'Unfinished clothing UI leaked into the collection');
    await page.screenshot({path:path.join(evidence,label+'-valgte-troll-uten-utstyr.png'),animations:'disabled'});
    await trollChooser.locator('.laria-troll-dialog-close').click();
    await trollChooser.waitFor({state:'hidden',timeout:12000});
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
      expected:window.LARIA_TROLL_ACTOR.source(state.profile.tallvikaTroll||'storesoster'),
      collection:window.LARIA_COLLECTION_STORE.snapshot(),
      answers:state.answerLog.length,
      nodes:state.journey.nodes
    }));
    assert.equal(persisted.profile.avatar,'girl','avatar overwritten by collection migration');
    assert.equal(persisted.source,persisted.expected,'Selected original troll changed after saving legacy profile');
    assert.equal(persisted.collection.equipped.head,'oppdagerhatt');
    // Existing saves retain items without drawing legacy fox wardrobe
    // graphics over the locked Home or adding unapproved accessories.
    assert.equal(await page.locator('#home-screen.active .bc12-fox svg.laria-fox-wardrobe-placed:visible').count(),0);
    assert.equal(await page.locator('#home-screen.active .bc12-fox [data-gear]').count(),0);
    await page.locator('.bc12-nav [data-camp="wardrobe"]').click();
    if(await page.locator('.bc12.bc15-locked-home').count()){
      const trollDialog=page.locator('#laria-premium-troll-dialog[open]');
      await trollDialog.waitFor({state:'visible'});
      assert.equal(await trollDialog.locator('[data-troll-choice]').count(),3,
        'Saving/reloading collectibles must not remove the troll selection');
      await trollDialog.locator('.laria-troll-dialog-close').click();
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
    // A repaired historical inventory must not change either the legacy
    // profile field or the ONE selected, living TrollActor.
    await page.locator('#home-screen.active .bc14-subject').first().waitFor({timeout:18000});
    assert.equal(await page.evaluate(()=>state.profile.avatar),'girl',
      'invalid inventory recovery must preserve historical profile avatar data');
    assert.equal(await page.evaluate(()=>window.LARIA_TROLL_ACTOR.choice()),'storesoster',
      'invalid inventory recovery must not change the selected approved troll');
    if(lockedHome){
      await page.locator('#home-screen.active .bc12.bc15-locked-home').waitFor({timeout:18000});
      await page.locator('#home-screen.active .bc12-nav [data-camp="collection"]').click();
      await page.locator('#bc12-dialog[open].is-collection [data-wardrobe-open]').click();
      const restoredChooser=page.locator('#laria-premium-troll-dialog[open]');
      await restoredChooser.waitFor({state:'visible',timeout:12000});
      assert.equal(await restoredChooser.locator('[data-troll-choice][aria-pressed="true"]').getAttribute('data-troll-choice'),
        'storesoster','Saved approved troll must remain selected after corrupt inventory recovery');
      assert.equal(await restoredChooser.locator('[data-troll-choice]').count(),3,
        'Recovery must preserve exactly three approved companions');
      assert.equal(await page.locator('#bc12-dialog [data-gear],#bc12-dialog [data-wear]').count(),0,
        'Unreleased wardrobe accessories must stay hidden after recovery');
      await restoredChooser.locator('.laria-troll-dialog-close').click();
      await page.locator('#bc12-dialog[open] .bc12-close').click();
    }else{
      // Even the fallback Home must honor the original TrollActor, not the
      // historical avatar or a composited fox.
      const homeTroll=page.locator('#home-screen.active .bc12-fox > img');
      await homeTroll.waitFor({state:'attached',timeout:12000});
      assert.equal(await homeTroll.getAttribute('src'),
        await page.evaluate(()=>window.LARIA_TROLL_ACTOR.source('storesoster')),
        'Fallback Home must keep the one approved selected troll');
    }
    await context.close();
    console.log('Collection inventory persistent',label,viewport);
  }finally{await browser.close();}
}
(async()=>{
  await verify(chromium,'iphone',{width:390,height:844});
  await verify(webkit,'ipad',{width:820,height:1180});
})().catch(err=>{console.error(err);process.exitCode=1});