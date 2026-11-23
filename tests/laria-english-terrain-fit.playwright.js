'use strict';
/* Comparison-only, never a production rollout.
 * Current accepted technical comparison is source=4 without artificial flowers.
 * Terrain-fit=6 moves the same original boards nearer the existing brush line
 * while reducing the exposed support length; everything else must remain.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const openHomeSubject=require('./helpers/laria-home-open-subject.cjs');
const SHA='9019d2d7be86d0f96d59770c0d141b935b1c4195fecc4e1dcfbf531ce226e028';
const BASE=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const OUT=process.env.LARIA_TERRAIN_FIT_SHOTS||'/tmp/laria-terrain-fit';
const SMOKE=process.env.LARIA_TERRAIN_SMOKE==='1';
const DEVICES=[
 ['820x1180',{width:820,height:1180},575,22],
 ['1024x1366',{width:1024,height:1366},655,22],
 ['1180x820',{width:1180,height:820},419,12],
 ['1024x768',{width:1024,height:768},385,12],
 ['1366x1024',{width:1366,height:1024},506,16]
];
const SEED={version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'Terrain QA',avatar:'girl',setupVersion:2,tallvikaTroll:'storesoster'},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},
 skillEvidence:{},preferences:{sound:false,autoRead:false},
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
async function scene(page,variant){
 await page.goto(BASE+'&lariaEnglishSignGroupCandidate='+variant,
  {waitUntil:'domcontentloaded',timeout:90000});
 await openHomeSubject(page,'english');
 const nav=page.locator('#kinnaklova-world .ki-stage.laria-reference-layout-v1'+
  '[data-laria-reference-mode="activities"] > nav.laria-english-source-group');
 await nav.waitFor({state:'visible',timeout:40000});
 await page.waitForFunction(()=>{
  const n=document.querySelector('#kinnaklova-world nav.laria-english-source-group');
  return ['ready','blocked'].includes(n?.dataset.lariaVegetationOcclusion);
 },null,{timeout:40000});
 const status=await nav.evaluate(el=>({
  source:el.dataset.lariaEnglishSourceGroup,
  ground:el.dataset.lariaVegetationOcclusion,
  reason:el.dataset.lariaVegetationReason
 }));
 assert.deepEqual([status.source,status.ground],['ready','ready'],
  'Source illustration or scene-ground overlay blocked: '+JSON.stringify(status));
 return nav;
}
async function capture(page,nav){
 return nav.evaluate(el=>{
  const rect=e=>{const r=e.getBoundingClientRect();
   return [r.left,r.top,r.right,r.bottom];};
  const buttons=[...el.querySelectorAll(':scope > button.laria-english-group-board')];
  const posts=el.querySelector(':scope > .laria-english-source-posts');
  const background=el.closest('.ki-stage')?.querySelector('.ki-master');
  const ground=posts?.querySelector('canvas.laria-english-vegetation-occlusion');
  return {
   variant:el.classList.contains('laria-english-terrain-fit')?'terrain-fit':'original',
   sha:el.dataset.lariaEnglishSourceSha,
   postVariant:el.dataset.lariaEnglishPostsVariant,
   nav:rect(el),posts:rect(posts),
   boards:buttons.map(x=>({name:x.querySelector('.ki-plank-name')?.textContent?.trim(),
    action:x.dataset.ki,box:rect(x),
    bg:getComputedStyle(x).backgroundImage})),
   background:background?.currentSrc||background?.src,
   ground:ground?.dataset.source,groundPointer:ground?getComputedStyle(ground).pointerEvents:null,
   botanical:!!posts?.querySelector('.laria-english-botanical-foreground'),
   refTail:getComputedStyle(el).getPropertyValue('--laria-group-tail').trim(),
   refTop:getComputedStyle(el).top
  };
 });
}
async function run(engine,name,device,viewport,roof,drop){
 const browser=await engine.launch({headless:true,
  args:engine===chromium?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport,deviceScaleFactor:1,
   hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
  await context.addInitScript(data=>localStorage.setItem('laerlittmer-v2',JSON.stringify(data)),SEED);
  const page=await context.newPage();const exceptions=[];
  page.on('pageerror',error=>exceptions.push(String(error.message)));
  fs.mkdirSync(OUT,{recursive:true});
  try{
   const beforeNav=await scene(page,'4');
   const before=await capture(page,beforeNav);
   await page.screenshot({path:path.join(OUT,name+'-'+device+'-before-source-4.png'),
    animations:'disabled'});
   const afterNav=await scene(page,'6');
   const after=await capture(page,afterNav);
   await page.screenshot({path:path.join(OUT,name+'-'+device+'-after-terrain-6.png'),
    animations:'disabled'});
   assert.equal(before.variant,'original');
   assert.equal(after.variant,'terrain-fit');
   assert.equal(before.sha,SHA);assert.equal(after.sha,SHA);
   assert.equal(after.postVariant,'2');
   assert.equal(after.ground,'kinnaklova-approved-master-pixels');
   assert.equal(after.groundPointer,'none');
   assert.equal(after.botanical,false,
    'Rejected Grovanova flower overlay leaked into the composition-only variant');
   assert.equal(before.background,after.background,'Approved Kinnaklova painting changed');
   assert.deepEqual(after.boards.map(x=>x.action),['words','sentences','reading']);
   assert.deepEqual(after.boards.map(x=>x.name),['Words','Sentences','Reading']);
   assert.deepEqual(after.boards.map(x=>x.bg),before.boards.map(x=>x.bg),
    'Repositioning unexpectedly replaced the source-locked board or medal artwork');
   for(let i=0;i<3;i++){
    const b=before.boards[i].box,a=after.boards[i].box;
    assert.ok(Math.abs(a[0]-b[0])<2&&Math.abs((a[2]-a[0])-(b[2]-b[0]))<2,
     'Terrain adjustment moved or resized a board horizontally');
    assert.ok(Math.abs((a[1]-b[1])-drop)<=2,
     'Board failed to move down by the selected device-specific offset');
    assert.ok(a[1]>=0&&a[3]<=viewport.height&&a[0]>=0&&a[2]<=viewport.width,
     'Source board clipped');
   }
   const tail=after.posts[3]-after.boards[2].box[3];
   assert.ok(tail>=19&&tail<=64,
    'Wooden foot too short to remain a support or too long to enter terrain: '+tail);
   assert.ok(Math.abs(after.posts[3]-before.posts[3])<=4,
    'Adjusted board positions must not push feet into church roof: '+JSON.stringify({
     before:before.posts[3],after:after.posts[3]}));
   assert.ok(after.posts[3]<=roof,'Support end intersects protected church roof');
   assert.ok(after.posts[1]<after.boards[0].box[1],
    'Original top caps disappear behind first wooden plank');
   assert.deepEqual(exceptions,[],'Browser exceptions during A/B');
   // Check the original activity handlers, not a cloned visual-only board.
   await afterNav.locator('button[data-ki="words"]').click({timeout:25000});
   await page.locator('#session-screen.active.task-scene[data-task-subject="english"]')
    .waitFor({state:'visible',timeout:30000});
   assert.equal((await page.locator('#session-screen.active .task-world-chip').textContent())?.trim(),
    'Kinnaklova');
   await context.close();
   return {name,device,drop,tail,
    originalPosts:before.posts,terrainPosts:after.posts,
    oldTop:before.boards[0].box[1],newTop:after.boards[0].box[1]};
  }catch(error){
   await page.screenshot({path:path.join(OUT,name+'-'+device+'-FAIL.png'),fullPage:true}).catch(()=>{});
   fs.writeFileSync(path.join(OUT,name+'-'+device+'-FAIL.txt'),String(error.stack||error));
   throw error;
  }
 }finally{await browser.close();}
}
(async()=>{
 const report=[];
 for(const [device,viewport,roof,drop] of (SMOKE?DEVICES.slice(0,1):DEVICES))
  for(const [name,engine] of (SMOKE?[['chromium',chromium]]:[['chromium',chromium],['webkit',webkit]]))
   report.push(await run(engine,name,device,viewport,roof,drop));
 fs.mkdirSync(OUT,{recursive:true});
 fs.writeFileSync(path.join(OUT,'terrain-fit-comparison.json'),JSON.stringify(report,null,2)+'\n');
 console.log('PASS: same 3 illustrated actions, safer terrain-fit placement in '+report.length+' iPad configurations');
})().catch(e=>{console.error(e);process.exitCode=1;});