'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const openHomeSubject=require('./helpers/laria-home-open-subject.cjs');
const url=process.env.QA_URL||'http://127.0.0.1:8910/laria/';
const dimensions=[['phone-landscape',844,390],['phone-portrait',390,844],['phone-short-landscape',667,375],['phone-micro-landscape',568,320]];
const profile={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Prøvebarn',avatar:'girl',tallvikaTroll:'storesoster',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{},chapterProgress:{}},answerLog:[],sessionLog:[],activeSession:null};
const G=action=>'[data-gm-action="'+action+'"]';
const F=action=>'[data-fr-action="'+action+'"]';
async function test(browser,engine,[device,width,height]){
 const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:true,isMobile:true,reducedMotion:'reduce',serviceWorkers:'block'});
 const page=await ctx.newPage(),errors=[];
 page.setDefaultTimeout(20000);
 page.on('pageerror',e=>errors.push(e.message));
 const groups=[];
 const narrow=device.includes('landscape')&&width<700;
 const top=()=>page.evaluate(()=>{
  scrollTo(0,0);
  document.querySelector('.screen.active')?.scrollTo(0,0);
 });
 const action=sel=>page.locator(sel).first();
 const ready=selector=>page.waitForFunction(sel=>Boolean(document.querySelector(sel)),selector,{polling:65,timeout:20000});
 const geometry=(selector,inner)=>page.evaluate(({selector,inner})=>{
   const nodes=[...document.querySelectorAll(selector)];
   return nodes.map(el=>{
    if(inner)el=el.querySelector(inner);
    const r=el.getBoundingClientRect(),v=visualViewport||{width:innerWidth,height:innerHeight};
    const x=r.left+r.width/2,y=r.top+r.height/2;
    return {x,y,top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height,
     inView:r.left>=-1&&r.top>=-1&&r.right<=v.width+1&&r.bottom<=v.height+1,hit:el.contains(document.elementFromPoint(x,y))};
   });
 },{selector,inner});
 async function check(label,selector,interactive=true){
  const boxes=await geometry(selector);
  assert.ok(boxes.length,label+' missing');
  for(const box of boxes){
    assert.ok(box.inView&&(!interactive||(box.hit&&box.width>=44&&box.height>=44)),label+' '+JSON.stringify(box));
    groups.push({label,box});
  }
  assert.equal(await page.evaluate(()=>scrollY),0,label+' moved the document');
 }
 async function tap(selector,inner){
  const [r]=await geometry(selector,inner);
  assert.ok(r&&r.hit&&r.inView,selector+' is not directly exposed '+JSON.stringify(r));
  await page.touchscreen.tap(r.x,r.y);
 }
 async function shot(label){
  if(!process.env.LARIA_MATH_PHONE_SHOTS)return;
  const out=process.env.LARIA_MATH_PHONE_SHOTS;
  fs.mkdirSync(out,{recursive:true});
  await page.screenshot({path:path.join(out,engine+'-'+device+'-'+label+'.png'),animations:'disabled'});
 }
 try{
  await ctx.addInitScript(value=>localStorage.setItem('laerlittmer-v2',JSON.stringify(value)),profile);
  await page.route('https://**/*',req=>req.abort());
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
  // Some headless WPE runners stall on the real Home button's pointer action.
  // The helper resolves the correct approved or fallback route before activation.
  await openHomeSubject(page,'math',{keyboard:engine==='webkit'&&process.env.LARIA_WPE_KEYBOARD==='1'});
  await tap('#tallvika-world [data-tv="multiply"]');
  await ready('.gm-shell[data-gm-mode="mission"]');
  await check('mission source',G('source'));
  await check('mission baskets',G('basket'));
  if(narrow){
   await check('mission help',G('hint'));
   await check('mission mode and navigation','.gm-secondary-nav button');
   await tap(G('hint'));
   assert.equal(await page.locator('.gm-fox[data-mood="help"]').count(),1,'Hint must reach the selected companion');
  }
  await shot('gm-mission');
  for(let g=0;g<3;g++)for(let j=0;j<3;j++){
   await tap(G('source'));
   await tap(G('basket')+'[data-gm-basket="'+g+'"]','.gm-crate-front');
  }
  await ready('.gm-shell[data-gm-complete="true"]');
  assert.match(await action('.gm-math-equation').innerText(),/3 × 3 = 9/);
  await check('mission equation','.gm-math-equation',false);
  await check('mission Next',G('next'));
  if(narrow)await check('completed mission navigation','.gm-secondary-nav button');
  await shot('gm-complete');
  await tap(G('next'));
  assert.match(await action('.gm-top-progress').innerText(),/Oppdrag 2 av 8/);
  if(narrow){
   await check('Fri lek entry after Next',G('mode'));
  }else{
   // Keep the other viewport expectations unchanged in this scoped regression.
   await action(G('mode')).evaluate(el=>el.scrollIntoView({behavior:'instant',block:'center'}));
  }
  await tap(G('mode'));
  await ready('.gm-shell[data-gm-mode="free"]');
  if(!narrow)await top();
  await check('free source',G('source'));
  await check('free basket dials',G('factor'));
  if(narrow){
   await check('free mode help',G('hint'));
   const freeNav='.gm-secondary-nav button';
   assert.equal(await page.locator(freeNav).count(),3,'Free play must keep Oppdrag, Markedsbok and Gangetabellen');
   await check('free mode return and navigation',freeNav);
   const [market]=await geometry('.gm-world');
   assert.ok((await geometry(freeNav)).every(button=>button.bottom<=market.top+1),
    'Compact free mode navigation must remain above the market even as the baskets change');
   await tap(G('hint'));
   assert.equal(await page.locator('.gm-fox[data-mood="help"]').count(),1);
  }
  const state=action('.gm-shell');
  const group=Number(await state.getAttribute('data-gm-groups')),each=Number(await state.getAttribute('data-gm-each'));
  const sums=()=>state.getAttribute('data-gm-sum');
  await tap(G('factor')+'[data-key="groups"][data-step="1"]');
  assert.equal(Number(await state.getAttribute('data-gm-groups')),group+1);
  await tap(G('factor')+'[data-key="groups"][data-step="-1"]');
  assert.equal(Number(await state.getAttribute('data-gm-groups')),group);
  await tap(G('factor')+'[data-key="each"][data-step="1"]');
  assert.equal(Number(await state.getAttribute('data-gm-each')),each+1);
  const total=Number(await sums());
  await tap(G('source'));
  assert.equal(Number(await sums()),total+1);
  await tap(G('factor')+'[data-key="each"][data-step="-1"]');
  assert.equal(Number(await state.getAttribute('data-gm-each')),each);
  await ready(G('source'));
  await check('free mode source after changes',G('source'));
  await shot('gm-free');
  if(narrow){
   for(let n=each;n<10;n++)await tap(G('factor')+'[data-key="each"][data-step="1"]');
   assert.equal(await state.getAttribute('data-gm-each'),'10');
   const slots=await page.evaluate(()=>{
    const crate=document.querySelector('.gm-shell .gm-crate'),bed=crate.querySelector('.gm-fruit-bed');
    const front=crate.querySelector('.gm-crate-front').getBoundingClientRect();
    return [...bed.children].map(f=>{
     const r=f.getBoundingClientRect();return r.width>=11&&r.height>=16&&r.bottom<=front.top+3;
    });
   });
   assert.equal(slots.length,10);
   assert.ok(slots.every(Boolean),'ten berry slots still fit above the basket front');
   await check('free source after selecting 10',G('source'));
   await shot('gm-ten-slots');
  }
  if(narrow){
   await check('free mode return with ten slots',G('mode'));
   await tap(G('mode'));
   await ready('.gm-shell[data-gm-mode="mission"]');
   await check('mission help after return',G('hint'));
  }
  await tap('#multiplication-lab-back');
  await ready('#subject-screen.active #tallvika-world');
  await tap('#tallvika-world [data-tv="fraction"]');
  await ready('.fr6-workshop');
  await check('fraction cake result','.fr6-result .fr2-fraction',false);
  assert.ok((await geometry('.fr6-result .fr2-fraction'))[0].height>65,'the real fraction must stay large enough to read');
  await check('fraction cake pieces','.fr6-piece-tray [data-piece-index]');
  await check('fraction cake adjustments','.fr6-workshop '+F('adjust'));
  await check('fraction next division',F('next-build'));
  await check('fraction nav','.fr6-nav .fr2-nav-item');
  const label=()=>action('.fr6-result .fr2-fraction').getAttribute('aria-label');
  assert.match(await label(),/^1 av 4$/);
  await shot('fr-cake');
  await tap('.fr6-piece-tray [data-piece-index]');
  assert.match(await label(),/^2 av 4$/);
  await tap(F('next-build'));
  assert.match(await label(),/^0 av 5$/);
  await tap('.fr6-nav '+F('go')+'[data-page="home"]');
  await ready('.fr6-more');
  await check('all fraction modes','.fr6-more .fr2-home-card');
  await shot('fr-modes');
  await tap('.fr2-home-card[data-page="explore"]');
  await ready('.fr6-explore');
  await check('fraction Explore value','.fr6-explore .fr2-main-value',false);
  await check('fraction Explore adjustments','.fr6-explore '+F('adjust'));
  await check('fraction Explore view choices','.fr6-explore '+F('view'));
  for(const mode of ['bar','grid','glass','circle']){
   await tap(F('view')+'[data-view="'+mode+'"]');
   assert.equal(await action(F('view')+'[data-view="'+mode+'"]').getAttribute('aria-pressed'),'true');
   await check('fraction Explore '+mode+' adjustment','.fr6-explore '+F('adjust'));
  }
  await tap('.fr6-explore '+F('adjust')+'[data-field="n"][data-step="1"]');
  assert.equal(await action('.fr6-explore .fr2-main-value .fr2-fraction').getAttribute('aria-label'),'1 av 5');
  await shot('fr-explore');
  await tap('#fraction-lab-back');
  await ready('#subject-screen.active #tallvika-world');
  assert.deepEqual(errors,[]);
  console.log('PASS Math phone',engine,device,width,height,groups.length,'controls and stages, 3×3, Next, free-play dials/berry, cake, division, four fraction views, return');
 }catch(error){await shot('REJECTED').catch(()=>{});throw error}
 finally{
  if(process.env.LARIA_MATH_PHONE_SHOTS&&groups.length)
   fs.writeFileSync(path.join(process.env.LARIA_MATH_PHONE_SHOTS,engine+'-'+device+'.json'),JSON.stringify(groups,null,2));
  await ctx.close();
 }
}
(async()=>{
 const failures=[];
 for(const [name,browserType] of [['chromium',chromium],['webkit',webkit]]){
  if(process.env.LARIA_MATH_PHONE_ENGINE&&process.env.LARIA_MATH_PHONE_ENGINE!==name)continue;
  const browser=await browserType.launch({headless:true,...(name==='chromium'&&process.env.LARIA_CHROMIUM_EXECUTABLE?
   {executablePath:process.env.LARIA_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--renderer-process-limit=1']}:{})});
  try{
   for(const dimension of dimensions){
    if(process.env.LARIA_MATH_PHONE_DEVICE&&process.env.LARIA_MATH_PHONE_DEVICE!==dimension[0])continue;
    try{await test(browser,name,dimension)}catch(error){failures.push(name+' '+dimension[0]);console.error(error);}
   }
  }finally{await browser.close()}
 }
 assert.deepEqual(failures,[]);
})().catch(error=>{console.error(error);process.exitCode=1});
