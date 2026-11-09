'use strict';
/* Læria phone-portrait reference QA. Original paintings and saved progress
 * must remain untouched; the three clean scenes reuse the same live buttons. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const out=process.env.LARIA_REFERENCE_MOBILE_SHOTS||'/tmp/laria-reference-mobile';
const seed={
 version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'Mobiltest',avatar:'girl',setupVersion:2,tallvikaTroll:'lillesoster'},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
 masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null
};
const worlds=[
 {id:'norwegian',selector:'#eggenipa-world .eg-hero.laria-reference-layout-v1'},
 {id:'math',selector:'#tallvika-world .tv-scene.laria-reference-layout-v1'},
 {id:'geography',selector:'#laria-geography-world .gv-scene.laria-reference-layout-v1'}
];
const intersects=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*
 Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
async function run(engine,name,viewport){
 const browser=await engine.launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true,
   deviceScaleFactor:1,serviceWorkers:'block',reducedMotion:'reduce'});
  await context.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://raw.githubusercontent.com/**',route=>route.abort());
  await page.route('https://api.worldbank.org/**',route=>route.abort());
  const base=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
  await page.goto(base+(base.includes('?')?'&':'?')+'lariaReferenceLayout=1',
   {waitUntil:'domcontentloaded',timeout:60000});
  const home=page.locator('#home-screen.active .bc12.bc15-locked-home');
  await home.waitFor({state:'visible',timeout:25000});
  await fs.promises.mkdir(out,{recursive:true});
  await page.screenshot({path:path.join(out,name+'-'+viewport.width+'-home-locked.png'),animations:'disabled'});
  for(const world of worlds){
   await page.locator('#home-screen .bc14-subject[data-camp="subject-'+world.id+'"]').click();
   const scene=page.locator(world.selector);
   await scene.waitFor({state:'visible',timeout:25000});
   const nav=scene.locator('nav.laria-reference-subject-nav');
   const actions=scene.locator('nav.laria-scene-navigation');
   const plaque=scene.locator('button.laria-reference-place');
   const chooser=scene.locator('.laria-scene-chooser:visible');
   const settings=scene.locator('button.laria-reference-settings:visible');
   assert.equal(await nav.locator('button').count(),5,world.id+' lost the five global signs');
   assert.equal(await scene.getAttribute('data-laria-reference-mode'),'subjects');
   assert.ok(await nav.isVisible(),world.id+' primary rail invisible');
   assert.equal(await actions.isVisible(),false,world.id+' second rail visible');
   assert.equal(await plaque.count(),1);
   assert.equal(await chooser.count(),1);
   assert.equal(await settings.count(),1);
   const rect=await scene.evaluate(el=>{
    const box=e=>{const x=e.getBoundingClientRect();
     return {left:x.left,right:x.right,top:x.top,bottom:x.bottom,
      width:x.width,height:x.height};};
    const nav=el.querySelector('nav.laria-reference-subject-nav'),
      actor=el.querySelector('[data-laria-component="troll"]'),
      title=el.querySelector('.laria-reference-place'),
      logo=el.querySelector('.laria-scene-brand'),
      gear=el.querySelector('.laria-reference-settings');
    const signs=[...nav.querySelectorAll('button')].map(box);
    return {nav:box(nav),actor:box(actor),title:box(title),logo:box(logo),
      settings:box(gear),signs,scroll:document.documentElement.scrollWidth};
   });
   assert.ok(rect.scroll<=viewport.width+1,world.id+' horizontal page overflow');
   for(const sign of rect.signs){
    assert.ok(sign.width>=44&&sign.height>=44&&sign.left>=0&&sign.right<=viewport.width+1,
      world.id+' sign clipped or too small: '+JSON.stringify(sign));
   }
   assert.ok(rect.nav.right+8<=rect.title.left,
    world.id+' left menu overlaps title: '+JSON.stringify(rect));
   assert.ok(rect.nav.right+3<=rect.actor.left,
    world.id+' selected troll covers sign rail: '+JSON.stringify(rect));
   assert.ok(rect.actor.height>=260&&rect.actor.width>=120&&
    rect.actor.bottom<=viewport.height+2&&rect.actor.top>=0,
    world.id+' original selected troll clipped or tiny: '+JSON.stringify(rect));
   assert.equal(intersects(rect.title,rect.actor),0,
    world.id+' companion covers right title');
   assert.equal(intersects(rect.logo,rect.title),0,
    world.id+' logo covers right title');
   assert.ok(rect.settings.width>=44&&rect.settings.height>=44,
    world.id+' adult settings below minimum touch size');
   await page.screenshot({path:path.join(out,name+'-'+viewport.width+'-'+world.id+'-subjects.png'),animations:'disabled'});
   await plaque.click();
   assert.equal(await scene.getAttribute('data-laria-reference-mode'),'activities');
   assert.equal(await nav.isVisible(),false,'subject signs remain visible with activities');
   assert.equal(await actions.isVisible(),true,'activities not visible in single rail');
   assert.equal(await actions.locator('.laria-wayfinder:visible').count(),3);
   const actionBoxes=await actions.locator('.laria-wayfinder').evaluateAll(nodes=>
    nodes.map(n=>{const r=n.getBoundingClientRect();
      return {left:r.left,right:r.right,width:r.width,height:r.height};}));
   assert.ok(actionBoxes.every(b=>b.left>=0&&b.right<=rect.nav.right+3&&b.width>=44&&b.height>=44),
     world.id+' activity escaped left rail: '+JSON.stringify(actionBoxes));
   if(world.id==='math'){
    const next=actions.locator('.tv-next-sign.laria-reference-next');
    assert.equal(await next.count(),1,'Matte Next eventyr duplicated');
    assert.ok(await next.isVisible(),'Matte Next eventyr missing');
   }
   await page.screenshot({path:path.join(out,name+'-'+viewport.width+'-'+world.id+'-activities.png'),animations:'disabled'});
   await actions.locator('.laria-reference-activities-back').click();
   assert.equal(await scene.getAttribute('data-laria-reference-mode'),'subjects');
   await nav.locator('[data-laria-ref-subject="home"]').click();
   await home.waitFor({state:'visible',timeout:18000});
  }
  // A real phone rotates. With a short landscape viewport the reference
  // adapter must cleanly restore the original DOM, not leave two menus or
  // naked reference buttons. Returning to portrait reuses the same live
  // subject actions without touching localStorage.
  await page.locator('#home-screen .bc14-subject[data-camp="subject-norwegian"]').click();
  const rotated=page.locator('#eggenipa-world .eg-hero');
  await rotated.locator('.laria-reference-subject-nav').waitFor({state:'visible',timeout:15000});
  const beforeState=await page.evaluate(()=>localStorage.getItem('laerlittmer-v2'));
  await page.setViewportSize({width:viewport.height,height:viewport.width});
  await page.waitForFunction(()=>{
    const scene=document.querySelector('#eggenipa-world .eg-hero');
    return !!scene&&!scene.classList.contains('laria-reference-layout-v1')&&
     !scene.querySelector(':scope > nav.laria-reference-subject-nav')&&
     !scene.querySelector(':scope > button.laria-reference-place');
  },null,{timeout:12000});
  assert.equal(await rotated.locator('[data-laria-component="home"]').getAttribute('aria-hidden'),null,
   'rotation did not restore original Home control');
  assert.equal(await rotated.locator('nav.laria-scene-navigation').getAttribute('aria-hidden'),null,
   'rotation left original learning buttons inaccessible');
  await page.screenshot({path:path.join(out,name+'-'+viewport.width+'-landscape-fallback.png'),animations:'disabled'});
  await page.setViewportSize(viewport);
  await page.waitForFunction(()=>{
    const scene=document.querySelector('#eggenipa-world .eg-hero');
    return !!scene&&scene.classList.contains('laria-reference-layout-v1')&&
      scene.dataset.lariaReferenceMode==='subjects'&&
      scene.querySelectorAll(':scope > nav.laria-reference-subject-nav > button').length===5;
  },null,{timeout:12000});
  assert.equal(await rotated.locator('.laria-reference-subject-nav').count(),1,
   'portrait remount duplicated the five sign rail');
  assert.equal(await page.evaluate(()=>localStorage.getItem('laerlittmer-v2')),beforeState,
   'device rotation modified saved learning progress');
  await rotated.locator('.laria-reference-subject-nav [data-laria-ref-subject="home"]').click();
  await home.waitFor({state:'visible',timeout:16000});
  // The child must never enter parental settings with a short tap.
  // The same protected 1.5s hold gate is enforced on a real phone viewport.
  await page.locator('#home-screen .bc14-subject[data-camp="subject-norwegian"]').click();
  await rotated.locator('.laria-reference-subject-nav').waitFor({state:'visible',timeout:16000});
  const adultGate=rotated.locator('button.laria-reference-settings');
  await adultGate.click();
  assert.equal(await page.locator('#adult-screen.active').count(),0,
    'single tap bypassed the parental long-press gate on iPhone');
  await adultGate.dispatchEvent('pointerdown',{pointerType:'touch',button:0});
  await page.waitForTimeout(1650);
  await page.locator('#adult-screen.active').waitFor({state:'visible',timeout:7000});
  await page.locator('#adult-back').click();
  await home.waitFor({state:'visible',timeout:16000});
  const afterAdult=await page.evaluate(()=>localStorage.getItem('laerlittmer-v2'));
  const beforeLearning=JSON.parse(beforeState),afterLearning=JSON.parse(afterAdult);
  for(const key of ['mastery','skillMastery','journey','answerLog','sessionLog']){
    assert.deepEqual(afterLearning[key],beforeLearning[key],
      'opening parental settings mutated stored learning data: '+key);
  }
  assert.deepEqual(errors,[],name+'-'+viewport.width+' JavaScript errors '+JSON.stringify(errors));
  await context.close();
 }finally{await browser.close();}
}
(async()=>{
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]])
  for(const width of [390,430])
   await run(engine,name,{width,height:width===390?844:932});
})().catch(error=>{console.error(error);process.exitCode=1;});
