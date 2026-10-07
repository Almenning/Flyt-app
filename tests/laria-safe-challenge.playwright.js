'use strict';
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.resolve(__dirname,'..','laer-litt-mer');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.svg':'image/svg+xml'};

function server(){
  return new Promise((resolve,reject)=>{
    const s=http.createServer((req,res)=>{
      const u=new URL(req.url,'http://127.0.0.1');
      const rel=decodeURIComponent(u.pathname).replace(/^\/+/,'')||'index.html';
      const file=path.resolve(root,rel);
      if(!file.startsWith(root)){res.writeHead(403);res.end('forbidden');return}
      fs.readFile(file,(err,data)=>{
        if(err){res.writeHead(404);res.end('not found');return}
        res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
        res.setHeader('Cache-Control','no-store');res.end(data);
      });
    });
    s.once('error',reject);s.listen(0,'127.0.0.1',()=>resolve({s,url:'http://127.0.0.1:'+s.address().port+'/'}));
  });
}
const seed=(grade,name='SecretName')=>({
  version:7,progressSchemaVersion:3,
  profile:{grade,onboarded:true,name,avatar:'boy',setupVersion:2},
  mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},
  preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,
  journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null
});
async function answerCurrent(page){
  const q=await page.evaluate(()=>{const x=sessionQuestions[qIndex];return x?JSON.parse(JSON.stringify(x)):null});
  assert.ok(q,'challenge question missing');
  if(q.subject){
    if(q.type==='learning-choice'){
      await page.locator('.answer').evaluateAll((els,answer)=>{const el=els.find(x=>x.dataset.answer===String(answer));if(!el)throw new Error('answer missing');el.click()},q.answer);
    }else if(q.type==='number-input'){
      await page.locator('#math-input').fill(String(q.answer));await page.locator('#check-number').click();
    }else if(q.type==='sequence-order'){
      await page.evaluate(()=>{
        const q=sessionQuestions[qIndex],used=new Set();
        for(const value of String(q.answer).split('|')){
          const idx=q.items.findIndex((x,i)=>String(x)===String(value)&&!used.has(i));used.add(idx);
          document.querySelector('.sequence-tile[data-idx="'+idx+'"]').click();
        }
        document.querySelector('#check-sequence').click();
      });
    }else if(q.type==='build-word'){
      await page.evaluate(()=>{
        const q=sessionQuestions[qIndex],used=new Set();
        q.answer.split('').forEach((ch,slot)=>{
          const idx=q.letters.findIndex((x,i)=>x.l===ch&&!used.has(i));used.add(idx);
          document.querySelector('.letter-slot[data-slot="'+slot+'"]').click();
          document.querySelector('.letter-tile[data-idx="'+idx+'"]').click();
        });
        document.querySelector('#check-build').click();
      });
    }else if(q.type==='sentence-order'){
      await page.evaluate(()=>{
        const q=sessionQuestions[qIndex],used=new Set();
        for(const word of q.answer.split(' ')){
          const idx=q.words.findIndex((x,i)=>x===word&&!used.has(i));used.add(idx);
          document.querySelector('.word-tile[data-idx="'+idx+'"]').click();
        }
        document.querySelector('#check-sentence').click();
      });
    }else throw new Error('unsupported subject challenge type '+q.type);
  }else if(q.type==='map'){
    await page.evaluate(()=>answerMap(sessionQuestions[qIndex].answer));
  }else{
    await page.evaluate(()=>answerText(sessionQuestions[qIndex].answer));
  }
  await page.locator('#next-question').waitFor({state:'visible'});
}
(async()=>{
  const {s,url}=await server();
  const browser=await chromium.launch({headless:true});
  try{
    const senderCtx=await browser.newContext({viewport:{width:820,height:1180},serviceWorkers:'block'});
    const sender=await senderCtx.newPage();
    await sender.addInitScript(x=>localStorage.setItem('laerlittmer-v2',JSON.stringify(x)),seed(7));
    await sender.route('https://raw.githubusercontent.com/**',r=>r.abort());
    await sender.route('https://api.worldbank.org/**',r=>r.abort());
    await sender.goto(url+'?app=laria&p16=sender',{waitUntil:'domcontentloaded'});
    await sender.waitForFunction(()=>document.documentElement.dataset.safeChallengeRelease==='challenge-rc1');

    const olderEntry=sender.locator('#safe-challenge-entry');
    await olderEntry.waitFor({state:'visible'});
    await olderEntry.click();
    await sender.locator('#safe-challenge-dialog[open]').waitFor();

    const safety=await sender.locator('#safe-challenge-dialog').innerText();
    assert.match(safety,/Fem identiske spørsmål/i);
    assert.match(safety,/Ingen chat, feed, kontaktliste eller søkbare profiler/i);
    assert.equal(await sender.locator('#safe-challenge-dialog textarea').count(),0,'challenge must not contain chat/message textarea');
    assert.equal(await sender.locator('#safe-challenge-dialog [contenteditable]').count(),0,'challenge must not contain editable social content');
    assert.equal(await sender.locator('#safe-challenge-dialog input:not([readonly])').count(),0,'challenge must not collect contact/profile data');

    await sender.locator('.sc-subject[data-subject="math"]').click();
    const senderData=await sender.evaluate(()=>{
      const p=window.LARIA_SAFE_CHALLENGE.current;
      return {payload:p,encoded:window.LARIA_SAFE_CHALLENGE.encode(p),url:document.getElementById('sc-link').value,goal:dailyGoal(),profileName:state.profile.name};
    });
    assert.equal(senderData.payload.questions.length,5,'sender must get exactly five questions');
    assert.equal(senderData.payload.subject,'math');
    assert.equal(senderData.payload.grade,7);
    assert.equal(JSON.stringify(senderData.payload).includes(senderData.profileName),false,'challenge payload leaked profile name');
    assert.ok(senderData.url.length<12000,'challenge URL unexpectedly large: '+senderData.url.length);
    assert.equal(senderData.goal.done,0,'creating a challenge changed daily goal');

    const roundTrip=await sender.evaluate(encoded=>window.LARIA_SAFE_CHALLENGE.decode(encoded),senderData.encoded);
    assert.deepEqual(roundTrip.questions,senderData.payload.questions,'encode/decode changed the five questions');

    const malicious=await sender.evaluate(()=>{
      const raw={v:1,id:'lc-malicious',grade:7,subject:'math',questions:Array.from({length:5},(_,i)=>({subject:'math',skill:'addition',type:'learning-choice',prompt:'<img src=x onerror=alert(1)> '+i,answer:'2',options:['2','3']}))};
      const bytes=new TextEncoder().encode(JSON.stringify(raw));let bin='';for(const b of bytes)bin+=String.fromCharCode(b);
      const enc=btoa(bin).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
      return window.LARIA_SAFE_CHALLENGE.decode(enc);
    });
    assert.ok(malicious,'sanitized malicious payload should remain structurally readable');
    assert.equal(malicious.questions.some(q=>q.prompt.includes('<')||q.prompt.includes('&')),false,'incoming challenge kept HTML-capable text');

    const receiverCtx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const receiver=await receiverCtx.newPage();
    await receiver.addInitScript(x=>localStorage.setItem('laerlittmer-v2',JSON.stringify(x)),seed(7,'OtherChild'));
    await receiver.route('https://raw.githubusercontent.com/**',r=>r.abort());
    await receiver.route('https://api.worldbank.org/**',r=>r.abort());
    await receiver.goto(url+'?app=laria&challenge='+encodeURIComponent(senderData.encoded),{waitUntil:'domcontentloaded'});
    await receiver.waitForFunction(()=>document.documentElement.dataset.safeChallengeRelease==='challenge-rc1');
    await receiver.locator('#safe-challenge-dialog[open]').waitFor();
    assert.match(await receiver.locator('#sc-title').textContent(),/fått en utfordring/i);

    const receiverPayload=await receiver.evaluate(()=>JSON.parse(JSON.stringify(window.LARIA_SAFE_CHALLENGE.current)));
    assert.deepEqual(receiverPayload.questions,senderData.payload.questions,'receiver did not get identical questions');
    assert.equal(receiverPayload.id,senderData.payload.id,'challenge id changed in transit');
    assert.equal(await receiver.locator('#sc-link-wrap').isVisible(),false,'incoming challenge should not expose a social composer');
    assert.equal(await receiver.locator('#sc-share').isVisible(),false,'incoming challenge should not auto-resend');

    await receiver.locator('#sc-start').click();
    await receiver.locator('#session-screen.active').waitFor();
    const started=await receiver.evaluate(()=>({
      scope:sessionScope,
      questions:JSON.parse(JSON.stringify(sessionQuestions)),
      answerCount:state.answerLog.length,
      goal:dailyGoal()
    }));
    assert.equal(started.scope.type,'challenge');
    assert.equal(started.scope.practiceOnly,true,'challenge must be practice-only');
    assert.equal(started.questions.length,5);
    assert.deepEqual(started.questions,senderData.payload.questions,'session changed shared question order/content');
    assert.equal(started.goal.done,0);

    for(let i=0;i<5;i++){
      await answerCurrent(receiver);
      await receiver.locator('#next-question').click();
    }
    await receiver.locator('#complete-screen.active').waitFor();
    assert.equal((await receiver.locator('#complete-correct').textContent()).trim(),'5/5');
    assert.match(await receiver.locator('#complete-copy').textContent(),/endret ikke mestring eller dagens mål/i);
    assert.match(await receiver.locator('#complete-next').textContent(),/samme fem spørsmål/i);

    const after=await receiver.evaluate(()=>({
      goal:dailyGoal(),
      answers:state.answerLog.map(x=>({counts:x.countsForLearning,practice:x.practiceRepeat})),
      session:state.sessionLog.at(-1),
      played:state.challengeHistory.find(x=>x.id===lastCompletedScope.challengeId&&x.direction==='played')
    }));
    assert.equal(after.goal.done,0,'challenge incorrectly completed daily goal');
    assert.equal(after.session.countsTowardGoal,false,'challenge session counted toward daily goal');
    assert.equal(after.session.practiceOnly,true,'challenge session was not stored as practice');
    assert.ok(after.answers.length>=5);
    assert.ok(after.answers.every(x=>x.counts===false||x.practice===true),'challenge answers affected learning mastery');
    assert.equal(after.played.score,5,'local challenge history did not store result');

    const youngCtx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const young=await youngCtx.newPage();
    await young.addInitScript(x=>localStorage.setItem('laerlittmer-v2',JSON.stringify(x)),seed(2,'Young'));
    await young.route('https://raw.githubusercontent.com/**',r=>r.abort());
    await young.route('https://api.worldbank.org/**',r=>r.abort());
    await young.goto(url+'?app=laria&p16=young',{waitUntil:'domcontentloaded'});
    await young.waitForFunction(()=>document.documentElement.dataset.safeChallengeRelease==='challenge-rc1');
    await young.locator('.bc12').waitFor({state:'visible'});
    const youngEntry=young.locator('.safe-challenge-young');
    await youngEntry.waitFor({state:'visible'});
    const navFit=await young.evaluate(()=>{
      const nav=document.querySelector('.bc12-nav'),btn=document.querySelector('.safe-challenge-young'),r=nav.getBoundingClientRect(),b=btn.getBoundingClientRect();
      return {vw:innerWidth,scroll:document.documentElement.scrollWidth,navLeft:r.left,navRight:r.right,btnH:b.height};
    });
    assert.ok(navFit.scroll<=navFit.vw+1,'young challenge entry causes horizontal overflow: '+JSON.stringify(navFit));
    assert.ok(navFit.navLeft>=-1&&navFit.navRight<=navFit.vw+1,'young nav exceeds viewport: '+JSON.stringify(navFit));
    assert.ok(navFit.btnH>=44,'young challenge tap target too small: '+navFit.btnH);

    await youngCtx.close();await receiverCtx.close();await senderCtx.close();
    console.log('Laria Prompt 16 safe challenge verification passed');
  }finally{
    await browser.close();await new Promise(resolve=>s.close(resolve));
  }
})().catch(err=>{console.error(err);process.exit(1)});
