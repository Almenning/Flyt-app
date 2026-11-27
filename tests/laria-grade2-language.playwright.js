'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium,webkit}=require('playwright');
const openHomeSubject=require('./helpers/laria-home-open-subject.cjs');

let url=process.env.QA_URL;
const screenshots=process.env.LARIA_LANGUAGE_SCREENSHOTS;
const keyboard=process.env.LARIA_LANGUAGE_INPUT==='keyboard';
async function activate(page,button,touch=false){
  if(keyboard){
    await button.focus({timeout:15000});
    await page.keyboard.press('Enter');
  }else if(touch)await button.tap({timeout:15000});
  else await button.click();
}
const base=path.resolve(__dirname,'..');
const contentTypes={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json',
  '.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
function serve(){
  const server=http.createServer((request,response)=>{
    let relative=new URL(request.url,'http://127.0.0.1').pathname;
    if(relative.endsWith('/'))relative+='index.html';
    const resource=path.resolve(base,'.'+decodeURIComponent(relative));
    if(!resource.startsWith(base+path.sep)){response.writeHead(403).end();return}
    fs.readFile(resource,(error,body)=>{
      if(error){response.writeHead(404).end();return}
      response.setHeader('Content-Type',contentTypes[path.extname(resource)]||'application/octet-stream');
      response.setHeader('Cache-Control','no-store');
      response.end(body);
    });
  });
  return new Promise((resolve,reject)=>{
    server.once('error',reject);
    server.listen(0,'127.0.0.1',()=>resolve(server));
  });
}
const seed={
  version:7,progressSchemaVersion:3,
  profile:{grade:2,onboarded:true,name:'Språk QA',avatar:'girl',setupVersion:2,tallvikaTroll:'lillesoster'},
  mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},
  preferences:{sound:false,autoRead:false},answerLog:[],sessionLog:[],activeSession:null,
  journey:{nodes:{},gradeWins:{},viewGrades:{}}
};

async function inContext(browser,viewport,fn){
  const ctx=await browser.newContext({viewport,isMobile:viewport.width<600,hasTouch:true,
    reducedMotion:'reduce',serviceWorkers:'block'});
  try{
    await ctx.addInitScript(profile=>{
      if(!localStorage.getItem('laerlittmer-v2'))
        localStorage.setItem('laerlittmer-v2',JSON.stringify(profile));
    },seed);
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await fn(page);
    assert.deepEqual(errors,[]);
  }finally{await ctx.close()}
}

async function openSubject(page,id,viewport){
  if(viewport.width>=600)return openHomeSubject(page,id);
  // The app exposes painted DOM targets on phone. Use a real touch event
  // rather than desktop pointer emulation for these targets.
  const sign=page.locator('#home-screen.active .bc12[data-bc15-asset="phone-ready"] '+
    '.bc15-subject-signs [data-bc15-subject="'+id+'"]:visible');
  await activate(page,sign,true);
}
async function findAuthored(page,subject,module,label,lang){
  // Use the live session builder to locate the authored fixture deterministically
  // without artificially adding data to the app bank or scoring skipped cards.
  return page.evaluate(({subject,module,label,lang})=>{
    for(let tries=0;tries<75;tries++){
      if(tries>0)startLearningSession(subject,module,label,true);
      const match=sessionQuestions.findIndex(q=>q.learningFeedback&&q.passageLang===lang);
      if(match>=0){
        qIndex=match;
        renderQuestion();
        return sessionQuestions[qIndex];
      }
    }
    return null;
  },{subject,module,label,lang});
}

async function checkFeedback(page,q,caseName,lang){
  assert.ok(q,'Could not find a new '+caseName+' question in actual app sessions');
  const passage=page.locator('#question-wrap .learning-passage');
  const question=page.locator('#question-wrap .question');
  assert.equal(await passage.textContent(),q.passage);
  assert.equal(await passage.getAttribute('lang'),lang);
  assert.equal(await question.getAttribute('lang'),lang);
  assert.equal(await page.locator('#question-wrap .task-interaction').getAttribute('lang'),lang);
  assert.ok(await passage.evaluate(node=>Boolean(node.compareDocumentPosition(
    document.querySelector('#question-wrap .question'))&Node.DOCUMENT_POSITION_FOLLOWING)));
  const wrong=q.options.find(o=>o!==q.answer);
  const card=page.locator('#question-wrap');
  const before=await page.evaluate(()=>state.answerLog.length);
  await activate(page,card.getByRole('button',{name:wrong,exact:true}));
  const retry=await card.locator('#feedback-copy').textContent();
  assert.ok(retry.includes(q.learningFeedback.retry),caseName+' must show the question-specific clue');
  assert.ok(retry.includes(lang==='nn'?'Prøv ein gong til.':'Prøv en gang til.'));
  assert.equal(await card.locator('#next-question').isVisible(),false);
  await activate(page,card.getByRole('button',{name:q.answer,exact:true}));
  assert.ok((await card.locator('#feedback-copy').textContent()).includes(q.learningFeedback.correct));
  assert.ok(await card.locator('#next-question').isVisible());
  assert.equal(await page.evaluate(()=>state.answerLog.length),before+1,'Retry counted as a second attempt');
  if(screenshots){
    fs.mkdirSync(screenshots,{recursive:true});
    await page.screenshot({path:path.join(screenshots,caseName+'.png'),animations:'disabled'});
  }
}

async function run(browserType,label,viewport){
  const chromiumExecutable=process.env.LARIA_CHROMIUM_EXECUTABLE;
  const browser=await browserType.launch({headless:true,
    ...(browserType===chromium&&chromiumExecutable?{executablePath:chromiumExecutable,args:['--no-sandbox']}:{})});
  try{
    await inContext(browser,viewport,async page=>{
      await openSubject(page,'norwegian',viewport);
      await activate(page,page.locator('#subject-screen.active #eggenipa-world button[data-eg="reading"]:visible'));
      await page.locator('#session-screen.active .laria-task-card').waitFor();
      assert.deepEqual(await page.evaluate(()=>({
        subject:sessionScope.subject,module:sessionScope.module,count:sessionQuestions.length,
        onlyStories:sessionQuestions.every(q=>Boolean(q.passage))
      })),{subject:'norwegian',module:'reading',count:5,onlyStories:true});
      const q=await findAuthored(page,'norwegian','reading','Lesekroken','nn');
      assert.ok(q);
      await activate(page,page.getByRole('button',{name:'Få et hint',exact:true}));
      await activate(page,page.getByRole('button',{name:'Få et hint til',exact:true}));
      assert.equal(await page.locator('#task-norsk-hint').textContent(),q.learningFeedback.retry);
      await checkFeedback(page,q,label+'-lesekroken','nn');
    });
    await inContext(browser,viewport,async page=>{
      await openSubject(page,'english',viewport);
      const world=page.locator('#subject-screen.active #kinnaklova-world');
      await world.waitFor();
      await page.waitForFunction(()=>['ready','missing','unapproved'].includes(
        document.querySelector('#subject-screen.active #kinnaklova-world')?.dataset.kiArt));
      const painted=world.locator('.ki-painted-sentences:visible');
      if(await painted.count())await activate(page,painted);
      else await activate(page,world.locator('.ki-card[data-ki="sentences"]:visible'));
      await page.locator('#session-screen.active .laria-task-card').waitFor();
      assert.equal(await page.evaluate(()=>sessionScope.module),'sentences');
      const q=await findAuthored(page,'english','sentences','Sentences','en');
      await checkFeedback(page,q,label+'-sentences','en');
    });
    console.log(label+' ('+(keyboard?'keyboard':'pointer')+') verified: Lesekroken and Sentences, real navigation, hints and retry without duplicate progress');
  }finally{await browser.close()}
}

(async()=>{
  const server=url?null:await serve();
  if(server)url='http://127.0.0.1:'+server.address().port+'/laer-litt-mer/?app=laria';
  try{
    const filter=process.env.LARIA_LANGUAGE_BROWSER;
    for(const [type,label,viewport] of [
      [chromium,'chromium-820x1180',{width:820,height:1180}],
      [webkit,'webkit-1180x820',{width:1180,height:820}],
      [webkit,'webkit-390x844',{width:390,height:844}]
    ]){
      if(!filter||label.startsWith(filter))await run(type,label,viewport);
    }
  }finally{if(server)await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);process.exitCode=1});
