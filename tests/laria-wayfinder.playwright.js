'use strict';
/* Real painted Grovanova arrow hotspots + ONE shared light-wood sign across
   all four subjects. Browser and screen renders are from the exact PR SHA. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
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
  }else assert.equal(await home.locator('.bc15-subject-signs:visible').count(),0,
    'portrait/short-landscape has no painted arrows and must not show invented hotspots');
  await page.screenshot({path:path.join(out,engine+'-'+name+'-home.png'),animations:'disabled',fullPage:false});
  for(const spec of worlds){
   const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2')));
   await home.locator('.bc14-subject[data-camp="subject-'+spec.id+'"]').click();
   const root=page.locator(spec.root+':visible');
   await root.waitFor({timeout:20000});
   if(spec.id==='english')await page.locator('#kinnaklova-world[data-ki-art="ready"]').waitFor({timeout:20000});
   const sign=spec.id==='english'&&viewport.width<=700?
      root.locator('.ki-card[data-ki="words"]'):root.locator(spec.sign);
   const board=spec.id==='english'&&viewport.width<=700?
      root.locator('.ki-card[data-ki="words"]'):root.locator(spec.paint);
   await sign.waitFor({state:'visible',timeout:13000});
   const b=await board.evaluate(el=>{
    const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
    return {x:r.x,y:r.y,w:r.width,h:r.height,background:cs.backgroundImage,color:cs.color,visibility:cs.visibility};
   });
   assert.ok(b.w>=44&&b.h>=44&&b.x>=-2&&b.x+b.w<=viewport.width+2&&b.y>=-2&&b.y+b.h<=viewport.height+2,
     engine+' '+name+' '+spec.id+' sign outside device: '+JSON.stringify(b));
   assert.match(b.background,/laria-light-arrow-sign\.svg/,
     engine+' '+name+' '+spec.id+' did not render the matching Grovanova arrow');
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
 ])for(const [engine,browser] of [['chromium',chromium],['webkit',webkit]]){
  await run(browser,engine,name,view);
  console.log('PASS wooden arrow '+engine+' '+name);
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
