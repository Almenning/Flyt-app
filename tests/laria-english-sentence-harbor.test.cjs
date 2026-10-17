'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const english=require('../laer-litt-mer/english-sentence-harbor-v1.js');
test('published English journey has approved art and 40 editorially valid tasks',()=>{
 assert.equal(english.validate(),true);
 assert.equal(english.CHAPTER.id,'setningshavna-2');
 assert.equal(english.CHAPTER.published,true);
 assert.equal(english.CHAPTER.artApproved,true);
 assert.equal(Object.values(english.TASKS).flat().length,40);
 for(const stage of english.STAGES)assert.equal(english.TASKS[stage.id].length,8);
 assert.equal(english.previewEnabled('?english-chapter2-preview=1'),true);
 assert.equal(english.previewEnabled('?english-chapter2-preview=true'),true);
 assert.ok(english.TASKS.setningsverkstedet.every(t=>t.kind==='sentence'));
});
test('English prompts and read-aloud do not reveal a single answer before a try',()=>{
 for(const task of Object.values(english.TASKS).flat()){
   const before=english.visibleEnglish(task);
   const spokenBefore=english.spokenEnglish(task);
   if(task.kind==='sentence'){
     assert.equal(before,'');
     assert.notEqual(spokenBefore,task.english,'ordered phrase cannot be spoken before building');
     for(const tile of task.tiles)assert.ok(spokenBefore.includes(tile),'every word tile must be audible');
     assert.equal(english.spokenEnglish(task,true),task.english);
   }else if(task.kind==='choice'&&task.english===task.answer){
     assert.equal(before,'','answer cannot be displayed as a prompt');
     for(const option of task.options)assert.ok(spokenBefore.includes(option),'all three options must be audible');
     assert.equal(english.visibleEnglish(task,true),task.english);
     assert.equal(english.spokenEnglish(task,true),task.english);
   }else{
     assert.equal(before,task.english,'dialogue stimuli and short stories remain visible');
     assert.equal(spokenBefore,task.english);
   }
 }
});
test('replay gives each English place four new tasks before anything repeats',()=>{
 const state={journey:{nodes:{'english:2:words':{best:2}},gradeWins:{'english:2':{at:99}}}};
 const oldNodes=JSON.stringify(state.journey.nodes),oldWins=JSON.stringify(state.journey.gradeWins);
 for(const stage of english.STAGES){
   const visits=[];
   for(let visit=0;visit<2;visit++){
     let s=english.start(state,stage.id);
     const ids=[...english.ensure(state).draft.order];visits.push(ids);
     assert.equal(ids.length,4);
     assert.ok(ids.every(id=>english.TASKS[stage.id].some(t=>t.id===id)));
     const restored=JSON.parse(JSON.stringify(state));
     assert.equal(english.resume(restored).task.id,ids[0],'four-task draft survives reload');
     for(let step=0;step<4;step++){
       assert.equal(s.task.id,ids[step]);
       if(s.task.kind==='sentence'){
         for(const word of s.task.goal)english.selectTile(state,s.task.tiles.indexOf(word));
         assert.equal(english.submitSentence(state).correct,true);
       }else assert.equal(english.choose(state,s.task.answer).correct,true);
       const next=english.advance(state,2000+visit);
       if(step<3)s=next.session;
       else assert.equal(next.finished,true);
     }
   }
   assert.equal(new Set(visits.flat()).size,8,'second visit must not recycle first four');
   assert.deepEqual(english.ensure(state).draft,null);
   english.start(state,stage.id);
   assert.deepEqual(english.ensure(state).draft.order,visits[0],'third visit cycles to first authored set');
 }
 assert.equal(english.progress(state).done,5,'replaying must not erase an explored place');
 assert.equal(JSON.stringify(state.journey.gradeWins),oldWins);
 assert.equal(JSON.stringify(state.journey.nodes),oldNodes);
});
test('saved first-version four-task draft remains valid after the bank expands',()=>{
 const s={journey:{gradeWins:{'english:2':{at:1234}}}};
 const first=english.start(s,'hilsenkaia');
 assert.equal(first.task.id,'hello');
 const snapshot=JSON.parse(JSON.stringify(s));
 assert.deepEqual(snapshot.journey.chapterProgress[english.KEY].draft.order,['hello','how-are-you','my-name','goodbye']);
 assert.equal(english.resume(snapshot).task.id,'hello');
 assert.deepEqual(snapshot.journey.gradeWins,s.journey.gradeWins);
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