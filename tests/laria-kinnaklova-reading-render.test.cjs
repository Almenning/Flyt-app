'use strict';
/* Verify the actual Reading renderer, not just static markup patterns.
 * No browser needed: a minimal DOM adapter captures the produced HTML. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'..','laer-litt-mer','index.html'),'utf8');
const begin=html.indexOf('function renderLearningQuestion(){');
const end=html.indexOf('\nconst geographyRenderQuestion=renderQuestion;',begin);
assert.ok(begin>=0&&end>begin,'The live learning renderer must exist');
const source=html.slice(begin,end);
const createRenderer=new Function(
  'document','sessionQuestions','qIndex','sessionScope','currentAnswered',
  'currentGrade','GRADE_CONFIG','readAloudButton','escapeAttr','nextQuestion','bindReadAloud',
  source+'\nreturn renderLearningQuestion;'
);
function render(q,scope){
  const nodes={
    'session-progress-bar':{style:{}},
    'session-count':{textContent:''},
    'question-wrap':{innerHTML:''},
    'next-question':{onclick:null}
  };
  const document={
    getElementById(id){
      assert.ok(nodes[id],'Unexpected required DOM element '+id);
      return nodes[id];
    },
    querySelectorAll(selector){
      assert.equal(selector,'.answer');
      return [];
    }
  };
  const escapeAttr=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;')
    .replaceAll('<','&lt;').replaceAll('>','&gt;');
  const run=createRenderer(document,[q],0,scope,null,()=>2,{2:{label:'2. klasse'}},
    ()=>'',escapeAttr,()=>{},()=>{});
  run();
  return nodes['question-wrap'].innerHTML;
}
const story={
  subject:'english',skill:'reading',type:'learning-choice',
  prompt:'What does Mia see?',passage:'Mia sees a red boat by the sea.',
  answer:'A boat',options:['A boat','A car','A cat']
};
test('Direct English Reading shows the actual story before the question',()=>{
  const output=render(story,{type:'subject',subject:'english',module:'reading'});
  const passage=output.indexOf('class="learning-passage ki-reading-story"');
  const question=output.indexOf('class="question ki-reading-question"');
  assert.ok(passage>=0&&question>passage,'Story must appear before the question');
  assert.ok(output.includes(story.passage));
  assert.ok(output.includes(story.prompt));
  assert.ok(output.includes('class="answer"'),'Child must still be able to answer');
});
test('Reading story escapes special characters without changing visible content',()=>{
  const output=render({...story,passage:'Fish & boats <3',prompt:'Which <boat>?'},{type:'subject',subject:'english',module:'reading'});
  assert.ok(output.includes('Fish &amp; boats &lt;3'));
  assert.ok(output.includes('Which &lt;boat&gt;?'));
});
test('Other modules and the older English route preserve their prior question order',()=>{
  const cases=[
    [{...story,skill:'words'},{type:'subject',subject:'english',module:'words'}],
    [story,{type:'journey',subject:'english',module:'reading'}],
    [{...story,subject:'norwegian'},{type:'subject',subject:'norwegian',module:'reading'}]
  ];
  for(const [q,scope] of cases){
    const output=render(q,scope);
    assert.equal(output.includes('ki-reading-story'),false,
      'Only direct English Reading may use the book style');
    const question=output.indexOf('class="question"');
    const passage=output.indexOf('class="learning-passage"');
    assert.ok(question>=0&&passage>question,'Existing question-first order must remain');
  }
});
