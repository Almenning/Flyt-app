'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=process.env.LARIA_OBSERVE_DIR||'/tmp/laria-observe';
fs.mkdirSync(out,{recursive:true});
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'EventyrQA',avatar:'girl',setupVersion:2},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server=http.createServer((req,res)=>{let uri=new URL(req.url,'http://localhost').pathname;if(uri.endsWith('/'))uri+='index.html';const f=path.resolve(root,'.'+decodeURIComponent(uri));if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end()}fs.readFile(f,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});res.end(e?'Missing':b)})});
const report=[];
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url='http://127.0.0.1:'+server.address().port+'/laer-litt-mer/?app=laria';
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 for(const viewport of [{width:390,height:844},{width:1180,height:820}]){
 for(const subject of ['norwegian','math','english','geography']){
  const label=subject+'-'+viewport.width,entry={subject,viewport,steps:[],errors:[]};report.push(entry);
  const context=await browser.newContext({viewport,hasTouch:true,isMobile:viewport.width===390,reducedMotion:'reduce',serviceWorkers:'block'});
  await context.addInitScript(s=>{if(!localStorage.getItem('laerlittmer-v2'))localStorage.setItem('laerlittmer-v2',JSON.stringify(s))},seed);
  const page=await context.newPage();page.setDefaultTimeout(8000);page.on('pageerror',e=>entry.errors.push(String(e)));
  await page.route(/https:\/\/(raw\.githubusercontent\.com|api\.worldbank\.org)\//,r=>r.abort());
  const capture=async tag=>{await page.screenshot({path:path.join(out,label+'-'+tag+'.png'),animations:'disabled'});entry.steps.push({tag,data:await page.evaluate(()=>({screen:document.querySelector('.screen.active')?.id,text:document.querySelector('.screen.active')?.innerText,q:typeof sessionQuestions!=='undefined'?sessionQuestions[qIndex]:null,index:typeof qIndex!=='undefined'?qIndex:null,answered:typeof currentAnswered!=='undefined'?currentAnswered:null,answerLog:state.answerLog.length,sessionLog:state.sessionLog.length,horizontal:document.documentElement.scrollWidth>innerWidth+1,buttons:[...document.querySelectorAll('#session-screen.active button')].map(b=>{const r=b.getBoundingClientRect();return {text:b.innerText,disabled:b.disabled,x:r.x,y:r.y,w:r.width,h:r.height}})}))})};
  const solve=async()=>{
   const q=await page.evaluate(()=>sessionQuestions[qIndex]);
   const answers=page.locator('#session-screen.active .answer');
   if(await answers.count()){
    const match=answers.filter({hasText:new RegExp('^'+String(q.answer).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')}).first();
    if(await match.isEnabled())await match.click();
   }else if(q.type==='build-word'){
    for(const letter of Array.from(q.answer)){
     const candidates=page.locator('.letter-bank .letter-tile:not([disabled])');
     let found=false;for(let i=0;i<await candidates.count();i++)if((await candidates.nth(i).innerText()).trim().toUpperCase()===letter.toUpperCase()){await candidates.nth(i).click();found=true;break}
     if(!found)throw Error('No remaining letter '+letter);
    }
    await page.locator('#check-build').click();
   }else if(q.type==='number-input'){
    await page.locator('#math-input').fill(String(q.answer));await page.locator('#check-number').click();
   }else throw Error('Observer has no UI solver for '+q.type);
  };
  try{
   await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.locator('.bc14-subject[data-camp="subject-'+subject+'"]').click();
   const map=page.locator('.screen.active .locked-journey-map[data-journey-subject="'+subject+'"]');
   await map.locator('.locked-journey-hotspot').first().click();
   await page.locator('.locked-journey-overlay:not([hidden]) .mission-primary').click();
   await page.locator('#session-screen.active .laria-task-card').waitFor();
   entry.questions=await page.evaluate(()=>sessionQuestions);
   await capture('task-before');
   const wrong=await page.evaluate(()=>{const q=sessionQuestions[qIndex];return [...document.querySelectorAll('#session-screen.active .answer')].find(b=>b.dataset.answer!==String(q.answer))?.dataset.answer});
   if(wrong!==undefined){await page.locator('#session-screen.active .answer').filter({hasText:new RegExp('^'+wrong.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')}).first().click();await capture('wrong');}
   await solve();await capture('after-answer');
   for(let step=0;step<12;step++){
    if(await page.locator('#complete-screen.active').count())break;
    await page.locator('#next-question').click();
    if(await page.locator('#complete-screen.active').count())break;
    await solve();
   }
   await capture('complete');
   if(await page.locator('#complete-screen.active').count()){
    await page.locator('#complete-repeat').click();await capture('repeat-before');await solve();await capture('repeat-answer');
    await page.locator('#close-session').click();await capture('return');
   }
  }catch(e){entry.failure=String(e);await capture('failure').catch(()=>{});}
  await context.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 }
 }
 }finally{await browser.close();server.close();}
 console.log(JSON.stringify(report.map(r=>({subject:r.subject,viewport:r.viewport,failure:r.failure,errors:r.errors,steps:r.steps.map(s=>({tag:s.tag,q:s.data.q?.prompt,answerLog:s.data.answerLog,sessionLog:s.data.sessionLog,answered:s.data.answered}))})),null,2));
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
