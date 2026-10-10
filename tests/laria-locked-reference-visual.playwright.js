'use strict';
/* REAL original-image browser evidence. This is intentionally different from
 * the SVG decoder-stub interaction test: it runs only when all four approved
 * original PNGs have actually been committed. Screenshots + visible hotspots
 * are evidence to compare with the 10 Oct library originals, NOT a substitute
 * for final human reference comparison.
 */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'..','laer-litt-mer','locked-journeys');
const output=process.env.LOCKED_ORIGINAL_QA||'/tmp/laria-locked-originals';
const files={
 norwegian:'bokskogen-locked-20261010.png',
 math:'tallenga-locked-20261010.png',
 english:'ordlandsbyen-locked-20261010.png',
 geography:'nordlysleiren-locked-20261010.png'
};
const missing=Object.values(files).filter(name=>!fs.existsSync(path.join(root,name)));
if(missing.length){
 console.log('[ORIGINAL ART NOT VERIFIED] Missing: '+missing.join(', '));
 console.log('[ORIGINAL ART NOT VERIFIED] PNG browser screenshots and reference comparison remain BLOCKED.');
 process.exit(0);
}
fs.mkdirSync(output,{recursive:true});
const seed={version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'OriginalQA',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},
 preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
async function check(engine,label,viewport){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport,isMobile:viewport.width<600,hasTouch:true,
    reducedMotion:'reduce',serviceWorkers:'block',deviceScaleFactor:1});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.addInitScript(value=>{
    localStorage.setItem('laerlittmer-v2',JSON.stringify(value));
    window.LARIA_LOCKED_JOURNEY_QA_ART=true;
  },seed);
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
  await page.goto(url+'&locked-original='+label,{waitUntil:'domcontentloaded'});
  await page.locator('.bc14-subject[data-camp="subject-norwegian"]').waitFor({timeout:16000});
  for(const subject of Object.keys(files)){
   const screen=subject==='geography'?'geography':'subject';
   await page.locator('.bc14-subject[data-camp="subject-'+subject+'"]').click();
   await page.locator('#'+screen+'-screen.active').waitFor();
   await page.waitForFunction(s=>{
    const host=document.querySelector('.screen.active .locked-journey-map');
    const image=host?.querySelector('.locked-journey-image');
    return host?.dataset.journeySubject===s&&image?.complete&&
      image?.naturalWidth===941&&image?.naturalHeight===1672;
   },subject,{timeout:16000});
   const board=page.locator('.screen.active .locked-journey-board');
   const hits=board.locator('.locked-journey-hotspot');
   assert.equal(await hits.count(),5);
   const boardSize=await board.boundingBox();
   assert(Math.abs(boardSize.width/boardSize.height-941/1672)<.004,label+' '+subject+' stretched original');
   await board.screenshot({path:path.join(output,label+'-'+subject+'-live.png')});
   // Review copy: outlines each of the five touch surfaces. This debug style
   // is added ONLY for QA and is not persisted into production.
   const overlayStyle=await page.addStyleTag({content:
     '.locked-journey-hotspot{background:rgba(255,248,80,.18)!important;border:2px solid #f0db42!important}'+
     '.locked-journey-hotspot::before{border:2px dashed rgba(150,31,31,.75)!important}'});
   await board.screenshot({path:path.join(output,label+'-'+subject+'-tap-zones.png')});
   await overlayStyle.evaluate(el=>el.remove());
   // Disable all UI overlays for one raster-level comparison of rendered art
   // against the exact source PNG already supplied by the GitHub repository.
   const hide=await page.addStyleTag({content:
     '.locked-journey-board > :not(.locked-journey-image){visibility:hidden!important}'});
   const clean=await board.screenshot();
   await hide.evaluate(el=>el.remove());
   const comparison=await page.evaluate(async b64=>{
    const original=document.querySelector('.screen.active .locked-journey-image');
    const shot=new Image();
    shot.src='data:image/png;base64,'+b64;
    await shot.decode();
    const w=shot.naturalWidth,h=shot.naturalHeight;
    const a=document.createElement('canvas'),b=document.createElement('canvas');
    a.width=b.width=w;a.height=b.height=h;
    const ca=a.getContext('2d',{willReadFrequently:true}),cb=b.getContext('2d',{willReadFrequently:true});
    ca.drawImage(shot,0,0,w,h);
    cb.drawImage(original,0,0,w,h);
    const aa=ca.getImageData(0,0,w,h).data,bb=cb.getImageData(0,0,w,h).data;
    let sum=0,count=0,outlier=0;
    for(let y=20;y<h-20;y+=3)for(let x=20;x<w-20;x+=3){
      const i=(y*w+x)*4;
      const d=(Math.abs(aa[i]-bb[i])+Math.abs(aa[i+1]-bb[i+1])+Math.abs(aa[i+2]-bb[i+2]))/3;
      sum+=d;count++;if(d>50)outlier++;
    }
    return {width:w,height:h,meanDelta:count?sum/count:null,bigPixelDifferenceRatio:count?outlier/count:null};
   },clean.toString('base64'));
   assert(Number.isFinite(comparison.meanDelta),label+' screenshot not decoded');
   assert(comparison.meanDelta<14,label+' '+subject+' original art differs on screen '+JSON.stringify(comparison));
   assert(comparison.bigPixelDifferenceRatio<.09,label+' '+subject+' painted area clipped/overdrawn '+JSON.stringify(comparison));
   console.log('[original PNG raster]',label,subject,JSON.stringify(comparison));
   await board.locator('.locked-journey-hotspot').last().click();
   await page.locator('.locked-journey-overlay:not([hidden])').waitFor();
   await page.locator('.locked-sheet-close').click();
   await board.locator('.locked-journey-back').click();
   await page.locator('#home-screen.active').waitFor();
  }
  assert.deepEqual(errors,[],label+' runtime errors');
  await context.close();
 }finally{await browser.close()}
}
(async()=>{
 for(const [label,engine,viewport] of [
  ['chromium-iphone',chromium,{width:390,height:844}],
  ['webkit-iphone',webkit,{width:390,height:844}],
  ['webkit-iphone-landscape',webkit,{width:667,height:375}],
  ['webkit-ipad',webkit,{width:820,height:1180}],
  ['webkit-ipad-landscape',webkit,{width:1180,height:820}]
 ])await check(engine,label,viewport);
 console.log('[LOCKED REFERENCES] Raster/geometry compared to repository originals. Manual parity against approved Library art is still REQUIRED before release.');
})().catch(error=>{console.error(error);process.exitCode=1});
