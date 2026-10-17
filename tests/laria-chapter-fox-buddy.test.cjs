'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const buddy=require('../laer-litt-mer/chapter-fox-buddy-v1.js');
const math=require('../laer-litt-mer/math-pattern-haven-v1.js');
const english=require('../laer-litt-mer/english-sentence-harbor-v1.js');
const geography=require('../laer-litt-mer/geography-continent-voyage-v1.js');
const norwegian=require('../laer-litt-mer/chapter-expansion-v1.js');
const chapters={math,english,geography,norwegian};
test('every place in all four private adventures has a contextual, optional hint',()=>{
 const stages=Object.fromEntries(Object.entries(chapters).map(([k,v])=>[k,v.STAGES.map(s=>s.id)]));
 assert.equal(buddy.validate(stages),true);
 for(const [subject,model] of Object.entries(chapters)){
  const hints=new Set();
  for(const stage of model.STAGES){
   const kind=subject==='math'&&stage.id==='speildammen'?'mirror':'choice';
   const initial=buddy.response({subject,stageId:stage.id,kind});
   const help=buddy.response({subject,stageId:stage.id,kind,expanded:true});
   assert.equal(initial.mood,'ready');assert.equal(initial.showHint,true);
   assert.equal(help.mood,'hint');assert.equal(help.expanded,true);
   assert.notEqual(initial.text,help.text);
   assert.ok(help.text.length>=25);hints.add(help.text);
  }
  assert.equal(hints.size,5,subject+' needs distinct learning guidance per place');
 }
});
test('celebration and retry reactions override tips without forcing a hint',()=>{
 for(const subject of Object.keys(chapters)){
  for(const [correct,mood] of [[true,'celebrate'],[false,'encourage']]){
   const msg=buddy.response({subject,stageId:chapters[subject].STAGES[0].id,kind:'choice',
     feedback:{correct},expanded:true});
   assert.equal(msg.mood,mood);
   assert.equal(msg.showHint,false);
   assert.equal(msg.expanded,false);
   assert.ok(msg.text.length>25);
  }
 }
});
test('a mixed Math mirror gets the symmetry hint, not a general pattern prompt',()=>{
 assert.equal(buddy.hintFor('math','stjernelunden','mirror'),buddy.hintFor('math','speildammen','mirror'));
 assert.throws(()=>buddy.hintFor('music','intro','choice'),/unknown subject/);
});
