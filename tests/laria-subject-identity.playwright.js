'use strict';
const assert=require('node:assert/strict');
const {mkdir}=require('node:fs/promises');
const {chromium,webkit}=require('playwright');
const openSubject=require('./helpers/laria-home-open-subject.cjs');
const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const out=process.env.LARIA_PREMIUM_INTEGRATION_SCREENSHOTS||'/tmp/laria-subject-identity-evidence';
const subjects=[
 ['norwegian','#eggenipa-world .eg-hero','Norsk'],['math','#tallvika-world .tv-scene','Matte'],
 ['english','#kinnaklova-world .ki-stage','Engelsk'],['geography','#laria-geography-world .gv-scene','Geografi']
];
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Eventyrer',avatar:'girl',setupVersion:2,tallvikaTroll:'lillesoster'},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},preferences:{sound:false,autoRead:false},journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
async function metrics(scene){
 return scene.evaluate(el=>{
  const brand=el.querySelector(':scope > :is(.laria-scene-brand,.ki-world-brand) strong');
  const button=el.querySelector(':scope > .laria-reference-heading');
  const title=button.querySelector('strong');
  const rail=el.querySelector('nav[data-laria-premium-sign-art="ready"]');
  const box=el.getBoundingClientRect(), b=brand.getBoundingClientRect(), t=button.getBoundingClientRect(),r=rail.getBoundingClientRect();
  const posts=getComputedStyle(rail,'::before');
  return {logo:{x:b.x,y:b.y,w:b.width,h:b.height,art:getComputedStyle(brand).backgroundImage},
   title:{y:t.y,center:t.x+t.width/2,height:t.height,size:getComputedStyle(title).fontSize,text:title.textContent},
   stage:{x:box.x,y:box.y,w:box.width,h:box.height},railTop:r.top,
   ground:(r.y+parseFloat(posts.top)+parseFloat(posts.height)-box.y)/box.height};
 });
}
async function verify(browser,engine,w,h){
 const phone=w<768, context=await browser.newContext({viewport:{width:w,height:h},hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'});
 try{
  await context.addInitScript(s=>{if(!localStorage.getItem('laerlittmer-v2'))localStorage.setItem('laerlittmer-v2',JSON.stringify(s))},seed);
  const page=await context.newPage(), errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  let reference;
  for(const [subject,selector,title] of phone?subjects.slice(2,3):subjects){
   await openSubject(page,subject);
   const scene=page.locator(selector+'.laria-reference-layout-v1:visible');
   await scene.locator('nav[data-laria-premium-sign-art="ready"]:visible').waitFor({timeout:35000});
   if(subject==='english')await page.locator('#kinnaklova-world[data-ki-art="ready"]').waitFor({timeout:30000});
   const m=await metrics(scene);
   assert.match(m.logo.art,/laria-logo-from-grovanova\.svg/);
   assert.equal(m.title.text,title);
   assert.ok(m.title.y>=m.logo.y+m.logo.h+10,'Logo/title must not overlap '+JSON.stringify(m));
   assert.ok(Math.abs(m.stage.x+m.stage.w/2-m.title.center)<1, 'title centered '+JSON.stringify(m));
   if(!phone){
    const normalized=[m.logo.y-m.stage.y,m.logo.w,m.logo.h,m.title.y-m.stage.y,parseFloat(m.title.size)];
    if(!reference)reference=normalized;
    normalized.forEach((value,i)=>assert.ok(Math.abs(value-reference[i])<1.1,'header differs for '+subject+': '+JSON.stringify([reference,normalized])));
   }else{
    assert.ok(m.ground>.61&&m.ground<.65,'posts must terminate in the meadow '+JSON.stringify(m));
    assert.ok(m.railTop>m.title.y+m.title.height+10,'title must finish before signs');
    const destinations=['words','sentences','reading','word-games'];
    assert.deepEqual(await scene.locator('.laria-premium-sign:visible').evaluateAll(nodes=>nodes.map(node=>node.dataset.ki)),
      destinations,'English must expose exactly four distinct learning destinations');
    const hits=await scene.locator('.laria-premium-sign').evaluateAll(signs=>signs.map(el=>{
     const b=el.getBoundingClientRect(),label=el.querySelector('.laria-premium-sign-label'),r=document.createRange();
     r.selectNodeContents(label);
     return b.height>=44&&r.getBoundingClientRect().right<=label.getBoundingClientRect().right&&
      document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)?.closest('button')===el;
    }));
    assert.deepEqual(hits,destinations.map(()=>true));
   }
   await page.screenshot({path:out+'/'+engine+'-'+w+'x'+h+'-subject-header-'+subject+'.png',animations:'disabled'});
   if(phone){
    await scene.locator('.laria-reference-heading').click();
    assert.equal(await scene.locator('[data-laria-ref-subject]:visible').count(),5);
    assert.equal(await scene.locator('.laria-premium-sign:visible').count(),0);
    await scene.locator('[data-laria-ref-subject="english"]:visible').click();
    await scene.locator('[data-ki="words"].laria-premium-sign').tap();
    await page.locator('#session-screen.active .laria-task-card').waitFor({timeout:16000});
    assert.equal(await page.evaluate(()=>sessionScope.subject+':'+sessionScope.module),'english:words');
   }else{
    await scene.locator('button.laria-scene-home:visible').click();
    await page.locator('#home-screen.active').waitFor({timeout:20000});
   }
  }
  assert.deepEqual(errors,[]);
  console.log('PASS subject identity',engine,w,h);
 }finally{await context.close()}
}
async function run(){
 await mkdir(out,{recursive:true});
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
  if(process.env.LARIA_SUBJECT_ENGINE&&process.env.LARIA_SUBJECT_ENGINE!==engine)continue;
  const local=engine==='chromium'&&process.env.LARIA_CHROMIUM_PATH;
  const browser=await type.launch(local?{executablePath:local,args:['--no-sandbox']}:{}); 
  try{for(const [w,h] of [[1180,820],[820,1180],[390,844],[375,667]])await verify(browser,engine,w,h);}
  finally{await browser.close()}
 }
}
module.exports=run;
if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1});
