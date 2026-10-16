'use strict';
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');

const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const seed={
  version:7,progressSchemaVersion:3,
  profile:{grade:2,onboarded:true,name:'NordlysQA',avatar:'girl',setupVersion:2},
  mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
  masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
  lastMilestone:null,recentCountryWin:null,lastActivity:null,
  journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null
};

async function run(engine,label){
  const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
  try{
    const context=await browser.newContext({
      viewport:{width:820,height:1180},
      hasTouch:true,
      isMobile:false,
      reducedMotion:'reduce',
      serviceWorkers:'block'
    });
    await context.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed);
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
    await page.route('https://api.worldbank.org/**',r=>r.abort());
    await page.goto(url+'&nordlys-system='+label,{waitUntil:'domcontentloaded'});
    await page.locator('.bc14-subject[data-camp="subject-geography"]').waitFor({timeout:20000});

    const report=await page.evaluate(()=>{
      const model=geoJourneyModel(2);
      const stage=window.LARIA_LOCKED_JOURNEYS.build('geography',model,()=>'new',null);
      const core=model.nodes.filter(n=>['geo-skill','checkpoint'].includes(n.type));
      return {
        installed:window.__LARIA_GEOGRAPHY_JOURNEY_SYSTEM_INSTALLED===true,
        chapter:window.LARIA_GEOGRAPHY_JOURNEY_SYSTEM?.chapterFor?.(2)?.id,
        grade3Decorated:!!geoJourneyModel(3).learningPlaces,
        places:stage.places.map(place=>({
          title:place.title,
          role:place.role?.adventurePrompt||null,
          core:place.nodes.filter(n=>['geo-skill','checkpoint'].includes(n.type)).map(n=>n.id)
        })),
        core:core.map(node=>{
          const qs=buildGeoJourneyQuestions(node,false);
          return {
            id:node.id,
            geoType:node.geoType||null,
            learning:node.learning||null,
            count:qs.length,
            types:qs.map(q=>q.type),
            objectives:qs.map(q=>q.learning?.objectiveId||null)
          };
        })
      };
    });

    assert.equal(report.installed,true,label+' geography layer did not install');
    assert.equal(report.chapter,'nordlysleiren-1');
    assert.equal(report.grade3Decorated,false,label+' geography pilot leaked into grade 3');
    assert.deepEqual(report.places.map(p=>p.title),
      ['Basecamp','Kartkroken','Utforskertårnet','Naturstien','Observatoriet']);
    assert.deepEqual(report.places.map(p=>p.core),[
      ['norden-flag'],
      ['norden-map'],
      ['norden-capital','norden-checkpoint'],
      ['naboer-flag','naboer-continent','naboer-map'],
      ['naboer-checkpoint']
    ]);
    assert(report.places.every(p=>p.role),label+' missing Nordlysleiren place role');

    for(const node of report.core){
      assert(node.learning,label+' '+node.id+' missing geography learning contract');
      assert.equal(node.count,5,label+' '+node.id+' needs five candidates');
      assert(node.objectives.every(x=>x===node.learning.objectiveId),
        label+' '+node.id+' mixed objectives');
      if(node.geoType){
        assert.deepEqual([...new Set(node.types)],[node.geoType],
          label+' '+node.id+' leaked another geography type');
      }
    }

    const launch=await page.evaluate(()=>{
      startGeoJourneyNode('norden-capital',2);
      return {
        count:sessionQuestions.length,
        types:sessionQuestions.map(q=>q.type),
        objectives:sessionQuestions.map(q=>q.learning?.objectiveId||null),
        scope:{...sessionScope}
      };
    });
    assert.equal(launch.count,5);
    assert.deepEqual([...new Set(launch.types)],['capital'],
      label+' Nordic capitals mission mixed geography representations');
    assert.deepEqual([...new Set(launch.objectives)],['geography-g2-nordic-capitals']);
    assert.equal(launch.scope.journeyNode,'norden-capital');

    await page.locator('#close-session').click();
    await page.locator('#geography-screen.active').waitFor({timeout:10000});
    const map=page.locator('#geography-screen.active .locked-journey-map[data-journey-subject="geography"]');
    await map.waitFor({timeout:14000});
    await map.locator('[data-locked-place="1"]').click();
    const sheet=page.locator('.locked-journey-overlay:not([hidden]) .locked-journey-sheet.is-mission');
    await sheet.waitFor({timeout:8000});
    assert.equal((await sheet.locator('h2').innerText()).trim(),'Kartkroken');
    assert.match(await sheet.locator('.mission-head-copy p').innerText(),/kartet/i);
    assert.equal(await sheet.locator('[data-locked-node="norden-map"]').count(),1,
      label+' Kartkroken does not expose the map mission');

    assert.deepEqual(errors,[],label+' JavaScript errors');
    await context.close();
    console.log('PASS systematic Nordlysleiren',label);
  }finally{await browser.close()}
}

(async()=>{
  await run(chromium,'chromium');
  await run(webkit,'webkit');
})().catch(error=>{console.error(error);process.exitCode=1});
