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
async function openChooser(page){
  await page.evaluate(()=>openSubject('norwegian'));
  const launcher=page.locator('[data-laria-chapter2-preview="1"]');
  await launcher.waitFor({timeout:12000});
  await launcher.click();
  await page.locator('#laria-norwegian-chapter-picker [role="dialog"]').waitFor({timeout:12000});
  assert.equal(await page.locator('[data-fd-chapter-card]').count(),2);
  assert.match(await page.locator('[data-fd-chapter-card="bokskogen-1"]').innerText(),/Bokskogen/);
  assert.match(await page.locator('[data-fd-chapter-card="fortellingsdalen-2"]').innerText(),/Fortellingsdalen/);
  assert.match(await page.locator('[data-fd-chapter-card="bokskogen-1"] img').getAttribute('src'),
    /bokskogen-locked-20261010\.png/);
  assert.match(await page.locator('[data-fd-chapter-card="fortellingsdalen-2"] img').getAttribute('src'),
    /fortellingsdalen-map-preview\.svg/);
  await page.waitForFunction(()=>{
    const images=[...document.querySelectorAll('#laria-norwegian-chapter-picker .fd-chapter-image')];
    return images.length===2&&images.every(img=>img.complete&&img.naturalWidth===941&&img.naturalHeight===1672);
  },null,{timeout:16000});
  const chooserFits=await page.locator('#laria-norwegian-chapter-picker').evaluate(
    el=>el.scrollWidth<=el.clientWidth+2
  );
  assert.equal(chooserFits,true,'Chapter selection must not overflow horizontally');
}
async function openPreview(page){
  await openChooser(page);
  const second=page.locator('[data-fd-pick="fortellingsdalen-2"]');
  assert.equal(await second.isDisabled(),false,'Legacy Bokskogen winner should retain chapter-two access');
  await second.click();
  await page.locator('#laria-fortellingsdalen-preview[role="dialog"]').waitFor({timeout:12000});
  assert.equal(await page.locator('#laria-norwegian-chapter-picker').getAttribute('aria-hidden'),'true');
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
    await context.addInitScript(data=>{if(!localStorage.getItem('laerlittmer-v2'))localStorage.setItem('laerlittmer-v2',JSON.stringify(data))},seed);
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
    await page.route('https://api.worldbank.org/**',r=>r.abort());
    await page.goto(url+'&chapter2-preview=1&chapter2-qa='+label,{waitUntil:'domcontentloaded'});
    await page.locator('.bc14-subject[data-camp="subject-norwegian"]').waitFor({timeout:22000});
    await openChooser(page);
    if(process.env.LARIA_CHAPTER2_SCREENSHOTS){
      const dir=process.env.LARIA_CHAPTER2_SCREENSHOTS;fs.mkdirSync(dir,{recursive:true});
      await page.screenshot({path:path.join(dir,label+'-chapter-picker.png'),fullPage:false,animations:'disabled'});
    }
    await page.locator('[data-fd-pick="bokskogen-1"]').click();
    await page.locator('#laria-norwegian-chapter-picker').waitFor({state:'detached'});
    await page.locator('#subject-screen.active').waitFor();
    assert.equal(await page.locator('[data-fd-chapter-card]').count(),0,
      'returning to original Bokskogen must not leave chapter chooser over its painted map');
    await openPreview(page);
    assert.equal(await page.locator('.fd-place').count(),5);
    assert.match(await page.locator('#fd-title').innerText(),/Fortellingsdalen/);
    const painted=page.locator('.fd-atlas-paint');
    await painted.waitFor({state:'visible',timeout:14000});
    await page.waitForFunction(()=>{
      const img=document.querySelector('.fd-atlas-paint');
      return img?.complete&&img.naturalWidth===941&&img.naturalHeight===1672;
    },null,{timeout:14000});
    const mapGeometry=await page.evaluate(()=>{
      const atlas=document.querySelector('.fd-atlas'),bounds=atlas.getBoundingClientRect();
      return {
        paint:document.querySelector('.fd-atlas-paint')?.getAttribute('src'),
        fox:atlas.querySelectorAll('.fd-map-fox img').length,
        places:[...atlas.querySelectorAll('.fd-map-place')].map(el=>{
          const b=el.getBoundingClientRect(),r=atlas.getBoundingClientRect();
          return {id:el.dataset.fdStage,visible:getComputedStyle(el).display!=='none',
            width:b.width,height:b.height,
            inside:b.left>=r.left-3&&b.right<=r.right+3&&b.top>=r.top-3&&b.bottom<=r.bottom+3};
        })
      };
    });
    assert.ok(mapGeometry.paint.includes('fortellingsdalen-map-preview.svg'),label+' illustration missing');
    assert.equal(mapGeometry.fox,1,label+' personal fox must be an image layer above atlas');
    assert.equal(mapGeometry.places.length,5);
    for(const place of mapGeometry.places){
      assert.equal(place.visible,true,label+' hidden atlas stop '+place.id);
      assert.equal(place.inside,true,label+' clipped atlas stop '+place.id);
      assert.ok(place.height>=44,label+' undersized tap target '+place.id);
    }
    if(process.env.LARIA_CHAPTER2_SCREENSHOTS){
      const dir=process.env.LARIA_CHAPTER2_SCREENSHOTS;
      fs.mkdirSync(dir,{recursive:true});
      await page.screenshot({path:require('node:path').join(dir,label+'-storybook-map.png'),fullPage:false,animations:'disabled'});
      await page.locator('[data-fd-stage="brevhytta"]').scrollIntoViewIfNeeded();
      await page.screenshot({path:require('node:path').join(dir,label+'-first-stop.png'),fullPage:false,animations:'disabled'});
    }
    assert.equal(await page.locator('.fd-fox img').count(),1);
    assert.equal(await page.locator('[data-fd-fox-stage]').getAttribute('data-fd-fox-stage'),'brevhytta',
      label+' fox should begin at the first unfinished stop');
    const rightAvatar=await page.evaluate(()=>avatarSrc('girl'));
    assert.ok((await page.locator('.fd-fox img').getAttribute('src')).includes(rightAvatar),
      label+' selected personal fox not used');
    const noOverflow=await page.locator('#laria-fortellingsdalen-preview').evaluate(el=>el.scrollWidth<=el.clientWidth+2);
    assert.equal(noOverflow,true,label+' chapter screen is wider than the device');

    // Interrupted chapter play must survive a real browser reload.
    await page.locator('[data-fd-stage="brevhytta"]').click();
    const firstStory=await page.locator('.fd-letter h2').innerText();
    const storyFox=page.locator('.fd-story-companion img');
    assert.equal(await storyFox.count(),1,label+' selected fox should join the story scene');
    assert.ok((await storyFox.getAttribute('src')).includes(rightAvatar),
      label+' story fox must match the chosen avatar');
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
    assert.match(await page.locator('.fd-story-banner').innerText(),/SPOR 2 AV 4/);

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
    assert.equal(await page.locator('[data-fd-fox-stage]').getAttribute('data-fd-fox-stage'),'eventyrbrua',
      label+' fox must move to next suggested map landmark after first story');
    const foxCoords=await page.locator('[data-fd-fox-stage]').evaluate(el=>({
      x:el.style.getPropertyValue('--fd-fox-x'),
      y:el.style.getPropertyValue('--fd-fox-y'),
      scale:el.style.getPropertyValue('--fd-fox-scale')
    }));
    assert.deepEqual(foxCoords,{x:'43%',y:'78%',scale:'0.84'},label+' fox perspective anchor changed unexpectedly');

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
    const captureDir=process.env.LARIA_CHAPTER2_SCREENSHOTS;
    if(captureDir){
      fs.mkdirSync(captureDir,{recursive:true});
      await page.screenshot({path:path.join(captureDir,label+'-chapter-complete.png'),fullPage:false,animations:'disabled'});
    }
    assert.deepEqual(errors,[],label+' javascript errors');
    await page.locator('[data-fd-action="close"]').click();
    await page.locator('#laria-norwegian-chapter-picker [role="dialog"]').waitFor();
    assert.equal(await page.locator('#laria-norwegian-chapter-picker').getAttribute('aria-hidden'),null);
    assert.match(await page.locator('[data-fd-chapter-card="fortellingsdalen-2"]').innerText(),
      /Alle fem steder utforsket|Fullført/i,
      'chapter picker must reflect a newly completed adventure after closing the story');
    await page.locator('[data-fd-pick="bokskogen-1"]').click();
    await page.locator('#laria-norwegian-chapter-picker').waitFor({state:'detached'});
    await page.locator('#subject-screen.active').waitFor();
    await page.goto(url+'&chapter2-preview=0&chapter2-qa='+label,{waitUntil:'domcontentloaded'});
    await page.locator('.bc14-subject[data-camp="subject-norwegian"]').waitFor({timeout:22000});
    await page.evaluate(()=>openSubject('norwegian'));
    assert.equal(await page.locator('[data-laria-chapter2-preview="1"]').count(),0,
      label+' developer preview leaked into normal subject view');
    assert.equal(await page.locator('#laria-norwegian-chapter-picker').count(),0,
      label+' unpublished chooser must not be in regular child-facing UI');
    await context.close();
    console.log('PASS Fortellingsdalen chapter-two preview',label);
  }finally{await browser.close()}
}
(async()=>{
  await run(chromium,'chromium-iphone',{width:390,height:844});
  await run(webkit,'webkit-iphone',{width:390,height:844});
  await run(webkit,'webkit-ipad-landscape',{width:1180,height:820});
  await run(chromium,'chromium-ipad-landscape',{width:1180,height:820});
  await run(webkit,'webkit-iphone-small',{width:320,height:640});
})().catch(err=>{console.error(err);process.exitCode=1});
