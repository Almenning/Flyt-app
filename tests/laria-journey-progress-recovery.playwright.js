'use strict';
/* Real journey progress + unfinished session recovery. Runs against approved assets. */
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const seed={
 version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Reiseprogresjon',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},
 preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null
};
const worlds={norwegian:'Bokskogen',math:'Tallvika',english:'Ordlandsbyen',geography:'Nordlysleiren'};

async function answerCurrent(page){
  const q=await page.evaluate(()=>{const x=sessionQuestions[qIndex];return x?{type:x.type,answer:x.answer}:null});
  assert.ok(q,'missing current question');
  if(q.type==='learning-choice'){
    await page.locator('.answer').evaluateAll((els,answer)=>{
      const el=els.find(x=>x.dataset.answer===String(answer));if(!el)throw new Error('correct answer button missing: '+answer);el.click();
    },q.answer);
  }else if(q.type==='build-word'){
    await page.evaluate(()=>{
      const q=sessionQuestions[qIndex],used=new Set();
      q.answer.split('').forEach((ch,slotIdx)=>{
        const idx=q.letters.findIndex((x,i)=>x.l===ch&&!used.has(i));
        if(idx<0)throw new Error('letter missing: '+ch);
        used.add(idx);
        document.querySelector(`.letter-slot[data-slot="${slotIdx}"]`).click();
        document.querySelector(`.letter-tile[data-idx="${idx}"]`).click();
      });
      document.querySelector('#check-build').click();
    });
  }else if(q.type==='sentence-order'){
    await page.evaluate(()=>{
      const q=sessionQuestions[qIndex],used=new Set();
      for(const word of q.answer.split(' ')){
        const idx=q.words.findIndex((x,i)=>x===word&&!used.has(i));
        if(idx<0)throw new Error('word missing: '+word);
        used.add(idx);document.querySelector(`.word-tile[data-idx="${idx}"]`).click();
      }
      document.querySelector('#check-sentence').click();
    });
  }else if(q.type==='number-input'){
    if(await page.locator('.young-math-option').count()){
      await page.locator('.young-math-option').evaluateAll((els,answer)=>{
        const chosen=els.find(x=>x.dataset.answer===String(answer));
        if(!chosen)throw new Error('missing correct tap choice: '+answer);
        chosen.click();
      },q.answer);
    }else{
      await page.locator('#math-input').fill(String(q.answer));
      await page.locator('#check-number').click();
    }
  }else if(q.type==='sequence-order'){
    await page.evaluate(()=>{
      const q=sessionQuestions[qIndex],used=new Set();
      for(const value of String(q.answer).split('|')){
        const idx=q.items.findIndex((x,i)=>String(x)===String(value)&&!used.has(i));
        if(idx<0)throw new Error('sequence item missing: '+value);
        used.add(idx);document.querySelector(`.sequence-tile[data-idx="${idx}"]`).click();
      }
      document.querySelector('#check-sequence').click();
    });
  }else if(q.type==='map'){
    await page.evaluate(()=>answerMap(sessionQuestions[qIndex].answer));
  }else{
    await page.evaluate(()=>answerText(sessionQuestions[qIndex].answer));
  }
  await page.locator('#next-question').waitFor({state:'visible'});
}

async function finishSession(page){
  const count=await page.evaluate(()=>sessionQuestions.length);
  assert.ok(count>0,'session must contain at least one question');
  for(let i=0;i<count;i++){
    await answerCurrent(page);
    await page.locator('#next-question').click();
  }
  await page.locator('#complete-screen.active').waitFor();
}


async function progress(page,subject){
 return await page.evaluate(s=>{
  const value=s==='geography'?geoJourneyProgress(2):journeyProgress(s,2);
  return {done:value.done,total:value.total,sessionCount:state.sessionLog.length,answerCount:state.answerLog.length,goal:dailyGoal().done};
 },subject);
}
async function activeSnapshot(page){
 return await page.evaluate(()=>({
  scope:state.activeSession?.scope?.type,
  subject:state.activeSession?.scope?.subject,
  node:state.activeSession?.scope?.journeyNode,
  ids:state.activeSession?.questions?.map(questionIdentity)||[],
  index:state.activeSession?.qIndex,
  correct:state.activeSession?.correct,
  answered:!!state.activeSession?.answered,
  logCount:state.sessionLog.length
 }));
}
// Exercise the reachable return control. Tall journey artwork can leave the
// original back hotspot offscreen, while the fixed iPad return stays visible.
async function returnFromJourney(page,root,label,subject){
 const native=root.locator('.locked-journey-back');
 const floating=root.locator('.locked-journey-floating-back');
 const useFloating=await floating.isVisible();
 await (useFloating?floating:native).click();
 try{await page.locator('#home-screen.active').waitFor({timeout:16000});}
 catch(error){
  const evidence=await page.evaluate(()=>{
   const box=selector=>{
    const node=document.querySelector(selector),r=node?.getBoundingClientRect();
    return {exists:!!node,hidden:node?.hidden,rect:r&&{x:r.x,y:r.y,w:r.width,h:r.height},
     onclick:typeof node?.onclick,display:node&&getComputedStyle(node).display};
   };
   return {screen:document.querySelector('.screen.active')?.id,
    activeScreens:[...document.querySelectorAll('.screen.active')].map(n=>n.id),
    returnView:window.LARIA_BASECAMP_RETURN_VIEW?.(),
    native:box('.locked-journey-back'),
    floating:box('.locked-journey-floating-back')};
  });
  throw new Error(label+' '+subject+' journey back failed (clicked '+(useFloating?'floating':'native')+'): '+
    JSON.stringify(evidence)+'; '+error.message);
 }
}

async function run(engine,label,viewport){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({
   viewport,isMobile:viewport.width<600,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(data=>{
   if(!localStorage.getItem('laerlittmer-v2'))localStorage.setItem('laerlittmer-v2',JSON.stringify(data));
  },seed);
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
  await page.goto(url+'&progress-recovery='+label,{waitUntil:'domcontentloaded'});
  await page.locator('.bc14-subject[data-camp="subject-norwegian"]').waitFor({timeout:18000});
  let index=0;
  for(const [subject,world] of Object.entries(worlds)){
   const before=await progress(page,subject);
   const screen=subject==='geography'?'geography':'subject';
   await page.locator('.bc14-subject[data-camp="subject-'+subject+'"]').click();
   const isTallvika=subject==='math';
   const base=isTallvika?'#subject-screen.active #tallvika-world':
     '#'+screen+'-screen.active .locked-journey-map[data-journey-subject="'+subject+'"]';
   const root=page.locator(base);
   await root.waitFor({timeout:18000});
   if(!isTallvika)await root.locator('.locked-journey-hotspot.state-current').first().click();
   const recommended=await page.evaluate(s=>{
    const node=s==='geography'?geoJourneyRecommendedNode(2):journeyRecommendedNode(s,2);
    return node?.id||null;
   },subject);
   assert.ok(recommended,label+' missing recommended node for '+subject);
   if(isTallvika){
     const advance=root.locator('[data-tv="next"]');
     await advance.waitFor({state:'visible',timeout:10000});
     assert.equal(await advance.isEnabled(),true,label+' Math continue must remain available');
     await advance.click();
   }else{
     const mission=page.locator('.locked-journey-overlay:not([hidden]) button[data-locked-node="'+recommended+'"]:not([disabled])');
     await mission.waitFor({timeout:10000});
     await mission.click();
   }
   await page.locator('#session-screen.active .laria-task-card').waitFor({timeout:16000});
   assert.equal((await page.locator('.task-world-chip').innerText()).trim(),world,label+' wrong world '+subject);
   const started=await activeSnapshot(page);
   assert.equal(started.scope,subject==='geography'?'geo-journey':'journey');
   assert.equal(started.subject,subject);
   assert.equal(started.node,recommended);
   assert.ok(started.ids.length>=3,label+' missing task questions for '+subject);
   assert.equal(started.logCount,before.sessionCount);
   await answerCurrent(page);
   const interruptedAfterAnswer=(index++%2===1);
   if(!interruptedAfterAnswer)await page.locator('#next-question').click();
   const snapshot=await activeSnapshot(page);
   assert.equal(snapshot.correct,1,label+' first solved question lost');
   assert.equal(snapshot.index,interruptedAfterAnswer?0:1);
   assert.equal(snapshot.answered,interruptedAfterAnswer);
   await page.locator('#close-session').click();
   await page.locator(base).waitFor({timeout:16000});
   const left=await activeSnapshot(page);
   assert.deepEqual(left,snapshot,label+' closing session changed saved progress for '+subject);
   const mid=await progress(page,subject);
   assert.equal(mid.sessionCount,before.sessionCount,label+' incomplete mission counted as a finished activity for '+subject);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('.bc12-journey:visible').waitFor({timeout:20000});
   const recovered=await activeSnapshot(page);
   assert.deepEqual(recovered,snapshot,label+' saved quiz changed on refresh for '+subject);
   await page.locator('.bc12-journey').click();
   await page.locator('#session-screen.active .laria-task-card').waitFor({timeout:16000});
   const resumed=await page.evaluate(()=>({
    node:sessionScope?.journeyNode,
    index:qIndex,correct:sessionCorrect,
    answered:!!currentAnswered,
    ids:sessionQuestions.map(questionIdentity)
   }));
   assert.deepEqual(resumed,{
    node:snapshot.node,index:snapshot.index,correct:snapshot.correct,
    answered:snapshot.answered,ids:snapshot.ids
   },label+' user did not resume the same question for '+subject);
   if(interruptedAfterAnswer){
    await page.locator('#next-question:visible').click();
   }
   const remaining=await page.evaluate(()=>sessionQuestions.length-qIndex);
   for(let i=0;i<remaining;i++){
    await answerCurrent(page);
    await page.locator('#next-question:visible').click();
   }
   await page.locator('#complete-screen.active').waitFor({timeout:16000});
   const completeLabel=(await page.locator('#complete-home').innerText()).trim();
   assert.match(completeLabel,isTallvika?/Tallvika/:/Tilbake til reisekartet/,
     label+' completion action points elsewhere for '+subject);
   const finished=await page.evaluate(s=>{
    const grade=2,node=lastCompletedScope?.journeyNode;
    const key=journeyNodeKey(s,grade,node),rec=state.journey.nodes[key];
    const last=state.sessionLog.at(-1);
    return {active:state.activeSession,attempts:rec?.attempts||0,
      last:{correct:last?.correct,total:last?.total,practiceOnly:last?.practiceOnly,countsTowardGoal:last?.countsTowardGoal},
      count:state.sessionLog.length,goal:dailyGoal().done};
   },subject);
   assert.equal(finished.active,null,label+' completed session not cleared');
   assert.equal(finished.count,before.sessionCount+1,label+' duplicate or lost completed session');
   assert.equal(finished.attempts,1,label+' original node completion not recorded');
   assert.equal(finished.last.correct,finished.last.total,label+' all-correct quiz scored incorrectly');
   assert.equal(finished.last.practiceOnly,false,label+' fresh mission incorrectly marked as repeat');
   assert.equal(finished.last.countsTowardGoal,true,label+' fresh mission did not count toward daily goal');
   assert.equal(finished.goal,1,label+' daily goal not updated after completion');
   await page.locator('#complete-home').click();
   await page.locator(base).waitFor({timeout:18000});
   const after=await progress(page,subject);
   assert.ok(after.done>before.done,label+' '+world+' progress failed to advance: '+JSON.stringify({before,after}));
   assert.equal(after.sessionCount,before.sessionCount+1);
   if(isTallvika){
     const nextTitle=await page.evaluate(()=>journeyRecommendedNode('math',2)?.title||'');
     assert.ok(nextTitle,label+' next math mission missing after completion');
     assert.match((await root.locator('.tv-next').innerText()),new RegExp(nextTitle),
       label+' Tallvika did not show the newly unlocked next mission');
     await root.locator('[data-tv="back"]').click();
     await page.locator('#home-screen.active').waitFor({timeout:16000});
   }else{
     assert.match((await root.locator('.locked-journey-live-progress').innerText()),new RegExp('\\b'+after.done+'\\s*/\\s*'+after.total+'\\b'));
     await returnFromJourney(page,root,label,subject);
   }
   const nextPaintedPlace=await page.evaluate(s=>{
    const p=s==='geography'?geoJourneyProgress(2):journeyProgress(s,2);
    const next=s==='geography'?geoJourneyRecommendedNode(2):journeyRecommendedNode(s,2);
    const reader=s==='geography'?geoJourneyNodeState:journeyNodeState;
    const journey=window.LARIA_LOCKED_JOURNEYS.build(s,p.model,reader,next.id);
    return journey.places.find(place=>place.nodes.some(n=>n.id===next.id))?.title;
   },subject);
   assert.ok(nextPaintedPlace,label+' no painted next stop for '+subject);
   assert.equal((await page.locator('.bc12-journey [data-camp-next]').innerText()).trim(),nextPaintedPlace,
    label+' Home sign does not match actual painted next journey stop for '+subject);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('.bc14-subject[data-camp="subject-'+subject+'"]').waitFor({timeout:18000});
   const persisted=await progress(page,subject);
   assert.deepEqual(persisted,after,label+' '+world+' progress not durable after refresh');
   console.log('[progress recovery]',label,subject,JSON.stringify({done:after.done,total:after.total,completed:finished.count}));
  }
  assert.deepEqual(errors,[],label+' JavaScript runtime exceptions');
  await context.close();
 }finally{await browser.close()}
}
(async()=>{
 for(const [label,engine,viewport] of [
  ['chromium-iphone',chromium,{width:390,height:844}],
  ['webkit-ipad',webkit,{width:820,height:1180}]
 ])await run(engine,label,viewport);
})().catch(e=>{console.error(e);process.exitCode=1});
