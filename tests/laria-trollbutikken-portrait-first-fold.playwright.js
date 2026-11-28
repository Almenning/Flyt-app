'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const openHomeSubject=require('./helpers/laria-home-open-subject.cjs');
const url=process.env.QA_URL||'http://127.0.0.1:8910/laria/';
const screenshots=process.env.TB_PORTRAIT_SHOTS;
const prefix='#trollbutikken-screen.active ';
const control=(name,value='',key='id')=>prefix+'[data-tb-action="'+name+'"]'+(value?'[data-tb-'+key+'="'+value+'"]':'');
const grade2={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Prøvebarn',avatar:'girl',tallvikaTroll:'storesoster',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{},chapterProgress:{}},answerLog:[],sessionLog:[],activeSession:null};
async function verify(browser,engine,width,height){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
 const page=await context.newPage(),errors=[],measurements=[];
 page.setDefaultTimeout(24000);
 page.on('pageerror',error=>errors.push(error.message));
 const ready=(sel)=>page.waitForFunction(x=>document.querySelector(x),sel,{polling:65});
 const phase=(mode,stage)=>ready(prefix+'.tb-room[data-tb-mode="'+mode+'"][data-tb-phase="'+stage+'"]');
 const text=(sel)=>page.evaluate(x=>document.querySelector(x)?.textContent||'',sel);
 const read=()=>text(prefix+'#tb-helper-copy');
 const data=sel=>page.evaluate(selector=>{
  const s=document.querySelector('#trollbutikken-screen.active'),v=visualViewport||{width:innerWidth,height:innerHeight};
  return [...document.querySelectorAll(selector)].map(node=>{
   const box=node.getBoundingClientRect();
   const x=box.x+box.width/2,y=box.y+box.height/2;
   return {id:node.dataset.tbAction||node.dataset.tv||'',text:node.textContent.trim(),x,y,left:box.left,top:box.top,bottom:box.bottom,
    width:box.width,height:box.height,hit:node.contains(document.elementFromPoint(x,y)),
    inside:box.left>=-1&&box.top>=-1&&box.right<=v.width+1&&box.bottom<=v.height+1,
    scroll:s?.scrollTop||0,overflow:s&&s.scrollWidth>s.clientWidth+1};
  });
 },sel);
 const checked=async(sel,label,targets=true)=>{
  const boxes=await data(sel);
  assert.ok(boxes.length,label+' missing');
  for(const b of boxes)assert.ok(b.inside&&b.scroll===0&&!b.overflow&&(!targets||(b.hit&&b.width>=44&&b.height>=44)),label+' '+JSON.stringify(b));
  measurements.push({label,boxes});
  return boxes;
 };
 const tap=async(sel,label=sel)=>{const [b]=await checked(sel,label);await page.touchscreen.tap(b.x,b.y)};
 const act=(id,value,key)=>tap(control(id,String(value??''),key),id+(value?' '+value:''));
 const photo=async(label)=>{
  if(!screenshots)return;
  fs.mkdirSync(screenshots,{recursive:true});
  await page.screenshot({path:path.join(screenshots,engine+'-'+width+'x'+height+'-'+label+'.png'),animations:'disabled'});
 };
 const fill=async(order)=>{for(const [id,n] of Object.entries(order))for(let i=0;i<n;i++)await act('add',id)};
 try{
  await context.addInitScript(seed=>localStorage.setItem('laerlittmer-v2',JSON.stringify(seed)),grade2);
  await page.route('https://**/*',request=>request.abort());
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
  await openHomeSubject(page,'math',{keyboard:engine==='webkit'&&process.env.LARIA_WPE_KEYBOARD==='1'});
  await ready('#tallvika-world [data-tv="shop"]');
  await tap('#tallvika-world [data-tv="shop"]','Tallvika: Trollbutikken');
  await phase('entry','welcome');
  await act('start');await phase('owner','pick');
  await checked(control('add'),'all six physical shelf goods');
  await act('hint');assert.match(await read(),/handlelappen|kurven/);
  await photo('01-hint');
  await act('add','carrot');await act('basket');
  await act('remove','carrot');
  await fill({apple:3,bread:2});
  await checked(control('remove'),'grouped items can be removed');
  await checked(control('hint'),'hint after basket filled');
  await photo('02-basket');
  await act('basket');await phase('owner','register');
  await checked(prefix+'.tb-machineKeys button','all twelve cashier keys');
  await act('scan','apple');await act('scan','bread');await act('keypad','3','key');await act('keypad','5','key');
  await tap(prefix+'[data-tb-price-confirm]','confirm 35 kr');
  await phase('owner','change');
  await checked(control('coin'),'all four change denominations');
  await act('coin','1000','coin');await act('coin','500','coin');
  await act('settle');await phase('owner','receipt');
  assert.match(await text(prefix+'.tb-receipt'),/35 kr \+ 15 kr = 50 kr/);
  await checked(control('next'),'owner receipt next');
  await photo('03-owner-receipt');
  await act('next');await phase('owner','pick');

  await act('trip');await phase('trip','pick');
  await fill({apple:3,bread:1,milk:1});
  await checked(control('remove'),'all grouped trip basket edits');
  await act('trip-check');assert.match(await read(),/mer enn du har/);
  await act('hint');assert.match(await text(prefix+'.tb-tripOver'),/3 kr/);
  await photo('04-budget');
  await act('remove','apple');await act('trip-check');await phase('trip','pay');
  for(const [value,count] of [[2000,1],[500,1],[100,5]])for(let i=0;i<count;i++)await act('coin',value,'coin');
  await checked(control('uncoin'),'all seven removable payment coins');
  await checked(control('hint'),'payment help');
  await photo('05-pay');
  await act('trip-pay');await phase('trip','done');
  assert.match(await text(prefix+'.tb-receipt'),/30 kr − 28 kr = 2 kr igjen/);
  await checked(control('trip-next'),'customer receipt next');
  await photo('06-customer-receipt');
  await act('trip-next');await phase('trip','pick');await act('resume');await phase('owner','pick');

  await act('warehouse');await phase('warehouse','stock');
  await checked(control('stock-add'),'all three warehouse bin add controls');
  await checked(control('stock-remove'),'all three warehouse bin remove controls');
  await act('hint');
  for(let i=0;i<5;i++)await act('stock-add',String(0),'index');
  await act('stock-remove',String(0),'index');
  for(const bin of [1,2])for(let i=0;i<4;i++)await act('stock-add',String(bin),'index');
  await checked(control('stock-check'),'warehouse check after all bins filled');
  await photo('07-warehouse');
  await act('stock-check');await phase('warehouse','done');
  await act('stock-next');await phase('warehouse','stock');
  await act('resume');await phase('owner','pick');
  await act('back');await ready('#subject-screen.active #tallvika-world');
  assert.deepEqual(errors,[]);
  console.log('PASS Trollbutikken portrait',engine,width+'×'+height,measurements.length,'touch checkpoints; zero viewport scrolling');
 }catch(error){await photo('REJECTED').catch(()=>{});throw error}
 finally{
  if(screenshots&&measurements.length){
   fs.mkdirSync(screenshots,{recursive:true});
   fs.writeFileSync(path.join(screenshots,engine+'-'+width+'x'+height+'.json'),JSON.stringify(measurements,null,2));
  }
  await context.close();
 }
}
(async()=>{
 const failures=[];
 for(const [name,run] of [['chromium',chromium],['webkit',webkit]]){
  if(process.env.TB_PORTRAIT_ENGINE&&name!==process.env.TB_PORTRAIT_ENGINE)continue;
  const browser=await run.launch({headless:true,...(name==='chromium'&&process.env.LARIA_CHROMIUM_EXECUTABLE?{executablePath:process.env.LARIA_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--renderer-process-limit=1']}:{})});
  try{
   for(const [width,height] of [[390,844],[375,667]]){
    if(process.env.TB_PORTRAIT_WIDTH&&width!==Number(process.env.TB_PORTRAIT_WIDTH))continue;
    try{await verify(browser,name,width,height)}catch(error){failures.push(name+' '+width);console.error(error)}
   }
  }finally{await browser.close()}
 }
 assert.deepEqual(failures,[]);
})().catch(error=>{console.error(error);process.exitCode=1});
