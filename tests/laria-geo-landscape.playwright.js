'use strict';
/* Læria geography-first responsive contract.
 * Test the real loaded atlas and real globe in WebKit/Chromium, not a mock.
 * Phones in portrait are a compatibility guard, not a redesign target. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {webkit,chromium}=require('playwright');
const out=process.env.GEO_LANDSCAPE_QA||'/tmp/laria-geo-landscape';
fs.mkdirSync(out,{recursive:true});
const seed={
 version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'GeoResponsiveQA',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},
 preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null
};
const devices=[
 {label:'iphone-landscape',width:844,height:390,phone:true,compact:true},
 {label:'iphone-small-landscape',width:667,height:375,phone:true,compact:true},
 {label:'ipad-landscape',width:1024,height:768,tabletLandscape:true},
 {label:'ipad-large-landscape',width:1194,height:834,tabletLandscape:true},
 {label:'ipad-portrait',width:820,height:1180,tabletPortrait:true},
 {label:'iphone-portrait-guard',width:390,height:844,phone:true,portraitGuard:true}
];
const box=(page,selector)=>page.locator(selector).boundingBox();
function inside(rect,vw,vh,label){
 assert(rect&&rect.width>=1&&rect.height>=1,label+' missing '+JSON.stringify(rect));
 assert(rect.x>=-2&&rect.x+rect.width<=vw+2,label+' horizontal clipping '+JSON.stringify(rect));
 assert(rect.y>=-2&&rect.y+rect.height<=vh+2,label+' vertical clipping '+JSON.stringify(rect));
}
function noOverlap(a,b,label,margin=2){
 assert(a&&b,label+' missing box');
 const x=Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x);
 const y=Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y);
 assert(x<=margin||y<=margin,label+' overlap: '+JSON.stringify({a,b,x,y}));
}
async function run(engine,device){
 const label=(engine===webkit?'webkit':'chromium')+'-'+device.label;
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 try{
  const ctx=await browser.newContext({
   viewport:{width:device.width,height:device.height},
   hasTouch:true,isMobile:!!device.phone,deviceScaleFactor:1,serviceWorkers:'block',
   reducedMotion:'reduce'
  });
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(v=>localStorage.setItem('laerlittmer-v2',JSON.stringify(v)),seed);
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
  await page.goto(url+'&geo-landscape='+label,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof openGlobe==='function'&&!!window.LARIA_ATLAS_PERSPECTIVE,{timeout:20000});
  await page.evaluate(()=>openGlobe());
  await page.waitForFunction(()=>document.querySelector('#world-screen.active.atlas-perspective-on #atlas-canvas')?.dataset.mapReady==='true',{timeout:20000});
  await page.evaluate(()=>selectGlobeCountry('no'));
  await page.waitForTimeout(120);

  const atlas=await box(page,'#atlas-canvas');
  const tabs=await box(page,'#globe-mode');
  const card=await box(page,'#globe-status');
  const actions=await box(page,'.globe-actions');
  const back=await box(page,'#world-back');
  const learn=await box(page,'.premium-country-learn');
  const zin=await box(page,'#globe-zoom-in');
  const zout=await box(page,'#globe-zoom-out');
  for(const [name,rect] of Object.entries({atlas,tabs,card,actions,back,learn,zin,zout})){
   inside(rect,device.width,device.height,label+' '+name);
  }
  assert(tabs.height>=44&&back.height>=44&&zin.height>=44&&zout.height>=44&&learn.height>=44,
    label+' reduced essential tap target below 44px');
  assert(atlas.y>=tabs.y+tabs.height+2,label+' atlas touches tabs');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert(overflow<=2,label+' horizontal document overflow '+overflow);

  if(device.tabletLandscape){
   assert(atlas.width>=device.width*.92,label+' atlas still capped at 850px: '+atlas.width);
   assert(atlas.height>=device.height*.54,label+' atlas too short: '+atlas.height);
   assert(atlas.y+atlas.height<=card.y-2,label+' tablet atlas overlaps country info');
   assert(card.y+card.height+6<=actions.y,label+' country card covers actions');
  }else if(device.compact){
   assert(atlas.width>=device.width*.51,label+' landscape phone atlas too narrow');
   assert(atlas.height>=device.height*.54,label+' landscape phone atlas too short');
   assert(atlas.x+atlas.width+4<=card.x,label+' land card blocks map horizontally');
   assert(card.y+card.height+4<=actions.y,label+' land card blocks actions');
   assert(actions.x>=card.x-2,label+' actions are not in right-side column');
  }else{
   assert(atlas.width>=device.width*.76,label+' portrait atlas regressed');
   assert(atlas.y+atlas.height<=card.y-2,label+' portrait atlas overlaps country info');
  }

  const before=await page.evaluate(()=>window.LARIA_ATLAS_PERSPECTIVE.snapshot().zoom);
  await page.locator('#globe-zoom-in').click();
  const after=await page.evaluate(()=>window.LARIA_ATLAS_PERSPECTIVE.snapshot().zoom);
  assert(after>before,label+' atlas zoom tap blocked');
  assert.equal(await page.locator('#atlas-canvas').getAttribute('data-render-source'),'country-geometry',
    label+' atlas country geometry disappeared');
  await page.screenshot({path:path.join(out,label+'-atlas.png'),animations:'disabled'});

  // Switch to the live 3D-like sphere. WebKit must reallocate the square canvas
  // backing bitmap rather than stretching a landscape atlas's old dimensions.
  await page.locator('#globe-mode [data-globe-mode="classic"]').click();
  await page.waitForFunction(()=>{
   const root=document.querySelector('#world-screen.active:not(.atlas-perspective-on)');
   const c=root?.querySelector('#globe-canvas'),r=c?.getBoundingClientRect();
   const ratio=window.devicePixelRatio||1;
   return r&&r.width>150&&Math.abs(r.width-r.height)<2&&
    Math.abs(c.width-Math.round(r.width*Math.min(2,ratio)))<=4&&
    Math.abs(c.height-Math.round(r.height*Math.min(2,ratio)))<=4;
  },{},{timeout:16000});
  const sphere=await box(page,'#globe-canvas');
  const sphereTabs=await box(page,'#globe-mode');
  const sphereCard=await box(page,'#globe-status');
  const sphereActions=await box(page,'.globe-actions');
  inside(sphere,device.width,device.height,label+' sphere');
  assert(Math.abs(sphere.width-sphere.height)<2,label+' sphere distorted');
  assert(sphere.y>=sphereTabs.y+sphereTabs.height+2,label+' sphere and tabs overlap');
  const globeRect=await box(page,'.globe-wrap');
  if(device.tabletLandscape){
   assert(sphere.width>=device.height*.57,label+' iPad landscape globe still too small '+sphere.width);
   assert(globeRect.y+globeRect.height+3<=sphereCard.y,label+' iPad globe covers country panel');
  }else if(device.compact){
   assert(sphere.width>=device.height*.60,label+' landscape phone globe still too small');
   assert(globeRect.x+globeRect.width+4<=sphereCard.x,label+' phone globe overlaps right-side country card');
   assert(sphereCard.y+sphereCard.height+4<=sphereActions.y,label+' phone globe country card covers action buttons');
  }else if(device.tabletPortrait){
   assert(sphere.width>=device.width*.78,label+' iPad portrait globe did not use available space');
   assert(globeRect.y+globeRect.height<=sphereCard.y-2,label+' iPad portrait globe overlaps country card');
  }else{
   assert(sphere.width>=device.width*.80,label+' iPhone portrait globe regressed');
  }
  for(const selector of ['#globe-zoom-in','#globe-zoom-out','#random-country','#reset-globe','.premium-country-learn']){
   const btn=await box(page,selector);
   inside(btn,device.width,device.height,label+' '+selector);
   assert(btn.width>=44&&btn.height>=44,label+' '+selector+' small button '+JSON.stringify(btn));
  }
  assert.equal(await page.locator('#globe-canvas').isVisible(),true,label+' cannot see live globe');
  await page.screenshot({path:path.join(out,label+'-sphere.png'),animations:'disabled'});
  assert.deepEqual(errors,[],label+' JavaScript errors');
  fs.writeFileSync(path.join(out,label+'.json'),JSON.stringify({device,atlas,sphere,tabs,card,actions,globeRect},null,2));
  console.log('PASS',label,'atlas',Math.round(atlas.width)+'x'+Math.round(atlas.height),
   'sphere',Math.round(sphere.width)+'px');
  await ctx.close();
 }finally{await browser.close()}
}
(async()=>{
 for(const device of devices)await run(webkit,device);
 // Cross-engine verification on the two high-impact landscape configurations.
 for(const device of [devices[0],devices[2]])await run(chromium,device);
 console.log('PASS Læria globe/atlas landscape: exact render size, touch and preservation');
})().catch(e=>{console.error(e);process.exitCode=1});
