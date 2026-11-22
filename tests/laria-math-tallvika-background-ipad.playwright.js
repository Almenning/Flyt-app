'use strict';
/* Exact-head review of the REAL shared math question renderer on iPad.
 * Captures the current branch only; other subjects and progress untouched. */
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const output=process.env.LARIA_MATH_TALLVIKA_QA||'/tmp/laria-math-tallvika-ipad';
fs.mkdirSync(output,{recursive:true});
const sizes=[
 ['portrait-1024',{width:1024,height:1366},'portrait'],
 ['portrait-820',{width:820,height:1180},'portrait'],
 ['landscape-1366',{width:1366,height:1024},'wide'],
 ['landscape-1180',{width:1180,height:820},'wide']
];
const seed={version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'Kontroll',avatar:'girl',setupVersion:2,tallvikaTroll:'storesoster'},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},
 preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,
 lastActivity:null,journey:{nodes:{},gradeWins:{},viewGrades:{}},
 answerLog:[],sessionLog:[],activeSession:null};
const question={subject:'math',type:'learning-choice',skill:'number-sense',
 prompt:'Hva er 4 + 3?',options:['7','8','9'],answer:'7'};
(async()=>{
 const results=[];
 for(const [engine,browserType] of [['webkit',webkit],['chromium',chromium]]){
  const browser=await browserType.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
  try{
   for(const [device,viewport,orientation] of sizes){
    const context=await browser.newContext({viewport,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
    await context.addInitScript(x=>localStorage.setItem('laerlittmer-v2',JSON.stringify(x)),seed);
    const page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
    await page.route('https://api.worldbank.org/**',r=>r.abort());
    await page.goto(process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria',
      {waitUntil:'domcontentloaded',timeout:90000});
    await page.waitForFunction(()=>typeof renderQuestion==='function'&&typeof showScreen==='function',null,{timeout:30000});
    await page.evaluate(q=>{
      sessionQuestions=[q,q];sessionScope={type:'subject',subject:'math',grade:2,label:'Kildekontroll',practiceOnly:true};
      qIndex=0;sessionCorrect=0;sessionStrengthened=new Set();currentAnswered=null;
      state.activeSession={startedAt:Date.now()};persistActiveSession();showScreen('session');renderQuestion();
    },question);
    const screen=page.locator('#session-screen.active.task-scene[data-task-subject="math"]');
    await screen.locator('.laria-task-card').waitFor({state:'visible'});
    const info=await screen.evaluate(el=>{
      const card=el.querySelector('.laria-task-card').getBoundingClientRect();
      return {world:getComputedStyle(el).getPropertyValue('--task-world'),
        question:el.querySelector('.question')?.textContent,
        count:el.querySelectorAll('.answer').length,
        card:{top:card.top,bottom:card.bottom},
        screenHeight:innerHeight};
    });
    const filename='tallvika-fjord-no-buildings-'+orientation+'-20261107.webp';
    assert.ok(info.world.includes(filename),engine+' '+device+' did not use locked Tallvika: '+info.world);
    assert.ok(info.question.includes('4 + 3')&&info.count===3,'Math question failed to render');
    const img=await page.evaluate(name=>new Promise((resolve,reject)=>{
      const i=new Image();i.onload=()=>resolve([i.naturalWidth,i.naturalHeight]);i.onerror=reject;
      i.src='./assets/tallvika/'+name;
    }),filename);
    assert.ok(img[0]>=800&&img[1]>=600,'Locked art not available');
    assert.deepEqual(errors,[],engine+' '+device+' browser errors');
    await page.screenshot({path:path.join(output,engine+'-'+device+'.png'),fullPage:false,animations:'disabled'});
    results.push({engine,device,source:filename,naturalSize:img,card:info.card});
    await context.close();
   }
  }finally{await browser.close()}
 }
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({status:'review-only',results},null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1});
