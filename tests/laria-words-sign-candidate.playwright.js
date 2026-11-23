'use strict';
/* Owner-review evidence. This runs the actual English route and original
 * Words action; it does not fixture, mock or replace application handlers. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const openHomeSubject=require('./helpers/laria-home-open-subject.cjs');
const VARIANT=process.env.LARIA_WORDS_SIGN_VARIANT==='2'?'2':'1';
const BASE=(process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria')+'&lariaWordsSignCandidate='+VARIANT;
const BOARD=VARIANT==='2'?'words-plank-illustrated-v3-REVIEW.webp':'words-plank-source-derived-v2.png';
const MEDAL=VARIANT==='2'?'words-abc-medallion-v3-REVIEW.png':'words-medallion-v2.png';
const OUT=process.env.LARIA_WORDS_SIGN_SHOTS||'/tmp/laria-words-sign';
const SEED={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Words QA',avatar:'girl',setupVersion:2,tallvikaTroll:'storesoster'},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
const devices=[['ipad-portrait',{width:1024,height:1366}],['ipad-landscape',{width:1366,height:1024}]];
async function run(engine,name,device,viewport){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 let page;
 try{
  const context=await browser.newContext({viewport,hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
  await context.addInitScript(seed=>localStorage.setItem('laerlittmer-v2',JSON.stringify(seed)),SEED);
  page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:90000});
  await openHomeSubject(page,'english');
  const world=page.locator('#subject-screen.active #kinnaklova-world');await world.waitFor({state:'visible',timeout:30000});
  await page.waitForFunction(()=>document.querySelector('#kinnaklova-world')?.dataset.kiArt==='ready',null,{timeout:30000});
  const words=world.locator('button[data-ki="words"].laria-words-sign-source-candidate');
  await words.waitFor({state:'visible',timeout:20000});
  const facts=await words.evaluate(button=>{
   const r=button.getBoundingClientRect(),style=getComputedStyle(button),label=button.querySelector('.ki-plank-name');
   const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
   return {width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom,
    hit:hit===button||button.contains(hit),background:style.backgroundImage,label:label?.textContent,
    medal:!!button.querySelector('.laria-wooden-sign-medallion'),posts:!!button.querySelector('.laria-words-sign-posts'),version:button.dataset.lariaWordsArt};
  });
  assert.equal(facts.label,'Words');assert.ok(facts.medal&&facts.posts,'Words must retain separate medal and posts');
  assert.ok(facts.background.includes(BOARD),'Wrong plank asset or missing version: '+JSON.stringify(facts));
  assert.equal(facts.version,VARIANT==='2'?'v3':'v2','Wrong opt-in artwork version');
  assert.ok(facts.width>=310&&facts.height>=78&&facts.hit&&facts.left>=0&&facts.right<=viewport.width+1&&facts.top>=0&&facts.bottom<=viewport.height+1,
    'Words source plank must be a properly scaled, fully tappable board: '+JSON.stringify(facts));
  const appearance=await words.evaluate(button=>{
    const b=button.getBoundingClientRect();
    const medal=button.querySelector('.laria-wooden-sign-medallion');
    const text=button.querySelector('.ki-plank-name');
    const m=medal?.getBoundingClientRect();
    // Measure painted glyphs, not the old absolute label's full CSS box.
    const range=document.createRange();
    if(text)range.selectNodeContents(text);
    const glyph=text?range.getBoundingClientRect():null;
    const s=text&&getComputedStyle(text),svg=medal?.querySelector('svg');
    return {boardWidth:b.width,boardHeight:b.height,medalWidth:m?.width,medalHeight:m?.height,
      medalLeft:m?.left,medalRight:m?.right,letterLeft:glyph?.left,letterRight:glyph?.right,
      fontPx:s?parseFloat(s.fontSize):0,font:s?.fontFamily,
      textColor:s?.color,medalBackground:medal?getComputedStyle(medal).backgroundImage:'',
      oldSvgDisplay:svg?getComputedStyle(svg).display:'none'};
  });
  assert.ok(appearance.fontPx>=27 && /Georgia|Times New Roman/.test(appearance.font||''),
    'Locked serif text became too small or generic: '+JSON.stringify(appearance));
  assert.ok(appearance.medalWidth>=appearance.boardWidth*.19 &&
    appearance.medalWidth<=appearance.boardWidth*.24 &&
    Math.abs(appearance.medalWidth-appearance.medalHeight)<=2,
    'Illustrated medal has wrong proportion compared with carved plank: '+JSON.stringify(appearance));
  assert.ok(appearance.letterLeft>=appearance.medalRight+2 &&
    appearance.letterRight<=facts.right-6,
    'Words actual glyphs are covered by medal or clipped off the board: '+JSON.stringify(appearance));
  assert.ok(appearance.medalBackground.includes(MEDAL),
    'Candidate must display its actual illustrated ABC medal rather than a CSS circle');
  assert.equal(appearance.oldSvgDisplay,'none',
    'Old speech-bubble SVG must never cover the illustrated ABC medallion');
  // A CSS URL is not evidence that a binary image exists. Decode both
  // artwork resources before accepting this exact-HEAD iPad screenshot.
  const pixels=await words.evaluate(async button=>{
    const medal=button.querySelector('.laria-wooden-sign-medallion');
    const urls=[getComputedStyle(button).backgroundImage,getComputedStyle(medal).backgroundImage]
      .map(css=>css.startsWith('url("')?css.slice(5,-2):css.startsWith('url(')?css.slice(4,-1):'').filter(Boolean);
    const dimensions=[];
    for(const url of urls){
      const dimensionsOf=await new Promise((resolve,reject)=>{
        const art=new Image();
        art.onload=()=>resolve([art.naturalWidth,art.naturalHeight]);
        art.onerror=()=>reject(Error('Could not load Words artwork: '+url));
        art.src=url;
      });
      dimensions.push(dimensionsOf);
    }
    return dimensions;
  });
  assert.equal(pixels.length,2,'Both board and medal must be real loaded images');
  assert.deepEqual(pixels[0],VARIANT==='2'?[1100,292]:[1395,366],
    'Words plank has wrong native pixel dimensions or is corrupted');
  assert.deepEqual(pixels[1],VARIANT==='2'?[392,392]:[224,224],
    'Words medal has wrong native pixel dimensions or is corrupted');
  fs.mkdirSync(OUT,{recursive:true});
  await page.screenshot({path:path.join(OUT,`${name}-${device}-kinnaklova-words.png`),animations:'disabled'});
  await words.click();
  await page.locator('#session-screen.active').waitFor({state:'visible',timeout:30000});
  // This is deliberately a visible-app assertion rather than a read of the
  // host page's lexical `sessionScope`.  The latter is not part of the app
  // contract and is unavailable in some WebKit execution worlds.
  await page.locator('#session-screen.task-scene[data-task-subject="english"]').waitFor({state:'visible',timeout:10000});
  assert.equal((await page.locator('#session-screen.active .task-world-chip').textContent())?.trim(),'Kinnaklova',
    'Words did not open the original Kinnaklova learning scene');
  await page.screenshot({path:path.join(OUT,`${name}-${device}-words-opened.png`),animations:'disabled'});
  assert.deepEqual(errors,[],name+' '+device+' runtime errors');
  await context.close();
  return facts;
 }catch(error){
  // A failed visual run must still leave a real diagnostic behind; it is never
  // silently converted into a passing result.
  fs.mkdirSync(OUT,{recursive:true});
  if(page){
   await page.screenshot({path:path.join(OUT,`${name}-${device}-failure.png`),fullPage:true}).catch(()=>{});
   fs.writeFileSync(path.join(OUT,`${name}-${device}-failure.html`),await page.content().catch(()=>''));
  }
  fs.writeFileSync(path.join(OUT,`${name}-${device}-failure.txt`),String(error?.stack||error)+'\n');
  throw error;
 }finally{await browser.close();}
}
(async()=>{const output=[];for(const [device,viewport] of devices)for(const [name,engine] of [['webkit',webkit],['chromium',chromium]])output.push({name,device,facts:await run(engine,name,device,viewport)});fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,'words-sign-report.json'),JSON.stringify(output,null,2)+'\n');})().catch(error=>{console.error(error);process.exitCode=1;});
