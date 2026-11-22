'use strict';
const { chromium, webkit } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const openHomeSubject=require('./helpers/laria-home-open-subject.cjs');

const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const out=process.env.LARIA_MATH_PREMIUM_QA||'/tmp/laria-math-premium-utility';
const devices=[
  ['portrait-820',{width:820,height:1180},'portrait'],
  ['portrait-1024',{width:1024,height:1366},'portrait'],
  ['landscape-1180',{width:1180,height:820},'wide'],
  ['landscape-1366',{width:1366,height:1024},'wide'],
  ['landscape-1024',{width:1024,height:768},'wide']
];
const seed={version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'QA',avatar:'girl',setupVersion:2,tallvikaTroll:'storesoster'},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},
 skillEvidence:{},preferences:{sound:false,autoRead:false},lastMilestone:null,
 recentCountryWin:null,lastActivity:null,journey:{nodes:{},gradeWins:{},viewGrades:{}},
 answerLog:[],sessionLog:[],activeSession:null};
fs.mkdirSync(out,{recursive:true});
async function capture(page){
 return page.evaluate(async()=>{
  const root=document.querySelector('#tallvika-world');
  const scene=root.querySelector('.tv-scene');
  const grade=root.querySelector('.tv-scene-grade');
  const choose=root.querySelector('.tv-scene-choose');
  const home=root.querySelector('.tv-scene-home');
  const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
  const bounds={grade:rect(grade),choose:rect(choose),home:rect(home)};
  const activeButtons=[...document.querySelectorAll('button')].filter(el=>{
    if(el===grade||!el.checkVisibility())return false;
    const s=getComputedStyle(el),r=el.getBoundingClientRect();
    return s.pointerEvents!=='none'&&s.visibility!=='hidden'&&parseFloat(s.opacity)>0.01&&r.width>0&&r.height>0&&r.top>=0&&r.top<88&&r.right>innerWidth*.48;
  }).map(el=>({label:el.textContent.trim().slice(0,55),cls:el.className,b:rect(el)}));
  const background=getComputedStyle(scene).backgroundImage;
  const match=background.match(/url\(["']?([^"')]+)["']?\)/);
  const image=match?await new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>resolve({width:img.naturalWidth,height:img.naturalHeight,src:img.src});
    img.onerror=()=>resolve({width:0,height:0,src:img.src});
    img.src=match[1];
  }):null;
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  return {url:location.href,screenWidth:innerWidth,screenHeight:innerHeight,
    label:grade.textContent.trim(),gradeVisible:grade.checkVisibility(),bounds,activeButtons,
    background,image,signCount:root.querySelectorAll('.tv-sign').length};
 });
}
function intersect(a,b){
 return Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*
   Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
}
(async()=>{
 const results=[];
 for(const [engine,type] of [['webkit',webkit],['chromium',chromium]]){
  const browser=await type.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
  try{
   for(const [label,viewport,orientation] of devices){
    const context=await browser.newContext({viewport,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
    await context.addInitScript(profile=>localStorage.setItem('laerlittmer-v2',JSON.stringify(profile)),seed);
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
    await openHomeSubject(page,'math');
    await page.locator('#subject-screen.active #tallvika-world .tv-scene-grade').waitFor({state:'visible',timeout:25000});
    const a=await capture(page);
    await page.screenshot({path:path.join(out,engine+'-'+label+'.png'),animations:'disabled',fullPage:false});
    const overlaps=a.activeButtons.filter(x=>intersect(a.bounds.grade,x.b)>0.5);
    assert.ok(a.gradeVisible&&/^2\. klasse$/.test(a.label),engine+' '+label+' wrong grade button '+JSON.stringify(a));
    assert.equal(a.signCount,3,engine+' '+label+' missing three Tallvika activities');
    assert.ok(a.bounds.grade.width>=88&&a.bounds.grade.height>=44,
      engine+' '+label+' grade touch target too small');
    assert.ok(a.bounds.grade.left>=0&&a.bounds.grade.right<=viewport.width,
      engine+' '+label+' grade offscreen');
    assert.equal(overlaps.length,0,engine+' '+label+' overlapping controls '+JSON.stringify(overlaps));
    assert.equal(intersect(a.bounds.grade,a.bounds.choose),0,engine+' '+label+' choose overlaps grade');
    assert.ok(a.image&&a.image.width>=700&&a.image.height>=700,
      engine+' '+label+' artwork failed to decode '+JSON.stringify(a.image));
    assert.ok(a.background.includes('tallvika-fjord-no-buildings-'+orientation+'-20261107.webp'),
      engine+' '+label+' wrong locked art: '+a.background);
    await page.locator('#tallvika-world .tv-scene-grade').click();
    await page.locator('#tallvika-world .tv-grade-dialog[open]').waitFor({state:'visible',timeout:9000});
    await page.locator('#tallvika-world .tv-dialog-close').last().click();
    assert.deepEqual(errors,[],engine+' '+label+' browser errors');
    results.push({engine,label,art:a.image,overlaps,grade:a.bounds.grade,choose:a.bounds.choose,activeButtons:a.activeButtons});
    await context.close();
   }
  }finally{await browser.close()}
 }
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({status:'review',results},null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1});
