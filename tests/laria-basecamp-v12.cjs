/* Læria basecamp v12 + Ordjakt: local browser regression and responsive touch checks. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const engines=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browserName=process.env.LEARNING_BROWSER||'chromium';
assert.ok(['chromium','webkit'].includes(browserName),'unsupported LEARNING_BROWSER');
(async()=>{
 const browser=await engines[browserName].launch({headless:true});
 const screenshots=process.env.QA_SCREENSHOTS||'/tmp/laria-v12-qa';fs.mkdirSync(screenshots,{recursive:true});
 const errors=[];
 for(const [name,width,height] of [['ipad-landscape',1180,820],['ipad-portrait',820,1180],['iphone',390,844],['large-iphone',430,932],['small-phone',320,568],['desktop',1024,768]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(name+': '+e.message));
  await page.addInitScript(()=>{if(!localStorage.getItem('laerlittmer-v2'))localStorage.setItem('laerlittmer-v2',JSON.stringify({profile:{grade:2,onboarded:true,name:'Testbarn',avatar:'girl',setupVersion:2}}))});
  await page.goto(process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/',{waitUntil:'networkidle'});
  await page.locator('.bc12').waitFor({state:'visible'});
  await page.screenshot({path:`${screenshots}/${browserName}-${name}-home.png`,fullPage:true});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+' horizontal overflow');
  await checkHome(page,name);

  for(const [action,screen,back] of [['globe','world','world-back'],['fraction','fraction-lab','fraction-lab-back'],['multiply','multiplication-lab','multiplication-lab-back']]){
   await page.locator(`.bc12-place[data-camp="${action}"]`).tap();
   await page.locator(`#${screen}-screen.active`).waitFor();
   await page.locator('#'+back).tap();await page.locator('#home-screen.active').waitFor();
  }

  await page.locator('.bc12-place[data-camp="words"]').tap();
  const hunt=page.locator('#word-hunt-overlay');await hunt.waitFor({state:'visible'});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+' Ordjakt overflow');
  const pick=await page.evaluate(()=>{
    const cells=[...document.querySelectorAll('.word-hunt-cell')];
    const size=Math.round(Math.sqrt(cells.length));
    const letters=cells.map(x=>x.textContent.trim());
    const word=document.querySelector('.word-hunt-word')?.textContent.replace(/^✓\s*/,'').trim();
    const dirs=[[0,1],[1,0],[0,-1],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];
    if(!word)return null;
    for(let r=0;r<size;r++)for(let c=0;c<size;c++)for(const [dr,dc] of dirs){
      let s='',rr=r,cc=c;for(let i=0;i<word.length;i++,rr+=dr,cc+=dc){
        if(rr<0||cc<0||rr>=size||cc>=size){s='';break}s+=letters[rr*size+cc];
      }
      if(s===word)return {word,start:[r,c],end:[r+dr*(word.length-1),c+dc*(word.length-1)]};
    }
    return null;
  });
  assert(pick,name+' could not locate first Ordjakt word in grid');
  await page.locator(`.word-hunt-cell[data-r="${pick.start[0]}"][data-c="${pick.start[1]}"]`).tap();
  await page.locator(`.word-hunt-cell[data-r="${pick.end[0]}"][data-c="${pick.end[1]}"]`).tap();
  assert(await page.locator('.word-hunt-word.found').count()>=1,name+' Ordjakt selection did not register');
  await page.locator('.word-hunt-back').tap();await hunt.waitFor({state:'hidden'});

  await page.locator('.bc12-journey').tap();await page.locator('#subject-screen.active').waitFor();
  await page.screenshot({path:`${screenshots}/${browserName}-${name}-journey.png`,fullPage:true});
  await page.locator('.bok-v10-place.state-current').tap();await page.locator('#session-screen.active').waitFor();
  await page.screenshot({path:`${screenshots}/${browserName}-${name}-task.png`,fullPage:true});
  await answerCurrent(page);await page.locator('#next-question').tap();
  const active=await page.evaluate(()=>JSON.stringify(state.activeSession));
  await page.reload({waitUntil:'networkidle'});await page.locator('#home-screen.active').waitFor();
  assert.equal(await page.evaluate(()=>JSON.stringify(state.activeSession)),active,name+' saved session changed after refresh');
  await page.locator('.bc12-journey').tap();await page.locator('#session-screen.active').waitFor();
  assert.equal(await page.evaluate(()=>qIndex),1,name+' journey did not resume at the saved question');
  while(await page.evaluate(()=>activeScreenName()==='session')){await answerCurrent(page);await page.locator('#next-question').tap()}
  await page.locator('#complete-screen.active').waitFor();await page.locator('#complete-home').tap();
  await page.locator('#subject-screen.active').waitFor();
  const saved=await progressSnapshot(page);
  assert.ok(saved.answerLog.length>=3&&saved.sessionLog.length>=1,name+' completed activity was not saved');
  const statuses=await page.locator('.bok-v10-place').evaluateAll(els=>els.map(el=>({id:el.dataset.v10Place,status:el.className})));
  await page.locator('.bok-v10-home').tap();
  await page.locator('[data-camp="quest"]').tap();assert(await page.locator('#bc12-dialog').isVisible());await page.getByRole('button',{name:'Kanskje senere'}).tap();
  await page.locator('.bc12-nav [data-camp="collection"]').tap();await page.getByRole('heading',{name:'Samlingen din'}).waitFor();await page.getByRole('button',{name:'Tilbake til basecamp'}).tap();
  await page.locator('.bc12-nav [data-camp="explore"]').tap();assert.equal(await page.locator('.bc12 h1').textContent(),'Hva vil du leke med?');
  assert.equal(await page.locator('[data-camp-fox-call]').textContent(),'Velg noe du liker!');
  await page.locator('.bc12-nav [data-camp="home"]').tap();
  await page.reload({waitUntil:'networkidle'});await page.locator('#home-screen.active').waitFor();
  assert.deepEqual(await progressSnapshot(page),saved,name+' profile/progress changed after reload');
  assert.equal(await page.locator('.bc12-fox img').evaluate(img=>img.src===window.LARIA_PROFILE_AVATARS.girl),true,name+' selected fox changed');
  await page.locator('.bc12-nav [data-camp="travel"]').tap();await page.locator('#subject-screen.active').waitFor();
  assert.deepEqual(await page.locator('.bok-v10-place').evaluateAll(els=>els.map(el=>({id:el.dataset.v10Place,status:el.className}))),statuses,name+' destination states changed after reload');
  await page.locator('.bok-v10-home').tap();
  await page.setViewportSize({width,height:height-90});await checkHome(page,name+' browser toolbar');
  await page.setViewportSize({width,height});await checkHome(page,name+' restored viewport');
  if(name==='ipad-portrait'){
   await page.setViewportSize({width:1180,height:820});await checkHome(page,name+' rotated');
   await page.setViewportSize({width,height});await checkHome(page,name+' rotated back');
  }
  assert.equal(await page.evaluate(()=>state.profile.grade),2);
  console.log(browserName+' '+name+': active layers, touch, routes, optional quest, collection, real activity, session resume, persistent profile/progress, resize passed');
  await context.close();
 }
 assert.deepEqual(errors,[],'No JS errors');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

async function checkHome(page,label){
 const result=await page.evaluate(()=>{
  const camp=document.querySelector('.bc12'),r=camp.getBoundingClientRect();
  const controls=[...camp.querySelectorAll('[data-camp]')].map(el=>{const b=el.getBoundingClientRect(),x=b.left+b.width/2,y=b.top+b.height/2;return {action:el.dataset.camp,w:b.width,h:b.height,l:b.left,r:b.right,t:b.top,b:b.bottom,hit:el.contains(document.elementFromPoint(x,y))}});
  return {w:innerWidth,h:innerHeight,sw:document.documentElement.scrollWidth,top:r.top,bottom:r.bottom,controls,css:[...document.styleSheets].map(s=>s.href).filter(Boolean),js:[...document.scripts].map(s=>s.src).filter(Boolean),images:[...camp.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth>0)};
 });
 assert.ok(result.sw<=result.w+1,label+' horizontal overflow');
 assert.ok(result.top>=-1&&result.bottom<=result.h+1,label+' basecamp outside viewport');
 assert.equal(result.images,true,label+' broken fox asset');
 assert.ok(result.css.some(s=>s.includes('laria-foundation-v1.css')),label+' missing foundation');
 assert.equal(result.css.filter(s=>/home-basecamp-v\d+\.css/.test(s)).length,1,label+' competing Home styles');
 assert.ok(result.js.some(s=>s.includes('home-basecamp-v12.js')),label+' missing active Home');
 assert.equal(result.js.filter(s=>/home-basecamp-v\d+\.js/.test(s)).length,1,label+' competing Home runtime');
 for(const c of result.controls){
  assert.ok(c.w>=44&&c.h>=44,label+' small touch target '+JSON.stringify(c));
  assert.ok(c.l>=-1&&c.r<=result.w+1&&c.t>=-1&&c.b<=result.h+1,label+' clipped control '+JSON.stringify(c));
  assert.equal(c.hit,true,label+' covered control '+JSON.stringify(c));
 }
}
async function progressSnapshot(page){return page.evaluate(()=>JSON.parse(JSON.stringify({profile:state.profile,mastery:state.mastery,skillMastery:state.skillMastery,masteryEvidence:state.masteryEvidence,skillEvidence:state.skillEvidence,journey:state.journey,answerLog:state.answerLog,sessionLog:state.sessionLog})))}
async function answerCurrent(page){
 await page.evaluate(()=>{
  const q=sessionQuestions[qIndex];if(!q)throw new Error('missing current question');
  if(q.type==='learning-choice')document.querySelectorAll('.answer').forEach(el=>{if(el.dataset.answer===String(q.answer))el.click()});
  else if(q.type==='build-word'){
   const used=new Set();q.answer.split('').forEach((ch,s)=>{const i=q.letters.findIndex((x,j)=>x.l===ch&&!used.has(j));if(i<0)throw new Error('missing letter');used.add(i);document.querySelector('.letter-slot[data-slot="'+s+'"]').click();document.querySelector('.letter-tile[data-idx="'+i+'"]').click()});document.querySelector('#check-build').click();
  }else if(q.type==='sentence-order'){
   const used=new Set();for(const word of q.answer.split(' ')){const i=q.words.findIndex((x,j)=>x===word&&!used.has(j));used.add(i);document.querySelector('.word-tile[data-idx="'+i+'"]').click()}document.querySelector('#check-sentence').click();
  }else throw new Error('unsupported Norwegian question '+q.type);
 });
 await page.locator('#next-question').waitFor({state:'visible'});
}
