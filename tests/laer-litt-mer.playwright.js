'use strict';
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.resolve(__dirname,'..','laer-litt-mer');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.svg':'image/svg+xml'};

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
      for(const ch of q.answer.split('')){
        const idx=q.letters.findIndex((x,i)=>x.l===ch&&!used.has(i));
        if(idx<0)throw new Error('letter missing: '+ch);
        used.add(idx);document.querySelector(`.letter-tile[data-idx="${idx}"]`).click();
      }
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
    await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
    await page.route('https://api.worldbank.org/**',r=>r.abort());

    await onboard(page,2);
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

    // Matte: second grade should stay simple.
    await page.locator('#open-math').click();
    const mathModules=await page.locator('#subject-modules .subject-module strong').allTextContents();
    assert.deepEqual(mathModules,['Tall og regning']);
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
    await p1.route('https://raw.githubusercontent.com/**',r=>r.abort());await p1.route('https://api.worldbank.org/**',r=>r.abort());
    await onboard(p1,1);
    await p1.locator('#open-geography').click();
    assert.equal(await p1.locator('.geo-theme[data-geo-theme="capital"]').isVisible(),false);
    await p1.locator('#start-geography-theme').click();
    await p1.locator('#session-screen.active').waitFor();
    assert.equal(await p1.evaluate(()=>sessionQuestions.length),5);
    await context1.close();

    // Structural sweep: every visible subject module on every grade can build a five-question session.
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