'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const system=require('../laer-litt-mer/journey-learning-system-v1.js');

test('Tallenga grade 2 has explicit learning contracts for every journey node',()=>{
  const chapter=system.chapterFor('math',2);
  assert.equal(chapter.id,'tallenga-1');
  const expected=[
    'plassverdi','rekkefolge','tall100-challenge','tall100-review','tall100-checkpoint',
    'addisjon100','pluss100-challenge','pluss100-review','pluss100-checkpoint',
    'sub100','minus100-challenge','minus100-review','minus100-checkpoint'
  ];
  assert.deepEqual(Object.keys(chapter.nodes).sort(),expected.sort());
  for(const id of expected){
    const c=system.contractFor('math',2,id);
    assert.ok(c.learningGoal.length>20,id+' missing learning goal');
    assert.ok(c.allowedSkills.length>=1,id+' missing allowed skills');
    assert.ok(c.difficultyPattern.length>=4,id+' missing difficulty pattern');
  }
});

test('ordinary Tallenga skill missions use four questions, checkpoints five',()=>{
  assert.equal(system.questionCount({subject:'math',grade:2,id:'plassverdi'}),4);
  assert.equal(system.questionCount({subject:'math',grade:2,id:'addisjon100'}),4);
  assert.equal(system.questionCount({subject:'math',grade:2,id:'sub100'}),4);
  assert.equal(system.questionCount({subject:'math',grade:2,id:'tall100-checkpoint'}),5);
  assert.equal(system.questionCount({subject:'math',grade:3,id:'gange'}),null);
});

test('systematic selector never leaks unrelated skills into a Tallenga mission',()=>{
  const root={
    subjectPoolForGrade(){
      return [
        {subject:'math',skill:'addition-100',type:'learning-choice',prompt:'20 + 3 = ?',answer:'23',options:['23','22','24']},
        {subject:'math',skill:'subtraction-100',type:'learning-choice',prompt:'30 - 4 = ?',answer:'26',options:['26','25','24']},
        {subject:'math',skill:'place-value',type:'learning-choice',prompt:'Verdien til 4 i 42?',answer:'40',options:['40','4','2']}
      ];
    },
    questionOnCooldown(){return false}
  };
  const node={subject:'math',grade:2,id:'addisjon100',module:'numbers'};
  const questions=system.buildForNode(root,'math',node,false);
  assert.equal(questions.length,5);
  assert.ok(questions.every(q=>q.skill==='addition-100'));
  assert.ok(questions.every(q=>q.learning?.objectiveId==='math-g2-addition-100'));
  assert.ok(new Set(questions.map(q=>q.prompt+'|'+q.answer)).size===questions.length);
});

test('generated Tallenga variants mix representations inside one fixed objective',()=>{
  const questions=system.generatedForSkill('addition-100','math-g2-addition-100',24);
  assert.ok(questions.length>=20);
  assert.ok(questions.every(q=>q.skill==='addition-100'));
  assert.ok(questions.every(q=>q.learning.objectiveId==='math-g2-addition-100'));
  assert.ok(new Set(questions.map(q=>q.learning.family)).size>=3);
  assert.ok(new Set(questions.map(q=>q.learning.difficulty)).size>=2);
  assert.ok(questions.every(q=>q.options.includes(q.answer)));
});

test('decorateModel adds learning metadata without changing node ids or order',()=>{
  const nodes=[
    {id:'plassverdi',subject:'math',grade:2,type:'skill'},
    {id:'tall100-checkpoint',subject:'math',grade:2,type:'checkpoint'},
    {id:'other',subject:'math',grade:2,type:'skill'}
  ];
  const model={subject:'math',grade:2,areas:[{id:'a',nodes}],nodes};
  const decorated=system.decorateModel(model);
  assert.deepEqual(decorated.nodes.map(n=>n.id),nodes.map(n=>n.id));
  assert.equal(decorated.nodes[0].learning.objectiveId,'math-g2-place-value');
  assert.equal(decorated.nodes[1].learning.kind,'checkpoint');
  assert.equal(decorated.nodes[2].learning,undefined);
  assert.equal(model.nodes[0].learning,undefined,'source model must stay untouched');
});
