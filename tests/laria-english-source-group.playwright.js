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
const BASE=(process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria')+
 '&lariaEnglishSignGroupCandidate=2';
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
   return {action:button.dataset.ki,label:name?.textContent?.trim(),
    bg:getComputedStyle(button).backgroundImage,
    medalDisplay:medal?getComputedStyle(medal).display:null,
    iconDisplay:ic?getComputedStyle(ic).display:null,
    medalBg:medal?getComputedStyle(medal).backgroundImage:null,
    rect:[r.left,r.top,r.right,r.bottom],height:r.height,width:r.width,
    fontSize:parseFloat(getComputedStyle(name).fontSize),
    glyph:glyph?[glyph.left,glyph.top,glyph.right,glyph.bottom]:null,
    canTap:hit===button||button.contains(hit),aria:button.getAttribute('aria-label')};
  });
  const load=async css=>{
   const image=new Image();image.src=cssURL(css);await image.decode();
   return {width:image.naturalWidth,height:image.naturalHeight};
  };
  const plank=await load(items[0].bg);
  const supports=await load(posts?getComputedStyle(posts).backgroundImage:'');
  return {sha:el.dataset.lariaEnglishSourceSha,source:el.dataset.lariaEnglishSourceGroup,
   rail:[rail.left,rail.top,rail.right,rail.bottom],
   posts:p?[p.left,p.top,p.right,p.bottom]:null,
   sourcePostsCount:el.querySelectorAll(':scope > .laria-english-source-posts').length,
   legacyPosts:getComputedStyle(el,'::before').display,
   plank,supports,items};
 });
 assert.equal(data.source,'ready');
 assert.equal(data.sha,SHA,'Original Grovanova source SHA mismatch');
 assert.deepEqual(data.plank,{width:307,height:82});
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
  assert.ok(b.bg===firstBg&&firstBg.includes('data:image/png;base64'),
   'A board is not using the same authentic pixel source: '+b.action);
  assert.ok(b.canTap&&b.width>=265&&b.height>=75&&
   left>=-1&&right<=viewport.width+1&&top>=0&&bottom<=viewport.height+1,
   'Source group board is clipped or not clickable: '+JSON.stringify(b));
  assert.ok(b.aria?.includes(LABELS[i]),'Accessible label missing: '+b.action);
  assert.ok(b.glyph&&b.glyph[0]>=left+b.width*.35&&b.glyph[2]<=right-5,
   'Board lettering is clipped or collides with original round medallion: '+b.action);
  assert.ok(b.fontSize>=23,'Source label is too small');
  if(i)assert.ok(top>=data.items[i-1].rect[3]+2,'Planks overlap');
  if(i===0)assert.equal(b.medalDisplay,'none','Words must retain the original British flag');
  else{
   assert.notEqual(b.medalDisplay,'none','Task icon is missing');
   assert.notEqual(b.iconDisplay,'none','Task icon SVG is not visible');
   assert.match(b.medalBg,/gradient/,'Task icon must remain inside original wooden frame');
  }
 }
 assert.ok(data.posts&&data.posts[1]<data.items[0].rect[1]&&
  data.posts[3]>data.items[2].rect[3]+8,'Source posts fail to connect the three boards');
 const foot=data.posts[3];
 const roof={ '820x1180':575,'1024x1366':655,'1180x820':419,
  '1024x768':385,'1366x1024':506 }[viewport.width+'x'+viewport.height];
 assert.ok(Number.isFinite(roof)&&foot<=roof,
  'Source post art intrudes into church roof rather than the landscape: '+JSON.stringify({foot,roof}));
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
   await page.screenshot({path:path.join(OUT,engineName+'-'+device+'-original-source-group.png'),
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
 for(const [device,viewport] of DEVICES)
  for(const [name,engine] of [['chromium',chromium],['webkit',webkit]])
   report.push(await run(engine,name,device,viewport));
 fs.mkdirSync(OUT,{recursive:true});
 fs.writeFileSync(path.join(OUT,'source-group-qa.json'),JSON.stringify(report,null,2)+'\n');
 console.log('PASS: three real English routes; source plank and twin posts on five iPads x two engines');
})().catch(e=>{console.error(e);process.exitCode=1;});