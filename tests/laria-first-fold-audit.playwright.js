'use strict';
// Release audit: report what a child can actually hit before a first scroll.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const base=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const out=process.env.LARIA_FOLD_OUTPUT||'/tmp/laria-first-fold';
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Demo Læria',avatar:'girl',setupVersion:2,tallvikaTroll:'lillesoster'},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},masteryEvidence:{},preferences:{sound:false,autoRead:false},journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
const matrix=[[1440,900],[1280,720],[1920,1080],[1680,720],[1366,1024],[1024,1366],[1180,820],[820,1180],[1024,768],[390,844],[844,390],[375,667],[667,375],[568,320],[320,568],[393,852],[430,932]];
async function inspect(page,scope,controls){
 return page.locator(scope).first().evaluate((node,selectors)=>{
   const dim=el=>{const r=el.getBoundingClientRect();return [r.x,r.y,r.width,r.height].map(n=>Math.round(n*10)/10)};
   const result=Object.fromEntries(selectors.map(s=>[s,[...node.querySelectorAll(s)].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').map(e=>{
     const [x,y,w,h]=dim(e),hit=document.elementFromPoint(x+w/2,y+h/2);
     return {name:(e.getAttribute('aria-label')||e.textContent.trim()).slice(0,60),x,y,w,h,hit:!!hit&&(hit===e||e.contains(hit)),
       fold:x>=-1&&y>=-1&&x+w<=innerWidth+1&&y+h<=innerHeight+1,touch:w>=44&&h>=44};
   })]));
   const scrolling=[
     document.scrollingElement,node,...node.querySelectorAll('main, section, dialog, [class*="scroll"], .bc12-dialog-body, .lmc-shell')
   ].filter((e,i,a)=>e&&a.indexOf(e)===i&&e.clientHeight>0&&e.scrollHeight>e.clientHeight+2).map(e=>({
     node:e.id||String(e.className||e.nodeName).slice(0,100),extra:e.scrollHeight-e.clientHeight,overflow:getComputedStyle(e).overflowY
   }));
   return {screen:[innerWidth,innerHeight],rect:dim(node),scrolling,controls:result};
 },controls);
}
async function audit(engine,browserType,width,height){
  const label=engine+'-'+width+'x'+height;
  const b=await browserType.launch({headless:true,args:engine==='chromium'?['--no-sandbox','--disable-dev-shm-usage']:[]});
  const context=await b.newContext({viewport:{width,height},isMobile:width<600||height<520,hasTouch:width<=1366&&height>720||width<600||height<520,serviceWorkers:'block',reducedMotion:'reduce'});
  const page=await context.newPage(), result={}, errors=[];
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  page.on('pageerror',e=>errors.push(e.message));
  const record=async(n,s,q)=>{await page.locator(s).first().waitFor({timeout:n==='hjem'?30000:12000});result[n]=await inspect(page,s,q);
    if(process.env.LARIA_FOLD_SCREENSHOTS==='1')await page.screenshot({path:path.join(out,label+'-'+n+'.png'),animations:'disabled'});
  };
  // Traverse with DOM activation, so navigation does not auto-scroll the page.
  // The report separately checks each control's real topmost hit target.
  const click=async s=>page.locator(s+':visible').first().evaluate(el=>el.click(),null,{timeout:12000});
  const home='#home-screen.active .bc12.bc15-v16-locked';
  try{
    await page.addInitScript(s=>{if(!localStorage.getItem('laerlittmer-v2'))localStorage.setItem('laerlittmer-v2',JSON.stringify(s))},seed);
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>window.scrollTo(0,0));
    await record('hjem',home,['.bc15-v16-sign','.bc15-v16-reisen','.bc12-journey','.bc12-nav button','.bc12-adult-entry']);
    // Do the critical play route first, independently of slower optional
    // dialogs. Real button activation allows the world to settle in WebKit.
    await page.locator(home+' .bc15-v16-sign[data-bc15-subject="norwegian"]').click();
    await page.locator('#eggenipa-world :is(.eg-scene-reading,.eg-portal[data-eg="reading"]):visible').first().click();
    if((width===320&&height===568)||(width===568&&height===320)){
      // Preserve the real entry route, then select the authored Nynorsk
      // passage that reproduced the overflow. The adaptive pick is random.
      await page.evaluate(()=>{
        const fixture=subjectPoolForGrade('norwegian',2,'reading')
          .find(q=>q.prompt==='Kva gjer Iben før frosken hoppar fram?');
        if(!fixture)throw new Error('Missing authored Lesekroken regression passage');
        sessionQuestions[qIndex]=fixture;
        renderQuestion();
      });
    }
    await record('lesekroken','#session-screen.active',['#close-session','.read-aloud','.answer','.task-norsk-guide']);
    const correct=await page.evaluate(()=>sessionQuestions[qIndex].answer);
    const answers=page.locator('#session-screen.active .answer');
    const contents=await answers.allTextContents();
    const index=contents.findIndex(v=>v.trim()===String(correct).trim());
    if(index>=0){
      await answers.nth(index).evaluate(el=>el.click());
      await record('lesekroken-svar','#session-screen.active',['#close-session','#next-question']);
    }
    await click('#session-screen.active #close-session');
    await click('#eggenipa-world .eg-home');
    await click(home+' .bc15-v16-reisen');
    await record('reisen','#bc15-v16-journey-dialog[open]',['button','.bc15-v16-dialog-close']);
    await click('#bc15-v16-journey-dialog[open] .bc15-v16-dialog-close');
    await click(home+' .bc12-nav [data-camp="explore"]');
    await record('utforsk','#home-screen.active .bc12',['.bc12-nav button','.bc12-destinations button','.bc14-subjects button']);
    await click('#home-screen.active .bc12-nav [data-camp="home"]');
    await click(home+' .bc12-nav [data-camp="collection"]');
    await record('samlebok','#bc12-dialog[open]',['.bc12-close','.lmc-tabs button','.bc12-collection-tabs button','[data-collection-tab]','.lmc-page-toolbar button:not(:disabled)']);
    await click('#bc12-dialog[open] [data-lmc-action="next"]');
    await page.locator('#bc12-dialog[open] [data-book-page="norsk"][aria-current="page"], #bc12-dialog[open] [data-lmc-action="previous"]:not(:disabled)').first().waitFor();
    assert.equal(await page.locator('#bc12-dialog[open]').evaluate(el=>el.scrollTop),0,'page switch should not scroll the book toolbar away');
    await click('#bc12-dialog[open] .bc12-close');
    await click(home+' .bc12-nav [data-camp="wardrobe"]');
    await record('mine-troll','#laria-premium-troll-dialog[open]',['button']);
    await click('#laria-premium-troll-dialog[open] .laria-troll-dialog-close');
    // The long-press parental gate is covered in the investor journey.
    // Enter directly here to measure the parent pages without altering it.
    await page.evaluate(()=>openAdult());
    await record('for-voksne','#adult-screen.active',['#adult-back','#open-parent-info','#open-terms','#open-commerce','#open-feedback','#adult-grade']);
    await click('#adult-screen #open-commerce');
    await record('abonnement','#commerce-screen.active',['#commerce-back','#commerce-restore','#commerce-open-terms']);
    await click('#commerce-screen #commerce-back');
    await click('#adult-screen #open-parent-info');
    await record('foreldreinfo','#parent-info-screen.active',['#parent-info-back']);
    await click('#parent-info-screen #parent-info-back');
    await click('#adult-screen #open-terms');
    await record('vilkar','#terms-screen.active',['#terms-back']);
    await click('#terms-screen #terms-back');
    await click('#adult-screen #open-feedback');
    await record('tilbakemelding','#feedback-screen.active',['.detail-back','textarea','button[type="submit"]']);
  }catch(e){result.routeError=String(e);}
  finally{await context.close();await b.close();}
  fs.writeFileSync(path.join(out,label+'.json'),JSON.stringify({label,width,height,result,errors},null,2));
  if(process.env.LARIA_FOLD_ENFORCE==='1'){
    // The parent area may scroll, but reading and feedback controls may not.
    assert.ok(result.lesekroken?.controls&&result['lesekroken-svar']?.controls,
      label+' failed to reach the real reading round and feedback: '+(result.routeError||''));
    const answers=result.lesekroken.controls['.answer'];
    const next=result['lesekroken-svar'].controls['#next-question'];
    assert.ok(answers.length>=2&&answers.every(x=>x.fold&&x.hit&&x.touch),
      label+' reading answers are not in the first viewport '+JSON.stringify(answers));
    assert.ok(next.length===1&&next[0].fold&&next[0].hit&&next[0].touch,
      label+' next reading action is outside the first viewport '+JSON.stringify(next));
    for(const selector of ['#close-session','.read-aloud','.task-norsk-guide']){
      const targets=result.lesekroken.controls[selector];
      assert.ok(targets.length===1&&targets[0].fold&&targets[0].hit&&targets[0].touch,
        label+' reading aid is not usable without scrolling: '+selector+' '+JSON.stringify(targets));
    }
    if(width>=750&&height>=635){
      const toolbar=result.samlebok.controls['.lmc-page-toolbar button:not(:disabled)'];
      assert.equal(toolbar.length,2,label+' active page and troll buttons must be present');
      assert.ok(toolbar.every(x=>x.fold&&x.hit&&x.touch),label+' Samlebok navigation is below the fold');
    }
  }
  console.log(label,Object.entries(result).filter(([k,v])=>v?.controls).map(([k,v])=>[k,Object.values(v.controls).flat().filter(x=>!x.fold||!x.hit).length,v.scrolling.map(x=>x.extra)]),result.routeError||'');
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const engine=process.env.LARIA_FOLD_ENGINE||'chromium';
 assert.ok(['chromium','webkit'].includes(engine));
 const requested=process.env.LARIA_FOLD_FORMATS?.split(',');
 for(const [w,h] of matrix.filter(item=>!requested||requested.includes(item.join('x'))))
   await audit(engine,engine==='webkit'?webkit:chromium,w,h);
})().catch(e=>{console.error(e);process.exitCode=1;});
