'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const system=require('../laer-litt-mer/geography-journey-learning-system-v1.js');

test('Nordlysleiren grade 2 has explicit semantic place roles',()=>{
  const chapter=system.chapterFor(2);
  assert.equal(chapter.id,'nordlysleiren-1');
  assert.deepEqual(chapter.places.map(p=>p.title),
    ['Basecamp','Kartkroken','Utforskertårnet','Naturstien','Observatoriet']);
  assert.equal(system.contractFor(2,'norden-flag').placeIndex,0);
  assert.equal(system.contractFor(2,'norden-map').placeIndex,1);
  assert.equal(system.contractFor(2,'norden-capital').placeIndex,1);
  assert.equal(system.contractFor(2,'naboer-flag').placeIndex,2);
  const legacy=system.contractFor(2,'naboer-continent');
  assert.equal(legacy.placeIndex,3);
  assert.equal(legacy.geoType,'capital');
  assert.equal(legacy.title,'Hovedsteder');
  assert.deepEqual(legacy.allowedGeoTypes,['capital']);
  assert.equal(system.contractFor(2,'naboer-map').placeIndex,4);
  assert.equal(system.contractFor(2,'naboer-checkpoint').placeIndex,4);
  assert.equal(system.chapterFor(3),null);
});

test('Nordlysleiren systematic selector never leaks other geo types into a skill stop',()=>{
  const root={
    questionTypesForCountry(){return ['flag','capital','map']},
    makeQuestion(id,type){return {k:id,type,prompt:id+' '+type,answer:id+'-'+type}},
    questionOnCooldown(){return false}
  };
  const node={
    id:'norden-capital',grade:2,type:'geo-skill',geoType:'capital',
    ids:['no','se','dk','fi','is'],areaTypes:['flag','capital','map']
  };
  const questions=system.buildForNode(root,node,false);
  assert.equal(questions.length,5);
  assert.ok(questions.every(q=>q.type==='capital'));
  assert.ok(questions.every(q=>q.learning?.objectiveId==='geography-g2-nordic-capitals'));
  assert.equal(new Set(questions.map(q=>q.k)).size,5);
});

test('Nordlysleiren checkpoints deliberately mix approved representations',()=>{
  const root={
    questionTypesForCountry(){return ['flag','capital','map']},
    makeQuestion(id,type){return {k:id,type,prompt:id+' '+type,answer:id+'-'+type}},
    questionOnCooldown(){return false}
  };
  const node={
    id:'norden-checkpoint',grade:2,type:'checkpoint',
    ids:['no','se','dk','fi','is'],areaTypes:['flag','capital','map']
  };
  const questions=system.buildForNode(root,node,false);
  assert.equal(questions.length,5);
  assert.ok(new Set(questions.map(q=>q.type)).size>=3);
  assert.ok(questions.every(q=>['flag','capital','map'].includes(q.type)));
});

test('decorateModel keeps node ids, upgrades neighbour semantics, and only touches grade 2',()=>{
  const norden=[
    {id:'norden-flag',grade:2,type:'geo-skill',geoType:'flag',areaTypes:['flag','capital','map']},
    {id:'norden-map',grade:2,type:'geo-skill',geoType:'map',areaTypes:['flag','capital','map']},
    {id:'norden-checkpoint',grade:2,type:'checkpoint',areaTypes:['flag','capital','map']}
  ];
  const naboer=[
    {id:'naboer-flag',grade:2,type:'geo-skill',geoType:'flag',areaTypes:['flag','continent','map']},
    {id:'naboer-continent',grade:2,type:'geo-skill',geoType:'continent',title:'Verdensdeler',areaTypes:['flag','continent','map']},
    {id:'naboer-map',grade:2,type:'geo-skill',geoType:'map',areaTypes:['flag','continent','map']},
    {id:'naboer-checkpoint',grade:2,type:'checkpoint',areaTypes:['flag','continent','map']}
  ];
  const nodes=[...norden,...naboer];
  const model={subject:'geography',grade:2,areas:[
    {id:'norden',types:['flag','capital','map'],nodes:norden},
    {id:'naboer',types:['flag','continent','map'],nodes:naboer}
  ],nodes};
  const decorated=system.decorateModel(model);
  assert.deepEqual(decorated.nodes.map(n=>n.id),nodes.map(n=>n.id));
  assert.equal(decorated.nodes[0].learning.objectiveId,'geography-g2-nordic-flags');
  assert.equal(decorated.nodes[1].learning.placeIndex,1);
  assert.equal(decorated.nodes[2].learning.kind,'checkpoint');
  assert.equal(decorated.learningPlaces.length,5);

  const neighbourArea=decorated.areas.find(a=>a.id==='naboer');
  assert.deepEqual(neighbourArea.types,['flag','capital','map']);
  assert.ok(neighbourArea.nodes.every(n=>n.areaTypes.includes('capital')&&!n.areaTypes.includes('continent')));
  const legacy=decorated.nodes.find(n=>n.id==='naboer-continent');
  assert.equal(legacy.geoType,'capital');
  assert.equal(legacy.title,'Hovedsteder');
  assert.equal(legacy.learning.objectiveId,'geography-g2-near-europe-capitals');

  assert.equal(model.nodes.find(n=>n.id==='naboer-continent').geoType,'continent');
  assert.deepEqual(model.areas[1].types,['flag','continent','map']);

  const grade3={subject:'geography',grade:3,areas:[{id:'a',nodes:[{id:'x'}]}],nodes:[{id:'x'}]};
  assert.equal(system.decorateModel(grade3),grade3);
});

test('live app loads geography layer after shared journey learning layer',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../laer-litt-mer/index.html'),'utf8');
  const shared=html.indexOf('journey-learning-system-v1.js?');
  const geo=html.indexOf('geography-journey-learning-system-v1.js?');
  const renderer=html.indexOf('locked-journey-renderer.js?');
  assert.ok(shared>0);
  assert.ok(geo>shared,'geography layer must load after shared journey layer');
  assert.ok(renderer>geo,'geography layer must install before locked journey renderer');
});


test('legacy neighbour node is now a pure capital mission without changing its id',()=>{
  const root={
    questionTypesForCountry(){return ['flag','capital','map']},
    makeQuestion(id,type){return {k:id,type,prompt:id+' '+type,answer:id+'-'+type}},
    questionOnCooldown(){return false}
  };
  const node={
    id:'naboer-continent',grade:2,type:'geo-skill',geoType:'capital',
    ids:['no','se','dk','fi','is','gb','de','fr'],areaTypes:['flag','capital','map']
  };
  const questions=system.buildForNode(root,node,false);
  assert.equal(questions.length,5);
  assert.ok(questions.every(q=>q.type==='capital'));
  assert.ok(questions.every(q=>q.learning?.objectiveId==='geography-g2-near-europe-capitals'));
  assert.equal(new Set(questions.map(q=>q.k)).size,5);
});
