'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const openHomeSubject=require('./helpers/laria-home-open-subject.cjs');

const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const output=process.env.LARIA_BACK_CONTROL_SHOTS||'/tmp/laria-back-control';
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Navigasjon QA',avatar:'girl',setupVersion:2,tallvikaTroll:'storesoster'},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},preferences:{sound:false,autoRead:false},journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
const subjects=[
  ['norwegian','#eggenipa-world'],['math','#tallvika-world'],['english','#kinnaklova-world'],['geography','#laria-geography-world']
];
const ipads={
  '820x1180':{width:820,height:1180},'1024x1366':{width:1024,height:1366},
  '1180x820':{width:1180,height:820},'1024x768':{width:1024,height:768},'1366x1024':{width:1366,height:1024}
};

async function assertControl(page,expected){
 const runtime=await page.evaluate(()=>({
  api:typeof window.LARIA_BACK_CONTROL,
  route:document.querySelector('.screen.active')?.id||null,
  controls:[...document.querySelectorAll('.laria-back-control')].map(control=>({
   parent:control.parentElement?.id||null,display:getComputedStyle(control).display,
   visibility:getComputedStyle(control).visibility,rect:control.getBoundingClientRect().toJSON()
  }))
 }));
 console.log('BACK_RUNTIME',JSON.stringify(runtime));
 assert.equal(runtime.api,'object','shared return-control runtime did not boot: '+JSON.stringify(runtime));
 const control=page.locator('.screen.active > .laria-back-control:visible');
 await control.waitFor({state:'visible',timeout:20000});
 assert.equal(await control.count(),1,'exactly one visible shared back control is required');
 assert.match(await control.getAttribute('aria-label'),new RegExp('^Tilbake til '));
 const box=await control.boundingBox();
 assert.ok(box&&box.width>=44&&box.height>=44,'back control must have a 44px touch target');
 assert.ok(box.x>=0&&box.y>=0,'back control must be within viewport');
 if(expected)assert.match(await control.getAttribute('aria-label'),expected);
 return control;
}
async function visit(engine,name,viewport){
 const engineName=engine===chromium?'chromium':'webkit';
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block',deviceScaleFactor:1});
  await context.addInitScript(value=>localStorage.setItem('laerlittmer-v2',JSON.stringify(value)),seed);
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://raw.githubusercontent.com/**',route=>route.abort());
  await page.route('https://api.worldbank.org/**',route=>route.abort());
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
  await page.locator('#home-screen.active').waitFor({state:'visible',timeout:25000});
  for(const [subject,root] of subjects){
   const before=await page.evaluate(()=>localStorage.getItem('laerlittmer-v2'));
   await openHomeSubject(page,subject);
   await page.locator(root+':visible').waitFor({timeout:26000});
   if(subject==='english')await page.locator('#kinnaklova-world[data-ki-art="ready"]').waitFor({timeout:26000});
   const control=await assertControl(page,/(Hjem|Reisen|Utforsk)$/);
   if(name==='1024x1366'||name==='1366x1024'){
     await fs.promises.mkdir(output,{recursive:true});
     await page.screenshot({path:path.join(output,engineName+'-'+name+'-'+subject+'-after.png'),animations:'disabled'});
   }
   await control.focus();
   await page.keyboard.press('Escape');
   await page.locator('#home-screen.active').waitFor({state:'visible',timeout:18000});
   const after=await page.evaluate(()=>localStorage.getItem('laerlittmer-v2'));
   assert.equal(after,before,'return navigation may not alter persisted learning state');
  }
  assert.deepEqual(errors,[],engineName+' '+name+' page errors');
  console.log('PASS',engineName,name);
 }finally{await browser.close();}
}
(async()=>{
 for(const engine of [chromium,webkit])for(const [name,viewport] of Object.entries(ipads))await visit(engine,name,viewport);
})().catch(error=>{console.error(error);process.exitCode=1});
