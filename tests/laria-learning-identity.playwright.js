'use strict';
const assert=require('node:assert/strict');
const {mkdir}=require('node:fs/promises');
const {chromium,webkit}=require('playwright');
const subject=require('./helpers/laria-home-open-subject.cjs');
const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const out=process.env.LARIA_PREMIUM_INTEGRATION_SCREENSHOTS||'/tmp/laria-learning-identity';
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Eventyrer',avatar:'girl',setupVersion:2,tallvikaTroll:'lillesoster'},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},preferences:{sound:false,autoRead:false},journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
async function verify(browser,engine,width,height){
 const context=await browser.newContext({viewport:{width,height},hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'});
 try{
  await context.addInitScript(s=>{if(!localStorage.getItem('laerlittmer-v2'))localStorage.setItem('laerlittmer-v2',JSON.stringify(s));},seed);
  const page=await context.newPage(), errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  const art=(height>width?'portrait':'wide');
  const shot=async tag=>{await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length&&i.loading!=='lazy').every(i=>i.complete),null,{timeout:2500}).catch(()=>{});await page.screenshot({path:out+'/'+engine+'-'+width+'x'+height+'-learn-'+tag+'.jpg',type:'jpeg',quality:89,animations:'disabled'})};
  const artVisible=async (locator,file)=>{
   const css=await locator.evaluate(el=>getComputedStyle(el).backgroundImage);
   assert.ok(css.includes(file),css+' should include '+file);
   await page.evaluate(async({s})=>{
    const m=s.match(/url\("([^"]+)"\)/g); if(!m)return;
    for(const found of m){const img=new Image();img.src=found.slice(5,-2);await img.decode();}
   },{s:css});
  };
  await subject(page,'math');
  const math=page.locator('#tallvika-world');
  await math.locator('[data-tv="multiply"]').tap();
  const gm=page.locator('#multiplication-lab-screen.active .gm-shell');
  await gm.waitFor();await artVisible(gm,'tallvika-fjord-no-buildings-'+art);
  await shot('gangemagi');
  const sum=await gm.getAttribute('data-gm-sum');await gm.locator('[data-gm-action="source"]').tap();await gm.locator('[data-gm-action="basket"][data-gm-basket="0"]').tap();
  assert.equal(Number(await gm.getAttribute('data-gm-sum')),Number(sum)+1);
  await gm.locator('#multiplication-lab-back').tap();await math.locator('[data-tv="fraction"]').tap();
  const fr=page.locator('#fraction-lab-screen.active .fr2-shell');
  await fr.waitFor();await artVisible(fr,'tallvika-fjord-no-buildings-'+art);
  await shot('broklab');
  await fr.locator('.fr2-pie-builder [data-fr-action="piece"][data-piece="2"]').tap();
  assert.equal(await fr.locator('.fr6-result .fr2-fraction').getAttribute('aria-label'),'2 av 4');
  await fr.locator('#fraction-lab-back').tap();await math.locator('[data-tv="table"]').tap();
  const mp=page.locator('#multiplication-lab-screen.active .mp-shell');
  await mp.waitFor();await artVisible(mp,'tallvika-fjord-no-buildings-'+art);
  assert.equal(await mp.locator('.mp-grid-cell').count(),100);
  await mp.locator('.mp-grid-cell:visible').first().tap();await shot('gangetabell');
  await mp.locator('.mp-explore-tab[data-mode="pick"]').tap();await mp.locator('.mp-pick-screen').waitFor();
  await mp.locator('#multiplication-lab-back').tap();
  await math.locator('[data-tv="next"]').tap();
  const task=page.locator('#session-screen.task-scene.active[data-task-subject="math"]');
  await task.waitFor();
  const taskArt=await task.evaluate(el=>getComputedStyle(el).getPropertyValue('--task-world'));
  assert.match(taskArt,new RegExp('tallvika-fjord-no-buildings-'+art));
  await shot('matte');
  await task.locator('#close-session').tap();
  const exitModal=page.locator('#modal-exit :is(.primary,.danger):visible').first();
  if(await exitModal.isVisible())await exitModal.tap();
  // Reset only the view for the next independent test; don't mutate progress.
  await page.reload({waitUntil:'domcontentloaded'});
  await subject(page,'geography');
  await page.locator('#laria-geography-world [data-gv="globe"]').tap();
  const w=page.locator('#world-screen.active.atlas-perspective-on');
  await w.locator('#atlas-canvas[data-map-ready="true"]').waitFor({timeout:25000});
  await artVisible(w,'nordlysleiren-bluehour-'+(height>width?'portrait':'landscape'));
  assert.equal(await w.locator('#random-country').isVisible(),false);
  await shot('kloden');
  const more=w.locator('.laria-atlas-more summary');await more.focus();await page.keyboard.press('Enter');
  assert.equal(await w.locator('#random-country').isVisible(),true);
  await page.keyboard.press('Escape');assert.equal(await w.locator('#random-country').isVisible(),false);
  await w.locator('.laria-atlas-find summary').tap();
  await w.locator('#world-search').fill('Norge');
  await w.getByRole('button',{name:/Norge/}).filter({has:page.locator('.name')}).tap();
  await w.getByRole('button',{name:'Lær mer om Norge'}).waitFor();
  assert.equal(await w.locator(".premium-country-learn span").evaluate(el=>getComputedStyle(el).color),"rgb(255, 249, 232)");
  await shot('kloden-land');
  await w.getByRole('button',{name:'Lær mer om Norge'}).tap();
  const detail=page.locator('#detail-screen.active');
  await detail.waitFor();
  await detail.locator('#detail-back').tap();await w.waitFor();
  await w.locator('[data-globe-mode="classic"]').tap();
  await page.locator('#world-screen.active[data-map-perspective="globe"] #globe-canvas:visible').waitFor();
  await page.locator('#world-screen.active [data-globe-mode="explore"]').tap();await w.waitFor();
  await w.getByRole('button',{name:'Lær mer om Norge'}).waitFor();
  assert.deepEqual(errors,[]);
  console.log('PASS learning identity',engine,width,height);
 }finally{await context.close()}
}
async function run(){
 await mkdir(out,{recursive:true});
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
  if(process.env.LARIA_LEARNING_ENGINE&&process.env.LARIA_LEARNING_ENGINE!==engine)continue;
  const local=engine==='chromium'&&process.env.LARIA_CHROMIUM_PATH;
  const browser=await type.launch(local?{executablePath:local,args:['--no-sandbox']}:{}); 
  try{for(const [w,h] of [[1180,820],[820,1180],[390,844],[1440,900]])await verify(browser,engine,w,h);}
  finally{await browser.close()}
 }
}
module.exports=run;
if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1});
