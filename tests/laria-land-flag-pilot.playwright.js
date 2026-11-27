'use strict';
const assert=require('node:assert/strict');
const {mkdir}=require('node:fs/promises');
const {chromium,webkit}=require('playwright');
const openSubject=require('./helpers/laria-home-open-subject.cjs');
const base=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const out=process.env.LARIA_PILOT_SCREENS||process.env.LARIA_PREMIUM_INTEGRATION_SCREENSHOTS||'/tmp/laria-land-flag-pilot';
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Eventyrer',avatar:'girl',setupVersion:2,tallvikaTroll:'lillesoster'},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},preferences:{sound:false,autoRead:false},journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
async function verify(browser,kind,w,h,touch){
  const ctx=await browser.newContext({viewport:{width:w,height:h},hasTouch:touch,serviceWorkers:'block',reducedMotion:'reduce'});
  try{
    const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await ctx.addInitScript(value=>{if(!localStorage.getItem('laerlittmer-v2'))localStorage.setItem('laerlittmer-v2',JSON.stringify(value))},seed);
    const photo=tag=>page.screenshot({path:out+'/'+kind+'-'+w+'x'+h+'-'+tag+'.png',animations:'disabled'});
    const compact=w<=430&&h<=740&&h>w;
    const activate=locator=>compact?locator.tap():locator.click();
    const onScreen=async selector=>page.waitForFunction(q=>{
      const nodes=[...document.querySelectorAll(q)];
      return nodes.length>0&&nodes.every(node=>{
        const r=node.getBoundingClientRect();
        return r.height>=44&&r.width>=44&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;
      });
    },selector,{timeout:7000});
    await page.goto(base,{waitUntil:'domcontentloaded'});
    // Locked Home v16 personalization is scoped to tablet and desktop.
    if(w>=768&&h>=650){
      const greeting=page.locator('.bc15-v16-greeting:visible');
      await greeting.waitFor({timeout:28000});
      const style=await greeting.evaluate(el=>({background:getComputedStyle(el).backgroundImage,border:getComputedStyle(el).borderTopWidth,position:getComputedStyle(el).position,mask:getComputedStyle(el,'::before').maskImage,text:el.innerText}));
      assert.equal(style.position,'absolute','greeting must own the containing block for its parchment');
      assert.equal(style.background,'none');
      assert.equal(style.border,'0px');
      assert.match(style.mask,/linear-gradient/);
      assert.match(style.text,/Hei, Eventyrer!/);
      const bounds=await greeting.boundingBox();
      assert.ok(bounds.x>=0&&bounds.y>h*.08&&bounds.y<h*.30&&bounds.width>w*.22&&bounds.width<w*.62&&bounds.height<h*.18,'greeting must stay over the painted frame: '+JSON.stringify(bounds));
      // Freeze the independent actor so the pixel diff isolates only the greeting.
      const frozen=await page.addStyleTag({content:'.bc15-v16-troll{visibility:hidden!important;opacity:0!important}'});
      const shown=await page.screenshot({animations:'disabled'});
      const hiddenRule=await page.addStyleTag({content:'.bc15-v16-greeting{visibility:hidden!important}'});
      const hidden=await page.screenshot({animations:'disabled'});
      await hiddenRule.evaluate(el=>el.remove());
      await frozen.evaluate(el=>el.remove());
      const diff=await page.evaluate(async({visible,invisible,bounds})=>{
        async function pixels(png){
          const img=new Image();
          img.src='data:image/png;base64,'+png;
          await img.decode();
          const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
          const c=canvas.getContext('2d');c.drawImage(img,0,0);
          return c.getImageData(0,0,img.width,img.height);
        }
        const [a,b]=await Promise.all([pixels(visible),pixels(invisible)]);
        let inside=0,outside=0;
        for(let y=0;y<a.height;y++)for(let x=0;x<a.width;x++){
          const i=(y*a.width+x)*4;
          if(Math.max(...[0,1,2].map(j=>Math.abs(a.data[i+j]-b.data[i+j])))<30)continue;
          if(x>=bounds.x-2&&x<=bounds.x+bounds.width+2&&y>=bounds.y-2&&y<=bounds.y+bounds.height+2)inside++;else outside++;
        }
        return {inside,outside};
      },{visible:shown.toString('base64'),invisible:hidden.toString('base64'),bounds});
      assert.ok(diff.inside>80&&diff.outside<25,'personalized greeting must change pixels only inside the painted frame: '+JSON.stringify(diff));
      await photo('home');
    }
    await openSubject(page,'geography');
    const geo=page.locator('#laria-geography-world:visible');
    assert.deepEqual(await geo.locator('.gv-sign').evaluateAll(nodes=>nodes.map(e=>e.dataset.gv)),['globe','country']);
    await activate(geo.locator('[data-gv="country"]'));
    const game=page.locator('#session-screen.active[data-land-flag]');
    await game.waitFor({timeout:14000});
    assert.match(await game.evaluate(e=>getComputedStyle(e).getPropertyValue('--task-world')),new RegExp('nordlysleiren-bluehour-'+(h>w?'portrait':'landscape')));
    assert.match(await page.locator('#session-count').innerText(),/Oppdrag 1 av 5/);
    await game.locator('.land-flag-hint summary').click();
    assert.match(await game.locator('.land-flag-hint p').innerText(),/flagget/);
    assert.equal(await page.evaluate(()=>currentAnswered),null,'help must not count an answer');
    await game.locator('.land-flag-hint summary').click();
    if(compact)await onScreen('#session-screen.active .task-interaction > .answers .answer');
    await photo('flag');
    // Use a real generated Nordic map question if this random session lacks one next.
    await page.evaluate(()=>{if(sessionQuestions[1].type!=='map'){sessionQuestions[1]=makeQuestion('no','map',NORDIC_IDS);persistActiveSession();}});
    const read=await game.locator('#read-aloud').count();
    if(read)assert.match(await game.locator('#read-aloud').getAttribute('aria-label'),/Les opp/);
    const flagWrong=await page.evaluate(()=>sessionQuestions[qIndex].options.find(o=>o!==sessionQuestions[qIndex].answer));
    await activate(game.getByRole('button',{name:flagWrong,exact:true}));
    await game.getByText('Nesten!',{exact:true}).waitFor({timeout:6500});
    if(h<850)await onScreen('#session-screen.active #next-question');
    await photo('feedback');
    await game.locator('#next-question').click();
    const alternatives=game.locator('#land-flag-map-choices');
    await alternatives.waitFor();
    if(compact){
      assert.equal(await game.locator('.session').evaluate(el=>el.scrollTop),0,'new question starts at the top');
      await onScreen('#session-screen.active #land-flag-map-choices summary');
    }
    await photo('map-fold');
    await alternatives.locator('summary').click();
    const map=await page.evaluate(()=>sessionQuestions[qIndex].answer);
    const right=alternatives.locator('[data-land-flag-map="'+map+'"]');
    assert.match(await right.innerText(),/^Område \d+$/);
    await photo('map');
    await right.focus();await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(()=>currentAnswered.correct),true,'keyboard map answer uses the real answer engine');
    if(compact)await onScreen('#session-screen.active #next-question');
    await game.locator('#next-question').click();
    while(await game.isVisible()){
      const q=await page.evaluate(()=>({type:sessionQuestions[qIndex].type,answer:sessionQuestions[qIndex].answer}));
      if(q.type==='map'){
        await game.locator('#land-flag-map-choices summary').click();
        await game.locator('[data-land-flag-map="'+q.answer+'"]').click();
      }else await game.getByRole('button',{name:q.answer,exact:true}).click();
      await game.locator('#next-question').click();
    }
    const complete=page.locator('#complete-screen.active[data-land-flag]');
    await complete.waitFor({timeout:14000});
    assert.equal(await complete.locator('#complete-home').innerText(),'Tilbake til Geografi');
    assert.ok(await complete.locator('#complete-progress').isVisible());
    assert.equal(await page.evaluate(()=>state.activeSession),null);
    assert.equal(await page.evaluate(()=>state.sessionLog.at(-1).correct),4);
    await photo('complete');
    await complete.locator('#complete-home').click();
    await geo.waitFor({timeout:14000});
    assert.equal(await geo.locator('[data-gv="journey"]').count(),0);
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2')).sessionLog.length);
    assert.equal(saved,1,'one finished session stored');
    assert.deepEqual(errors,[]);
    console.log('PASS',kind,w,h);
  }finally{await ctx.close()}
}
async function verifyPilot(){
  await mkdir(out,{recursive:true});
  for(const [kind,engine] of [['chromium',chromium],['webkit',webkit]]){
    if(process.env.LARIA_PILOT_ENGINE&&process.env.LARIA_PILOT_ENGINE!==kind)continue;
    const exe=kind==='chromium'&&process.env.LARIA_CHROMIUM_PATH;
    const browser=await engine.launch(exe?{executablePath:exe,args:['--no-sandbox']}:{});
    try{
      for(const [w,h,touch] of [[1180,820,true],[820,1180,true],[390,844,true],[320,568,true],[844,390,true],[1440,900,false]]){
        if(!process.env.LARIA_PILOT_DEVICE||process.env.LARIA_PILOT_DEVICE===w+'x'+h)await verify(browser,kind,w,h,touch);
      }
    }
    finally{await browser.close()}
  }
}
module.exports=verifyPilot;
if(require.main===module)verifyPilot().catch(e=>{console.error(e);process.exitCode=1});
