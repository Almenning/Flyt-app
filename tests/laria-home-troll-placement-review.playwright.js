'use strict';
/* Review-only TrollActor placement experiments on the ACTUAL locked Home v16.
 * Injects transient CSS in Playwright; DOES NOT modify app CSS, assets or
 * default placement. Every screenshot is explicitly a review candidate. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {webkit}=require('playwright');

const output=process.env.TROLL_PLACEMENT_SCREENSHOTS||
  '/tmp/laria-home-v16-mac/troll-placement-preview';
fs.mkdirSync(output,{recursive:true});
const base=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const seed={version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'Prøvebarn',avatar:'girl',
 setupVersion:2,tallvikaTroll:'storesoster'},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
 masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
 lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},
 answerLog:[],sessionLog:[],activeSession:null};

const options={
 a:{
  portrait:{width:'clamp(155px,17.3vw,194px)',height:'26vh',right:'3.6%',bottom:'14%'},
  landscape:{width:'clamp(124px,11vw,170px)',height:'28vh',right:'8%',bottom:'20%'}
 },
 b:{
  portrait:{width:'clamp(170px,19.1vw,210px)',height:'29.2vh',right:'1.5%',bottom:'14%'},
  landscape:{width:'clamp(142px,12.6vw,190px)',height:'32.2vh',right:'6%',bottom:'20%'}
 },
 c:{
  portrait:{width:'clamp(187px,21vw,226px)',height:'31.8vh',right:'.5%',bottom:'14%'},
  landscape:{width:'clamp(150px,13.8vw,200px)',height:'35.6vh',right:'5%',bottom:'19.8%'}
 }
};
function style(choice,orientation){
 const v=options[choice][orientation];
 const target='.grade-band-young #home-screen.active .bc12.bc15-v16-locked .bc15-v16-troll.laria-troll-host';
 return target+'{width:'+v.width+'!important;height:'+v.height+
  '!important;right:'+v.right+'!important;bottom:'+v.bottom+
  '!important;left:auto!important;top:auto!important;}'+
  target+'::before{content:"";position:absolute;left:11%;bottom:-1%;'+
  'width:78%;height:11%;pointer-events:none;z-index:0;'+
  'border-radius:50%;background:radial-gradient(ellipse,rgba(19,24,15,.35),rgba(19,24,15,0) 72%);'+
  'filter:blur(4px);transform:scaleY(.43);}'+
  target+' > img{z-index:1!important;}';
}
const results=[];
(async()=>{
 const browser=await webkit.launch({headless:true});
 try{
  for(const [orientation,viewport] of [
   ['portrait',{width:1024,height:1366}],
   ['landscape',{width:1366,height:1024}]
  ])for(const choice of ['original','a','b','c']){
   const context=await browser.newContext({viewport,isMobile:true,hasTouch:true,
     reducedMotion:'reduce',serviceWorkers:'block'});
   const page=await context.newPage();
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(v=>localStorage.setItem('laerlittmer-v2',JSON.stringify(v)),seed);
   await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
   await page.route('https://api.worldbank.org/**',r=>r.abort());
   const url=new URL(base);
   url.searchParams.set('app','laria');
   url.searchParams.set('troll-placement-qa',choice+'-'+orientation);
   await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:65000});
   await page.waitForFunction(dir=>{
    const el=document.querySelector('#home-screen.active .bc12');
    return el?.dataset.bc15Asset==='ipad-v16-'+dir &&
      el.querySelectorAll('.bc15-v16-sign').length===4;
   },orientation,{timeout:40000});
   if(choice!=='original')await page.addStyleTag({content:style(choice,orientation)});
   const actor=page.locator('#home-screen.active .bc15-v16-troll');
   await actor.waitFor({state:'visible',timeout:10000});
   await actor.locator('img').evaluate(img=>img.decode());
   await page.waitForTimeout(140);
   const geometry=await page.evaluate(()=>{
    const parent=document.querySelector('#home-screen.active .bc12');
    const actor=parent.querySelector('.bc15-v16-troll');
    const b=actor.getBoundingClientRect(),h=parent.getBoundingClientRect();
    const nav=parent.querySelector('.bc12-nav').getBoundingClientRect();
    const signs=[...parent.querySelectorAll('.bc15-v16-sign')].map(x=>x.getBoundingClientRect());
    const journey=parent.querySelector('.bc12-journey').getBoundingClientRect();
    const overlap=(a,c)=>Math.max(0,Math.min(a.right,c.right)-Math.max(a.left,c.left))*
      Math.max(0,Math.min(a.bottom,c.bottom)-Math.max(a.top,c.top));
    return {
     stage:{width:h.width,height:h.height},
     actor:{x:b.x-h.x,y:b.y-h.y,width:b.width,height:b.height,
      right:b.right-h.x,bottom:b.bottom-h.y},
     navTop:nav.top-h.y,
     maxSignOverlap:Math.max(0,...signs.map(s=>overlap(b,s))),
     journeyOverlap:overlap(b,journey),
     source:actor.querySelector('img')?.getAttribute('src')||null,
     selected:actor.dataset.troll
    };
   });
   assert.equal(geometry.selected,'storesoster','review must use the selected locked character');
   assert.ok(geometry.actor.x>=0&&geometry.actor.y>=0&&
     geometry.actor.right<=viewport.width+1,'full character should stay inside right edge');
   assert.ok(geometry.actor.bottom<=geometry.navTop-5,
     'character feet must remain above the painted bottom navigation');
   assert.equal(geometry.maxSignOverlap,0,'actor may not overlap any of the four subject signs');
   assert.equal(geometry.journeyOverlap,0,'actor may not cover Fortsett reisen');
   assert.deepEqual(errors,[],'no runtime errors in Home placement review');
   const file=path.join(output,orientation+'-'+choice+'.png');
   await page.screenshot({path:file,fullPage:false,animations:'disabled'});
   results.push({orientation,variant:choice,viewport,geometry,screenshot:path.basename(file)});
   console.log('[Troll placement review] '+orientation+' '+choice+' '+JSON.stringify(geometry.actor));
   await context.close();
  }
 }finally{await browser.close();}
 fs.writeFileSync(path.join(output,'review-evidence.json'),JSON.stringify({
  source:'actual Læria Home v16 at workflow checkout SHA',
  method:'temporary CSS injected after page loaded, not implemented in production code',
  variants:options,results},null,2)+'\n');
})().catch(error=>{console.error(error);process.exitCode=1});
