'use strict';
// Actual Lesekroken review. Temporary CSS only; not production UI.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {execFileSync}=require('node:child_process');
const {chromium,webkit}=require('playwright');
const openHomeSubject=require('./helpers/laria-home-open-subject.cjs');
const root=path.resolve(__dirname,'..','laer-litt-mer');
const out=process.env.LARIA_LESEKROKEN_PREVIEW||'/tmp/laria-lesekroken-review';
fs.mkdirSync(out,{recursive:true});
const seed={version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'Prøvebarn',avatar:'girl',setupVersion:2,tallvikaTroll:'storesoster'},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
 masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
 lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{},chapterProgress:{}},
 answerLog:[],sessionLog:[],activeSession:null};
const p='#session-screen.task-scene[data-task-band="young"][data-task-subject="norwegian"]';
function r(selector,declarations){return p+' '+selector+'{'+declarations+'}\n';}
function cssFor(variant){
 if(variant==='original')return '';
 const common=[
  r('#question-wrap','width:min(calc(100vw - 88px),920px)!important;'),
  r('.task-norsk-storybook',
   'padding:23px 37px 28px!important;border:3px solid #a17a48!important;border-radius:28px!important;'+
   'background:linear-gradient(146deg,#fffdf1,#f8ebcd 78%,#eedeb9)!important;'+
   'box-shadow:inset 0 0 0 5px #fff8e8,inset 0 0 0 7px #d8b37b,0 7px 0 #77502c,0 24px 60px #162e342e!important;'),
  r('.task-card-head','display:flex!important;flex-direction:row!important;justify-content:space-between!important;'+
   'align-items:center!important;min-height:45px!important;padding:0 4px!important;gap:18px!important;'),
  r('.qtype','padding:9px 14px!important;font-size:12px!important;color:#674825!important;'+
   'background:#eed8a6!important;letter-spacing:.08em!important;'),
  r('.read-aloud','min-height:46px!important;padding:8px 16px!important;font-size:13px!important;'+
   'border:2px solid #bc925d!important;border-radius:13px!important;'),
  r('.question','font-size:clamp(31px,3.15vw,43px)!important;margin:17px auto 9px!important;'+
   'line-height:1.11!important;letter-spacing:-.032em!important;color:#304639!important;'),
  r('.task-visual-companion-stage','width:min(100%,640px)!important;margin:0 auto!important;'),
  r('.task-visual-row','min-height:196px!important;margin:2px auto 4px!important;'),
  r('.premium-visual .task-object-stage','width:min(100%,525px)!important;min-height:192px!important;'+
   'border:2px solid #c8a46b!important;border-radius:20px!important;'+
   'background:linear-gradient(180deg,#fbf5e3,#eee4ca)!important;'+
   'box-shadow:inset 0 0 0 5px #fff9e9,0 5px 0 #a88657,0 10px 24px #4f4a3630!important;'),
  r('.task-illustration','max-height:184px!important;width:min(100%,320px)!important;'),
  r('.task-norsk-helper','position:absolute!important;left:25px!important;top:56%!important;right:auto!important;'+
   'bottom:auto!important;min-height:56px!important;min-width:56px!important;z-index:11!important;'),
  r('.task-norsk-guide','width:57px!important;height:58px!important;min-width:56px!important;min-height:56px!important;'+
   'border:2px solid #a18355!important;border-radius:16px!important;background:linear-gradient(155deg,#fff8e2,#e8cd9e)!important;'+
   'box-shadow:inset 0 2px 4px #ffffff91,0 4px 0 #795a36,0 8px 15px #36402f30!important;'),
  r('.task-norsk-guide span','font-size:28px!important;color:#547251!important;'),
  r('.task-norsk-guide small','font-size:10px!important;'),
  r('.task-norsk-hint','left:calc(100% + 10px)!important;right:auto!important;'),
  r('.task-norsk-hint:after','left:-14px!important;border-left-color:transparent!important;border-right-color:#977044!important;'),
  r('.task-interaction','width:min(100%,700px)!important;margin:15px auto 0!important;'),
  r('.answers','gap:12px!important;'),
  r('.answer','min-height:62px!important;padding:11px 13px!important;border:2px solid #b58545!important;'+
    'border-radius:14px!important;color:#304639!important;background:linear-gradient(#fffaf0,#f4e5c6)!important;'+
    'box-shadow:0 4px 0 #946335,0 9px 17px #49372120!important;'),
  r('.answer:focus-visible, .read-aloud:focus-visible, .task-norsk-guide:focus-visible',
    'outline:4px solid #285b70!important;outline-offset:4px!important;')
 ].join('');
 if(variant==='a')return common;
 // In portrait both variants use the same calm vertical reading order.
 // On landscape B moves existing semantic DOM elements into a two-page spread,
 // without cloning, removing or changing any buttons or question text.
 const landscape=[
  r('#question-wrap','width:min(calc(100vw - 112px),980px)!important;'),
  r('.task-norsk-storybook','display:grid!important;grid-template-columns:minmax(0,1.04fr) minmax(0,.96fr)!important;'+
   'grid-template-rows:auto auto auto auto auto auto!important;column-gap:28px!important;row-gap:5px!important;'+
   'align-items:center!important;padding:28px 35px 32px!important;'),
  r('.task-card-head','grid-column:1/-1!important;grid-row:1!important;margin-bottom:9px!important;'),
  r('.question','grid-column:2!important;grid-row:2!important;align-self:end!important;max-width:none!important;'+
   'text-align:left!important;font-size:clamp(30px,2.7vw,38px)!important;margin:7px 0 9px!important;'),
  r('.task-visual-companion-stage','grid-column:1!important;grid-row:2 / span 3!important;'+
   'width:100%!important;align-self:center!important;margin:0!important;'),
  r('.task-visual-row','width:100%!important;min-height:298px!important;margin:0!important;'),
  r('.premium-visual .task-object-stage','width:100%!important;min-height:280px!important;'),
  r('.task-illustration','max-height:226px!important;width:min(100%,342px)!important;'),
  r('.task-norsk-helper','position:relative!important;grid-column:2!important;grid-row:3!important;'+
   'left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;'+
   'justify-self:start!important;margin:0!important;'),
  r('.task-interaction','grid-column:2!important;grid-row:4!important;width:100%!important;'+
   'margin:7px 0 0!important;'),
  r('.short-answers .answers, .medium-answers .answers','grid-template-columns:1fr!important;gap:9px!important;'),
  r('.answer','min-height:55px!important;padding:8px 10px!important;'),
  r('.feedback','grid-column:2!important;grid-row:5!important;width:100%!important;margin:8px 0 0!important;'),
  r('.next','grid-column:2!important;grid-row:6!important;width:100%!important;margin:7px 0 0!important;')
 ].join('');
 const portrait = [
  r('#question-wrap','width:min(calc(100vw - 92px),862px)!important;'+
    'transform:translateY(clamp(98px,12.2vh,176px))!important;'),
  r('.task-norsk-storybook','padding:34px 39px 38px!important;border-radius:30px!important;'),
  r('.task-card-head','min-height:46px!important;'),
  r('.question','font-size:clamp(36px,4.35vw,47px)!important;'+
    'margin:25px auto 13px!important;line-height:1.12!important;'),
  r('.task-visual-companion-stage','width:min(100%,660px)!important;'),
  r('.task-visual-row','min-height:232px!important;'),
  r('.premium-visual .task-object-stage','width:min(100%,530px)!important;min-height:220px!important;'),
  r('.task-illustration','max-height:213px!important;width:min(100%,344px)!important;'),
  r('.task-norsk-helper','left:20px!important;top:57%!important;'),
  r('.task-interaction','margin:20px auto 0!important;'),
  r('.answer','min-height:70px!important;font-size:clamp(18px,2.05vw,23px)!important;')
 ].join('');
 if(variant==='c'||variant==='d'){
  const offset = variant==='d'
    ?r('#question-wrap','transform:translateY(clamp(144px,17.1vh,228px))!important;')
    :'';
  // Do not change the already reviewed two-page landscape B.
  return common+'@media (orientation:portrait) and (min-width:768px) and (min-height:1000px){\n'+
    portrait+offset+'}\n'+
    '@media (orientation:landscape) and (min-width:1000px) and (min-height:650px){\n'+landscape+'}\n';
 }
 return common+'@media (orientation:landscape) and (min-width:1000px) and (min-height:650px){\n'+landscape+'}\n';
}
function serve(){
 return new Promise((resolve,reject)=>{
  const server=http.createServer((req,res)=>{
   let filepath;
   try{
    const url=new URL(req.url,'http://127.0.0.1');
    filepath=path.resolve(root,decodeURIComponent(url.pathname).replace(/^\/+/, '')||'index.html');
   }catch(e){res.writeHead(400);res.end();return;}
   if(filepath!==root&&!filepath.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
   fs.readFile(filepath,(err,buf)=>{
    if(err){res.writeHead(404);res.end('Not found');return;}
    const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript',
      '.json':'application/json','.png':'image/png','.webp':'image/webp',
      '.svg':'image/svg+xml','.jpg':'image/jpeg'};
    res.writeHead(200,{'Content-Type':mime[path.extname(filepath)]||'application/octet-stream',
      'Cache-Control':'no-store'});
    res.end(buf);
   });
  });
  server.once('error',reject);
  server.listen(0,'127.0.0.1',()=>resolve({server,url:'http://127.0.0.1:'+server.address().port+'/'}));
 });
}
const report={sha:null,mode:'review-only CSS injected on live Læria',results:[]};
async function run(browserType,engine,base,orientation,viewport){
 const browser=await browserType.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport,isMobile:false,hasTouch:true,deviceScaleFactor:1,
    reducedMotion:'reduce',serviceWorkers:'block'});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.addInitScript(data=>localStorage.setItem('laerlittmer-v2',JSON.stringify(data)),seed);
  await page.route('https://raw.githubusercontent.com/**',route=>route.abort());
  await page.route('https://api.worldbank.org/**',route=>route.abort());
  await page.goto(base+'?app=laria&lesekroken-review=1',{waitUntil:'domcontentloaded',timeout:60000});
  await openHomeSubject(page,'norwegian');
  await page.locator('#eggenipa-world:visible').waitFor({timeout:20000});
  const entry=page.locator('#eggenipa-world .eg-scene-reading:visible');
  if(await entry.count())await entry.first().click();
  else await page.locator('#eggenipa-world .eg-portal[data-eg="reading"]:visible').first().click();
  await page.locator('#session-screen.active .laria-task-card.task-norsk-storybook').waitFor({timeout:20000});
  const baseState=await page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2')));
  const content=await page.locator('#session-screen.active .question').innerText();
  const style=await page.evaluate(()=>{
   const node=document.createElement('style');
   node.id='laria-lesekroken-review-only';
   document.head.appendChild(node);
   return true;
  });
  assert.equal(style,true);
  for(const variant of orientation.startsWith('portrait')?['original','b','c','d']:['original','a','b']){
   await page.evaluate(css=>{document.getElementById('laria-lesekroken-review-only').textContent=css;},
     cssFor(variant));
   await page.waitForTimeout(160);
   const info=await page.evaluate(()=>{
    const qs=s=>[...document.querySelectorAll(s)];
    const rect=x=>{
      const r=x.getBoundingClientRect();
      return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};
    };
    const card=qs('#session-screen.active .laria-task-card')[0];
    const question=qs('#session-screen.active .question')[0];
    const answers=qs('#session-screen.active .answer');
    const hint=qs('#session-screen.active .task-norsk-guide')[0];
    const read=qs('#session-screen.active .read-aloud')[0];
    const artwork=qs('#session-screen.active .task-object-stage')[0];
    return {card:rect(card),question:rect(question),answers:answers.map(rect),
      hint:rect(hint),read:read?rect(read):null,artwork:artwork?rect(artwork):null,
      count:answers.length,progress:qs('#session-screen.active .session-progress')[0]?.getAttribute('aria-valuenow'),
      hasVisual:!!artwork,scrollHeight:document.documentElement.scrollHeight,
      viewport:{width:innerWidth,height:innerHeight}};
   });
   assert.ok(info.count>=2,'real reading question must have answer choices');
   assert.ok(info.card.w>500&&info.card.h>250,'task preview must render a real card');
   assert.ok(info.answers.every(b=>b.w>=44&&b.h>=44),'answer touch targets must remain usable');
   assert.ok(info.answers.every(b=>b.x>=0&&b.right<=viewport.width+1),
     'answer choices cannot fall outside horizontal iPad viewport');
   if(variant!=='original')assert.ok(info.answers.every(b=>b.y>=0&&b.bottom<=viewport.height+1),
     'visible iPad task answers must fit the initial viewport: '+JSON.stringify(info));
   if((variant==='c'||variant==='d')&&orientation.startsWith('portrait')){
    assert.ok(info.card.y>=230&&info.card.bottom<=viewport.height-65,
      'new portrait book must sit inside scenic field with bottom air: '+JSON.stringify(info.card));
    assert.ok(info.answers.every(b=>b.y>info.question.bottom+65),
      'answer row must be distinct from question and illustration');
   }
   assert.ok(info.hint.w>=44&&info.hint.h>=44,'hint remains tappable');
   assert.ok(info.read&&info.read.w>=44&&info.read.h>=44,'read aloud remains tappable');
   const filename=engine+'-'+orientation+'-'+variant+'.png';
   await page.screenshot({path:path.join(out,filename),fullPage:false,animations:'disabled'});
   report.results.push({engine,orientation,variant,viewport,question:content,info,filename});
   console.log('[Lesekroken review] '+engine+' '+orientation+' '+variant+' '+JSON.stringify({
    card:info.card,answers:info.answers.length,hint:info.hint,read:info.read}));
   if(variant==='b'||variant==='c'||variant==='d'){
    const guide=page.locator('#session-screen.active .task-norsk-guide');
    await guide.click();
    assert.equal(await guide.getAttribute('aria-expanded'),'true','hint must open');
    const msg=page.locator('#session-screen.active #task-norsk-hint');
    assert.equal(await msg.isVisible(),true,'hint text must be visible');
    await guide.click();await guide.click();
    assert.equal(await guide.getAttribute('aria-expanded'),'false','hint must close');
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2'))),
      baseState,'visual CSS and hint must not change learning progress');
   }
  }
  assert.deepEqual(errors,[],'preview cannot introduce page JS errors');
  await context.close();
 }finally{await browser.close();}
}
(async()=>{
 try{report.sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();}catch(e){}
 const {server,url}=await serve();
 try{
  for(const [engine,browser] of [['webkit',webkit],['chromium',chromium]]){
   for(const [name,viewport] of [
    ['landscape',{width:1366,height:1024}],
    ['portrait',{width:1024,height:1366}],
    ['portrait-compact',{width:820,height:1180}]
   ])await run(browser,engine,url,name,viewport);
  }
 }finally{await new Promise(resolve=>server.close(resolve));}
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
})().catch(err=>{console.error(err);process.exitCode=1;});
