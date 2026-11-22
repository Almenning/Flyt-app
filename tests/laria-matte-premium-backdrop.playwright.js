'use strict';
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const openHomeSubject=require('./helpers/laria-home-open-subject.cjs');
const out=process.env.LARIA_MATH_BACKDROP_QA||'/tmp/laria-matte-backdrops';
const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
fs.mkdirSync(out,{recursive:true});
const seed={version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'Tallvika QA',avatar:'girl',setupVersion:2,tallvikaTroll:'storesoster'},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},
 preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,
 lastActivity:null,journey:{nodes:{},gradeWins:{},viewGrades:{}},
 answerLog:[],sessionLog:[],activeSession:null};
async function imageEvidence(page,selector){
 return page.locator(selector).evaluate(async el=>{
   const background=getComputedStyle(el).backgroundImage;
   const match=background.match(/url\(["']?([^"')]+)["']?\)/);
   if(!match)return {background,art:null};
   const image=await new Promise(resolve=>{
     const img=new Image();
     img.onload=()=>resolve({src:img.src,width:img.naturalWidth,height:img.naturalHeight});
     img.onerror=()=>resolve({src:img.src,width:0,height:0});
     img.src=match[1];
   });
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   return {background,art:image};
 });
}
(async()=>{
 const records=[];
 for(const [engine,type] of [['webkit',webkit],['chromium',chromium]]){
  const browser=await type.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
  try{
   for(const [orientation,viewport,art] of [
     ['portrait',{width:820,height:1180},'portrait'],
     ['landscape',{width:1180,height:820},'wide']
   ]){
    const ctx=await browser.newContext({viewport,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
    await ctx.addInitScript(profile=>localStorage.setItem('laerlittmer-v2',JSON.stringify(profile)),seed);
    const page=await ctx.newPage();const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
    await openHomeSubject(page,'math');
    await page.locator('#tallvika-world .tv-sign[data-tv="table"]').click();
    await page.locator('#multiplication-lab-screen.active .mp-explore-screen').waitFor({state:'visible',timeout:20000});
    const table=await imageEvidence(page,'#multiplication-lab-screen.active .mp-scenery');
    assert.match(table.background,new RegExp('tallvika-fjord-no-buildings-'+art+'-20261107\\.webp'));
    assert.ok(table.art?.width>=700&&table.art?.height>=700,engine+' '+orientation+' table art not loaded');
    await page.locator('#multiplication-lab-back').click();
    await page.locator('#tallvika-world .tv-sign[data-tv="multiply"]').waitFor({state:'visible',timeout:12000});
    await page.locator('#tallvika-world .tv-sign[data-tv="multiply"]').click();
    await page.locator('#multiplication-lab-screen.active .gm-shell[data-gm-mode="mission"]').waitFor({state:'visible',timeout:18000});
    const market=await imageEvidence(page,'#multiplication-lab-screen.active .gm-shell[data-gm-mode="mission"] .gm-world');
    assert.match(market.background,/gangemagi-tallenga-market-v1\.svg/,
      engine+' '+orientation+' approved strawberry scene was replaced');
    await page.locator('.gm-secondary-card[data-gm-action="mode"][data-mode="free"]').click();
    await page.locator('#multiplication-lab-screen.active .gm-shell[data-gm-mode="free"]').waitFor({state:'visible',timeout:15000});
    const free=await imageEvidence(page,'#multiplication-lab-screen.active .gm-shell[data-gm-mode="free"] .gm-world');
    assert.match(free.background,new RegExp('tallvika-fjord-no-buildings-'+art+'-20261107\\.webp'));
    assert.ok(free.art?.width>=700&&free.art?.height>=700,engine+' '+orientation+' free art not loaded');
    await page.screenshot({path:path.join(out,engine+'-'+orientation+'-gangemagi-free.png'),animations:'disabled'});
    assert.deepEqual(errors,[],engine+' '+orientation+' page errors');
    records.push({engine,orientation,table,market,free});
    console.log('PASS '+engine+' '+orientation+' approved Tallvika background reused in activities; mission market retained');
    await ctx.close();
   }
  }finally{await browser.close()}
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(records,null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1});
