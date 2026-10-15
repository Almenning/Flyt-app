'use strict';
// Real journeys and existing question banks, not synthetic tasks or mocked scoring.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'..'),out=process.env.LARIA_RETRY_EVIDENCE||'/tmp/laria-retry-evidence';
fs.mkdirSync(out,{recursive:true});
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'EventyrQA',avatar:'girl',setupVersion:2},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server=http.createServer((req,res)=>{let u=new URL(req.url,'http://localhost').pathname;if(u.endsWith('/'))u+='index.html';const f=path.resolve(root,'.'+decodeURIComponent(u));if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end()}fs.readFile(f,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});res.end(e?'Missing':b)})});
const matrix=[[320,568],[390,844],[430,932],[844,390],[820,1180],[1180,820],[1440,900]],report=[];
async function question(page){return page.evaluate(()=>sessionQuestions[qIndex]);}
async function build(page,word){
 while(await page.locator('#letter-slots .letter-slot.filled:not([disabled])').count())await page.locator('#letter-slots .letter-slot.filled:not([disabled])').first().click();
 for(let i=0;i<word.length;i++){
  await page.locator('#letter-slots .letter-slot').nth(i).click();
  const tiles=page.locator('.letter-bank .letter-tile:not(.used)');
  let found=false;
  for(let j=0;j<await tiles.count();j++)if((await tiles.nth(j).innerText()).trim()===word[i]){await tiles.nth(j).click();found=true;break}
  assert(found,'Missing available letter '+word[i]);
 }
 await page.locator('#check-build').click();
}
async function answer(page,wrong=false){
 const q=await question(page),answers=page.locator('#session-screen .answer');
 if(await answers.count()){
  const options=await answers.evaluateAll(bs=>bs.map(b=>b.dataset.answer));
  const index=options.findIndex(a=>wrong?a!==String(q.answer):a===String(q.answer));
  assert(index>=0,'No requested answer in existing question');await answers.nth(index).click();
  return {kind:'choice',selected:options[index]};
 }
 if(q.type==='build-word'){
  const letters=Array.from(q.answer);
  if(wrong){const j=letters.findIndex(c=>c!==letters[0]);assert(j>0,'Need distinct letters for wrong-order scenario');[letters[0],letters[j]]=[letters[j],letters[0]];}
  await build(page,letters.join(''));return {kind:'build',selected:letters.join('')};
 }
 throw Error('No UI solver for this first-stop question: '+q.type);
}
async function geometry(page){return page.evaluate(()=>{
 const host=document.querySelector('#session-screen .session'),card=document.querySelector('#session-screen .laria-task-card');
 const rect=e=>e?.getBoundingClientRect().toJSON();
 return {scrollWidth:document.documentElement.scrollWidth,width:innerWidth,card:rect(card),
  prompt:rect(card?.querySelector('.question')),scrollTop:host.scrollTop,
  controls:[...document.querySelectorAll('#session-screen button')].filter(b=>b.getClientRects().length).map(b=>({label:b.innerText,...rect(b)})),
  foxes:card.querySelectorAll('.task-fox-companion').length,avatar:card.querySelector('.task-fox-companion')?.dataset.avatar};
 });}
async function verify(page,label){
 const g=await geometry(page);assert(g.scrollWidth<=g.width+1,label+' horizontal overflow');
 assert(g.card.left>=-1&&g.card.right<=g.width+1,label+' card outside viewport');
 assert(g.controls.every(r=>r.width>=43.9&&r.height>=43.9),label+' touch target smaller than 44px: '+JSON.stringify(g.controls));
 assert.equal(g.foxes,1,label+' duplicate fox');assert.equal(g.avatar,'girl',label+' wrong identity');
 return g;
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port+'/laer-litt-mer/?app=laria';
 for(const [engine,name] of [[chromium,'chromium'],[webkit,'webkit']]){
 const browser=await engine.launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});
 try{
 for(const [width,height] of matrix)for(const subject of ['norwegian','math','english','geography']){
  const label=name+'-'+width+'x'+height+'-'+subject,entry={label,width,height,subject,engine:name,errors:[],stages:[]};report.push(entry);
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:[320,390,430,844].includes(width),reducedMotion:'reduce',serviceWorkers:'block'});
  await context.addInitScript(s=>{if(!localStorage.getItem('laerlittmer-v2'))localStorage.setItem('laerlittmer-v2',JSON.stringify(s))},seed);
  const page=await context.newPage();page.setDefaultTimeout(12000);page.on('pageerror',e=>entry.errors.push(String(e)));
  await page.route(/https:\/\/(raw\.githubusercontent\.com|api\.worldbank\.org)\//,r=>r.abort());
  const capture=async stage=>{
   const state=await page.evaluate(()=>({text:document.querySelector('.screen.active')?.innerText,answered:currentAnswered,correct:sessionCorrect,logs:state.answerLog.length,sessions:state.sessionLog.length}));
   entry.stages.push({stage,...state});
   if([390,1180].includes(width)||(width===320&&subject==='math'))await page.screenshot({path:path.join(out,label+'-'+stage+'.png'),animations:'disabled'});
  };
  try{
   await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.locator('.bc14-subject[data-camp="subject-'+subject+'"]').click();
   await page.locator('.screen.active .locked-journey-map[data-journey-subject="'+subject+'"] .locked-journey-hotspot').first().click();
   await page.locator('.locked-journey-overlay:not([hidden]) .mission-primary').click();
   await page.locator('#session-screen.active .laria-task-card').waitFor();
   await page.waitForFunction(()=>!!document.querySelector('#session-screen.active .task-fox-companion .laria-fox-wardrobe-placed'));
   const initial=await page.evaluate(()=>({keys:sessionQuestions.map(questionIdentity),questions:sessionQuestions,scope:sessionScope}));entry.initial=initial;
   const before=await verify(page,label);await capture('question');
   const attempted=await answer(page,true);await capture('retry');
   assert.equal(await page.locator('#next-question').isVisible(),false,label+' advances on error');
   assert.equal(await page.evaluate(()=>state.answerLog.length),1,label+' first error not assessed once');
   if(attempted.kind==='choice'){
    const after=await geometry(page);
    assert(Math.abs(before.prompt.y+before.scrollTop-after.prompt.y-after.scrollTop)<2,label+' prompt jumped on feedback');
    await page.locator('#session-screen .answer').evaluateAll((bs,value)=>bs.find(b=>b.dataset.answer===value).dispatchEvent(new MouseEvent('click',{bubbles:true})),attempted.selected);
   }else await page.locator('#check-build').click();
   assert.equal(await page.evaluate(()=>state.answerLog.length),1,label+' duplicate wrong tap was counted');
   // A real reload, then the existing Home continue button restores the saved round.
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('.bc12-journey').click();
   await page.locator('#session-screen.active .laria-task-card').waitFor();
   assert.equal(await page.locator('#next-question').isVisible(),false,label+' reload skipped correction');
   assert.match(await page.locator('#feedback-copy').innerText(),/./,label+' retry help disappeared');
   if(attempted.kind==='choice'){
    const disabled=await page.locator('#session-screen .answer').evaluateAll((bs,v)=>bs.find(b=>b.dataset.answer===v)?.disabled,attempted.selected);
    assert.equal(disabled,true,label+' rejected answer became active after reload');
   }
   await answer(page);await capture('corrected');
   const corrected=await page.evaluate(()=>({answered:currentAnswered,logs:state.answerLog.length,score:sessionCorrect,keys:sessionQuestions.map(questionIdentity)}));
   assert.equal(corrected.logs,1,label+' correction counted twice');assert.equal(corrected.score,0,label+' correction inflated first-try score');
   assert.equal(corrected.answered.corrected,true);assert.deepEqual(corrected.keys,initial.keys,label+' question identity changed');
   await verify(page,label);
   // Queue two clicks on the SAME old Next button. Only one question may advance.
   await page.locator('#next-question').evaluate(b=>{b.click();b.click()});
   assert.equal(await page.evaluate(()=>qIndex),1,label+' double Next skipped a task');
   while(await page.locator('#session-screen.active').count()){
    await answer(page);await page.locator('#next-question').click();
   }
   await page.locator('#complete-screen.active').waitFor();await capture('complete');
   const completed=await page.evaluate(()=>({result:state.sessionLog.at(-1),logs:state.answerLog.length,journey:JSON.stringify(state.journey),mastery:JSON.stringify([state.mastery,state.skillMastery,state.masteryEvidence,state.skillEvidence]),collection:JSON.stringify(state.collectibles)}));
   assert.equal(completed.result.correct,initial.questions.length-1,label+' result disagrees with first attempts');
   const logCount=await page.evaluate(()=>{finishSession();finishSession();return state.sessionLog.length});
   assert.equal(logCount,1,label+' repeated completion awarded another result');
   await page.locator('#complete-repeat').click();
   while(await page.locator('#session-screen.active').count()){
    await answer(page);assert.equal(await page.evaluate(()=>currentAnswered.correct),true,label+' replay retained a previous error');
    await page.locator('#next-question').click();
   }
   await page.locator('#complete-screen.active').waitFor();await capture('replayed');
   const repeated=await page.evaluate(()=>({result:state.sessionLog.at(-1),logs:state.answerLog,journey:JSON.stringify(state.journey),mastery:JSON.stringify([state.mastery,state.skillMastery,state.masteryEvidence,state.skillEvidence]),collection:JSON.stringify(state.collectibles)}));
   assert.equal(repeated.result.correct,initial.questions.length,label+' perfect replay was not recognized');
   assert.equal(repeated.result.countsTowardGoal,false);assert.equal(repeated.journey,completed.journey);assert.equal(repeated.mastery,completed.mastery);assert.equal(repeated.collection,completed.collection);
   assert(repeated.logs.slice(completed.logs).every(a=>a.countsForLearning===false),label+' replay changed learning evidence');
   await page.locator('#complete-home').click();
   await page.locator('.screen.active .locked-journey-map[data-journey-subject="'+subject+'"]').waitFor();
   assert.equal(await page.evaluate(()=>state.profile.avatar),'girl');
   await page.reload({waitUntil:'domcontentloaded'});
   assert.equal(await page.evaluate(()=>state.sessionLog.length),2,label+' completion not saved');
   assert.equal(await page.evaluate(()=>state.activeSession),null,label+' completed round was resurrected');
   assert.deepEqual(entry.errors,[],label+' JS errors');entry.passed=true;
   console.log('PASS '+label);
  }catch(e){entry.failure=e.stack;await page.screenshot({path:path.join(out,label+'-FAILED.png'),animations:'disabled'}).catch(()=>{});console.error('FAIL '+label+' '+e.message);}
  finally{await context.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));}
 }
 }finally{await browser.close();}
 }
 const failures=report.filter(r=>!r.passed);console.log(JSON.stringify({total:report.length,passed:report.length-failures.length,failures:failures.map(r=>({label:r.label,failure:r.failure}))},null,2));
 if(failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
