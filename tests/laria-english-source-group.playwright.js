'use strict';
/* Real Kinnaklova visual QA for the opt-in authentic Grovanova source rail.
 * Never approves artwork: only checks image provenance, geometry, original
 * buttons, one shared pair of supports and their actual learning routes. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const openHomeSubject=require('./helpers/laria-home-open-subject.cjs');
const SHA='9019d2d7be86d0f96d59770c0d141b935b1c4195fecc4e1dcfbf531ce226e028';
const VEGETATION_REVIEW=process.env.LARIA_ENGLISH_VEGETATION_REVIEW==='1';
const BOTANICAL_REVIEW=process.env.LARIA_ENGLISH_BOTANICAL_REVIEW==='1';
const QUICK_SMOKE=process.env.LARIA_BOTANICAL_SMOKE==='1';
const POST_VARIANT=(VEGETATION_REVIEW||BOTANICAL_REVIEW)?'2':process.env.LARIA_ENGLISH_POST_VARIANT==='2'?'2':'1';
const BASE=(process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria')+
 '&lariaEnglishSignGroupCandidate='+(BOTANICAL_REVIEW?'5':VEGETATION_REVIEW?'4':POST_VARIANT==='2'?'3':'2');
const OUT=process.env.LARIA_ENGLISH_SOURCE_GROUP_SHOTS||'/tmp/laria-english-source-group';
const DEVICES=[
 ['820x1180',{width:820,height:1180}],
 ['1024x1366',{width:1024,height:1366}],
 ['1180x820',{width:1180,height:820}],
 ['1024x768',{width:1024,height:768}],
 ['1366x1024',{width:1366,height:1024}]
];
const ACTIONS=['words','sentences','reading'],LABELS=['Words','Sentences','Reading'];
const SEED={version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'Source Group QA',avatar:'girl',setupVersion:2,tallvikaTroll:'storesoster'},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
 masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
function cssURL(value){
 return value.startsWith('url("')?value.slice(5,-2):
  value.startsWith('url(')?value.slice(4,-1):'';
}
async function scene(page){
 await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:90000});
 await openHomeSubject(page,'english');
 await page.locator('#kinnaklova-world[data-ki-art="ready"] .ki-master:visible')
  .waitFor({state:'visible',timeout:45000});
 const nav=page.locator('#kinnaklova-world .ki-stage.laria-reference-layout-v1'+
  '[data-laria-reference-mode="activities"] > nav.laria-english-source-group'+
  '[data-laria-english-source-group="ready"]');
 await nav.waitFor({state:'visible',timeout:45000});
 if(VEGETATION_REVIEW)
  await page.waitForFunction(()=>document.querySelector('#kinnaklova-world nav.laria-english-source-group')
   ?.dataset.lariaVegetationOcclusion==='ready',null,{timeout:35000});
 if(BOTANICAL_REVIEW){
  await page.waitForFunction(()=>{
   const nav=document.querySelector('#kinnaklova-world nav.laria-english-source-group');
   return ['ready','blocked'].includes(nav?.dataset.lariaBotanicalForeground);
  },null,{timeout:14000});
  const status=await nav.evaluate(el=>({
   source:el.dataset.lariaEnglishSourceGroup,
   posts:el.dataset.lariaEnglishPostsVariant,
   botanical:el.dataset.lariaBotanicalForeground,
   reason:el.dataset.lariaBotanicalReason,
   vegetation:el.dataset.lariaVegetationOcclusion,
   vegetationReason:el.dataset.lariaVegetationReason,
   sourceModule:!!window.LariaEnglishBotanical,
   sourceArt:!!window.LariaSourceExactSignV3
  }));
  assert.equal(status.botanical,'ready',
   'Original-source flower preview cannot render: '+JSON.stringify(status));
 }
 return nav;
}
async function verify(page,nav,viewport){
 const data=await nav.evaluate(async el=>{
  const buttons=[...el.querySelectorAll(':scope > button.laria-english-group-board')];
  const posts=el.querySelector(':scope > .laria-english-source-posts');
  const rail=el.getBoundingClientRect(),p=posts?.getBoundingClientRect();
  const items=buttons.map(button=>{
   const r=button.getBoundingClientRect(),name=button.querySelector('.ki-plank-name');
   const medal=button.querySelector('.laria-wooden-sign-medallion'),ic=medal?.querySelector('svg');
   const range=document.createRange();if(name)range.selectNodeContents(name);
   const glyph=name?range.getBoundingClientRect():null;
   const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
   const badgeRect=medal?.getBoundingClientRect();
   return {action:button.dataset.ki,label:name?.textContent?.trim(),
    badgeWidth:badgeRect?.width,badgeLeft:badgeRect?.left,
    bg:getComputedStyle(button).backgroundImage,
    medalSource:button.dataset.lariaMedalSource,
    medalDisplay:medal?getComputedStyle(medal).display:null,
    iconDisplay:ic?getComputedStyle(ic).display:null,
    medalBg:medal?getComputedStyle(medal).backgroundImage:null,
    rect:[r.left,r.top,r.right,r.bottom],height:r.height,width:r.width,
    fontSize:parseFloat(getComputedStyle(name).fontSize),
    glyph:glyph?[glyph.left,glyph.top,glyph.right,glyph.bottom]:null,
    canTap:hit===button||button.contains(hit),aria:button.getAttribute('aria-label')};
  });
  const url=css=>css.startsWith('url("')?css.slice(5,-2):css.startsWith('url(')?css.slice(4,-1):'';
  const load=async css=>{
   const image=new Image();image.src=url(css);await image.decode();
   return {width:image.naturalWidth,height:image.naturalHeight};
  };
  const plank=await load(items[0].bg);
  const taskPlank=await load(items[1].bg);
  const renderImage=async css=>{
   const im=new Image();im.src=url(css);await im.decode();
   const canvas=document.createElement('canvas');canvas.width=307;canvas.height=82;
   const context=canvas.getContext('2d',{willReadFrequently:true});
   context.drawImage(im,0,0);
   return context.getImageData(0,0,307,82).data;
  };
  const original=await renderImage(items[0].bg);
  const engraved=await renderImage(items[1].bg);
  const sameAt=([x,y])=>{
   const k=(y*307+x)*4;
   return [0,1,2,3].every(j=>original[k+j]===engraved[k+j]);
  };
  const protectedFrame=[[120,47],[88,14],[45,65],[280,43]].map(sameAt);
  const centerIndex=(47*307+88)*4;
  const innerWood=[...engraved.slice(centerIndex,centerIndex+3)];
  const supports=await load(posts?getComputedStyle(posts).backgroundImage:'');
  const canvas=posts?.querySelector(':scope > canvas.laria-english-vegetation-occlusion');
  let vegetation=null;
  if(canvas){
   const image=canvas.getContext('2d',{willReadFrequently:true})
    .getImageData(0,0,canvas.width,canvas.height);
   const yStart=Number(canvas.dataset.rootY);
   let opaque=0,upper=0,root=0,positive=0;
   for(let y=0;y<canvas.height;y+=2)for(let x=0;x<canvas.width;x+=2){
    const alpha=image.data[(y*canvas.width+x)*4+3];
    if(alpha>20){opaque++;if(y<yStart-8)upper++;else root++;}
    if(alpha>0)positive++;
   }
   vegetation={source:canvas.dataset.source,
    rootY:yStart,covered:Number(canvas.dataset.occludedPixels),
    footPixels:Number(canvas.dataset.footPixels),
    nativeWidth:Number(canvas.dataset.masterWidth),
    nativeHeight:Number(canvas.dataset.masterHeight),
    canvas:[canvas.width,canvas.height],
    opaque,upper,root,positive,pointerEvents:getComputedStyle(canvas).pointerEvents};
  }
  const sourceArt=await window.LariaSourceExactSignV3.getArt();
  const sampleWood=async url=>{
   const img=new Image();img.src=url;await img.decode();
   const temp=document.createElement('canvas');temp.width=307;temp.height=390;
   const c=temp.getContext('2d',{willReadFrequently:true});
   c.drawImage(img,0,0);
   return c.getImageData(0,0,307,390).data;
  };
  const activePixels=await sampleWood(url(posts?getComputedStyle(posts).backgroundImage:''));
  const oldPixels=await sampleWood(sourceArt.postPng);
  let postDifference=0;
  for(let y=75;y<325;y+=3)for(const [start,end] of [[65,95],[219,248]])
   for(let x=start;x<end;x+=3){
    const at=(y*307+x)*4;
    const distance=Math.abs(activePixels[at]-oldPixels[at])+
     Math.abs(activePixels[at+1]-oldPixels[at+1])+
     Math.abs(activePixels[at+2]-oldPixels[at+2]);
    if(distance>15)postDifference++;
   }
  const footOpacity=[(385*307+82)*4+3,(385*307+235)*4+3]
   .map(index=>activePixels[index]);
  const postCapOpacity=[(22*307+84)*4+3,(35*307+236)*4+3]
   .map(index=>activePixels[index]);
  const floral=posts?.querySelector(':scope > canvas.laria-english-botanical-foreground');
  let botanical=null;
  if(floral){
   const img=floral.getContext('2d',{willReadFrequently:true})
    .getImageData(0,0,floral.width,floral.height);
   const start=Number(floral.dataset.rootStart);
   let covered=0,overBoard=0,lowerFoot=0,whiteOrPink=0;
   for(let y=0;y<floral.height;y+=2)for(let x=0;x<floral.width;x+=2){
    const off=(y*floral.width+x)*4;
    const alpha=img.data[off+3];
    if(alpha>28){
     covered++;if(y<start-4)overBoard++;else lowerFoot++;
     if(img.data[off]>145&&img.data[off+1]>115)whiteOrPink++;
    }
   }
   botanical={source:floral.dataset.source,
    sha:floral.dataset.originalSha,
    pixels:Number(floral.dataset.paintedPixels),
    rootStart:start,
    paintHeight:Number(floral.dataset.paintHeight),
    rectangles:floral.dataset.sourceRectangles,
    pointerEvents:getComputedStyle(floral).pointerEvents,
    covered,overBoard,lowerFoot,whiteOrPink,
    size:[floral.width,floral.height]};
  }
  return {postDifference,footOpacity,postCapOpacity,
   sha:el.dataset.lariaEnglishSourceSha,source:el.dataset.lariaEnglishSourceGroup,
   postVariant:el.dataset.lariaEnglishPostsVariant,
   rail:[rail.left,rail.top,rail.right,rail.bottom],
   posts:p?[p.left,p.top,p.right,p.bottom]:null,
   sourcePostsCount:el.querySelectorAll(':scope > .laria-english-source-posts').length,
   legacyPosts:getComputedStyle(el,'::before').display,
   plank,taskPlank,protectedFrame,innerWood,supports,vegetation,botanical,items};
 });
 assert.equal(data.source,'ready');
 if(BOTANICAL_REVIEW){
  assert.ok(data.botanical,'Original-source flower illustration failed to mount');
  assert.equal(data.botanical.source,'grovanova-v16-original-flowers');
  assert.equal(data.botanical.sha,SHA);
  assert.equal(data.botanical.pointerEvents,'none');
  assert.ok(data.botanical.pixels>=250&&data.botanical.covered>=50&&
   data.botanical.lowerFoot>=45&&data.botanical.whiteOrPink>=8&&
   data.botanical.overBoard===0,
   'Flowers are missing, artificial/blank, or cover the actual boards: '+
    JSON.stringify(data.botanical));
 }else assert.equal(data.botanical,null,
  'Older A/B/C reviews must not gain the unapproved floral illustration');
 if(VEGETATION_REVIEW||BOTANICAL_REVIEW){
  assert.ok(data.vegetation,'Vegetation review did not mount the source-pixel foreground');
  assert.equal(data.vegetation.source,'kinnaklova-approved-master-pixels');
  assert.deepEqual([data.vegetation.nativeWidth,data.vegetation.nativeHeight],[1672,941]);
  assert.equal(data.vegetation.pointerEvents,'none','Foreground must not intercept child taps');
  assert.ok(data.vegetation.covered>35&&data.vegetation.footPixels>180&&
   data.vegetation.root>15&&data.vegetation.upper===0,
   'Approved scene foreground did not selectively mask ONLY the post roots: '+
   JSON.stringify(data.vegetation));
 }else{
  assert.equal(data.vegetation,null,'Existing A/B controls must remain visually unchanged');
 }
 assert.equal(data.postVariant,POST_VARIANT,'A/B source post variant was not selected correctly');
 if(POST_VARIANT==='2'){
  assert.ok(data.postDifference>300,'The source-wood V2 supports did not materially replace the blurred V1 sample');
  assert.ok(data.postCapOpacity.every(a=>a>100),'Original wooden caps are missing');
  assert.ok(data.footOpacity.every(a=>a<150),'Wooden feet terminate abruptly rather than in vegetation');
 }else{
  assert.equal(data.postDifference,0,'Legacy source V1 sprite changed when only V2 is under review');
 }
 assert.equal(data.sha,SHA,'Original Grovanova source SHA mismatch');
 assert.deepEqual(data.plank,{width:307,height:82});
 assert.deepEqual(data.taskPlank,{width:307,height:82});
 assert.deepEqual(data.protectedFrame,[true,true,true,true],
  'Carved medal rim, nails or original oak pixels changed outside the icon centre');
 const [red,green,blue]=data.innerWood;
 assert.ok(red>=42&&red<=115&&green>=20&&green<=70&&blue<50&&red>green*1.35,
  'Task medal has not replaced the original British flag with dark wooden relief: '+
  JSON.stringify(data.innerWood));
 assert.deepEqual(data.supports,{width:307,height:390});
 assert.equal(data.sourcePostsCount,1,'Exactly one original-source two-post support required');
 assert.equal(data.legacyPosts,'none','Old vector supports still render under authentic posts');
 assert.equal(data.items.length,3);
 assert.deepEqual(data.items.map(x=>x.action),ACTIONS);
 assert.deepEqual(data.items.map(x=>x.label),LABELS);
 const widths=data.items.map(x=>x.width);
 assert.ok(Math.max(...widths)-Math.min(...widths)<2,'Three boards are not equally wide');
 const firstBg=data.items[0].bg;
 for(const [i,b] of data.items.entries()){
  const [left,top,right,bottom]=b.rect;
  assert.ok(firstBg.includes('data:image/png;base64')&&
   b.bg.includes('data:image/png;base64'),
   'Missing real original-source painted plank: '+b.action);
  assert.equal(b.medalSource,i===0?'original-flag':'source-reconstructed-engraving',
   'Source-labelled medal variant does not match intended activity');
  assert.equal(b.bg===firstBg,i===0,
   'Words should retain untouched UK flag; the other two share only the textured task variant');
  if(i===2)assert.equal(b.bg,data.items[1].bg,
   'Sentences and Reading must use identical engraved original-source relief artwork');
  assert.ok(b.canTap&&b.width>=265&&b.height>=75&&
   left>=-1&&right<=viewport.width+1&&top>=0&&bottom<=viewport.height+1,
   'Source group board is clipped or not clickable: '+JSON.stringify(b));
  assert.ok(b.aria?.includes(LABELS[i]),'Accessible label missing: '+b.action);
  assert.ok(b.glyph&&b.glyph[0]>=left+b.width*.35&&b.glyph[2]<=right-5,
   'Board lettering is clipped or collides with original round medallion: '+b.action);
  assert.ok(b.fontSize>=26,'Source label is too small compared with locked Grovanova serif');
  if(i)assert.ok(top>=data.items[i-1].rect[3]+2,'Planks overlap');
  if(i===0)assert.equal(b.medalDisplay,'none','Words must retain the original British flag');
  else{
   assert.notEqual(b.medalDisplay,'none','Task icon is missing');
   assert.notEqual(b.iconDisplay,'none','Task icon SVG is not visible');
   assert.equal(b.medalBg,'none',
    'Retired synthetic CSS medal obscures the actual source-relief rim');
   assert.ok(b.badgeWidth>=b.width*.18&&b.badgeWidth<=b.width*.20,
    'Task icon has wrong scale within the carved medal: '+JSON.stringify(b));
   assert.ok(b.badgeLeft>=left+b.width*.185&&
    b.badgeLeft<=left+b.width*.199,'Task icon is off-centre in the source relief');
  }
 }
 assert.ok(data.posts&&data.posts[1]<data.items[0].rect[1]&&
  data.posts[3]>data.items[2].rect[3]+8,'Source posts fail to connect the three boards');
 const foot=data.posts[3];
 const roof={ '820x1180':575,'1024x1366':655,'1180x820':419,
  '1024x768':385,'1366x1024':506 }[viewport.width+'x'+viewport.height];
 assert.ok(Number.isFinite(roof)&&foot<=roof,
  'Source post art intrudes into church roof rather than the landscape: '+JSON.stringify({foot,roof}));
 if(viewport.width>viewport.height&&viewport.height<=850){
  const bottomBoard=data.items[2].rect[3];
  assert.ok(data.items[0].width<=320&&foot-bottomBoard>=32,
   'Compact iPad has oversized planks or floating post feet: '+
   JSON.stringify({viewport,boardWidth:data.items[0].width,foot,bottomBoard}));
 }
 return data;
}
async function run(engine,engineName,device,viewport){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport,deviceScaleFactor:1,hasTouch:true,
   reducedMotion:'reduce',serviceWorkers:'block'});
  await context.addInitScript(v=>localStorage.setItem('laerlittmer-v2',JSON.stringify(v)),SEED);
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  fs.mkdirSync(OUT,{recursive:true});
  try{
   let nav=await scene(page);
   const facts=await verify(page,nav,viewport);
   await page.screenshot({path:path.join(OUT,engineName+'-'+device+
    (BOTANICAL_REVIEW?'-botanical-flowers':VEGETATION_REVIEW?'-source-vegetation':'-original-source-group')+'.png'),
    animations:'disabled'});
   const deep=device==='1024x1366'||device==='1366x1024';
   for(const action of (deep?ACTIONS:['words'])){
    if(action!=='words')nav=await scene(page);
    await nav.locator('button[data-ki="'+action+'"]').click({timeout:25000});
    await page.locator('#session-screen.active.task-scene[data-task-subject="english"]')
     .waitFor({state:'visible',timeout:30000});
    assert.equal((await page.locator('#session-screen.active .task-world-chip').textContent())?.trim(),
     'Kinnaklova','Original route failed for '+action);
   }
   assert.deepEqual(errors,[],engineName+' '+device+' emitted runtime errors');
   await context.close();
   return {engine:engineName,device,
    posts:facts.posts,signs:facts.items.map(x=>({name:x.label,rect:x.rect}))};
  }catch(error){
   await page.screenshot({path:path.join(OUT,engineName+'-'+device+'-FAIL.png'),fullPage:true}).catch(()=>{});
   fs.writeFileSync(path.join(OUT,engineName+'-'+device+'-FAIL.txt'),String(error?.stack||error));
   throw error;
  }
 }finally{await browser.close();}
}
(async()=>{
 const report=[];
 for(const [device,viewport] of (QUICK_SMOKE?DEVICES.slice(0,1):DEVICES))
  for(const [name,engine] of (QUICK_SMOKE?[['chromium',chromium]]:[['chromium',chromium],['webkit',webkit]]))
   report.push(await run(engine,name,device,viewport));
 fs.mkdirSync(OUT,{recursive:true});
 fs.writeFileSync(path.join(OUT,'source-group-qa.json'),JSON.stringify(report,null,2)+'\n');
 console.log('PASS: three real English routes; source plank and twin posts on five iPads x two engines');
})().catch(e=>{console.error(e);process.exitCode=1;});