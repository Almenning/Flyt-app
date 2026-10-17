'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const model=require('../laer-litt-mer/math-pattern-haven-v1.js');
test('Matte chapter 2 is a separate unpublished world with authored play',()=>{
 assert.equal(model.validate(),true);
 assert.equal(model.CHAPTER.published,false);
 assert.equal(model.CHAPTER.artApproved,false);
 assert.equal(model.STAGES.length,5);
 assert.equal(Object.values(model.TASKS).flat().length,20);
 assert.ok(model.TASKS.speildammen.every(task=>task.kind==='mirror'));
 assert.equal(model.previewEnabled('?math-chapter2-preview=1'),true);
 for(const flag of ['','?math-chapter2-preview=0','?chapter2-preview=1','?math-chapter2-preview=true'])
   assert.equal(model.previewEnabled(flag),false);
});
test('new chapter does not rewrite Tallenga progress or gradeWins',()=>{
 const state={journey:{nodes:{'math:2:plassverdi':{best:4}},gradeWins:{'math:2':{at:5}}}};
 const beforeNodes=JSON.stringify(state.journey.nodes),beforeWins=JSON.stringify(state.journey.gradeWins);
 model.start(state,'formstien');
 model.submitChoice(state,model.resume(state).task.answer);
 assert.equal(JSON.stringify(state.journey.nodes),beforeNodes);
 assert.equal(JSON.stringify(state.journey.gradeWins),beforeWins);
 assert.ok(state.journey.chapterProgress[model.KEY]);
});
test('all places can be explored and replayed without unlocking an entire grade',()=>{
 const state={journey:{nodes:{},gradeWins:{}}};
 for(const place of model.STAGES){
   let session=model.start(state,place.id);
   for(let i=0;i<4;i++){
     assert.equal(session.index,i);
     const task=session.task;
     if(task.kind==='mirror'){
       for(const cell of model.targetMirror(task)){
         const [row,col]=cell.split('-').map(Number);model.toggleMirror(state,row,col);
       }
       assert.equal(model.checkMirror(state).correct,true);
       assert.equal(model.checkMirror(state).correct,true);
     }else{
       assert.equal(model.submitChoice(state,task.answer).correct,true);
       assert.equal(model.submitChoice(state,task.answer).correct,true);
     }
     const next=model.advance(state,1234);
     if(i<3){assert.equal(next.finished,false);session=next.session}
     else{assert.equal(next.finished,true);assert.equal(next.correct,4)}
   }
 }
 assert.equal(model.progress(state).done,5);
 assert.equal(model.progress(state).complete,true);
 assert.equal(state.journey.gradeWins['math:2'],undefined);
 model.start(state,'speildammen');
 assert.equal(model.progress(state).done,5,'replays preserve explored places');
});
test('a half-painted mirror survives serialization and can be toggled after reloading',()=>{
 const state={};
 model.start(state,'speildammen');
 model.toggleMirror(state,0,2);model.toggleMirror(state,2,3);
 const reloaded=JSON.parse(JSON.stringify(state));
 assert.deepEqual(model.resume(reloaded).mirror,['0-2','2-3']);
 model.toggleMirror(reloaded,0,2);
 assert.deepEqual(model.resume(reloaded).mirror,['2-3']);
});
test('invalid drafts are discarded without touching completed places',()=>{
 const state={};
 model.start(state,'tallbroen');
 const rec=model.ensure(state);
 rec.places.formstien={visitedAt:200,attempts:2,best:4};
 rec.draft.mirror=['0-0'];
 assert.equal(model.resume(state),null);
 assert.equal(rec.draft,null);
 assert.equal(model.progress(state).done,1);
});
test('incorrect answers teach and do not force success to advance',()=>{
 const state={},current=model.start(state,'formstien');
 const bad=current.task.options.find(a=>a!==current.task.answer);
 const feedback=model.submitChoice(state,bad);
 assert.equal(feedback.correct,false);
 assert.ok(feedback.hint.length>15);
 const next=model.advance(state);
 assert.equal(next.finished,false);
 assert.equal(next.session.correct,0);
});