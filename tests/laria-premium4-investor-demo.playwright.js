'use strict';
// Synthetic investor smoke + screenshot matrix. Does not seed progress, replace
// scenes, or connect to actual profile data, accounts, purchases or telemetry.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium,webkit}=require('playwright');
const openSubject=require('./helpers/laria-home-open-subject.cjs');
const base=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const host=new URL(base);
if(!['127.0.0.1','localhost','[::1]'].includes(host.hostname))throw new Error('Run the investor demo against an isolated loopback checkout.');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:path.resolve(__dirname,'..'),encoding:'utf8'}).trim();
const out=process.env.LARIA_DEMO_SHOTS||'/tmp/laria-premium4-demo';
const recommended=[[820,1180,true],[1180,820,true],[390,844,true],[1440,900,false]];
const extended=[[1024,1366,true],[1366,1024,true],[1024,768,true],[375,667,true],[393,852,true],[430,932,true],[844,390,true],[1280,720,false],[1920,1080,false],[2560,1080,false],[1000,660,false]];
const select=process.env.LARIA_DEMO_VIEWPORT?.split(',');
const views=[...recommended,...(process.env.LARIA_DEMO_EXTENDED==='1'||select?extended:[])].filter(([w,h])=>!select||select.includes(w+'x'+h));
assert.ok(views.length,'No matching requested viewports');
const name='Demo Læria';
const readyHome='#home-screen.active .bc12.bc15-locked-home:not(.bc15-pending)';
async function verify(browser,kind,width,height,touch){
 const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch&&Math.min(width,height)<=440,deviceScaleFactor:1,serviceWorkers:'block',reducedMotion:'reduce'});
 // Demo verifies the bundled data fallback and does not send traffic to third parties.
 await context.route(/^https?:\/\//,route=>new URL(route.request().url()).origin===host.origin?route.continue():route.abort());
 const page=await context.newPage();
 page.setDefaultTimeout(19000);
 const errors=[],missing=[],evidence=[],issues=[];
 let lastStep='startup';
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(new URL(r.url()).origin===host.origin&&r.status()>=400)missing.push([r.status(),new URL(r.url()).pathname]);});
 const prefix=kind+'-'+width+'x'+height+'-'+(width>height?'landscape':'portrait')+'-'+sha.slice(0,12);
 const loc=selector=>page.locator(selector);
 const click=selector=>loc(selector).click();
 async function shot(tag,selector){
  lastStep=tag;
  await loc(selector).first().waitFor({state:'visible'});
  await page.evaluate(async()=>{
   await document.fonts.ready;
   await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  });
  await page.waitForFunction(()=>Array.from(document.images).filter(i=>i.clientWidth>0&&i.loading!=='lazy').every(i=>i.complete),null,{timeout:3000}).catch(()=>{});
  const geometry=await loc(selector).first().evaluate(el=>{const b=el.getBoundingClientRect();return {
   bounds:[b.x,b.y,b.width,b.height].map(Math.round),scrollWidth:document.documentElement.scrollWidth,
   clientWidth:document.documentElement.clientWidth
  }});
  if(geometry.scrollWidth>geometry.clientWidth+2)issues.push(tag+': horizontal document overflow '+(geometry.scrollWidth-geometry.clientWidth)+' CSS px');
  const file=prefix+'-'+tag+'.jpg';
  await page.screenshot({path:path.join(out,file),animations:'disabled',type:'jpeg',quality:88});
  evidence.push({tag,file,geometry});
 }
 async function openHome(){await page.goto(base,{waitUntil:'domcontentloaded'});await loc(readyHome).waitFor({state:'visible',timeout:28000});}
 async function open(id){lastStep='entry-'+id;await openSubject(page,id);}
 async function showExercise(subject,module,tag){
  lastStep=tag;
  const session=loc('#session-screen.active .laria-task-card');
  await session.waitFor();
  const q=await page.evaluate(()=>({subject:sessionScope?.subject,module:sessionScope?.module,prompt:sessionQuestions?.[qIndex]?.prompt}));
  assert.equal(q.subject,subject);if(module)assert.equal(q.module,module);
  assert.ok(q.prompt,'Rendered exercise is backed by a real question');
  await shot(tag,'#session-screen.active .question');
 }
 async function chooseName(answer){
  const buttons=loc('#session-screen.active .answer:visible');
  for(const b of await buttons.all()){
    if(await b.getAttribute('data-answer')===String(answer)||(await b.innerText()).trim()===String(answer)){await b.click();return;}
  }
  await loc('#session-screen.active').getByRole('button',{name:String(answer),exact:true}).click();
 }
 async function closeTask(){
  await click('#session-screen.active #close-session');
  const exit=loc('#modal-exit :is(.primary,.danger):visible').first();
  if(await exit.isVisible())await exit.click();
 }
 async function checkProfile(){
  const profile=await page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2')).profile);
  assert.equal(profile.grade,2);assert.equal(profile.name,name);assert.equal(profile.tallvikaTroll,'lillesoster');
 }
 try{
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await shot('01-oppstart','#onboarding.show');
  await click('#onboarding.show button[data-troll="lillesoster"]');
  await loc('#profile-name').fill(name);
  await click('#onboarding.show button[data-grade="2"]');
  assert.equal(await loc('#onboarding.show button[data-troll="lillesoster"]').getAttribute('aria-pressed'),'true');
  assert.equal(await loc('#onboarding.show button[data-grade="2"]').getAttribute('aria-pressed'),'true');
  await shot('02-profil-og-troll','#onboarding.show');
  await click('#onboarding.show #profile-next');
  await shot('03-hjem',readyHome);
  await checkProfile();
  if(await loc('#home-screen.active .bc15-v16-reisen').isVisible()){
    await click('#home-screen.active .bc15-v16-reisen');
    await shot('04-reisen','#bc15-v16-journey-dialog[open]');
    await click('#bc15-v16-journey-dialog[open] .bc15-v16-dialog-close');
  }
  const homeNav=selector=>readyHome+' .bc12-nav [data-camp="'+selector+'"]:visible';
  await click(homeNav('explore'));
  await shot('04b-utforsk','#home-screen.active .bc12-nav [data-camp="explore"][aria-current="page"]');
  await click('#home-screen.active .bc12-nav [data-camp="home"]:visible');
  await click(homeNav('wardrobe'));
  await shot('05-mine-troll','#laria-premium-troll-dialog[open]');
  await click('#laria-premium-troll-dialog[open] .laria-troll-dialog-close');

  await open('norwegian');
  await shot('06-norsk','#eggenipa-world');
  const reading=loc('#eggenipa-world :is(.eg-scene-reading,.eg-portal[data-eg="reading"]):visible').first();
  await reading.click();
  await showExercise('norwegian','reading','07-lesekroken');
  const readQuestion=await page.evaluate(()=>sessionQuestions[qIndex].answer);
  await chooseName(readQuestion);
  await loc('#session-screen.active #next-question').waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>currentAnswered?.correct),true);
  await shot('08-riktig-og-troll','#session-screen.active #next-question');
  await closeTask();
  await openHome();

  await open('math');
  await shot('09-matte','#tallvika-world');
  const navMath=action=>loc('#tallvika-world [data-tv="'+action+'"]:visible');
  await navMath('multiply').click();
  const gm=loc('#multiplication-lab-screen.active .gm-shell');
  await shot('10-gangemagi','#multiplication-lab-screen.active .gm-shell');
  const sum=Number(await gm.getAttribute('data-gm-sum'));
  await gm.locator('[data-gm-action="source"]').click();
  await gm.locator('[data-gm-action="basket"][data-gm-basket="0"]').click();
  assert.equal(Number(await gm.getAttribute('data-gm-sum')),sum+1);
  await gm.locator('#multiplication-lab-back').click();
  await navMath('fraction').click();
  const fr=loc('#fraction-lab-screen.active .fr2-shell');
  await fr.locator('.fr2-pie-builder [data-fr-action="piece"][data-piece="2"]').click();
  assert.equal(await fr.locator('.fr6-result .fr2-fraction').getAttribute('aria-label'),'2 av 4');
  await shot('11-broklab','#fraction-lab-screen.active .fr2-shell');
  await fr.locator('#fraction-lab-back').click();
  await navMath('table').click();
  const mp=loc('#multiplication-lab-screen.active .mp-shell');
  await mp.locator('.mp-grid-cell:visible').first().click();
  assert.equal(await mp.locator('.mp-grid-cell').count(),100);
  await shot('12-gangetabellen','#multiplication-lab-screen.active .mp-shell');
  await mp.locator('#multiplication-lab-back').click();
  await navMath('next').click();
  const mission=loc('#journey-mission-backdrop:not([hidden]) #journey-mission-start:visible');
  if(await mission.isVisible())await mission.click();
  await showExercise('math',null,'13-matteoppgave');
  const mathScope=await page.evaluate(()=>({
    node:sessionScope?.journeyNode,
    size:sessionQuestions.length,
    before:JSON.stringify(state.journey)
  }));
  assert.ok(mathScope.node,'Next adventure was not a real Math journey node');
  assert.ok(mathScope.size>0&&mathScope.size<=20);
  for(let i=0;i<mathScope.size;i++){
   const answer=await page.evaluate(()=>sessionQuestions[qIndex].answer);
   if(await loc('#session-screen.active #math-input').isVisible()){
    await loc('#session-screen.active #math-input').fill(String(answer));await click('#session-screen.active #check-number');
   }else await chooseName(answer);
   assert.equal(await page.evaluate(()=>currentAnswered?.correct),true);
   await click('#session-screen.active #next-question');
  }
  await shot('13b-reisefremgang','#complete-screen.active');
  assert.notEqual(await page.evaluate(()=>JSON.stringify(state.journey)),mathScope.before,'Completed journey did not persist real progress');
  await click('#complete-screen.active #complete-home');
  await openHome();

  await open('english');
  const english=loc('#kinnaklova-world:visible');
  await page.waitForFunction(()=>['ready','missing','unapproved'].includes(document.querySelector('#kinnaklova-world')?.dataset.kiArt));
  assert.equal(await english.getAttribute('data-ki-art'),'ready','Locked English art did not pass integrity');
  await shot('14-engelsk','#kinnaklova-world');
  await english.locator(':is(.ki-painted-words,.ki-card[data-ki="words"]):visible').first().click();
  await showExercise('english','words','15-engelskoppgave');
  const englishAnswer=await page.evaluate(()=>({
   correct:sessionQuestions[qIndex].answer,
   wrong:sessionQuestions[qIndex].options.find(option=>option!==sessionQuestions[qIndex].answer)
  }));
  const beforeWrong=await page.evaluate(()=>state.answerLog.length);
  await chooseName(englishAnswer.wrong);
  await shot('15b-prove-igjen','#session-screen.active #feedback-title');
  assert.match(await loc('#feedback-title').innerText(),/Nesten|Prøv/i);
  await chooseName(englishAnswer.correct);
  await loc('#session-screen.active #next-question').waitFor({state:'visible'});
  const retried=await page.evaluate(()=>({result:currentAnswered,logged:state.answerLog.length}));
  assert.equal(retried.result?.corrected,true,'A correct retry did not unlock the next question');
  assert.equal(retried.result?.selected,englishAnswer.correct);
  assert.equal(retried.result?.correct,false,'A retry should not inflate the first-attempt score');
  assert.equal(retried.logged,beforeWrong+1,'A retry must not log the same question twice');
  await closeTask();
  await openHome();

  await open('geography');
  const geo=loc('#laria-geography-world:visible');
  await shot('16-geografi','#laria-geography-world');
  await geo.locator('[data-gv="country"]').click();
  await shot('17-land-og-flagg','#session-screen.active[data-land-flag]');
  assert.match(await loc('#session-screen.active #session-count').innerText(),/Oppdrag 1 av 5/);
  for(let i=0;i<5;i++){
   const q=await page.evaluate(()=>({type:sessionQuestions[qIndex].type,answer:sessionQuestions[qIndex].answer,options:sessionQuestions[qIndex].options}));
   if(q.type==='map'){
    await click('#session-screen.active #land-flag-map-choices summary');
    const btn=loc('#session-screen.active [data-land-flag-map="'+q.answer+'"]');
    await btn.click();
   }else await chooseName(q.answer);
   assert.equal(await page.evaluate(()=>currentAnswered?.correct),true,'Geography answer was not counted');
   await click('#session-screen.active #next-question');
  }
  await shot('18-fullfort','#complete-screen.active');
  const logs=await page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2')).sessionLog.length);
  assert.ok(logs>=2,'Completed Maths and Geography sessions not persisted');
  await click('#complete-screen.active #complete-home');
  await geo.locator('[data-gv="globe"]').click();
  const world=loc('#world-screen.active');
  await world.locator('#atlas-canvas[data-map-ready="true"]').waitFor({timeout:28000});
  await shot('19-kloden','#world-screen.active');
  await world.locator('.laria-atlas-find summary').click();
  await world.locator('#world-search').fill('Norge');
  await world.getByRole('button',{name:/Norge/}).filter({has:page.locator('.name')}).first().click();
  await world.getByRole('button',{name:'Lær mer om Norge'}).click();
  await shot('20-oppdag-norge','#detail-screen.active');
  await click('#detail-screen.active #detail-back');
  await world.waitFor();
  await openHome();

  await click(homeNav('collection'));
  await shot('21-samlebok','#bc12-dialog[open] .lmc-shell');
  await click('#bc12-dialog[open] .bc12-close');
  const adultEntry=loc(readyHome+' .bc12-adult-entry:visible');
  await adultEntry.click();
  assert.equal(await loc('#adult-screen.active').count(),0,'A normal tap opens adult controls');
  await adultEntry.click({delay:1750});
  await shot('22-for-voksne','#adult-screen.active');
  const adultName=(await loc('#adult-profile-name').innerText()).trim();
  assert.equal(adultName,name);
  await click('#adult-screen.active #open-commerce');
  await shot('23-abonnement','#commerce-screen.active');
  await click('#commerce-screen.active #commerce-back');
  await click('#adult-screen.active #adult-back');
  await page.reload({waitUntil:'domcontentloaded'});
  await loc(readyHome).waitFor();
  await checkProfile();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2')).sessionLog.length),logs);
  assert.deepEqual(errors,[],'Browser runtime exceptions');
  console.log('PASS investor journey',kind,width,height,evidence.length+' screenshots');
  return {kind,width,height,touch,passed:true,evidence,issues,missing};
 }catch(err){
  const note={kind,width,height,touch,passed:false,lastStep,error:String(err),evidence,issues,errors,missing};
  await page.screenshot({path:path.join(out,prefix+'-failure.jpg'),animations:'disabled',type:'jpeg'}).catch(()=>{});
  console.error('FAIL investor journey',kind,width,height,lastStep,String(err));
  return note;
 }finally{await context.close();}
}
async function run(){
 await fs.mkdir(out,{recursive:true});
 const manifest={sha,app:base,reducedMotion:true,externalNetworkBlocked:true,serviceWorkers:'blocked',runs:[]};
 for(const [kind,type] of [['chromium',chromium],['webkit',webkit]]){
  if(process.env.LARIA_DEMO_ENGINE&&kind!==process.env.LARIA_DEMO_ENGINE)continue;
  const exe=kind==='chromium'&&process.env.LARIA_CHROMIUM_PATH;
  for(const [w,h,touch] of views){
   // Fresh browser as well as a fresh context: release decoded scenic artwork
   // between viewports and keep one renderer crash from masking later runs.
   const browser=await type.launch(exe?{executablePath:exe,args:['--no-sandbox']}:undefined);
   try{
    manifest.runs.push(await verify(browser,kind,w,h,touch));
   }finally{await browser.close();}
   await fs.writeFile(path.join(out,'manifest-'+sha.slice(0,12)+'-'+(process.env.LARIA_DEMO_ENGINE||'both')+'.json'),JSON.stringify(manifest,null,2));
  }
 }
 assert.ok(manifest.runs.length,'No browser runs selected');
 if(manifest.runs.some(r=>!r.passed))process.exitCode=1;
}
if(require.main===module)run().catch(error=>{console.error(error);process.exitCode=1});
