'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const vm=require('node:vm');

const root=path.join(__dirname,'..','laer-litt-mer');
const runtime={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'commercial-content-v18.js'),'utf8'),runtime);
const bank=runtime.window.LARIA_COMMERCIAL_CONTENT_V18;
const app=fs.readFileSync(path.join(root,'index.html'),'utf8');
const feedback=vm.runInNewContext('('+app.slice(
  app.indexOf('function learningFeedbackText('),app.indexOf('function answerLearningChoice(')).trim()+')');
const speech=vm.runInNewContext('('+app.slice(
  app.indexOf('function speechSegmentsForQuestion('),app.indexOf('\n}',app.indexOf('function speechSegmentsForQuestion('))+2)+')',
  {currentGrade:()=>2});
const authored=(subject,grade,module)=>bank[subject](grade,module).filter(q=>q.learningFeedback);

test('Four original Lesekroken stories teach retrieval and inference in both written languages',()=>{
  const items=authored('norwegian',2,'reading');
  assert.equal(items.length,4);
  assert.deepEqual(Array.from(items,q=>q.passageLang),['nb','nb','nn','nn']);
  for(const lang of ['nb','nn']){
    const skills=items.filter(q=>q.passageLang===lang).map(q=>q.skill);
    assert.deepEqual(Array.from(skills),['reading-comprehension','reading-inference']);
  }
  assert.equal(new Set(items.map(q=>q.passage)).size,4);
  assert.equal(authored('norwegian',2,'spelling').length,0);
});

test('New Sentences turns require using context; dialogue and choices are read in English',()=>{
  const items=authored('english',2,'sentences');
  assert.equal(items.length,4);
  assert.ok(items.every(q=>q.skill==='phrases'&&q.passageLang==='en'));
  for(const q of items){
    const segments=speech(q);
    assert.equal(segments[0].text,q.passage);
    assert.equal(segments[1].text,q.prompt);
    assert.ok(segments.every(segment=>segment.lang==='en-GB'));
  }
  assert.equal(authored('english',2,'reading').length,0);
});

test('Grade 2 authored choices have one correct option and explicit correction and teaching copy',()=>{
  for(const [subject,module] of [['norwegian','reading'],['english','sentences']]){
    assert.equal(authored(subject,1,module).length,0);
    assert.equal(authored(subject,3,module).length,0);
    const items=authored(subject,2,module);
    assert.deepEqual(Array.from(new Set(items.map(q=>q.options.indexOf(q.answer)))).sort(),[0,1,2],
      'The correct answer must not always appear in the same position.');
    for(const q of items){
      assert.equal(q.options.length,3);
      assert.equal(new Set(q.options).size,3);
      assert.equal(q.options.filter(o=>o===q.answer).length,1);
      assert.notEqual(feedback(q,true),feedback(q,false));
      assert.equal(feedback(q,true),q.learningFeedback.correct);
      assert.equal(feedback(q,false),q.learningFeedback.retry);
    }
  }
  assert.equal(feedback({subject:'english',englishWord:'sea',norwegianMeaning:'hav'},true),'sea betyr hav.');
  assert.equal(feedback({subject:'norwegian',passage:'Gammal tekst'},true),'Bra! Denne satt.');
});
