'use strict';
/* Exact-head audit of the ACTUAL common task scene for all four Læria subjects.
 * Real renderer + isolated QA questions, no saved child data, no changes to
 * illustrations or production CSS for Math/Geography. */
const {chromium,webkit}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const base=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const output=process.env.LARIA_ALL_SUBJECT_BACKGROUNDS||'/tmp/laria-all-subject-backgrounds';
fs.mkdirSync(output,{recursive:true});
const cases=[
 {subject:'norwegian',question:{subject:'norwegian',type:'learning-choice',skill:'word-reading',prompt:'Hvilket dyr ser du?',visual:'🐶',options:['HUND','KATT'],answer:'HUND'},
  expected:'assets/norsk/eggenipa-master-laast-20261025.png'},
 {subject:'english',question:{subject:'english',type:'learning-choice',skill:'basic-words',prompt:'Hva heter dette på engelsk?',visual:'🍎',options:['apple','dog'],answer:'apple'},
  expected:'assets/kinnaklova/kinnaklova-ui-free-approved.webp'},
 {subject:'math',question:{subject:'math',type:'learning-choice',skill:'number-sense',prompt:'Hva er 4 + 3?',options:['7','8','9'],answer:'7'},
  expected:'matte-verden.png'},
 {subject:'geography',question:{subject:'geography',type:'flag',k:'no',prompt:'Hvilket land har dette flagget?',visual:'🇳🇴',options:['Norge','Sverige'],answer:'Norge'},
  expected:'globe-v20-approved.webp'}
];
const seed={version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'Kildekontroll',avatar:'girl',setupVersion:2,tallvikaTroll:'storesoster'},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
 masteryEvidence:{},preferences:{sound:false,autoRead:false},
 lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},
 answerLog:[],sessionLog:[],activeSession:null};
const results=[];
function imageFor(subject,orientation){
 if(subject==='math')return 'assets/tallvika/tallvika-fjord-no-buildings-'+(orientation==='portrait'?'portrait':'wide')+'-20261107.webp';
 if(subject==='geography')return 'assets/cards/reisen/geography-premium.webp';
 return null;
}
async function verifyAsset(page,relative){
 return page.evaluate(async asset=>{
  const image=new Image();
  image.src='./'+asset;
  await image.decode();
  return {width:image.naturalWidth,height:image.naturalHeight};
 },relative);
}
async function run(browserType,engine,device,viewport){
 const browser=await browserType.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport,hasTouch:true,reducedMotion:'reduce',
    serviceWorkers:'block'});
  await context.addInitScript(data=>localStorage.setItem('laerlittmer-v2',JSON.stringify(data)),seed);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  await page.goto(base+'&all-subject-bg='+engine+'-'+device,{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>typeof renderQuestion==='function'&&typeof showScreen==='function',{timeout:30000});
  for(const x of cases){
   await page.evaluate(({subject,question})=>{
    sessionQuestions=[{...question},{...question}];
    sessionScope={type:'subject',subject,grade:2,label:'Kildekontroll',practiceOnly:true};
    qIndex=0;sessionCorrect=0;sessionStrengthened=new Set();
    currentAnswered=null;state.activeSession={startedAt:Date.now()};
    persistActiveSession();showScreen('session');renderQuestion();
   },x);
   const active=page.locator('#session-screen.active.task-scene[data-task-subject="'+x.subject+'"]');
   await active.locator('.laria-task-card').waitFor({state:'visible',timeout:16000});
   const info=await active.evaluate(screen=>{
    const card=screen.querySelector('.laria-task-card').getBoundingClientRect();
    const a=[...screen.querySelectorAll('.answer')].map(el=>el.getBoundingClientRect());
    return {variable:getComputedStyle(screen).getPropertyValue('--task-world').trim(),
     actual:getComputedStyle(screen.querySelector('.session'),'::after').backgroundImage,
     question:screen.querySelector('.question')?.textContent?.trim(),
     answers:a.map(r=>({x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom})),
     card:{x:card.x,y:card.y,w:card.width,h:card.height}};
   });
   assert.ok(info.question&&info.answers.length>=2,'Actual '+x.subject+' task did not render');
   // Geography has a later globe runtime override. Keep the ACTUAL computed
   // image instead of assuming that the first CSS declaration wins.
   const asset=info.variable.match(/url\(["']?\.?\/?([^"')]+)["']?\)/)?.[1]||'';
   assert.ok(asset,'No computed background URL for '+x.subject+': '+info.variable);
   const expected=x.subject==='math'
     ? 'assets/tallvika/tallvika-fjord-no-buildings-'+(device==='portrait'?'portrait':'wide')+'-20261107.webp'
     : x.expected;
   assert.ok(x.subject==='geography'
      ? /^(globe-v20-approved|globe-storyscape-v36-(tablet|landscape|mobile))\.webp$/.test(asset)
      : asset===expected,'Unexpected '+x.subject+' task background: '+info.variable);
   assert.ok(info.actual.includes(asset),'Rendered pseudo-background wrong for '+x.subject);
   const dims=await verifyAsset(page,asset);
   const out={engine,device,subject:x.subject,configured:asset,sourceDims:dims,
     question:info.question,answers:info.answers.length,preview:null};
   await page.screenshot({path:path.join(output,engine+'-'+device+'-'+x.subject+'-current.png'),
     fullPage:false,animations:'disabled'});
   const proposal=imageFor(x.subject,device==='portrait'?'portrait':'landscape');
   if(proposal){
    out.preview=proposal;
    out.previewDims=await verifyAsset(page,proposal);
    const style=await page.addStyleTag({content:'#session-screen.task-scene[data-task-subject="'+x.subject+'"]{--task-world:url("./'+proposal+'")!important;}'});
    await page.waitForFunction(asset=>getComputedStyle(document.querySelector('#session-screen.active.task-scene')).getPropertyValue('--task-world').includes(asset),proposal);
    await page.screenshot({path:path.join(output,engine+'-'+device+'-'+x.subject+'-proposal.png'),
      fullPage:false,animations:'disabled'});
    await style.evaluate(el=>el.remove());
   }
   results.push(out);
   console.log('[Background audit] '+engine+' '+device+' '+x.subject+' = '+out.configured+
     (out.preview?' -> PREVIEW '+out.preview:''));
  }
  assert.deepEqual(errors,[],'App had JS errors during task background audit');
  await context.close();
 }finally{await browser.close()}
}
(async()=>{
 for(const [engine,browser] of [['webkit',webkit],['chromium',chromium]]){
  for(const [device,viewport] of [
   ['portrait',{width:1024,height:1366}],
   ['landscape',{width:1366,height:1024}]
  ])await run(browser,engine,device,viewport);
 }
 fs.writeFileSync(path.join(output,'audit.json'),JSON.stringify({
  commit:process.env.GITHUB_SHA||null,
  mode:'real app renderer with valid isolated test questions, preview CSS injected only',
  lockedSourcesUnmodified:true,
  results},null,2)+'\n');
})().catch(err=>{console.error(err);process.exitCode=1});
