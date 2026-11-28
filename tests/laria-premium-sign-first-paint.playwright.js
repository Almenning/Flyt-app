'use strict';
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const seed={version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'QA',avatar:'girl',setupVersion:2,tallvikaTroll:'lillesoster'},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},masteryEvidence:{},
 preferences:{sound:false,autoRead:false},journey:{nodes:{},gradeWins:{},viewGrades:{}},
 answerLog:[],sessionLog:[],activeSession:null};
const cases=[
 ['norwegian','#eggenipa-world .eg-hero',1920,1080,false,false],
 ['math','#tallvika-world .tv-scene',1920,1080,false,true],
 ['geography','#laria-geography-world .gv-scene',1180,820,true,false],
 ['math','#tallvika-world .tv-scene',820,1180,true,false],
 ['english','#kinnaklova-world .ki-stage',390,844,true,false]
];
const rect=(selector)=>[...document.querySelectorAll(selector)].filter(el=>el.getBoundingClientRect().height>0)
 .map(el=>{
  const {x,y,width,height}=el.getBoundingClientRect();
  return {box:[x,y,width,height],hit:el.contains(document.elementFromPoint(x+width/2,y+height/2))};
 });
async function check(engine,name,[subject,scene,width,height,touch,invalid]){
 const chromiumPath=process.env.LARIA_CHROMIUM_PATH;
 const browser=await engine.launch(name==='chromium'?{
  args:['--no-sandbox',...(chromiumPath?['--no-zygote','--single-process']:[])],
  ...(chromiumPath?{executablePath:chromiumPath}:{})
 }:{});
 let release;
 try{
  const context=await browser.newContext({
   viewport:{width,height},isMobile:width<768,hasTouch:touch,
   reducedMotion:'reduce',serviceWorkers:'block'
  });
  await context.addInitScript(s=>{
   if(location.origin!=='null')localStorage.setItem('laerlittmer-v2',JSON.stringify(s));
  },seed);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const gate=new Promise(resolve=>{release=resolve;});
  await page.route('**/laria-grovanova-v16-landscape-original.png',async route=>{
   await gate;
   if(invalid)await route.continue({url:new URL('qa-intentionally-missing-grovanova-source.png',route.request().url()).href});
   else await route.continue();
  });
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>{
   return /^(ipad|desktop|phone)-v16-(portrait|landscape)$/.test(
    document.querySelector('#home-screen.active .bc12')?.dataset.bc15Asset||'');
  },null,{polling:100,timeout:25000});
  const sign='#home-screen.active .bc15-v16-sign[data-bc15-subject="'+subject+'"]';
  const hit=(await page.evaluate(rect,sign))[0];
  assert.ok(hit?.hit,'the actual Home sign must receive input');
  const [x,y,w,h]=hit.box;
  if(touch)await page.touchscreen.tap(x+w/2,y+h/2);else await page.mouse.click(x+w/2,y+h/2);
  const nav=scene+' > nav.laria-scene-navigation';
  const mode=(v)=>({nav,v});
  const wait=(v)=>page.waitForFunction(({nav,v})=>document.querySelector(nav)?.dataset.lariaPremiumSignArt===v,
   mode(v),{polling:100,timeout:25000});
  await wait('loading');
  if(subject==='english')await page.waitForFunction(()=>document.querySelector('#kinnaklova-world')?.dataset.kiArt==='ready',null,{polling:100,timeout:25000});
  const qs=nav+' > button:is(.laria-wayfinder,.laria-reference-next)';
  const before=await page.evaluate(rect,qs);
  assert.ok(before.length>=2);
  assert.ok(before.every(({box:[x,y,w,h],hit})=>hit&&w>=43.5&&h>=43.5&&
   x>=-.5&&y>=-.5&&x+w<=width+.5&&y+h<=height+.5),'fallback hit targets are usable in the viewport');
  release();await wait(invalid?'blocked':'ready');
  const after=await page.evaluate(rect,qs);
  assert.equal(after.length,before.length);
  after.forEach(({box,hit},i)=>{
   assert.equal(hit,true,'layered art must not cover the button');
   box.forEach((value,j)=>assert.ok(Math.abs(value-before[i].box[j])<.5,
    JSON.stringify({subject,width,height,invalid,before,after})));
  });
  assert.deepEqual(errors,[]);
  await context.close();
  console.log('PASS',name,width+'x'+height,subject,invalid?'safe fallback':'same hitboxes after paint');
 }finally{release?.();await browser.close();}
}
(async()=>{
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  if(process.env.LARIA_FIRST_PAINT_ENGINE&&process.env.LARIA_FIRST_PAINT_ENGINE!==name)continue;
  for(const item of cases)await check(engine,name,item);
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
