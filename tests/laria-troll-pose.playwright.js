'use strict';
const assert=require('node:assert/strict');
const {mkdir}=require('node:fs/promises');
const {chromium,webkit}=require('playwright');
const openSubject=require('./helpers/laria-home-open-subject.cjs');
const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const out=process.env.LARIA_PREMIUM_INTEGRATION_SCREENSHOTS||'/tmp/laria-troll-shots';
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Eventyrer',avatar:'girl',setupVersion:2,tallvikaTroll:'storesoster'},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},preferences:{sound:false,autoRead:false},journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
async function verify(type,engine,w,h){
 const local=engine==='chromium'&&process.env.LARIA_CHROMIUM_PATH;
 const browser=await type.launch(local?{executablePath:local,args:['--no-sandbox']}:{}); 
 try{
 const page=await browser.newPage({viewport:{width:w,height:h},hasTouch:true,serviceWorkers:'block'});
 const errors=[];page.on('pageerror',err=>errors.push(err.message));
 await page.addInitScript(s=>{if(!localStorage.getItem('laerlittmer-v2'))localStorage.setItem('laerlittmer-v2',JSON.stringify(s));},seed);
 await page.goto(url);
 await page.locator('#home-screen.active').waitFor();
 const active=w>=768?page.locator('#home-screen .bc15-v16-troll'):page.locator('#home-screen .laria-troll-actor:visible').first();
 if(w>=768){
   await active.locator('canvas').waitFor({timeout:30000});
   for(const id of ['storesoster','lillesoster','lillebror']){
     await page.evaluate(id=>window.LARIA_TROLL_ACTOR.persistChoice(id),id);
     await active.locator('img[data-laria-troll-posed][src$="'+id+'.webp"]').waitFor();
     assert.match(await active.locator('img').evaluate(el=>getComputedStyle(el).maskImage||getComputedStyle(el).webkitMaskImage),/troll-contours/);
     await active.screenshot({path:out+'/'+engine+'-'+w+'-'+id+'.png'});
   }
   const dynamic=()=>active.locator('canvas').evaluate(el=>el.toDataURL());
   await active.click();
   assert.equal(await active.getAttribute('data-laria-troll-mood'),'wave');
   const start=await dynamic();await page.waitForTimeout(340);assert.notEqual(await dynamic(),start);
   await page.evaluate(()=>{const a=document.querySelector('#home-screen .bc15-v16-troll');window.LARIA_TROLL_ACTOR.mood(a,'celebrate',{say:false});});
   await page.waitForTimeout(340);
   await page.screenshot({path:out+'/'+engine+'-'+w+'-celebrate.png'});
 }
 await openSubject(page,'math');
 const actor=page.locator('#tallvika-world .tv-actor-touch');
 await actor.locator('img').waitFor();
 await actor.locator("img[data-laria-troll-posed]").waitFor({timeout:12000});
 assert.match(await actor.locator('img').evaluate(el=>getComputedStyle(el).maskImage||getComputedStyle(el).webkitMaskImage),/troll-contours/);
 await actor.screenshot({path:out+'/'+engine+'-'+w+'-tallvika.png'});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.waitForFunction(()=>matchMedia('(prefers-reduced-motion: reduce)').matches && [...document.querySelectorAll('.laria-troll-pose')].every(c=>getComputedStyle(c).display==='none'));
 const staticArt=actor.locator('img');
 assert.equal(await staticArt.evaluate(el=>getComputedStyle(el).animationName),'none');
 assert.equal(await staticArt.evaluate(el=>getComputedStyle(el).opacity),'1');
 await actor.screenshot({path:out+'/'+engine+'-'+w+'-static.png'});
 if(w===820){
   for(const [subject,locator] of [['norwegian','.eg-companion-actor'],['english','.ki-companion-actor'],['geography','.gv-troll']]){
     await page.evaluate(()=>setTab('home'));
     await openSubject(page,subject);
     const figure=page.locator(locator+':visible').first().locator('img');
     await figure.waitFor();
     assert.match(await figure.evaluate(el=>getComputedStyle(el).maskImage||getComputedStyle(el).webkitMaskImage),/troll-contours/);
     await figure.screenshot({path:out+'/'+engine+'-'+w+'-'+subject+'.png'});
   }
 }
 assert.deepEqual(errors,[]);
 console.log('PASS grounded troll poses',engine,w,h);
 }finally{await browser.close()}
}
async function run(){
 await mkdir(out,{recursive:true});
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
  if(process.env.LARIA_TROLL_ENGINE&&process.env.LARIA_TROLL_ENGINE!==engine)continue;
  for(const [w,h] of [[1180,820],[820,1180],[390,844]])await verify(type,engine,w,h);
 }
}
module.exports=run;
if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1});
