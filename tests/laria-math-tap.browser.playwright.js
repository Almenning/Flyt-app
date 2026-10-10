'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const screenshots=process.env.MATH_TAP_QA_SCREENSHOTS||'/tmp/laria-math-tap';
const seed={
  version:7,progressSchemaVersion:3,
  profile:{grade:2,onboarded:true,name:'Elev',avatar:'boy',setupVersion:2},
  mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
  masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
  lastMilestone:null,recentCountryWin:null,lastActivity:null,
  journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null
};
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8',
  '.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml',
  '.png':'image/png','.webp':'image/webp','.json':'application/json'};
async function serve(){
  return new Promise((resolve,reject)=>{
    const server=http.createServer((req,res)=>{
      let url=new URL(req.url,'http://localhost').pathname;
      if(url.endsWith('/'))url+='index.html';
      const file=path.resolve(root,'.'+decodeURIComponent(url));
      if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
      fs.readFile(file,(err,data)=>{
        if(err){res.writeHead(404);res.end('Missing');return}
        res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
        res.setHeader('Cache-Control','no-store');
        res.end(data);
      });
    });
    server.once('error',reject);
    server.listen(0,'127.0.0.1',()=>resolve({
      server,url:'http://127.0.0.1:'+server.address().port+'/laer-litt-mer/?app=laria'
    }));
  });
}
async function capture(page,engine,device,stage){
  await fs.promises.mkdir(screenshots,{recursive:true});
  await page.screenshot({path:path.join(screenshots,engine+'-'+device+'-'+stage+'.png'),
    fullPage:true,animations:'disabled'});
}
async function run(browser,engine,device,width,height,url){
  const context=await browser.newContext({
    viewport:{width,height},deviceScaleFactor:1,hasTouch:true,isMobile:width<700,
    serviceWorkers:'block'
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  await page.addInitScript(x=>localStorage.setItem('laerlittmer-v2',JSON.stringify(x)),seed);
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  try{
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>{
      sessionQuestions=[{subject:'math',skill:'place-value',type:'number-input',
        prompt:'Hva er verdien til 8 i tallet 82?',answer:'80',curriculum:'MAT01-06'}];
      sessionScope={type:'journey',subject:'math',journeyGrade:2,journeyType:'skill',label:'Plassverdi'};
      qIndex=0;sessionCorrect=0;sessionStrengthened=new Set();currentAnswered=null;
      state.activeSession={startedAt:Date.now()};
      persistActiveSession();showScreen('session');renderQuestion();
    });
    const choices=page.locator('.young-math-option');
    await choices.first().waitFor();
    assert.equal(await choices.count(),3,'three distinct answer cards');
    assert.deepEqual((await choices.evaluateAll(els=>els.map(x=>x.dataset.answer))).sort(),['8','80','82']);
    assert.equal(await page.locator('#math-input').count(),0,'no typing or mobile keyboard');
    assert.equal(await page.locator('.laria-task-card').count(),1,'preserve premium task scene');
    const layout=await page.evaluate(()=>{
      const nodes=[...document.querySelectorAll('.young-math-option')];
      return {
        screen:innerWidth,scroll:document.documentElement.scrollWidth,
        rects:nodes.map(n=>n.getBoundingClientRect().toJSON()),
        font:nodes.map(n=>parseFloat(getComputedStyle(n).fontSize)),
        columns:getComputedStyle(document.querySelector('.young-math-answers')).gridTemplateColumns
      };
    });
    assert.ok(layout.scroll<=layout.screen+4,'horizontal overflow: '+JSON.stringify(layout));
    assert.ok(layout.rects.every(x=>x.height>=58),'tap targets too small: '+JSON.stringify(layout));
    assert.ok(layout.rects[0].y===layout.rects[1].y&&layout.rects[1].y===layout.rects[2].y,
      'choices should be three in one row: '+JSON.stringify(layout));
    await capture(page,engine,device,'01-choices');
    await page.locator('.young-math-option[data-answer="8"]').tap();
    assert.match(await page.locator('#feedback-title').innerText(),/Nesten/);
    assert.equal(await page.locator('#next-question').isVisible(),false);
    await page.locator('.young-math-option[data-answer="80"]').tap();
    assert.match(await page.locator('#feedback-title').innerText(),/Riktig/);
    assert.equal(await page.locator('.young-math-option.correct').count(),1);
    const result=await page.evaluate(()=>({
      logs:state.answerLog.filter(x=>x.subject==='math'),
      correct:sessionCorrect,answered:currentAnswered,answeredStored:state.activeSession?.answered
    }));
    assert.equal(result.logs.length,1,'wrong first try and correction count as one assessment');
    assert.equal(result.logs[0].correct,false,'first attempt determines mastery');
    assert.equal(result.correct,0,'no double score for a correction');
    assert.equal(result.answered.corrected,true,'a later correct tap is celebrated as correction');
    assert.equal(result.answeredStored.corrected,true,'correction persisted for resume');
    await page.evaluate(()=>renderQuestion());
    assert.match(await page.locator('#feedback-title').innerText(),/Riktig/);
    await capture(page,engine,device,'02-retried');
    assert.deepEqual(errors,[], 'no browser JavaScript errors');

    // A higher-level child should retain optional keyboard entry.
    await page.evaluate(()=>{
      state.profile.grade=3;currentAnswered=null;
      sessionQuestions=[{subject:'math',skill:'multiplication',type:'number-input',
        prompt:'Hvor mange er 4 ganger 6?',answer:'24',curriculum:'MAT01-06'}];
      persistActiveSession();renderQuestion();
    });
    assert.equal(await page.locator('#math-input').count(),1,'grade 3 keeps keyboard entry');
    assert.equal(await page.locator('.young-math-option').count(),0);
    console.log('PASS '+engine+' '+device+' grade-2 choices/feedback/persistence/layout and grade-3 input');
  }finally{await context.close()}
}
(async()=>{
  const {server,url}=await serve();
  try{
    for(const [engine,launcher] of [['chromium',chromium],['webkit',webkit]]){
      const browser=await launcher.launch({headless:true});
      try{
        await run(browser,engine,'iphone',390,844,url);
        await run(browser,engine,'ipad',820,1180,url);
      }finally{await browser.close()}
    }
    console.log('PASS Laria Math young-answer browser matrix');
  }finally{await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
