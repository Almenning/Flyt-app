'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const openHomeSubject=require('./helpers/laria-home-open-subject.cjs');
const url=process.env.QA_URL||'http://127.0.0.1:8910/laria/';
const shots=process.env.LARIA_TABLE_SHOTS;
const viewports=[
 ['mac',1440,900,false,'10,10'],['desktop-short',1280,720,false,'10,10'],
 ['ipad-landscape',1180,820,true,'10,10'],['ipad-base-landscape',1024,768,true,'10,10'],
 ['ipad-portrait',820,1180,true,'10,10'],['phone-landscape',844,390,true,'4,10'],
 ['phone-portrait',390,844,true,'5,5'],['phone-short-landscape',667,375,true,'4,5'],
 ['phone-short-portrait',375,667,true,'4,5'],['phone-smallest-portrait',320,568,true,'3,5']
];
const profile={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Prøvebarn',avatar:'girl',tallvikaTroll:'storesoster',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{},chapterProgress:{}},answerLog:[],sessionLog:[],activeSession:null};
const query='#multiplication-lab-screen.active .table-mode';
async function test(browser,engine,[device,width,height,touch,plan]){
 const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:touch,isMobile:device.startsWith('phone'),reducedMotion:'reduce',serviceWorkers:'block'});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const tap=async (selector)=>{
  const b=page.locator(selector).first();
  await b.waitFor({state:'visible'});
  const r=await b.evaluate(el=>{
   const x=el.getBoundingClientRect();
   return {x:x.left+x.width/2,y:x.top+x.height/2};
  });
  assert.ok(await b.evaluate((el,{x,y})=>el.contains(document.elementFromPoint(x,y)),r),selector+' is not exposed');
  if(touch)await page.touchscreen.tap(r.x,r.y);else await page.mouse.click(r.x,r.y);
 };
 const initialProgress=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2')).answerLog);
 const board=page.locator(query);
 const rowSelect=board.locator('select[data-mp-table-axis="row"]');
 const colSelect=board.locator('select[data-mp-table-axis="col"]');
 async function check(expected){
  const values=await page.locator('#multiplication-lab-screen.active :is(.mp-grid-cell,.mp-pair,.mp-table-page select,.mp-explore-mode-picker select,.mp-explore-tab,.mp-nav-link,.mp-back):visible')
   .evaluateAll(els=>els.map(el=>{
    const r=el.getBoundingClientRect(),v=visualViewport||{width:innerWidth,height:innerHeight};
    const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
    return [el.textContent.trim(),Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height),
      el.contains(hit)&&r.x>=-1&&r.y>=-1&&r.right<=v.width+1&&r.bottom<=v.height+1&&r.width>=44&&r.height>=44];
   }));
  assert.ok(values.length>=expected+1&&(values.every(x=>x[5])),JSON.stringify(values.filter(x=>!x[5])));
  assert.equal(await board.locator('.mp-grid-cell:visible').count(),expected);
  assert.equal(await board.locator('.mp-grid-cell').count(),100);
  assert.equal(await board.locator('.mp-grid-cell.selected:visible').count(),1);
  assert.equal(await board.evaluate(el=>el.scrollWidth<=el.clientWidth+2),true);
  const result=await board.locator('.mp-inspector-equation').boundingBox();
  assert.ok(result&&result.y>=0&&result.y+result.height<=height+1,JSON.stringify(result));
  assert.equal(await page.evaluate(()=>window.scrollY),0);
 }
 const shot=async (suffix)=>{
   if(!shots)return;
   fs.mkdirSync(shots,{recursive:true});
   await page.screenshot({path:path.join(shots,engine+'-'+device+'-'+suffix+'.png'),animations:'disabled'});
 };
 try{
  await ctx.addInitScript(value=>localStorage.setItem('laerlittmer-v2',JSON.stringify(value)),profile);
  await page.route('https://**/*',req=>req.abort());
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
  if(engine==='webkit'&&process.env.LARIA_WPE_KEYBOARD==='1'){
   // The headless Linux WPE harness may stall on the locator stability check;
   // exercise the actual Home accessibility button via a keyboard activation.
   await page.locator('#home-screen.active .bc15-v16-sign[data-bc15-subject="math"]:visible').press('Enter');
  }else await openHomeSubject(page,'math');
  await tap('#tallvika-world [data-tv="table"]');
  await board.waitFor();
  await page.waitForFunction(()=>document.querySelector('.mp-grid-cell.selected')?.getBoundingClientRect().height>=44);
  const [rows,cols]=plan.split(',').map(Number);
  assert.equal(await board.locator('.mp-table-board').getAttribute('data-mp-table-plan'),plan);
  const r=Number(await board.locator('.mp-grid-cell.selected').getAttribute('data-row'));
  await check(Math.min(rows,10-Math.floor((r-1)/rows)*rows)*cols);
  const active='[data-row="4"][data-col="6"]';
  await tap(query+' .mp-grid-cell'+active);
  assert.match(await board.locator('.mp-inspector-equation').innerText(),/4 × 6 = 24/);
  const factors=await board.locator('.mp-pair-buttons button').allTextContents();
  assert.deepEqual(factors,['3 × 8','4 × 6','6 × 4','8 × 3']);
  await page.waitForFunction(()=>[...document.querySelectorAll('.table-mode .mp-mascot-small > img.laria-premium-troll-art')].some(img=>img.complete&&img.naturalWidth>0));
  assert.equal(await board.locator('.laria-troll-speech:visible').count(),0);
  await shot('24');
  await tap(query+' .mp-pair[data-row="8"][data-col="3"]');
  assert.match(await board.locator('.mp-inspector-equation').innerText(),/8 × 3 = 24/);
  await board.locator('.mp-grid-cell.selected').press('ArrowDown');
  assert.match(await board.locator('.mp-inspector-equation').innerText(),/9 × 3 = 27/);
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.row),'9');
  if(rows<10){
   await rowSelect.selectOption(String(Math.floor(9/rows)*rows+1));
   if(cols<10)await colSelect.selectOption('6');
   await tap(query+' .mp-grid-cell[data-row="10"][data-col="10"]');
   assert.match(await board.locator('.mp-inspector-equation').innerText(),/10 × 10 = 100/);
   await check((10-Math.floor(9/rows)*rows)*cols);
   await shot('100');
  }else{
   await tap(query+' .mp-grid-cell[data-row="10"][data-col="10"]');
   assert.match(await board.locator('.mp-inspector-equation').innerText(),/10 × 10 = 100/);
   await check(100);
  }
  if(device==='phone-landscape'||device==='phone-short-landscape'){
   const picker=page.getByRole('combobox',{name:'Velg aktivitet'});
   assert.equal(await picker.locator('option').count(),7);
   await picker.selectOption('swap');
   await page.locator('.mp-swap-pair').waitFor();
   assert.equal(await page.evaluate(()=>document.activeElement.dataset.mode),'swap');
   await tap('#multiplication-lab-screen.active .mp-explore-tab[data-mode="table"]');
   await board.waitFor();
   assert.match(await board.locator('.mp-inspector-equation').innerText(),/10 × 10 = 100/);
   await tap('#multiplication-lab-screen.active .mp-nav-link[data-page="home"]');
   await tap('#multiplication-lab-screen.active .mp-nav-link[data-page="explore"]');
   await board.waitFor();
  }
  if(device==='phone-landscape'){
   await page.setViewportSize({width:390,height:844});
   await page.locator(query+' [data-mp-table-plan="5,5"]').waitFor();
   assert.equal(await board.locator('.mp-grid-cell.selected').getAttribute('data-row'),'10');
   assert.equal(await board.locator('.mp-grid-cell.selected').getAttribute('data-col'),'10');
   await page.setViewportSize({width,height});
   await page.locator(query+' [data-mp-table-plan="4,10"]').waitFor();
  }
  if(device==='phone-smallest-portrait'){
   const picker=page.getByRole('combobox',{name:'Velg aktivitet'});
   assert.equal(await picker.locator('option').count(),7);
   await picker.selectOption('swap');
   await page.locator('.mp-swap-pair').waitFor();
   assert.equal(await page.evaluate(()=>document.activeElement.dataset.mode),'swap');
   await page.locator('.mp-explore-tab[data-mode="table"]').press('Enter');
   await board.waitFor();
   assert.match(await board.locator('.mp-inspector-equation').innerText(),/10 × 10 = 100/);
  }
  assert.deepEqual(await initialProgress(),[]);
  await tap('#multiplication-lab-back');
  await page.locator('#subject-screen.active #tallvika-world').waitFor();
  assert.deepEqual(errors,[]);
  console.log('Gangetabellen',engine,device,width+'×'+height,plan,'real Hjem/Tallvika, targets, all factors, paging, keyboard, return passed');
 }catch(error){
  await shot('REJECTED').catch(()=>{});
  throw error;
 }finally{await ctx.close()}
}
(async()=>{
 const failed=[];
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
  if(process.env.LARIA_TABLE_ENGINE&&engine!==process.env.LARIA_TABLE_ENGINE)continue;
  const browser=await type.launch({headless:true,...(engine==='chromium'&&process.env.LARIA_CHROMIUM_EXECUTABLE?
   {executablePath:process.env.LARIA_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--renderer-process-limit=1']}:{})});
  try{
   for(const row of viewports){
    if(process.env.LARIA_TABLE_DEVICE&&!new RegExp(process.env.LARIA_TABLE_DEVICE).test(row[0]))continue;
    try{await test(browser,engine,row)}catch(error){failed.push(engine+' '+row[0]);console.error(engine,row[0],error)}
   }
  }finally{await browser.close()}
 }
 assert.deepEqual(failed,[],'Multiplication board device failures');
})().catch(error=>{console.error(error);process.exitCode=1});
