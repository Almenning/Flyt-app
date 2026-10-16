'use strict';
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');

const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const seed={
  version:7,progressSchemaVersion:3,
  profile:{grade:2,onboarded:true,name:'KapittelQA',avatar:'girl',setupVersion:2},
  mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
  masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
  lastMilestone:null,recentCountryWin:null,lastActivity:null,
  journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null
};

async function run(engine,label){
  const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
  try{
    const context=await browser.newContext({viewport:{width:820,height:1180},hasTouch:true,isMobile:false,reducedMotion:'reduce',serviceWorkers:'block'});
    await context.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed);
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
    await page.route('https://api.worldbank.org/**',r=>r.abort());
    await page.goto(url+'&chapter-completion='+label,{waitUntil:'domcontentloaded'});
    await page.locator('.bc14-subject').first().waitFor({timeout:20000});

    const result=await page.evaluate(()=>{
      const finishSubject=subject=>{
        const model=journeyModel(subject,2);
        for(const node of model.nodes){
          const key=journeyNodeKey(subject,2,node.id);
          if(node.type==='skill')state.journey.nodes[key]={attempts:1,lastAt:Date.now()};
          if(node.type==='checkpoint')state.journey.nodes[key]={passed:true,attempts:1,lastAt:Date.now()};
        }
      };
      const finishGeo=()=>{
        const model=geoJourneyModel(2);
        for(const node of model.nodes){
          const key=journeyNodeKey('geography',2,node.id);
          if(node.type==='geo-skill')state.journey.nodes[key]={attempts:1,lastAt:Date.now()};
          if(node.type==='checkpoint')state.journey.nodes[key]={passed:true,attempts:1,lastAt:Date.now()};
        }
      };
      finishSubject('norwegian');finishSubject('math');finishSubject('english');finishGeo();
      state.journey.gradeWins={};
      saveState();renderAll();

      const progress={
        eyebrow:document.getElementById('grade-round-eyebrow')?.textContent,
        title:document.getElementById('grade-round-title')?.textContent,
        copy:document.getElementById('grade-round-copy')?.textContent,
        pills:document.getElementById('grade-round-subjects')?.innerText,
        historyHidden:document.getElementById('grade-round-history')?.hidden
      };

      openSubject('math');
      const math={
        progress:document.getElementById('subject-progress-label')?.textContent,
        copy:document.getElementById('subject-progress-copy')?.textContent,
        eye:document.getElementById('subject-continue-eyebrow')?.textContent,
        title:document.getElementById('subject-mission-title')?.textContent,
        missionCopy:document.getElementById('subject-mission-copy')?.textContent,
        journeyHeading:document.getElementById('journey-heading-title')?.textContent,
        journeyFinish:document.getElementById('journey-finish')?.innerText,
        hasNextGradeButton:!!document.getElementById('journey-next-grade')
      };

      renderGeographyContinue();showScreen('geography');
      const geography={
        eye:document.getElementById('geography-continue-eyebrow')?.textContent,
        title:document.getElementById('geography-continue-title')?.textContent,
        copy:document.getElementById('geography-continue-copy')?.textContent,
        journeyTitle:document.getElementById('geo-journey-title')?.textContent,
        finish:document.getElementById('geo-journey-finish')?.innerText
      };

      delete state.journey.gradeWins['math:2'];
      sessionScope={type:'journey',subject:'math',journeyNode:'minus100-checkpoint',journeyArea:'minus100',journeyGrade:2,journeyType:'checkpoint',practiceOnly:false};
      const completion={correct:5,total:5,strengthened:0};
      recordJourneySessionResult(completion);
      return {progress,math,geography,completion,milestone:state.lastMilestone};
    });

    assert.equal(result.progress.eyebrow,'Eventyrene dine');
    assert.equal(result.progress.title,'🏆 Første eventyrrunde fullført');
    assert.match(result.progress.copy,/første eventyret i alle fire fag/i);
    assert.match(result.progress.pills,/Bokskogen fullført/);
    assert.match(result.progress.pills,/Tallenga fullført/);
    assert.match(result.progress.pills,/Ordlandsbyen fullført/);
    assert.equal(result.progress.historyHidden,true,label+' grade history must stay hidden from child progress');

    assert.equal(result.math.progress,'Eventyret fullført 🏆');
    assert.match(result.math.copy,/Tallenga er fullført/);
    assert.equal(result.math.eye,'Eventyret er fullført');
    assert.equal(result.math.title,'🏆 Tallenga fullført');
    assert.doesNotMatch(result.math.missionCopy,/klasse|trinnet/i);
    assert.equal(result.math.journeyHeading,'Eventyret ditt');
    assert.match(result.math.journeyFinish,/Tallenga er fullført/);
    assert.equal(result.math.hasNextGradeButton,false,label+' completed adventure must not promote next school grade');
    assert.doesNotMatch(result.math.journeyFinish,/klasse|trinn|kjerneløp/i);

    assert.equal(result.geography.eye,'Eventyret er fullført');
    assert.equal(result.geography.title,'🏆 Nordlysleiren fullført');
    assert.equal(result.geography.journeyTitle,'Nordlysleiren er fullført');
    assert.match(result.geography.finish,/Nordlysleiren er fullført/);
    assert.doesNotMatch(JSON.stringify(result.geography),/klasse fullført|trinnet er rundet|ekspedisjonen er rundet/i);

    assert.equal(result.completion.gradeCompleted,undefined,label+' legacy gradeCompleted must not be emitted');
    assert.equal(result.completion.journeyCompleted?.title,'Tallenga');
    assert.equal(result.completion.journeyCompleted?.chapter,1);
    assert.match(result.milestone?.title||'',/Tallenga fullført/);
    assert.doesNotMatch(JSON.stringify(result),/2\. klasse fullført|trinnet fullført|rundet kjerneløpet/i);
    assert.deepEqual(errors,[],label+' javascript errors');
    await context.close();
    console.log('PASS chapter completion semantics',label);
  }finally{await browser.close()}
}

(async()=>{await run(chromium,'chromium');await run(webkit,'webkit')})()
  .catch(error=>{console.error(error);process.exitCode=1});
