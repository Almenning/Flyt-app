'use strict';
/* Real Brøklab view: compare historic -48px overlap against normal-flow
 * landscape iPad controls, at the exact branch commit. No content/state edits. */
const {webkit,chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const dir=process.env.LARIA_FRACTION_OVERLAP_QA||'/tmp/laria-fraction-overlap';
fs.mkdirSync(dir,{recursive:true});
const base=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const profile={version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'Prøvebarn',avatar:'boy',setupVersion:2,tallvikaTroll:'storesoster'},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},
 preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
const sizes=[
 ['landscape-1180',{width:1180,height:820}],
 ['landscape-1024',{width:1024,height:768}],
 ['landscape-1366',{width:1366,height:1024}]
];
async function details(page){
 return page.evaluate(()=>{
   function rect(sel){const el=document.querySelector(sel),r=el?.getBoundingClientRect();
     return r?{x:+r.x.toFixed(1),y:+r.y.toFixed(1),left:+r.left.toFixed(1),
       right:+r.right.toFixed(1),top:+r.top.toFixed(1),bottom:+r.bottom.toFixed(1),
       width:+r.width.toFixed(1),height:+r.height.toFixed(1)}:null}
   const a=rect('.fr6-workshop .fr6-controls'),b=rect('.fr6-piece-tray');
   const intersection=a&&b?Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*
     Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)):null;
   return {viewport:[innerWidth,innerHeight],scrollWidth:document.documentElement.scrollWidth,
     cake:rect('.fr5-build-target .fr2-pie-builder'),
     controls:a,tray:b,stage:rect('.fr6-workshop .fr6-stage'),
     fraction:rect('.fr6-result .fr2-fraction'),
     actor:rect('.fr5-fox-mentor .laria-premium-troll-art'),
     nav:rect('.fr2-nav.fr6-nav'),
     navTargets:[...document.querySelectorAll('.fr2-nav.fr6-nav .fr2-nav-item')].map(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})),
     overlapArea:intersection,
     buttons:[...document.querySelectorAll('.fr6-workshop .fr6-controls button')].map(x=>{
       const r=x.getBoundingClientRect();return {width:r.width,height:r.height}}),
     actualTransform:getComputedStyle(document.querySelector('.fr6-workshop .fr6-controls')).transform};
 });
}
const all=[];
(async()=>{
 for(const [engine,type] of [['webkit',webkit],['chromium',chromium]]){
   const browser=await type.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
   try{
    for(const [name,viewport] of sizes){
     const context=await browser.newContext({viewport,hasTouch:true,deviceScaleFactor:1,
       reducedMotion:'reduce',serviceWorkers:'block'});
     await context.addInitScript(x=>localStorage.setItem('laerlittmer-v2',JSON.stringify(x)),profile);
     const page=await context.newPage(),errors=[];
     page.on('pageerror',e=>errors.push(e.message));
     await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
     await page.route('https://api.worldbank.org/**',r=>r.abort());
     await page.goto(base,{waitUntil:'domcontentloaded',timeout:80000});
     await page.waitForFunction(()=>window.LARIA_FRACTION_PREMIUM?.version==='workshop-v1',null,{timeout:25000});
     await page.evaluate(()=>openFractionLab());
     await page.locator('#fraction-lab-screen.active .fr6-workshop').waitFor({state:'visible',timeout:15000});
     const legacy=await page.addStyleTag({content:
       '@media (min-width:700px) and (max-width:1400px) and (max-height:900px) and (orientation:landscape){'+
       '#fraction-lab-screen .fr6-workshop .fr6-controls{transform:translateY(-48px)!important;margin-bottom:-48px!important}}'});
     const before=await details(page);
     await page.screenshot({path:path.join(dir,engine+'-'+name+'-before.png'),animations:'disabled'});
     await legacy.evaluate(x=>x.remove());
     const after=await details(page);
     await page.screenshot({path:path.join(dir,engine+'-'+name+'-after.png'),animations:'disabled'});
     all.push({engine,name,before,after});
     console.log('[Brøklab '+engine+' '+name+'] '+JSON.stringify({before,after}));
     assert.ok(after.cake&&after.fraction&&after.controls&&after.tray,
       'Missing core Brøklab controls or pieces');
     assert.ok(after.overlapArea===0,
       engine+' '+name+' controls still overlap loose cake pieces: '+JSON.stringify(after));
     assert.ok(after.controls.top>=0&&after.controls.bottom<=after.viewport[1],
       engine+' '+name+' adjustment controls outside first screen: '+JSON.stringify(after));
     assert.ok(after.actor&&after.actor.height>=150&&after.actor.height<=240,
       engine+' '+name+' existing companion must be readable but not dominate: '+JSON.stringify(after.actor));
     assert.ok(after.cake.top>=0&&after.cake.bottom<=after.viewport[1],
       engine+' '+name+' cake not visible in first screen: '+JSON.stringify(after));
     assert.ok(after.buttons.length>=4&&after.buttons.every(b=>b.width>=44&&b.height>=44),
       engine+' '+name+' lost 44px touch controls: '+JSON.stringify(after.buttons));
     assert.ok(after.scrollWidth<=after.viewport[0]+3,
       engine+' '+name+' horizontal overflow');
     assert.ok(after.nav&&after.nav.top>=0&&after.nav.bottom<=after.viewport[1]+2,
       engine+' '+name+' Brøklab bottom tabs cropped: '+JSON.stringify(after.nav));
     assert.ok(after.navTargets.length===3&&
       after.navTargets.every(b=>b.width>=44&&b.height>=44),
       engine+' '+name+' Brøklab navigation taps below 44px: '+JSON.stringify(after.navTargets));
     assert.deepEqual(errors,[],engine+' '+name+' JS errors');
     await context.close();
    }
   }finally{await browser.close()}
 }
 fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify({commit:process.env.GITHUB_SHA||null,
   source:'real app; old CSS injected only for before screenshot',status:'review',results:all},null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1});
