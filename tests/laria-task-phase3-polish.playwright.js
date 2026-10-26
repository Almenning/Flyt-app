'use strict';
/* Premium task-scene contract: four subjects use the same HUD, accessible
   progress, child-sized reading controls, honest feedback and completion.
   Real WebKit/Chromium screenshots include the explicitly illustrated dog. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'..');
const shots=process.env.LARIA_TASK_POLISH_SHOTS||'/tmp/laria-task-phase3-polish';
const scenarios=[
 {subject:'norwegian',question:{subject:'norwegian',type:'learning-choice',skill:'word-reading',
   prompt:'Hvilket dyr ser du?',visual:'🐶',options:['HUND','KATT'],answer:'HUND'}},
 {subject:'math',question:{subject:'math',type:'learning-choice',skill:'number-sense',
   prompt:'Hva er 4 + 3?',options:['7','8','9'],answer:'7'}},
 {subject:'english',question:{subject:'english',type:'learning-choice',skill:'basic-words',
   prompt:'Hva heter dette på engelsk?',visual:'🍎',options:['apple','dog'],answer:'apple'}},
 {subject:'geography',question:{subject:'geography',type:'flag',k:'no',
   prompt:'Hvilket land har dette flagget?',visual:'🇳🇴',options:['Norge','Sverige'],answer:'Norge'}}
];
const seed={version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'EventyrQA',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
 masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
 lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8',
 '.js':'application/javascript; charset=utf-8','.png':'image/png',
 '.svg':'image/svg+xml','.webp':'image/webp','.json':'application/json'};
function server(){
 return new Promise((resolve,reject)=>{
  const app=http.createServer((req,res)=>{
   let uri=new URL(req.url,'http://localhost').pathname;
   if(uri.endsWith('/'))uri+='index.html';
   const file=path.resolve(root,'.'+decodeURIComponent(uri));
   if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
   fs.readFile(file,(error,buffer)=>{
    if(error){res.writeHead(404);res.end('Missing');return}
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
    res.setHeader('Cache-Control','no-store');res.end(buffer);
   });
  });
  app.once('error',reject);
  app.listen(0,'127.0.0.1',()=>resolve({app,url:'http://127.0.0.1:'+app.address().port+'/laer-litt-mer/?app=laria'}));
 });
}
async function run(engine,name,viewport,url){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport,hasTouch:true,
   isMobile:viewport.width<=430,reducedMotion:'reduce',serviceWorkers:'block'});
  await context.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  await page.goto(url+'&task-polish='+name,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof renderQuestion==='function'&&typeof showScreen==='function');
  for(const {subject,question} of scenarios){
   await page.evaluate(({subject,question})=>{
    sessionQuestions=[{...question},{...question}];
    sessionScope={type:'subject',subject,grade:2,label:'Premium-oppgave',practiceOnly:true};
    qIndex=0;sessionCorrect=0;sessionStrengthened=new Set();
    currentAnswered=null;state.activeSession={startedAt:Date.now()};
    persistActiveSession();showScreen('session');renderQuestion();
   },{subject,question});
   const label=name+' '+subject;
   await page.locator('#session-screen.active .laria-task-card').waitFor({timeout:12000});
   if(subject==='norwegian'){
     assert.equal(await page.locator('#session-screen.active .task-fox-companion').count(),0,
       label+' retired fox must be absent from Norsk task scene');
     const guide=page.locator('#session-screen.active .task-norsk-guide');
     await guide.waitFor({state:'visible',timeout:15000});
     assert.equal(await guide.count(),1,label+' Norsk has duplicate helper guides');
     assert.ok((await guide.boundingBox())?.width>=30,label+' Norsk guidance symbol is missing');
   }else{
     assert.equal(await page.locator('#session-screen .task-fox-companion').count(),1,label+' duplicate fox');
     // Other subjects still retain their own original full-body figure until
     // their separately approved visual migrations ship.
     await page.waitForFunction(visual=>{
       const fox=document.querySelector('#session-screen.active .task-fox-companion');
       const original=fox?.querySelector('img');
       const rig=fox?.querySelector('svg.laria-fox-wardrobe-placed[data-fox-art="girl-fullbody-v1"]');
       const marker=fox?.querySelector('.task-profile-marker');
       return !!original&&!!rig&&getComputedStyle(original).visibility==='hidden'&&
         rig.getBoundingClientRect().width>30&&rig.getBoundingClientRect().height>40&&
         (!visual||!marker||getComputedStyle(marker).display==='none');
     },!!question.visual,{timeout:15000});
     assert.equal(await page.locator('#session-screen .task-fox-companion .laria-fox-wardrobe-placed').count(),1,
       label+' duplicate or missing chosen full-body fox');
   }
   const first=await page.evaluate(()=>{
    const progress=document.querySelector('#session-screen .session-progress');
    const read=document.querySelector('#session-screen .read-aloud');
    const buttons=[...document.querySelectorAll('#session-screen .task-interaction button.answer')];
    const rect=el=>el?.getBoundingClientRect().toJSON()||null;
    return {subject:document.querySelector('#session-screen').dataset.taskSubject,
     label:document.querySelector('.task-card-head .qtype')?.textContent||'',
     count:document.querySelector('#session-count')?.textContent||'',
     role:progress?.getAttribute('role'),value:progress?.getAttribute('aria-valuenow'),
     max:progress?.getAttribute('aria-valuemax'),caption:progress?.getAttribute('aria-valuetext'),
     progress:parseFloat(document.querySelector('#session-progress-bar')?.style.width||'0'),
     button:document.querySelector('#next-question')?.textContent,
     nextLabel:document.querySelector('#next-question')?.getAttribute('aria-label'),
     read:read?{text:read.textContent,rect:rect(read)}:null,
     feedback:{role:document.querySelector('#feedback')?.getAttribute('role'),
      live:document.querySelector('#feedback')?.getAttribute('aria-live')},
     buttons:buttons.map(el=>({text:el.textContent,rect:rect(el)})),
     dog:document.querySelector('.task-illustration-dog')?{
      ears:document.querySelectorAll('.task-illustration-dog [data-dog-detail*="floppy-ear"]').length,
      muzzle:document.querySelectorAll('.task-illustration-dog [data-dog-detail="long-muzzle"]').length,
      collar:document.querySelectorAll('.task-illustration-dog [data-dog-detail="collar"]').length,
      tail:document.querySelectorAll('.task-illustration-dog [data-dog-detail="curved-tail"]').length,
      paws:document.querySelectorAll('.task-illustration-dog [data-dog-detail="paws"]').length
     }:null};
   });
   assert.equal(first.subject,subject,label+' wrong course');
   assert.equal(first.role,'progressbar',label+' missing accessible progress');
   assert.equal(first.value,'1');assert.equal(first.max,'2');
   assert.equal(first.caption,'Oppdrag 1 av 2');
   assert.equal(first.count,'Oppdrag 1 av 2');
   assert.equal(first.progress,50);
   assert.equal(first.button,'Neste');
   assert.equal(first.nextLabel,'Neste oppgave');
   assert.equal(first.feedback.role,'status');
   assert.equal(first.feedback.live,'polite');
   if(first.read) {
    assert.match(first.read.text,/Les opp/,label+' inconsistent read-aloud');
    assert.ok(first.read.rect.height>=44,label+' read-aloud too small: '+JSON.stringify(first.read));
   }
   assert.ok(first.buttons.length>=2,label+' missing choices');
   assert.ok(first.buttons.every(b=>b.rect.height>=44),label+' too-small answer target');
   if(subject==='english')assert.match(first.label,/ENGELSK/);
   if(subject==='norwegian')assert.deepEqual(first.dog,{ears:1,muzzle:1,collar:1,tail:1,paws:1},label+' dog silhouette missing recognizable features');
   await fs.promises.mkdir(shots,{recursive:true});
   await page.screenshot({path:path.join(shots,name+'-'+subject+'-01-question.png'),animations:'disabled',fullPage:true});
   const geometry=()=>page.evaluate(()=>{
     const find=selector=>document.querySelector(selector);
     const rect=selector=>{const r=find(selector)?.getBoundingClientRect();return r?{top:r.top,height:r.height}:null};
     const session=find('#session-screen .session');
     const card=find('#session-screen .laria-task-card');
     return {
       cardY:card.getBoundingClientRect().top+session.scrollTop,
       scrollHost:session.scrollTop,rootScroll:window.scrollY,
       docScroll:document.scrollingElement?.scrollTop,
       viewportHeight:window.innerHeight,
       visualViewport:window.visualViewport?{
         offsetTop:window.visualViewport.offsetTop,height:window.visualViewport.height}:null,
       session:rect('#session-screen .session'),
       header:rect('#session-screen .session-top'),
       wrap:rect('#session-screen #question-wrap'),
       card:rect('#session-screen .laria-task-card'),
       computed:{sessionRows:getComputedStyle(session).gridTemplateRows,
         sessionAlign:getComputedStyle(session).alignContent,
         wrapAlign:getComputedStyle(find('#session-screen #question-wrap')).alignSelf,
         wrapMargin:getComputedStyle(find('#session-screen #question-wrap')).marginTop,
         bodyOverflow:getComputedStyle(document.body).overflow}
     };
   });
   const anchoredBefore=await geometry();
   await page.locator('#session-screen .answer[data-answer="'+question.answer+'"]').click();
   const anchoredAfter=await geometry();
   assert(Math.abs(anchoredAfter.cardY-anchoredBefore.cardY)<=3,
     label+' response recentered task by '+(anchoredAfter.cardY-anchoredBefore.cardY)+
     'px before='+JSON.stringify(anchoredBefore)+' after='+JSON.stringify(anchoredAfter));
   assert(!/🦊/.test(await page.locator('#feedback-title').innerText()),label+' duplicated mascot in feedback');
   if(subject==='english'&&first.read){
     assert(await page.locator('#task-hear-word').isVisible(),label+' missing English word replay');
   }
   assert.equal(await page.locator('#feedback').getAttribute('role'),'status');
   assert.match(await page.locator('#feedback-title').innerText(),/Riktig/);
   assert.ok(await page.locator('#next-question').isVisible(),label+' next hidden after answer');
   await page.locator('#next-question').click();
   assert.equal(await page.locator('#session-count').innerText(),'Oppdrag 2 av 2');
   assert.equal(await page.evaluate(()=>document.querySelector('#session-screen .session').scrollTop),0,
     label+' new question retained an old scroll offset');
   assert.equal(await page.locator('#session-screen .session-progress').getAttribute('aria-valuenow'),'2');
   assert.equal(await page.locator('#next-question').innerText(),'Fullfør');
   assert.equal(await page.locator('#next-question').getAttribute('aria-label'),'Fullfør oppdraget');
   await page.locator('#session-screen .answer[data-answer="'+question.answer+'"]').click();
   assert.match(await page.locator('#feedback-title').innerText(),/Riktig/);
   await page.screenshot({path:path.join(shots,name+'-'+subject+'-02-complete-answer.png'),animations:'disabled',fullPage:true});
   await page.locator('#next-question').click();
   await page.locator('#complete-screen.active').waitFor({timeout:10000});
  }
  assert.deepEqual(errors,[],name+' uncaught runtime error');
  await context.close();
  console.log('PASS Læria phase-3 final task UX',name,viewport,'four subjects, progression, dog art, feedback, completion');
 }finally{await browser.close()}
}
(async()=>{
 const {app,url}=await server();
 try{
  for(const [engine,name,size] of [
   [webkit,'webkit-iphone-small',{width:320,height:568}],
   [webkit,'webkit-iphone',{width:390,height:844}],
   [webkit,'webkit-iphone-landscape',{width:844,height:390}],
   [webkit,'webkit-ipad',{width:820,height:1180}],
   [webkit,'webkit-ipad-landscape',{width:1180,height:820}],
   [chromium,'chromium-iphone',{width:390,height:844}]
  ])await run(engine,name,size,url);
 }finally{await new Promise(resolve=>app.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
