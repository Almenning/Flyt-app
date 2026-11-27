'use strict';

const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const seed={
  version:7,progressSchemaVersion:3,
  profile:{grade:2,onboarded:true,name:'Kinnaklova QA',avatar:'girl',setupVersion:2,tallvikaTroll:'lillesoster'},
  mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},
  preferences:{sound:false,autoRead:false},journey:{nodes:{},gradeWins:{},viewGrades:{}},
  answerLog:[],sessionLog:[],activeSession:null
};

// Tap/click the actual visible control. The WebKit WPE test runner's
// actionability poller can stall while sampling the painted scene animation.
async function pressAtCenter(page,target,touch){
  await target.waitFor({state:'visible'});
  const hit=await target.evaluate(el=>{
    const r=el.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
    return {x,y,usable:el.contains(document.elementFromPoint(x,y))};
  });
  assert.equal(hit.usable,true,'the real control center must receive input');
  if(touch)await page.touchscreen.tap(hit.x,hit.y);else await page.mouse.click(hit.x,hit.y);
}
async function check(browser,engine,width,height,touch,action){
  const ctx=await browser.newContext({viewport:{width,height},isMobile:touch,hasTouch:touch,reducedMotion:'reduce',serviceWorkers:'block'});
  try{
    await ctx.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed);
    const page=await ctx.newPage(), errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>/^((phone|tablet)-ready|(ipad|desktop)-v16-(portrait|landscape))$/.test(
      document.querySelector('#home-screen.active .bc12.bc15-locked-home:not(.bc15-pending)')?.dataset.bc15Asset||''
    ));
    await pressAtCenter(page,page.locator('#home-screen.active :is(.bc15-v16-signs,.bc15-subject-signs) [data-bc15-subject="english"]:visible'),touch);
    const world=page.locator('#kinnaklova-world[data-ki-art="ready"][data-ki-premium-art="approved"]');
    await world.waitFor();
    const stage=world.locator('.ki-stage[data-laria-artwork-ui="separate"]');
    assert.equal(await stage.evaluate(el=>el.classList.contains('laria-reference-layout-v1')),false,'must exercise the shipped compact fallback');
    const frame=await stage.boundingBox();
    assert.ok(frame&&Math.abs(frame.x)<.5&&Math.abs(frame.y)<.5&&
      Math.abs(frame.width-width)<.5&&Math.abs(frame.height-height)<.5,JSON.stringify(frame));
    assert.deepEqual(await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.scrollHeight]),[width,height]);
    const img=stage.locator('.ki-master');
    assert.match(await img.getAttribute('src'),/kinnaklova-ui-free-approved\.webp/);
    assert.deepEqual(await img.evaluate(el=>[el.naturalWidth,el.naturalHeight,getComputedStyle(el).objectFit]),[1672,941,'cover']);
    assert.equal(await stage.locator('.ki-world-brand').isVisible(),true);
    assert.equal(await stage.locator('.ki-stage-choose').isVisible(),true);
    const rail=stage.locator('nav.laria-scene-navigation:visible');
    assert.equal(await rail.count(),1);
    const posts=await rail.evaluate(el=>getComputedStyle(el,'::before').backgroundImage);
    assert.match(posts,/laria-grovanova-signposts\.svg/);
    const buttonData=await rail.getByRole('button').evaluateAll(els=>els.map(el=>{
      const {x,y,width,height}=el.getBoundingClientRect();
      return {action:el.dataset.ki,x,y,width,height,hit:el.contains(document.elementFromPoint(x+width/2,y+height/2))};
    }));
    assert.deepEqual(buttonData.map(el=>el.action),['words','sentences','reading']);
    assert.ok(buttonData.every((b,i)=>b.x===buttonData[0].x&&b.x<width*.25&&b.y>=0&&b.y+b.height<=height&&
      b.width>=44&&b.height>=44&&b.hit&&(i===0||b.y>=buttonData[i-1].y+buttonData[i-1].height)));
    const target=rail.locator('[data-ki="'+action+'"]');
    await pressAtCenter(page,target,touch);
    await page.locator('#session-screen.active .laria-task-card').waitFor();
    assert.deepEqual(await page.evaluate(()=>({subject:sessionScope?.subject,module:sessionScope?.module})),
      {subject:'english',module:action});
    assert.deepEqual(errors,[]);
    console.log('PASS',engine,width+'x'+height,action);
  }finally{await ctx.close()}
}
(async()=>{
  for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
    if(process.env.QA_ENGINE&&process.env.QA_ENGINE!==name)continue;
    const browser=await engine.launch(name==='chromium'?{
      args:['--no-sandbox'],...(process.env.QA_CHROMIUM_PATH&&{executablePath:process.env.QA_CHROMIUM_PATH})
    }:{});
    try{
      for(const [w,h,touch,action] of [[844,390,true,'words'],[667,375,true,'sentences'],[960,540,false,'reading']]){
        await check(browser,name,w,h,touch,action);
      }
    }finally{await browser.close()}
  }
})().catch(error=>{console.error(error);process.exitCode=1});
