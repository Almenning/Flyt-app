'use strict';
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');

const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const baseSeed={
  version:7,progressSchemaVersion:3,
  profile:{grade:2,onboarded:true,name:'EventyrQA',avatar:'girl',setupVersion:2},
  mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
  masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
  lastMilestone:null,recentCountryWin:null,lastActivity:null,
  journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null
};
const expected={math:'Tallenga',geography:'Nordlysleiren'};

async function completeFinalJourneyNode(page,subject){
  return page.evaluate(subject=>{
    const grade=2,geo=subject==='geography';
    const model=geo?geoJourneyModel(grade):journeyModel(subject,grade);
    const required=model.nodes.filter(n=>geo
      ?(n.type==='geo-skill'||n.type==='checkpoint')
      :(n.type==='skill'||n.type==='checkpoint'));
    const checkpoints=required.filter(n=>n.type==='checkpoint');
    const final=checkpoints[checkpoints.length-1]||required[required.length-1];
    if(!final)throw Error('No final core journey node for '+subject);

    const now=Date.now()-1000;
    for(const node of required){
      if(node.id===final.id)continue;
      const key=journeyNodeKey(subject,grade,node.id);
      state.journey.nodes[key]={
        passed:node.type==='checkpoint',
        attempts:1,
        best:5,
        lastAt:now,
        passedAt:node.type==='checkpoint'?now:null
      };
    }
    saveState();

    if(geo)startGeoJourneyNode(final.id,grade);
    else startJourneyNode(subject,final.id,grade);
    if(!sessionQuestions.length)throw Error('Final mission did not start for '+subject);

    sessionCorrect=sessionQuestions.length;
    sessionStrengthened=new Set();
    finishSession();

    const last=state.sessionLog.at(-1);
    return {
      finalId:final.id,
      total:sessionQuestions.length,
      gradeWin:!!state.journey.gradeWins[subject+':'+grade],
      gradeCompleted:last?.gradeCompleted||null,
      adventureCompleted:last?.adventureCompleted||null,
      milestone:state.lastMilestone||null
    };
  },subject);
}

async function runCase(engine,label,subject){
  const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
  try{
    const context=await browser.newContext({
      viewport:subject==='math'?{width:390,height:844}:{width:820,height:1180},
      isMobile:subject==='math',
      hasTouch:true,
      reducedMotion:'reduce',
      serviceWorkers:'block'
    });
    await context.addInitScript(seed=>localStorage.setItem('laerlittmer-v2',JSON.stringify(seed)),baseSeed);
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
    await page.route('https://api.worldbank.org/**',r=>r.abort());
    await page.goto(url+'&adventure-completion='+label+'-'+subject,{waitUntil:'domcontentloaded'});
    await page.locator('.bc14-subject[data-camp="subject-math"]').waitFor({timeout:20000});

    const result=await completeFinalJourneyNode(page,subject);
    const adventure=expected[subject];

    await page.locator('#complete-screen.active').waitFor({timeout:12000});
    const ui=await page.evaluate(()=>({
      copy:document.getElementById('complete-copy')?.textContent||'',
      rewardTitle:document.getElementById('young-reward-title')?.textContent||'',
      rewardCopy:document.getElementById('young-reward-copy')?.textContent||'',
      next:document.getElementById('complete-next')?.textContent||'',
      progressCard:document.getElementById('grade-round-card')?.innerText||'',
      historyHidden:document.getElementById('grade-round-history')?.hidden===true,
      historyTitleHidden:document.getElementById('grade-round-history-title')?.hidden===true,
      parentGradeExists:!!document.querySelector('#adult-grade option[value="2"]')
    }));

    assert.equal(result.gradeWin,true,label+' '+subject+' lost legacy gradeWins compatibility');
    assert.equal(result.gradeCompleted?.grade,2,label+' '+subject+' lost gradeCompleted compatibility');
    assert.equal(result.gradeCompleted?.subject,subject,label+' '+subject+' gradeCompleted subject drift');
    assert.equal(result.adventureCompleted?.name,adventure,label+' '+subject+' missing adventure completion');
    assert.equal(result.adventureCompleted?.grade,2,label+' '+subject+' adventure completion grade metadata drift');
    assert.match(result.milestone?.title||'',new RegExp(adventure),label+' '+subject+' milestone lacks adventure name');

    assert.match(ui.copy,new RegExp(adventure),label+' '+subject+' completion copy lacks adventure name');
    assert.match(ui.rewardTitle,new RegExp(adventure),label+' '+subject+' reward title lacks adventure name');
    assert.match(ui.rewardCopy,/eventyret/i,label+' '+subject+' reward copy lacks adventure semantics');
    assert.match(ui.next,/Eventyret er fullført/i,label+' '+subject+' next copy lacks adventure semantics');

    const childCompletion=[ui.copy,ui.rewardTitle,ui.rewardCopy,ui.next,ui.progressCard].join(' | ');
    assert.doesNotMatch(childCompletion,/2\. klasse|trinnet er rundet|trinnet er fullført|alle verdener på trinnet|kjerneløp/i,
      label+' '+subject+' still tells the child a school grade was completed: '+childCompletion);
    assert.equal(ui.historyHidden,true,label+' child grade history is visible');
    assert.equal(ui.historyTitleHidden,true,label+' child grade-history title is visible');
    assert.equal(ui.parentGradeExists,true,label+' parent grade setting disappeared');
    assert.match(ui.progressCard,/Fire første eventyr/i,label+' progress card lost adventure framing');

    await page.locator('#complete-home').click();
    if(subject==='math'){
      await page.locator('#subject-screen.active').waitFor({timeout:10000});
      assert.match((await page.locator('#subject-continue-eyebrow').innerText()).trim(),/^eventyret er rundet$/i);
      assert.match(await page.locator('#subject-mission-title').innerText(),/Tallenga fullført/i);
    }else{
      await page.locator('#geography-screen.active').waitFor({timeout:10000});
      assert.match((await page.locator('#geography-continue-eyebrow').innerText()).trim(),/^eventyret er rundet$/i);
      assert.match(await page.locator('#geography-continue-title').innerText(),/Nordlysleiren fullført/i);
    }

    assert.deepEqual(errors,[],label+' '+subject+' JavaScript errors');
    await context.close();
    console.log('PASS adventure completion language',label,subject,result.finalId);
  }finally{await browser.close()}
}

(async()=>{
  await runCase(chromium,'chromium-iphone','math');
  await runCase(webkit,'webkit-ipad','geography');
})().catch(error=>{console.error(error);process.exitCode=1});
