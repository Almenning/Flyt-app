'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const stories=require('../laer-litt-mer/fortellingsdalen-stories-v1.js');
const chapters=require('../laer-litt-mer/chapter-expansion-v1.js');
const makeState=()=>({
  profile:{grade:2,avatar:'girl'},
  journey:{nodes:{'norwegian:2:lyder':{attempts:4,passed:true}},gradeWins:{'norwegian:2':{at:99}},viewGrades:{norwegian:2}},
  answerLog:[{questionKey:'legacy-example',at:55}],lastMilestone:{title:'Bokskogen'}
});
function finishCorrect(state,stageId,at=1000){
  const session=chapters.start(state,stageId,at);
  let final;
  session.story.questions.forEach((q,i)=>{final=chapters.answer(state,q.options.indexOf(q.answer),at+i+1)});
  return final;
}

test('the catalog has four old first adventures plus a separate unpublished second Norwegian chapter',()=>{
  assert.equal(chapters.CHAPTER_ID,'fortellingsdalen-2');
  assert.equal(chapters.STORAGE_KEY,'norwegian:2:fortellingsdalen-2');
  assert.deepEqual(chapters.catalogFor('norwegian',2).map(c=>c.id),['bokskogen-1','fortellingsdalen-2']);
  assert.deepEqual(chapters.catalogFor('math',2).map(c=>c.id),['tallenga-1']);
  assert.deepEqual(chapters.catalogFor('norwegian',3),[]);
  assert.equal(chapters.catalogFor('norwegian',2)[1].published,false);
  assert.equal(chapters.STAGES.length,5);
  assert.equal(chapters.STAGES.at(-1).type,'checkpoint');
});

test('all 15 original stories are valid, distinct and limited to their intended learning goal',()=>{
  assert.equal(stories.validate(),true);
  const all=stories.allStories();
  assert.equal(all.length,15);
  assert.equal(new Set(all.map(s=>s.id)).size,15);
  assert.equal(new Set(all.flatMap(s=>s.questions).map(q=>q.id)).size,63);
  const goals={
    brevhytta:new Set(['detail']),
    eventyrbrua:new Set(['sequence']),
    sporstien:new Set(['inference']),
    fortellermolla:new Set(['detail','cause','vocabulary']),
    stjernetoppen:new Set(['detail','sequence','inference','cause'])
  };
  for(const story of all){
    const rules=goals[story.stage];
    assert.ok(rules,story.id+' belongs to an unknown place');
    assert.equal(story.questions.length,story.stage==='stjernetoppen'?5:4);
    assert.ok(story.questions.every(q=>rules.has(q.skill)),story.id+' contains an unrelated question');
    assert.ok(story.questions.every(q=>q.options.filter(o=>o===q.answer).length===1));
    assert.ok(story.passage.length>=80);
  }
});

test('chapter two uses new namespaced records without touching any legacy journey progress',()=>{
  const state=makeState(),before={
    nodes:structuredClone(state.journey.nodes),
    gradeWins:structuredClone(state.journey.gradeWins),
    viewGrades:structuredClone(state.journey.viewGrades),
    answerLog:structuredClone(state.answerLog),
    lastMilestone:structuredClone(state.lastMilestone)
  };
  const progress=chapters.progress(state);
  assert.equal(progress.done,0);
  assert.equal(progress.total,5);
  assert.equal(progress.complete,false);
  assert.ok(state.journey.chapterProgress[chapters.STORAGE_KEY]);
  assert.deepEqual(state.journey.nodes,before.nodes);
  assert.deepEqual(state.journey.gradeWins,before.gradeWins);
  assert.deepEqual(state.journey.viewGrades,before.viewGrades);
  assert.deepEqual(state.answerLog,before.answerLog);
  assert.deepEqual(state.lastMilestone,before.lastMilestone);
});

test('an unfinished story resumes correctly after a full local-storage JSON roundtrip',()=>{
  const state=makeState();
  let started=chapters.start(state,'brevhytta',2000);
  assert.equal(started.index,0);
  const first=started.story.questions[0];
  chapters.answer(state,first.options.indexOf(first.answer),2001);
  const reloaded=JSON.parse(JSON.stringify(state));
  const pending=chapters.resume(reloaded);
  assert.equal(pending.index,1);
  assert.equal(pending.correct,1);
  assert.equal(pending.story.id,started.story.id);
  assert.deepEqual(pending.answers,[first.options.indexOf(first.answer)]);
  assert.equal(chapters.start(reloaded,'brevhytta',3000).story.id,started.story.id);
  for(let i=1;i<pending.story.questions.length;i++){
    const q=pending.story.questions[i];
    chapters.answer(reloaded,q.options.indexOf(q.answer),3000+i);
  }
  assert.equal(chapters.resume(reloaded),null);
  assert.equal(chapters.progress(reloaded).done,1);
  assert.equal(chapters.progress(state).done,0);
});

test('story variants rotate, replay is voluntary and never removes an earlier chapter win',()=>{
  const state=makeState(),seen=[];
  for(let i=0;i<5;i++){
    const result=finishCorrect(state,'sporstien',4000+i*100);
    assert.equal(result.outcome.passed,true);
    seen.push(result.outcome.storyId);
  }
  assert.deepEqual(seen,[stories.BANK.sporstien[0].id,stories.BANK.sporstien[1].id,
    stories.BANK.sporstien[2].id,stories.BANK.sporstien[0].id,stories.BANK.sporstien[1].id]);
  const stage=chapters.progress(state).stages.find(s=>s.id==='sporstien');
  assert.equal(stage.attempts,5);
  assert.equal(stage.best,4);
  assert.equal(stage.passedAt,4004);
});

test('incorrect answers do not falsely mark a place as complete',()=>{
  const state=makeState(),session=chapters.start(state,'eventyrbrua',5000);
  for(const q of session.story.questions){
    const incorrect=q.options.findIndex(o=>o!==q.answer);
    const result=chapters.answer(state,incorrect,5001);
    if(result.finished)assert.equal(result.outcome.passed,false);
  }
  const after=chapters.progress(state);
  assert.equal(after.done,0);
  assert.equal(after.stages.find(s=>s.id==='eventyrbrua').attempts,1);
  assert.equal(after.stages.find(s=>s.id==='eventyrbrua').best,0);
  assert.equal(after.complete,false);
});

test('the chapter is awarded only after all five places, never as completion of grade 2',()=>{
  const state=makeState();
  const before=structuredClone(state.journey.gradeWins);
  for(const stage of chapters.STAGES.slice(0,-1)){
    assert.equal(finishCorrect(state,stage.id,6000).outcome.chapterCompleted,false);
  }
  assert.equal(chapters.progress(state).done,4);
  assert.equal(chapters.progress(state).complete,false);
  const final=finishCorrect(state,'stjernetoppen',8000).outcome;
  assert.equal(final.chapterCompleted,true);
  assert.equal(final.chapterProgress.complete,true);
  assert.equal(final.chapterProgress.done,5);
  assert.ok(final.chapterProgress.completedAt);
  assert.deepEqual(state.journey.gradeWins,before);
  assert.equal(state.gradeCompleted,undefined);
  assert.equal(finishCorrect(state,'brevhytta',9000).outcome.chapterCompleted,false);
  assert.equal(chapters.progress(state).completedAt,8005);
});

test('invalid answers do not advance saved drafts',()=>{
  const state=makeState(),session=chapters.start(state,'brevhytta',9000);
  assert.throws(()=>chapters.answer(state,-1),RangeError);
  assert.throws(()=>chapters.answer(state,88),RangeError);
  assert.throws(()=>chapters.answer(state,1.5),RangeError);
  assert.equal(chapters.resume(state).index,0);
  assert.equal(chapters.resume(state).story.id,session.story.id);
});

test('locked progression and the private flag are independent',()=>{
  const state={journey:{gradeWins:{}}};
  assert.equal(chapters.unlocked(state,chapters.CHAPTER_ID),false);
  assert.equal(chapters.unlocked(state,chapters.CHAPTER_ID,true),true);
  state.journey.gradeWins['norwegian:2']={at:100};
  assert.equal(chapters.unlocked(state,chapters.CHAPTER_ID),true);
  assert.equal(chapters.unlocked(state,'bokskogen-1'),true);
  assert.equal(chapters.previewEnabled('?app=laria&chapter2-preview=1'),true);
  assert.equal(chapters.previewEnabled('?app=laria'),false);
  assert.equal(chapters.previewEnabled('?chapter2-preview=0'),false);
});

test('live integration keeps chapter two behind the explicit developer preview',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../laer-litt-mer/index.html'),'utf8');
  assert.match(html,/window\.LARIA_CHAPTER_EXPANSION\?\.previewEnabled\(location\.search\)/);
  assert.match(html,/chapterProgress:\{\.\.\.\(parsed\.journey\?\.chapterProgress\|\|\{\}\)\}/);
  assert.match(html,/fortellingsdalen-stories-v1\.js/);
  assert.match(html,/chapter-expansion-v1\.js/);
  assert.match(html,/fortellingsdalen-preview-v1\.js/);
  assert.match(html,/document\.body\.appendChild\(preview\)/,
    'developer pilot must live outside landscape-screen clipping');
  assert.equal(html.includes('data-laria-chapter2-preview="visible"'),false);
});
