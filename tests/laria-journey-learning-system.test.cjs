'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
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

test('Tallenga grade 2 has five semantic painted place roles',()=>{
  const places=system.chapterFor('math',2).places;
  assert.equal(places.length,5);
  assert.deepEqual(places.map(p=>p.title),['Tallverkstedet','Formfabrikken','Brøklaben','Målebroen','Problemtårnet']);
  assert.match(system.placeRoleFor('math',2,0).adventurePrompt,/sifrene/);
  assert.equal(system.placeRoleFor('math',2,2).freePlay,'fraction-lab');
  assert.match(system.placeRoleFor('math',2,3).adventurePrompt,/pluss, minus/);
  assert.equal(system.contractFor('math',2,'plassverdi').placeIndex,0);
  assert.equal(system.contractFor('math',2,'rekkefolge').placeIndex,1);
  assert.equal(system.contractFor('math',2,'addisjon100').placeIndex,3);
  assert.equal(system.contractFor('math',2,'sub100').placeIndex,3);
  assert.equal(system.contractFor('math',2,'minus100-checkpoint').placeIndex,4);
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


test('the live app loads the systematic layer and uses its mission length',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../laer-litt-mer/index.html'),'utf8');
  const learningScript=html.indexOf('journey-learning-system-v1.js?');
  const journeyRenderer=html.indexOf('journey-world-premium.js?');
  assert.ok(learningScript>0,'systematic learning script is not loaded');
  assert.ok(journeyRenderer>learningScript,'systematic layer must install before journey presentation scripts');
  assert.match(html,/LARIA_JOURNEY_LEARNING_SYSTEM\?\.questionCount\?\.\(node\)/);
});


test('Bokskogen grade 2 has explicit contracts and semantic painted places',()=>{
  const chapter=system.chapterFor('norwegian',2);
  assert.equal(chapter.id,'bokskogen-1');
  assert.deepEqual(chapter.places.map(p=>p.title),
    ['Leselyset','Ordverkstedet','Historiehytta','Setningsbroen','Fortellingstårnet']);
  const expected=[
    'lyder','ordbilder','ordlek','ordstart-challenge','ordstart-review','ordstart-checkpoint',
    'setningsrekkefolge','ordbetydning','setninger-challenge','setninger-review','setninger-checkpoint',
    'detaljer','forsta','tenkvidere','lesedetektiv-challenge','lesedetektiv-review','lesedetektiv-checkpoint'
  ];
  assert.deepEqual(Object.keys(chapter.nodes).sort(),expected.sort());
  assert.equal(system.contractFor('norwegian',2,'lyder').placeIndex,0);
  assert.equal(system.contractFor('norwegian',2,'ordbilder').placeIndex,1);
  assert.equal(system.contractFor('norwegian',2,'setningsrekkefolge').placeIndex,2);
  assert.equal(system.contractFor('norwegian',2,'detaljer').placeIndex,3);
  assert.equal(system.contractFor('norwegian',2,'tenkvidere').placeIndex,4);
  assert.equal(system.questionCount({subject:'norwegian',grade:2,id:'lyder'}),4);
  assert.equal(system.questionCount({subject:'norwegian',grade:2,id:'lesedetektiv-checkpoint'}),5);
});

test('Ordlandsbyen grade 2 has explicit contracts and forward semantic places',()=>{
  const chapter=system.chapterFor('english',2);
  assert.equal(chapter.id,'ordlandsbyen-1');
  assert.deepEqual(chapter.places.map(p=>p.title),
    ['Startplassen','Ordhandelen','Grammatikkhuset','Snakkekaféen','Fortellingsslottet']);
  const expected=[
    'words','numbers','firstwords-challenge','firstwords-review','firstwords-checkpoint',
    'phrases','sentences','talk-challenge','talk-review','talk-checkpoint',
    'reading','read-challenge','read-review','read-checkpoint'
  ];
  assert.deepEqual(Object.keys(chapter.nodes).sort(),expected.sort());
  assert.equal(system.contractFor('english',2,'words').placeIndex,0);
  assert.equal(system.contractFor('english',2,'numbers').placeIndex,1);
  assert.equal(system.contractFor('english',2,'phrases').placeIndex,2);
  assert.equal(system.contractFor('english',2,'sentences').placeIndex,3);
  assert.equal(system.contractFor('english',2,'reading').placeIndex,4);
  assert.equal(system.questionCount({subject:'english',grade:2,id:'words'}),4);
});

test('language selector keeps Bokskogen inside its learning goal and covers both skills',()=>{
  const pool=[
    {subject:'norwegian',skill:'letter-sound',type:'build-word',prompt:'Bygg ordet',answer:'KATT',letters:[{l:'K'},{l:'A'},{l:'T'},{l:'T'}],visual:'🐱'},
    {subject:'norwegian',skill:'letter-sound',type:'build-word',prompt:'Bygg ordet',answer:'SOL',letters:[{l:'S'},{l:'O'},{l:'L'}],visual:'☀️'},
    {subject:'norwegian',skill:'letter-sound',type:'build-word',prompt:'Bygg ordet',answer:'MUS',letters:[{l:'M'},{l:'U'},{l:'S'}],visual:'🐭'},
    {subject:'norwegian',skill:'missing-letter',type:'learning-choice',prompt:'Hvilken bokstav mangler? F _ S K',answer:'I',options:['I','A','O']},
    {subject:'norwegian',skill:'missing-letter',type:'learning-choice',prompt:'Hvilken bokstav mangler? S _ L',answer:'O',options:['O','A','I']},
    {subject:'norwegian',skill:'reading-detail',type:'learning-choice',prompt:'Urelatert lesing',answer:'A',options:['A','B']}
  ];
  const root={subjectPoolForGrade(){return pool},questionOnCooldown(){return false}};
  const node={subject:'norwegian',grade:2,id:'lyder',module:'spelling'};
  const questions=system.buildForNode(root,'norwegian',node,false);
  assert.equal(questions.length,5);
  assert.ok(questions.every(q=>['letter-sound','missing-letter'].includes(q.skill)));
  assert.deepEqual(new Set(questions.map(q=>q.skill)),new Set(['letter-sound','missing-letter']));
  assert.ok(questions.every(q=>q.learning.objectiveId==='norwegian-g2-letter-sound'));
});

test('language selector keeps Ordlandsbyen inside words and spelling',()=>{
  const pool=[
    {subject:'english',skill:'words',type:'learning-choice',prompt:'🐱 What is this?',answer:'cat',options:['cat','dog','sun'],visual:'🐱'},
    {subject:'english',skill:'words',type:'learning-choice',prompt:'What colour is grass?',answer:'green',options:['green','blue','red']},
    {subject:'english',skill:'words',type:'learning-choice',prompt:'🍎 What is this?',answer:'apple',options:['apple','chair','fish'],visual:'🍎'},
    {subject:'english',skill:'spelling',type:'build-word',prompt:'Build the word',answer:'DOG',letters:[{l:'D'},{l:'O'},{l:'G'}],visual:'🐶'},
    {subject:'english',skill:'spelling',type:'learning-choice',prompt:'Choose the correct spelling.',answer:'house',options:['house','hous','housse']},
    {subject:'english',skill:'reading',type:'learning-choice',prompt:'Urelated reading',answer:'A',options:['A','B'],passage:'Text'}
  ];
  const root={subjectPoolForGrade(){return pool},questionOnCooldown(){return false}};
  const node={subject:'english',grade:2,id:'words',module:'words'};
  const questions=system.buildForNode(root,'english',node,false);
  assert.equal(questions.length,5);
  assert.ok(questions.every(q=>['words','spelling'].includes(q.skill)));
  assert.deepEqual(new Set(questions.map(q=>q.skill)),new Set(['words','spelling']));
  assert.ok(questions.every(q=>q.learning.objectiveId==='english-g2-first-words'));
});
