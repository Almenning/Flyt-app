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
 const page=await browser.newPage({viewport:{width:w,height:h},hasTouch:w<1400,serviceWorkers:'block'});
 const errors=[];page.on('pageerror',err=>errors.push(err.message));
 await page.addInitScript(s=>{if(!localStorage.getItem('laerlittmer-v2'))localStorage.setItem('laerlittmer-v2',JSON.stringify(s));},seed);
 await page.goto(url);
 await page.locator('#home-screen.active').waitFor();
 let naturalBox;
 const clamp=(min,value,max)=>Math.max(min,Math.min(value,max));
 const publishedHeight=h>w
   ? (w<=700?clamp(155,h*.24,208):clamp(222,h*.24,318))
   : (h<=600?clamp(105,h*.31,160):clamp(184,h*.31,258));
 if(w>=768&&h>=650){
   const active=page.locator('#home-screen .bc15-v16-troll');
   await active.locator('canvas').waitFor({timeout:30000});
   for(const id of ['storesoster','lillesoster','lillebror']){
     await page.evaluate(id=>window.LARIA_TROLL_ACTOR.persistChoice(id),id);
     await active.locator('img[data-laria-troll-posed][src$="'+id+'.webp"]').waitFor();
     assert.match(await active.locator('img').getAttribute('src'),/troll-b\/gangemagi-troll/);
     assert.equal(await active.locator('img').evaluate(el=>el.naturalWidth),887);
     await active.screenshot({path:out+'/'+engine+'-'+w+'x'+h+'-'+id+'.png'});
   }
   const box=await active.boundingBox();
   naturalBox=await active.locator('img').boundingBox();
   assert.ok(box.height>=publishedHeight*1.23,'Home companion must be at least 23% larger than release B: '+box.height);
   const overlap=await active.evaluate(el=>{
     const r=el.getBoundingClientRect();
     return Array.from(el.parentElement.querySelectorAll('.bc15-v16-signs button,.bc15-v16-reisen,.bc12-journey,.bc15-v16-greeting,.bc12-nav button,.bc12-adult-entry'))
       .filter(c=>{const b=c.getBoundingClientRect();return b.width&&b.height&&Math.min(b.right,r.right)-Math.max(b.left,r.left)>2&&Math.min(b.bottom,r.bottom)-Math.max(b.top,r.top)>2;})
       .map(c=>c.className);
   });
   assert.ok(box.x>=-1&&box.y>=-1&&box.x+box.width<=w+1&&box.y+box.height<=h+1,'Home companion must fit in the visible scene');
   assert.deepEqual(overlap,[],'larger companion must not obstruct the Home controls');
   await page.screenshot({path:out+'/'+engine+'-'+w+'x'+h+'-home-troll-b.jpg',type:'jpeg',quality:91});
   const dynamic=()=>active.locator('canvas').evaluate(el=>el.toDataURL());
   await active.click();
   assert.equal(await active.getAttribute('data-laria-troll-mood'),'wave');
   const start=await dynamic();await page.waitForTimeout(340);assert.notEqual(await dynamic(),start);
   await page.evaluate(()=>{const a=document.querySelector('#home-screen .bc15-v16-troll');window.LARIA_TROLL_ACTOR.mood(a,'celebrate',{say:false});});
   await page.waitForTimeout(340);
   await page.screenshot({path:out+'/'+engine+'-'+w+'x'+h+'-celebrate.png'});
 }else if(h>w){
   await page.locator('#home-screen .bc12.bc15-locked-home').waitFor();
   assert.equal(await page.locator('#home-screen .laria-troll-actor:visible').count(),0,
     'Do not add a second companion on top of the locked phone illustration');
   await page.screenshot({path:out+'/'+engine+'-'+w+'x'+h+'-home-locked-art.jpg',type:'jpeg',quality:90});
 }
 await openSubject(page,'math');
 const actor=page.locator('#tallvika-world .tv-actor-touch');
 await actor.locator('img').waitFor();
 await actor.locator("img[data-laria-troll-posed]").waitFor({timeout:12000});
 assert.match(await actor.locator('img').getAttribute('src'),/troll-b\/gangemagi-troll/);
 const sameSize=async (label,img)=>{
   const base=naturalBox||await page.evaluate(()=>{const p=document.createElement('div');p.style.cssText='visibility:hidden;position:fixed;width:var(--laria-front-troll-width);height:var(--laria-front-troll-height)';document.body.append(p);const {width,height}=p.getBoundingClientRect();p.remove();return {width,height};});
   const box=await img.boundingBox();
   const compactEnglish=label==='english'&&w<768&&h<600&&h>w;
   if(compactEnglish){
     assert.ok(Math.abs(box.height-w*.36)<=1,'Legacy English strip uses its own safe character size');
   }else{
     assert.ok(box.height>=publishedHeight*1.23,label+' companion must be at least 23% larger than release B: '+box.height);
     assert.ok(Math.abs(box.height-base.height)<=1&&Math.abs(box.width-base.width)<=1,label+' must match Home scale: '+JSON.stringify({box,base}));
   }
   assert.ok(box.x>=-1&&box.y>=-1&&box.x+box.width<=w+1&&box.y+box.height<=h+1,label+' companion must fit in the visible scene: '+JSON.stringify(box));
   const overlap=await img.evaluate(e=>{
     const hit=e.parentElement,scene=hit.closest('.eg-hero,.tv-scene,.ki-stage,.gv-scene'),r=hit.getBoundingClientRect();
     return [...scene.querySelectorAll('nav.laria-scene-navigation button,.laria-reference-heading,.ki-painted-hit,.tv-home-btn,.eg-home-btn,.gv-home-btn')].filter(c=>{
       const b=c.getBoundingClientRect(),s=getComputedStyle(c);
       return s.visibility!=='hidden'&&b.width&&b.height&&Math.min(b.right,r.right)-Math.max(b.left,r.left)>2&&Math.min(b.bottom,r.bottom)-Math.max(b.top,r.top)>2;
     }).map(c=>c.className);
   });
   assert.deepEqual(overlap,[],label+' companion must not cover the subject controls');
 };
 await sameSize('Matte',actor.locator('img'));
 await page.screenshot({path:out+'/'+engine+'-'+w+'x'+h+'-math-front.jpg',type:'jpeg',quality:90});
 await actor.screenshot({path:out+'/'+engine+'-'+w+'x'+h+'-tallvika.png'});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.waitForFunction(()=>matchMedia('(prefers-reduced-motion: reduce)').matches && [...document.querySelectorAll('.laria-troll-pose')].every(c=>getComputedStyle(c).display==='none'));
 const staticArt=actor.locator('img');
 assert.equal(await staticArt.evaluate(el=>getComputedStyle(el).animationName),'none');
 assert.equal(await staticArt.evaluate(el=>getComputedStyle(el).opacity),'1');
 assert.match(await staticArt.getAttribute('src'),/troll-b\/gangemagi-troll/);
 await page.evaluate(()=>window.LARIA_TROLL_ACTOR.openChooser());
 const cards=page.locator('#laria-premium-troll-dialog[open] .laria-troll-choice img');
 assert.equal(await cards.count(),3);
 for(const src of await cards.evaluateAll(nodes=>nodes.map(e=>e.src)))assert.match(src,/troll-b\/gangemagi-troll/);
 await page.locator('#laria-premium-troll-dialog .laria-troll-dialog-close').click();
 await actor.screenshot({path:out+'/'+engine+'-'+w+'x'+h+'-static.png'});
 {
   for(const [subject,locator] of [['norwegian','.eg-companion-actor'],['english','.ki-companion-actor'],['geography','.gv-troll']]){
     await page.evaluate(()=>setTab('home'));
     await openSubject(page,subject);
     const figure=page.locator(locator+':visible').first().locator('img');
     await figure.waitFor();
     await page.waitForFunction(el=>el?.src.includes('/troll-b/'),await figure.elementHandle());
     if(subject==='geography')await page.locator('.gv-landscape').evaluate(img=>img.decode());
     await page.screenshot({path:out+'/'+engine+'-'+w+'x'+h+'-'+subject+'-front.jpg',type:'jpeg',quality:90});
     await sameSize(subject,figure);
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
  for(const [w,h] of [[1180,820],[820,1180],[1024,1366],[1366,1024],[1024,768],[390,844],[320,568],[844,390],[1440,900]]){
   if(!process.env.LARIA_TROLL_VIEWPORT||process.env.LARIA_TROLL_VIEWPORT===w+'x'+h)await verify(type,engine,w,h);
  }
 }
}
module.exports=run;
if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1});
