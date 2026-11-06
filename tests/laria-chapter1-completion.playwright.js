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
  journey:{nodes:{},gradeWins:{},viewGrades:{}},
  answerLog:[],sessionLog:[],activeSession:null
};

async function run(engine,label){
  const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
  try{
    const context=await browser.newContext({
      viewport:{width:820,height:1180},hasTouch:true,isMobile:false,
      reducedMotion:'reduce',serviceWorkers:'block'
    });
    await context.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed);
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
    await page.route('https://api.worldbank.org/**',r=>r.abort());
    await page.goto(url+'&chapter1-completion='+label,{waitUntil:'domcontentloaded'});
    await page.locator('.bc14-subject[data-camp="subject-math"]').waitFor({timeout:20000});

    const setup=await page.evaluate(()=>{
      ensureJourneyState();
      const stamp={attempts:1,best:5,passed:true,lastAt:Date.now(),passedAt:Date.now()};
      for(const subject of ['norwegian','math','english']){
        const model=journeyModel(subject,2);
        for(const node of model.nodes){
          if(node.type==='skill'||node.type==='checkpoint'){
            state.journey.nodes[journeyNodeKey(subject,2,node.id)]={...stamp};
          }
        }
      }
      const geo=geoJourneyModel(2);
      for(const node of geo.nodes){
        if(node.type==='geo-skill'||node.type==='checkpoint'){
          state.journey.nodes[journeyNodeKey('geography',2,node.id)]={...stamp};
        }
      }
      state.journey.gradeWins={};
      saveState();
      renderAll();
      return {
        overview:gradeJourneyOverview(2),
        titles:{
          math:journeyChapterInfo('math',2)?.title,
          norwegian:journeyChapterInfo('norwegian',2)?.title,
          english:journeyChapterInfo('english',2)?.title,
          geography:journeyChapterInfo('geography',2)?.title
        }
      };
    });
    assert.equal(setup.overview.complete,true,label+' four first adventures were not complete');
    assert.deepEqual(setup.titles,{
      math:'Tallvika',norwegian:'Bokskogen',english:'Ordlandsbyen',geography:'Nordlysleiren'
    });

    await page.evaluate(()=>setTab('progress'));
    await page.locator('#progress-screen.active').waitFor({timeout:10000});
    const progressText=await page.locator('#grade-round-card').innerText();
    assert.match(progressText,/Fire første eventyr fullført/);
    assert.match((await page.locator('#grade-round-score').innerText()).trim(),/^4\/4$/);
    assert.equal(await page.locator('#grade-round-history').isVisible(),false,label+' child progress must not show a grade-by-grade scoreboard');
    assert.doesNotMatch(progressText,/2\. klasse rundet|kjerneløp/i,
      label+' Progress card still presents chapter 1 as completed grade 2');

    await page.evaluate(()=>openSubject('math'));
    const tv=page.locator('#subject-screen.active #tallvika-world');
    await tv.waitFor({state:'visible',timeout:12000});
    const chapter=await page.evaluate(()=>({complete:journeyProgress('math',2).complete,grade:currentGrade(),title:journeyChapterInfo('math',2)?.title}));
    assert.equal(chapter.complete,true,label+' Math chapter incomplete');
    assert.equal(chapter.grade,2,label+' profile grade changed');
    assert.equal(chapter.title,'Tallvika');
    assert.match(await tv.locator('.tv-next-sign[data-tv="next"]').innerText(),/Bonusoppdrag/,label+' the illustrated Next adventure sign must offer voluntary replay');

    await page.evaluate(()=>{renderGeographyContinue();showScreen('geography')});
    await page.locator('#geography-screen.active').waitFor({timeout:10000});
    assert.match((await page.locator('#geography-continue-eyebrow').innerText()).trim(),/^Første eventyr rundet$/i);
    assert.match(await page.locator('#geography-continue-title').innerText(),/Nordlysleiren fullført/);
    assert.doesNotMatch(await page.locator('#geography-continue-title').innerText(),/2\. klasse fullført/i);

    const geoMap=page.locator('#geography-screen.active .locked-journey-map[data-journey-subject="geography"]');
    await geoMap.waitFor({timeout:14000});
    await geoMap.locator('[data-locked-place="4"]').click();
    const geoSheet=page.locator('.locked-journey-overlay:not([hidden]) .locked-journey-sheet.is-mission');
    await geoSheet.waitFor({timeout:8000});
    const geoSheetText=await geoSheet.innerText();
    assert.match(geoSheetText,/Første eventyr er fullført!/);
    assert.doesNotMatch(geoSheetText,/Hele reisen er fullført!/);
    await geoSheet.locator('.locked-sheet-close').click();

    await page.evaluate(()=>{
      state.journey.gradeWins={};
      const node=journeyModel('math',2).nodes.find(n=>n.id==='minus100-checkpoint');
      sessionScope={
        type:'journey',subject:'math',journeyNode:node.id,journeyArea:node.areaId,
        journeyGrade:2,journeyType:node.type,module:node.module||null,
        label:'Matte · '+node.title,practiceOnly:false
      };
      sessionQuestions=buildJourneyQuestions('math',node,true).slice(0,5);
      qIndex=sessionQuestions.length-1;
      sessionCorrect=sessionQuestions.length;
      sessionStrengthened=new Set();
      currentAnswered={selected:'qa',correct:true};
      state.activeSession={startedAt:Date.now()-1000};
      finishSession();
    });
    await page.locator('#complete-screen.active').waitFor({timeout:10000});
    const completeText=await page.locator('#complete-screen').innerText();
    assert.match(completeText,/Du har fullført det første eventyret i Tallvika!/);
    assert.match(completeText,/Tallvika · første eventyr fullført!/);
    assert.match(completeText,/Første eventyr er ferdig/);
    assert.doesNotMatch(completeText,/2\. klasse (?:er )?(?:rundet|fullført)|hele 2\. klasse|Alle verdener på trinnet/i,
      label+' completion screen still claims the grade is complete');

    assert.deepEqual(errors,[],label+' JavaScript errors');
    await context.close();
    console.log('PASS chapter-one completion semantics',label);
  }finally{
    await browser.close();
  }
}

(async()=>{
  await run(chromium,'chromium');
  await run(webkit,'webkit');
})().catch(error=>{console.error(error);process.exitCode=1});
