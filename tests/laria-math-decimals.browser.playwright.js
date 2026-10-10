'use strict';
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8',
  '.js':'application/javascript; charset=utf-8','.png':'image/png','.svg':'image/svg+xml',
  '.webp':'image/webp','.json':'application/json'};
const fresh={
  version:7,progressSchemaVersion:3,
  profile:{grade:8,onboarded:true,name:'Elev',avatar:'boy',setupVersion:2},
  mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
  masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
  lastMilestone:null,recentCountryWin:null,lastActivity:null,
  journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null
};
async function server(){
  return new Promise((resolve,reject)=>{
    const srv=http.createServer((req,res)=>{
      let url=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
      if(url.endsWith('/'))url+='index.html';
      const file=path.resolve(root,'.'+url);
      if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
      fs.readFile(file,(err,bytes)=>{
        if(err){res.writeHead(404);res.end('Missing');return}
        res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
        res.setHeader('Cache-Control','no-store');
        res.end(bytes);
      });
    });
    srv.once('error',reject);
    srv.listen(0,'127.0.0.1',()=>resolve({srv,url:'http://127.0.0.1:'+srv.address().port+'/laer-litt-mer/?app=laria'}));
  });
}
async function question(page,answer,prompt,skill='decimals'){
  await page.evaluate(q=>{
    sessionQuestions=[{subject:'math',skill:q.skill,type:'number-input',prompt:q.prompt,
      answer:q.answer,curriculum:'MAT01-06'}];
    sessionScope={type:'journey',subject:'math',journeyGrade:8,journeyType:'skill',label:'Desimaltall'};
    qIndex=0;sessionCorrect=0;sessionStrengthened=new Set();currentAnswered=null;
    state.activeSession={startedAt:Date.now()};
    persistActiveSession();showScreen('session');renderQuestion();
  },{answer,prompt,skill});
  const field=page.locator('#math-input');
  await field.waitFor();
  assert.equal(await page.locator('.young-math-option').count(),0,'older pupils retain typing');
  return field;
}
async function run(launcher,engine,url){
  const browser=await launcher.launch({headless:true});
  try{
    const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
    try{
      const page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(String(e)));
      await page.addInitScript(profile=>localStorage.setItem('laerlittmer-v2',JSON.stringify(profile)),fresh);
      await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
      await page.route('https://api.worldbank.org/**',r=>r.abort());
      await page.goto(url,{waitUntil:'domcontentloaded'});
      let field=await question(page,'27,500000000000004','0,275 × 100 = ?');
      await field.fill('27,5');
      await page.locator('#check-number').click();
      assert.match(await page.locator('#feedback-title').innerText(),/Riktig/,'27,5 is correct');
      let outcome=await page.evaluate(()=>({
        entry:state.answerLog[state.answerLog.length-1],answered:state.activeSession?.answered
      }));
      assert.equal(outcome.entry.correct,true);
      assert.equal(outcome.answered.correct,true);

      field=await question(page,'220.00000000000003','200 øker med 10 %. Ny verdi?','percent-change');
      await field.fill('220');
      await page.locator('#check-number').click();
      assert.match(await page.locator('#feedback-title').innerText(),/Riktig/,'220 is correct');
      assert.equal(await page.evaluate(()=>state.answerLog.at(-1).correct),true);

      field=await question(page,'27,500000000000004','0,275 × 100 = ?');
      await field.fill('27,4');
      await page.locator('#check-number').click();
      assert.match(await page.locator('#feedback-title').innerText(),/Nesten/,'27,4 remains wrong');
      assert.equal(await page.evaluate(()=>state.answerLog.at(-1).correct),false);

      // A new curriculum question should have a clean expected answer.
      const normal=await page.evaluate(()=>{
        const q=window.LARIA_COMMERCIAL_CONTENT_V18.math(7).find(q=>q.prompt==='0,275 × 100 = ?');
        return q?.answer;
      });
      assert.equal(normal,'27,5');
      assert.deepEqual(errors,[],'no uncaught browser errors');
      console.log('PASS '+engine+' Læria Math decimal entry, legacy session, curriculum and wrong-answer control');
    }finally{await context.close()}
  }finally{await browser.close()}
}
(async()=>{
  const {srv,url}=await server();
  try{
    await run(chromium,'chromium',url);
    await run(webkit,'webkit',url);
    console.log('PASS decimal-answer browser matrix');
  }finally{await new Promise(resolve=>srv.close(resolve))}
})().catch(err=>{console.error(err);process.exitCode=1});
