'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const out=process.env.HOME_V15_SCREENSHOTS;
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Elev',avatar:'girl',setupVersion:2,tallvikaTroll:'lillesoster'},preferences:{sound:false,autoRead:false},journey:{nodes:{},gradeWins:{},viewGrades:{},chapterProgress:{}},answerLog:[],sessionLog:[],activeSession:null};
const base='#home-screen.active .bc12.bc15-v16-locked';
const patch='iphone-portrait-journey-meadow.webp';
async function verify(browser,name,width,height,badPatch=false){
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:width<600||height<600,
  deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
 try{
  const portrait=height>width&&width<600;
  await ctx.addInitScript(value=>localStorage.setItem('laerlittmer-v2',JSON.stringify(value)),seed);
  const page=await ctx.newPage(),requests=[],errors=[];
  page.on('request',r=>{if(r.url().endsWith(patch))requests.push(r.url())});
  page.on('pageerror',e=>errors.push(String(e)));
  await page.route('https://**/*',r=>r.abort());
  if(badPatch)await page.route('**/'+patch,route=>route.fulfill({contentType:'image/webp',body:'incorrect digest'}));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  const home=page.locator(base);
  await home.locator('.bc15-v16-troll img').evaluate(img=>img.decode(),null,{timeout:30000});
  assert.equal(await home.getAttribute('data-bc15-v16-portrait-journey'),portrait&&!badPatch?'approved':null);
  const layers=home.locator('.bc15-v16-portrait-journey-layer');
  assert.equal(await layers.count(),portrait&&!badPatch?2:0);
  assert.equal(requests.length,portrait?1:0);
  const metrics=await home.evaluate(e=>{
   const frame=e.getBoundingClientRect();
   const buttons=[...e.querySelectorAll('.bc15-v16-reisen,.bc12-journey')].sort((a,b)=>
    a.classList.contains('bc15-v16-reisen')?-1:b.classList.contains('bc15-v16-reisen')?1:0);
   return {top:frame.top,viewH:frame.height,
    docScroll:document.documentElement.scrollHeight-innerHeight,
    navTop:e.querySelector('.bc12-nav').getBoundingClientRect().top,
    painted:buttons.map(b=>{const r=b.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
     return {x,y,w:r.width,h:r.height,bottom:r.bottom,hit:b.contains(document.elementFromPoint(x,y))};})};
  });
  if(portrait&&!badPatch){
   assert.equal(metrics.docScroll,0);
   assert.ok(metrics.painted.every(p=>p.hit&&p.w>=44&&p.h>=44),JSON.stringify(metrics));
   assert.ok(Math.abs((metrics.painted[0].y-metrics.top)/metrics.viewH-.65)<.01);
   assert.ok(metrics.painted[0].y<metrics.painted[1].y&&metrics.painted[1].bottom<metrics.navTop);
   if(out){
    fs.mkdirSync(out,{recursive:true});
    await page.screenshot({path:path.join(out,'iphone-journey-'+name+'-'+width+'x'+height+'.jpg'),type:'jpeg',quality:92,animations:'disabled'});
   }
   await page.touchscreen.tap(metrics.painted[0].x,metrics.painted[0].y);
   await page.locator('#bc15-v16-journey-dialog[open]').waitFor();
   await page.locator('.bc15-v16-dialog-close').tap();
   await page.touchscreen.tap(metrics.painted[1].x,metrics.painted[1].y);
   await page.locator('#home-screen.active').waitFor({state:'hidden',timeout:12000});
  }
  if(badPatch){
   assert.ok(metrics.painted[0].y<metrics.viewH*.60,'must fall back to painted original geometry');
   assert.ok(metrics.painted.every(p=>p.hit),'fallback journey remains actionable');
  }
  assert.deepEqual(errors,[]);
  console.log('PASS iPhone Home journey',name,width,height,badPatch?'SHA fallback':'');
 }finally{await ctx.close()}
}
async function runPhoneJourney(){for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
  for(const [width,height] of [[320,568],[390,844],[430,932],[844,390],[820,1180]])
   await verify(browser,name,width,height);
  await verify(browser,name,390,844,true);
 }finally{await browser.close()}
}}
module.exports=runPhoneJourney;
if(require.main===module)runPhoneJourney().catch(e=>{console.error(e);process.exitCode=1});
