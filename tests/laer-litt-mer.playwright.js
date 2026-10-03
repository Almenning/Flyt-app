'use strict';
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.resolve(__dirname,'..','laer-litt-mer');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.svg':'image/svg+xml'};

function startServer(){
  return new Promise((resolve,reject)=>{
    const server=http.createServer((req,res)=>{
      const url=new URL(req.url,'http://127.0.0.1');
      let rel=decodeURIComponent(url.pathname).replace(/^\/+/, '')||'index.html';
      const file=path.resolve(root,rel);
      if(!file.startsWith(root)){res.writeHead(403);res.end('forbidden');return}
      fs.readFile(file,(err,data)=>{
        if(err){res.writeHead(404);res.end('not found');return}
        res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
        res.setHeader('Cache-Control','no-store');
        res.end(data);
      });
    });
    server.once('error',reject);
    server.listen(0,'127.0.0.1',()=>resolve({server,url:`http://127.0.0.1:${server.address().port}/`}));
  });
}

async function onboard(page,grade){
  await page.goto(page.__base,{waitUntil:'domcontentloaded'});
  await page.locator('#onboarding.show').waitFor();
  await page.locator('.onboard-step.active .onboard-next').click();
  await page.locator('.onboard-step.active .onboard-next').click();
  await page.locator(`.grade-btn[data-grade="${grade}"]`).click();
  await page.locator('#finish-onboarding').click();
  await page.locator('#home-screen.active').waitFor();
}

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
    await page.locator('#math-input').fill(String(q.answer));
    await page.locator('#check-number').click();
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
  for(let i=0;i<5;i++){
    await answerCurrent(page);
    await page.locator('#next-question').click();
  }
  await page.locator('#complete-screen.active').waitFor();
}

(async()=>{
  const {server,url}=await startServer();
  const browser=await chromium.launch({headless:true});
  const errors=[];
  try{
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const page=await context.newPage();
    page.__base=url;
    page.on('pageerror',e=>errors.push('pageerror: '+e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
    await page.route('https://raw.githubusercontent.com/**',r=>r.fulfill({status:200,contentType:'application/json',body:'{"type":"FeatureCollection","features":[]}'}));
    await page.route('https://api.worldbank.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[{},[]]'}));

    await onboard(page,2);

    // Home should always surface one obvious recommended next action.
    assert.equal(await page.locator('#home-continue-wrap').isVisible(),true);
    assert.match(await page.locator('#home-continue-eyebrow').textContent(),/Anbefalt nå|Fortsett der du slapp/);

    // Daily goal is session-based: answers alone do not complete it, one finished session does.
    await page.evaluate(()=>{
      state.answerLog.push({at:Date.now(),subject:'math',skill:'test-effort',type:'learning-choice',questionKey:'effort-test-1',correct:false});
      renderAll();
    });
    assert.equal((await page.locator('#daily-goal-count').textContent()).trim(),'0 av 1');
    await page.evaluate(()=>{
      state.sessionLog.push({endedAt:Date.now(),correct:0,total:5,strengthened:0,area:'Test'});
      renderAll();
    });
    assert.equal((await page.locator('#daily-goal-count').textContent()).trim(),'1 av 1');
    await page.evaluate(()=>{
      state.answerLog=state.answerLog.filter(a=>a.questionKey!=='effort-test-1');
      state.sessionLog=state.sessionLog.filter(s=>s.area!=='Test');
      saveState();renderAll();
    });

    // Word builder must support free placement, return-to-bank, editing and last-letter-first input.
    await page.evaluate(()=>{
      sessionScope={type:'subject',subject:'norwegian',module:'spelling',label:'Norsk · Ord og staving',grade:2};
      sessionQuestions=[makeBuildWord('MUS','🐭','letter-sound')];
      qIndex=0;sessionCorrect=0;sessionStrengthened=new Set();currentAnswered=null;
      showScreen('session');renderQuestion();
    });
    const sTile=page.locator('.letter-tile').filter({hasText:'S'});
    const mTile=page.locator('.letter-tile').filter({hasText:'M'});
    const uTile=page.locator('.letter-tile').filter({hasText:'U'});

    // Last letter first: the third slot works before either of the first two.
    await page.locator('.letter-slot').nth(2).click();
    await sTile.click();
    assert.equal((await page.locator('.letter-slot').nth(2).textContent()).trim(),'S');
    assert.equal((await page.locator('.letter-slot').nth(0).textContent()).trim(),'');
    assert.equal((await page.locator('.letter-slot').nth(1).textContent()).trim(),'');

    // A placed letter can be dragged all the way back out of the word and into the bank.
    await page.locator('.letter-slot').nth(2).dragTo(page.locator('.letter-bank'));
    assert.equal((await page.locator('.letter-slot').nth(2).textContent()).trim(),'');
    assert.equal(await sTile.evaluate(el=>!el.classList.contains('used')),true);

    // Tap removal also returns the letter to the bank.
    await sTile.click();
    await page.locator('.letter-slot').nth(2).click();
    await page.locator('.letter-slot').nth(2).click();
    assert.equal((await page.locator('.letter-slot').nth(2).textContent()).trim(),'');
    assert.equal(await sTile.evaluate(el=>!el.classList.contains('used')),true);

    // Both interaction orders work: letter -> slot and slot -> letter.
    await sTile.click();
    await page.locator('.letter-slot').nth(2).click();
    await page.locator('.letter-slot').nth(0).click();
    await mTile.click();
    await uTile.click();
    await page.locator('.letter-slot').nth(1).click();
    assert.equal(await page.locator('.letter-slot').allTextContents().then(x=>x.map(v=>v.trim()).join('')),'MUS');

    // Build a wrong order, check it, then edit the same word instead of being locked.
    await page.locator('.letter-slot').nth(1).click();
    await page.locator('.letter-slot').nth(2).click();
    await sTile.click();
    await page.locator('.letter-slot').nth(1).click();
    await uTile.click();
    await page.locator('.letter-slot').nth(2).click();
    assert.equal(await page.locator('.letter-slot').allTextContents().then(x=>x.map(v=>v.trim()).join('')),'MSU');
    await page.locator('#check-build').click();
    assert.equal(await page.locator('#next-question').isVisible(),false);
    assert.equal(await page.locator('.letter-slot.wrong-letter').count(),2);

    // Correct the word after the failed attempt.
    await page.locator('.letter-slot').nth(1).click();
    await page.locator('.letter-slot').nth(2).click();
    await uTile.click();
    await page.locator('.letter-slot').nth(1).click();
    await sTile.click();
    await page.locator('.letter-slot').nth(2).click();
    assert.equal(await page.locator('.letter-slot').allTextContents().then(x=>x.map(v=>v.trim()).join('')),'MUS');
    assert.equal(await page.locator('#check-build').isEnabled(),true);
    await page.locator('#check-build').click();
    await page.locator('#next-question').waitFor({state:'visible'});
    await page.evaluate(()=>{state.activeSession=null;currentAnswered=null;setTab('home')});

    // Solved-question cooldown: an exact task solved now must not reappear five minutes later.
    await page.evaluate(()=>{
      state.profile.grade=2;
      const q=choiceQuestion('norwegian','reading-comprehension','Hva heter katten?','Milo',['Milo','Leo','Luna'],{passage:'Katten heter Milo.'});
      state.answerLog.push({at:Date.now()-5*60*1000,subject:q.subject,skill:q.skill,type:q.type,questionKey:questionIdentity(q),correct:true});
      const next=buildLearningQuestions('norwegian','reading');
      if(next.some(x=>questionIdentity(x)===questionIdentity(q)))throw new Error('Solved learning question repeated inside cooldown');
      const g=makeQuestion('no','flag',gradeScopeIds());
      state.answerLog.push({at:Date.now()-5*60*1000,country:g.k,type:g.type,questionKey:questionIdentity(g),correct:true});
      if(!questionOnCooldown(g))throw new Error('Geography cooldown not active after correct answer');
    });

    // Explicit manual repeat must override cooldown without affecting learning progress.
    const repeatStart=await page.evaluate(()=>{
      state.profile.grade=2;
      const types=questionTypesForCountry('ru',true);
      for(const type of types){
        const q=makeQuestion('ru',type,gradeScopeIds());
        state.answerLog.push({at:Date.now(),country:'ru',type,questionKey:questionIdentity(q),correct:true,countsForLearning:true});
      }
      const goalBefore=dailyGoal().done;
      startSession('ru');
      return {
        active:activeScreenName(),
        count:sessionQuestions.length,
        practiceOnly:!!sessionScope.practiceOnly,
        allRepeat:sessionQuestions.every(q=>q.practiceRepeat),
        goalBefore
      };
    });
    assert.equal(repeatStart.active,'session');
    assert.ok(repeatStart.count>0,'Russia repeat should still contain questions');
    assert.equal(repeatStart.practiceOnly,true);
    assert.equal(repeatStart.allRepeat,true);

    const repeatAnswer=await page.evaluate(()=>{
      const q=sessionQuestions[0],key=masteryKey(q.k,q.type),before=mastery(key);
      if(q.type==='map')answerMap(q.answer);else answerText(q.answer);
      return {before,after:mastery(key),logged:state.answerLog.at(-1)};
    });
    assert.equal(repeatAnswer.after,repeatAnswer.before,'practice repeat must not change mastery');
    assert.equal(repeatAnswer.logged.countsForLearning,false);

    await page.evaluate(()=>finishSession());
    await page.locator('#complete-screen.active').waitFor();
    assert.equal(await page.evaluate(()=>state.sessionLog.at(-1).countsTowardGoal),false);
    assert.equal(await page.evaluate(()=>dailyGoal().done),repeatStart.goalBefore,'practice repeat must not complete daily goal');
    assert.equal(await page.locator('#complete-repeat').isVisible(),true);

    const exactRepeat=await page.evaluate(()=>{
      const expected=lastCompletedQuestions.map(questionIdentity);
      document.getElementById('complete-repeat').click();
      return {
        practiceOnly:!!sessionScope.practiceOnly,
        allRepeat:sessionQuestions.every(q=>q.practiceRepeat),
        same:JSON.stringify(expected)===JSON.stringify(sessionQuestions.map(questionIdentity))
      };
    });
    assert.equal(exactRepeat.practiceOnly,true);
    assert.equal(exactRepeat.allRepeat,true);
    assert.equal(exactRepeat.same,true,'same-test button should preserve exact questions');
    await page.evaluate(()=>{state.activeSession=null;sessionQuestions=[];currentAnswered=null;saveState();setTab('home')});

    assert.equal(await page.locator('.home-subject').count(),4);
    assert.equal(await page.locator('#bottom-nav button').count(),2);
    assert.equal(await page.locator('#learn-screen').count(),0);
    assert.match(await page.locator('.onboard-step[data-step="0"] p').textContent(),/norsk, matte, engelsk og geografi/i);

    // Norsk: a complete real child flow, including game-like question types.
    await page.locator('#open-norwegian').click();
    await page.locator('#subject-screen.active').waitFor();
    assert.equal(await page.locator('#subject-title').textContent(),'Norsk');
    const norwegianModules=await page.locator('#subject-modules .subject-module strong').allTextContents();
    assert.ok(norwegianModules.includes('Lesetrening'));
    assert.ok(norwegianModules.includes('Ord og staving'));
    await page.locator('#subject-modules .subject-module').filter({hasText:'Lesetrening'}).click();
    await finishSession(page);
    assert.match(await page.locator('#complete-area').textContent(),/Norsk/);
    await page.locator('#complete-home').click();
    await page.locator('#subject-screen.active').waitFor();
    await page.locator('#subject-back').click();
    await page.locator('#home-screen.active').waitFor();
    assert.equal(await page.locator('#home-continue-wrap').isVisible(),true);

    // Matte: second grade should stay simple, but interaction should not be only multiple choice.
    const mathVariety=await page.evaluate(()=>mathPool(2,'numbers').map(q=>q.type));
    assert.ok(mathVariety.includes('number-input'),'grade 2 math should include typed answers');
    assert.ok(mathVariety.includes('sequence-order'),'grade 2 math should include ordering');
    await page.locator('#open-math').click();
    const mathModules=await page.locator('#subject-modules .subject-module strong').allTextContents();
    assert.deepEqual(mathModules,['Tall og regning']);
    // Brøklab is an open experiment space: grade recommends a start, but every variant and level stays available.
    assert.equal(await page.locator('#math-lab-entry').isVisible(),true);
    const labBefore=await page.evaluate(()=>({goal:dailyGoal().done,answers:subjectAnswered('math')}));
    await page.locator('#open-fraction-lab').click();
    await page.locator('#fraction-lab-screen.active').waitFor();
    assert.equal((await page.locator('.fraction-lab-head-copy h1').textContent()).trim(),'Brøklab');
    assert.equal(await page.locator('[data-lab-variant]').count(),6);
    assert.equal(await page.locator('[data-lab-level]').count(),4);
    assert.equal(await page.locator('[data-lab-level="0"]').isVisible(),true);
    assert.equal(await page.locator('[data-lab-level="3"]').isVisible(),true);
    assert.equal(await page.locator('.lab-fraction-row').count(),9);
    assert.equal(await page.locator('.lab-circle-source').count(),9);
    assert.match(await page.locator('.lab-mission').innerText(),/Finn en halv/i);
    assert.match(await page.locator('.lab-meaning-card').innerText(),/1\/2/);
    assert.match(await page.locator('.lab-meaning-card').innerText(),/0,5/);
    assert.match(await page.locator('.lab-meaning-card').innerText(),/50 %/);

    // Tapping the board explains the selected fraction without silently adding it to the workbench.
    const beforeInspect=await page.locator('.lab-workpiece').count();
    await page.locator('.lab-fraction-row[data-parts="4"] [data-denom="4"]').first().click();
    assert.equal(await page.locator('.lab-workpiece').count(),beforeInspect);
    assert.match(await page.locator('.lab-meaning-card').innerText(),/1\/4/);
    assert.match(await page.locator('.lab-meaning-card').innerText(),/0,25/);
    assert.match(await page.locator('.lab-meaning-card').innerText(),/25 %/);
    await page.locator('.lab-fraction-row[data-parts="2"] [data-denom="2"]').first().click();

    // Portrait mobile must never require horizontal page scrolling. The active manipulative gets the full phone width.
    const fractionPortraitFit=await page.evaluate(()=>{
      const screen=document.querySelector('#fraction-lab-screen');
      const board=document.querySelector('.lab-board');
      const pages=[...document.querySelectorAll('.lab-board-page')].filter(el=>getComputedStyle(el).display!=='none');
      const sr=screen.getBoundingClientRect(),br=board.getBoundingClientRect();
      return {viewport:window.innerWidth,documentWidth:document.documentElement.scrollWidth,screenLeft:sr.left,screenRight:sr.right,boardLeft:br.left,boardRight:br.right,visibleBoardPages:pages.length};
    });
    assert.ok(fractionPortraitFit.documentWidth<=fractionPortraitFit.viewport+1,'Brøklab creates horizontal page overflow in portrait: '+JSON.stringify(fractionPortraitFit));
    assert.ok(fractionPortraitFit.screenLeft>=-1&&fractionPortraitFit.screenRight<=fractionPortraitFit.viewport+1,'Brøklab screen exceeds portrait viewport: '+JSON.stringify(fractionPortraitFit));
    assert.ok(fractionPortraitFit.boardLeft>=fractionPortraitFit.screenLeft-1&&fractionPortraitFit.boardRight<=fractionPortraitFit.screenRight+1,'fraction board exceeds its screen: '+JSON.stringify(fractionPortraitFit));
    assert.equal(fractionPortraitFit.visibleBoardPages,1,'portrait should show one full-width manipulative board at a time');

    // Young child can solve the recommended discovery directly with a physical-style piece.
    await page.locator('.lab-piece-bank [data-denom="2"]').click();
    assert.match(await page.locator('.lab-total-value').innerText(),/1\/2/);
    await page.locator('#fraction-lab-check').click();
    assert.match(await page.locator('#fraction-lab-feedback').innerText(),/Du fant det/i);

    // Harder levels are not locked by grade.
    await page.locator('[data-lab-level="3"]').click();
    assert.match(await page.locator('.lab-mission').innerText(),/fem sjettedeler/i);
    await page.locator('[data-lab-variant="equivalent"]').click();
    await page.locator('[data-lab-level="1"]').click();
    assert.match(await page.locator('.lab-mission').innerText(),/Fire åttendedeler/i);

    // Comparison is its own experiment variant.
    await page.locator('[data-lab-variant="compare"]').click();
    await page.locator('[data-lab-level="0"]').click();
    await page.locator('.lab-piece-bank [data-denom="2"]').click();
    await page.locator('.lab-piece-bank [data-denom="4"]').click();
    await page.locator('[data-prediction=">"]').click();
    await page.locator('#fraction-lab-check').click();
    assert.match(await page.locator('#fraction-lab-feedback').innerText(),/Du fant det/i);

    // The lab makes fraction, decimal and percent equivalence visible all the time, including in free play.
    await page.locator('[data-lab-variant="wall"]').click();
    await page.locator('[data-lab-mode="free"]').click();
    assert.match(await page.locator('.lab-free-note').innerText(),/Brøk, desimal og prosent/i);
    await page.locator('.lab-piece-bank [data-denom="4"]').click();
    await page.locator('.lab-piece-bank [data-denom="4"]').click();
    assert.match(await page.locator('.lab-total-value').innerText(),/1\/2/);
    assert.match(await page.locator('.lab-total-value').innerText(),/0,5/);
    assert.match(await page.locator('.lab-total-value').innerText(),/50 %/);

    // Dedicated conversion experiments make the purpose concrete.
    await page.locator('[data-lab-mode="mission"]').click();
    await page.locator('[data-lab-variant="connections"]').click();
    assert.match(await page.locator('.lab-mission').innerText(),/Hva er 50 %/);
    await page.locator('.lab-piece-bank [data-denom="2"]').click();
    await page.locator('#fraction-lab-check').click();
    assert.match(await page.locator('#fraction-lab-feedback').innerText(),/1\/2 = 0,5 = 50 %/);
    const fractionTouchHeights=await page.locator('.lab-piece-bank .lab-loose-piece').evaluateAll(els=>els.map(e=>e.getBoundingClientRect().height));
    assert.ok(fractionTouchHeights.every(h=>h>=44),'small fraction touch target: '+fractionTouchHeights.join(','));

    await page.locator('#fraction-lab-back').click();
    await page.locator('#subject-screen.active').waitFor();
    const labAfter=await page.evaluate(()=>({goal:dailyGoal().done,answers:subjectAnswered('math')}));
    assert.deepEqual(labAfter,labBefore,'Brøklab exploration must not count as a completed test or graded answer');
    assert.equal(await page.locator('#subject-title').textContent(),'Matte');

    // Gangetabell-lab is also open across grades and teaches multiplication visually, not as a locked drill.
    assert.equal(await page.locator('#open-multiplication-lab').isVisible(),true);
    const multBefore=await page.evaluate(()=>({goal:dailyGoal().done,answers:subjectAnswered('math')}));
    await page.locator('#open-multiplication-lab').click();
    await page.locator('#multiplication-lab-screen.active').waitFor();
    assert.equal((await page.locator('.mult-lab-head-copy h1').textContent()).trim(),'Gangetabell-lab');
    const multPortraitFit=await page.evaluate(()=>{
      const screen=document.querySelector('#multiplication-lab-screen');
      const shell=document.querySelector('.mult-lab-shell');
      const sr=screen.getBoundingClientRect(),hr=shell.getBoundingClientRect();
      return {viewport:window.innerWidth,documentWidth:document.documentElement.scrollWidth,screenLeft:sr.left,screenRight:sr.right,shellLeft:hr.left,shellRight:hr.right};
    });
    assert.ok(multPortraitFit.documentWidth<=multPortraitFit.viewport+1,'Gangetabell-lab creates horizontal page overflow in portrait: '+JSON.stringify(multPortraitFit));
    assert.ok(multPortraitFit.screenLeft>=-1&&multPortraitFit.screenRight<=multPortraitFit.viewport+1,'Gangetabell-lab screen exceeds portrait viewport: '+JSON.stringify(multPortraitFit));
    assert.ok(multPortraitFit.shellLeft>=multPortraitFit.screenLeft-1&&multPortraitFit.shellRight<=multPortraitFit.screenRight+1,'Gangetabell-lab shell exceeds its screen: '+JSON.stringify(multPortraitFit));
    assert.equal(await page.locator('[data-mult-variant]').count(),6);
    assert.equal(await page.locator('[data-mult-level]').count(),4);
    assert.equal(await page.locator('[data-mult-level="3"]').isVisible(),true);
    assert.match(await page.locator('.mult-mission').innerText(),/Tre grupper med to/i);
    assert.match(await page.locator('.mult-equation').innerText(),/3 × 2 = 6/);
    assert.equal(await page.locator('.mult-group').count(),3);
    assert.equal(await page.locator('.mult-group .mult-dot').count(),6);

    await page.locator('[data-mult-answer="6"]').click();
    await page.locator('#mult-lab-check').click();
    assert.match(await page.locator('#mult-lab-feedback').innerText(),/Du fant det/i);

    // A young child can deliberately jump to the hardest level.
    await page.locator('[data-mult-level="3"]').click();
    assert.match(await page.locator('.mult-mission').innerText(),/Ni grupper med sju/i);
    assert.match(await page.locator('.mult-equation').innerText(),/9 × 7 = 63/);

    // Commutativity is shown visually as two rotated arrays with the same product.
    await page.locator('[data-mult-variant="swap"]').click();
    await page.locator('[data-mult-level="0"]').click();
    assert.match(await page.locator('.mult-mission').innerText(),/To veier til samme svar/i);
    assert.equal(await page.locator('.mult-swap-card').count(),2);
    await page.locator('[data-mult-answer="Ja"]').click();
    await page.locator('#mult-lab-check').click();
    assert.match(await page.locator('#mult-lab-feedback').innerText(),/Du fant det/i);

    // Pattern mode exposes the full 1-12 multiplication table.
    await page.locator('[data-mult-variant="patterns"]').click();
    assert.equal(await page.locator('.mult-table-cell').count(),169);
    assert.match(await page.locator('.mult-table-legend').innerText(),/5-gangen/);

    // Dedicated gangetabell mode behaves like a physical 1-12 board:
    // tap a cell, keep the table visible, highlight row/column and explain the multiplication.
    await page.locator('[data-mult-variant="table"]').click();
    assert.equal(await page.locator('.mult-table-cell').count(),169);
    assert.match(await page.locator('.mult-mission').innerText(),/Finn 2 × 3/i);
    await page.locator('[data-table-a="2"][data-table-b="3"]').click();
    assert.match(await page.locator('.mult-equation').innerText(),/2 × 3 = 6/);
    const tableInspector=await page.locator('.mult-table-inspector').innerText();
    assert.match(tableInspector,/3 × 2 = 6/);
    assert.match(tableInspector,/2 \+ 2 = 6/);
    assert.equal(await page.locator('.mult-table-cell.row-selected').count(),12);
    assert.equal(await page.locator('.mult-table-cell.col-selected').count(),12);
    assert.equal(await page.locator('.mult-table-cell.cell-selected').count(),1);
    await page.locator('#mult-lab-check').click();
    assert.match(await page.locator('#mult-lab-feedback').innerText(),/Du fant det/i);

    // In free play, a product such as 24 exposes all factor pairs available inside the 1-12 table.
    await page.locator('[data-mult-mode="free"]').click();
    await page.locator('[data-table-a="4"][data-table-b="6"]').click();
    assert.match(await page.locator('.mult-equation').innerText(),/4 × 6 = 24/);
    const freeTableInspector=await page.locator('.mult-table-inspector').innerText();
    assert.match(freeTableInspector,/6 × 4 = 24/);
    assert.match(freeTableInspector,/2 × 12/);
    assert.match(freeTableInspector,/3 × 8/);
    assert.match(freeTableInspector,/8 × 3/);
    assert.ok(await page.locator('.mult-table-cell.same-product').count()>=5);
    await page.locator('#mult-table-answer-toggle').click();
    assert.equal((await page.locator('[data-table-a="1"][data-table-b="1"]').innerText()).trim(),'?');
    assert.equal((await page.locator('[data-table-a="4"][data-table-b="6"]').innerText()).trim(),'24');
    await page.locator('[data-table-focus="2"]').click();
    assert.ok(await page.locator('.mult-table-cell.dimmed').count()>0);

    // Free play allows arbitrary factors regardless of recommended grade.
    await page.locator('[data-mult-mode="free"]').click();
    await page.locator('[data-mult-variant="array"]').click();
    await page.locator('[data-factor-preset="a"][data-value="7"]').click();
    await page.locator('[data-factor-preset="b"][data-value="8"]').click();
    assert.match(await page.locator('.mult-equation').innerText(),/7 × 8 = 56/);
    assert.equal(await page.locator('.mult-array .mult-dot').count(),56);
    assert.match(await page.locator('.mult-discovery').innerText(),/56/);
    const multTouchHeights=await page.locator('.mult-preset').evaluateAll(els=>els.map(e=>e.getBoundingClientRect().height));
    assert.ok(multTouchHeights.every(h=>h>=40),'small multiplication touch target: '+multTouchHeights.join(','));

    await page.locator('#multiplication-lab-back').click();
    await page.locator('#subject-screen.active').waitFor();
    const multAfter=await page.evaluate(()=>({goal:dailyGoal().done,answers:subjectAnswered('math')}));
    assert.deepEqual(multAfter,multBefore,'Gangetabell-lab exploration must not count as a completed test or graded answer');

    await page.locator('#subject-modules .subject-module').click();
    assert.equal(await page.evaluate(()=>sessionQuestions.length),5);
    await page.locator('#close-session').click();
    await page.locator('#subject-back').click();

    // English: no premature grammar, but real sentences and reading are available.
    await page.locator('#open-english').click();
    const englishModules=await page.locator('#subject-modules .subject-module strong').allTextContents();
    assert.ok(englishModules.includes('Words'));
    assert.ok(englishModules.includes('Sentences'));
    assert.ok(englishModules.includes('Reading'));
    assert.ok(!englishModules.includes('Grammar'));
    await page.locator('#subject-modules .subject-module').filter({hasText:'Sentences'}).click();
    assert.equal(await page.evaluate(()=>sessionQuestions.length),5);
    assert.equal(await page.evaluate(()=>new Set(sessionQuestions.map(q=>q.prompt+'|'+q.answer)).size),5);
    await page.locator('#close-session').click();
    await page.locator('#subject-back').click();

    // Geography: default Land must work on a young grade.
    await page.locator('#open-geography').click();
    assert.equal(await page.locator('.geo-theme').count(),6);
    await page.locator('#start-geography-theme').click();
    await page.locator('#session-screen.active').waitFor();
    assert.equal(await page.evaluate(()=>sessionQuestions.length),5);
    await page.locator('#close-session').click();
    await page.locator('#open-world').click();
    await page.locator('#world-screen.active').waitFor();
    const box=await page.locator('#globe-canvas').boundingBox();
    assert.ok(box&&box.width>300&&box.height>500,'globe should fill the mobile viewport');
    await page.locator('#random-country').click();
    assert.doesNotMatch(await page.locator('#globe-status').innerText(),/Finn et land/);

    // Min verden must explain every progress symbol, and a selected country must show explicit status.
    await page.locator('[data-globe-mode="mine"]').click();
    assert.equal(await page.locator('#globe-legend').isVisible(),true);
    const legendText=await page.locator('#globe-legend').innerText();
    assert.match(legendText,/Fullført/);
    assert.match(legendText,/Kan nå/);
    assert.match(legendText,/Under arbeid/);
    assert.match(legendText,/Sett/);
    assert.match(legendText,/ikke startet/i);
    await page.evaluate(()=>selectGlobeCountry('no'));
    const statusText=(await page.locator('.globe-status-badge').innerText()).trim();
    assert.ok(['★ Fullført','● Kan nå','◐ Under arbeid','• Sett','– Ikke startet'].includes(statusText),`unexpected globe status: ${statusText}`);

    // Custom edge swipe back from the globe.
    await page.mouse.move(2,400);await page.mouse.down();await page.mouse.move(110,400,{steps:5});await page.mouse.up();
    await page.locator('#geography-screen.active').waitFor();

    // Progress.
    await page.locator('#geography-back').click();
    await page.locator('#bottom-nav button[data-tab="progress"]').click();
    await page.locator('#progress-screen.active').waitFor();
    assert.equal(await page.locator('#subject-progress-grid .subject-progress-card').count(),4);

    // No tiny child-facing back/theme controls.
    await page.locator('#bottom-nav button[data-tab="home"]').click();
    await page.locator('#open-geography').click();
    const themeHeights=await page.locator('.geo-theme:visible').evaluateAll(els=>els.map(e=>e.getBoundingClientRect().height));
    assert.ok(themeHeights.every(h=>h>=44),`small geography touch target: ${themeHeights}`);
    const backHeight=await page.locator('#geography-back').evaluate(e=>e.getBoundingClientRect().height);
    assert.ok(backHeight>=44,`small back target: ${backHeight}`);

    // First grade: capitals are intentionally hidden but Land still works.
    const context1=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const p1=await context1.newPage();p1.__base=url;
    await p1.route('https://raw.githubusercontent.com/**',r=>r.fulfill({status:200,contentType:'application/json',body:'{"type":"FeatureCollection","features":[]}'}));await p1.route('https://api.worldbank.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[{},[]]'}));
    await onboard(p1,1);
    await p1.locator('#open-geography').click();
    assert.equal(await p1.locator('.geo-theme[data-geo-theme="capital"]').isVisible(),false);
    await p1.locator('#start-geography-theme').click();
    await p1.locator('#session-screen.active').waitFor();
    assert.equal(await p1.evaluate(()=>sessionQuestions.length),5);
    assert.equal(await p1.locator('#read-aloud').isVisible(),true,'1st grade should offer read aloud');

    // Delayed recall on separate days is required before a single geography skill is long-term mastered.
    const masteryStage=await p1.evaluate(()=>{
      const key=masteryKey('no','flag'),today=evidenceDay(Date.now()),yesterday=evidenceDay(Date.now()-24*60*60*1000);
      state.mastery[key]=2;
      state.masteryEvidence[key]={attempts:2,correctCount:2,wrongCount:0,lastAttemptAt:Date.now(),lastCorrectAt:Date.now(),days:[yesterday,today],correctDays:[yesterday,today],variants:['geo|no|flag']};
      return typeStage('no','flag');
    });
    assert.equal(masteryStage,'mastered');
    await context1.close();

    // Structural sweep: isolate content sufficiency from the deliberate repeat-cooldown history above.
    await page.evaluate(()=>{state.answerLog=[];state.activeSession=null;saveState()});
    // Every visible subject module on every grade can build a five-question session when no tasks are cooling down.
    for(let grade=1;grade<=10;grade++){
      await page.evaluate(g=>{state.profile.grade=g;state.activeSession=null;state.lastActivity=null;saveState();setTab('home')},grade);
      for(const subject of ['norwegian','math','english']){
        await page.evaluate(s=>openSubject(s),subject);
        const ids=await page.evaluate(()=>visibleSubjectModules().map(m=>m.id));
        assert.ok(ids.length>0,`${subject} grade ${grade} has no modules`);
        for(const moduleId of ids){
          const result=await page.evaluate(({subject,moduleId})=>{
            const qs=buildLearningQuestions(subject,moduleId);
            return {count:qs.length,valid:qs.every(validLearningQuestion),unique:new Set(qs.map(q=>q.type+'|'+q.prompt+'|'+q.answer)).size};
          },{subject,moduleId});
          assert.equal(result.count,5,`${subject} grade ${grade} module ${moduleId} did not build 5 questions`);
          assert.equal(result.valid,true,`${subject} grade ${grade} module ${moduleId} has invalid question`);
          assert.ok(result.unique>=4,`${subject} grade ${grade} module ${moduleId} is too repetitive: ${result.unique}/5 unique`);
        }
      }
    }

    assert.deepEqual(errors,[]);
    console.log('laer-litt-mer browser QA passed');
  }finally{
    await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);process.exit(1)});