'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const seed={
  version:7,progressSchemaVersion:3,
  profile:{grade:2,onboarded:true,name:'HistorieQA',avatar:'girl',setupVersion:2},
  mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
  masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
  lastMilestone:null,recentCountryWin:null,lastActivity:null,
  journey:{nodes:{'norwegian:2:lyder':{attempts:1,best:4}},gradeWins:{'norwegian:2':{at:123}},viewGrades:{}},
  answerLog:[],sessionLog:[],activeSession:null
};
async function openPreview(page){
  await page.evaluate(()=>openSubject('norwegian'));
  await page.locator('[data-laria-chapter2-preview="1"]').waitFor({timeout:12000});
  await page.locator('[data-laria-chapter2-preview="1"]').click();
  await page.locator('#laria-fortellingsdalen-preview[role="dialog"]').waitFor({timeout:12000});
}
async function solveStory(page,stageId){
  const btn=page.locator('[data-fd-action="stage"][data-fd-stage="'+stageId+'"]');
  await btn.click();
  await page.locator('.fd-letter h2').waitFor({timeout:8000});
  const story=await page.locator('.fd-letter h2').innerText();
  const session=await page.evaluate(()=>window.LARIA_CHAPTER_EXPANSION.resume(state));
  const count=session.total;
  for(let i=0;i<count;i++){
    const selected=await page.evaluate(()=>{
      const s=window.LARIA_CHAPTER_EXPANSION.resume(state);
      const q=s.story.questions[s.index];
      return q.options.indexOf(q.answer);
    });
    await page.locator('.fd-option').nth(selected).click();
    if(i<count-1){
      await page.locator('.fd-feedback').waitFor();
      await page.locator('[data-fd-action="next"]').click();
    }
  }
  const result=page.locator('.fd-result');
  await result.waitFor({timeout:8000});
  assert.match(await result.innerText(),/fant veien videre|Fortellingsdalen er utforsket/i);
  await page.locator('[data-fd-action="intro"]').click();
  return story;
}
async function run(engine,label,viewport){
  const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
  try{
    const context=await browser.newContext({
      viewport,hasTouch:true,isMobile:viewport.width<600,reducedMotion:'reduce',serviceWorkers:'block'
    });
    await context.addInitScript(data=>localStorage.setItem('laerlittmer-v2',JSON.stringify(data)),seed);
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
    await page.route('https://api.worldbank.org/**',r=>r.abort());
    await page.goto(url+'&chapter2-preview=1&chapter2-qa='+label,{waitUntil:'domcontentloaded'});
    await page.locator('.bc14-subject[data-camp="subject-norwegian"]').waitFor({timeout:22000});
    await openPreview(page);
    assert.equal(await page.locator('.fd-place').count(),5);
    assert.match(await page.locator('#fd-title').innerText(),/Fortellingsdalen/);
    assert.equal(await page.locator('.fd-fox img').count(),1);
    const rightAvatar=await page.evaluate(()=>avatarSrc('girl'));
    assert.ok((await page.locator('.fd-fox img').getAttribute('src')).includes(rightAvatar),
      label+' selected personal fox not used');
    const noOverflow=await page.locator('#laria-fortellingsdalen-preview').evaluate(el=>el.scrollWidth<=el.clientWidth+2);
    assert.equal(noOverflow,true,label+' chapter screen is wider than the device');

    // Interrupted chapter play must survive a real browser reload.
    await page.locator('[data-fd-stage="brevhytta"]').click();
    const firstStory=await page.locator('.fd-letter h2').innerText();
    const answer=await page.evaluate(()=>{
      const session=window.LARIA_CHAPTER_EXPANSION.resume(state);
      const q=session.story.questions[0];return q.options.indexOf(q.answer);
    });
    await page.locator('.fd-option').nth(answer).click();
    await page.locator('.fd-next').waitFor();
    await page.locator('[data-fd-action="close"]').click();
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('.bc14-subject[data-camp="subject-norwegian"]').waitFor({timeout:22000});
    await openPreview(page);
    assert.equal(await page.locator('.fd-letter h2').innerText(),firstStory,label+' story draft was lost on reload');
    assert.match(await page.locator('.fd-story-banner').innerText(),/HISTORIE 2 AV 4/);

    // Finish the interrupted story, then all remaining places.
    for(let i=1;i<4;i++){
      const idx=await page.evaluate(()=>{
        const s=window.LARIA_CHAPTER_EXPANSION.resume(state),q=s.story.questions[s.index];
        return q.options.indexOf(q.answer);
      });
      await page.locator('.fd-option').nth(idx).click();
      if(i<3)await page.locator('.fd-next').click();
    }
    await page.locator('.fd-result').waitFor();
    await page.locator('[data-fd-action="intro"]').click();
    assert.match(await page.locator('.fd-progress').innerText(),/1 av 5/);

    for(const stage of ['eventyrbrua','sporstien','fortellermolla','stjernetoppen'])await solveStory(page,stage);
    const report=await page.evaluate(()=>({
      progress:window.LARIA_CHAPTER_EXPANSION.progress(state),
      gradeWins:state.journey.gradeWins,
      oldNode:state.journey.nodes['norwegian:2:lyder'],
      chapterKeys:Object.keys(state.journey.chapterProgress||{}),
      schema:state.progressSchemaVersion,
      activeGrade:state.profile.grade
    }));
    assert.equal(report.progress.complete,true);
    assert.equal(report.progress.done,5);
    assert.deepEqual(report.gradeWins,seed.journey.gradeWins,label+' old grade wins were changed');
    assert.deepEqual(report.oldNode,seed.journey.nodes['norwegian:2:lyder'],label+' old node overwritten');
    assert.deepEqual(report.chapterKeys,['norwegian:2:fortellingsdalen-2']);
    assert.equal(report.activeGrade,2);

    // Return, replay and revisit without destroying chapter completion.
    const newStory=await solveStory(page,'brevhytta');
    assert.notEqual(newStory,firstStory,label+' story variant did not rotate');
    assert.equal(await page.evaluate(()=>window.LARIA_CHAPTER_EXPANSION.progress(state).complete),true);
    const path=process.env.LARIA_CHAPTER2_SCREENSHOTS;
    if(path){
      fs.mkdirSync(path,{recursive:true});
      await page.screenshot({path:require('node:path').join(path,label+'-chapter-complete.png'),fullPage:true,animations:'disabled'});
    }
    assert.deepEqual(errors,[],label+' javascript errors');
    await page.locator('[data-fd-action="close"]').click();
    await page.locator('#subject-screen.active').waitFor();
    await page.goto(url+'&chapter2-preview=0&chapter2-qa='+label,{waitUntil:'domcontentloaded'});
    await page.locator('.bc14-subject[data-camp="subject-norwegian"]').waitFor({timeout:22000});
    await page.evaluate(()=>openSubject('norwegian'));
    assert.equal(await page.locator('[data-laria-chapter2-preview="1"]').count(),0,
      label+' developer preview leaked into normal subject view');
    await context.close();
    console.log('PASS Fortellingsdalen chapter-two preview',label);
  }finally{await browser.close()}
}
(async()=>{
  await run(chromium,'chromium-iphone',{width:390,height:844});
  await run(webkit,'webkit-iphone',{width:390,height:844});
  await run(webkit,'webkit-ipad-landscape',{width:1180,height:820});
})().catch(err=>{console.error(err);process.exitCode=1});
