'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const geo=require('../laer-litt-mer/geography-continent-voyage-v1.js');
test('private second Geography adventure has 40 authored compass, passport and nature tasks',()=>{
 assert.equal(geo.validate(),true);
 assert.equal(geo.CHAPTER.published,false);assert.equal(geo.CHAPTER.artApproved,false);
 assert.equal(geo.STAGES.length,5);assert.equal(Object.values(geo.TASKS).flat().length,40);
 for(const place of geo.STAGES)assert.equal(geo.TASKS[place.id].length,8);
 assert.equal(Object.values(geo.TASKS).flat().filter(x=>x.kind==='stamp').length,16);
 assert.equal(Object.values(geo.TASKS).flat().filter(x=>x.kind==='compass').length,8);
 assert.equal(geo.previewEnabled('?geography-chapter2-preview=1'),true);
 assert.equal(geo.previewEnabled('?geography-chapter2-preview=0'),false);
 assert.equal(geo.previewEnabled(''),false);
});
test('passport choices cover six relevant inhabited continents and avoid invented country in Antarctica',()=>{
 const stamps=Object.values(geo.TASKS).flat().filter(t=>t.kind==='stamp');
 assert.deepEqual([...new Set(stamps.map(t=>t.answer))].sort(),[...geo.CONTINENTS].sort());
 assert.ok(stamps.every(t=>t.answer!=='Antarktis'));
 assert.ok(geo.TASKS.naturøya.some(t=>t.answer==='Antarktis'),'the uninhabited seventh continent belongs in geography knowledge');
 assert.ok(geo.TASKS.havpassasjen.some(t=>t.answer==='Sørishavet'),'the fifth ocean must be taught');
 assert.ok(stamps.every(t=>t.country.length>=4));
});
test('second voyage in all five places contains genuinely new tasks with safe saved drafts',()=>{
 const state={journey:{nodes:{'geography:2:one':{best:4}},gradeWins:{'geography:2':{at:123}}}};
 const oldWins=JSON.stringify(state.journey.gradeWins),oldNodes=JSON.stringify(state.journey.nodes);
 for(const place of geo.STAGES){
   const sets=[];
   for(let visit=0;visit<2;visit++){
     let session=geo.start(state,place.id);
     const ids=[...geo.ensure(state).draft.order];sets.push(ids);
     assert.equal(ids.length,4);
     assert.ok(geo.TASKS[place.id].every(t=>!ids.includes(t.id)||ids.filter(id=>id===t.id).length===1));
     const restored=JSON.parse(JSON.stringify(state));
     assert.equal(geo.resume(restored).task.id,ids[0]);
     for(let step=0;step<4;step++){
       assert.equal(session.task.id,ids[step]);
       assert.equal(geo.answer(state,session.task.answer).correct,true);
       const next=geo.advance(state,3000+visit);
       if(step<3)session=next.session;
       else assert.equal(next.finished,true);
     }
   }
   assert.equal(new Set(sets.flat()).size,8,'do not just reorder the previous questions');
   geo.start(state,place.id);
   assert.deepEqual(geo.ensure(state).draft.order,sets[0],'third visit cycles deliberately');
 }
 assert.equal(geo.progress(state).done,5);
 assert.equal(JSON.stringify(state.journey.gradeWins),oldWins);
 assert.equal(JSON.stringify(state.journey.nodes),oldNodes);
});
test('four-task geography drafts from first pilot remain compatible',()=>{
 const state={journey:{gradeWins:{'geography:2':{at:42}}}};
 geo.start(state,'passbrygga');
 const saved=JSON.parse(JSON.stringify(state));
 assert.deepEqual(geo.ensure(saved).draft.order,['stamp-norway','stamp-japan','stamp-kenya','stamp-brazil']);
 assert.equal(geo.resume(saved).task.id,'stamp-norway');
 assert.deepEqual(saved.journey.gradeWins,state.journey.gradeWins);
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