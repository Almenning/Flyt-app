'use strict';
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');

const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const seed={
  version:7,progressSchemaVersion:3,
  profile:{grade:2,onboarded:true,name:'TallengaQA',avatar:'girl',setupVersion:2},
  mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
  masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
  lastMilestone:null,recentCountryWin:null,lastActivity:null,
  journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null
};

async function run(engine,label){
  const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
  try{
    const context=await browser.newContext({viewport:{width:820,height:1180},hasTouch:true,
      isMobile:false,reducedMotion:'reduce',serviceWorkers:'block'});
    await context.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed);
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
    await page.route('https://api.worldbank.org/**',r=>r.abort());
    await page.goto(url+'&tallenga-system='+label,{waitUntil:'domcontentloaded'});
    await page.locator('.bc14-subject[data-camp="subject-math"]').waitFor({timeout:20000});

    const report=await page.evaluate(()=>{
      const system=window.LARIA_JOURNEY_LEARNING_SYSTEM;
      const model=journeyModel('math',2);
      const core=model.nodes.filter(n=>['skill','checkpoint'].includes(n.type));
      return {
        installed:window.__LARIA_JOURNEY_LEARNING_SYSTEM_INSTALLED===true,
        chapter:system?.chapterFor?.('math',2)?.id,
        core:core.map(node=>{
          const questions=buildJourneyQuestions('math',node,false);
          return {
            id:node.id,type:node.type,
            learning:node.learning||null,
            count:questions.length,
            skills:questions.map(q=>q.skill),
            objectives:questions.map(q=>q.learning?.objectiveId||null),
            difficulties:questions.map(q=>q.learning?.difficulty||null)
          };
        }),
        grade3Decorated:journeyModel('math',3).nodes.some(n=>n.learning),
        places:window.LARIA_LOCKED_JOURNEYS.build('math',model,()=>'new','plassverdi').places.map(place=>({
          title:place.title,
          role:place.role?.adventurePrompt||null,
          ids:place.nodes.map(n=>n.id),
          core:place.nodes.filter(n=>['skill','checkpoint'].includes(n.type)).map(n=>n.id)
        }))
      };
    });
    assert.equal(report.installed,true,label+' systematic layer did not install');
    assert.equal(report.chapter,'tallenga-1',label+' wrong chapter contract');
    assert.equal(report.grade3Decorated,false,label+' pilot leaked into grade 3');
    assert(report.core.length>=7,label+' expected existing Tallenga core nodes');
    assert.deepEqual(report.places.map(p=>p.title),
      ['Tallverkstedet','Formfabrikken','Brøklaben','Målebroen','Problemtårnet']);
    assert.deepEqual(report.places[0].core,['plassverdi'],label+' Tallverkstedet has wrong role');
    assert.deepEqual(report.places[1].core,['rekkefolge','tall100-checkpoint'],label+' Formfabrikken has wrong role');
    assert.deepEqual(report.places[2].core,[],label+' Brøklaben must stay free exploration');
    assert.deepEqual(report.places[3].core,['addisjon100','pluss100-checkpoint','sub100'],label+' Målebroen has wrong role');
    assert.deepEqual(report.places[4].core,['minus100-checkpoint'],label+' Problemtårnet has wrong role');
    assert.match(report.places[2].role,/brøker/i,label+' Brøklaben missing child-facing role');
    for(const node of report.core){
      assert(node.learning,label+' '+node.id+' missing learning contract');
      assert.equal(node.count,5,label+' '+node.id+' builder should keep a five-question candidate set');
      assert(node.skills.every(skill=>node.learning.allowedSkills.includes(skill)),
        label+' '+node.id+' leaked unrelated skill: '+node.skills.join(', '));
      assert(node.objectives.every(id=>id===node.learning.objectiveId),
        label+' '+node.id+' mixed learning objectives inside one mission');
    }

    await page.locator('.bc14-subject[data-camp="subject-math"]').click();
    const tv=page.locator('#subject-screen.active #tallvika-world');
    await tv.waitFor({state:'visible',timeout:16000});
    assert.equal(await tv.locator('.tv-sign').count(),3,label+' Math activity signs missing');
    const before=await page.evaluate(()=>JSON.stringify(state.journey.nodes));
    await tv.locator('[data-tv="fraction"]:visible').first().click();
    await page.locator('#fraction-lab-screen.active .fr6-workshop').waitFor({timeout:12000});
    assert.equal(await page.locator('.fr2-home-card').count(),0,label+' Brøklab must be free');
    await page.locator('#fraction-lab-back').click();
    await tv.waitFor({state:'visible',timeout:12000});
    assert.equal(await page.evaluate(()=>JSON.stringify(state.journey.nodes)),before,label+' Brøklab changed progress');

    const launch=await page.evaluate(()=>{
      startJourneyNode('math','addisjon100',2);
      return {
        count:sessionQuestions.length,
        skills:sessionQuestions.map(q=>q.skill),
        objectives:sessionQuestions.map(q=>q.learning?.objectiveId||null),
        scope:{...sessionScope}
      };
    });
    assert.equal(launch.count,4,label+' ordinary Tallenga mission must contain four questions');
    assert.deepEqual([...new Set(launch.skills)],['addition-100'],label+' addition mission mixed skills');
    assert.deepEqual([...new Set(launch.objectives)],['math-g2-addition-100'],label+' addition mission mixed objectives');
    assert.equal(launch.scope.journeyNode,'addisjon100');

    const variety=await page.evaluate(()=>{
      const node=journeyModel('math',2).nodes.find(n=>n.id==='addisjon100');
      const signatures=new Set(),families=new Set();
      for(let i=0;i<6;i++){
        for(const q of buildJourneyQuestions('math',node,true)){
          signatures.add(questionIdentity(q));
          if(q.learning?.family)families.add(q.learning.family);
        }
      }
      return {signatures:signatures.size,families:[...families]};
    });
    assert(variety.signatures>=10,label+' repeated visits do not vary enough');
    assert(variety.families.length>=3,label+' addition lacks representation variety');

    const languages=await page.evaluate(()=>{
      const inspect=subject=>{
        const model=journeyModel(subject,2);
        const stage=window.LARIA_LOCKED_JOURNEYS.build(subject,model,()=>'new',null);
        return {
          chapter:window.LARIA_JOURNEY_LEARNING_SYSTEM.chapterFor(subject,2)?.id,
          places:stage.places.map(place=>({
            title:place.title,
            role:place.role?.adventurePrompt||null,
            core:place.nodes.filter(n=>['skill','checkpoint'].includes(n.type)).map(n=>n.id)
          })),
          core:model.nodes.filter(n=>['skill','checkpoint'].includes(n.type)).map(node=>{
            const questions=buildJourneyQuestions(subject,node,false);
            return {
              id:node.id,
              count:questions.length,
              skills:questions.map(q=>q.skill),
              allowed:node.learning?.allowedSkills||[],
              objectives:questions.map(q=>q.learning?.objectiveId||null),
              objective:node.learning?.objectiveId||null
            };
          })
        };
      };
      return {norwegian:inspect('norwegian'),english:inspect('english')};
    });

    assert.equal(languages.norwegian.chapter,'bokskogen-1');
    assert.deepEqual(languages.norwegian.places.map(p=>p.title),
      ['Leselyset','Ordverkstedet','Historiehytta','Setningsbroen','Fortellingstårnet']);
    assert.deepEqual(languages.norwegian.places.map(p=>p.core),[
      ['lyder'],
      ['ordbilder','ordlek','ordstart-checkpoint'],
      ['setningsrekkefolge','ordbetydning','setninger-checkpoint'],
      ['detaljer','forsta'],
      ['tenkvidere','lesedetektiv-checkpoint']
    ]);
    assert(languages.norwegian.places.every(p=>p.role),label+' Bokskogen place role missing');

    assert.equal(languages.english.chapter,'ordlandsbyen-1');
    assert.deepEqual(languages.english.places.map(p=>p.title),
      ['Startplassen','Ordhandelen','Grammatikkhuset','Snakkekaféen','Fortellingsslottet']);
    assert.deepEqual(languages.english.places.map(p=>p.core),[
      ['words'],
      ['numbers','firstwords-checkpoint'],
      ['phrases'],
      ['sentences','talk-checkpoint'],
      ['reading','read-checkpoint']
    ]);
    assert(languages.english.places.every(p=>p.role),label+' Ordlandsbyen place role missing');

    for(const [subject,data] of Object.entries(languages)){
      for(const node of data.core){
        assert.equal(node.count,5,label+' '+subject+' '+node.id+' needs five unique candidates');
        assert(node.skills.every(skill=>node.allowed.includes(skill)),
          label+' '+subject+' '+node.id+' leaked skill '+node.skills.join(', '));
        assert(node.objectives.every(id=>id===node.objective),
          label+' '+subject+' '+node.id+' mixed learning objectives');
      }
    }

    const norwegianLaunch=await page.evaluate(()=>{
      startJourneyNode('norwegian','lyder',2);
      return {
        count:sessionQuestions.length,
        skills:sessionQuestions.map(q=>q.skill),
        objectives:sessionQuestions.map(q=>q.learning?.objectiveId||null)
      };
    });
    assert.equal(norwegianLaunch.count,4,label+' Bokskogen skill mission must contain four questions');
    assert(norwegianLaunch.skills.every(s=>['letter-sound','missing-letter'].includes(s)));
    assert.deepEqual(new Set(norwegianLaunch.skills),new Set(['letter-sound','missing-letter']));
    assert.deepEqual([...new Set(norwegianLaunch.objectives)],['norwegian-g2-letter-sound']);

    const englishLaunch=await page.evaluate(()=>{
      startJourneyNode('english','words',2);
      return {
        count:sessionQuestions.length,
        skills:sessionQuestions.map(q=>q.skill),
        objectives:sessionQuestions.map(q=>q.learning?.objectiveId||null)
      };
    });
    assert.equal(englishLaunch.count,4,label+' Ordlandsbyen skill mission must contain four questions');
    assert(englishLaunch.skills.every(s=>['words','spelling'].includes(s)));
    assert.deepEqual(new Set(englishLaunch.skills),new Set(['words','spelling']));
    assert.deepEqual([...new Set(englishLaunch.objectives)],['english-g2-first-words']);

    assert.deepEqual(errors,[],label+' javascript errors');
    await context.close();
    console.log('PASS systematic grade-2 journeys',label,'math+norsk+english');
  }finally{await browser.close()}
}

(async()=>{
  await run(chromium,'chromium');
  await run(webkit,'webkit');
})().catch(error=>{console.error(error);process.exitCode=1});
