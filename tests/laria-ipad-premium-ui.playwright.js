'use strict';
/* iPad-first interface gate: four real PR-head subjects, identical companion
   chooser, three usable scene destinations and immutable progression. */
const assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const URL=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const OUT=process.env.LARIA_IPAD_PREMIUM_SCREENSHOTS||'/tmp/laria-ipad-standard';
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'iPad QA',avatar:'girl',setupVersion:2,tallvikaTroll:'lillesoster'},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},preferences:{sound:false,autoRead:false},journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
const worlds=[
 {id:'math',root:'#tallvika-world',chooser:'.tv-scene-choose',actor:'.tv-actor-touch',home:'[data-tv="back"]',signs:'.tv-sign'},
 {id:'norwegian',root:'#eggenipa-world',chooser:'.eg-scene-choose',actor:'.eg-companion-actor',home:'.eg-scene-home',signs:'.eg-scene-hit'},
 {id:'english',root:'#kinnaklova-world',chooser:'.ki-stage-choose',actor:'.ki-companion-actor',home:'.ki-painted-home',signs:'.ki-painted-hit:not(.ki-painted-home)'},
 {id:'geography',root:'#laria-geography-world',chooser:'.gv-choose',actor:'.gv-troll',home:'.gv-home',signs:'.gv-sign'}
];
async function run(engine,engineName,label,viewport){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 try{
  const ctx=await browser.newContext({viewport,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block',deviceScaleFactor:1});
  await ctx.addInitScript(value=>localStorage.setItem('laerlittmer-v2',JSON.stringify(value)),seed);
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:90000});
  const initialJourney=await page.evaluate(()=>{
    const j=JSON.parse(localStorage.getItem('laerlittmer-v2')).journey||{};
    // Initial navigation may create an empty chapterProgress bucket as a
    // forward-compatible schema migration; no completed learning was lost.
    return JSON.stringify({
      nodes:j.nodes||{},gradeWins:j.gradeWins||{},viewGrades:j.viewGrades||{},
      chapterProgress:j.chapterProgress||{}
    });
  });
  for(const spec of worlds){
   await page.locator('.bc14-subject[data-camp="subject-'+spec.id+'"]').click();
   const world=page.locator(spec.root+':visible');
   await world.waitFor({timeout:18000});
   if(spec.id==='english')
     await page.locator('#kinnaklova-world[data-ki-art="ready"]').waitFor({timeout:18000});
   const chooser=world.locator(spec.chooser);
   await chooser.waitFor({state:'visible',timeout:15000});
   const controls=await chooser.evaluate(el=>{
     const a=el.getBoundingClientRect(),b=el.closest('.screen').getBoundingClientRect();
     return {x:a.x,y:a.y,right:a.right,bottom:a.bottom,width:a.width,height:a.height,
      sceneWidth:b.width,viewportHeight:innerHeight,viewportWidth:innerWidth};
   });
   assert.ok(controls.width>=44&&controls.height>=44&&controls.x>=-2&&
       controls.right<=viewport.width+2&&controls.bottom<=viewport.height+2,
       label+' '+spec.id+' Mine troll not reachable: '+JSON.stringify(controls));
   assert.equal(await world.locator(spec.signs+':visible').count(),3,label+' '+spec.id+' must show three scene destinations');
   const actor=world.locator(spec.actor);
   await actor.waitFor({state:'visible',timeout:14000});
   const id=await actor.getAttribute('data-troll');
   assert.equal(id,'lillesoster',label+' '+spec.id+' switched original companion');
   await chooser.click();
   const dialog=page.locator('#laria-premium-troll-dialog[open]');
   await dialog.waitFor({state:'visible',timeout:10000});
   assert.equal(await dialog.locator('[data-troll-choice]').count(),3,label+' '+spec.id+' lacks original three choices');
   assert.equal(await dialog.locator('[data-troll-choice="lillesoster"]').getAttribute('aria-pressed'),'true',label+' '+spec.id+' chooser lost selected character');
   if(spec.id==='norwegian'){
    await dialog.locator('[data-troll-choice="lillebror"]').click();
    await page.waitForFunction(()=>document.querySelector('#eggenipa-world .eg-companion-actor')?.dataset.troll==='lillebror',null,{timeout:10000});
    await dialog.waitFor({state:'hidden',timeout:6000});
    await world.locator(spec.chooser).click();
    const d=page.locator('#laria-premium-troll-dialog[open]');
    await d.waitFor({timeout:8000});await d.locator('[data-troll-choice="lillesoster"]').click();
    await page.waitForFunction(()=>document.querySelector('#eggenipa-world .eg-companion-actor')?.dataset.troll==='lillesoster',null,{timeout:10000});
    await d.waitFor({state:'hidden',timeout:6000});
   }else await dialog.locator('.laria-troll-dialog-close').click();
   await dialog.waitFor({state:'hidden',timeout:8000});
   await fs.promises.mkdir(OUT,{recursive:true});
   await page.screenshot({path:path.join(OUT,engineName+'-'+label+'-'+spec.id+'.png'),fullPage:false,animations:'disabled'});
   assert.ok(await page.locator('html').evaluate(el=>el.scrollWidth<=innerWidth+2),label+' '+spec.id+' horizontal page overflow');
   await world.locator(spec.home).click();
   await page.locator('#home-screen.active').waitFor({timeout:12000});
  }
  assert.equal(await page.evaluate(()=>{
    const j=JSON.parse(localStorage.getItem('laerlittmer-v2')).journey||{};
    // Initial navigation may create an empty chapterProgress bucket as a
    // forward-compatible schema migration; no completed learning was lost.
    return JSON.stringify({
      nodes:j.nodes||{},gradeWins:j.gradeWins||{},viewGrades:j.viewGrades||{},
      chapterProgress:j.chapterProgress||{}
    });
  }),initialJourney,
     label+' navigation or companion picker modified saved learning progress');
  assert.deepEqual(errors,[],label+' script errors');
  await ctx.close();
 }finally{await browser.close();}
}
(async()=>{
 for(const [label,viewport] of [['landscape',{width:1366,height:1024}],['portrait',{width:1024,height:1366}]])
  for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
   await run(engine,name,label,viewport);
   console.log('PASS '+name+' ipad '+label+' all subjects, shared companion');
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
