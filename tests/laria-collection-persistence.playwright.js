'use strict';
/* Persistence contract; no wardrobe artwork or reward overlays are shipped here. */
const assert=require('node:assert/strict');
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
    assert.equal(await page.locator('.laria-wardrobe,.laria-gear-preview').count(),0,
      'must not ship misleading clothes before layered artwork is approved');
    await context.close();
    console.log('Collection inventory persistent',label,viewport);
  }finally{await browser.close();}
}
(async()=>{
  await verify(chromium,'iphone',{width:390,height:844});
  await verify(webkit,'ipad',{width:820,height:1180});
})().catch(err=>{console.error(err);process.exitCode=1});