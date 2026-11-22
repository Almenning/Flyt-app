'use strict';
/* Review-only screenshots from actual English Kinnaklova -> Words/Reading.
 * Before = legacy background injected only in test; After = proposed CSS
 * from the exact PR head. Never touch questions, art pixels or saved state. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const openHomeSubject=require('./helpers/laria-home-open-subject.cjs');
const base=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const out=process.env.ENGLISH_BACKGROUND_SCREENSHOTS||'/tmp/laria-english-task-background';
fs.mkdirSync(out,{recursive:true});
const seed={version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'Prøvebarn',avatar:'girl',setupVersion:2,tallvikaTroll:'lillesoster'},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
 masteryEvidence:{},skillEvidence:{},skillLastSeen:{},preferences:{sound:false,autoRead:false},
 lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},
 answerLog:[],sessionLog:[],activeSession:null};
const existing='engelsk-verden.png';
const proposed='assets/kinnaklova/kinnaklova-ui-free-approved.webp';
const report=[];
function file(engine,device,name){return path.join(out,engine+'-'+device+'-'+name+'.png')}
async function subjectToActivity(page,activity){
 const world=page.locator('#kinnaklova-world');
 await page.waitForFunction(()=>document.querySelector('#kinnaklova-world')?.dataset.kiArt==='ready',
  null,{timeout:35000});
 const button=world.locator('.ki-painted-'+activity+':visible');
 if(await button.count())await button.click();
 else await world.locator('.ki-card[data-ki="'+activity+'"]:visible').click();
 await page.locator('#session-screen.active .laria-task-card').waitFor({state:'visible',timeout:25000});
 assert.equal(await page.locator('#session-screen.active').getAttribute('data-task-subject'),'english');
}
async function captureTask(page,engine,device,activity,first=false){
 const current=await page.evaluate(()=>{
   const s=document.querySelector('#session-screen.active');
   return {subject:s.dataset.taskSubject,world:getComputedStyle(s).getPropertyValue('--task-world'),
    rendered:getComputedStyle(s.querySelector('.session'),'::after').backgroundImage,
    question:s.querySelector('.question')?.textContent?.trim(),
    answers:s.querySelectorAll('.answer').length};
 });
 assert.match(current.world,/kinnaklova-ui-free-approved\.webp/);
 assert.match(current.rendered,/kinnaklova-ui-free-approved\.webp/);
 assert.ok(current.question?.length>0&&current.answers>=2,'English learning question is missing');
 const stateBefore=await page.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('laerlittmer-v2'))));
 await page.screenshot({path:file(engine,device,activity+'-after'),fullPage:false,animations:'disabled'});
 if(first){
  await page.addStyleTag({content:'#session-screen.task-scene[data-task-subject="english"]{--task-world:url("./'+existing+'")!important}'});
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('#session-screen.active')).getPropertyValue('--task-world').includes('engelsk-verden.png'));
  const old=await page.evaluate(imageFile=>new Promise((resolve,reject)=>{let image=new Image();image.onload=()=>resolve([image.naturalWidth,image.naturalHeight]);image.onerror=reject;image.src='./'+imageFile;}),existing);
  assert.ok(old[0]>300&&old[1]>200,'legacy world image failed to load');
  await page.screenshot({path:file(engine,device,activity+'-before'),fullPage:false,animations:'disabled'});
  await page.evaluate(()=>document.head.querySelectorAll('style').forEach(x=>{if(x.textContent?.includes('--task-world:url("./engelsk-verden.png")'))x.remove()}));
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('#session-screen.active')).getPropertyValue('--task-world').includes('kinnaklova-ui-free-approved.webp'));
 }
 const stateAfter=await page.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('laerlittmer-v2'))));
 assert.equal(stateAfter,stateBefore,'capture or background swap must not change learning data');
 report.push({engine,device,activity,src:proposed,question:current.question,answers:current.answers,
  after:path.basename(file(engine,device,activity+'-after')),
  before:first?path.basename(file(engine,device,activity+'-before')):null});
}
(async()=>{
 for(const [engine,type] of [['webkit',webkit],['chromium',chromium]]){
  const browser=await type.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
  try{
   for(const [device,viewport] of [['ipad-standing',{width:1024,height:1366}],['ipad-lying',{width:1366,height:1024}]]){
    const context=await browser.newContext({viewport,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block',deviceScaleFactor:1});
    await context.addInitScript(data=>localStorage.setItem('laerlittmer-v2',JSON.stringify(data)),seed);
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
    await page.route('https://api.worldbank.org/**',r=>r.abort());
    await page.goto(base,{waitUntil:'domcontentloaded',timeout:80000});
    await openHomeSubject(page,'english');
    await page.locator('#kinnaklova-world[data-ki-art="ready"] .ki-master').waitFor({state:'visible',timeout:35000});
    const master=await page.locator('#kinnaklova-world .ki-master').getAttribute('src');
    assert.ok(master.includes('kinnaklova-ui-free-approved.webp'),'English subject is not using expected Kinnaklova background');
    await page.screenshot({path:file(engine,device,'kinnaklova-subject'),fullPage:false,animations:'disabled'});
    await subjectToActivity(page,'words');
    await captureTask(page,engine,device,'words',true);
    await page.locator('#close-session').click();
    await page.locator('#kinnaklova-world').waitFor({state:'visible',timeout:18000});
    await subjectToActivity(page,'reading');
    await captureTask(page,engine,device,'reading');
    assert.deepEqual(errors,[],'Browser JS errors '+engine+' '+device);
    await context.close();
    console.log('PASS actual English Kinnaklova and task backgrounds: '+engine+' '+device);
   }
  }finally{await browser.close()}
 }
 fs.writeFileSync(path.join(out,'review.json'),JSON.stringify({kind:'real app screenshot',source:'exact PR head',
  image:proposed,note:'Not owner approved; review only; unmerged PR',results:report},null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1});
