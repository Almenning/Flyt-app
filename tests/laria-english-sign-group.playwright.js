'use strict';
/* Actual Læria English scene: three original activity buttons,
 * illustrated boards and exactly one two-post rail. Owner review ONLY. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const openHomeSubject=require('./helpers/laria-home-open-subject.cjs');
const BASE=(process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria')+
 '&lariaEnglishSignGroupCandidate=1';
const OUT=process.env.LARIA_ENGLISH_GROUP_SHOTS||'/tmp/laria-english-group';
const SEED={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'English Group QA',
 avatar:'girl',setupVersion:2,tallvikaTroll:'storesoster'},mastery:{},mistakes:{},skillMastery:{},
 skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
const DEVICES=[
 ['820x1180',{width:820,height:1180}],
 ['1024x1366',{width:1024,height:1366}],
 ['1180x820',{width:1180,height:820}],
 ['1024x768',{width:1024,height:768}],
 ['1366x1024',{width:1366,height:1024}],
];
const LABELS=['Words','Sentences','Reading'];
const KEYS=['words','sentences','reading'];
const EXPECTED={
 words:'words-abc-medallion-v3-REVIEW.png',
 sentences:'sentences-medallion-english-group-v1-REVIEW.png',
 reading:'reading-medallion-english-group-v1-REVIEW.png'
};
const BOARD='words-plank-illustrated-v3-REVIEW.webp';
async function openScene(page){
 await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:90000});
 await openHomeSubject(page,'english');
 const world=page.locator('#subject-screen.active #kinnaklova-world[data-ki-premium-art="approved"]');
 await world.waitFor({state:'visible',timeout:30000});
 await page.waitForFunction(()=>document.querySelector('#kinnaklova-world')?.dataset.kiArt==='ready',null,{timeout:45000});
 await world.locator('.ki-master:visible').waitFor({state:'visible',timeout:20000});
 const nav=world.locator('.ki-stage.laria-reference-layout-v1[data-laria-reference-mode="activities"] > nav.laria-english-group-rail');
 await nav.waitFor({state:'visible',timeout:20000});
 return {world,nav};
}
async function inspect(nav,viewport){
 const data=await nav.evaluate(el=>{
  const buttons=[...el.querySelectorAll(':scope > button.laria-english-group-board')];
  const rail=el.getBoundingClientRect(),posts=getComputedStyle(el,'::before');
  const stage=el.closest('.ki-stage').getBoundingClientRect();
  const items=buttons.map(b=>{
   const r=b.getBoundingClientRect(),m=b.querySelector('.laria-wooden-sign-medallion');
   const name=b.querySelector('.ki-plank-name'),badge=m?.getBoundingClientRect(),label=name?.textContent?.trim();
   const range=document.createRange();if(name)range.selectNodeContents(name);
   const chars=name?range.getBoundingClientRect():null;
   const s=name&&getComputedStyle(name);
   const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
   return {action:b.dataset.ki,label,
     rect:[r.left,r.top,r.right,r.bottom],width:r.width,height:r.height,
     bg:getComputedStyle(b).backgroundImage,
     medal:m?getComputedStyle(m).backgroundImage:null,
     iconVisible:m?.querySelector('svg')?getComputedStyle(m.querySelector('svg')).display:null,
     badge:badge?[badge.left,badge.top,badge.right,badge.bottom]:null,
     glyph:chars?[chars.left,chars.top,chars.right,chars.bottom]:null,
     fontPx:s?parseFloat(s.fontSize):0,
     hit:hit===b||b.contains(hit),aria:b.getAttribute('aria-label'),
     perButtonPosts:b.querySelectorAll('.laria-words-sign-posts').length};
  });
  return {group:el.dataset.lariaEnglishGroup,stageHeight:stage.height,
   rail:[rail.left,rail.top,rail.right,rail.bottom],
   postBg:posts.backgroundImage,postHeight:parseFloat(posts.height),
   postTop:parseFloat(posts.top),items};
 });
 assert.equal(data.group,'review-v1','English group preview was not mounted');
 assert.equal(data.items.length,3,'Exactly three actual English boards are required');
 assert.deepEqual(data.items.map(x=>x.action),KEYS);
 assert.deepEqual(data.items.map(x=>x.label),LABELS);
 assert.match(data.postBg,/laria-grovanova-signposts\.svg/,
  'One continuous two-post image must belong to the rail');
 assert.ok(data.postHeight>data.rail[3]-data.rail[1]+18,
  'The two shared posts must extend beneath the third plank');
 // Guard against false-green CSS changes: the first terrain-tail patch had
 // lower specificity than the legacy rail and produced PIXEL-IDENTICAL images.
 // These are conservative roof-clearance thresholds measured from the locked
 // review scene at each of the five requested iPad viewports; not art approval.
 const tailPx=data.rail[1]+data.postTop+data.postHeight-data.rail[3];
 const footY=data.rail[3]+tailPx;
 const portrait=viewport.height>viewport.width;
 const compactLandscape=!portrait&&viewport.height<=850;
 const minTail=portrait?60:compactLandscape?8:38;
 const maxTail=portrait?90:compactLandscape?14:58;
 assert.ok(tailPx>=minTail&&tailPx<=maxTail,
  'The terrain-specific post tail was overridden by older CSS: '+
  JSON.stringify({viewport,tailPx,minTail,maxTail}));
 const roofTop={
  '820x1180':575,'1024x1366':655,'1180x820':419,
  '1024x768':385,'1366x1024':506
 }[viewport.width+'x'+viewport.height];
 assert.ok(Number.isFinite(roofTop)&&footY<=roofTop,
  'Shared post feet intersect the locked church roof: '+
  JSON.stringify({viewport,footY,roofTop}));
 data.tailPx=tailPx;data.postFootY=footY;
 assert.equal(data.items.reduce((n,x)=>n+x.perButtonPosts,0),0,
  'Do not attach duplicate posts to individual signs');
 const widths=data.items.map(x=>x.width);
 assert.ok(Math.max(...widths)-Math.min(...widths)<2,
  'Three planks must have the same illustrated width');
 for(const [i,a] of data.items.entries()){
  const [l,t,r,b]=a.rect;
  assert.ok(a.width>=265&&a.height>=75&&a.hit&&
   l>=-1&&r<=viewport.width+1&&t>=0&&b<=viewport.height+1,
   'English group board is clipped or not tappable: '+JSON.stringify(a));
  assert.ok(a.bg.includes(BOARD),'Wrong oak resource on '+a.action);
  assert.ok(a.medal?.includes(EXPECTED[a.action]),'Wrong illustrated medal on '+a.action);
  assert.equal(a.iconVisible,'none','Old CSS icon still obscures relief medallion');
  assert.ok(a.aria?.includes(LABELS[i]),'Original accessible activity name missing');
  assert.ok(a.badge&&a.glyph,'Real medal and DOM text required on '+a.action);
  const [ml,mt,mr,mb]=a.badge,[tl,tt,tr,tb]=a.glyph;
  assert.ok(mr-ml>=a.width*.20&&mr-ml<=a.width*.24&&
   ml>=l+4&&mr<=r-4&&mt>=t-6&&mb<=b+6,
   'Medallion is outside wooden board: '+JSON.stringify(a));
  assert.ok(tl>=mr+2&&tr<=r-5&&tt>=t-8&&tb<=b+8&&a.fontPx>=22,
   'English letters touch medal or are clipped: '+JSON.stringify(a));
  if(i)assert.ok(t>=data.items[i-1].rect[3]+3,
   'Three plank rows physically overlap');
 }
 // Decode the four real art binaries, not just the CSS names.
 const images=await nav.evaluate(async el=>{
  const first=el.querySelector('button.laria-english-group-board');
  const icons=[...el.querySelectorAll('button.laria-english-group-board .laria-wooden-sign-medallion')];
  const list=[getComputedStyle(first).backgroundImage,...icons.map(m=>getComputedStyle(m).backgroundImage)]
   .map(css=>css.startsWith('url("')?css.slice(5,-2):css.startsWith('url(')?css.slice(4,-1):'');
  const result=[];
  for(const url of list){
   result.push(await new Promise((resolve,reject)=>{
    const image=new Image();image.onload=()=>resolve([image.naturalWidth,image.naturalHeight]);
    image.onerror=()=>reject(new Error('Unloaded English sign image: '+url));image.src=url;
   }));
  }
  return result;
 });
 assert.deepEqual(images,[[1100,292],[392,392],[392,392],[392,392]],
  'English group artwork has wrong dimensions, missing images or is corrupt');
 return data;
}
async function run(engine,name,device,viewport){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport,hasTouch:true,deviceScaleFactor:1,
   reducedMotion:'reduce',serviceWorkers:'block'});
  await context.addInitScript(seed=>localStorage.setItem('laerlittmer-v2',JSON.stringify(seed)),SEED);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  fs.mkdirSync(OUT,{recursive:true});
  try{
   const {nav}=await openScene(page);
   const data=await inspect(nav,viewport);
   await page.screenshot({path:path.join(OUT,`${name}-${device}-english-three-boards-REVIEW.png`),
    animations:'disabled'});
   const deep=device==='1024x1366'||device==='1366x1024';
   for(const key of (deep?KEYS:['words'])){
    if(key!=='words')await openScene(page);
    const button=page.locator('#kinnaklova-world nav.laria-english-group-rail button[data-ki="'+key+'"]');
    await button.click({timeout:20000});
    await page.locator('#session-screen.active.task-scene[data-task-subject="english"]')
     .waitFor({state:'visible',timeout:30000});
    const chip=(await page.locator('#session-screen.active .task-world-chip').textContent())?.trim();
    assert.equal(chip,'Kinnaklova','English activity '+key+' did not open the original journey');
   }
   assert.deepEqual(errors,[],name+' '+device+' had runtime exceptions');
   await context.close();
   return {engine:name,device,stageHeight:data.stageHeight,
    tailPx:data.tailPx,postFootY:data.postFootY,
    signs:data.items.map(x=>({
    action:x.action,rect:x.rect,fontPx:x.fontPx}))};
  }catch(error){
   await page.screenshot({path:path.join(OUT,`${name}-${device}-FAIL.png`),fullPage:true}).catch(()=>{});
   fs.writeFileSync(path.join(OUT,`${name}-${device}-FAIL.txt`),String(error?.stack||error)+'\n');
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
 fs.writeFileSync(path.join(OUT,'english-group-qa.json'),JSON.stringify(report,null,2)+'\n');
 console.log('PASS: all five iPad sizes x Chromium/WebKit, 3 unique routed English signs');
})().catch(error=>{console.error(error);process.exitCode=1;});
