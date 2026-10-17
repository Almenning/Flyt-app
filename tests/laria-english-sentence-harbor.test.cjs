'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const english=require('../laer-litt-mer/english-sentence-harbor-v1.js');
test('second English journey is gated and its 20 questions are editorially valid',()=>{
 assert.equal(english.validate(),true);
 assert.equal(english.CHAPTER.id,'setningshavna-2');
 assert.equal(english.CHAPTER.published,false);
 assert.equal(english.CHAPTER.artApproved,false);
 assert.equal(Object.values(english.TASKS).flat().length,20);
 assert.equal(english.previewEnabled('?english-chapter2-preview=1'),true);
 assert.equal(english.previewEnabled('?english-chapter2-preview=true'),false);
 assert.ok(english.TASKS.setningsverkstedet.every(t=>t.kind==='sentence'));
});
test('sentence making is tactile, reversible and persisted across reloads',()=>{
 const state={journey:{nodes:{'english:2:words':{best:3}},gradeWins:{'english:2':{at:5}}}};
 english.start(state,'setningsverkstedet');
 let s=english.resume(state);assert.equal(s.task.kind,'sentence');
 const positions=s.task.goal.map(w=>s.task.tiles.indexOf(w));
 english.selectTile(state,positions[0]);
 const resumed=english.resume(JSON.parse(JSON.stringify(state)));
 assert.deepEqual(resumed.selected,[positions[0]]);
 english.selectTile(state,positions[0]);
 assert.deepEqual(english.resume(state).selected,[]);
 for(const idx of positions)english.selectTile(state,idx);
 assert.equal(english.submitSentence(state).correct,true);
 assert.equal(english.advance(state).session.index,1);
 assert.deepEqual(state.journey.gradeWins,{'english:2':{at:5}});
 assert.deepEqual(state.journey.nodes,{'english:2:words':{best:3}});
});
test('wrong word order provides a hint, then lets the child try again',()=>{
 const state={},s=english.start(state,'setningsverkstedet');
 for(let i=0;i<s.task.tiles.length;i++)english.selectTile(state,i);
 const first=english.submitSentence(state);
 assert.equal(first.correct,false);
 english.clearTiles(state);
 const t=english.resume(state).task;
 for(const w of t.goal)english.selectTile(state,t.tiles.indexOf(w));
 assert.equal(english.submitSentence(state).correct,true);
});
test('all five English places allow replay without completing the whole grade',()=>{
 const state={journey:{gradeWins:{}}};
 for(const stage of english.STAGES){
   let s=english.start(state,stage.id);
   for(let i=0;i<4;i++){
     if(s.task.kind==='sentence'){
       for(const w of s.task.goal)english.selectTile(state,s.task.tiles.indexOf(w));
       assert.equal(english.submitSentence(state).correct,true);
     }else assert.equal(english.choose(state,s.task.answer).correct,true);
     const step=english.advance(state,2026);
     if(i<3)s=step.session;
     else assert.equal(step.finished,true);
   }
 }
 assert.equal(english.progress(state).done,5);
 assert.equal(english.progress(state).complete,true);
 assert.equal(state.journey.gradeWins['english:2'],undefined);
 english.start(state,'hilsenkaia');
 assert.equal(english.progress(state).done,5);
});
test('a tampered draft cannot overwrite earned stage history',()=>{
 const state={};
 english.start(state,'hilsenkaia');
 const rec=english.ensure(state);
 rec.places.ordbrygga={visitedAt:2026,attempts:2,best:3};
 rec.draft.order[0]='unknown-task';
 assert.equal(english.resume(state),null);
 assert.equal(english.progress(state).done,1);
});