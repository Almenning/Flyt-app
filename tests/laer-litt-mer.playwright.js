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
  await page.locator('.avatar-choice-card[data-avatar="boy"]').click();
  await page.locator('#profile-name').fill('Testbarn');
  await page.locator(`.grade-btn[data-grade="${grade}"]`).click();
  await page.locator('#profile-next').click();
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
  const count=await page.evaluate(()=>sessionQuestions.length);
  assert.ok(count>0,'session must contain at least one question');
  for(let i=0;i<count;i++){
    await answerCurrent(page);
    await page.locator('#next-question').click();
  }
  await page.locator('#complete-screen.active').waitFor();
}

(async()=>{
  const {server,url}=await startServer();
  const browser=await chromium.launch({headless:true,...(process.env.LEARNING_CHROME_PATH?{executablePath:process.env.LEARNING_CHROME_PATH}:{})});
  const errors=[];
  try{
    // Performance/stability blocker: cold mobile startup and Home -> Globe must stay off heavy/network critical paths.
    {
      const perfContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
      const perfPage=await perfContext.newPage();
      const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Testbarn',avatar:'boy',setupVersion:2},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
      await perfPage.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed);
      const requests=[];
      perfPage.on('request',req=>requests.push(req.url()));
      await perfPage.route('https://raw.githubusercontent.com/**',route=>route.abort());
      await perfPage.route('https://api.worldbank.org/**',route=>route.abort());

      const coldStart=Date.now();
      await perfPage.goto(url+'?app=laria&perfqa='+Date.now(),{waitUntil:'domcontentloaded'});
      await perfPage.locator('.bc12').waitFor({state:'visible',timeout:3000});
      const homeInteractiveMs=Date.now()-coldStart;
      assert.ok(homeInteractiveMs<3000,'mobile Home took too long to become interactive: '+homeInteractiveMs+'ms');

      const tapStart=Date.now();
      await perfPage.locator('.bc12-place[data-camp="globe"]').tap();
      await perfPage.locator('#world-screen.active').waitFor({timeout:1000});
      const screenSwitchMs=Date.now()-tapStart;
      assert.ok(screenSwitchMs<900,'Home -> Globe screen switch too slow: '+screenSwitchMs+'ms');

      await perfPage.waitForFunction(()=>{
        const c=document.getElementById('globe-canvas');
        return !!(c&&c._cssW&&c._cssH&&Number(c._cssW)>=280&&Number(c._cssH)>=280);
      },null,{timeout:1500});
      const globeReadyMs=Number(await perfPage.locator('#world-screen').getAttribute('data-globe-ready-ms'));
      assert.ok(Number.isFinite(globeReadyMs)&&globeReadyMs<1500,'Globe canvas readiness too slow: '+globeReadyMs+'ms');

      await perfPage.waitForTimeout(900);
      const criticalRequests=requests.slice();
      assert.equal(criticalRequests.some(x=>/geografi-verden\.png|matte-verden\.png|engelsk-verden\.png|bokskogen-verden\.png/.test(x)),false,'large 3 MB world art loaded on Home/Globe critical path');
      assert.equal(criticalRequests.some(x=>x.includes('raw.githubusercontent.com')||x.includes('api.worldbank.org')),false,'external enrichment started before Globe interaction settled');
      assert.equal(criticalRequests.some(x=>x.includes('basecamp-v11-mobile.webp')),true,'mobile Basecamp background was not requested/preloaded');
      await perfContext.close();
    }

    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const page=await context.newPage();
    page.__base=url;
    page.on('pageerror',e=>errors.push('pageerror: '+e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
    await page.route('https://raw.githubusercontent.com/**',r=>r.fulfill({status:200,contentType:'application/json',body:'{"type":"FeatureCollection","features":[]}'}));
    await page.route('https://api.worldbank.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[{},[]]'}));

    await onboard(page,2);

    // Young Home is Basecamp v12: one world, one obvious journey action, four free-play places.
    assert.equal(await page.locator('.bc12').isVisible(),true,'Basecamp v12 must own grades 1–2 Home');
    assert.equal(await page.locator('.bc12-journey').isVisible(),true,'Fortsett reisen must be visible');
    const homeLayout=await page.evaluate(()=>{
      const home=document.querySelector('.bc12').getBoundingClientRect();
      const journey=document.querySelector('.bc12-journey').getBoundingClientRect();
      return {homeTop:home.top,homeBottom:home.bottom,journeyTop:journey.top,journeyBottom:journey.bottom,width:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth};
    });
    assert.ok(homeLayout.journeyTop>=0&&homeLayout.journeyBottom<=844,'Fortsett reisen should fit in the initial phone view');
    assert.ok(homeLayout.scrollWidth<=homeLayout.width,'Basecamp must not scroll horizontally');
    for(const action of ['globe','fraction','words','multiply']){
      const place=page.locator('.bc12-place[data-camp="'+action+'"]');
      assert.equal(await place.isVisible(),true,'Basecamp place hidden: '+action);
      assert.equal(await place.isEnabled(),true,'Basecamp place disabled: '+action);
    }

    // Daily goal remains session-based even though Basecamp no longer exposes the old dashboard widget.
    await page.evaluate(()=>{
      state.answerLog.push({at:Date.now(),subject:'math',skill:'test-effort',type:'learning-choice',questionKey:'effort-test-1',correct:false});
      renderAll();
    });
    assert.equal(await page.evaluate(()=>dailyGoal().done),0);
    await page.evaluate(()=>{
      state.sessionLog.push({endedAt:Date.now(),correct:0,total:5,strengthened:0,area:'Test'});
      renderAll();
    });
    assert.equal(await page.evaluate(()=>dailyGoal().done),1);
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

    assert.equal(await page.locator('.bc12-place').count(),4);
    assert.equal(await page.locator('.bc12-nav button').count(),4);
    assert.equal(await page.locator('.bc12-nav button[data-camp="explore"]').isVisible(),true);
    assert.equal(await page.locator('#learn-screen').count(),0);
    assert.match(await page.locator('.onboard-step[data-step="0"] .hero-copy').textContent(),/Velg reven din, skriv navnet ditt og start reisen/i);
    assert.equal(await page.locator('.onboard-step[data-step="0"] .grade-question').count(),1,'grade choice must remain on the same onboarding screen');

    // Norsk 1.–2.: the child enters the premium Bokskogen board, not the old module dashboard.
    await page.evaluate(()=>openSubject('norwegian'));
    await page.locator('#subject-screen.active').waitFor();
    assert.equal(await page.locator('#subject-title').textContent(),'Norsk');
    assert.equal(await page.locator('#journey-map .bok-v11-world').count(),1,'young Norwegian should use Bokskogen v11');
    assert.equal(await page.locator('#journey-map [data-v10-place]').count(),11,'Bokskogen should expose one destination for each core learning stop');
    assert.equal(await page.locator('#journey-map .bok-v10-place.state-current').count(),1,'exactly one destination should be the next place');
    assert.equal(await page.locator('#journey-map .bok-v10-place .plaque').count(),0,'destination labels must belong to the illustrated world, not duplicate UI plaques');
    assert.equal(await page.locator('#journey-map .bok-v16-terrain img').count(),1,'Bokskogen should show the active illustrated terrain atlas');
    assert.equal(await page.locator('#journey-map .bok-v16-scene').count(),1,'Bokskogen should use one active layered scene');
    assert.equal(await page.locator('#journey-map .bok-v15-scene').count(),0,'obsolete modular terrain must not compete with the active scene');
    assert.equal(await page.locator('#journey-map .atlas-place-label').count(),11,'all core destinations need readable controls');
    assert.equal(await page.locator('#journey-map').getAttribute('data-release'),'atlas32');
    assert.equal(await page.locator('#journey-map').getAttribute('data-journey-release'),'journey-rc1');
    assert.equal(Number(await page.locator('#journey-map').getAttribute('data-journey-core-stops')),11,'Bokskogen RC must expose 11 distinct core destinations');
    assert.equal(await page.locator('#journey-map .bok-v10-home').isVisible(),true);
    assert.equal(await page.locator('#journey-map .bok-v10-grade').isVisible(),true);
    assert.equal(await page.locator('#journey-map .bok-v10-progress').isVisible(),true);
    assert.equal(await page.locator('#journey-map .bok-v11-status').count(),0,'Bokskogen must not render floating circular state badges');
    assert.equal(await page.locator('#subject-screen > .detail-back').isVisible(),false,'world-first Bokskogen must not leak the old page back button below the map');
    const bokHudTop=await page.locator('#journey-map .bok-v10-top').evaluate(el=>el.getBoundingClientRect().top);
    assert.ok(bokHudTop>=55,'Bokskogen HUD must clear iPhone status/Dynamic Island area');
    assert.equal(await page.locator('#subject-modules').isVisible(),false,'the old module dashboard should not compete with the game board');
    await page.waitForTimeout(450);
    const bokNextPosition=await page.locator('#journey-map .bok-v10-place.state-current').evaluate(el=>el.getBoundingClientRect().top);
    assert.ok(bokNextPosition>=0&&bokNextPosition<844,'Bokskogen must open with the next destination in the mobile viewport');

    await page.locator('#journey-map .bok-v10-place.state-current').click();
    assert.equal(await page.locator('#journey-mission-backdrop').isVisible(),false,'map click must open the exercise directly');
    await page.locator('#session-screen.active').waitFor();
    assert.equal(await page.evaluate(()=>sessionScope.type),'journey');
    assert.equal(await page.evaluate(()=>sessionScope.subject),'norwegian');
    await finishSession(page);
    assert.match(await page.locator('#complete-area').textContent(),/Norsk/);
    await page.locator('#complete-home').click();
    await page.locator('#subject-screen.active').waitFor();
    assert.equal(await page.locator('#journey-map .bok-v11-world').count(),1,'journey completion should return to the Bokskogen board');
    assert.equal(await page.locator('#journey-map .bok-v16-terrain img').isVisible(),true,'the terrain atlas should remain visible after completing a session');
    await page.locator('#journey-map .bok-v10-home').click();
    await page.locator('#home-screen.active').waitFor();
    assert.equal(await page.locator('.bc12-journey').isVisible(),true);

    // Matte: second grade should stay simple, but interaction should not be only multiple choice.
    const mathVariety=await page.evaluate(()=>mathPool(2,'numbers').map(q=>q.type));
    assert.ok(mathVariety.includes('number-input'),'grade 2 math should include typed answers');
    assert.ok(mathVariety.includes('sequence-order'),'grade 2 math should include ordering');
    await page.evaluate(()=>document.getElementById('open-math').click());
    assert.equal(await page.locator('#journey-map').isVisible(),true);
    assert.equal(await page.locator('#journey-map.premium-journey-map .premium-math').count(),1);
    assert.equal(await page.locator('#journey-map').getAttribute('data-journey-release'),'journey-rc1');
    assert.equal(await page.locator('#journey-map').getAttribute('data-journey-subject'),'math');
    assert.ok(await page.locator('#journey-map .premium-place[data-journey-node]').count()>=4);
    assert.equal(await page.locator('#journey-map .premium-place.is-next').count(),1);
    assert.ok(await page.locator('#journey-map .premium-place.is-future').count()>=1);
    assert.equal(await page.locator('#journey-map .premium-world-hud').count(),1);
    assert.equal(await page.locator('#journey-now-card').isVisible(),false);
    assert.equal(await page.locator('#journey-collection').isVisible(),false);
    const worldArt=page.locator('#journey-map .premium-world-art');
    assert.match(await worldArt.getAttribute('data-world-src'),/matte-verden\.png$/,'math world should keep the premium landscape source');
    await page.waitForFunction(()=>{const img=document.querySelector('#journey-map .premium-world-art');return !!img?.getAttribute('src')&&img.complete&&img.naturalWidth>800},null,{timeout:4000});
    await page.waitForTimeout(150);
    const mathNextPosition=await page.locator('#journey-map .premium-place.is-next').evaluate(el=>el.getBoundingClientRect().top);
    assert.ok(mathNextPosition>=0&&mathNextPosition<844,'Tallenga must open with the next mission in the mobile viewport');
    const firstNode=page.locator('#journey-map .premium-place.is-next');
    await firstNode.click();
    await page.locator('#session-screen.active').waitFor();
    assert.equal(await page.locator('#journey-mission-backdrop').isVisible(),false,'math map opens exercises with one tap');
    assert.equal(await page.locator('#geography-screen').isVisible(),false,'inactive geography screen stays hidden');
    await page.locator('#close-session').click();
    await page.locator('#journey-map .premium-place.is-future').first().click();
    assert.equal(await page.locator('#journey-map .premium-sheet-start').count(),0,'future place must not start a mission');
    await page.locator('#journey-map .premium-sheet-close').click();

    const peekBefore=await page.evaluate(()=>({pct:journeyProgress('math',2).pct,goal:dailyGoal().done,answers:subjectAnswered('math')}));
    const previewNode=await page.evaluate(()=>{
      const model=journeyModel('math',2),id=model.areas[1].nodes.find(n=>n.type==='skill').id;
      return id;
    });
    await page.locator('#journey-map [data-journey-node="'+previewNode+'"]').click();
    await page.locator('#journey-map .premium-sheet-peek').click();
    await page.locator('#session-screen.active').waitFor();
    const peekScope=await page.evaluate(()=>({type:sessionScope.type,previewOnly:sessionScope.previewOnly,practiceOnly:sessionScope.practiceOnly,count:sessionQuestions.length}));
    assert.equal(peekScope.type,'journey-preview');
    assert.equal(peekScope.previewOnly,true);
    assert.equal(peekScope.practiceOnly,true);
    assert.ok(peekScope.count>=1);
    await answerCurrent(page);
    const peekLogged=await page.evaluate(()=>state.answerLog.at(-1));
    assert.equal(peekLogged.countsForLearning,false);
    await page.locator('#close-session').click();
    await page.locator('#subject-screen.active').waitFor();
    const peekAfter=await page.evaluate(()=>({pct:journeyProgress('math',2).pct,goal:dailyGoal().done,answers:subjectAnswered('math')}));
    assert.deepEqual(peekAfter,peekBefore);

    // Trophy completion must award the world's collectible, and the final trophy must genuinely round the grade.
    const journeyRewardCheck=await page.evaluate(()=>{
      const backup={
        skillMastery:JSON.parse(JSON.stringify(state.skillMastery)),
        skillEvidence:JSON.parse(JSON.stringify(state.skillEvidence)),
        journey:JSON.parse(JSON.stringify(state.journey)),
        lastMilestone:state.lastMilestone?JSON.parse(JSON.stringify(state.lastMilestone)):null
      };
      const oldScope=sessionScope;
      const model=journeyModel('math',2);
      for(const area of model.areas){
        for(const node of area.nodes.filter(n=>n.type==='skill')){
          for(const skill of node.skills)state.skillMastery[learningMasteryKey('math',skill,2)]=2;
        }
      }
      const firstArea=model.areas[0],firstCp=firstArea.nodes.find(n=>n.type==='checkpoint');
      sessionScope={type:'journey',subject:'math',journeyGrade:2,journeyNode:firstCp.id,journeyArea:firstArea.id,journeyType:'checkpoint',practiceOnly:false};
      const firstResult={correct:5,learningCorrect:5,total:5};
      recordJourneySessionResult(firstResult);
      const first={areaComplete:journeyAreaComplete(firstArea),reward:firstResult.journeyReward||null};

      for(let i=1;i<model.areas.length-1;i++){
        const cp=model.areas[i].nodes.find(n=>n.type==='checkpoint');
        state.journey.nodes[journeyNodeKey('math',2,cp.id)]={passed:true,best:5,attempts:1,lastAt:Date.now(),passedAt:Date.now()};
      }
      const lastArea=model.areas.at(-1),lastCp=lastArea.nodes.find(n=>n.type==='checkpoint');
      sessionScope={type:'journey',subject:'math',journeyGrade:2,journeyNode:lastCp.id,journeyArea:lastArea.id,journeyType:'checkpoint',practiceOnly:false};
      const finalResult={correct:5,learningCorrect:5,total:5};
      recordJourneySessionResult(finalResult);
      const final={complete:journeyProgress('math',2).complete,gradeCompleted:finalResult.gradeCompleted||null,gradeWin:state.journey.gradeWins['math:2']||null};
      renderSubjectJourney();
      final.visiblePrizes=document.querySelectorAll('#journey-map .premium-world-prize').length;
      final.replayable=document.querySelectorAll('#journey-map .premium-place.is-done').length;

      state.skillMastery=backup.skillMastery;state.skillEvidence=backup.skillEvidence;state.journey=backup.journey;state.lastMilestone=backup.lastMilestone;sessionScope=oldScope;saveState();renderAll();openSubject('math');
      return {first,final};
    });
    assert.equal(journeyRewardCheck.first.areaComplete,true);
    assert.ok(journeyRewardCheck.first.reward&&journeyRewardCheck.first.reward.label,'world trophy should award a collectible');
    assert.equal(journeyRewardCheck.final.complete,true,'final trophy should round the grade');
    assert.equal(journeyRewardCheck.final.gradeCompleted.grade,2);
    assert.ok(journeyRewardCheck.final.gradeWin,'grade completion should be persisted');
    assert.ok(journeyRewardCheck.final.visiblePrizes>=1,'finished worlds should show trophies in the landscape');
    assert.ok(journeyRewardCheck.final.replayable>=1,'finished places should remain interactive');

    const nextMathNode=await page.evaluate(()=>journeyRecommendedNode('math',2)?.id);
    assert.ok(nextMathNode,'missing recommended math journey node');
    await page.evaluate(id=>startJourneyNode('math',id),nextMathNode);
    await page.locator('#session-screen.active').waitFor();
    const mathJourneySession=await page.evaluate(()=>({type:sessionScope.type,journeyType:sessionScope.journeyType,grade:sessionScope.journeyGrade,count:sessionQuestions.length,valid:sessionQuestions.every(validLearningQuestion)}));
    assert.equal(mathJourneySession.type,'journey');
    assert.equal(mathJourneySession.grade,2);
    assert.equal(mathJourneySession.count,mathJourneySession.journeyType==='skill'?3:5);
    assert.equal(mathJourneySession.valid,true);
    await page.locator('#close-session').click();
    await page.locator('#subject-screen.active').waitFor();

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
    assert.match(tableInspector,/3 \+ 3 = 6/);
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
    const tableControlHeights=await page.locator('.mult-table-focus, #mult-table-answer-toggle, .mult-table-pairs button').evaluateAll(els=>els.map(e=>e.getBoundingClientRect().height));
    assert.ok(tableControlHeights.every(h=>h>=44),'small multiplication table control: '+tableControlHeights.join(','));

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
    await page.locator('#journey-map .premium-world-back').click();

    // English: no premature grammar, but real sentences and reading are available.
    await page.evaluate(()=>document.getElementById('open-english').click());
    const englishModules=await page.locator('#subject-modules .subject-module strong').allTextContents();
    assert.ok(englishModules.includes('Words'));
    assert.ok(englishModules.includes('Sentences'));
    assert.ok(englishModules.includes('Reading'));
    assert.ok(!englishModules.includes('Grammar'));
    await page.locator('#subject-modules .subject-module').filter({hasText:'Sentences'}).click();
    assert.equal(await page.evaluate(()=>sessionQuestions.length),5);
    assert.equal(await page.evaluate(()=>new Set(sessionQuestions.map(q=>q.prompt+'|'+q.answer)).size),5);
    await page.locator('#close-session').click();
    await page.locator('#journey-map .premium-world-back').click();

    // Geography: default Land must work on a young grade.
    await page.evaluate(()=>document.getElementById('open-geography').click());
    assert.equal(await page.locator('.geo-theme').count(),6);
    assert.equal(await page.locator('#geo-journey-map').isVisible(),true);
    assert.equal(await page.locator('#geo-journey-map.premium-journey-map .premium-geography').count(),1);
    assert.equal(await page.locator('#geo-journey-map').getAttribute('data-journey-release'),'journey-rc1');
    assert.equal(await page.locator('#geo-journey-map').getAttribute('data-journey-subject'),'geography');
    assert.ok(await page.locator('#geo-journey-map .premium-place[data-geo-journey-node]').count()>=4);
    assert.equal(await page.locator('#geo-journey-map .premium-place.is-next').count(),1);
    assert.ok(await page.locator('#geo-journey-map .premium-place.is-future').count()>=1);
    assert.equal(await page.locator('#geo-journey-map .premium-world-hud').count(),1);
    const geoWorldTop=await page.locator('#geo-journey-map').evaluate(el=>el.getBoundingClientRect().top);
    const geoGlobeTop=await page.locator('#open-world').evaluate(el=>el.getBoundingClientRect().top);
    assert.ok(geoWorldTop<geoGlobeTop,'young-grade geography journey should be the primary surface before globe/free exploration');
    assert.equal(await page.locator('#geography-screen > .geography-head').isVisible(),false,'young-grade geography should not put a dashboard banner before the world');
    const reactionNode=await page.evaluate(()=>{
      const grade=journeyViewGrade('geography'),model=geoJourneyProgress(grade).model,current=geoJourneyRecommendedNode(grade);
      const route=model.areas.flatMap(area=>area.nodes.filter(n=>n.type==='geo-skill'||n.type==='checkpoint'));
      const currentIndex=Math.max(0,route.findIndex(n=>n.id===current?.id));
      return route[Math.min(route.length-1,currentIndex+1)]?.id||current?.id;
    });
    await page.evaluate(nodeId=>{
      window.__journeyWorldReaction={subject:'geography',grade:journeyViewGrade('geography'),nodeId,at:Date.now()};
      renderGeoJourney();
    },reactionNode);
    assert.equal(await page.locator('#geo-journey-map .premium-world.is-progress-reaction .premium-progress-reaction').count(),1,'a newly completed core mission should trigger one landscape reaction');
    assert.equal(await page.locator('#geo-journey-map .premium-place.is-just-completed').count(),1,'the completed landmark should receive the reaction state');
    assert.equal(await page.locator('#geo-journey-map .premium-traveler-character').count(),1,'premium worlds should isolate guide motion from idle breathing');
    assert.notEqual(await page.locator('#geo-journey-map .premium-traveler').getAttribute('data-travel-from-x'),null,'reaction render should carry the travel origin');
    await page.waitForTimeout(80);
    const travelDistance=Number(await page.locator('#geo-journey-map .premium-traveler').getAttribute('data-travel-distance')||0);
    assert.ok(travelDistance>10,'a reaction between different landmarks should start a real traveler movement');
    assert.equal(await page.evaluate(()=>window.__journeyWorldReaction),null,'the world reaction must be one-shot');
    await page.locator('#geo-journey-map .premium-place.is-next').click();
    await page.locator('#session-screen.active').waitFor();
    assert.equal(await page.locator('#journey-mission-backdrop').isVisible(),false,'geography map opens exercises with one tap');
    assert.equal(await page.locator('#geography-screen').isVisible(),false,'geography theme must not leak over exercises');
    await page.locator('#close-session').click();

    const nextGeoNode=await page.evaluate(()=>geoJourneyRecommendedNode()?.id);
    assert.ok(nextGeoNode,'missing recommended geography journey node');
    await page.evaluate(id=>startGeoJourneyNode(id),nextGeoNode);
    await page.locator('#session-screen.active').waitFor();
    const geoJourneySession=await page.evaluate(()=>({type:sessionScope.type,count:sessionQuestions.length}));
    assert.equal(geoJourneySession.type,'geo-journey');
    assert.equal(geoJourneySession.count,5);
    await page.locator('#close-session').click();
    await page.locator('#geography-screen.active').waitFor();

    await page.locator('#start-geography-theme').click();
    await page.locator('#session-screen.active').waitFor();
    assert.equal(await page.evaluate(()=>sessionQuestions.length),5);
    await page.locator('#close-session').click();
    await page.locator('#open-world').click();
    await page.locator('#world-screen.active').waitFor();
    const box=await page.locator('#globe-canvas').boundingBox();
    const worldBox=await page.locator('#world-screen.active').boundingBox();
    assert.ok(worldBox&&worldBox.width>=389&&worldBox.height>=843,'globe scene should fill the mobile viewport');
    assert.ok(box&&box.width>=340&&box.height>=340&&Math.abs(box.width-box.height)<3,'interactive globe should stay large and circular on phone');
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
    await page.locator('#geo-journey-map .premium-world-back').click();
    await page.evaluate(()=>setTab('progress'));
    await page.locator('#progress-screen.active').waitFor();
    assert.equal(await page.locator('#subject-progress-grid .subject-progress-card').count(),4);

    // No tiny child-facing back/theme controls.
    await page.evaluate(()=>setTab('home'));
    await page.evaluate(()=>document.getElementById('open-geography').click());
    const themeHeights=await page.locator('.geo-theme:visible').evaluateAll(els=>els.map(e=>e.getBoundingClientRect().height));
    assert.ok(themeHeights.every(h=>h>=44),`small geography touch target: ${themeHeights}`);
    const backHeight=await page.locator('#geo-journey-map .premium-world-back').evaluate(e=>e.getBoundingClientRect().height);
    assert.ok(backHeight>=44,`small back target: ${backHeight}`);

    // Prompt 11: all four subjects must render through the same premium task scene contract.
    async function assertTaskScene(subject, starter){
      await page.evaluate(()=>setTab('home'));
      await page.evaluate(s=>document.querySelector(s).click(),starter);
      if(subject==='geography'){
        await page.evaluate(()=>{geoTheme='country';syncGeoThemeButtons();startGeographyTheme()});
      }else{
        await page.evaluate(s=>startLearningSession(s,null,SUBJECTS[s]?.mission||'Blandet'),subject);
      }
      await page.locator('#session-screen.active').waitFor();
      assert.equal(await page.locator('#session-screen').getAttribute('data-task-scene-release'),'task-rc1',subject+' missing Prompt 11 task RC');
      assert.equal(await page.locator('#session-screen').getAttribute('data-task-subject'),subject,subject+' wrong task-scene subject');
      assert.equal(await page.locator('#session-screen').getAttribute('data-task-band'),'young',subject+' grade 2 should use young task specialization');
      assert.equal(await page.locator('.laria-task-card').count(),1,subject+' should render exactly one premium task card');
      assert.equal(await page.locator('.task-fox-companion img').count(),1,subject+' needs one in-world fox companion');
      assert.match(await page.locator('.task-fox-companion img').getAttribute('src'),/lia-fox-explorer\.webp(?:\?|$)/,subject+' must use the dedicated scene mascot');
      assert.ok((await page.locator('.answer,.letter-tile,.word-tile,.sequence-tile,#math-input,#quiz-map-canvas').count())>0,subject+' task scene has no active interaction');
      await page.locator('#close-session').click();
    }
    await assertTaskScene('norwegian','#open-norwegian');
    await assertTaskScene('english','#open-english');
    await assertTaskScene('math','#open-math');
    await assertTaskScene('geography','#open-geography');

    // Prompt 12: the locked grade 1–2 object set must use the premium SVG illustration system,
    // stay responsive on phone/tablet, and rendering art must never mutate learning progress.
    const prompt12Visuals=['🏠','🐱','🐶','📘','🍎','🚗','⛵','🌳','☀️','🌙','🐟','⚽'];
    assert.deepEqual(await page.evaluate(()=>window.LARIA_TASK_PREMIUM_VISUALS),prompt12Visuals,'Prompt 12 premium visual registry changed');
    const progressBeforeIllustrations=await page.evaluate(()=>JSON.stringify({
      answerLog:state.answerLog,journey:state.journey,skillMastery:state.skillMastery,mastery:state.mastery
    }));
    async function assertPrompt12Visuals(width,height,label){
      await page.setViewportSize({width,height});
      for(const visual of prompt12Visuals){
        await page.evaluate(v=>{
          sessionQuestions=[{
            subject:'norwegian',skill:'word-picture',type:'learning-choice',
            prompt:'Hvilket ord passer til bildet?',answer:'riktig',options:['riktig','feil','annet'],
            visual:v,curriculum:CURRICULUM.norwegian
          }];
          qIndex=0;currentAnswered=null;showScreen('session');renderQuestion();
        },visual);
        const row=page.locator('.task-visual-row');
        assert.equal(await page.locator('#session-screen').getAttribute('data-task-illustration-release'),'illustrations-rc1',label+' missing Prompt 12 illustration release');
        assert.equal(await row.getAttribute('data-task-visual-kind'),'premium',label+' '+visual+' fell back from premium art');
        assert.equal(await row.getAttribute('data-task-visual-release'),'illustrations-rc1',label+' '+visual+' missing illustration RC marker');
        assert.equal(await row.locator('svg.task-illustration').count(),1,label+' '+visual+' must render exactly one SVG illustration');
        assert.equal(await row.locator('.task-emoji-sticker').count(),0,label+' '+visual+' must not render emoji fallback');
        const bounds=await row.evaluate(el=>{
          const r=el.getBoundingClientRect(),svg=el.querySelector('svg')?.getBoundingClientRect();
          return {left:r.left,right:r.right,width:r.width,svgLeft:svg?.left,svgRight:svg?.right,scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth};
        });
        assert.ok(bounds.left>=-1&&bounds.right<=width+1,label+' '+visual+' illustration row overflows viewport');
        assert.ok(bounds.svgLeft>=-1&&bounds.svgRight<=width+1,label+' '+visual+' SVG is cropped horizontally');
        assert.ok(bounds.scrollWidth<=bounds.clientWidth,label+' '+visual+' creates horizontal page overflow');
      }
    }
    await assertPrompt12Visuals(390,844,'phone');
    await assertPrompt12Visuals(820,1180,'ipad-portrait');
    await page.setViewportSize({width:390,height:844});
    const progressAfterIllustrations=await page.evaluate(()=>JSON.stringify({
      answerLog:state.answerLog,journey:state.journey,skillMastery:state.skillMastery,mastery:state.mastery
    }));
    assert.equal(progressAfterIllustrations,progressBeforeIllustrations,'Prompt 12 illustration rendering changed learning progress');
    await page.locator('#close-session').click();

    // Prompt 13: TaskScene fox must stay in-world, follow the saved avatar state,
    // avoid covering the question/answers, and react briefly only after a correct answer.
    async function assertPrompt13Fox(width,height,label){
      await page.setViewportSize({width,height});
      await page.evaluate(()=>{
        state.profile.avatar='girl';saveState();
        sessionQuestions=[{
          subject:'norwegian',skill:'word-picture',type:'learning-choice',
          prompt:'Hvilket ord passer til bildet?',answer:'katt',options:['katt','hund','hus'],
          visual:'🐱',curriculum:CURRICULUM.norwegian
        }];
        qIndex=0;currentAnswered=null;showScreen('session');renderQuestion();
      });
      const fox=page.locator('.task-fox-companion');
      assert.equal(await page.locator('#session-screen').getAttribute('data-task-fox-release'),'fox-rc1',label+' missing Prompt 13 fox release');
      assert.equal(await fox.getAttribute('data-avatar'),'girl',label+' TaskScene fox did not follow saved avatar state');
      assert.match(await fox.locator('img').getAttribute('src'),/lia-fox-explorer\.webp(?:\?|$)/,label+' must use the transparent scene fox');
      assert.equal(await fox.locator('img').getAttribute('src').then(src=>String(src).startsWith('data:')),false,label+' must not use onboarding portrait data');
      const layout=await page.evaluate(()=>{
        const rect=s=>document.querySelector(s)?.getBoundingClientRect();
        const f=rect('.task-fox-companion'),q=rect('.question'),a=rect('.task-interaction');
        const overlap=(x,y)=>!!x&&!!y&&Math.max(0,Math.min(x.right,y.right)-Math.max(x.left,y.left))*Math.max(0,Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top));
        return {fox:{left:f.left,right:f.right,top:f.top,bottom:f.bottom},questionOverlap:overlap(f,q),answerOverlap:overlap(f,a),scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth};
      });
      assert.equal(layout.questionOverlap,0,label+' fox overlaps question text');
      assert.equal(layout.answerOverlap,0,label+' fox overlaps answer controls');
      assert.ok(layout.fox.left>=-1&&layout.fox.right<=width+1,label+' fox is cropped horizontally');
      assert.ok(layout.scrollWidth<=layout.clientWidth,label+' fox creates horizontal overflow');
      const beforeCount=await page.evaluate(()=>state.answerLog.length);
      await page.locator('.answer[data-answer="katt"]').click();
      assert.equal(await fox.evaluate(el=>el.classList.contains('fox-correct')),true,label+' fox did not react to correct answer');
      const answerResult=await page.evaluate(()=>({count:state.answerLog.length,last:state.answerLog[state.answerLog.length-1]}));
      assert.equal(answerResult.count,beforeCount+1,label+' correct answer should create exactly one normal progress record');
      assert.equal(answerResult.last.correct,true,label+' correct answer progress record changed');
      await page.waitForTimeout(700);
      assert.equal(await fox.evaluate(el=>el.classList.contains('fox-correct')),false,label+' fox reaction should settle quickly');
      await page.locator('#close-session').click();
    }
    await assertPrompt13Fox(390,844,'phone');
    await assertPrompt13Fox(820,1180,'ipad-portrait');
    await page.evaluate(()=>{state.profile.avatar='boy';saveState()});
    await page.setViewportSize({width:390,height:844});

    // Content-depth finishing contract: three normal sessions in a row should stay fresh,
    // repeats must not inflate today's goal, and mastered interests remain replayable.
    const contentDepth=await page.evaluate(()=>{
      const savedState=JSON.stringify(state);
      const savedRuntime={
        scope:JSON.stringify(sessionScope||{}),
        questions:JSON.stringify(sessionQuestions||[]),
        qIndex,sessionCorrect,
        strengthened:[...sessionStrengthened],
        answered:currentAnswered
      };
      const restore=()=>{
        state=JSON.parse(savedState);
        sessionScope=JSON.parse(savedRuntime.scope);
        sessionQuestions=JSON.parse(savedRuntime.questions);
        qIndex=savedRuntime.qIndex;
        sessionCorrect=savedRuntime.sessionCorrect;
        sessionStrengthened=new Set(savedRuntime.strengthened);
        currentAnswered=savedRuntime.answered;
        saveState();
        showScreen('home');
        renderAll();
      };
      const markAnswered=(qs,round)=>{
        const base=Date.now()+round*1000;
        qs.forEach((q,i)=>state.answerLog.push({
          at:base+i,correct:true,countsForLearning:true,
          questionKey:questionIdentity(q),
          subject:q.subject||null,skill:q.skill||null,
          country:q.k||null,type:q.type
        }));
      };
      const overlap=(a,b)=>{
        const set=new Set(b);
        return a.filter(x=>set.has(x)).length;
      };
      const assertRoundsFresh=rounds=>{
        if(rounds.some(r=>r.length!==5))return false;
        for(let i=0;i<rounds.length;i++)for(let j=i+1;j<rounds.length;j++)if(overlap(rounds[i],rounds[j])!==0)return false;
        return true;
      };
      const learningRounds=subject=>{
        const rounds=[];
        for(let round=0;round<3;round++){
          const fresh=buildLearningQuestions(subject,null,false);
          const all=fresh.length<5?buildLearningQuestions(subject,null,true):fresh;
          const qs=topUpSessionQuestions(fresh,all,5);
          rounds.push(qs.map(questionIdentity));
          markAnswered(qs,round);
        }
        return rounds;
      };
      const geographyRounds=()=>{
        const rounds=[];
        for(let round=0;round<3;round++){
          const qs=buildQuestionsForIds(gradeScopeIds(),true);
          rounds.push(qs.map(questionIdentity));
          markAnswered(qs,10+round);
        }
        return rounds;
      };

      state.profile.grade=2;
      state.answerLog=[];
      state.sessionLog=[];
      state.skillMastery={};
      state.skillEvidence={};
      state.mastery={};
      state.masteryEvidence={};
      const rounds={
        norwegian:learningRounds('norwegian'),
        english:learningRounds('english'),
        math:learningRounds('math'),
        geography:geographyRounds()
      };
      const fresh={
        norwegian:assertRoundsFresh(rounds.norwegian),
        english:assertRoundsFresh(rounds.english),
        math:assertRoundsFresh(rounds.math),
        geography:assertRoundsFresh(rounds.geography)
      };

      const depth={};
      for(const grade of [2,4,7,10]){
        state.profile.grade=grade;
        const count=pool=>new Set(pool.map(questionIdentity)).size;
        depth[grade]={
          norwegian:count(norwegianPool(grade,null)),
          english:count(englishPool(grade,null)),
          math:count(mathPool(grade,null)),
          geography:new Set(questionPool(gradeScopeIds(),true,true).map(x=>x.k+':'+x.type)).size
        };
      }

      // A normal activity may satisfy the daily goal once. Repeating the exact same
      // activity the same day remains available, but is explicitly non-counting.
      state.profile.grade=2;
      state.answerLog=[];
      state.sessionLog=[];
      const dailyQs=englishPool(2,'words').slice(0,5);
      sessionScope={type:'subject',subject:'english',module:'words',label:'Engelsk · Words',grade:2};
      sessionQuestions=dailyQs;
      qIndex=dailyQs.length-1;
      sessionCorrect=5;
      sessionStrengthened=new Set();
      currentAnswered={correct:true};
      state.activeSession={startedAt:Date.now()-1000};
      finishSession();
      sessionScope={type:'subject',subject:'english',module:'words',label:'Engelsk · Words',grade:2};
      sessionQuestions=dailyQs;
      qIndex=dailyQs.length-1;
      sessionCorrect=5;
      sessionStrengthened=new Set();
      currentAnswered={correct:true};
      state.activeSession={startedAt:Date.now()-1000};
      finishSession();
      const lastTwo=state.sessionLog.slice(-2).map(s=>({
        countsTowardGoal:s.countsTowardGoal,
        duplicateToday:s.duplicateToday,
        activityKey:s.activityKey
      }));
      const goal=dailyGoal();

      // Mastery opens/recommends other content but must not remove a favorite activity.
      state.answerLog=[];
      state.skillMastery={};
      state.skillEvidence={};
      const wordPool=englishPool(2,'words');
      const today=evidenceDay(Date.now()),yesterday=evidenceDay(Date.now()-86400000);
      for(const skill of new Set(wordPool.map(q=>q.skill))){
        const key=learningMasteryKey('english',skill,2);
        state.skillMastery[key]=2;
        state.skillEvidence[key]={
          attempts:2,correctCount:2,wrongCount:0,lastAttemptAt:Date.now(),lastCorrectAt:Date.now(),
          days:[yesterday,today],correctDays:[yesterday,today],variants:['a','b']
        };
      }
      const replayAfterMastery=buildLearningQuestions('english','words',true).length;

      const result={rounds,fresh,depth,lastTwo,goal,replayAfterMastery};
      restore();
      return result;
    });
    for(const subject of ['norwegian','english','math','geography']){
      assert.equal(contentDepth.fresh[subject],true,subject+' repeated an exact question across three consecutive grade-2 sessions');
    }
    for(const grade of [2,4,7,10]){
      assert.ok(contentDepth.depth[grade].norwegian>=20,'Norwegian content bank too shallow for grade '+grade+': '+contentDepth.depth[grade].norwegian);
      assert.ok(contentDepth.depth[grade].english>=15,'English content bank too shallow for grade '+grade+': '+contentDepth.depth[grade].english);
      assert.ok(contentDepth.depth[grade].math>=10,'Math content bank too shallow for grade '+grade+': '+contentDepth.depth[grade].math);
      assert.ok(contentDepth.depth[grade].geography>=15,'Geography content bank too shallow for grade '+grade+': '+contentDepth.depth[grade].geography);
    }
    assert.equal(contentDepth.lastTwo[0].countsTowardGoal,true,'first normal completion should count toward daily goal');
    assert.equal(contentDepth.lastTwo[1].countsTowardGoal,false,'same activity repeated today must not count twice');
    assert.equal(contentDepth.lastTwo[1].duplicateToday,true,'repeat completion must be marked as duplicateToday');
    assert.equal(contentDepth.lastTwo[0].activityKey,contentDepth.lastTwo[1].activityKey,'daily-goal replay test did not use the same activity');
    assert.deepEqual(contentDepth.goal,{target:1,done:1,sessions:1},'daily goal inflated after replaying the same activity');
    assert.equal(contentDepth.replayAfterMastery,5,'mastered English content was locked away instead of remaining replayable');

    // First grade: capitals are intentionally hidden but Land still works.
    const context1=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const p1=await context1.newPage();p1.__base=url;
    await p1.route('https://raw.githubusercontent.com/**',r=>r.fulfill({status:200,contentType:'application/json',body:'{"type":"FeatureCollection","features":[]}'}));await p1.route('https://api.worldbank.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[{},[]]'}));
    await onboard(p1,1);
    await p1.evaluate(()=>document.getElementById('open-geography').click());
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


    // Mastery is grade-scoped: grade-3 multiplication must not silently complete grade 5.
    const scopedMastery=await page.evaluate(()=>{
      const k3=learningMasteryKey('math','multiplication',3),k5=learningMasteryKey('math','multiplication',5);
      state.skillMastery[k3]=2;delete state.skillMastery[k5];delete state.skillEvidence[k5];
      return {g3:skillStage('math','multiplication',3),g5:skillStage('math','multiplication',5)};
    });
    assert.ok(['can-now','mastered'].includes(scopedMastery.g3));
    assert.equal(scopedMastery.g5,'new');

    // Every grade has a real journey and every required node can build a full valid session.
    await page.evaluate(()=>{state.answerLog=[];state.activeSession=null;saveState()});
    for(let grade=1;grade<=10;grade++){
      await page.evaluate(g=>{state.profile.grade=g;state.activeSession=null;state.lastActivity=null;saveState();setTab('home')},grade);
      for(const subject of ['norwegian','math','english']){
        const journey=await page.evaluate(subject=>{
          const model=journeyModel(subject,currentGrade());
          const checks=model.nodes.filter(n=>n.type==='skill'||n.type==='checkpoint').map(n=>{
            const qs=buildJourneyQuestions(subject,n,true);
            return {id:n.id,type:n.type,skills:n.skills,count:qs.length,valid:qs.every(validLearningQuestion),unique:new Set(qs.map(questionIdentity)).size};
          });
          return {areas:model.areas.length,nodes:model.nodes.length,checks};
        },subject);
        assert.ok(journey.areas>0,subject+' grade '+grade+' has no journey areas');
        assert.ok(journey.nodes>0,subject+' grade '+grade+' has no journey nodes');
        for(const n of journey.checks){
          assert.ok(n.skills.length>0,subject+' grade '+grade+' node '+n.id+' has no skills');
          assert.equal(n.count,5,subject+' grade '+grade+' journey node '+n.id+' did not build 5 questions');
          assert.equal(n.valid,true,subject+' grade '+grade+' journey node '+n.id+' has invalid questions');
          assert.ok(n.unique>=4,subject+' grade '+grade+' journey node '+n.id+' is too repetitive: '+n.unique+'/5');
        }
      }
      const geo=await page.evaluate(()=>{
        const model=geoJourneyModel(currentGrade());
        const checks=model.nodes.filter(n=>n.type==='geo-skill'||n.type==='checkpoint').map(n=>{
          const qs=buildGeoJourneyQuestions(n,true);
          return {id:n.id,type:n.type,count:qs.length,unique:new Set(qs.map(questionIdentity)).size};
        });
        return {areas:model.areas.length,nodes:model.nodes.length,checks};
      });
      assert.ok(geo.areas>0,'geography grade '+grade+' has no journey areas');
      assert.ok(geo.nodes>0,'geography grade '+grade+' has no journey nodes');
      for(const n of geo.checks){
        assert.equal(n.count,5,'geography grade '+grade+' journey node '+n.id+' did not build 5 questions');
        assert.ok(n.unique>=4,'geography grade '+grade+' journey node '+n.id+' is too repetitive: '+n.unique+'/5');
      }
    }

    // A next-grade preview is deliberately non-counting and must not alter either grade.
    await page.evaluate(()=>{state.profile.grade=2;state.answerLog=[];state.activeSession=null;saveState();setTab('home')});
    const previewBefore=await page.evaluate(()=>{
      const model=journeyModel('math',3),node=model.nodes.find(n=>n.type==='skill'),skill=node.skills[0];
      return {skill,current:skillStage('math',skill,2),next:skillStage('math',skill,3),profile:currentGrade()};
    });
    await page.evaluate(()=>startNextGradePreview('math'));
    await page.locator('#session-screen.active').waitFor();
    const previewScope=await page.evaluate(()=>({type:sessionScope.type,practiceOnly:sessionScope.practiceOnly,previewOnly:sessionScope.previewOnly,grade:sessionScope.journeyGrade,count:sessionQuestions.length}));
    assert.equal(previewScope.type,'journey-preview');
    assert.equal(previewScope.practiceOnly,true);
    assert.equal(previewScope.previewOnly,true);
    assert.equal(previewScope.grade,3);
    assert.equal(previewScope.count,5);
    await answerCurrent(page);
    const previewAfter=await page.evaluate(skill=>({current:skillStage('math',skill,2),next:skillStage('math',skill,3),profile:currentGrade(),logged:state.answerLog.at(-1)}),previewBefore.skill);
    assert.equal(previewAfter.current,previewBefore.current);
    assert.equal(previewAfter.next,previewBefore.next);
    assert.equal(previewAfter.profile,2);
    assert.equal(previewAfter.logged.countsForLearning,false);
    await page.evaluate(()=>{state.activeSession=null;sessionQuestions=[];currentAnswered=null;saveState();setTab('home')});

    // A journey grade is a chapter, not a profile change: children can genuinely work on another grade.
    await page.evaluate(()=>{
      state.profile.grade=2;
      ensureJourneyState();
      state.journey.viewGrades={};
      state.activeSession=null;state.lastActivity=null;
      saveState();setTab('home');
    });
    await page.evaluate(()=>document.getElementById('open-math').click());
    assert.equal(await page.locator('#journey-grade-strip [data-journey-grade]').count(),10);
    await page.locator('#journey-map .premium-world-grade').click();
    await page.locator('#journey-map [data-premium-grade="3"]').click();
    const selectedJourney=await page.evaluate(()=>({
      profile:currentGrade(),
      view:journeyViewGrade('math'),
      activeText:document.querySelector('#journey-grade-strip .journey-grade-choice.active')?.textContent||'',
      note:document.getElementById('journey-grade-note')?.textContent||''
    }));
    assert.equal(selectedJourney.profile,2);
    assert.equal(selectedJourney.view,3);
    assert.match(selectedJourney.activeText,/3\./);
    assert.match(selectedJourney.note,/Ditt klassetrinn er fortsatt 2\. klasse/i);

    const realGrade3Node=await page.evaluate(()=>journeyRecommendedNode('math',journeyViewGrade('math'))?.id);
    assert.ok(realGrade3Node,'missing real grade-3 math node');
    await page.evaluate(id=>startJourneyNode('math',id),realGrade3Node);
    await page.locator('#session-screen.active').waitFor();
    const realOtherGradeScope=await page.evaluate(()=>({
      profile:currentGrade(),view:journeyViewGrade('math'),grade:sessionScope.journeyGrade,
      type:sessionScope.type,journeyType:sessionScope.journeyType,practiceOnly:!!sessionScope.practiceOnly,count:sessionQuestions.length,
      skill:sessionQuestions[0]?.skill||null
    }));
    assert.equal(realOtherGradeScope.profile,2);
    assert.equal(realOtherGradeScope.view,3);
    assert.equal(realOtherGradeScope.grade,3);
    assert.equal(realOtherGradeScope.type,'journey');
    assert.equal(realOtherGradeScope.count,realOtherGradeScope.journeyType==='skill'?3:5);
    const grade2Before=await page.evaluate(skill=>skill?JSON.stringify(state.skillEvidence[learningMasteryKey('math',skill,2)]||null):null,realOtherGradeScope.skill);
    await answerCurrent(page);
    const gradeWrite=await page.evaluate(skill=>({
      profile:currentGrade(),
      grade2:skill?JSON.stringify(state.skillEvidence[learningMasteryKey('math',skill,2)]||null):null,
      grade3:skill?state.skillEvidence[learningMasteryKey('math',skill,3)]||null:null,
      logged:state.answerLog.at(-1)
    }),realOtherGradeScope.skill);
    assert.equal(gradeWrite.profile,2);
    assert.equal(gradeWrite.grade2,grade2Before,'working grade 3 must not modify grade-2 mastery');
    assert.ok(gradeWrite.grade3&&gradeWrite.grade3.attempts>=1,'working grade 3 should write grade-3 evidence');
    assert.equal(Number(gradeWrite.logged.grade),3);
    assert.notEqual(gradeWrite.logged.countsForLearning,false);

    // Geography uses its selected journey grade for content rules while the profile remains untouched.
    await page.evaluate(()=>{state.activeSession=null;sessionQuestions=[];currentAnswered=null;setJourneyViewGrade('geography',4,false);saveState();renderGeographyContinue();showScreen('geography')});
    await page.locator('#geography-screen.active').waitFor();
    assert.equal(await page.locator('#geo-journey-grade-strip [data-journey-grade]').count(),10);
    const geoSelected=await page.evaluate(()=>({
      profile:currentGrade(),view:journeyViewGrade('geography'),
      active:document.querySelector('#geo-journey-grade-strip .journey-grade-choice.active')?.dataset.journeyGrade,
      next:geoJourneyRecommendedNode(journeyViewGrade('geography'))
    }));
    assert.equal(geoSelected.profile,2);
    assert.equal(geoSelected.view,4);
    assert.equal(geoSelected.active,'4');
    assert.ok(geoSelected.next&&geoSelected.next.grade===4,'geography should recommend from selected grade 4');
    await page.evaluate(id=>startGeoJourneyNode(id),geoSelected.next.id);
    await page.locator('#session-screen.active').waitFor();
    const geoOtherGradeScope=await page.evaluate(()=>({profile:currentGrade(),view:journeyViewGrade('geography'),grade:sessionScope.journeyGrade,count:sessionQuestions.length}));
    assert.equal(geoOtherGradeScope.profile,2);
    assert.equal(geoOtherGradeScope.view,4);
    assert.equal(geoOtherGradeScope.grade,4);
    assert.equal(geoOtherGradeScope.count,5);

    await page.evaluate(()=>{
      state.activeSession=null;sessionQuestions=[];currentAnswered=null;
      ensureJourneyState();state.journey.viewGrades={};
      state.profile.grade=2;saveState();setTab('home');
    });

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


    // Simulate a fully completed grade-2 core journey and verify the global 4/4 rounded state.
    const rounded=await page.evaluate(()=>{
      state.profile.grade=2;ensureJourneyState();
      for(const subject of ['norwegian','math','english']){
        const model=journeyModel(subject,2);
        for(const node of model.nodes.filter(n=>n.type==='skill')){
          for(const skill of node.skills)state.skillMastery[learningMasteryKey(subject,skill,2)]=2;
        }
        for(const cp of model.nodes.filter(n=>n.type==='checkpoint')){
          state.journey.nodes[journeyNodeKey(subject,2,cp.id)]={passed:true,best:5,attempts:1};
        }
      }
      const geo=geoJourneyModel(2);
      for(const node of geo.nodes.filter(n=>n.type==='geo-skill')){
        const eligible=node.ids.filter(id=>questionTypesForCountry(id,true).includes(node.geoType));
        const need=Math.max(1,Math.min(node.target||1,eligible.length));
        for(const id of eligible.slice(0,need))state.mastery[masteryKey(id,node.geoType)]=2;
      }
      for(const cp of geo.nodes.filter(n=>n.type==='checkpoint')){
        state.journey.nodes[journeyNodeKey('geography',2,cp.id)]={passed:true,best:5,attempts:1};
      }
      saveState();renderAll();setTab('progress');
      const overview=gradeJourneyOverview(2);
      return {done:overview.done,total:overview.total,complete:overview.complete};
    });
    assert.equal(rounded.done,4);
    assert.equal(rounded.total,4);
    assert.equal(rounded.complete,true);
    await page.locator('#progress-screen.active').waitFor();
    assert.equal((await page.locator('#grade-round-score').textContent()).trim(),'4/4');
    assert.match(await page.locator('#grade-round-title').textContent(),/rundet/i);

    assert.deepEqual(errors,[]);
    console.log('laer-litt-mer browser QA passed');
  }finally{
    await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);process.exit(1)});
