'use strict';
/* The approved unified Læria design system, measured in the REAL application.
   Never substitute mockups for device screenshots or alter learning progress. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const URL=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const OUT=process.env.LARIA_IDENTITY_SCREENSHOTS||'/tmp/laria-visual-identity';
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Identitet QA',avatar:'girl',setupVersion:2,tallvikaTroll:'lillesoster'},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},preferences:{sound:false,autoRead:false},journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
const worlds=[
 {id:'norwegian',root:'#eggenipa-world',brand:'.eg-world-brand',home:'.eg-scene-home',sign:'.eg-scene-hit.laria-wayfinder',plate:'.eg-scene-hit.laria-wayfinder > span',post:'::before'},
 {id:'math',root:'#tallvika-world',brand:'.tv-world-brand',home:'.tv-scene-home',sign:'.tv-sign.laria-wayfinder',plate:'.tv-sign.laria-wayfinder',post:'::after'},
 {id:'english',root:'#kinnaklova-world',brand:null,home:'.ki-painted-home',sign:'.ki-painted-hit.laria-wayfinder',plate:null,post:null},
 {id:'geography',root:'#laria-geography-world',brand:'.gv-brand',home:'.gv-home',sign:'.gv-sign.laria-wayfinder',plate:'.gv-sign.laria-wayfinder',post:'::after'}
];
async function run(engine,name,layout,viewport){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport,hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce',deviceScaleFactor:1});
  await context.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:90000});
  const home=page.locator('#home-screen.active .bc12.bc15-locked-home');
  await home.waitFor({state:'visible',timeout:24000});
  await fs.promises.mkdir(OUT,{recursive:true});
  await page.screenshot({path:path.join(OUT,name+'-'+layout+'-home.png'),animations:'disabled'});
  let expectedBrand=null,expectedPlate=null;
  for(const spec of worlds){
   await home.locator('.bc14-subject[data-camp="subject-'+spec.id+'"]').click();
   const world=page.locator(spec.root+':visible');
   await world.waitFor({state:'visible',timeout:18000});
   if(spec.id==='english')await page.locator('#kinnaklova-world[data-ki-art="ready"]').waitFor({timeout:20000});
   const back=world.locator(spec.home+':visible');
   const button=await back.evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return{
     width:r.width,height:r.height,image:s.backgroundImage,top:r.top,left:r.left,role:el.getAttribute('aria-label')
   }});
   assert.ok(button.width>=44&&button.height>=44&&button.left>=0&&button.top>=0,
     name+' '+layout+' '+spec.id+' Home control is not tappable: '+JSON.stringify(button));
   assert.match(button.image,/laria-home-round\.svg/,spec.id+' has a different Home control');
   assert.match(button.role,/Hjem/,spec.id+' Home accessibility text missing');
   const signs=world.locator(spec.sign+':visible');
   assert.equal(await signs.count(),3,spec.id+' should have exactly three navigable scene signs');
   if(spec.brand){
     const brand=await world.locator(spec.brand+':visible').evaluate(el=>{
       const s=getComputedStyle(el),t=getComputedStyle(el.querySelector('strong')),sub=getComputedStyle(el.querySelector('span'));
       return {wood:s.backgroundImage,border:s.borderTopColor,type:t.fontFamily,ink:t.color,subtitle:sub.fontFamily};
     });
     if(!expectedBrand)expectedBrand=brand;
     else assert.deepEqual(brand,expectedBrand,'Different Læria logo family on '+spec.id);
     const plate=await world.locator(spec.plate).first().evaluate((el,post)=>{
       const r=el.getBoundingClientRect(),s=getComputedStyle(el),pole=getComputedStyle(el,post);
       return {width:r.width,height:r.height,background:s.backgroundImage,postContent:pole.content,postBackground:pole.backgroundImage,
         font:s.fontFamily,ink:s.color};
     },spec.post);
     assert.ok(plate.width>=44&&plate.height>=44,spec.id+' sign too small');
     assert.match(plate.background,/laria-light-arrow-sign\.svg/,spec.id+' has a nonstandard plank graphic');
     assert.notEqual(plate.postContent,'none',spec.id+' sign has no posts');
     assert.notEqual(plate.postBackground,'none',spec.id+' sign posts have no wood');
     const style={background:plate.background,font:plate.font,ink:plate.ink};
     if(!expectedPlate)expectedPlate=style;
     else assert.deepEqual(style,expectedPlate,'Sign style diverged for '+spec.id);
   }else{
     // English's SHA-locked scene still includes baked title/sign artwork.
     // Adding DOM duplicates is prohibited. This remains a separate art gate.
     assert.equal(await world.locator('.ki-world-brand:visible').count(),0,
       'Kinnaklova duplicates its painted wordmark');
   }
   await page.screenshot({path:path.join(OUT,name+'-'+layout+'-'+spec.id+'.png'),animations:'disabled'});
   await back.click();
   await home.waitFor({state:'visible',timeout:14000});
  }
  assert.deepEqual(errors,[],name+' '+layout+' browser exceptions');
  await context.close();
  console.log('PASS shared logo/plank/post/Home components in real '+name+' '+layout+' app');
 }finally{await browser.close()}
}
(async()=>{
 for(const [label,viewport] of [
  ['ipad-landscape',{width:1366,height:1024}],
  ['ipad-portrait',{width:1024,height:1366}],
  ['iphone-portrait',{width:390,height:844}],
  ['iphone-landscape',{width:852,height:393}]
 ])for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
   await run(engine,name,label,viewport);
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
