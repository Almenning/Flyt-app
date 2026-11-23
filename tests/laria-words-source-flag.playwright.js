'use strict';
/* One English flag-preserved source-pixel Words candidate, never part of production URL.
 * Chromium/WebKit capture the actual Kinnaklova scene and click the original
 * Words handler. Test pixel identity outside the original ink/icon only. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const openHomeSubject=require('./helpers/laria-home-open-subject.cjs');
const SHA='9019d2d7be86d0f96d59770c0d141b935b1c4195fecc4e1dcfbf531ce226e028';
const BASE=(process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria')+'&lariaWordsSignCandidate=5';
const OUT=process.env.LARIA_WORDS_FLAG_SHOTS||'/tmp/laria-words-sign/flag-preserved';
const SEED={version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'Words Source QA',avatar:'girl',setupVersion:2,tallvikaTroll:'storesoster'},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},
 preferences:{sound:false,autoRead:false},journey:{nodes:{},gradeWins:{},viewGrades:{}},
 answerLog:[],sessionLog:[],activeSession:null};
const DEVICES=[['ipad-1024x1366',{width:1024,height:1366}],
 ['ipad-1366x1024',{width:1366,height:1024}]];
function backgroundURL(style){
 if(style.startsWith('url("'))return style.slice(5,-2);
 if(style.startsWith('url('))return style.slice(4,-1);
 return '';
}
async function run(engine,engineName,device,viewport){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 let page;
 try{
  const context=await browser.newContext({viewport,hasTouch:true,deviceScaleFactor:1,
   reducedMotion:'reduce',serviceWorkers:'block'});
  await context.addInitScript(data=>localStorage.setItem('laerlittmer-v2',JSON.stringify(data)),SEED);
  page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:90000});
  await openHomeSubject(page,'english');
  const world=page.locator('#subject-screen.active #kinnaklova-world[data-ki-premium-art="approved"]');
  await world.waitFor({state:'visible',timeout:30000});
  await page.waitForFunction(()=>document.querySelector('#kinnaklova-world')?.dataset.kiArt==='ready',
   null,{timeout:45000});
  const words=world.locator('button[data-ki="words"].laria-words-sign-original-flag');
  await words.waitFor({state:'visible',timeout:20000});
  await page.waitForFunction(()=>document.querySelector('#kinnaklova-world button[data-ki="words"]')
   ?.dataset.lariaSourceArt==='ready',null,{timeout:45000});
  const facts=await words.evaluate(async button=>{
   const css=getComputedStyle(button),bg=css.backgroundImage;
   const imageURL=bg.startsWith('url("')?bg.slice(5,-2):bg.startsWith('url(')?bg.slice(4,-1):'';
   const board=new Image();board.src=imageURL;await board.decode();
   const source=new Image();
   source.src='./assets/home-v16/laria-grovanova-v16-landscape-original.png';
   await source.decode();
   const crop=document.createElement('canvas');crop.width=307;crop.height=82;
   const cc=crop.getContext('2d',{willReadFrequently:true});
   cc.drawImage(source,43,531,307,82,0,0,307,82);
   const original=cc.getImageData(0,0,307,82).data;
   const canvas=document.createElement('canvas');canvas.width=307;canvas.height=82;
   const c=canvas.getContext('2d',{willReadFrequently:true});
   c.drawImage(board,0,0);
   const generated=c.getImageData(0,0,307,82).data;
   const unchanged=[[18,47],[46,67],[291,47],[88,47],[75,45],[71,33]].map(([x,y])=>{
    const i=(y*307+x)*4;
    return generated[i+3]>100&&[0,1,2].every(j=>generated[i+j]===original[i+j]);
   });
   const r=button.getBoundingClientRect(),label=button.querySelector('.ki-plank-name'),
    medal=button.querySelector('.laria-wooden-sign-medallion'),range=document.createRange();
   range.selectNodeContents(label);
   const glyph=range.getBoundingClientRect(),mr=medal.getBoundingClientRect();
   const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
   return {sourceSha:button.dataset.lariaSourceOriginalSha,sourceState:button.dataset.lariaSourceArt,
    sourceCopied:Number(button.dataset.lariaSourceCopied),sourceVisible:Number(button.dataset.lariaSourceVisible),
    paintedURL:imageURL.startsWith('data:image/png;base64'),image:[board.naturalWidth,board.naturalHeight],
    original:[source.naturalWidth,source.naturalHeight],unchanged,action:button.dataset.ki,
    label:label?.textContent?.trim(),medal:medal?.textContent?.trim(),
    medalBackground:getComputedStyle(medal).backgroundImage,
    medalDisplay:getComputedStyle(medal).display,
    pressable:hit===button||button.contains(hit),rect:[r.left,r.top,r.right,r.bottom],
    glyph:[glyph.left,glyph.right],medalRight:mr.right,
    height:r.height,width:r.width, font:parseFloat(getComputedStyle(label).fontSize),
    posts:!!button.querySelector('.laria-words-sign-posts')};
  });
  assert.equal(facts.sourceState,'ready','SHA-verified original art never became ready');
  assert.equal(facts.sourceSha,SHA,'A different mountain/sign source was used');
  assert.ok(facts.paintedURL,'Original-source graphic is not a real pixel PNG');
  assert.deepEqual(facts.image,[307,82],'Sign artwork was resynthesized at a non-source resolution');
  assert.deepEqual(facts.original,[1448,1086],'Locked Home landscape artwork dimensions changed');
  assert.deepEqual(facts.unchanged,[true,true,true,true,true,true],
   'Nails/wood must be pixel identical outside the removed Norwegian text/icon');
  assert.ok(facts.sourceVisible>17500&&facts.sourceCopied>13000&&
   facts.sourceCopied<=facts.sourceVisible,
   'Too much of the original picture was replaced: '+JSON.stringify(facts));
  assert.equal(facts.action,'words');assert.equal(facts.label,'Words');
  assert.equal(facts.medal,'','No synthetic ABC badge may obscure the original Union Jack');
  assert.equal(facts.medalDisplay,'none','The decorative DOM badge must be hidden');
  assert.equal(facts.medalBackground,'none','Old floating raster medal still obscures original');
  assert.ok(facts.pressable&&facts.posts&&facts.width>=310&&facts.height>=84&&facts.font>=35,
   'Live original Words button is too small or lost its posts: '+JSON.stringify(facts));
  assert.ok(facts.glyph[0]>=facts.rect[0]+facts.width*.37&&facts.glyph[1]<=facts.rect[2]-5,
   'Words letters touch the original medal or extend past the original wooden plank');
  assert.ok(facts.rect[0]>=0&&facts.rect[2]<=viewport.width&&
   facts.rect[1]>=0&&facts.rect[3]<=viewport.height,
   'Words source board is clipped on real iPad');
  fs.mkdirSync(OUT,{recursive:true});
  await page.screenshot({path:path.join(OUT,engineName+'-'+device+'-words-original-review.png'),
   animations:'disabled'});
  await words.click();
  await page.locator('#session-screen.active.task-scene[data-task-subject="english"]')
   .waitFor({state:'visible',timeout:30000});
  assert.equal((await page.locator('#session-screen.active .task-world-chip').textContent())?.trim(),
   'Kinnaklova','Original Words route was altered');
  assert.deepEqual(errors,[],engineName+' '+device+' browser runtime exceptions');
  await context.close();
  return {engine:engineName,device,...facts};
 }catch(error){
  fs.mkdirSync(OUT,{recursive:true});
  await page?.screenshot({path:path.join(OUT,engineName+'-'+device+'-failure.png'),
   fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(OUT,engineName+'-'+device+'-failure.txt'),String(error.stack||error));
  throw error;
 }finally{await browser.close();}
}
(async()=>{
 const report=[];
 for(const [device,viewport] of DEVICES)
  for(const [name,engine] of [['chromium',chromium],['webkit',webkit]])
   report.push(await run(engine,name,device,viewport));
 fs.mkdirSync(OUT,{recursive:true});
 fs.writeFileSync(path.join(OUT,'source-identity-report.json'),JSON.stringify(report,null,2)+'\n');
 console.log('PASS: source locked Words pixel review, both iPad orientations and engines');
})().catch(e=>{console.error(e);process.exitCode=1;});