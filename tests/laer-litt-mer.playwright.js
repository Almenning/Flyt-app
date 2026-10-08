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
      // The dedicated Basecamp performance gate still enforces <900 ms. This broad
      // regression suite allows modest shared-runner scheduling jitter while still
      // catching a real one-second-class regression.
      assert.ok(screenSwitchMs<1200,'Home -> Globe screen switch too slow in broad regression: '+screenSwitchMs+'ms');

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

    // Prompt 15: profile, one-screen onboarding, grade adaptation and parent trust.
    {
      const profileCases=[
        {label:'phone',viewport:{width:390,height:844},avatar:'girl',name:'Mina',grade:2,band:'grade-band-young'},
        {label:'ipad',viewport:{width:820,height:1180},avatar:'boy',name:'Noah',grade:7,band:'grade-band-older'}
      ];
      for(const cfg of profileCases){
        const ctx=await browser.newContext({viewport:cfg.viewport,isMobile:cfg.label==='phone',hasTouch:true,serviceWorkers:'block'});
        const p=await ctx.newPage();
        await p.route('https://raw.githubusercontent.com/**',r=>r.fulfill({status:200,contentType:'application/json',body:'{"type":"FeatureCollection","features":[]}'}));
        await p.route('https://api.worldbank.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[{},[]]'}));
        await p.goto(url+'?app=laria&prompt15='+cfg.label,{waitUntil:'domcontentloaded'});
        await p.locator('#onboarding.show').waitFor();
        assert.equal(await p.locator('#onboarding').getAttribute('data-profile-release'),'profile-rc1',cfg.label+' onboarding release drifted');
        assert.equal(await p.locator('.onboard-step').count(),1,cfg.label+' onboarding must remain one deliberate setup screen');
        assert.equal(await p.locator('.avatar-choice-card').count(),2,cfg.label+' must offer revegutt and revejente');
        assert.equal(await p.locator('.grade-btn').count(),10,cfg.label+' must offer grades 1-10');
        const fit=await p.evaluate(()=>{
          const card=document.querySelector('.onboarding-card').getBoundingClientRect();
          return {vw:innerWidth,scrollWidth:document.documentElement.scrollWidth,left:card.left,right:card.right};
        });
        assert.ok(fit.scrollWidth<=fit.vw+1,cfg.label+' onboarding creates horizontal overflow: '+JSON.stringify(fit));
        assert.ok(fit.left>=-1&&fit.right<=fit.vw+1,cfg.label+' onboarding card exceeds viewport: '+JSON.stringify(fit));
        const gradeTargets=await p.locator('.grade-btn').evaluateAll(els=>els.map(e=>e.getBoundingClientRect().height));
        assert.ok(gradeTargets.every(h=>h>=44),cfg.label+' onboarding has undersized grade target: '+gradeTargets.join(','));

        await p.locator('.avatar-choice-card[data-avatar="'+cfg.avatar+'"]').click();
        await p.locator('#profile-name').fill(cfg.name);
        await p.locator('.grade-btn[data-grade="'+cfg.grade+'"]').click();
        await p.locator('#profile-next').click();
        await p.locator('#home-screen.active').waitFor();
        const profile=await p.evaluate(()=>({
          profile:state.profile,
          appClass:document.querySelector('.app').className,
          greeting:document.getElementById('home-greeting')?.textContent||'',
          avatar:document.querySelector('.avatar')?.dataset.profileAvatar||null,
          gradeLabel:document.getElementById('home-grade-label')?.textContent||''
        }));
        assert.equal(profile.profile.name,cfg.name,cfg.label+' profile name did not persist');
        assert.equal(profile.profile.avatar,cfg.avatar,cfg.label+' profile avatar did not persist');
        assert.equal(Number(profile.profile.grade),cfg.grade,cfg.label+' profile grade did not persist');
        assert.equal(profile.profile.setupVersion,2,cfg.label+' profile setup version changed unexpectedly');
        assert.ok(profile.appClass.includes(cfg.band),cfg.label+' wrong grade design band: '+profile.appClass);
        assert.match(profile.greeting,new RegExp(cfg.name),cfg.label+' Home does not reuse profile name');
        assert.equal(profile.avatar,cfg.avatar,cfg.label+' Home does not reuse selected fox');
        assert.equal(profile.gradeLabel,cfg.grade+'. klasse',cfg.label+' Home grade label drifted');

        await p.reload({waitUntil:'domcontentloaded'});
        await p.locator('#home-screen.active').waitFor();
        assert.equal(await p.locator('#onboarding').isVisible(),false,cfg.label+' repeated onboarding after completed profile');
        assert.equal(await p.locator('.avatar').getAttribute('data-profile-avatar'),cfg.avatar,cfg.label+' avatar changed after reload');
        assert.match(await p.locator('#home-greeting').textContent(),new RegExp(cfg.name),cfg.label+' name changed after reload');

        if(cfg.label==='phone'){
          const pwa=await p.evaluate(async()=>{
            const manifest=await fetch('./manifest.webmanifest',{cache:'no-store'}).then(r=>r.json());
            return {
              title:document.title,
              appleTitle:document.querySelector('meta[name="apple-mobile-web-app-title"]')?.content||'',
              icon:document.querySelector('link[rel="icon"]')?.getAttribute('href')||'',
              iconText:await fetch('./icon.svg',{cache:'no-store'}).then(r=>r.text()),
              manifest,
              visibleText:document.body.innerText
            };
          });
          assert.equal(pwa.title,'Læria','visible document title drifted');
          assert.equal(pwa.appleTitle,'Læria','Apple PWA title drifted');
          assert.equal(pwa.manifest.name,'Læria','manifest name drifted');
          assert.equal(pwa.manifest.short_name,'Læria','manifest short name drifted');
          assert.match(String(pwa.manifest.icons?.[0]?.src||''),/icon\.svg$/,'manifest icon drifted');
          assert.equal(pwa.icon,'./icon.svg','visible favicon drifted');
          assert.match(pwa.iconText,/aria-label="Læria"/,'app icon accessibility name drifted');
          assert.doesNotMatch(pwa.iconText,/Lær litt mer|Lære litt mer/i,'old product name remains in app icon');
          assert.doesNotMatch(pwa.visibleText,/\bFlyt\b|Lære litt mer/i,'old product name remains visible in Læria');

          await p.locator('.bc12').waitFor();
          const homeFox=p.locator('.bc12-fox');
          assert.equal(await homeFox.getAttribute('data-avatar'),'girl','Basecamp fox did not follow saved revejente choice');
          assert.ok((await homeFox.evaluate(el=>getComputedStyle(el,'::after').content)).includes('✿'),'Basecamp revejente has no visible profile marker');

          await p.evaluate(()=>openGlobe('explore'));
          await p.locator('#world-screen.active').waitFor();
          const globeHeader=p.locator('.premium-globe-header');
          const globeFox=p.locator('.premium-globe-fox');
          await globeFox.waitFor();
          assert.equal(await globeHeader.getAttribute('data-avatar'),'girl','Kloden header did not follow saved revejente choice');
          assert.equal(await globeFox.getAttribute('data-avatar'),'girl','Kloden fox did not follow saved revejente choice');
          assert.ok((await globeHeader.evaluate(el=>getComputedStyle(el,'::after').content)).includes('✿'),'Kloden revejente has no visible profile marker');

          await p.evaluate(()=>setTab('home'));
          await p.locator('#home-screen.active .bc12').waitFor();
          await p.evaluate(()=>openSubject('norwegian'));
          await p.locator('#subject-screen.active').waitFor();
          const traveler=p.locator('#subject-screen.active .bok-v15-traveler');
          await traveler.waitFor({state:'visible'});
          const travelerImg=traveler.locator('.bok-v15-fox');
          await travelerImg.waitFor({state:'visible'});
          const travelerSrc=await travelerImg.getAttribute('src');
          const expectedTravelerSrc=await p.evaluate(()=>window.LARIA_PROFILE_AVATARS?.girl||'./lia-fox-explorer-home.webp');
          assert.equal(travelerSrc,expectedTravelerSrc,'Bokskogen traveler did not render the saved revejente artwork');

          await p.evaluate(()=>{
            sessionScope={type:'subject',subject:'norwegian',module:'reading',label:'Norsk',grade:2};
            sessionQuestions=[choiceQuestion('norwegian','vocabulary','Hva ser du?','katt',['katt','hund','mus'],{visual:'🐱'})];
            qIndex=0;sessionCorrect=0;sessionStrengthened=new Set();currentAnswered=null;
            showScreen('session');renderQuestion();
          });
          await p.locator('#session-screen.active').waitFor();
          const taskFox=p.locator('.task-fox-companion');
          await taskFox.waitFor();
          assert.equal(await taskFox.getAttribute('data-avatar'),'girl','Oppgavescene fox did not follow saved revejente choice');
          const taskMarker=taskFox.locator('.task-profile-marker');
          await taskMarker.waitFor({state:'visible'});
          assert.equal((await taskMarker.textContent()).trim(),'✿','Oppgavescene revejente has no visible profile marker');
          await p.evaluate(()=>{state.activeSession=null;currentAnswered=null;setTab('home')});
          await p.locator('#home-screen.active .bc12').waitFor();
        }

        await p.evaluate(()=>openAdult());
        await p.locator('#adult-screen.active').waitFor();
        assert.equal(await p.locator('#adult-screen').getAttribute('data-parent-trust-release'),'parent-trust-rc1');
        assert.equal((await p.locator('#adult-profile-name').textContent()).trim(),cfg.name);
        assert.equal((await p.locator('#adult-profile-avatar').textContent()).trim(),cfg.avatar==='girl'?'Revejente':'Revegutt');
        assert.doesNotMatch(await p.locator('#adult-screen').innerText(),/tidlig test|vennetest/i,'parent area still exposes prototype language');
        await p.locator('#open-parent-info').click();
        await p.locator('#parent-info-screen.active').waitFor();
        assert.equal(await p.locator('#parent-info-screen').getAttribute('data-parent-trust-release'),'parent-trust-rc1');
        const parentText=await p.locator('#parent-info-screen .parent-letter').innerText();
        assert.match(parentText,/Skjermtid med et formål/i);
        assert.match(parentText,/LK20/i);
        assert.match(parentText,/supplement, ikke en erstatning/i);
        assert.match(parentText,/ingen annonser eller sporing/i);
        assert.match(parentText,/ikke utviklet, godkjent eller anbefalt av Utdanningsdirektoratet/i);
        assert.equal(await p.locator('.parent-source-link[href="https://www.udir.no/lk20/"]').getAttribute('href'),'https://www.udir.no/lk20/');

        const gradeBands=await p.evaluate(()=>{
          const expected={1:'grade-band-young',3:'grade-band-middle',6:'grade-band-older',9:'grade-band-teen'};
          return Object.entries(expected).map(([grade,want])=>{
            state.profile.grade=Number(grade);renderAll();
            return {grade:Number(grade),want,actual:[...document.querySelector('.app').classList].find(x=>x.startsWith('grade-band-'))||''};
          });
        });
        for(const item of gradeBands)assert.equal(item.actual,item.want,cfg.label+' grade '+item.grade+' mapped to wrong design band');
        await ctx.close();
      }

      // Existing users who are upgraded into profile setup keep learning data and an unfinished session.
      const migrationSeed={
        version:7,progressSchemaVersion:3,
        profile:{grade:2,onboarded:true,name:'',avatar:null,setupVersion:0},
        mastery:{'no:flag':2},mistakes:{},skillMastery:{'math:g2:addition':1},skillMistakes:{},skillLastSeen:{},
        masteryEvidence:{},skillEvidence:{},preferences:{sound:true,autoRead:false},lastMilestone:null,recentCountryWin:null,
        lastActivity:{kind:'subject',subject:'math',label:'Matte'},
        journey:{nodes:{'math:g2:legacy':{passed:true,best:4,attempts:1}},gradeWins:{},viewGrades:{}},
        answerLog:[{at:1700000000000,subject:'math',skill:'addition',grade:2,type:'learning-choice',questionKey:'legacy-q',correct:true,countsForLearning:true}],
        sessionLog:[{endedAt:1700000001000,total:5,correct:4,countsTowardGoal:true,activityKey:'legacy-session'}],
        activeSession:{
          questions:[{subject:'math',skill:'addition',type:'learning-choice',prompt:'1 + 1 = ?',answer:'2',options:['2','3'],curriculum:'MAT01-06'}],
          qIndex:0,correct:0,strengthened:[],answered:null,
          scope:{type:'subject',subject:'math',label:'Matte',grade:2},startedAt:1700000002000
        }
      };
      const migrationContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
      const migrationPage=await migrationContext.newPage();
      await migrationPage.addInitScript(seed=>{
        const marker='prompt15-migration-seeded';
        if(localStorage.getItem(marker)==='1')return;
        localStorage.setItem('laerlittmer-v2',JSON.stringify(seed));
        localStorage.setItem(marker,'1');
      },migrationSeed);
      await migrationPage.route('https://raw.githubusercontent.com/**',r=>r.fulfill({status:200,contentType:'application/json',body:'{"type":"FeatureCollection","features":[]}'}));
      await migrationPage.route('https://api.worldbank.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[{},[]]'}));
      await migrationPage.goto(url+'?app=laria&prompt15=migration',{waitUntil:'domcontentloaded'});
      await migrationPage.locator('#onboarding.show').waitFor();
      assert.equal(await migrationPage.locator('.grade-btn[data-grade="2"]').getAttribute('aria-pressed'),'true','existing grade was not preselected during profile migration');
      await migrationPage.locator('.avatar-choice-card[data-avatar="girl"]').click();
      await migrationPage.locator('#profile-name').fill('Mira');
      await migrationPage.locator('#profile-next').click();
      await migrationPage.locator('#home-screen.active').waitFor();
      const migrated=await migrationPage.evaluate(()=>({
        profile:state.profile,
        mastery:state.mastery['no:flag'],
        skill:state.skillMastery['math:g2:addition'],
        answers:state.answerLog.length,
        sessions:state.sessionLog.length,
        journey:state.journey.nodes['math:g2:legacy'],
        activeSubject:state.activeSession?.scope?.subject||null,
        activeCount:Array.isArray(state.activeSession?.questions)?state.activeSession.questions.length:0
      }));
      assert.equal(migrated.profile.name,'Mira');
      assert.equal(migrated.profile.avatar,'girl');
      assert.equal(migrated.profile.grade,2);
      assert.equal(migrated.mastery,2,'profile migration lost geography mastery');
      assert.equal(migrated.skill,1,'profile migration lost subject mastery');
      assert.equal(migrated.answers,1,'profile migration lost answer history');
      assert.equal(migrated.sessions,1,'profile migration lost session history');
      assert.equal(migrated.journey.passed,true,'profile migration lost journey state');
      assert.equal(migrated.activeSubject,'math','profile migration discarded unfinished session');
      assert.equal(migrated.activeCount,1,'profile migration changed unfinished session questions');

      await migrationPage.reload({waitUntil:'domcontentloaded'});
      await migrationPage.locator('#home-screen.active').waitFor();
      assert.equal(await migrationPage.locator('#onboarding').isVisible(),false,'migrated profile was not remembered');
      await migrationPage.evaluate(()=>openAdult());
      await migrationPage.locator('#adult-grade').selectOption('8');
      const afterGradeChange=await migrationPage.evaluate(()=>({
        grade:state.profile.grade,name:state.profile.name,avatar:state.profile.avatar,
        answers:state.answerLog.length,sessions:state.sessionLog.length,mastery:state.mastery['no:flag'],
        band:[...document.querySelector('.app').classList].find(x=>x.startsWith('grade-band-'))||''
      }));
      assert.equal(afterGradeChange.grade,8);
      assert.equal(afterGradeChange.name,'Mira');
      assert.equal(afterGradeChange.avatar,'girl');
      assert.equal(afterGradeChange.answers,1,'grade change erased answer history');
      assert.equal(afterGradeChange.sessions,1,'grade change erased session history');
      assert.equal(afterGradeChange.mastery,2,'grade change erased mastery');
      assert.equal(afterGradeChange.band,'grade-band-teen','grade change did not apply teen design band');
      await migrationContext.close();
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

    // Prompt 14: every Lek & utforsk destination is a replayable place with one consistent
    // Basecamp -> activity -> Basecamp route. Free exploration must not mutate graded progress.
    const exploreProgressBefore=await page.evaluate(()=>JSON.stringify({
      answerLog:state.answerLog,sessionLog:state.sessionLog,skillMastery:state.skillMastery,mastery:state.mastery
    }));

    await page.locator('.bc12-place[data-camp="globe"]').click();
    await page.locator('#world-screen.active').waitFor();
    assert.equal(await page.locator('#world-screen').getAttribute('data-explore-release'),'explore-rc1');
    await page.locator('#world-back').click();
    await page.locator('#home-screen.active .bc12').waitFor();

    await page.locator('.bc12-place[data-camp="fraction"]').click();
    await page.locator('#fraction-lab-screen.active').waitFor();
    assert.equal(await page.locator('#fraction-lab-screen').getAttribute('data-explore-release'),'explore-rc1');
    assert.equal(await page.locator('.fr2-home-card.fr2-card-explore').isVisible(),true);
    await page.locator('#fraction-lab-back').click();
    await page.locator('#home-screen.active .bc12').waitFor();

    await page.locator('.bc12-place[data-camp="multiply"]').click();
    await page.locator('#multiplication-lab-screen.active').waitFor();
    assert.equal(await page.locator('#multiplication-lab-screen').getAttribute('data-explore-release'),'explore-rc1');
    assert.equal(await page.locator('.mp-menu-explore').isVisible(),true);
    await page.locator('#multiplication-lab-back').click();
    await page.locator('#home-screen.active .bc12').waitFor();

    await page.locator('.bc12-place[data-camp="words"]').click();
    const wordHunt=page.locator('#word-hunt-overlay');
    await wordHunt.waitFor({state:'visible'});
    assert.equal(await wordHunt.getAttribute('data-explore-release'),'explore-rc1');
    assert.equal(await page.locator('.word-hunt-word').count(),4);
    const wordHuntFit=await page.evaluate(()=>{
      const root=document.getElementById('word-hunt-overlay'),shell=root.querySelector('.word-hunt-shell'),board=root.querySelector('.word-hunt-board');
      const rr=root.getBoundingClientRect(),sr=shell.getBoundingClientRect(),br=board.getBoundingClientRect();
      return {viewport:window.innerWidth,documentWidth:document.documentElement.scrollWidth,rootLeft:rr.left,rootRight:rr.right,shellLeft:sr.left,shellRight:sr.right,boardLeft:br.left,boardRight:br.right};
    });
    assert.ok(wordHuntFit.documentWidth<=wordHuntFit.viewport+1,'Ordjakt creates horizontal page overflow: '+JSON.stringify(wordHuntFit));
    assert.ok(wordHuntFit.shellLeft>=-1&&wordHuntFit.shellRight<=wordHuntFit.viewport+1,'Ordjakt shell exceeds portrait viewport: '+JSON.stringify(wordHuntFit));
    assert.ok(wordHuntFit.boardLeft>=wordHuntFit.shellLeft-1&&wordHuntFit.boardRight<=wordHuntFit.shellRight+1,'Ordjakt board exceeds its shell: '+JSON.stringify(wordHuntFit));
    const firstWordRound=await page.locator('.word-hunt-word').allTextContents().then(xs=>xs.map(x=>x.replace(/^✓\s*/,'').trim()));
    await page.locator('.word-hunt-new').click();
    const secondWordRound=await page.locator('.word-hunt-word').allTextContents().then(xs=>xs.map(x=>x.replace(/^✓\s*/,'').trim()));
    assert.equal(firstWordRound.filter(w=>secondWordRound.includes(w)).length,0,'Ordjakt immediately repeated a target word in the next round');
    await page.locator('[data-word-level="hard"]').click();
    assert.equal(await page.locator('.word-hunt-word').count(),5);
    const hardCellHeights=await page.locator('.word-hunt-cell').evaluateAll(els=>els.map(e=>e.getBoundingClientRect().height));
    assert.ok(hardCellHeights.every(h=>h>=44),'small Ordjakt touch target in portrait: '+hardCellHeights.join(','));
    await page.locator('.word-hunt-back').click();
    await page.locator('#home-screen.active .bc12').waitFor();
    assert.equal(await wordHunt.isHidden(),true);

    const exploreProgressAfter=await page.evaluate(()=>JSON.stringify({
      answerLog:state.answerLog,sessionLog:state.sessionLog,skillMastery:state.skillMastery,mastery:state.mastery
    }));
    assert.equal(exploreProgressAfter,exploreProgressBefore,'Lek & utforsk navigation changed graded progress');

    // Free-play places never disappear because the child has mastered academic content.
    // Keep this synthetic mastery isolated so later journey tests see the real pre-test state.
    const beforeSyntheticMastery=await page.evaluate(()=>JSON.stringify(state));
    await page.evaluate(()=>{
      const now=Date.now(),yesterday=now-86400000,today=evidenceDay(now),prev=evidenceDay(yesterday);
      for(const subject of ['norwegian','math','english']){
        for(const q of subjectPoolForGrade(subject,currentGrade(),null)){
          const key=learningMasteryKey(subject,q.skill,currentGrade());
          state.skillMastery[key]=2;
          state.skillEvidence[key]={attempts:4,correctCount:4,wrongCount:0,lastAttemptAt:now,lastCorrectAt:now,days:[prev,today],correctDays:[prev,today],variants:['a','b']};
        }
      }
      for(const id of gradeScopeIds()){
        for(const type of questionTypesForCountry(id,true)){
          state.mastery[masteryKey(id,type)]=2;
          state.masteryEvidence[masteryKey(id,type)]={attempts:4,correctCount:4,wrongCount:0,lastAttemptAt:now,lastCorrectAt:now,days:[prev,today],correctDays:[prev,today],variants:['a','b']};
        }
      }
      saveState();setTab('home');
    });
    for(const action of ['globe','fraction','words','multiply']){
      const place=page.locator('.bc12-place[data-camp="'+action+'"]');
      assert.equal(await place.isVisible(),true,'mastery hid free-play place: '+action);
      assert.equal(await place.isEnabled(),true,'mastery disabled free-play place: '+action);
    }
    await page.evaluate(saved=>{
      state=JSON.parse(saved);saveState();setTab('home');
    },beforeSyntheticMastery);

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
    // Brøklaben premium remains an open discovery experience, never a graded school quiz.
    assert.equal(await page.locator('#math-lab-entry').isVisible(),true);
    const labBefore=await page.evaluate(()=>({goal:dailyGoal().done,answers:subjectAnswered('math')}));
    await page.locator('#open-fraction-lab').click();
    await page.locator('#fraction-lab-screen.active').waitFor();
    assert.equal(await page.locator('#fraction-lab-screen').getAttribute('data-explore-release'),'explore-rc1');
    assert.equal((await page.locator('.fr2-sign h1').first().textContent()).trim(),'Brøklaben');
    assert.equal(await page.locator('.fr2-home-card').count(),6);
    const fractionFit=await page.evaluate(()=>{
      const screen=document.querySelector('#fraction-lab-screen'),shell=document.querySelector('.fr2-shell');
      const sr=screen.getBoundingClientRect(),br=shell.getBoundingClientRect();
      return {viewport:innerWidth,width:document.documentElement.scrollWidth,screenLeft:sr.left,screenRight:sr.right,boardLeft:br.left,boardRight:br.right};
    });
    assert.ok(fractionFit.width<=fractionFit.viewport+1,'Brøklaben horizontal overflow: '+JSON.stringify(fractionFit));
    assert.ok(fractionFit.boardLeft>=fractionFit.screenLeft-1&&fractionFit.boardRight<=fractionFit.viewport+1,'Brøklaben exceeds phone: '+JSON.stringify(fractionFit));
    await page.locator('.fr2-card-explore').click();
    assert.equal(await page.locator('.fr2-view').count(),4);
    await page.locator('[data-fr-action="preset"][data-n="1"][data-d="2"]').click();
    assert.deepEqual(await page.evaluate(()=>[LARIA_FRACTION_PREMIUM.snapshot().explore.n,LARIA_FRACTION_PREMIUM.snapshot().explore.d]),[1,2]);
    await page.locator('[data-fr-action="view"][data-view="grid"]').click();
    assert.equal(await page.locator('.fr2-block-grid span').count(),2);
    await page.locator('[data-fr-action="view"][data-view="glass"]').click();
    assert.equal(await page.locator('.fr2-glass').count(),1);
    await page.locator('.fr2-nav-item[data-page="build"]').click();
    await page.locator('[data-fr-action="reset"]').click();
    await page.locator('[data-fr-action="add"]').first().click();
    assert.equal((await page.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot())).build.n,1);
    await page.locator('.fr2-pie-builder path[data-fr-action="piece"][data-piece="2"]').click();
    assert.equal((await page.evaluate(()=>LARIA_FRACTION_PREMIUM.snapshot())).build.n,3);
    await page.locator('.fr2-nav-item[data-page="home"]').click();
    await page.locator('.fr2-card-equal').click();
    assert.equal(await page.locator('.fr2-pie-compare').count(),2);
    await page.locator('[data-fr-action="guess"][data-guess="equal"]').click();
    assert.match(await page.locator('.fr2-feedback').innerText(),/Du fant det/);
    await page.locator('.fr2-nav-item[data-page="home"]').click();
    await page.locator('.fr2-card-sort').click();
    assert.equal(await page.locator('.fr2-sort-card').count(),3);
    await page.locator('[data-fr-action="sort-shift"][data-position="0"][data-direction="1"]').click();
    await page.locator('[data-fr-action="sort-shift"][data-position="1"][data-direction="1"]').click();
    await page.locator('[data-fr-action="sort-check"]').click();
    assert.match(await page.locator('.fr2-feedback').innerText(),/sorterte riktig/);
    await page.locator('.fr2-nav-item[data-page="home"]').click();
    await page.locator('.fr2-card-convert').click();
    assert.match(await page.locator('.fr2-conversion-row').innerText(),/50 %/);
    assert.match(await page.locator('.fr2-conversion-row').innerText(),/0,5/);
    await page.locator('[data-fr-action="convert-example"][data-example="1"]').click();
    assert.match(await page.locator('.fr2-conversion-row').innerText(),/0,25/);
    await page.locator('.fr2-nav-item[data-page="mastery"]').click();
    assert.equal(await page.locator('.fr2-master-tile').count(),5);
    assert.ok(Object.keys((await page.evaluate(()=>LARIA_FRACTION_PREMIUM.progress())).built).length>0);
    const fractionTouchHeights=await page.locator('.fr2-adjust-btn,.fr2-nav-item,.fr2-sort-arrow').evaluateAll(els=>els.map(e=>e.getBoundingClientRect().height));
    assert.ok(fractionTouchHeights.every(h=>h>=44),'small Brøklaben touch target: '+fractionTouchHeights.join(','));
    await page.locator('.fr2-nav-item[data-page="home"]').click();
    await page.locator('#fraction-lab-back').click();
    await page.locator('#subject-screen.active').waitFor();
    const labAfter=await page.evaluate(()=>({goal:dailyGoal().done,answers:subjectAnswered('math')}));
    assert.deepEqual(labAfter,labBefore,'Brøklab exploration must not count as a completed test or graded answer');
    assert.equal(await page.locator('#subject-title').textContent(),'Matte');

    // Premium gangetabell: every table remains open, short practice is guided,
    // and free visual exploration never masquerades as a completed school test.
    assert.equal(await page.locator('#open-multiplication-lab').isVisible(),true);
    const multBefore=await page.evaluate(()=>({goal:dailyGoal().done,answers:subjectAnswered('math')}));
    await page.locator('#open-multiplication-lab').click();
    await page.locator('#multiplication-lab-screen.active').waitFor();
    assert.equal((await page.locator('.mp-heading h1').first().textContent()).trim(),'Gangetabellen');
    const multPortraitFit=await page.evaluate(()=>{
      const screen=document.querySelector('#multiplication-lab-screen');
      const shell=document.querySelector('.mp-shell');
      const sr=screen.getBoundingClientRect(),hr=shell.getBoundingClientRect();
      return {viewport:window.innerWidth,documentWidth:document.documentElement.scrollWidth,screenLeft:sr.left,screenRight:sr.right,shellLeft:hr.left,shellRight:hr.right};
    });
    assert.ok(multPortraitFit.documentWidth<=multPortraitFit.viewport+1,'Gangetabellen creates horizontal overflow: '+JSON.stringify(multPortraitFit));
    assert.ok(multPortraitFit.screenLeft>=-1&&multPortraitFit.screenRight<=multPortraitFit.viewport+1,'Gangetabellen screen exceeds phone viewport: '+JSON.stringify(multPortraitFit));
    assert.ok(multPortraitFit.shellLeft>=multPortraitFit.screenLeft-1&&multPortraitFit.shellRight<=multPortraitFit.screenRight+1,'Gangetabellen shell exceeds viewport: '+JSON.stringify(multPortraitFit));
    assert.equal(await page.locator('.mp-menu-card').count(),3);
    await page.locator('.mp-menu-choose').click();
    assert.equal(await page.locator('.mp-table-choice').count(),10,'tables 1–10 must all be available');
    assert.equal(await page.locator('.mp-table-choice[data-table="11"]').count(),0);
    await page.locator('.mp-table-choice[data-table="5"]').first().click();
    const selectedRound=await page.evaluate(()=>window.LARIA_MULT_PREMIUM.snapshot());
    assert.equal(selectedRound.round.length,8);
    assert.ok(selectedRound.round.every(q=>q.a===5),'selected 5-gangen was not used');
    assert.equal(await page.locator('.mp-apple-basket').count(),selectedRound.round[0].a);
    assert.equal(await page.locator('.mp-apple').count(),selectedRound.round[0].a*selectedRound.round[0].b);
    const answer=selectedRound.round[0].a*selectedRound.round[0].b;
    await page.locator('.mp-answer[data-value="'+answer+'"]').click();
    assert.match(await page.locator('.mp-answer-feedback').innerText(),/Helt riktig/i);
    await page.locator('.mp-next').click();
    await page.locator('.mp-nav-link[data-page="explore"]').click();
    assert.equal(await page.locator('.mp-explore-tab').first().getAttribute('data-mode'),'table','table must be the first mode');
    assert.equal(await page.locator('.mp-explore-tab').first().getAttribute('aria-pressed'),'true','opening Utforsk must automatically show the table');
    assert.equal(await page.locator('.mp-times-grid tbody tr').count(),10);
    assert.equal(await page.locator('.mp-grid-cell').count(),100);
    await page.locator('[data-mp-action="mode"][data-mode="groups"]').click();
    for(let i=0;i<3;i++)await page.locator('[data-mp-action="factor"][data-factor="a"][data-step="1"]').click();
    for(let i=0;i<5;i++)await page.locator('[data-mp-action="factor"][data-factor="b"][data-step="1"]').click();
    assert.match(await page.locator('.mp-math-result').innerText(),/7 × 8/);
    await page.locator('[data-mp-action="mode"][data-mode="array"]').click();
    assert.equal(await page.locator('.mp-mini-array i').count(),56);
    await page.locator('[data-mp-action="mode"][data-mode="swap"]').click();
    assert.equal(await page.locator('.mp-swap-pair .mp-mini-array').count(),2);
    await page.locator('[data-mp-action="mode"][data-mode="patterns"]').click();
    assert.equal(await page.locator('.mp-pattern-grid>div').count(),10);
    await page.locator('[data-mp-action="mode"][data-mode="table"]').click();
    assert.equal(await page.locator('.mp-times-grid .mp-grid-cell').count(),100);
    await page.locator('[data-mp-action="cell"][data-row="4"][data-col="6"]').click();
    assert.match(await page.locator('.mp-table-inspector').innerText(),/4 × 6 = 24/);
    assert.match(await page.locator('.mp-table-inspector').innerText(),/6 × 4 = 24/);
    assert.doesNotMatch(await page.locator('.mp-table-inspector').innerText(),/2 × 12/,'factor pairs must stay inside the 10x10 table');
    assert.match(await page.locator('.mp-table-inspector').innerText(),/3 × 8/);
    assert.match(await page.locator('.mp-table-inspector').innerText(),/8 × 3/);
    assert.ok(await page.locator('.mp-grid-cell.same').count()>=3);
    const multTouchHeights=await page.locator('.mp-pair,.mp-grid-cell,.mp-factor-adjust button').evaluateAll(els=>els.map(e=>e.getBoundingClientRect().height));
    assert.ok(multTouchHeights.every(h=>h>=44),'small multiplication touch target: '+multTouchHeights.join(','));
    await page.locator('.mp-nav-link[data-page="home"]').click();
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
    assert.deepEqual(await page.evaluate(()=>CURRICULUM),{norwegian:'NOR01-08',math:'MAT01-06',english:'ENG01-06'},'active curriculum references drifted from the verified Udir plans');
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
    await p1.locator('.bc12-place[data-camp="globe"]').click();
    await p1.locator('#geography-screen.active').waitFor();
    assert.equal(await p1.locator('.geo-theme[data-geo-theme="capital"]').isVisible(),false);
    // Explicitly choose Land and wait for the geographic view before starting.
    // An earlier test clicked the theme button during the screen transition.
    await p1.locator('.geo-theme[data-geo-theme="country"]').click();
    assert.match(await p1.locator('#start-geography-theme').innerText(),/Start Land/);
    await p1.locator('#start-geography-theme').click();
    const gradeOneStarted=await p1.locator('#session-screen.active').waitFor({timeout:12000}).then(()=>true).catch(()=>false);
    if(!gradeOneStarted){
      const diagnosis=await p1.evaluate(()=>({
        screen:typeof activeScreenName==='function'?activeScreenName():null,
        grade:typeof currentGrade==='function'?currentGrade():null,
        theme:typeof geoTheme==='string'?geoTheme:null,
        countryIds:typeof gradeScopeIds==='function'?gradeScopeIds():[],
        pool:typeof gradeScopeIds==='function'&&typeof questionPool==='function'?questionPool(gradeScopeIds(),true,true).length:null,
        sessionCount:typeof sessionQuestions!=='undefined'?sessionQuestions.length:null,
        activeSession:state?.activeSession||null,
        onboarding:document.querySelector('#onboarding')?.className,
        startLabel:document.querySelector('#start-geography-theme')?.textContent
      }));
      throw new Error('First-grade geography did not open a session: '+JSON.stringify(diagnosis));
    }
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
