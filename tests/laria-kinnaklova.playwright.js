'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const output=process.env.LARIA_KINNAKLOVA_SCREENSHOTS;
const seed={
 version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'Kinnaklova QA',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
 masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
 lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},
 answerLog:[],sessionLog:[],activeSession:null
};
async function shot(page,label){
 if(!output)return;
 fs.mkdirSync(output,{recursive:true});
 await page.screenshot({path:path.join(output,label+'.png'),fullPage:true,animations:'disabled'});
}
async function visitEnglish(page){
 const tile=page.locator('.bc14-subject[data-camp="subject-english"]');
 await tile.waitFor({state:'visible',timeout:25000});
 await tile.click();
 await page.locator('#subject-screen.active #kinnaklova-world').waitFor({state:'visible',timeout:16000});
}
async function takeActivity(page,action,label){
 await page.locator('#kinnaklova-world .ki-card[data-ki="'+action+'"]').click();
 await page.locator('#session-screen.active .laria-task-card').waitFor({timeout:16000});
 const result=await page.evaluate(()=>({
   subject:sessionScope?.subject,module:sessionScope?.module,
   count:sessionQuestions?.length,question:sessionQuestions?.[qIndex]?.prompt
 }));
 assert.equal(result.subject,'english',label+' wrong subject after '+action);
 assert.equal(result.module,action,label+' wrong module after '+action);
 assert.ok(result.count>=5,label+' missing real learning questions in '+action);
 assert.ok(result.question,label+' empty question in '+action);
 return result;
}
async function run(browserType,name,viewport){
 const browser=await browserType.launch({headless:true,args:browserType===chromium?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({
    viewport,isMobile:viewport.width<=480,hasTouch:true,
    reducedMotion:'reduce',serviceWorkers:'block'
  });
  await context.addInitScript(initial=>{
    if(!localStorage.getItem('laerlittmer-v2'))
      localStorage.setItem('laerlittmer-v2',JSON.stringify(initial));
  },seed);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
  await visitEnglish(page);
  const world=page.locator('#kinnaklova-world');
  assert.equal(await world.locator('.ki-card').count(),3,name+' missing three direct English places');
  assert.equal(await world.locator('.ki-painted-hit').count(),4,name+' missing painted sign and home hitboxes');
  assert.equal(await world.locator('.ki-master').getAttribute('width'),'1672',name+' wrong art width');
  assert.equal(await world.locator('.ki-master').getAttribute('height'),'941',name+' wrong art height');
  assert.equal(await page.locator('#subject-screen.locked-journey-active').count(),0,name+' old map still active');
  const before=await page.evaluate(()=>JSON.stringify({
    nodes:window.LARIA_TALLVIKA_BRIDGE.state().journey?.nodes||{},
    sessionLog:window.LARIA_TALLVIKA_BRIDGE.state().sessionLog||[],
    answerLog:window.LARIA_TALLVIKA_BRIDGE.state().answerLog||[]
  }));
  const art=await world.locator('.ki-master').evaluate(async img=>{
    try{await img.decode()}catch(_){}
    const rect=img.getBoundingClientRect();
    return {ready:img.naturalWidth===1672&&img.naturalHeight===941,
      width:rect.width,height:rect.height,naturalWidth:img.naturalWidth};
  });
  assert.ok(art.width>250,name+' no stage visible');
  assert.ok(Math.abs(art.height-art.width*941/1672)<3,name+' must not crop approved art');
  const documents=await world.locator('.ki-troll').evaluateAll(els=>els.map(el=>({
    id:el.dataset.kiCharacter,src:el.getAttribute('src')
  })));
  assert.deepEqual(documents.map(el=>el.id),['storesoster','lillebror','lillesoster']);
  assert.ok(documents.every(el=>el.src.endsWith('/'+el.id+'.webp')));
  if(art.ready){
    assert.equal(await page.evaluate(()=>window.LARIA_KINNAKLOVA.ready()),true);
    assert.equal(await world.locator('.ki-companions').isVisible(),true);
    if(viewport.width>700){
      const targets=await world.locator('.ki-painted-hit').evaluateAll(els=>els.map(el=>{
        const box=el.getBoundingClientRect();
        return {name:el.dataset.ki,width:box.width,height:box.height};
      }));
      assert.ok(targets.every(t=>t.width>=44&&t.height>=44),
        name+' interactive painted signs too small '+JSON.stringify(targets));
    }
  }else{
    assert.equal(await page.evaluate(()=>window.LARIA_KINNAKLOVA.ready()),false);
    assert.equal(await world.locator('.ki-companions').isVisible(),false,
      name+' must not reveal trolls over a missing/unclean background');
    await world.locator('.ki-art-unavailable:visible').waitFor();
  }
  const overflow=await page.evaluate(()=>({
    scroll:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth
  }));
  assert.ok(overflow.scroll<=overflow.viewport+2,
    name+' horizontal overflow '+JSON.stringify(overflow));
  if(viewport.width<=700){
    assert.equal(await world.locator('.ki-utility').isVisible(),true,name+' missing mobile Home');
  }
  await shot(page,name+'-firstfold');
  assert.equal(await page.evaluate(()=>JSON.stringify({
    nodes:window.LARIA_TALLVIKA_BRIDGE.state().journey?.nodes||{},
    sessionLog:window.LARIA_TALLVIKA_BRIDGE.state().sessionLog||[],
    answerLog:window.LARIA_TALLVIKA_BRIDGE.state().answerLog||[]
  })),before,name+' landing must not modify child learning data');
  const first=await takeActivity(page,'words',name);
  await shot(page,name+'-words');
  await page.locator('#close-session').click();
  await world.waitFor({state:'visible',timeout:16000});
  await world.locator('.ki-resume [data-ki="resume"]').waitFor({state:'visible',timeout:10000});
  await world.locator('.ki-resume [data-ki="resume"]').click();
  await page.locator('#session-screen.active .laria-task-card').waitFor({timeout:16000});
  const resumed=await page.evaluate(()=>({subject:sessionScope?.subject,module:sessionScope?.module,question:sessionQuestions?.[qIndex]?.prompt}));
  assert.deepEqual(resumed,{subject:'english',module:'words',question:first.question},
    name+' resume changed the saved English session');
  await page.locator('#close-session').click();
  await world.waitFor({state:'visible',timeout:16000});
  await takeActivity(page,'sentences',name);
  await page.locator('#close-session').click();
  await world.waitFor({state:'visible',timeout:16000});
  await takeActivity(page,'reading',name);
  await page.locator('#close-session').click();
  await world.waitFor({state:'visible',timeout:16000});
  await shot(page,name+'-return');
  const utility=world.locator('.ki-utility [data-ki="home"]');
  if(await utility.isVisible())await utility.click();
  else await world.locator('.ki-painted-home').click();
  await page.locator('#home-screen.active .bc14-subject').first().waitFor({timeout:16000});
  assert.deepEqual(errors,[],name+' runtime JS errors');
  console.log('[KINNAKLOVA]',name,'direct English, resume, return',art.ready?'ART READY':'ART MISSING (draft release gate)');
  await context.close();
 }finally{await browser.close();}
}
(async()=>{
 for(const [label,viewport] of [
   ['iphone-portrait',{width:390,height:844}],
   ['iphone-landscape',{width:844,height:390}],
   ['ipad-portrait',{width:834,height:1112}],
   ['ipad-landscape',{width:1194,height:834}]
 ]){
   await run(chromium,'chromium-'+label,viewport);
   await run(webkit,'webkit-'+label,viewport);
 }
})().catch(error=>{console.error(error);process.exitCode=1});
