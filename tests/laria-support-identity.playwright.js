'use strict';
const assert=require('node:assert/strict');
const {mkdir}=require('node:fs/promises');
const {chromium,webkit}=require('playwright');
const openSubject=require('./helpers/laria-home-open-subject.cjs');
const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const out=process.env.LARIA_PREMIUM_INTEGRATION_SCREENSHOTS||'/tmp/laria-support-identity';
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Eventyrer',avatar:'girl',setupVersion:2,tallvikaTroll:'lillesoster'},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},preferences:{sound:false,autoRead:false},journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
async function verify(browser,engine,w,h){
 const context=await browser.newContext({viewport:{width:w,height:h},hasTouch:w<1400,serviceWorkers:'block',reducedMotion:'reduce'});
 try{
  await context.addInitScript(s=>{if(!localStorage.getItem('laerlittmer-v2'))localStorage.setItem('laerlittmer-v2',JSON.stringify(s));},seed);
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  const shot=tag=>page.screenshot({path:out+'/'+engine+'-'+w+'x'+h+'-support-'+tag+'.jpg',type:'jpeg',quality:89,animations:'disabled'});
  const adultEntry=page.locator('#home-screen.active .bc12-adult-entry:visible');
  if(w>=768)await page.locator('#home-screen.active .bc15-v16-locked').waitFor({timeout:30000});
  await adultEntry.click({delay:1800});
  const adult=page.locator('#adult-screen.active');
  await adult.waitFor();
  await adult.locator('#open-commerce').click();
  const commerce=page.locator('#commerce-screen.active');
  await commerce.waitFor();
  await commerce.getByRole('heading',{name:'Hele læringsreisen'}).waitFor();
  assert.equal(await commerce.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(248, 243, 232)');
  await shot('abonnement');
  await commerce.locator('#commerce-back').click();
  await adult.locator('#open-terms').click();
  const terms=page.locator('#terms-screen.active');
  await terms.getByRole('heading',{name:'Vilkår og personvern'}).waitFor();
  await shot('vilkar');
  await terms.locator('#terms-back').click();await adult.locator('#adult-back').click();
  await openSubject(page,'math');
  if(h>w){
   await page.locator('#tallvika-world [data-tv="multiply"]').click();
   const market=page.locator('#multiplication-lab-screen.active .gm-shell');
   await market.waitFor();
   const height=await market.evaluate(el=>el.getBoundingClientRect().height);
   assert.ok(height>=h-2,'the subject landscape must cover the whole portrait viewport: '+height);
   await shot('gangemagi-portrait');
   await market.locator('#multiplication-lab-back').click();
  }
  await page.locator('#tallvika-world [data-tv="table"]').click();
  const mp=page.locator('#multiplication-lab-screen.active');
  await mp.locator('.mp-grid-cell:visible').first().waitFor({timeout:20000});
  assert.equal(await mp.locator('.mp-grid-cell').count(),100);
  await mp.locator('.mp-explore-tab[data-mode="pick"]').click();
  const actor=mp.locator('.mp-pick-easy-intro > img');
  await actor.waitFor({timeout:12000});
  const box=await actor.boundingBox();
  assert.ok(box&&box.height<=70&&box.width<=60,'companion must not compete with the task');
  await shot('plukk');
  await mp.locator('#multiplication-lab-back').click();
  await page.evaluate(()=>setTab('progress'));
  const p=page.locator('#progress-screen.active');
  await p.locator('.progress-page-banner').waitFor();
  const banner=await p.locator('.progress-page-banner').evaluate(el=>getComputedStyle(el).backgroundImage);
  assert.match(banner,/nordlysleiren-bluehour/);
  await shot('fremgang');
  assert.deepEqual(errors,[]);
  console.log('PASS support identity',engine,w,h);
 }finally{await context.close()}
}
async function run(){
 await mkdir(out,{recursive:true});
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
  if(process.env.LARIA_SUPPORT_ENGINE&&process.env.LARIA_SUPPORT_ENGINE!==engine)continue;
  const local=engine==='chromium'&&process.env.LARIA_CHROMIUM_PATH;
  const browser=await type.launch(local?{executablePath:local,args:['--no-sandbox']}:{}); 
  try{for(const [w,h] of [[1180,820],[820,1180],[390,844],[1440,900]])await verify(browser,engine,w,h);}
  finally{await browser.close()}
 }
}
module.exports=run;
if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1});
