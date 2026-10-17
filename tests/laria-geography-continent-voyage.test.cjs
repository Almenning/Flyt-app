'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const geo=require('../laer-litt-mer/geography-continent-voyage-v1.js');
test('private second Geography adventure has 12 tactile compass/passport tasks',()=>{
 assert.equal(geo.validate(),true);
 assert.equal(geo.CHAPTER.published,false);assert.equal(geo.CHAPTER.artApproved,false);
 assert.equal(geo.STAGES.length,5);assert.equal(Object.values(geo.TASKS).flat().length,20);
 assert.equal(Object.values(geo.TASKS).flat().filter(x=>x.kind==='stamp').length,8);
 assert.equal(Object.values(geo.TASKS).flat().filter(x=>x.kind==='compass').length,4);
 assert.equal(geo.previewEnabled('?geography-chapter2-preview=1'),true);
 assert.equal(geo.previewEnabled('?geography-chapter2-preview=0'),false);
 assert.equal(geo.previewEnabled(''),false);
});
test('passport choices cover six relevant inhabited continents and avoid invented country in Antarctica',()=>{
 const stamps=Object.values(geo.TASKS).flat().filter(t=>t.kind==='stamp');
 assert.deepEqual([...new Set(stamps.map(t=>t.answer))].sort(),[...geo.CONTINENTS].sort());
 assert.ok(stamps.every(t=>t.answer!=='Antarktis'));
 assert.ok(stamps.every(t=>t.country.length>=4));
});
test('replay and completing a chapter does not mutate Nordlysleiren status or whole-grade wins',()=>{
 const state={journey:{nodes:{'geography:2:one':{best:2}},gradeWins:{'geography:2':{at:22}}}};
 const before=JSON.stringify(state.journey.nodes),oldWins=JSON.stringify(state.journey.gradeWins);
 for(const place of geo.STAGES){
   let s=geo.start(state,place.id);
   for(let i=0;i<4;i++){
     assert.equal(geo.answer(state,s.task.answer).correct,true);
     const next=geo.advance(state,2222);
     if(i<3){assert.equal(next.finished,false);s=next.session}
     else assert.equal(next.finished,true);
   }
 }
 assert.equal(geo.progress(state).done,5);assert.equal(geo.progress(state).complete,true);
 assert.equal(JSON.stringify(state.journey.nodes),before);
 assert.equal(JSON.stringify(state.journey.gradeWins),oldWins);
 geo.start(state,'kompassholmen');assert.equal(geo.progress(state).done,5);
});
test('an unfinished compass voyage survives a JSON round trip',()=>{
 const state={},s=geo.start(state,'kompassholmen');
 assert.equal(s.step,0);
 const partial=geo.answer(state,s.task.answer);
 assert.equal(partial.correct,true);
 const copy=JSON.parse(JSON.stringify(state));
 const resumed=geo.resume(copy);
 assert.equal(resumed.place.id,'kompassholmen');assert.equal(resumed.step,0);
 assert.equal(resumed.feedback.correct,true);
 geo.advance(copy);
 assert.equal(geo.resume(copy).step,1);
});
test('damaged drafts are discarded but already stamped places remain',()=>{
 const s={};geo.start(s,'passbrygga');
 const rec=geo.ensure(s);rec.places.naturøya={attempts:1,visitedAt:55,best:3};
 rec.draft.order[0]='fake-land';
 assert.equal(geo.resume(s),null);assert.equal(geo.progress(s).done,1);
});
test('wrong directions teach rather than auto-completing the route',()=>{
 const s={},task=geo.start(s,'kompassholmen').task;
 const wrong=geo.DIRECTIONS.find(x=>x!==task.answer);
 const result=geo.answer(s,wrong);
 assert.equal(result.correct,false);
 assert.ok(result.hint.length>=18);
 assert.equal(geo.advance(s).session.correct,0);
});