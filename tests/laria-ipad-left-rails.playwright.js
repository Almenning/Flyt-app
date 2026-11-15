'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const output=process.env.LARIA_IPAD_RAIL_SHOTS||'/tmp/laria-ipad-rails';
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'iPad QA',avatar:'girl',setupVersion:2,tallvikaTroll:'lillesoster'},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
const subjects=[
 {id:'norwegian',home:'subject-norwegian',root:'#eggenipa-world',scene:'.eg-hero',attr:'data-eg',signs:['words','find','reading'],title:'Norsk'},
 {id:'math',home:'subject-math',root:'#tallvika-world',scene:'.tv-scene',attr:'data-tv',signs:['multiply','fraction','table'],title:'Matte'},
 {id:'geography',home:'subject-geography',root:'#laria-geography-world',scene:'.gv-scene',attr:'data-gv',signs:['journey','globe','country'],title:'Geografi'}
];
async function enter(page,s,ipad){
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
 const entry=page.locator('#home-screen .bc14-subject[data-camp="'+s.home+'"]');
 await entry.waitFor({state:'visible',timeout:26000});await entry.click();
 await page.locator(s.id==='geography'&&!ipad?'#geography-screen.active':s.root).waitFor({state:'visible',timeout:22000});
}
async function run(engine,name,device,viewport,s,ipad){
 const browser=await engine.launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport,hasTouch:true,isMobile:!ipad,serviceWorkers:'block',reducedMotion:'reduce'});
  await context.addInitScript(v=>localStorage.setItem('laerlittmer-v2',JSON.stringify(v)),seed);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
   await enter(page,s,ipad);
   assert.equal(await page.evaluate(()=>window.LARIA_IPAD_RAILS?.enabled()),ipad,'Tablet breakpoint');
   const stage=page.locator(s.root+' '+s.scene);
   const rail=stage.locator('> nav.laria-ipad-left-rail');
   if(!ipad){
    assert.equal(await rail.count(),0,'iPhone must keep original interface');
    if(s.id==='geography')assert.equal(await page.locator('#laria-geography-world').count(),0);
    console.log('PASS unchanged-phone',name,device,s.id);return;
   }
   await rail.waitFor({state:'visible',timeout:15000});
   assert.equal(await stage.getAttribute('data-laria-ipad-rail'),'ready');
   const buttons=rail.locator('button.laria-ipad-sign');
   assert.deepEqual(await buttons.evaluateAll((els,attr)=>els.map(el=>el.getAttribute(attr)),s.attr),s.signs);
   const coords=await buttons.evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}}));
   assert.ok(coords.every(c=>c.x<viewport.width*.32&&c.w>=150&&c.h>=44),'Signs must fit and stay left: '+JSON.stringify(coords));
   assert.ok(Math.max(...coords.map(c=>c.x))-Math.min(...coords.map(c=>c.x))<3,'Signs need a single x anchor');
   const post=await rail.evaluate(el=>getComputedStyle(el,'::before').backgroundImage);
   assert.match(post,/laria-grovanova-signposts\.svg/,'Same double posts as Kinnaklova');
   const sign=await buttons.first().evaluate(el=>getComputedStyle(el).backgroundImage);
   assert.match(sign,/laria-light-arrow-sign\.svg/,'Same planks as Kinnaklova');
   assert.equal(await stage.locator('> .laria-ipad-brand').count(),1);
   assert.equal(await stage.locator('> .laria-ipad-heading strong').textContent(),s.title);
   assert.equal(await stage.locator('> .laria-ipad-actor[data-troll="lillesoster"]').count(),1);
   const overlap=await stage.evaluate(el=>{
    const a=el.querySelector('.laria-ipad-brand').getBoundingClientRect();
    const b=el.querySelector('.laria-ipad-heading').getBoundingClientRect();
    return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
   });
   assert.equal(overlap,false,'Logo overlaps subject title');
   if(s.id==='norwegian')assert.match(await stage.locator('.eg-master').getAttribute('src'),/eggenipa-master-laast-20261025\.png/);
   if(s.id==='math')assert.match(await stage.evaluate(el=>getComputedStyle(el).backgroundImage),/tallvika-fjord-no-buildings-(wide|portrait)-20261107\.webp/);
   if(s.id==='geography')assert.match(await stage.locator('.gv-landscape').getAttribute('src'),/geography-premium\.webp/);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+3),true,'No horizontal overflow');
   fs.mkdirSync(output,{recursive:true});
   await page.screenshot({path:path.join(output,name+'-'+device+'-'+s.id+'.png'),animations:'disabled'});
   await buttons.first().click();
   if(s.id==='norwegian')await page.locator('#word-hunt-overlay').waitFor({state:'visible',timeout:16000});
   if(s.id==='math')await page.locator('#multiplication-lab-screen.active').waitFor({timeout:16000});
   if(s.id==='geography')await page.locator('#laria-geography-world').waitFor({state:'hidden',timeout:16000});
   assert.deepEqual(errors,[],'Unexpected browser JS errors');
   console.log('PASS',name,device,s.id,coords.map(c=>Math.round(c.x)).join(','));
  }finally{await context.close();}
 }finally{await browser.close();}
}
(async()=>{
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  for(const [device,viewport] of [['ipad-landscape',{width:1366,height:1024}],['ipad-portrait',{width:1024,height:1366}],['ipad-mini',{width:1024,height:768}]]){
   for(const s of subjects)await run(engine,name,device,viewport,s,true);
  }
  for(const [device,viewport] of [['iphone-portrait',{width:390,height:844}],['iphone-landscape',{width:844,height:390}]]){
   for(const s of subjects)await run(engine,name,device,viewport,s,false);
  }
 }
})().catch(e=>{console.error(e);process.exitCode=1});
