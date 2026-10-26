'use strict';
/* Kinnaklova English curriculum contract: protect every grade from silent
   fallback caused by malformed answers or too few questions. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','laer-litt-mer','index.html'),'utf8');
const start=html.indexOf('function englishPool(');
const end=html.indexOf('\nfunction makeEnglishBuild(',start);
assert.ok(start>=0&&end>start,'English pool source missing from app');
const source=html.slice(start,end);
const englishPool=new Function('choiceQuestion','makeEnglishBuild','shuffle','CURRICULUM',
  source+'\nreturn englishPool;')(
  (subject,skill,prompt,answer,options,extra={})=>({
    subject,skill,prompt,answer,options,type:'learning-choice',...extra
  }),
  (answer,visual)=>({
    subject:'english',skill:'spelling',type:'build-word',answer,visual,
    letters:String(answer).split('').map((l,id)=>({l,id}))
  }),
  arr=>arr,
  {english:'ENG01-06'}
);
const modules={
  words:new Set(['words','numbers','vocabulary','spelling']),
  sentences:new Set(['sentence','phrases']),
  reading:new Set(['reading'])
};
function signature(q){return [q.type,q.skill,q.prompt,q.answer,q.passage||''].join('|')}
for(let grade=1;grade<=10;grade++){
  for(const [module,allowed] of Object.entries(modules)){
    test('Kinnaklova '+grade+'. klasse: '+module+' has five distinct valid activities',()=>{
      const questions=englishPool(grade,module);
      assert.ok(questions.length>=5,
        'Not enough '+module+' questions in grade '+grade+'; mixed fallback would mislabel activities');
      const seen=new Set();
      for(const q of questions){
        assert.equal(q.subject,'english');
        assert.ok(allowed.has(q.skill),
          'Unrelated '+q.skill+' item in '+module+', grade '+grade);
        const sig=signature(q);
        assert.ok(!seen.has(sig),'Repeated identical item '+sig);
        seen.add(sig);
        assert.ok(typeof q.prompt==='string'&&q.prompt.length>4);
        if(q.type==='learning-choice'){
          assert.ok(Array.isArray(q.options)&&q.options.length>=2);
          assert.ok(q.options.map(String).includes(String(q.answer)),
            'Correct answer missing from '+q.prompt+' in grade '+grade);
          assert.equal(new Set(q.options.map(String)).size,q.options.length,
            'Duplicate answer alternatives in '+q.prompt);
        }else if(q.type==='sentence-order'){
          assert.ok(Array.isArray(q.words)&&q.words.length>=2);
          assert.equal(q.words.join(' '),q.answer,
            'Sentence builder input cannot form expected answer');
        }else if(q.type==='build-word'){
          assert.equal(q.letters.length,q.answer.length);
        }else assert.fail('Unsupported English question '+q.type);
        if(module==='reading'){
          assert.equal(q.skill,'reading');
          assert.ok(typeof q.passage==='string'&&q.passage.trim().length>12,
            'Reading must have text to read, grade '+grade);
        }
      }
    });
  }
}
test('Kinnaklova first readers are short and developmentally accessible',()=>{
  const stories=englishPool(1,'reading');
  assert.ok(stories.length>=8);
  assert.ok(stories.every(q=>q.passage.trim().split(/\s+/).length<=17),
    'First-grade Reading uses a story that is too long for this activity');
});
